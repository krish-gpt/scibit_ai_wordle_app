const { config } = require('dotenv');
const { resolve } = require('path');

// Load environment variables from .env file
const result = config({ path: resolve(__dirname, '.env') });

if (result.error) {
  console.error('Error loading .env file:', result.error);
  process.exit(1);
}

// Verify required environment variables
const requiredEnvVars = [
  'GOOGLE_CLOUD_PROJECT',
  'GOOGLE_APPLICATION_CREDENTIALS',
  'FIREBASE_DATABASE_ID',
  'FIREBASE_API_KEY_SECRET',
  'FIREBASE_APP_ID_SECRET',
  'FIREBASE_AUTH_DOMAIN_SECRET',
  'FIREBASE_PROJECT_ID_SECRET'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars);
  process.exit(1);
}

// This file is intentionally empty.
// It's used as a placeholder for future test setup configuration if needed. 

// Add any other test setup if needed 