import type { FC } from 'react';
import { Lightbulb, Loader2 } from 'lucide-react';

interface ClueDisplayProps {
  clue: string | null;
  isLoading: boolean;
}

const ClueDisplay: FC<ClueDisplayProps> = ({ clue, isLoading }) => {
  return (
    <div className="w-full max-w-md border bg-secondary rounded-md flex items-start gap-2 px-3 py-2 shadow-sm min-h-[40px]">
      <Lightbulb className="h-5 w-5 mt-0.5 text-primary shrink-0" />
      <div className="flex-1">
        {isLoading && !clue && (
          <div className="flex items-center text-muted-foreground text-sm">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            <span>Loading clue...</span>
          </div>
        )}
        {clue && (
          <p className="text-muted-foreground italic text-sm leading-tight">{clue}</p>
        )}
        {!isLoading && !clue && (
          <p className="text-muted-foreground italic text-sm text-center">The clue for the word will appear here.</p>
        )}
      </div>
    </div>
  );
};

export default ClueDisplay;
