import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OpenAIEmbeddingProvider } from './providers/openai-embedding.provider';
import { EmbeddingsService } from './embeddings.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [OpenAIEmbeddingProvider, EmbeddingsService],
  exports: [EmbeddingsService],
})
export class EmbeddingsModule {}
