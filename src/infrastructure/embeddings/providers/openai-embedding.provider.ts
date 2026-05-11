import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAIEmbeddings } from '@langchain/openai';
import { IEmbeddingProvider } from './embedding-provider.interface';

@Injectable()
export class OpenAIEmbeddingProvider implements IEmbeddingProvider {
  private readonly logger = new Logger(OpenAIEmbeddingProvider.name);
  private readonly embeddings: OpenAIEmbeddings;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is required');
    }

    this.embeddings = new OpenAIEmbeddings({
      apiKey,
      modelName: 'text-embedding-3-small',
      dimensions: 1536,
    });
  }

  async embed(text: string): Promise<number[]> {
    try {
      return await this.embeddings.embedQuery(text);
    } catch (error) {
      this.logger.error(
        `Failed to generate embedding: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];
    try {
      return await this.embeddings.embedDocuments(texts);
    } catch (error) {
      this.logger.error(
        `Failed to generate batch embeddings: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }
}
