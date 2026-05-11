import { Injectable, Logger } from '@nestjs/common';
import { RetrievedChunk, RetrievalConfidence, ValidationResult } from './strategies/retriever.interface';

@Injectable()
export class RetrievalValidatorService {
  private readonly logger = new Logger(RetrievalValidatorService.name);

  validate(chunks: RetrievedChunk[]): ValidationResult {
    if (chunks.length === 0) {
      this.logger.warn('No chunks retrieved');
      return {
        confidence: 'low',
        instruction: 'No relevant information was found. State that you could not find relevant information.',
      };
    }

    const topScore = chunks[0].similarity;

    if (topScore > 0.85 && chunks.length >= 3) {
      return {
        confidence: 'high',
        instruction: 'Answer normally with citations from the retrieved knowledge.',
      };
    }

    if (topScore > 0.7 && chunks.length >= 2) {
      return {
        confidence: 'medium',
        instruction: 'Answer but note that sources are limited. Be cautious about claims.',
      };
    }

    this.logger.warn(`Low retrieval confidence: top score=${topScore}, count=${chunks.length}`);
    return {
      confidence: 'low',
      instruction: 'Answer cautiously and state that the available information may be incomplete or not fully relevant.',
    };
  }
}
