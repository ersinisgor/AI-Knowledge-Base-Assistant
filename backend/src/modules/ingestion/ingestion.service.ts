import { Injectable } from '@nestjs/common';
import { IngestionPipeline, DocumentInput } from './ingestion.pipeline';
import { IngestContentDto } from './dto/ingest-content.dto';
import { IngestResponseDto } from './dto/ingest-response.dto';

/**
 * Service for handling document ingestion.
 *
 * This service coordinates the ingestion pipeline which processes
 * documents, generates embeddings, and stores chunks.
 */
@Injectable()
export class IngestionService {
  constructor(private readonly ingestionPipeline: IngestionPipeline) {}

  /**
   * Process content through the ingestion pipeline.
   *
   * This method accepts the legacy IngestContentDto for backward compatibility
   * and converts it to the new DocumentInput format for the pipeline.
   *
   * @param ingestContentDto - The content to ingest
   * @returns Response with document ID and chunk count
   */
  async process(
    ingestContentDto: IngestContentDto,
  ): Promise<IngestResponseDto> {
    const input: DocumentInput = {
      content: ingestContentDto.content,
      source_type: ingestContentDto.source_type,
      metadata: ingestContentDto.metadata,
    };

    const result = await this.ingestionPipeline.ingestDocument(input);

    return {
      success: true,
      document_id: result.documentId,
      chunk_count: result.chunkCount,
      message: `Document ingested successfully. Created ${result.chunkCount} chunk(s).`,
    };
  }

  /**
   * Process a document upload with file name.
   *
   * This is the new method for uploading documents with additional metadata.
   *
   * @param input - Document input with optional file name
   * @returns Response with document ID and chunk count
   */
  async uploadDocument(input: DocumentInput): Promise<IngestResponseDto> {
    const result = await this.ingestionPipeline.ingestDocument(input);

    return {
      success: true,
      document_id: result.documentId,
      chunk_count: result.chunkCount,
      message: `Document ingested successfully. Created ${result.chunkCount} chunk(s).`,
    };
  }
}
