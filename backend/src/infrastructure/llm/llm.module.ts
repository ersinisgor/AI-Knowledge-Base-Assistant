import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OpenAIProvider } from './providers/openai.provider';
import { LlmService } from './llm.service';
import { TokenEstimatorService } from './token-estimator.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [OpenAIProvider, LlmService, TokenEstimatorService],
  exports: [LlmService, TokenEstimatorService],
})
export class LlmModule {}
