import type { FC } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { KeyStatus, TileStatus } from '@/lib/types';
import { Send, Delete } from 'lucide-react';

interface KeyboardProps {
  onChar: (char: string) => void;
  onDelete: () => void;
  onEnter: () => void;
  keyStatuses: KeyStatus;
  disabled?: boolean;
}

const Keyboard: FC<KeyboardProps> = ({ onChar, onDelete, onEnter, keyStatuses, disabled }) => {
  const rows = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'DELETE'],
  ];

  const getStatusClass = (status: TileStatus | undefined) => {
    if (!status || status === 'empty' || status === 'tbd') return 'bg-secondary hover:bg-muted';
    if (status === 'correct') return 'bg-tile-correct-background text-tile-correct-foreground hover:opacity-90';
    if (status === 'present') return 'bg-tile-present-background text-tile-present-foreground hover:opacity-90';
    if (status === 'absent') return 'bg-tile-absent-background text-tile-absent-foreground hover:opacity-90';
    return 'bg-secondary hover:bg-muted';
  };

  return (
    <div className="flex flex-col gap-1.5 sm:gap-2 p-2 bg-card rounded-md shadow-md w-full max-w-lg">
      {rows.map((row, rowIndex) => (
        <div key={rowIndex} className="flex justify-center gap-1 sm:gap-1.5">
          {row.map((key) => {
            const keyStatus = keyStatuses[key.toUpperCase()];
            const buttonClass = getStatusClass(keyStatus);

            if (key === 'ENTER') {
              return (
                <Button
                  key={key}
                  onClick={onEnter}
                  disabled={disabled}
                  className={cn("h-12 sm:h-14 flex-grow-[1.5] px-2 sm:px-3 text-xs sm:text-sm font-semibold uppercase", buttonClass)}
                  aria-label="Submit guess"
                >
                  <Send className="h-5 w-5 sm:h-6 sm:w-6 mr-1 sm:mr-2" /> Enter
                </Button>
              );
            }
            if (key === 'DELETE') {
              return (
                <Button
                  key={key}
                  onClick={onDelete}
                  disabled={disabled}
                  className={cn("h-12 sm:h-14 flex-grow-[1.5] px-2 sm:px-3 text-xs sm:text-sm font-semibold uppercase", buttonClass)}
                  aria-label="Delete last character"
                >
                   <Delete className="h-5 w-5 sm:h-6 sm:w-6 mr-1 sm:mr-2" /> Back
                </Button>
              );
            }
            return (
              <Button
                key={key}
                onClick={() => onChar(key)}
                disabled={disabled}
                className={cn("h-12 sm:h-14 w-8 sm:w-10 flex-grow text-sm sm:text-base font-semibold uppercase", buttonClass)}
              >
                {key}
              </Button>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default Keyboard;
