import { useEffect } from 'react';
import type { FC } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Share2, RotateCw, ThumbsUp, ThumbsDown, Loader2 } from 'lucide-react';
import type { GuessFeedback } from '@/lib/types';
import { ADSENSE_CONFIG } from '@/config/adsense';

interface ResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameState: 'won' | 'lost';
  targetWord: string;
  guesses: GuessFeedback[];
  attempts: number;
  termSummary: string | null;
  isSummaryLoading: boolean;
  onPlayAgain: () => void;
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
  onPlayAgain,
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

  useEffect(() => {
    // Only load ads in production and when the modal is open
    if (isOpen && typeof window !== 'undefined' && ADSENSE_CONFIG.IS_PRODUCTION) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (err) {
        console.error('AdSense error:', err);
      }
    }
  }, [isOpen]);

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-lg w-full">
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
          <div className="p-2 border rounded-md bg-secondary max-h-48 overflow-y-auto">
            {guesses.filter(g => g.isSubmitted).length > 0 ? (
              <div className="space-y-2">
                {guesses
                  .filter(g => g.isSubmitted)
                  .map((guess, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="font-mono uppercase">
                        {guess.letters.map(l => l.letter).join('')}
                      </span>
                      <span>
                        {guess.letters.map(letter => {
                          if (letter.status === 'correct') return '🟩';
                          if (letter.status === 'present') return '🟨';
                          return '⬜';
                        }).join('')}
                      </span>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center">No guesses submitted.</p>
            )}
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

        {ADSENSE_CONFIG.IS_PRODUCTION && (
          <div className="my-4">
            <ins
              className="adsbygoogle"
              style={{ display: 'block' }}
              data-ad-client={ADSENSE_CONFIG.CLIENT_ID}
              data-ad-slot={ADSENSE_CONFIG.RESULTS_AD_SLOT}
              data-ad-format="auto"
              data-full-width-responsive="true"
            />
          </div>
        )}

        <AlertDialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onShare}>
            <Share2 className="h-4 w-4 mr-2" /> Share
          </Button>
          <AlertDialogAction onClick={onPlayAgain} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <RotateCw className="h-4 w-4 mr-2" /> Play Again (New Word)
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ResultsModal;
