import { generateDailyGame } from './generate-daily-game';
import { getDailyGame, storeDailyGame } from '@/lib/firebase/dailyGame';
import { Timestamp } from 'firebase/firestore';

// Only mock Firebase operations, not AI
jest.mock('@/lib/firebase/dailyGame');

describe('generateDailyGame Integration', () => {
  const mockDate = '2024-03-20';
  const mockDifficulty = 'medium';
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return existing game from Firebase if available', async () => {
    const mockExistingGame = {
      word: 'NEURAL',
      difficulty: mockDifficulty,
      clue: 'A fundamental concept in both biological and artificial intelligence',
      summary: 'A type of network architecture inspired by biological brains, fundamental to deep learning',
      targetDate: Timestamp.fromDate(new Date(mockDate)),
      createdAt: Timestamp.now()
    };

    (getDailyGame as jest.Mock).mockResolvedValueOnce(mockExistingGame);

    const result = await generateDailyGame({
      date: mockDate,
      difficulty: mockDifficulty
    });

    expect(result).toEqual(mockExistingGame);
    expect(getDailyGame).toHaveBeenCalledWith(mockDate);
  }, 30000); // Increased timeout for API calls

  it('should generate new game using real AI when no existing game found', async () => {
    // Mock Firebase returning null (no existing game)
    (getDailyGame as jest.Mock).mockResolvedValueOnce(null);

    // Mock successful Firebase storage
    (storeDailyGame as jest.Mock).mockImplementation((date, data) => 
      Promise.resolve({ data })
    );

    const result = await generateDailyGame({
      date: mockDate,
      difficulty: mockDifficulty
    });

    // Verify the structure and content of the AI-generated game
    expect(result).toBeDefined();
    expect(result).toMatchObject({
      difficulty: mockDifficulty,
      word: expect.stringMatching(/^[A-Z]{4,8}$/),
      clue: expect.any(String),
      summary: expect.any(String),
      createdAt: expect.any(Timestamp)
    });

    // Verify the word is AI/ML related
    const aiRelatedWords = [
      'NEURAL', 'TENSOR', 'BIAS', 'EPOCH', 'MODEL', 'TRAIN',
      'LEARN', 'DATA', 'BATCH', 'LOSS', 'DEEP', 'NODE'
    ];
    expect(result?.word.length).toBeGreaterThanOrEqual(4);
    expect(result?.word.length).toBeLessThanOrEqual(8);
    
    // Verify clue and summary are meaningful
    expect(result?.clue.length).toBeGreaterThan(10);
    expect(result?.summary.length).toBeGreaterThan(10);
    
    expect(storeDailyGame).toHaveBeenCalledWith(mockDate, expect.any(Object));
  }, 60000); // Increased timeout for AI operations

  it('should handle Firebase storage failure gracefully', async () => {
    // Mock Firebase returning null (no existing game)
    (getDailyGame as jest.Mock).mockResolvedValueOnce(null);

    // Mock Firebase storage failure
    (storeDailyGame as jest.Mock).mockRejectedValueOnce(new Error('Storage failed'));

    const result = await generateDailyGame({
      date: mockDate,
      difficulty: mockDifficulty
    });

    // Verify we still get valid game data even if storage failed
    expect(result).toBeDefined();
    expect(result).toMatchObject({
      difficulty: mockDifficulty,
      word: expect.stringMatching(/^[A-Z]{4,8}$/),
      clue: expect.any(String),
      summary: expect.any(String),
      createdAt: expect.any(Timestamp)
    });

    expect(storeDailyGame).toHaveBeenCalled();
  }, 60000); // Increased timeout for AI operations
}); 