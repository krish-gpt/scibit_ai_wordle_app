'use client';

import { useState, useEffect, useCallback } from 'react';
import type { FC } from 'react';
import Header from '@/components/Header';
import GameBoard from '@/components/game/GameBoard';
import Keyboard from '@/components/game/Keyboard';
import ClueDisplay from '@/components/game/ClueDisplay';
import ResultsModal from '@/components/game/ResultsModal';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, RotateCw } from 'lucide-react'; // Added RotateCw
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

    let attempts = 0;
    const maxAttempts = 2; // Initial attempt + 1 retry

    while (attempts < maxAttempts) {
      attempts++;
      try {
        const today = new Date().toISOString().split('T')[0];
        const storageKey = `scibit-${today}-${difficulty}`;
        let dailyWordData = null; // Initialize as null

        // Attempt to load from localStorage only on the first overall attempt.
        // If we are retrying due to a generation failure, we skip localStorage.
        if (attempts === 1) {
          const storedGame = localStorage.getItem(storageKey);
          if (storedGame) {
            try {
              dailyWordData = JSON.parse(storedGame);
              // Validate word from localStorage
              if (!dailyWordData || !dailyWordData.word || typeof dailyWordData.word !== 'string' || dailyWordData.word.length < 3 || dailyWordData.word.length > 10) {
                console.warn(`Stored word "${dailyWordData?.word}" has invalid length or format. Clearing and regenerating.`);
                localStorage.removeItem(storageKey);
                dailyWordData = null; // Force regeneration
              }
            } catch (parseError) {
                console.error("Error parsing stored game data:", parseError);
                localStorage.removeItem(storageKey);
                dailyWordData = null; // Force regeneration
            }
          }
        }

        if (!dailyWordData) { // Need to generate a new word
          console.log(`Attempting to generate word (attempt ${attempts})`);
          const { word } = await generateDailyWord({ difficulty });
          if (!word || typeof word !== 'string' || word.trim() === '') {
            throw new Error("AI failed to generate a valid word string.");
          }
          dailyWordData = { word: word.toUpperCase(), date: today, difficulty };
        }

        // Validate the (potentially new) word
        if (!dailyWordData.word || dailyWordData.word.length < 3 || dailyWordData.word.length > 10) {
          console.warn(`Generated/loaded word "${dailyWordData.word}" has invalid length (attempt ${attempts}).`);
          localStorage.removeItem(storageKey); // Ensure bad word is not stored
          if (attempts < maxAttempts) {
            dailyWordData = null; // Ensure regeneration on next attempt
            continue; // Try again
          } else {
            throw new Error("Generated word has an unsupported length after multiple attempts.");
          }
        }

        // Word is valid, store it (or re-store if it was from localStorage and re-validated)
        localStorage.setItem(storageKey, JSON.stringify(dailyWordData));
        
        setTargetWord(dailyWordData.word);
        setWordLength(dailyWordData.word.length);
        setGameState('playing');
        return; // Exit loop and function successfully

      } catch (error) {
        console.error(`Error during game initialization (attempt ${attempts}):`, error);
        if (attempts >= maxAttempts) {
          const message = error instanceof Error ? error.message : "Failed to load the game. Please try refreshing the page.";
          setErrorMsg(message);
          setGameState('error');
          toast({
            title: "Error",
            description: message === "AI failed to generate a valid word string." || message === "Generated word has an unsupported length after multiple attempts." 
                         ? message 
                         : "Could not fetch or validate the daily word. Please try again later.",
            variant: "destructive",
          });
          return; // Exit function with error
        }
        // If not max attempts, loop will continue for another try.
        // Add a small delay before retrying to avoid hammering the API if needed
        // await new Promise(resolve => setTimeout(resolve, 500)); 
      }
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
        // Count correctly placed instances of this character so far in the guess
        let correctInstanceOfCharInGuess = 0;
        for (let i = 0; i < targetWord.length; i++) {
          if (targetWord[i] === char && currentGuess[i] === char) {
            correctInstanceOfCharInGuess++;
          }
        }
        
        // Count 'present' or 'correct' instances of this char in the guess UP TO THE CURRENT POSITION
        let presentOrCorrectInstancesBeforeCurrent = 0;
        for (let i = 0; i < index; i++) {
            if (currentGuess[i] === char && (targetWord[i] === char || targetWord.includes(char))) {
                presentOrCorrectInstancesBeforeCurrent++;
            }
        }
        // A character is 'present' if it's in the word, not in the correct spot,
        // and we haven't already accounted for all instances of this char (either as 'correct' or 'present' earlier in the guess)
        if (presentOrCorrectInstancesBeforeCurrent < targetCharCount) {
            status = 'present';
        }


      }
      return { char, status };
    });
    
    // Refine "present" status to avoid over-counting for multiple letters
    const refinedFeedback = [...newFeedback];
    const targetWordChars = targetWord.split('');

    currentGuess.split('').forEach((guessChar, guessIdx) => {
        if (refinedFeedback[guessIdx].status === 'present') {
            let targetCharOccurrences = targetWordChars.filter(tc => tc === guessChar).length;
            let correctOccurrencesInGuess = 0;
            let presentOccurrencesInGuess = 0;

            for(let i = 0; i < wordLength; i++) {
                if (currentGuess[i] === guessChar && targetWordChars[i] === guessChar) {
                    correctOccurrencesInGuess++;
                }
            }
            for(let i = 0; i < guessIdx; i++) { // count presents up to current
                if (refinedFeedback[i].char === guessChar && refinedFeedback[i].status === 'present') {
                    presentOccurrencesInGuess++;
                }
            }
            if (presentOccurrencesInGuess >= (targetCharOccurrences - correctOccurrencesInGuess) ) {
                 refinedFeedback[guessIdx].status = 'absent';
            }
        }
    });


    const newGuesses = [...guesses, { letters: refinedFeedback, isSubmitted: true }];
    setGuesses(newGuesses);

    // Update key statuses
    const newKeyStatuses = { ...keyStatuses };
    refinedFeedback.forEach(({ char, status }) => {
      const upperChar = char.toUpperCase();
      // Prioritize 'correct' > 'present' > 'absent'
      if (status === 'correct') {
        newKeyStatuses[upperChar] = 'correct';
      } else if (status === 'present' && newKeyStatuses[upperChar] !== 'correct') {
        newKeyStatuses[upperChar] = 'present';
      } else if (status === 'absent' && !newKeyStatuses[upperChar]) {
        newKeyStatuses[upperChar] = 'absent';
      }
    });
    setKeyStatuses(newKeyStatuses);
    
    setCurrentGuess('');

    if (currentGuess === targetWord) {
      setGameState('won');
      toast({ title: "You Won!", description: "Congratulations!", className: "bg-tile-correct-background text-tile-correct-foreground" });
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
      if (gameState !== 'playing' || (gameState === 'won' || gameState === 'lost')) return; 

      const key = event.key.toUpperCase();
      if (event.metaKey || event.ctrlKey || event.altKey) return; // Ignore modified key presses

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
