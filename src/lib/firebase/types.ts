import { Timestamp } from 'firebase/firestore';

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface TimestampObject {
  seconds: number;
  nanoseconds: number;
}

export type TimestampType = Timestamp | TimestampObject;

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
  clue: string;
  summary: string;
  targetDate: TimestampType;
  createdAt: TimestampType;
}

export interface GenerationResult {
  success: boolean;
  error?: string;
  data?: DailyGame;
} 