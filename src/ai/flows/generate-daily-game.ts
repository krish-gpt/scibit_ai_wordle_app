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
  try {
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
  } catch (error) {
    console.warn('Failed to generate word, using fallback:', error);
    return getFallbackWord(difficulty, date);
  }
}

async function generateClues(word: string, maxRetries = 3): Promise<DailyGameClues> {
  try {
    const ai = await getAI();
    // Enhanced prompt combining both styles
    const prompt = `You are an AI expert. Generate three different types of clues for the AI term "${word}":
      1. Technical: A technical description of the concept (like "These biological-inspired connections form the foundation of deep learning")
      2. Contextual: How it's used in practice (like "In training, this represents one complete pass through the entire dataset")
      3. Historical: Its historical context or development (like "This statistical tendency was first recognized as a major challenge in the 1950s")
      
      Each clue should be:
      - Short (1-2 sentences)
      - Helpful for guessing but not too obvious
      - Focus on meaning/usage without directly stating the word
      - Under 100 characters
      
      Format the response as JSON with keys: technical, contextual, historical`;
    
    let lastError: Error | null = null;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await ai.generate(prompt);
        const parsed = JSON.parse(response.text);
        const validated = CluesSchema.parse(parsed);
        console.log('Generated clues successfully');
        return validated;
      } catch (error) {
        lastError = error as Error;
        console.warn(`Attempt ${i + 1} failed to generate valid clues:`, error);
        continue;
      }
    }
    
    throw lastError;
  } catch (error) {
    console.warn('Failed to generate clues, using fallback:', error);
    return getFallbackContent(word)?.clues || {
      technical: `Technical concept in AI/ML: ${word}`,
      contextual: `Used in machine learning applications`,
      historical: `Important development in AI history`
    };
  }
}

async function generateSummary(word: string, maxRetries = 3): Promise<DailyGameSummary> {
  try {
    const ai = await getAI();
    // Enhanced prompt with expert context
    const prompt = `You are an AI expert. For the AI/ML term "${word}", generate a comprehensive but concise summary with:
      1. A clear definition that an AI practitioner would understand
      2. Why it's important in modern AI/ML development
      3. 2-3 concrete real-world examples of its application
      
      Keep the explanation technical but accessible.
      Format the response as JSON with keys: definition, importance, examples (array)
      Keep each field concise but informative.`;
    
    let lastError: Error | null = null;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await ai.generate(prompt);
        const parsed = JSON.parse(response.text);
        const validated = SummarySchema.parse(parsed);
        console.log('Generated summary successfully');
        return validated;
      } catch (error) {
        lastError = error as Error;
        console.warn(`Attempt ${i + 1} failed to generate valid summary:`, error);
        continue;
      }
    }
    
    throw lastError;
  } catch (error) {
    console.warn('Failed to generate summary, using fallback:', error);
    return getFallbackContent(word)?.summary || {
      definition: `${word} is an AI/ML concept`,
      importance: `Essential for modern machine learning systems`,
      examples: [`Used in various AI applications`]
    };
  }
}

export async function generateDailyGame(
  input: GenerateDailyGameInput,
): Promise<DailyGame | null> {
  try {
    // Try to get from Firebase first
    try {
      const existingGame = await getDailyGame(input.date);
      if (existingGame) {
        return existingGame;
      }
    } catch (dbError) {
      console.warn('Firebase access failed, falling back to direct generation:', dbError);
      // Continue with generation if Firebase fails
    }

    console.log('Generating new game content...');

    // Generate new game content
    const word = await generateWord(input.difficulty, input.date);
    console.log('Generated word:', word);
    
    const clues = await generateClues(word);
    console.log('Generated clues successfully');
    
    const summary = await generateSummary(word);
    console.log('Generated summary successfully');

    // Try to store in Firebase, but don't fail if it doesn't work
    try {
      const result = await storeDailyGame(input.date, {
        word,
        difficulty: input.difficulty,
        clues,
        summary
      });
      console.log('Stored game in Firebase successfully');
      return result.data || null;
    } catch (storeError) {
      console.warn('Failed to store in Firebase, returning generated content:', storeError);
      // Return the generated content even if storage fails
      return {
        word,
        difficulty: input.difficulty,
        clues,
        summary,
        targetDate: Timestamp.fromDate(new Date(input.date)),
        createdAt: Timestamp.now()
      };
    }
  } catch (error: any) {
    console.error('Error generating daily game:', error);
    
    // Ultimate fallback: Use predefined content
    const fallbackWord = getFallbackWord(input.difficulty, input.date);
    const fallbackContent = getFallbackContent(fallbackWord);
    
    if (fallbackContent) {
      console.log('Using fallback content for word:', fallbackWord);
      try {
        const result = await storeDailyGame(input.date, {
          word: fallbackWord,
          difficulty: input.difficulty,
          ...fallbackContent
        });
        return result.data || null;
      } catch (storeError) {
        console.warn('Failed to store fallback in Firebase, returning fallback content:', storeError);
        // Return the fallback content even if storage fails
        return {
          word: fallbackWord,
          difficulty: input.difficulty,
          ...fallbackContent,
          targetDate: Timestamp.fromDate(new Date(input.date)),
          createdAt: Timestamp.now()
        };
      }
    }
    
    throw new Error(`Failed to generate daily game: ${error?.message || 'Unknown error'}`);
  }
} 