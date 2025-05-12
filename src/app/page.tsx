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

  const initializeGame = useCallback(async () => {
    setGameState('loading');
    setGuesses([]);
    setCurrentGuess('');
    setClue(null);
    setIsClueLoading(true);
    setTermSummary(null);
    setKeyStatuses({});
    setErrorMsg(null);

    let attempts = 0;
    const maxAttempts = 2;

    while (attempts < maxAttempts) {
      attempts++;
      try {
        const today = new Date().toISOString().split('T')[0];
        const storageKey = `scibit-${today}-${difficulty}`;
        let gameData = null;

        if (attempts === 1) {
          const storedGame = localStorage.getItem(storageKey);
          if (storedGame) {
            try {
              gameData = JSON.parse(storedGame);
              if (!gameData?.word || typeof gameData.word !== 'string' || 
                  gameData.word.length < 3 || gameData.word.length > 10) {
                console.warn(`Stored word "${gameData?.word}" has invalid length or format. Clearing and regenerating.`);
                localStorage.removeItem(storageKey);
                gameData = null;
              }
            } catch (parseError) {
              console.error("Error parsing stored game data:", parseError);
              localStorage.removeItem(storageKey);
              gameData = null;
            }
          }
        }

        if (!gameData) {
          console.log(`Attempting to generate game (attempt ${attempts})`);
          const dailyGame = await generateDailyGame({ 
            difficulty,
            date: today
          });
          
          if (!dailyGame?.word || typeof dailyGame.word !== 'string' || dailyGame.word.trim() === '') {
            throw new Error("Failed to generate a valid word.");
          }

          gameData = {
            word: dailyGame.word.toUpperCase(),
            date: today,
            difficulty,
            clue: dailyGame.clues.technical, // Using technical clue as primary
            summary: `${dailyGame.summary.definition}\n\n${dailyGame.summary.importance}\n\nExamples:\n${dailyGame.summary.examples.join('\n')}`
          };
        }

        if (!gameData.word || gameData.word.length < 3 || gameData.word.length > 10) {
          console.warn(`Generated/loaded word "${gameData.word}" has invalid length (attempt ${attempts}).`);
          localStorage.removeItem(storageKey);
          if (attempts < maxAttempts) {
            gameData = null;
            continue;
          } else {
            throw new Error("Generated word has an unsupported length after multiple attempts.");
          }
        }

        localStorage.setItem(storageKey, JSON.stringify(gameData));
        
        setTargetWord(gameData.word);
        setWordLength(gameData.word.length);
        setClue(gameData.clue);
        setIsClueLoading(false);
        
        if (gameData.summary) {
          setTermSummary(gameData.summary);
        }
        
        setGameState('playing');
        return;

      } catch (error) {
        console.error(`Error during game initialization (attempt ${attempts}):`, error);
        setIsClueLoading(false);
        if (attempts >= maxAttempts) {
          const message = error instanceof Error ? error.message : "Failed to load the game. Please try refreshing the page.";
          setErrorMsg(message);
          setGameState('error');
          toast({
            title: "Error",
            description: "Could not fetch or validate the daily word. Please try again later.",
            variant: "destructive",
          });
          return;
        }
      }
    }
  }, [difficulty, toast]);

  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

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

    if (currentGuess === targetWord) {
      setGameState('won');
      toast({ title: "You Won!", description: "Congratulations!", className: "bg-tile-correct-background text-tile-correct-foreground" });
      setIsSummaryLoading(true);
      setTermSummary(termSummary);
    } else if (newGuesses.length >= MAX_GUESSES) {
      setGameState('lost');
      toast({ title: "Game Over", description: `The word was ${targetWord}.`, variant: "destructive" });
      setIsSummaryLoading(true);
      setTermSummary(termSummary);
    }
  }, [gameState, currentGuess, wordLength, targetWord, guesses, toast, keyStatuses, termSummary]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (gameState !== 'playing' || (gameState === 'won' || gameState === 'lost')) return; 

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
          isLoading={isClueLoading}
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
