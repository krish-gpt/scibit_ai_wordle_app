'use server';

import { getAI } from '@/ai/genkit';
import { z } from 'genkit';
import { DailyGame, DailyGameClues, DailyGameSummary, Difficulty } from '@/lib/firebase/types';
import { storeDailyGame, getDailyGame } from '@/lib/firebase/dailyGame';
import { getFallbackWord, getFallbackContent } from '@/lib/utils/fallback';
import { Timestamp } from 'firebase/firestore';

const GenerateDailyGameInputSchema = z.object({
  difficulty: z
    .enum(['easy', 'medium', 'hard'])
    .describe('The difficulty level for the word generation.'),
  date: z.string().describe('The target date for the game in YYYY-MM-DD format'),
});

// Document structure matching test
interface TimestampObject {
  seconds: number;
  nanoseconds: number;
}

interface DailyGameDocument {
  word: string;
  difficulty: Difficulty;
  clue: string;
  summary: string;
  createdAt: TimestampObject;
  targetDate: TimestampObject;
}

const CluesSchema = z.object({
  technical: z.string().max(100),
  contextual: z.string().max(100),
  historical: z.string().max(100),
});

const SummarySchema = z.object({
  definition: z.string().max(200),
  importance: z.string().max(200),
  examples: z.array(z.string()).min(1).max(3),
});

export type GenerateDailyGameInput = z.infer<typeof GenerateDailyGameInputSchema>;

async function generateWord(difficulty: Difficulty, date: string): Promise<string> {
  const ai = await getAI();
  const prompt = `Generate a single ${difficulty} AI-related term for a Wordle-like game. 
    The word should be between 4-8 letters and be commonly used in AI/ML discussions.
    Return only the word in uppercase, nothing else.
    Examples: BIAS, EPOCH, NEURAL, TENSOR`;
  
  const response = await ai.generate(prompt);
  const word = response.text.trim().toUpperCase();
  
  // Validate word length and format
  if (!/^[A-Z]{4,8}$/.test(word)) {
    throw new Error(`Invalid word generated: ${word}. Must be 4-8 uppercase letters.`);
  }
  
  return word;
}

async function generateClues(word: string): Promise<string> {
  const ai = await getAI();
  const prompt = `You are an AI expert. Generate a concise clue for the AI term "${word}".
    The clue should be:
    - Short (1-2 sentences)
    - Helpful for guessing but not too obvious
    - Focus on meaning/usage without directly stating the word
    - Under 100 characters
    
    Return just the clue text.`;
  
  const response = await ai.generate(prompt);
  return response.text.trim();
}

async function generateSummary(word: string): Promise<string> {
  const ai = await getAI();
  const prompt = `You are an AI expert. For the AI/ML term "${word}", generate a concise summary that:
    1. Explains what it is
    2. Why it's important in AI/ML
    3. How it's used
    
    Keep it under 200 characters total.
    Return just the summary text.`;
  
  const response = await ai.generate(prompt);
  return response.text.trim();
}

export async function generateDailyGame(
  input: GenerateDailyGameInput,
): Promise<DailyGameDocument | null> {
  try {
    // Use the date format as-is since Firestore expects YYYY-MM-DD
    const firestoreDate = input.date;
    console.log(`Using date format: ${firestoreDate}`);

    // Helper function to convert Timestamp to plain object
    const convertTimestampToPlainObject = (timestamp: Timestamp) => ({
      seconds: timestamp.seconds,
      nanoseconds: timestamp.nanoseconds
    });

    // 1. First try to get complete game from Firebase
    try {
      const existingGame = await getDailyGame(firestoreDate);
      if (existingGame) {
        console.log(`Found existing game in Firebase for date ${firestoreDate}`);
        // Convert Timestamp objects to plain objects
        return {
          ...existingGame,
          createdAt: convertTimestampToPlainObject(existingGame.createdAt),
          targetDate: convertTimestampToPlainObject(existingGame.targetDate)
        } as unknown as DailyGameDocument;
      }
    } catch (dbError) {
      console.warn(`Firebase access failed for date ${firestoreDate}:`, dbError);
      // Continue with generation if Firebase fails
    }

    // 2. Generate all components using AI
    try {
      console.log(`Generating new game content for date ${firestoreDate}`);
      
      // Generate all components - pass firestoreDate to ensure consistency
      const word = await generateWord(input.difficulty, firestoreDate);
      const clue = await generateClues(word);
      const summary = await generateSummary(word);

      const now = Timestamp.now();
      const targetDate = Timestamp.fromDate(new Date(firestoreDate));

      const gameData: DailyGameDocument = {
        word,
        difficulty: input.difficulty,
        clue,
        summary,
        createdAt: convertTimestampToPlainObject(now),
        targetDate: convertTimestampToPlainObject(targetDate)
      };

      // Store complete AI-generated game with actual Timestamp objects
      try {
        const result = await storeDailyGame(firestoreDate, {
          ...gameData,
          createdAt: now,
          targetDate
        } as unknown as DailyGame);
        console.log(`Stored AI-generated game in Firebase for date ${firestoreDate}`);
        return gameData;
      } catch (storeError) {
        console.warn(`Failed to store AI-generated game in Firebase for date ${firestoreDate}:`, storeError);
        return gameData;
      }
    } catch (aiError: any) {
      console.warn(`AI generation failed for date ${firestoreDate}, using fallback content:`, aiError);
      
      // 3. Use fallback as last resort
      const fallbackWord = getFallbackWord(input.difficulty, firestoreDate);
      const fallbackContent = getFallbackContent(fallbackWord);
      
      if (!fallbackContent) {
        throw new Error('No fallback content available');
      }

      const now = Timestamp.now();
      const targetDate = Timestamp.fromDate(new Date(firestoreDate));

      const fallbackGameData: DailyGameDocument = {
        word: fallbackWord,
        difficulty: input.difficulty,
        clue: 'Fallback clue for ' + fallbackWord,
        summary: 'Fallback summary for ' + fallbackWord,
        createdAt: convertTimestampToPlainObject(now),
        targetDate: convertTimestampToPlainObject(targetDate)
      };

      // Try to store fallback content with actual Timestamp objects
      try {
        const result = await storeDailyGame(firestoreDate, {
          ...fallbackGameData,
          createdAt: now,
          targetDate
        } as unknown as DailyGame);
        console.log(`Stored fallback game in Firebase for date ${firestoreDate}`);
        return fallbackGameData;
      } catch (storeError) {
        console.warn(`Failed to store fallback game in Firebase for date ${firestoreDate}:`, storeError);
        return fallbackGameData;
      }
    }
  } catch (error: any) {
    console.error('Fatal error in game generation:', error);
    throw new Error(`Failed to generate daily game: ${error?.message || 'Unknown error'}`);
  }
} 