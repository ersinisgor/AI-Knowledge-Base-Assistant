import { ContextBuilderService } from './context-builder.service';
import { RetrievedChunk } from './strategies/retriever.interface';
import { TokenEstimatorService } from '../../infrastructure/llm/token-estimator.service';
import { ChatMessage } from '../../infrastructure/llm/providers/llm-provider.interface';

describe('ContextBuilderService', () => {
  let service: ContextBuilderService;
  let tokenEstimator: TokenEstimatorService;

  beforeEach(() => {
    tokenEstimator = new TokenEstimatorService();
    service = new ContextBuilderService(tokenEstimator);
  });

  const makeChunk = (name: string, similarity: number): RetrievedChunk => ({
    id: 'chunk-id',
    document_id: 'doc-id',
    content: `Content from ${name}`,
    metadata: { type: 'markdown', source: name },
    similarity,
  });

  describe('buildContext', () => {
    it('should assemble context with all sections', () => {
      const chunks = [makeChunk('doc1.md', 0.9)];
      const history: ChatMessage[] = [
        { role: 'user', content: 'previous question' },
        { role: 'assistant', content: 'previous answer' },
      ];

      const result = service.buildContext({
        systemPrompt: 'You are an assistant.',
        chunks,
        history,
        confidenceInstruction: 'Answer normally.',
        userQuestion: 'What is this?',
      });

      expect(result).toContain('=== SYSTEM INSTRUCTIONS ===');
      expect(result).toContain('=== CONVERSATION HISTORY ===');
      expect(result).toContain('=== RETRIEVED KNOWLEDGE ===');
      expect(result).toContain('=== RETRIEVAL CONFIDENCE ===');
      expect(result).toContain('=== USER QUESTION ===');
      expect(result).toContain('You are an assistant.');
      expect(result).toContain('Content from doc1.md');
      expect(result).toContain('What is this?');
    });

    it('should include chunk metadata in formatting', () => {
      const chunks = [makeChunk('test.md', 0.92)];

      const result = service.buildContext({
        systemPrompt: 'test',
        chunks,
        history: [],
        confidenceInstruction: '',
        userQuestion: 'question',
      });

      expect(result).toContain('Document: test.md');
      expect(result).toContain('Similarity: 0.92');
    });

    it('should handle empty chunks gracefully', () => {
      const result = service.buildContext({
        systemPrompt: 'test',
        chunks: [],
        history: [],
        confidenceInstruction: '',
        userQuestion: 'question',
      });

      expect(result).toContain('No relevant documents were found.');
    });
  });
});
