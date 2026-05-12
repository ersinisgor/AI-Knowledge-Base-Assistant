export interface SourceCitation {
  document_name: string;
  source_type: string;
  similarity: number;
  chunk_index: number;
}

export interface RagResponseDto {
  answer: string;
  sources: SourceCitation[];
  session_id: string;
  tokens_used: number;
  retrieval_confidence: string;
}
