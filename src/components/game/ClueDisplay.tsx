import type { FC } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb, Loader2 } from 'lucide-react';

interface ClueDisplayProps {
  clue: string | null;
  isLoading: boolean;
}

const ClueDisplay: FC<ClueDisplayProps> = ({ clue, isLoading }) => {
  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center text-xl">
          <Lightbulb className="h-6 w-6 mr-2 text-primary" />
          Clue
        </CardTitle>
      </CardHeader>
      <CardContent className="min-h-[60px]"> {/* Added min-height to prevent layout shift */}
        {isLoading && !clue && (
          <div className="flex items-center justify-center p-3 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            <span>Loading clue...</span>
          </div>
        )}
        {clue && !isLoading && ( // Display clue only when not loading and clue is available
          <p className="text-muted-foreground italic p-3 bg-secondary rounded-md">{clue}</p>
        )}
        {clue && isLoading && ( // If clue is already there but we are somehow in loading state (e.g. refresh attempt)
             <p className="text-muted-foreground italic p-3 bg-secondary rounded-md">{clue}</p>
        )}
        {!isLoading && !clue && (
          <p className="text-muted-foreground italic p-3 text-center">The clue for the word will appear here.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default ClueDisplay;
