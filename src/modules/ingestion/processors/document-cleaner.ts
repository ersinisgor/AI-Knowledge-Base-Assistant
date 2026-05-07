import { Injectable } from '@nestjs/common';

/**
 * Service for cleaning and normalizing document text before processing.
 *
 * Clean text produces better embeddings and more consistent chunks.
 * This service handles text normalization and sanitization.
 */
@Injectable()
export class DocumentCleaner {
  /**
   * Clean and normalize text for better chunking and embeddings.
   *
   * Operations performed:
   * - Normalize line endings (\r\n -> \n)
   * - Replace tabs with spaces
   * - Collapse multiple whitespace into single space
   * - Normalize paragraph breaks
   * - Remove leading/trailing whitespace
   *
   * @param text - The raw text to clean
   * @returns Cleaned and normalized text
   */
  cleanText(text: string): string {
    return text
      .replace(/\r\n/g, '\n') // Normalize Windows line endings to Unix
      .replace(/\t/g, ' ') // Replace tabs with spaces
      .replace(/\s+/g, ' ') // Collapse multiple whitespace into single space
      .replace(/\n\s*\n/g, '\n\n') // Normalize paragraph breaks (exactly 2 newlines)
      .trim(); // Remove leading/trailing whitespace
  }

  /**
   * Remove special control characters from text.
   *
   * Useful for processing text from noisy sources like PDFs.
   * This removes ASCII control characters (0-31 and 127).
   *
   * @param text - The text to sanitize
   * @returns Text with control characters removed
   */
  sanitizeText(text: string): string {
    // eslint-disable-next-line no-control-regex
    return text.replace(/[\x00-\x1F\x7F]/g, '');
  }

  /**
   * Comprehensive cleaning: clean and sanitize text.
   *
   * @param text - The raw text to process
   * @returns Fully cleaned and sanitized text
   */
  cleanAndSanitize(text: string): string {
    return this.sanitizeText(this.cleanText(text));
  }
}
