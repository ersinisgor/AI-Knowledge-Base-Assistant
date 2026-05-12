export class DocumentResponseDto {
  id: string;
  content: string;
  metadata: Record<string, unknown>;
  source_type: string;
  created_at: string;
  chunk_count?: number;
  status: 'uploaded' | 'parsing' | 'chunking' | 'embedding' | 'indexed' | 'failed';
}
