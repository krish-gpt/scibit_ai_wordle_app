import { Difficulty } from '../firebase/types';

// Predefined AI-related words categorized by difficulty
export const FALLBACK_WORDS: Record<Difficulty, string[]> = {
  easy: [
    'BIAS',
    'DATA',
    'LOSS',
    'NODE',
    'RATE',
    'TEST',
    'TRAIN',
    'LEARN'
  ],
  medium: [
    'NEURAL',
    'TENSOR',
    'EPOCH',
    'BATCH',
    'MODEL',
    'LAYER',
    'EMBED',
    'PARSE'
  ],
  hard: [
    'ENTROPY',
    'DROPOUT',
    'SIGMOID',
    'KERNEL',
    'LAMBDA',
    'BAYES',
    'CONVEX',
    'SPARSE'
  ]
};

// Predefined clues and summaries for fallback words
export const FALLBACK_CONTENT: Record<string, {
  clues: {
    technical: string;
    contextual: string;
    historical: string;
  };
  summary: {
    definition: string;
    importance: string;
    examples: string[];
  };
}> = {
  'BIAS': {
    clues: {
      technical: "Systematic error in model predictions",
      contextual: "When a model consistently favors certain outcomes",
      historical: "Early challenge in machine learning, identified in 1950s"
    },
    summary: {
      definition: "Systematic deviation in model predictions from true values",
      importance: "Critical for ensuring fair and accurate AI systems",
      examples: [
        "Facial recognition bias across demographics",
        "Language model bias in text generation"
      ]
    }
  },
  // Add more predefined content as needed
}; 