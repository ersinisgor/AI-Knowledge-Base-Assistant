import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../../infrastructure/supabase/supabase.service';
import { DocumentCleaner } from './processors/document-cleaner';
import { TextChunker, Chunk } from './chunking/text-chunker';
import { OpenAIEmbeddingsService } from './embeddings/openai-embeddings';

/**
 * Input for document ingestion.
 */
export interface DocumentInput {
  content: string;
  source_type: 'pdf' | 'markdown' | 'slack' | 'github';
  fileName?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Result of document ingestion.
 */
export interface IngestionResult {
  documentId: string;
  chunkCount: number;
}

/**
 * Database row for a document.
 */
interface DocumentRow {
  id: string;
  content: string;
  source_type: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

/**
 * Service that orchestrates the complete document ingestion pipeline.
 *
 * Pipeline flow:
 * 1. Create document record in documents table
 * 2. Clean and normalize text
 * 3. Split text into chunks (500 chars, 80 overlap)
 * 4. Generate embeddings for each chunk
 * 5. Store chunks with embeddings in document_chunks table
 * 6. Return summary (document_id, chunk_count)
 */
@Injectable()
export class IngestionPipeline {
  private readonly logger = new Logger(IngestionPipeline.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly cleaner: DocumentCleaner,
    private readonly chunker: TextChunker,
    private readonly embeddings: OpenAIEmbeddingsService,
  ) {}

  /**
   * Ingest a document through the complete pipeline.
   *
   * @param input - Document content and metadata
   * @returns Ingestion result with document ID and chunk count
   */
  async ingestDocument(input: DocumentInput): Promise<IngestionResult> {
    this.logger.log(
      `Starting ingestion for document type: ${input.source_type}`,
    );

    const supabase = this.supabaseService.getClient();

    // Step 1: Create document record
    this.logger.debug('Step 1: Creating document record');
    const result = await supabase
      .from('documents')
      .insert({
        content: input.content,
        source_type: input.source_type,
        metadata: (input.metadata || {}) as Record<string, unknown> as any,
      })
      .select()
      .single();

    const document = result.data as DocumentRow | null;
    const docError = result.error;

    if (docError) {
      this.logger.error(`Failed to create document: ${docError.message}`);
      throw new Error(`Failed to create document: ${docError.message}`);
    }

    const documentData = document as DocumentRow;
    this.logger.debug(`Document created with ID: ${documentData.id}`);

    // Step 2: Clean text
    this.logger.debug('Step 2: Cleaning text');
    const cleanedText = this.cleaner.cleanText(input.content);
    this.logger.debug(`Text cleaned. Length: ${cleanedText.length} chars`);

    // Step 3: Chunk text
    this.logger.debug('Step 3: Chunking text');
    const chunks: Chunk[] = await this.chunker.chunk(cleanedText);
    this.logger.debug(`Text split into ${chunks.length} chunk(s)`);

    // Step 4: Generate embeddings
    this.logger.debug('Step 4: Generating embeddings');
    const chunkTexts = chunks.map((c) => c.content);
    const embeddingVectors = await this.embeddings.generate(chunkTexts);
    this.logger.debug(`Generated ${embeddingVectors.length} embedding(s)`);

    // Step 5: Store chunks with embeddings
    this.logger.debug('Step 5: Storing chunks in database');
    const chunkRecords = chunks.map((chunk, idx) => ({
      document_id: documentData.id,
      content: chunk.content,
      embedding: embeddingVectors[idx] as any,
      metadata: this.buildMetadata(input, chunk) as any,
      chunk_index: chunk.index,
    }));

    const { error: chunkError } = await supabase
      .from('document_chunks')
      .insert(chunkRecords);

    if (chunkError) {
      this.logger.error(`Failed to store chunks: ${chunkError.message}`);
      throw new Error(`Failed to store chunks: ${chunkError.message}`);
    }

    this.logger.log(
      `Ingestion complete. Document ID: ${documentData.id}, Chunks: ${chunks.length}`,
    );

    return {
      documentId: documentData.id,
      chunkCount: chunks.length,
    };
  }

  /**
   * Build metadata for a chunk.
   *
   * Metadata is critical for RAG as it enables:
   * - Source attribution
   * - Type filtering during retrieval
   * - Context reconstruction
   * - Citation generation
   *
   * @param input - Original document input
   * @param chunk - The chunk being processed
   * @returns Metadata object
   */
  private buildMetadata(
    input: DocumentInput,
    chunk: Chunk,
  ): Record<string, unknown> {
    return {
      source: (input.metadata?.source as string) || 'unknown',
      type: input.source_type,
      fileName: input.fileName || '',
      chunkIndex: chunk.index,
    };
  }
}
