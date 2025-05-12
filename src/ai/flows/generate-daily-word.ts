'use server';
/**
 * @fileOverview Generates a daily AI-related word based on difficulty.
 *
 * - generateDailyWord - A function that generates the daily word.
 * - GenerateDailyWordInput - The input type for the generateDailyWord function.
 * - GenerateDailyWordOutput - The return type for the generateDailyWord function.
 */

import {getAI} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateDailyWordInputSchema = z.object({
  difficulty: z
    .enum(['easy', 'medium', 'hard'])
    .describe('The difficulty level for the word generation.'),
});

export type GenerateDailyWordInput = z.infer<typeof GenerateDailyWordInputSchema>;
export type GenerateDailyWordOutput = {
  word: string;
};

export async function generateDailyWord(
  input: GenerateDailyWordInput,
): Promise<GenerateDailyWordOutput> {
  const ai = await getAI();
  const prompt = `Generate a single ${input.difficulty} AI-related term for a Wordle-like game. 
    The word should be between 4-8 letters and be commonly used in AI/ML discussions.
    Return only the word in uppercase, nothing else.
    Examples: BIAS, EPOCH, NEURAL, TENSOR`;
  
  const response = await ai.generate(prompt);
  return {
    word: response.text.trim().toUpperCase()
  };
}

