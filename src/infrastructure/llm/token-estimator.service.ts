import { Injectable } from '@nestjs/common';
import { ChatMessage } from './providers/llm-provider.interface';

@Injectable()
export class TokenEstimatorService {
  private readonly CHARS_PER_TOKEN = 4;
  private readonly MESSAGE_OVERHEAD = 4;

  estimateTokens(text: string): number {
    if (!text) return 0;
    return Math.ceil(text.length / this.CHARS_PER_TOKEN);
  }

  estimateMessagesTokens(messages: ChatMessage[]): number {
    return messages.reduce(
      (sum, msg) => sum + this.estimateTokens(msg.content) + this.MESSAGE_OVERHEAD,
      0,
    );
  }
}
