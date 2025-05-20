import { initializeApp, getApps, getApp, FirebaseOptions } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

let app: ReturnType<typeof getApp>;
let db: Firestore;
let initialized = false;

class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

// Utility function to access secrets
async function getSecret(secretName: string): Promise<string> {
  const client = new SecretManagerServiceClient();
  const projectId = process.env.GOOGLE_CLOUD_PROJECT;
  if (!projectId) {
    throw new ConfigurationError('GOOGLE_CLOUD_PROJECT environment variable is not set');
  }

  const name = `projects/${projectId}/secrets/${secretName}/versions/latest`;
  try {
    const [version] = await client.accessSecretVersion({ name });
    const secretValue = version.payload?.data?.toString();
    
    if (!secretValue) {
      throw new ConfigurationError(`Secret ${secretName} is empty or undefined`);
    }
    
    return secretValue;
  } catch (error) {
    console.error(`Failed to access secret ${secretName}:`, error);
    throw new ConfigurationError(`Failed to access secret ${secretName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Get Firebase configuration from Secret Manager
export async function getFirebaseCredentials(): Promise<FirebaseOptions> {
  try {
    const [apiKey, appId, authDomain, projectId] = await Promise.all([
      getSecret(process.env.FIREBASE_API_KEY_SECRET!),
      getSecret(process.env.FIREBASE_APP_ID_SECRET!),
      getSecret(process.env.FIREBASE_AUTH_DOMAIN_SECRET!),
      getSecret(process.env.FIREBASE_PROJECT_ID_SECRET!)
    ]);

    // Validate required fields
    const config = {
      apiKey,
      appId,
      authDomain,
      projectId
    };

    Object.entries(config).forEach(([key, value]) => {
      if (!value) {
        throw new ConfigurationError(`Firebase configuration missing required field: ${key}`);
      }
    });

    return config;
  } catch (error) {
    console.error('Failed to get Firebase credentials:', error);
    throw error;
  }
}

// Initialize Firebase with configuration
export async function getFirebaseDb() {
  if (initialized) {
    return db;
  }

  try {
    const config = await getFirebaseCredentials();
    
    if (!getApps().length) {
      app = initializeApp(config);
    } else {
      app = getApp();
    }
    
    const databaseId = process.env.FIREBASE_DATABASE_ID;
    if (!databaseId) {
      throw new ConfigurationError('FIREBASE_DATABASE_ID environment variable is not set');
    }
    
    db = getFirestore(app, databaseId);
    initialized = true;
    
    return db;
  } catch (error) {
    console.error('Failed to initialize Firebase:', error);
    throw error;
  }
}

// Export utility functions
export { getSecret }; 