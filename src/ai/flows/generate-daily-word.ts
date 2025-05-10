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

  Suggest an AI-related word based on the difficulty level: {{{difficulty}}}. Return the word. The word must be a single word. Do not include any other text in the output.`,
});

const generateDailyWordFlow = ai.defineFlow(
  {
    name: 'generateDailyWordFlow',
    inputSchema: GenerateDailyWordInputSchema,
    outputSchema: GenerateDailyWordOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
