import { Timestamp } from 'firebase/firestore';

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface DailyGameClues {
  technical: string;
  contextual: string;
  historical: string;
}

export interface DailyGameSummary {
  definition: string;
  importance: string;
  examples: string[];
}

export interface DailyGame {
  word: string;
  difficulty: Difficulty;
  clues: DailyGameClues;
  summary: DailyGameSummary;
  targetDate: Timestamp;
  createdAt: Timestamp;
}

export interface GenerationResult {
  success: boolean;
  error?: string;
  data?: DailyGame;
} 