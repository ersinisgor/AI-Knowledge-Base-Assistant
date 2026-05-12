/**
 * DTO for the response after document ingestion.
 *
 * Returns the document ID, number of chunks created,
 * and a success message.
 */
export class IngestResponseDto {
  /** Whether the ingestion was successful */
  success: boolean;

  /** The ID of the created document */
  document_id: string;

  /** The number of chunks created from the document */
  chunk_count: number;

  /** A message describing the result */
  message: string;
}
