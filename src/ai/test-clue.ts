import { config } from 'dotenv';
import { resolve } from 'path';
import { getAI } from '@/ai/genkit';
import { generateClue } from '@/ai/flows/generate-clue';

// Load test environment variables
config({ path: resolve(__dirname, 'test.env') });

async function testClueGeneration() {
  try {
    console.log('Starting clue generation test...');
    
    // Test cases - common AI terms
    const testTerms = ['NEURAL', 'BIAS', 'EPOCH', 'TENSOR'];
    
    for (const term of testTerms) {
      console.log(`Testing clue generation for term: ${term}`);
      const result = await generateClue({ term });
      console.log(`Generated clue: ${result.clue}`);
      console.log('-------------------');
    }

    // Test edge cases
    console.log('Testing edge cases...');
    
    // Short term
    console.log('Testing with short term: AI');
    const shortResult = await generateClue({ term: 'AI' });
    console.log(`Generated clue: ${shortResult.clue}`);
    console.log('-------------------');
    
    // Long compound term
    console.log('Testing with longer compound term: BACKPROP');
    const longResult = await generateClue({ term: 'BACKPROP' });
    console.log(`Generated clue: ${longResult.clue}`);
    console.log('-------------------');

  } catch (error) {
    console.error('Test failed:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Stack trace:', error.stack);
    }
  }
}

// Run the test
testClueGeneration(); 