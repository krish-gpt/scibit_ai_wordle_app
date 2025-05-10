'use server';
/**
 * @fileOverview Generates a daily AI-related word based on difficulty.
 *
 * - generateDailyWord - A function that generates the daily word.
 * - GenerateDailyWordInput - The input type for the generateDailyWord function.
 * - GenerateDailyWordOutput - The return type for the generateDailyWord function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateDailyWordInputSchema = z.object({
  difficulty: z
    .enum(['easy', 'medium', 'hard'])
    .describe('The difficulty level for the word generation.'),
});
export type GenerateDailyWordInput = z.infer<typeof GenerateDailyWordInputSchema>;

const GenerateDailyWordOutputSchema = z.object({
  word: z.string().describe('The AI-related word for the day.'),
});
export type GenerateDailyWordOutput = z.infer<typeof GenerateDailyWordOutputSchema>;

export async function generateDailyWord(input: GenerateDailyWordInput): Promise<GenerateDailyWordOutput> {
  return generateDailyWordFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateDailyWordPrompt',
  input: {schema: GenerateDailyWordInputSchema},
  output: {schema: GenerateDailyWordOutputSchema},
  prompt: `You are an AI term expert who suggests a word of the day.

Suggest an AI-related word based on the difficulty level: {{{difficulty}}}.
The word must be a single word, consisting of only alphabetic characters, and be between 4 and 8 characters long.
Return only the word. Do not include any punctuation, spaces, or other text in the output.`,
});

const generateDailyWordFlow = ai.defineFlow(
  {
    name: 'generateDailyWordFlow',
    inputSchema: GenerateDailyWordInputSchema,
    outputSchema: GenerateDailyWordOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    // Additional validation or cleaning can be done here if necessary
    if (output && output.word) {
      // Trim and ensure it's a single word, convert to uppercase
      let cleanedWord = output.word.trim().split(' ')[0].toUpperCase();
      // Remove non-alphabetic characters
      cleanedWord = cleanedWord.replace(/[^A-Z]/g, '');
      
      // Check length again after cleaning, though the prompt should handle it
      if (cleanedWord.length >= 3 && cleanedWord.length <= 10) {
         return { word: cleanedWord };
      } else {
        // Fallback or error if cleaning results in invalid length, though unlikely if prompt is followed
        console.warn(`Cleaned word "${cleanedWord}" from AI output "${output.word}" still has invalid length. Prompt may need adjustment or AI is not conforming.`);
        // Forcing a retry by returning an empty or invalid word, or throwing.
        // To ensure the flow completes but signals an issue, we could return a known invalid word
        // or rely on client-side to catch this (which it does).
        // For now, return the cleaned word and let client validate.
        return { word: cleanedWord }; 
      }
    }
    // If AI output is not as expected (e.g., null or empty)
    return { word: '' }; // This will be caught by client-side validation
  }
);

