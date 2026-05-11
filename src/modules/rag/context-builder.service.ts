import { Injectable } from '@nestjs/common';
import { RetrievedChunk } from './strategies/retriever.interface';
import { ChatMessage } from '../../infrastructure/llm/providers/llm-provider.interface';
import { TokenEstimatorService } from '../../infrastructure/llm/token-estimator.service';

export interface ContextInput {
  systemPrompt: string;
  chunks: RetrievedChunk[];
  history: ChatMessage[];
  confidenceInstruction: string;
  userQuestion: string;
}

export interface TokenBudgetConfig {
  systemPromptBudget: number;
  historyBudget: number;
  chunksBudget: number;
}

@Injectable()
export class ContextBuilderService {
  private readonly defaultBudget: TokenBudgetConfig = {
    systemPromptBudget: 300,
    historyBudget: 800,
    chunksBudget: 2500,
  };

  constructor(private readonly tokenEstimator: TokenEstimatorService) {}

  buildContext(input: ContextInput): string {
    const sections: string[] = [];

    sections.push('=== SYSTEM INSTRUCTIONS ===');
    sections.push(input.systemPrompt);
    if (input.confidenceInstruction) {
      sections.push(input.confidenceInstruction);
    }

    sections.push('=== CONVERSATION HISTORY ===');
    if (input.history.length === 0) {
      sections.push('(No prior conversation)');
    } else {
      const trimmedHistory = this.trimToBudget(
        input.history.map((m) => `${m.role}: ${m.content}`),
        this.defaultBudget.historyBudget,
      );
      sections.push(trimmedHistory.join('\n'));
    }

    sections.push('=== RETRIEVED KNOWLEDGE ===');
    if (input.chunks.length === 0) {
      sections.push('No relevant documents were found.');
    } else {
      const chunkSections = this.formatChunks(input.chunks);
      const trimmedChunks = this.trimToBudget(chunkSections, this.defaultBudget.chunksBudget);
      sections.push(trimmedChunks.join('\n'));
    }

    sections.push('=== RETRIEVAL CONFIDENCE ===');
    sections.push(input.confidenceInstruction ? 'See instructions above.' : 'Not specified.');

    sections.push('=== USER QUESTION ===');
    sections.push(input.userQuestion);

    return sections.join('\n\n');
  }

  private formatChunks(chunks: RetrievedChunk[]): string[] {
    return chunks.map((chunk) => {
      const docName = (chunk.metadata.source as string) || (chunk.metadata.fileName as string) || 'Unknown';
      const sourceType = (chunk.metadata.type as string) || 'unknown';
      return [
        `[Source]`,
        `Document: ${docName}`,
        `Type: ${sourceType}`,
        `Similarity: ${chunk.similarity.toFixed(4)}`,
        ``,
        `Content:`,
        chunk.content,
        `---`,
      ].join('\n');
    });
  }

  private trimToBudget(items: string[], budget: number): string[] {
    const result: string[] = [];
    let usedTokens = 0;

    for (const item of items) {
      const tokens = this.tokenEstimator.estimateTokens(item);
      if (usedTokens + tokens > budget) break;
      result.push(item);
      usedTokens += tokens;
    }

    return result;
  }
}
