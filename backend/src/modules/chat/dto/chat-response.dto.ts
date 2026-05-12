import { SourceCitation, RetrievalMetadata } from '../../rag/dto/rag-response.dto';

export class ChatResponseDto {
  answer: string;
  sources: SourceCitation[];
  session_id: string;
  tokens_used: number;
  retrieval_confidence: 'high' | 'medium' | 'low';
  retrieval_metadata?: RetrievalMetadata;
  model?: string;
  latency_ms?: number;
}
