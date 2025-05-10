import type { FC } from 'react';
import { cn } from '@/lib/utils';
import type { TileStatus } from '@/lib/types';

interface GameTileProps {
  char?: string;
  status?: TileStatus;
  isRevealing?: boolean;
  isCurrentRow?: boolean;
  isSubmitted?: boolean; 
}

const GameTile: FC<GameTileProps> = ({ char, status = 'empty', isRevealing, isCurrentRow, isSubmitted }) => {
  const tileStyles = {
    empty: 'border-border bg-background text-foreground', // Updated to use standard Tailwind classes
    tbd: 'border-primary bg-background text-primary', // For currently typed letters
    correct: 'bg-tile-correct-background text-tile-correct-foreground border-tile-correct-background',
    present: 'bg-tile-present-background text-tile-present-foreground border-tile-present-background',
    absent: 'bg-tile-absent-background text-tile-absent-foreground border-tile-absent-background',
  };

  const appliedStatus = isCurrentRow && !isSubmitted && char ? 'tbd' : status;

  return (
    <div
      className={cn(
        'flex items-center justify-center h-14 w-14 sm:h-16 sm:w-16 border-2 text-2xl sm:text-3xl font-bold uppercase rounded transition-all duration-300 ease-in-out',
        tileStyles[appliedStatus],
        { 'animate-flip': isRevealing && isSubmitted }
      )}
      style={{ animationDelay: isRevealing ? `${Math.random() * 0.3}s` : '0s' }} // Stagger flip animation
    >
      {char}
    </div>
  );
};

export default GameTile;
