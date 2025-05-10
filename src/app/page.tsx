'use client';

import { useState, useEffect, useCallback } from 'react';
import type { FC } from 'react';
import Header from '@/components/Header';
import GameBoard from '@/components/game/GameBoard';
import Keyboard from '@/components/game/Keyboard';
import ClueDisplay from '@/components/game/ClueDisplay';
import ResultsModal from '@/components/game/ResultsModal';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { generateDailyWord } from '@/ai/flows/generate-daily-word';
import { generateClue } from '@/ai/flows/generate-clue';
import { generateTermSummary } from '@/ai/flows/generate-term-summary';
import type { TileStatus, GuessFeedback, KeyStatus, LetterFeedback } from '@/lib/types';

const MAX_GUESSES = 6;
const DEFAULT_DIFFICULTY = 'medium' as 'easy' | 'medium' | 'hard';

const SciBitPage: FC = () => {
  const [difficulty] = useState<'easy' | 'medium' | 'hard'>(DEFAULT_DIFFICULTY);
  const [targetWord, setTargetWord] = useState<string>('');
  const [wordLength, setWordLength] = useState<number>(0);
  
  const [guesses, setGuesses] = useState<GuessFeedback[]>([]);
  const [currentGuess, setCurrentGuess] = useState<string>('');
  const [gameState, setGameState] = useState<'loading' | 'playing' | 'won' | 'lost' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [clue, setClue] = useState<string | null>(null);
  const [termSummary, setTermSummary] = useState<string | null>(null);
  
  const [isClueLoading, setIsClueLoading] = useState<boolean>(false);
  const [isSummaryLoading, setIsSummaryLoading] = useState<boolean>(false);
  
  const [keyStatuses, setKeyStatuses] = useState<KeyStatus>({});
  const [isShaking, setIsShaking] = useState<boolean>(false);

  const { toast } = useToast();

  const initializeGame = useCallback(async () => {
    setGameState('loading');
    setGuesses([]);
    setCurrentGuess('');
    setClue(null);
    setTermSummary(null);
    setKeyStatuses({});
    setErrorMsg(null);

    try {
      const today = new Date().toISOString().split('T')[0];
      const storedGame = localStorage.getItem(`scibit-${today}-${difficulty}`);
      let dailyWordData;

      if (storedGame) {
        dailyWordData = JSON.parse(storedGame);
      } else {
        const { word } = await generateDailyWord({ difficulty });
        if (!word || typeof word !== 'string' || word.trim() === '') {
          throw new Error("AI failed to generate a valid word.");
        }
        dailyWordData = { word: word.toUpperCase(), date: today, difficulty };
        localStorage.setItem(`scibit-${today}-${difficulty}`, JSON.stringify(dailyWordData));
      }
      
      // Validate word (basic validation for non-empty and reasonable length)
      if (dailyWordData.word.length < 3 || dailyWordData.word.length > 10) {
        console.warn(`Generated word "${dailyWordData.word}" has unusual length. Forcing new generation.`);
        localStorage.removeItem(`scibit-${today}-${difficulty}`); // Clear bad word
        // Potentially retry or show error. For now, let's try one more time if this happens.
        // This might lead to infinite loop if AI consistently fails. Better to show error after one retry.
        // To keep it simple, we'll just throw and let user try refresh for now.
        throw new Error("Generated word has an unsupported length. Please refresh to try again.");
      }

      setTargetWord(dailyWordData.word);
      setWordLength(dailyWordData.word.length);
      setGameState('playing');
    } catch (error) {
      console.error("Error fetching daily word:", error);
      setErrorMsg(error instanceof Error ? error.message : "Failed to load the game. Please try refreshing the page.");
      setGameState('error');
      toast({
        title: "Error",
        description: "Could not fetch the daily word. Please try again later.",
        variant: "destructive",
      });
    }
  }, [difficulty, toast]);

  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  const handleCharInput = (char: string) => {
    if (gameState !== 'playing' || currentGuess.length >= wordLength) return;
    setCurrentGuess((prev) => prev + char.toUpperCase());
  };

  const handleDelete = () => {
    if (gameState !== 'playing') return;
    setCurrentGuess((prev) => prev.slice(0, -1));
  };

  const handleEnter = useCallback(async () => {
    if (gameState !== 'playing' || guesses.length >= MAX_GUESSES) return;

    if (currentGuess.length !== wordLength) {
      toast({ title: "Invalid Guess", description: `Word must be ${wordLength} letters long.`, variant: "destructive" });
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      return;
    }

    const newFeedback: LetterFeedback[] = currentGuess.split('').map((char, index) => {
      let status: TileStatus = 'absent';
      if (char === targetWord[index]) {
        status = 'correct';
      } else if (targetWord.includes(char)) {
        // Handle duplicate letters correctly
        const targetCharCount = targetWord.split('').filter(c => c === char).length;
        const guessCharCountBeforeCurrent = currentGuess.slice(0, index).split('').filter(c => c === char).length;
        let correctPositionsForChar = 0;
        for(let i=0; i<targetWord.length; i++) {
            if(targetWord[i] === char && currentGuess[i] === char) {
                correctPositionsForChar++;
            }
        }
        if (guessCharCountBeforeCurrent < targetCharCount - correctPositionsForChar) {
             let occurrencesInGuess = 0;
             let correctOccurrencesOfCharInGuess = 0;
             for(let k=0; k<currentGuess.length; k++){
                 if(currentGuess[k] === char) occurrencesInGuess++;
                 if(currentGuess[k] === char && targetWord[k] === char && k <= index) correctOccurrencesOfCharInGuess++;
             }

             // Count "present" status for this char up to current index
             let presentCount = 0;
             for (let k = 0; k < index; k++) {
                 if (currentGuess[k] === char && targetWord.includes(currentGuess[k]) && targetWord[k] !== currentGuess[k]) {
                     presentCount++;
                 }
             }
            
            if ( (occurrencesInGuess - correctOccurrencesOfCharInGuess) <= (targetCharCount - correctPositionsForChar)) {
                 status = 'present';
            }
        }
      }
      return { char, status };
    });

    const newGuesses = [...guesses, { letters: newFeedback, isSubmitted: true }];
    setGuesses(newGuesses);

    // Update key statuses
    const newKeyStatuses = { ...keyStatuses };
    newFeedback.forEach(({ char, status }) => {
      const upperChar = char.toUpperCase();
      if (!newKeyStatuses[upperChar] || (status === 'correct') || (status === 'present' && newKeyStatuses[upperChar] !== 'correct')) {
        newKeyStatuses[upperChar] = status;
      }
    });
    setKeyStatuses(newKeyStatuses);
    
    setCurrentGuess('');

    if (currentGuess === targetWord) {
      setGameState('won');
      toast({ title: "You Won!", description: "Congratulations!", className: "bg-tile-correct-background text-tile-correct-foreground" });
      // Fetch summary on win
      setIsSummaryLoading(true);
      generateTermSummary({ term: targetWord })
        .then(summaryData => setTermSummary(summaryData.summary))
        .catch(err => {
            console.error("Error fetching summary:", err);
            setTermSummary("Could not load summary.");
        })
        .finally(() => setIsSummaryLoading(false));
    } else if (newGuesses.length >= MAX_GUESSES) {
      setGameState('lost');
      toast({ title: "Game Over", description: `The word was ${targetWord}.`, variant: "destructive" });
       // Fetch summary on loss
      setIsSummaryLoading(true);
      generateTermSummary({ term: targetWord })
        .then(summaryData => setTermSummary(summaryData.summary))
        .catch(err => {
            console.error("Error fetching summary:", err);
            setTermSummary("Could not load summary.");
        })
        .finally(() => setIsSummaryLoading(false));
    }
  }, [gameState, currentGuess, wordLength, targetWord, guesses, toast, keyStatuses]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (gameState !== 'playing' || (gameState === 'won' || gameState === 'lost')) return; // Prevent input when modal is open

      const key = event.key.toUpperCase();
      if (key === 'ENTER') {
        handleEnter();
      } else if (key === 'BACKSPACE') {
        handleDelete();
      } else if (key.length === 1 && key >= 'A' && key <= 'Z') {
        handleCharInput(key);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, handleEnter, handleCharInput, handleDelete]);


  const handleGetClue = async () => {
    if (!targetWord) return;
    setIsClueLoading(true);
    try {
      const clueData = await generateClue({ term: targetWord });
      setClue(clueData.clue);
    } catch (error) {
      console.error("Error fetching clue:", error);
      toast({ title: "Error", description: "Could not fetch a clue.", variant: "destructive" });
    } finally {
      setIsClueLoading(false);
    }
  };

  const handleShare = () => {
    const getEmojiGrid = () => guesses
        .filter(g => g.isSubmitted)
        .map(guess =>
            guess.letters.map(letter => {
                if (letter.status === 'correct') return '🟩';
                if (letter.status === 'present') return '🟨';
                return '⬜';
            }).join('')
        ).join('\n');
    
    const shareText = `SciBit ${gameState === 'won' ? guesses.length : 'X'}/${MAX_GUESSES}\nWord: ${targetWord.toUpperCase()}\n\n${getEmojiGrid()}`;
    navigator.clipboard.writeText(shareText)
      .then(() => toast({ title: "Copied to clipboard!", description: "Share your results!" }))
      .catch(() => toast({ title: "Error", description: "Could not copy results.", variant: "destructive" }));
  };

  if (gameState === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
        <p className="text-xl text-muted-foreground">Loading your daily SciBit challenge...</p>
      </div>
    );
  }

  if (gameState === 'error') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <Header />
        <main className="flex flex-col items-center gap-8 mt-8 px-2 w-full">
            <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
            <h2 className="text-2xl font-semibold text-destructive">Oops! Something went wrong.</h2>
            <p className="text-muted-foreground max-w-md">{errorMsg || "We couldn't load the game. Please check your connection or try refreshing the page."}</p>
            <Button onClick={initializeGame} className="mt-4">
                <RotateCw className="mr-2 h-4 w-4" /> Try Again
            </Button>
        </main>
      </div>
    );
  }


  return (
    <div className="flex flex-col items-center min-h-screen pt-0 pb-8 sm:py-8">
      <Header />
      <main className="flex flex-col items-center gap-6 sm:gap-8 mt-6 sm:mt-8 px-2 w-full">
        <GameBoard
          guesses={guesses}
          currentGuess={currentGuess}
          wordLength={wordLength}
          maxGuesses={MAX_GUESSES}
          currentRowIndex={guesses.length}
          isShaking={isShaking}
        />
        <ClueDisplay
          clue={clue}
          onGetClue={handleGetClue}
          isLoading={isClueLoading}
          disabled={gameState !== 'playing'}
        />
        <Keyboard
          onChar={handleCharInput}
          onDelete={handleDelete}
          onEnter={handleEnter}
          keyStatuses={keyStatuses}
          disabled={gameState !== 'playing'}
        />
      </main>
      {(gameState === 'won' || gameState === 'lost') && (
        <ResultsModal
          isOpen={gameState === 'won' || gameState === 'lost'}
          onClose={() => { /* Modal typically closes via its own actions */ }}
          gameState={gameState}
          targetWord={targetWord}
          guesses={guesses}
          attempts={guesses.length}
          termSummary={termSummary}
          isSummaryLoading={isSummaryLoading}
          onPlayAgain={initializeGame}
          onShare={handleShare}
          maxGuesses={MAX_GUESSES}
        />
      )}
    </div>
  );
};

export default SciBitPage;
