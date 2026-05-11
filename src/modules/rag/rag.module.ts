import { Module } from '@nestjs/common';
import { RagPipelineService } from './rag-pipeline.service';
import { QueryRewriterService } from './query-rewriter.service';
import { RetrievalFilterService } from './retrieval-filter.service';
import { RetrievalValidatorService } from './retrieval-validator.service';
import { ContextBuilderService } from './context-builder.service';
import { PromptBuilderService } from './prompt-builder.service';
import { CitationService } from './citation.service';
import { VectorRetrieverService } from './strategies/vector-retriever.service';
import { SupabaseModule } from '../../infrastructure/supabase/supabase.module';
import { LlmModule } from '../../infrastructure/llm/llm.module';
import { EmbeddingsModule } from '../../infrastructure/embeddings/embeddings.module';

@Module({
  imports: [SupabaseModule, LlmModule, EmbeddingsModule],
  providers: [
    RagPipelineService,
    QueryRewriterService,
    RetrievalFilterService,
    RetrievalValidatorService,
    ContextBuilderService,
    PromptBuilderService,
    CitationService,
    VectorRetrieverService,
  ],
  exports: [RagPipelineService],
})
export class RagModule {}
