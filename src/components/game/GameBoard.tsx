import type { FC } from 'react';
import GameTile from './GameTile';
import type { GuessFeedback, TileStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

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
    <div
      className={cn(
        'w-full max-w-xs sm:max-w-md md:max-w-lg aspect-[5/6] flex flex-col justify-center items-center min-h-0',
        isShaking && 'animate-shake'
      )}
    >
      <div
        className={cn(
          'grid w-full h-full min-h-0',
        )}
        style={{
          gridTemplateRows: `repeat(${maxGuesses}, 1fr)`,
          gridTemplateColumns: `repeat(${wordLength}, 1fr)`
        }}
      >
        {rows.map((_, rowIndex) => {
          const guessFeedback = guesses[rowIndex];
          const isCurrentRow = rowIndex === currentRowIndex;
          return Array.from({ length: wordLength }).map((_, charIndex) => {
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
              <div key={rowIndex + '-' + charIndex} className="flex items-center justify-center w-full h-full p-0.5">
                <GameTile
                  char={char}
                  status={status}
                  isRevealing={!!guessFeedback?.isSubmitted}
                  isCurrentRow={isCurrentRow}
                  isSubmitted={!!guessFeedback?.isSubmitted}
                  index={charIndex}
                />
              </div>
            );
          });
        })}
      </div>
    </div>
  );
};

export default GameBoard;
