import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../../../infrastructure/supabase/supabase.service';
import { IRetrieverStrategy, RetrievedChunk, RetrievalFilters } from './retriever.interface';

@Injectable()
export class VectorRetrieverService implements IRetrieverStrategy {
  private readonly logger = new Logger(VectorRetrieverService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  async retrieve(
    embedding: number[],
    filters: RetrievalFilters,
    topK: number,
  ): Promise<RetrievedChunk[]> {
    this.logger.debug(`Retrieving top ${topK} chunks`);

    const supabaseFilter: Record<string, string> = {};
    if (filters.source_type) {
      supabaseFilter.source_type = filters.source_type;
    }

    const { data, error } = await this.supabaseService
      .getClient()
      .rpc('match_documents', {
        query_embedding: `[${embedding.join(',')}]`,
        match_count: topK,
        filter: supabaseFilter,
      });

    if (error) {
      this.logger.error(`Vector search failed: ${error.message}`);
      throw new Error(`Vector search failed: ${error.message}`);
    }

    this.logger.debug(`Retrieved ${(data as RetrievedChunk[]).length} chunks`);
    return data as RetrievedChunk[];
  }
}
