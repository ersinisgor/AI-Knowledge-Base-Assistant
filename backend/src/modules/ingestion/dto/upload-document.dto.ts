import {
  IsString,
  IsOptional,
  IsObject,
  MinLength,
  IsEnum,
  IsNotEmpty,
} from 'class-validator';

/**
 * DTO for uploading a document for ingestion.
 *
 * This validates the input for document upload, ensuring
 * the content and source_type are properly formatted.
 */
export class UploadDocumentDto {
  /**
   * The content of the document to ingest.
   * Must be at least 1 character.
   */
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  content: string;

  /**
   * The type of source for the document.
   * Must be one of the supported source types.
   */
  @IsString()
  @IsEnum(['pdf', 'markdown', 'slack', 'github'])
  source_type: 'pdf' | 'markdown' | 'slack' | 'github';

  /**
   * Optional file name for the document.
   * Used for metadata and tracking.
   */
  @IsString()
  @IsOptional()
  fileName?: string;

  /**
   * Optional additional metadata.
   * Can include any custom fields needed for your use case.
   */
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
