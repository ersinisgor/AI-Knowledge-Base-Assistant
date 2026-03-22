import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../infrastructure/supabase/supabase.service';
import { IngestContentDto } from './dto/ingest-content.dto';
import { IngestResponseDto } from './dto/ingest-response.dto';

interface DocumentRow {
  id: string;
  content: string;
  source_type: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

@Injectable()
export class IngestionService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async process(
    ingestContentDto: IngestContentDto,
  ): Promise<IngestResponseDto> {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('documents')
      .insert({
        content: ingestContentDto.content,
        source_type: ingestContentDto.source_type,
        metadata: ingestContentDto.metadata || {},
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to ingest content: ${error.message}`);
    }

    const documentData = data as DocumentRow;

    return {
      success: true,
      document_id: documentData.id,
      message: 'Content ingested successfully',
    };
  }
}
