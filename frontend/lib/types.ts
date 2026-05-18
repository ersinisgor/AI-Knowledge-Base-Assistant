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

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  sources?: SourceCitation[];
  retrieval_metadata?: RetrievalMetadata;
  model?: string;
  latency_ms?: number;
  tokens_used?: number;
  retrieval_confidence?: 'high' | 'medium' | 'low';
}

export interface ChatResponse {
  answer: string;
  sources: SourceCitation[];
  session_id: string;
  tokens_used: number;
  retrieval_confidence: 'high' | 'medium' | 'low';
  retrieval_metadata?: RetrievalMetadata;
  model?: string;
  latency_ms?: number;
}

export interface ChatSession {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  content: string;
  metadata: Record<string, unknown>;
  source_type: string;
  created_at: string;
  chunk_count?: number;
  status: 'uploaded' | 'parsing' | 'chunking' | 'embedding' | 'indexed' | 'failed';
}

export interface IngestResponse {
  success: boolean;
  document_id: string;
  chunk_count: number;
  message: string;
}

export type IngestionStatus = 'uploaded' | 'parsing' | 'chunking' | 'embedding' | 'indexed' | 'failed';
