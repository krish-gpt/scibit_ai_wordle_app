import { getFirebaseDb } from './config';
import { collection, doc, getDoc, setDoc, Timestamp, getDocs, query, limit, orderBy } from 'firebase/firestore';
import { DailyGame, GenerationResult } from './types';

const COLLECTION_NAME = 'dailywordsCollection';
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour in milliseconds

// Cache for existing words
let wordsCache: {
  words: string[];
  timestamp: number;
} | null = null;

export async function getDailyGame(date: string): Promise<DailyGame | null> {
  const db = await getFirebaseDb();
  const docRef = doc(db, COLLECTION_NAME, date);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return docSnap.data() as DailyGame;
  }

  return null;
}

export async function storeDailyGame(date: string, game: Omit<DailyGame, 'targetDate' | 'createdAt'>): Promise<GenerationResult> {
  try {
    const db = await getFirebaseDb();
    const docRef = doc(db, COLLECTION_NAME, date);
    
    // Ensure date is parsed correctly by normalizing the format
    const [year, month, day] = date.split('-').map(num => num.padStart(2, '0'));
    const normalizedDate = `${year}-${month}-${day}`;
    
    const gameData: DailyGame = {
      ...game,
      targetDate: Timestamp.fromDate(new Date(normalizedDate)),
      createdAt: Timestamp.now()
    };

    await setDoc(docRef, gameData);

    return {
      success: true,
      data: gameData
    };
  } catch (error: any) {
    console.error('Error storing daily game:', error);
    return {
      success: false,
      error: error?.message || 'Unknown error occurred'
    };
  }
}

export async function checkGameExists(date: string): Promise<boolean> {
  const db = await getFirebaseDb();
  const docRef = doc(db, COLLECTION_NAME, date);
  const docSnap = await getDoc(docRef);
  return docSnap.exists();
}

export async function getAllExistingWords(limitCount: number = 100): Promise<string[]> {
  // Check cache first
  const now = Date.now();
  if (wordsCache && (now - wordsCache.timestamp) < CACHE_DURATION) {
    return wordsCache.words;
  }

  const db = await getFirebaseDb();
  const collectionRef = collection(db, COLLECTION_NAME);
  
  // Create a query that only fetches the word field and limits results
  const wordsQuery = query(
    collectionRef,
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );
  
  const querySnapshot = await getDocs(wordsQuery);
  
  const words: string[] = [];
  querySnapshot.forEach((doc) => {
    const data = doc.data() as DailyGame;
    if (data.word) {
      words.push(data.word.toUpperCase());
    }
  });
  
  // Update cache
  wordsCache = {
    words,
    timestamp: now
  };
  
  return words;
}

// Function to clear the cache (useful for testing or when you need fresh data)
export function clearWordsCache(): void {
  wordsCache = null;
} 