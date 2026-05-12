import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../infrastructure/supabase/supabase.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { DocumentResponseDto } from './dto/document-response.dto';

interface DocumentRow {
  id: string;
  content: string;
  source_type: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

@Injectable()
export class DocumentsService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async create(
    createDocumentDto: CreateDocumentDto,
  ): Promise<DocumentResponseDto> {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('documents')
      .insert({
        content: createDocumentDto.content,
        source_type: createDocumentDto.source_type,
        metadata: (createDocumentDto.metadata || {}) as Record<string, unknown> as any,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create document: ${error.message}`);
    }

    const documentData = data as DocumentRow;

    return {
      id: documentData.id,
      content: documentData.content,
      source_type: documentData.source_type,
      metadata: documentData.metadata,
      created_at: documentData.created_at,
      status: 'uploaded' as const,
    };
  }

  async findAll(): Promise<DocumentResponseDto[]> {
    const { data: documents, error: docError } = await this.supabaseService.getClient()
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false });

    if (docError) {
      throw new Error(`Failed to fetch documents: ${docError.message}`);
    }

    const documentsWithStats = await Promise.all(
      (documents || []).map(async (doc) => {
        const { count } = await this.supabaseService.getClient()
          .from('document_chunks')
          .select('*', { count: 'exact', head: true })
          .eq('document_id', doc.id);

        return {
          id: doc.id,
          content: doc.content,
          source_type: doc.source_type,
          metadata: (doc.metadata || {}) as Record<string, unknown>,
          created_at: doc.created_at ?? '',
          chunk_count: count || 0,
          status: (count && count > 0 ? 'indexed' : 'uploaded') as 'indexed' | 'uploaded',
        };
      })
    );

    return documentsWithStats;
  }
}
