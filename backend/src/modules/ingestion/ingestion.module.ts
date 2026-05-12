import { Module } from '@nestjs/common';
import { IngestionController } from './ingestion.controller';
import { IngestionService } from './ingestion.service';
import { IngestionPipeline } from './ingestion.pipeline';
import { DocumentCleaner } from './processors/document-cleaner';
import { TextChunker } from './chunking/text-chunker';
import { SupabaseModule } from '../../infrastructure/supabase/supabase.module';
import { EmbeddingsModule } from '../../infrastructure/embeddings/embeddings.module';

@Module({
  imports: [SupabaseModule, EmbeddingsModule],
  controllers: [IngestionController],
  providers: [
    IngestionService,
    IngestionPipeline,
    DocumentCleaner,
    TextChunker,
  ],
  exports: [IngestionService, IngestionPipeline],
})
export class IngestionModule {}
