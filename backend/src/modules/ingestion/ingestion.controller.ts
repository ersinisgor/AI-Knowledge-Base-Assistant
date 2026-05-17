import { Controller, Post, Body, HttpCode, HttpStatus, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { IngestionService } from './ingestion.service';
import { IngestionPipeline, DocumentInput } from './ingestion.pipeline';
import { IngestContentDto } from './dto/ingest-content.dto';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { IngestResponseDto } from './dto/ingest-response.dto';
import pdfParse from 'pdf-parse';

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

  @Post('upload-pdf')
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.CREATED)
  async uploadPdf(
    @UploadedFile() file: { buffer: Buffer; originalname: string; mimetype: string; size: number },
  ): Promise<IngestResponseDto> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const parsed = await pdfParse(file.buffer);
    const text = parsed.text?.trim();

    if (!text || text.length < 10) {
      throw new BadRequestException('Could not extract text from PDF');
    }

    const input: DocumentInput = {
      content: text,
      source_type: 'pdf',
      fileName: file.originalname,
      metadata: { fileName: file.originalname },
    };

    const result = await this.ingestionPipeline.ingestDocument(input);

    return {
      success: true,
      document_id: result.documentId,
      chunk_count: result.chunkCount,
      message: `PDF processed successfully. Created ${result.chunkCount} chunk(s).`,
    };
  }
}
