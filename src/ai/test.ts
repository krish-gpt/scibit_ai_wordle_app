import { getAI } from '@/ai/genkit';
import { generateDailyWord } from '@/ai/flows/generate-daily-word';

async function testWordGeneration() {
  try {
    // Initialize AI with secret from Google Secret Manager
    const ai = await getAI();
    
    // Test with different difficulty levels
    const difficulties = ['easy', 'medium', 'hard'] as const;
    
    for (const difficulty of difficulties) {
      console.log(`Testing with difficulty: ${difficulty}`);
      const result = await generateDailyWord({ difficulty });
      console.log(`Generated word: ${result.word}`);
      console.log('-------------------');
    }
  } catch (error) {
    console.error('Test failed:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Stack trace:', error.stack);
    }
  }
}

// Run the test
console.log('Starting word generation test...');
testWordGeneration()
  .then(() => console.log('Test completed'))
  .catch(error => console.error('Test failed with error:', error)); 