import type { FC } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Share2, ThumbsUp, ThumbsDown, Loader2, X } from 'lucide-react';
import type { GuessFeedback } from '@/lib/types';
import AdUnit from '@/components/ads/AdUnit';

interface ResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameState: 'won' | 'lost';
  targetWord: string;
  guesses: GuessFeedback[];
  attempts: number;
  termSummary: string | null;
  isSummaryLoading: boolean;
  onShare: () => void;
  maxGuesses: number;
}

const ResultsModal: FC<ResultsModalProps> = ({
  isOpen,
  onClose,
  gameState,
  targetWord,
  guesses,
  attempts,
  termSummary,
  isSummaryLoading,
  onShare,
  maxGuesses,
}) => {
  const title = gameState === 'won' ? 'Congratulations!' : 'Better Luck Next Time!';
  const Icon = gameState === 'won' ? ThumbsUp : ThumbsDown;

  const getEmojiGrid = () => {
    return guesses
      .filter(g => g.isSubmitted)
      .map(guess =>
        guess.letters
          .map(letter => {
            if (letter.status === 'correct') return '🟩';
            if (letter.status === 'present') return '🟨';
            return '⬜';
          })
          .join('')
      )
      .join('\n');
  };
  
  const shareText = `SciBit ${gameState === 'won' ? attempts : 'X'}/${maxGuesses}\nWord: ${targetWord.toUpperCase()}\n\n${getEmojiGrid()}`;


  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-lg w-full">
        <div className="absolute right-4 top-4">
          <Button variant="ghost" size="icon" onClick={onClose} className="h-6 w-6">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center text-2xl">
            <Icon className={`h-8 w-8 mr-3 ${gameState === 'won' ? 'text-tile-correct-background' : 'text-destructive'}`} />
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {gameState === 'won'
              ? `You guessed the word "${targetWord.toUpperCase()}" in ${attempts} ${attempts === 1 ? 'attempt' : 'attempts'}!`
              : `The word was "${targetWord.toUpperCase()}".`}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="my-4">
          <h3 className="font-semibold mb-2 text-lg">Your Guesses:</h3>
          <div className="p-2 border rounded-md bg-secondary max-h-32 overflow-y-auto">
            <pre className="text-sm whitespace-pre-wrap">{getEmojiGrid() || "No guesses submitted."}</pre>
          </div>
        </div>
        
        <Separator />

        <div className="my-4">
          <h3 className="font-semibold mb-2 text-lg">About "{targetWord.toUpperCase()}"</h3>
          {isSummaryLoading ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="ml-2 text-muted-foreground">Loading summary...</p>
            </div>
          ) : termSummary ? (
            <ScrollArea className="h-32 p-3 border rounded-md bg-secondary">
              <p className="text-sm text-foreground">{termSummary}</p>
            </ScrollArea>
          ) : (
            <p className="text-sm text-muted-foreground italic">No summary available for this term.</p>
          )}
        </div>

        <Separator />

        <div className="my-4">
          {process.env.NEXT_PUBLIC_ADSENSE_SLOT_RESULTS && (
            <AdUnit
              adSlot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_RESULTS}
              className="min-h-[250px]"
              style={{ minWidth: '300px' }}
            />
          )}
        </div>

        <AlertDialogFooter className="flex flex-col gap-2">
          <Button variant="outline" onClick={onShare} className="w-full">
            <Share2 className="h-4 w-4 mr-2" /> Share
          </Button>
          <Button variant="ghost" onClick={onClose} className="w-full text-destructive hover:text-destructive">
            <X className="h-4 w-4 mr-2" /> Exit Game
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ResultsModal;
