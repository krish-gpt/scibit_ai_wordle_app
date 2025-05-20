import { FALLBACK_WORDS, FALLBACK_CONTENT } from '../constants/fallback-words';
import { Difficulty, DailyGameClues, DailyGameSummary } from '../firebase/types';

export function getFallbackWord(difficulty: Difficulty, date: string): string {
  const words = FALLBACK_WORDS[difficulty];
  // Use the date to deterministically select a word
  const dateNum = parseInt(date.replace(/-/g, ''));
  const index = dateNum % words.length;
  return words[index];
}

export function getFallbackContent(word: string): {
  clues: DailyGameClues;
  summary: DailyGameSummary;
} | null {
  const content = FALLBACK_CONTENT[word];
  if (!content) {
    // If no predefined content, generate generic content
    return {
      clues: {
        technical: `Technical concept in AI/ML: ${word}`,
        contextual: `Used in machine learning applications`,
        historical: `Important development in AI history`
      },
      summary: {
        definition: `${word} is an AI/ML concept`,
        importance: `Essential for modern machine learning systems`,
        examples: [`Used in various AI applications`]
      }
    };
  }
  return content;
} 