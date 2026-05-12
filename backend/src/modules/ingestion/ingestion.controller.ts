import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { IngestionService } from './ingestion.service';
import { IngestionPipeline, DocumentInput } from './ingestion.pipeline';
import { IngestContentDto } from './dto/ingest-content.dto';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { IngestResponseDto } from './dto/ingest-response.dto';

/**
 * Controller for handling document ingestion requests.
 *
 * Provides endpoints for processing documents through the
 * ingestion pipeline (chunking, embedding generation, storage).
 */
@Controller('ingestion')
export class IngestionController {
  constructor(
    private readonly ingestionService: IngestionService,
    private readonly ingestionPipeline: IngestionPipeline,
  ) {}

  /**
   * Process content through the ingestion pipeline.
   *
   * This endpoint maintains backward compatibility with the original API.
   * Content is processed, chunked, embedded, and stored in the database.
   *
   * @param ingestContentDto - The content to ingest
   * @returns Response with document ID and chunk count
   */
  @Post('process')
  @HttpCode(HttpStatus.CREATED)
  async process(
    @Body() ingestContentDto: IngestContentDto,
  ): Promise<IngestResponseDto> {
    return this.ingestionService.process(ingestContentDto);
  }

  /**
   * Upload and process a document.
   *
   * This is the new endpoint for document upload with enhanced metadata support.
   * Accepts file name and processes through the full ingestion pipeline.
   *
   * @param uploadDocumentDto - The document to upload
   * @returns Response with document ID and chunk count
   */
  @Post('upload')
  @HttpCode(HttpStatus.CREATED)
  async upload(
    @Body() uploadDocumentDto: UploadDocumentDto,
  ): Promise<IngestResponseDto> {
    const input: DocumentInput = {
      content: uploadDocumentDto.content,
      source_type: uploadDocumentDto.source_type,
      fileName: uploadDocumentDto.fileName,
      metadata: uploadDocumentDto.metadata,
    };

    const result = await this.ingestionPipeline.ingestDocument(input);

    return {
      success: true,
      document_id: result.documentId,
      chunk_count: result.chunkCount,
      message: `Document uploaded successfully. Created ${result.chunkCount} chunk(s).`,
    };
  }
}
