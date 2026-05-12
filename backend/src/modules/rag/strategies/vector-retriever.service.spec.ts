import { VectorRetrieverService } from './vector-retriever.service';
import { SupabaseService } from '../../../infrastructure/supabase/supabase.service';

describe('VectorRetrieverService', () => {
  let service: VectorRetrieverService;
  let mockSupabaseService: { getClient: jest.Mock };
  let mockRpc: jest.Mock;

  beforeEach(() => {
    mockRpc = jest.fn();
    mockSupabaseService = {
      getClient: jest.fn().mockReturnValue({ rpc: mockRpc }),
    };
    service = new VectorRetrieverService(
      mockSupabaseService as unknown as SupabaseService,
    );
  });

  it('should call match_documents RPC with correct params', async () => {
    const fakeEmbedding = [0.1, 0.2, 0.3];
    const fakeResults = [
      {
        id: 'chunk-1',
        document_id: 'doc-1',
        content: 'test content',
        metadata: { type: 'markdown', source: 'doc.md' },
        similarity: 0.95,
      },
    ];
    mockRpc.mockResolvedValue({ data: fakeResults, error: null });

    const result = await service.retrieve(fakeEmbedding, {}, 5);

    expect(mockRpc).toHaveBeenCalledWith('match_documents', {
      query_embedding: `[${fakeEmbedding.join(',')}]`,
      match_count: 5,
      filter: {},
    });
    expect(result).toEqual([
      {
        id: 'chunk-1',
        document_id: 'doc-1',
        content: 'test content',
        metadata: { type: 'markdown', source: 'doc.md' },
        similarity: 0.95,
      },
    ]);
  });

  it('should apply source_type filter', async () => {
    mockRpc.mockResolvedValue({ data: [], error: null });

    await service.retrieve([0.1], { source_type: 'pdf' }, 3);

    expect(mockRpc).toHaveBeenCalledWith('match_documents', {
      query_embedding: '[0.1]',
      match_count: 3,
      filter: { source_type: 'pdf' },
    });
  });

  it('should throw on Supabase error', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'RPC failed' } });

    await expect(service.retrieve([0.1], {}, 5)).rejects.toThrow(
      'Vector search failed: RPC failed',
    );
  });
});
