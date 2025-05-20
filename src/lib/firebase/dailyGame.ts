import { getFirebaseDb } from './config';
import { collection, doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { DailyGame, GenerationResult } from './types';

const COLLECTION_NAME = 'dailywordsCollection';

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