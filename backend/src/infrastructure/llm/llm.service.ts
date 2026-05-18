import { Injectable } from '@nestjs/common';
import { ILLMProvider, ChatMessage, LLMOptions, LLMResponse } from './providers/llm-provider.interface';
import { OpenAIProvider } from './providers/openai.provider';

@Injectable()
export class LlmService {
  private readonly provider: ILLMProvider;

  constructor(private readonly openAIProvider: OpenAIProvider) {
    this.provider = this.openAIProvider;
  }

  async chat(messages: ChatMessage[], options?: LLMOptions): Promise<LLMResponse> {
    return this.provider.chat(messages, options);
  }
}
