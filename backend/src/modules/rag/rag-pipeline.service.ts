import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { LlmService } from '../../infrastructure/llm/llm.service';
import { TokenEstimatorService } from '../../infrastructure/llm/token-estimator.service';
import { EmbeddingsService } from '../../infrastructure/embeddings/embeddings.service';
import { ChatMessage } from '../../infrastructure/llm/providers/llm-provider.interface';
import { QueryRewriterService } from './query-rewriter.service';
import { RetrievalFilterService } from './retrieval-filter.service';
import { RetrievalValidatorService } from './retrieval-validator.service';
import { ContextBuilderService } from './context-builder.service';
import { PromptBuilderService } from './prompt-builder.service';
import { CitationService } from './citation.service';
import { VectorRetrieverService } from './strategies/vector-retriever.service';
import { RetrievedChunk, RetrievalConfidence } from './strategies/retriever.interface';
import { SourceCitation, RetrievalMetadata } from './dto/rag-response.dto';

export interface PipelineInput {
  question: string;
  history: ChatMessage[];
  topK?: number;
}

export interface PipelineOutput {
  answer: string;
  sources: SourceCitation[];
  tokensUsed: number;
  retrievalConfidence: RetrievalConfidence;
  metrics: Record<string, number>;
  retrieval_metadata?: RetrievalMetadata;
  model?: string;
  latency_ms?: number;
}

@Injectable()
export class RagPipelineService {
  private readonly logger = new Logger(RagPipelineService.name);
  private readonly systemPrompt: string;

  constructor(
    private readonly queryRewriter: QueryRewriterService,
    private readonly embeddingsService: EmbeddingsService,
    private readonly retrievalFilter: RetrievalFilterService,
    private readonly retriever: VectorRetrieverService,
    private readonly retrievalValidator: RetrievalValidatorService,
    private readonly contextBuilder: ContextBuilderService,
    private readonly promptBuilder: PromptBuilderService,
    private readonly citationService: CitationService,
    private readonly llmService: LlmService,
    private readonly tokenEstimator: TokenEstimatorService,
  ) {
    const promptPath = path.join(
      __dirname,
      '..',
      '..',
      '..',
      'infrastructure',
      'langchain',
      'prompts',
      'system',
      'default.md',
    );
    this.systemPrompt = fs.readFileSync(promptPath, 'utf-8');
  }

  async query(input: PipelineInput): Promise<PipelineOutput> {
    const metrics: Record<string, number> = {};
    const totalStart = Date.now();

    // Step a: Query rewrite
    const rewriteStart = Date.now();
    const rewrittenQuery = await this.queryRewriter.rewrite(
      input.question,
      input.history,
    );
    metrics.query_rewrite_ms = Date.now() - rewriteStart;

    // Step b: Embed the rewritten query
    const embedStart = Date.now();
    const embedding = await this.embeddingsService.embed(rewrittenQuery);
    metrics.embedding_ms = Date.now() - embedStart;

    // Step c-d: Build filters and retrieve
    const filters = this.retrievalFilter.buildFilters({});
    const retrievalStart = Date.now();
    let chunks: RetrievedChunk[];
    try {
      chunks = await this.retriever.retrieve(embedding, filters, input.topK || 5);
    } catch (error) {
      this.logger.error(`Retrieval failed: ${error instanceof Error ? error.message : String(error)}`);
      chunks = [];
    }
    metrics.retrieval_ms = Date.now() - retrievalStart;

    // Step e: Validate retrieval
    const validation = this.retrievalValidator.validate(chunks);

    // Step f: Build context
    const context = this.contextBuilder.buildContext({
      systemPrompt: this.systemPrompt,
      chunks,
      history: input.history,
      confidenceInstruction: validation.instruction,
      userQuestion: input.question,
    });

    // Step g: Build prompt messages
    const messages = this.promptBuilder.buildMessages(
      this.systemPrompt,
      context,
      input.question,
    );

    // Step h: LLM completion
    const llmStart = Date.now();
    const llmResponse = await this.llmService.chat(messages, {
      temperature: 0.3,
    });
    metrics.llm_ms = Date.now() - llmStart;

    // Step i: Format citations
    const sources = this.citationService.formatCitations(chunks);

    metrics.total_ms = Date.now() - totalStart;

    this.logger.log(
      `Pipeline complete: confidence=${validation.confidence}, chunks=${chunks.length}, tokens=${llmResponse.tokensUsed.total}, total_ms=${metrics.total_ms}`,
    );

    const retrievalMetadata: RetrievalMetadata = {
      strategy: 'Hybrid (BM25 + Vector)',
      latency_ms: Date.now() - totalStart,
      sources_found: sources.length,
      confidence: validation.confidence,
      rewritten_query: rewrittenQuery,
    };

    return {
      answer: llmResponse.content,
      sources,
      tokensUsed: llmResponse.tokensUsed.total,
      retrievalConfidence: validation.confidence,
      metrics,
      retrieval_metadata: retrievalMetadata,
      model: 'GPT-4.1-mini',
      latency_ms: Date.now() - totalStart,
    };
  }
}
