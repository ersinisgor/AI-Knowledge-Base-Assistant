import { CitationService } from './citation.service';
import { RetrievedChunk } from './strategies/retriever.interface';

describe('CitationService', () => {
  let service: CitationService;

  beforeEach(() => {
    service = new CitationService();
  });

  const makeChunk = (source: string, type: string, similarity: number, chunkIndex: number): RetrievedChunk => ({
    id: 'chunk-id',
    document_id: 'doc-id',
    content: 'content',
    metadata: { source, type, chunkIndex },
    similarity,
  });

  describe('formatCitations', () => {
    it('should format chunks into source citations', () => {
      const chunks = [makeChunk('doc1.md', 'markdown', 0.9, 0)];
      const result = service.formatCitations(chunks);
      expect(result).toEqual([
        {
          document_name: 'doc1.md',
          source_type: 'markdown',
          similarity: 0.9,
          chunk_index: 0,
        },
      ]);
    });

    it('should deduplicate citations by document name', () => {
      const chunks = [
        makeChunk('doc1.md', 'markdown', 0.9, 0),
        makeChunk('doc1.md', 'markdown', 0.85, 1),
        makeChunk('doc2.md', 'pdf', 0.8, 0),
      ];
      const result = service.formatCitations(chunks);
      expect(result).toHaveLength(2);
      expect(result[0].document_name).toBe('doc1.md');
      expect(result[1].document_name).toBe('doc2.md');
    });

    it('should return empty array for empty chunks', () => {
      expect(service.formatCitations([])).toEqual([]);
    });
  });
});
