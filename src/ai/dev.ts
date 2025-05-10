import { config } from 'dotenv';
config();

import '@/ai/flows/generate-daily-word.ts';
import '@/ai/flows/generate-clue.ts';
import '@/ai/flows/generate-term-summary.ts';