import { SourceCitation } from '../../rag/dto/rag-response.dto';

export class ChatResponseDto {
  answer: string;
  sources: SourceCitation[];
  session_id: string;
  tokens_used: number;
  retrieval_confidence: 'high' | 'medium' | 'low';
}
