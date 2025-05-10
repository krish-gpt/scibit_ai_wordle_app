export type TileStatus = 'correct' | 'present' | 'absent' | 'empty' | 'tbd';

export interface LetterFeedback {
  char: string;
  status: TileStatus;
}

export interface GuessFeedback {
  letters: LetterFeedback[];
  isSubmitted: boolean; // To trigger animation only once
}

export interface KeyStatus {
  [key: string]: TileStatus;
}
