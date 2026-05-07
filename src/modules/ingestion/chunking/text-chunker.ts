import { Injectable } from '@nestjs/common';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';

/**
 * Represents a single text chunk with its index.
 */
export interface Chunk {
  content: string;
  index: number;
}

/**
 * Service for splitting text into semantic chunks using LangChain.
 *
 * Chunking is critical for RAG systems because:
 * 1. LLMs have limited context windows (typically 4K-128K tokens)
 * 2. Enables precise retrieval (find relevant sections, not whole docs)
 * 3. Parallel processing (embed multiple chunks simultaneously)
 *
 * Overlap ensures no context is lost at chunk boundaries.
 */
@Injectable()
export class TextChunker {
  /** Maximum characters per chunk */
  private readonly chunkSize = 500;

  /** Number of characters to overlap between chunks */
  private readonly chunkOverlap = 80;

  /**
   * Split text into semantic chunks.
   *
   * Uses RecursiveCharacterTextSplitter which tries to break at:
   * 1. Paragraphs (\n\n)
   * 2. Newlines (\n)
   * 3. Spaces ( )
   * 4. Characters (no separator)
   *
   * This hierarchical approach preserves semantic meaning.
   *
   * @param text - The text to chunk
   * @returns Array of chunks with their indices
   */
  async chunk(text: string): Promise<Chunk[]> {
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: this.chunkSize,
      chunkOverlap: this.chunkOverlap,
      separators: ['\n\n', '\n', ' ', ''],
      lengthFunction: (chunkText: string): number => chunkText.length,
    });

    const splitTexts = await splitter.splitText(text);

    return splitTexts.map((content, index) => ({
      content,
      index,
    }));
  }

  /**
   * Get the current chunk size configuration.
   */
  getChunkSize(): number {
    return this.chunkSize;
  }

  /**
   * Get the current chunk overlap configuration.
   */
  getChunkOverlap(): number {
    return this.chunkOverlap;
  }
}
