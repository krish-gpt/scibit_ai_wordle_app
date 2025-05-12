import { generateDailyGame } from '@/ai/flows/generate-daily-game';

async function test() {
  try {
    const today = new Date().toISOString().split('T')[0];
    const result = await generateDailyGame({
      difficulty: 'medium',
      date: today
    });
    console.log('Generated game:', result);
  } catch (error) {
    console.error('Test failed:', error);
  }
}

test(); 