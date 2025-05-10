import type { FC } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb, Loader2 } from 'lucide-react';

interface ClueDisplayProps {
  clue: string | null;
  onGetClue: () => void;
  isLoading: boolean;
  disabled?: boolean;
}

const ClueDisplay: FC<ClueDisplayProps> = ({ clue, onGetClue, isLoading, disabled }) => {
  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center text-xl">
          <Lightbulb className="h-6 w-6 mr-2 text-primary" />
          Need a Hint?
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {clue && (
          <p className="text-muted-foreground italic p-3 bg-secondary rounded-md">{clue}</p>
        )}
        <Button onClick={onGetClue} disabled={isLoading || disabled} className="w-full">
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
          ) : (
            <Lightbulb className="h-5 w-5 mr-2" />
          )}
          {clue ? 'Get Another Clue' : 'Get Clue'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default ClueDisplay;
