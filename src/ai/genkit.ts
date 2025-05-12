import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {SecretManagerServiceClient} from '@google-cloud/secret-manager';

async function getGeminiApiKey() {
  try {
    const client = new SecretManagerServiceClient();
    const projectId = process.env.GOOGLE_CLOUD_PROJECT;
    if (!projectId) {
      throw new Error('GOOGLE_CLOUD_PROJECT environment variable is not set');
    }

    const name = `projects/${projectId}/secrets/GEMINI_API_KEY/versions/latest`;
    const [version] = await client.accessSecretVersion({name});
    
    if (!version.payload?.data) {
      throw new Error('Failed to retrieve GEMINI_API_KEY from Secret Manager');
    }

    return version.payload.data.toString();
  } catch (error) {
    console.error('Error retrieving Gemini API key:', error);
    throw error;
  }
}

// Initialize Genkit with API key from Secret Manager
async function initializeGenkit() {
  const apiKey = await getGeminiApiKey();
  return genkit({
    plugins: [googleAI({apiKey})],
    model: 'googleai/gemini-2.0-flash',
  });
}

// Export the async initialization function
export const getAI = initializeGenkit;

// For backward compatibility during the transition
export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.0-flash',
});
