import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAIEmbeddings } from '@langchain/openai';

/**
 * Service for generating OpenAI embeddings for text chunks.
 *
 * Uses text-embedding-3-small model which produces 1536-dimensional vectors.
 * This service handles both batch and single text embedding generation.
 */
@Injectable()
export class OpenAIEmbeddingsService {
  private readonly logger = new Logger(OpenAIEmbeddingsService.name);
  private embeddings: OpenAIEmbeddings;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');

    if (!apiKey) {
      this.logger.error(
        'OPENAI_API_KEY is not configured. Please set it in your environment.',
      );
      throw new Error('OPENAI_API_KEY is required');
    }

    this.embeddings = new OpenAIEmbeddings({
      apiKey,
      modelName: 'text-embedding-3-small', // 1536 dimensions, cost-effective
      dimensions: 1536,
    });

    this.logger.log(
      'OpenAI Embeddings service initialized with text-embedding-3-small',
    );
  }

  /**
   * Generate embeddings for multiple texts using batch processing.
   * More efficient than generating one at a time.
   *
   * @param texts - Array of texts to embed
   * @returns Array of embedding vectors (each is an array of numbers)
   */
  async generate(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) {
      return [];
    }

    this.logger.debug(`Generating embeddings for ${texts.length} text(s)`);

    try {
      const vectors = await this.embeddings.embedDocuments(texts);
      this.logger.debug(
        `Successfully generated ${vectors.length} embedding(s)`,
      );
      return vectors;
    } catch (error) {
      this.logger.error(
        `Failed to generate embeddings: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Generate an embedding for a single text.
   *
   * @param text - The text to embed
   * @returns Single embedding vector (array of numbers)
   */
  async generateSingle(text: string): Promise<number[]> {
    this.logger.debug('Generating embedding for single text');

    try {
      const vector = await this.embeddings.embedQuery(text);
      this.logger.debug('Successfully generated single embedding');
      return vector;
    } catch (error) {
      this.logger.error(
        `Failed to generate embedding: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Get the dimension of the embedding vectors.
   */
  getDimensions(): number {
    return 1536; // text-embedding-3-small produces 1536-dimensional vectors
  }
}
