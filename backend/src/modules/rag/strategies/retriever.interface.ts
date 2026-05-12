export interface RetrievalFilters {
  source_type?: string;
}

export interface RetrievedChunk {
  id: string;
  document_id: string;
  content: string;
  metadata: Record<string, unknown>;
  similarity: number;
}

export type RetrievalConfidence = 'high' | 'medium' | 'low';

export interface ValidationResult {
  confidence: RetrievalConfidence;
  instruction: string;
}

export interface IRetrieverStrategy {
  retrieve(
    embedding: number[],
    filters: RetrievalFilters,
    topK: number,
  ): Promise<RetrievedChunk[]>;
}
