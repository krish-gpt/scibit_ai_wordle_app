import type { FC } from 'react';
import GameTile from './GameTile';
import type { GuessFeedback, TileStatus } from '@/lib/types';
import { cn } from '@/lib/utils'; // Added import for cn

interface GameBoardProps {
  guesses: GuessFeedback[];
  currentGuess: string;
  wordLength: number;
  maxGuesses: number;
  currentRowIndex: number;
  isShaking: boolean;
}

const GameBoard: FC<GameBoardProps> = ({ guesses, currentGuess, wordLength, maxGuesses, currentRowIndex, isShaking }) => {
  const rows = Array.from({ length: maxGuesses });

  return (
    <div className={cn("grid gap-1.5 p-2.5 rounded-md shadow-md bg-card", isShaking && "animate-shake")}>
      {rows.map((_, rowIndex) => {
        const guessFeedback = guesses[rowIndex];
        const isCurrentRow = rowIndex === currentRowIndex;
        
        return (
          <div key={rowIndex} className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${wordLength}, minmax(0, 1fr))` }}>
            {Array.from({ length: wordLength }).map((_, charIndex) => {
              let char: string | undefined = undefined;
              let status: TileStatus = 'empty';

              if (guessFeedback) {
                char = guessFeedback.letters[charIndex]?.char;
                status = guessFeedback.letters[charIndex]?.status || 'empty';
              } else if (isCurrentRow) {
                char = currentGuess[charIndex];
                status = char ? 'tbd' : 'empty';
              }
              
              return (
                <GameTile
                  key={charIndex}
                  char={char}
                  status={status}
                  isRevealing={!!guessFeedback?.isSubmitted}
                  isCurrentRow={isCurrentRow}
                  isSubmitted={!!guessFeedback?.isSubmitted}
                  index={charIndex}
                />
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

export default GameBoard;
