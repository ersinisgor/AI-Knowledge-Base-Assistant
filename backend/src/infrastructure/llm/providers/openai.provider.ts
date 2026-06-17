import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import {
  ILLMProvider,
  ChatMessage,
  LLMOptions,
  LLMResponse,
} from './llm-provider.interface';

@Injectable()
export class OpenAIProvider implements ILLMProvider {
  private readonly logger = new Logger(OpenAIProvider.name);
  private readonly client: OpenAI;
  private readonly defaultModel: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is required');
    }

    this.client = new OpenAI({ apiKey });
    this.defaultModel =
      this.configService.get<string>('LLM_MODEL') || 'gpt-4o-mini';
  }

  async chat(
    messages: ChatMessage[],
    options?: LLMOptions,
  ): Promise<LLMResponse> {
    const model = options?.model || this.defaultModel;

    this.logger.debug(`Calling OpenAI chat with model: ${model}`);

    const response = await this.client.chat.completions.create({
      model,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      temperature: options?.temperature ?? 0.3,
      max_tokens: options?.maxTokens,
    });

    const choice = response.choices[0];
    const content = choice?.message?.content || '';

    return {
      content,
      tokensUsed: {
        prompt: response.usage?.prompt_tokens ?? 0,
        completion: response.usage?.completion_tokens ?? 0,
        total: response.usage?.total_tokens ?? 0,
      },
      model: response.model,
    };
  }
}
