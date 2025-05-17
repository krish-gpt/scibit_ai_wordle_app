import { config } from 'dotenv';

// Load environment variables
config();

// Import the consolidated game generation flow
import '@/ai/flows/generate-daily-game';

