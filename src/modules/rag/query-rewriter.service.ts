import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { LlmService } from '../../infrastructure/llm/llm.service';
import { ChatMessage } from '../../infrastructure/llm/providers/llm-provider.interface';

@Injectable()
export class QueryRewriterService {
  private readonly logger = new Logger(QueryRewriterService.name);
  private readonly rewritePromptTemplate: string;

  constructor(private readonly llmService: LlmService) {
    const templatePath = path.join(
      __dirname,
      '..',
      '..',
      'infrastructure',
      'langchain',
      'prompts',
      'rewrite',
      'default.md',
    );
    this.rewritePromptTemplate = fs.readFileSync(templatePath, 'utf-8');
  }

  async rewrite(question: string, history: ChatMessage[]): Promise<string> {
    const historyText = history
      .map((m) => `${m.role}: ${m.content}`)
      .join('\n');

    const prompt = this.rewritePromptTemplate
      .replace('{{conversation_history}}', historyText || '(No prior conversation)')
      .replace('{{user_question}}', question);

    const messages: ChatMessage[] = [{ role: 'user', content: prompt }];

    try {
      const response = await this.llmService.chat(messages, {
        temperature: 0.2,
        maxTokens: 200,
      });
      this.logger.debug(`Rewrote query: "${question}" → "${response.content.trim()}"`);
      return response.content.trim();
    } catch (error) {
      this.logger.warn(
        `Query rewrite failed, using original: ${error instanceof Error ? error.message : String(error)}`,
      );
      return question;
    }
  }
}
