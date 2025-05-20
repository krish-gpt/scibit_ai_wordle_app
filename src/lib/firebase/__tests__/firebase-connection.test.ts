import { initializeApp, getApps, FirebaseOptions } from 'firebase/app';
import { getFirestore, collection, getDocs, query, limit, Timestamp, terminate, doc, getDoc, setDoc } from 'firebase/firestore';
import { getFirebaseCredentials, getFirebaseDb } from '../config';

describe('Firebase Connection', () => {
  let app: any;
  let db: any;
  let firebaseConfig: FirebaseOptions;
  const TEST_DATE = '2025-05-16';
  const COLLECTION_NAME = 'dailywordsCollection';
  const TEST_DOCUMENT = {
    word: 'NEURAL',
    difficulty: 'medium',
    clue: 'Related to networks in the brain or artificial intelligence',
    summary: 'A fundamental concept in both biological and artificial intelligence',
    createdAt: Timestamp.now()
  };

  // Increase timeout for the entire test suite
  jest.setTimeout(30000);

  beforeAll(async () => {
    // Verify environment variables are set
    const requiredEnvVars = [
      'GOOGLE_CLOUD_PROJECT',
      'GOOGLE_APPLICATION_CREDENTIALS',
      'FIREBASE_DATABASE_ID',
      'FIREBASE_API_KEY_SECRET',
      'FIREBASE_APP_ID_SECRET',
      'FIREBASE_AUTH_DOMAIN_SECRET',
      'FIREBASE_PROJECT_ID_SECRET'
    ];

    requiredEnvVars.forEach(envVar => {
      if (!process.env[envVar]) {
        throw new Error(`Required environment variable ${envVar} is not set`);
      }
      console.log(`✓ ${envVar} is set`);
    });

    try {
      // Get credentials from Secret Manager
      firebaseConfig = await getFirebaseCredentials();
      console.log('Successfully retrieved Firebase credentials from Secret Manager');

      // Initialize Firebase and get database instance
      db = await getFirebaseDb();
      app = getApps()[0]; // App is initialized by getFirebaseDb
      console.log('Successfully initialized Firebase and database connection');
    } catch (error) {
      console.error('Failed to initialize Firebase:', error);
      throw error;
    }
  });

  afterAll(async () => {
    try {
      // Clean up Firestore connection
      if (db) {
        await terminate(db);
        console.log('Terminated Firestore connection');
      }
    } catch (error) {
      console.error('Cleanup failed:', error);
    }
  });

  it('should have valid Firebase configuration from Secret Manager', () => {
    expect(firebaseConfig.apiKey).toBeDefined();
    expect(firebaseConfig.apiKey).not.toBe('');
    expect(firebaseConfig.appId).toBeDefined();
    expect(firebaseConfig.authDomain).toBeDefined();
    expect(firebaseConfig.projectId).toBeDefined();
  });

  it('should write document to collection', async () => {
    try {
      // First verify collection exists
      console.log(`Checking collection: ${COLLECTION_NAME}`);
      const collectionRef = collection(db, COLLECTION_NAME);
      const querySnapshot = await getDocs(query(collectionRef, limit(1)));
      console.log(`Collection ${COLLECTION_NAME} exists. Contains ${querySnapshot.size} documents.`);

      // Write the test document
      const docRef = doc(db, COLLECTION_NAME, TEST_DATE);
      await setDoc(docRef, TEST_DOCUMENT);
      console.log(`Successfully wrote document for date ${TEST_DATE}`);
      
      // Verify the write by reading it back
      const docSnap = await getDoc(docRef);
      expect(docSnap.exists()).toBeTruthy();
      
      const data = docSnap.data()!;
      expect(data).toMatchObject({
        word: TEST_DOCUMENT.word,
        difficulty: TEST_DOCUMENT.difficulty,
        clue: TEST_DOCUMENT.clue,
        summary: TEST_DOCUMENT.summary
      });
      expect(data.createdAt).toBeInstanceOf(Timestamp);
      
      console.log('Successfully verified written document');
    } catch (error) {
      console.error('Failed to write to Firestore:', error);
      throw error;
    }
  });

  it('should read document from collection for specific date', async () => {
    try {
      // Verify database connection
      expect(db).toBeDefined();
      
      // First verify collection exists
      console.log(`Checking collection: ${COLLECTION_NAME}`);
      const collectionRef = collection(db, COLLECTION_NAME);
      const querySnapshot = await getDocs(query(collectionRef, limit(1)));
      console.log(`Collection ${COLLECTION_NAME} exists. Contains ${querySnapshot.size} documents.`);
      
      // Access specific document in collection
      const docRef = doc(db, COLLECTION_NAME, TEST_DATE);
      const docSnap = await getDoc(docRef);
      
      // Log whether document exists
      if (docSnap.exists()) {
        console.log(`Found document for date ${TEST_DATE}`);
        const data = docSnap.data();
        console.log('Document data:', {
          word: data.word,
          difficulty: data.difficulty,
          clue: data.clue,
          summary: data.summary
        });
        
        // Verify document structure
        expect(data.word).toBeDefined();
        expect(data.difficulty).toBeDefined();
        expect(data.clue).toBeDefined();
        expect(data.summary).toBeDefined();
        expect(data.createdAt).toBeInstanceOf(Timestamp);
      } else {
        console.log(`No document found for date ${TEST_DATE}`);
      }
    } catch (error) {
      console.error('Failed to access Firestore:', error);
      throw error;
    }
  });
}); 