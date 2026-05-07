import { Module } from '@nestjs/common';
import { IngestionController } from './ingestion.controller';
import { IngestionService } from './ingestion.service';
import { IngestionPipeline } from './ingestion.pipeline';
import { DocumentCleaner } from './processors/document-cleaner';
import { TextChunker } from './chunking/text-chunker';
import { OpenAIEmbeddingsService } from './embeddings/openai-embeddings';
import { SupabaseModule } from '../../infrastructure/supabase/supabase.module';

/**
 * Module for document ingestion functionality.
 *
 * This module handles the complete document ingestion pipeline:
 * - Text cleaning and normalization
 * - Text chunking with overlap
 * - Embedding generation using OpenAI
 * - Storing chunks with embeddings in Supabase
 */
@Module({
  imports: [SupabaseModule],
  controllers: [IngestionController],
  providers: [
    IngestionService,
    IngestionPipeline,
    DocumentCleaner,
    TextChunker,
    OpenAIEmbeddingsService,
  ],
  exports: [
    IngestionService,
    IngestionPipeline,
    DocumentCleaner,
    TextChunker,
    OpenAIEmbeddingsService,
  ],
})
export class IngestionModule {}
