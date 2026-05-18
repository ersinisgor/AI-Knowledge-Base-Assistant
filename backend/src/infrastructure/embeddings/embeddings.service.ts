import { Injectable } from '@nestjs/common';
import { IEmbeddingProvider } from './providers/embedding-provider.interface';
import { OpenAIEmbeddingProvider } from './providers/openai-embedding.provider';

@Injectable()
export class EmbeddingsService {
  private readonly provider: IEmbeddingProvider;

  constructor(private readonly openAIEmbeddingProvider: OpenAIEmbeddingProvider) {
    this.provider = this.openAIEmbeddingProvider;
  }

  async embed(text: string): Promise<number[]> {
    return this.provider.embed(text);
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    return this.provider.embedBatch(texts);
  }
}
