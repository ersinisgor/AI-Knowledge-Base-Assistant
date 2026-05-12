export class DocumentResponseDto {
  id: string;
  content: string;
  metadata: Record<string, unknown>;
  source_type: string;
  created_at: string;
}
