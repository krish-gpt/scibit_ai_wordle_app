'use server';

/**
 * @fileOverview Generates a summary of the AI term of the day for the player.
 *
 * - generateTermSummary - A function that generates the term summary.
 * - GenerateTermSummaryInput - The input type for the generateTermSummary function.
 * - GenerateTermSummaryOutput - The return type for the generateTermSummary function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateTermSummaryInputSchema = z.object({
  term: z.string().describe('The AI term of the day.'),
});
export type GenerateTermSummaryInput = z.infer<typeof GenerateTermSummaryInputSchema>;

const GenerateTermSummaryOutputSchema = z.object({
  summary: z.string().describe('A summary of the AI term and its meaning.'),
  progress: z.string().describe('Progress of the flow.'),
});
export type GenerateTermSummaryOutput = z.infer<typeof GenerateTermSummaryOutputSchema>;

export async function generateTermSummary(input: GenerateTermSummaryInput): Promise<GenerateTermSummaryOutput> {
  return generateTermSummaryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateTermSummaryPrompt',
  input: {schema: GenerateTermSummaryInputSchema},
  output: {schema: GenerateTermSummaryOutputSchema},
  prompt: `You are an AI expert. Please provide a concise summary of the following AI term, explaining its meaning and significance:\n\nTerm: {{{term}}}`,
});

const generateTermSummaryFlow = ai.defineFlow(
  {
    name: 'generateTermSummaryFlow',
    inputSchema: GenerateTermSummaryInputSchema,
    outputSchema: GenerateTermSummaryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return {
      ...output!,
      progress: 'Generated a summary of the AI term.',
    };
  }
);
