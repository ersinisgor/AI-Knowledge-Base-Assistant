import { TokenEstimatorService } from './token-estimator.service';

describe('TokenEstimatorService', () => {
  let service: TokenEstimatorService;

  beforeEach(() => {
    service = new TokenEstimatorService();
  });

  describe('estimateTokens', () => {
    it('should estimate ~1 token per 4 characters for English text', () => {
      const text = 'Hello world, this is a test message';
      const tokens = service.estimateTokens(text);
      expect(tokens).toBeGreaterThan(5);
      expect(tokens).toBeLessThan(20);
    });

    it('should return 0 for empty string', () => {
      expect(service.estimateTokens('')).toBe(0);
    });

    it('should handle long text', () => {
      const text = 'a'.repeat(4000);
      const tokens = service.estimateTokens(text);
      expect(tokens).toBe(1000);
    });
  });

  describe('estimateMessagesTokens', () => {
    it('should sum tokens across all messages plus overhead', () => {
      const messages = [
        { role: 'system' as const, content: 'You are an assistant' },
        { role: 'user' as const, content: 'Hello' },
      ];
      const tokens = service.estimateMessagesTokens(messages);
      const sumOfContents = service.estimateTokens('You are an assistant') + service.estimateTokens('Hello');
      expect(tokens).toBe(sumOfContents + 2 * 4);
    });
  });
});
