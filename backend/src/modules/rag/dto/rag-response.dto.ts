export interface SourceCitation {
  document_name: string;
  source_type: string;
  similarity: number;
  chunk_index: number;
  chunk_content?: string;
}

export interface RetrievalMetadata {
  strategy: string;
  latency_ms: number;
  sources_found: number;
  confidence: 'high' | 'medium' | 'low';
  rewritten_query?: string;
}

export interface RagResponseDto {
  answer: string;
  sources: SourceCitation[];
  session_id: string;
  tokens_used: number;
  retrieval_confidence: 'high' | 'medium' | 'low';
  retrieval_metadata?: RetrievalMetadata;
  model?: string;
  latency_ms?: number;
}
