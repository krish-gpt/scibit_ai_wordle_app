'use client';

import { useState, useEffect, useCallback } from 'react';
import type { FC } from 'react';
import Header from '@/components/Header';
import GameBoard from '@/components/game/GameBoard';
import Keyboard from '@/components/game/Keyboard';
import ClueDisplay from '@/components/game/ClueDisplay';
import ResultsModal from '@/components/game/ResultsModal';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, RotateCw } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { generateDailyGame } from '@/ai/flows/generate-daily-game';
import { getFallbackContent } from '@/lib/utils/fallback';
import type { GuessFeedback, KeyStatus, LetterFeedback } from '@/lib/types';

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

  // Function to get today's date in YYYY-MM-DD format, using UTC to ensure consistency
  const getTodayDate = useCallback(() => {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    const day = String(now.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  useEffect(() => {
    const loadGame = async () => {
      setGameState('loading');
      setGuesses([]);
      setCurrentGuess('');
      setClue(null);
      setIsClueLoading(true);
      setTermSummary(null);
      setKeyStatuses({});
      setErrorMsg(null);

      try {
        const today = getTodayDate();
        const dailyGame = await generateDailyGame({ 
          difficulty,
          date: today
        });
        
        if (!dailyGame?.word || typeof dailyGame.word !== 'string' || dailyGame.word.trim() === '') {
          throw new Error("Failed to generate a valid word.");
        }

        const gameData = {
          word: dailyGame.word.toUpperCase(),
          date: today,
          difficulty,
          clue: dailyGame.clue || '',
          summary: dailyGame.summary || ''
        };

        if (!gameData.word || gameData.word.length < 3 || gameData.word.length > 10) {
          throw new Error("Generated word has an unsupported length.");
        }
        
        setTargetWord(gameData.word);
        setWordLength(gameData.word.length);
        setClue(gameData.clue);
        setIsClueLoading(false);
        
        if (gameData.summary) {
          setTermSummary(gameData.summary);
        }
        
        setGameState('playing');

      } catch (error: any) {
        console.error('Error loading game:', error);
        setGameState('error');
        setErrorMsg(error?.message || "Failed to load game. Please try again.");
        toast({
          title: "Error",
          description: "Failed to load game. Please try again.",
          variant: "destructive"
        });
      }
    };

    loadGame();
  }, [difficulty, toast, getTodayDate]);

  const handleCharInput = useCallback((char: string) => {
    if (gameState !== 'playing' || currentGuess.length >= wordLength) return;
    setCurrentGuess((prev) => prev + char.toUpperCase());
  }, [gameState, currentGuess, wordLength]);

  const handleDelete = useCallback(() => {
    if (gameState !== 'playing') return;
    setCurrentGuess((prev) => prev.slice(0, -1));
  }, [gameState]);

  const handleEnter = useCallback(async () => {
    if (gameState !== 'playing' || guesses.length >= MAX_GUESSES) return;

    if (currentGuess.length !== wordLength) {
      toast({ title: "Invalid Guess", description: `Word must be ${wordLength} letters long.`, variant: "destructive" });
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      return;
    }

    const feedback: LetterFeedback[] = Array(wordLength).fill(null).map(() => ({ char: '', status: 'empty' }));
    const targetChars = targetWord.split('');
    const guessChars = currentGuess.split('');
    const letterCounts: { [key: string]: number } = {};

    targetChars.forEach(char => {
      letterCounts[char] = (letterCounts[char] || 0) + 1;
    });

    // Pass 1: Identify 'correct' letters
    for (let i = 0; i < wordLength; i++) {
      feedback[i].char = guessChars[i];
      if (guessChars[i] === targetChars[i]) {
        feedback[i].status = 'correct';
        letterCounts[guessChars[i]]--;
      }
    }

    // Pass 2: Identify 'present' and 'absent' letters
    for (let i = 0; i < wordLength; i++) {
      if (feedback[i].status === 'correct') {
        continue; 
      }
      // feedback[i].char is already set
      if (targetChars.includes(guessChars[i]) && letterCounts[guessChars[i]] > 0) {
        feedback[i].status = 'present';
        letterCounts[guessChars[i]]--;
      } else {
        feedback[i].status = 'absent';
      }
    }
    
    const newGuesses = [...guesses, { letters: feedback, isSubmitted: true }];
    setGuesses(newGuesses);

    const newKeyStatuses = { ...keyStatuses };
    feedback.forEach(({ char, status }) => {
      const upperChar = char.toUpperCase();
      const currentKeyStatus = newKeyStatuses[upperChar];

      if (status === 'correct') {
        newKeyStatuses[upperChar] = 'correct';
      } else if (status === 'present') {
        if (currentKeyStatus !== 'correct') {
          newKeyStatuses[upperChar] = 'present';
        }
      } else if (status === 'absent') {
        if (currentKeyStatus !== 'correct' && currentKeyStatus !== 'present') {
         newKeyStatuses[upperChar] = 'absent';
        }
      }
    });
    setKeyStatuses(newKeyStatuses);
    
    setCurrentGuess('');

    const loadSummary = async () => {
      try {
        setIsSummaryLoading(true);
        const today = getTodayDate();
        const dailyGame = await generateDailyGame({ 
          difficulty,
          date: today
        });
        if (dailyGame?.summary) {
          setTermSummary(dailyGame.summary);
        }
      } catch (error) {
        console.error('Error loading summary:', error);
        // Use fallback content if available
        const fallback = getFallbackContent(targetWord);
        if (fallback?.summary) {
          setTermSummary(fallback.summary.definition);
        }
      } finally {
        setIsSummaryLoading(false);
      }
    };

    if (currentGuess === targetWord) {
      setGameState('won');
      toast({ title: "You Won!", description: "Congratulations!", className: "bg-tile-correct-background text-tile-correct-foreground" });
      loadSummary();
    } else if (newGuesses.length >= MAX_GUESSES) {
      setGameState('lost');
      toast({ title: "Game Over", description: `The word was ${targetWord}.`, variant: "destructive" });
      loadSummary();
    }
  }, [gameState, currentGuess, wordLength, targetWord, guesses, toast, keyStatuses, termSummary, difficulty, getTodayDate]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (gameState !== 'playing') return; 

      const key = event.key.toUpperCase();
      if (event.metaKey || event.ctrlKey || event.altKey) return;

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

  const handleShare = async () => {
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
    
    try {
      // Try using the Share API first
      if (navigator.share) {
        await navigator.share({
          title: 'SciBit Results',
          text: shareText
        });
        toast({ title: "Shared!", description: "Results shared successfully!" });
        return;
      }

      // Fallback to clipboard with permission handling
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(shareText);
          toast({ title: "Copied to clipboard!", description: "Share your results!" });
          return;
        }
      } catch (clipboardError) {
        console.warn('Clipboard API failed:', clipboardError);
        // Continue to fallback method
      }

      // Fallback for older browsers or when clipboard API is blocked
      const textArea = document.createElement('textarea');
      textArea.value = shareText;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      try {
        const successful = document.execCommand('copy');
        textArea.remove();
        if (successful) {
          toast({ title: "Copied to clipboard!", description: "Share your results!" });
        } else {
          throw new Error('Copy command failed');
        }
      } catch (err) {
        console.error('Failed to copy text: ', err);
        textArea.remove();
        // Show the text in a modal or alert as last resort
        toast({ 
          title: "Manual Copy Required", 
          description: "Please select and copy this text: " + shareText,
          duration: 10000, // Show for 10 seconds
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Error sharing results:', error);
      // Show the text directly to the user
      toast({ 
        title: "Share Manually", 
        description: "Please copy this text: " + shareText,
        duration: 10000, // Show for 10 seconds
        variant: "default"
      });
    }
  };

  const handleGameExit = useCallback(() => {
    // Refresh the page to completely reset the game state
    window.location.reload();
  }, []);

  if (gameState === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-2 sm:p-4">
        <Loader2 className="h-12 w-12 sm:h-16 sm:w-16 animate-spin text-primary mb-2 sm:mb-4" />
        <p className="text-lg sm:text-xl text-muted-foreground text-center">Loading your daily SciBit challenge...</p>
      </div>
    );
  }

  if (gameState === 'error') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-2 sm:p-4 text-center">
        <Header />
        <main className="flex flex-col items-center gap-4 sm:gap-8 mt-4 sm:mt-8 px-2 w-full">
            <AlertTriangle className="h-12 w-12 sm:h-16 sm:w-16 text-destructive mb-2 sm:mb-4" />
            <h2 className="text-xl sm:text-2xl font-semibold text-destructive">Oops! Something went wrong.</h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-md">{errorMsg || "We couldn't load the game. Please check your connection or try refreshing the page."}</p>
        </main>
      </div>
    );
  }


  return (
    <div className="flex flex-col items-center min-h-screen h-screen">
      <Header />
      <main className="flex flex-col flex-1 min-h-0 w-full max-w-lg mx-auto">
        <div className="flex flex-col min-h-0 px-1 sm:px-2 gap-0">
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
            isLoading={isClueLoading}
          />
        </div>
        <div className="w-full flex-shrink-0">
          <Keyboard
            onChar={handleCharInput}
            onDelete={handleDelete}
            onEnter={handleEnter}
            keyStatuses={keyStatuses}
            disabled={gameState !== 'playing'}
          />
        </div>
      </main>
      {(gameState === 'won' || gameState === 'lost') && (
        <ResultsModal
          isOpen={gameState === 'won' || gameState === 'lost'}
          onClose={handleGameExit}
          gameState={gameState}
          targetWord={targetWord}
          guesses={guesses}
          attempts={guesses.length}
          termSummary={termSummary}
          isSummaryLoading={isSummaryLoading}
          onShare={handleShare}
          maxGuesses={MAX_GUESSES}
        />
      )}
    </div>
  );
};

export default SciBitPage;
