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
    if (!status || status === 'empty' || status === 'tbd') return 'bg-secondary hover:bg-muted text-secondary-foreground'; // Ensure text color for default
    if (status === 'correct') return 'bg-tile-correct-background text-tile-correct-foreground hover:opacity-90';
    if (status === 'present') return 'bg-tile-present-background text-tile-present-foreground hover:opacity-90';
    if (status === 'absent') return 'bg-tile-absent-background text-tile-absent-foreground hover:opacity-90';
    return 'bg-secondary hover:bg-muted text-secondary-foreground'; // Default with text color
  };

  return (
    <div className=" flex flex-col gap-1.5 sm:gap-1.5 p-1 sm:p-2 bg-card w-full mx-auto">
      {rows.map((row, rowIndex) => (
        <div key={rowIndex} className="flex justify-center gap-0.5 sm:gap-1.5">
          {row.map((key) => {
            const keyStatus = keyStatuses[key.toUpperCase()];
            const buttonClass = key === 'ENTER' ? getStatusClass('correct') : getStatusClass(keyStatus);

            if (key === 'ENTER') {
              return (
                <Button
                  key={key}
                  onClick={onEnter}
                  disabled={disabled}
                  className={cn("h-14 sm:h-14 flex-grow-[1.2] px-0.5 sm:px-3 text-[14px] sm:text-sm font-bold bg-tile-correct-background uppercase", buttonClass)}
                  aria-label="Submit guess"
                >
                  <Send className="h-3 w-3 sm:h-6 sm:w-6 mr-0.5 sm:mr-2 " /> 
                  {/* Enter */}
                </Button>
              );
            }
            if (key === 'DELETE') {
              return (
                <Button
                  key={key}
                  onClick={onDelete}
                  disabled={disabled}
                  className={cn("h-14 sm:h-14 flex-grow-[1.2] px-0.5 sm:px-3 text-[14px] sm:text-sm font-bold uppercase", buttonClass)}
                  aria-label="Delete last character"
                >
                   <Delete className="h-3 w-3 sm:h-6 sm:w-6 mr-0.5 sm:mr-2" /> 
                   {/* Back */}
                </Button>
              );
            }
            return (
              <Button
                key={key}
                onClick={() => onChar(key)}
                disabled={disabled}
                className={cn("h-14 sm:h-14 w-6 sm:w-10 flex-grow text-[14px] sm:text-base font-bold uppercase", buttonClass)}
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

