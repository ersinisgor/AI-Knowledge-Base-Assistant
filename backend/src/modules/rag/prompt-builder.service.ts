import { Injectable, Logger } from '@nestjs/common';
import { ChatMessage } from '../../infrastructure/llm/providers/llm-provider.interface';

@Injectable()
export class PromptBuilderService {
  private readonly logger = new Logger(PromptBuilderService.name);

  buildMessages(systemPrompt: string, context: string, userQuestion: string): ChatMessage[] {
    const messages: ChatMessage[] = [];

    messages.push({
      role: 'system',
      content: `${systemPrompt}\n\n${context}`,
    });

    messages.push({
      role: 'user',
      content: userQuestion,
    });

    return messages;
  }
}
