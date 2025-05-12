import { config } from 'dotenv';
import { resolve } from 'path';
import { generateTermSummary } from '@/ai/flows/generate-term-summary';

// Load test environment variables
config({ path: resolve(__dirname, 'test.env') });

async function testTermSummaryGeneration() {
  try {
    console.log('Starting term summary generation test...');
    
    // Test cases - common AI terms
    const testTerms = ['NEURAL', 'BIAS', 'EPOCH', 'TENSOR'];
    
    for (const term of testTerms) {
      console.log(`\nTesting term summary generation for: ${term}`);
      const result = await generateTermSummary({ term });
      console.log('Generated summary:', result.summary);
      console.log('Progress:', result.progress);
      console.log('-------------------');
    }

    // Test edge cases
    console.log('\nTesting edge cases...');
    
    // Short term
    console.log('\nTesting with short term: AI');
    const shortResult = await generateTermSummary({ term: 'AI' });
    console.log('Generated summary:', shortResult.summary);
    console.log('Progress:', shortResult.progress);
    console.log('-------------------');
    
    // Compound term
    console.log('\nTesting with compound term: BACKPROP');
    const compoundResult = await generateTermSummary({ term: 'BACKPROP' });
    console.log('Generated summary:', compoundResult.summary);
    console.log('Progress:', compoundResult.progress);
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
testTermSummaryGeneration(); 