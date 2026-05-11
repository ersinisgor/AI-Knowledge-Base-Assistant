import { RetrievalValidatorService } from './retrieval-validator.service';
import { RetrievedChunk } from './strategies/retriever.interface';

describe('RetrievalValidatorService', () => {
  let service: RetrievalValidatorService;

  beforeEach(() => {
    service = new RetrievalValidatorService();
  });

  const makeChunk = (similarity: number): RetrievedChunk => ({
    id: 'chunk-id',
    document_id: 'doc-id',
    content: 'test content',
    metadata: {},
    similarity,
  });

  it('should return HIGH confidence when top score > 0.85 and 3+ chunks', () => {
    const chunks = [makeChunk(0.92), makeChunk(0.88), makeChunk(0.85)];
    const result = service.validate(chunks);
    expect(result.confidence).toBe('high');
    expect(result.instruction).toContain('Answer normally');
  });

  it('should return MEDIUM confidence when top score > 0.7 and 2+ chunks', () => {
    const chunks = [makeChunk(0.78), makeChunk(0.72)];
    const result = service.validate(chunks);
    expect(result.confidence).toBe('medium');
    expect(result.instruction).toContain('sources are limited');
  });

  it('should return LOW confidence when top score < 0.7', () => {
    const chunks = [makeChunk(0.65)];
    const result = service.validate(chunks);
    expect(result.confidence).toBe('low');
    expect(result.instruction).toContain('cautiously');
  });

  it('should return LOW confidence when fewer than 2 chunks', () => {
    const chunks = [makeChunk(0.9)];
    const result = service.validate(chunks);
    expect(result.confidence).toBe('low');
  });

  it('should return LOW confidence for empty chunks', () => {
    const result = service.validate([]);
    expect(result.confidence).toBe('low');
    expect(result.instruction).toContain('No relevant information');
  });
});
