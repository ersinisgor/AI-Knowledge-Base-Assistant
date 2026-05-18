import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../../infrastructure/supabase/supabase.service';
import { RagPipelineService } from '../rag/rag-pipeline.service';
import { ChatMessageDto } from './dto/chat-message.dto';
import { ChatResponseDto } from './dto/chat-response.dto';
import { ChatMessage } from '../../infrastructure/llm/providers/llm-provider.interface';

interface SessionRow {
  id: string;
  title: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

interface MessageRow {
  id: string;
  session_id: string;
  role: string;
  content: string;
  sources: Record<string, unknown>[] | null;
  metadata: Record<string, unknown>;
  tokens_used: number | null;
  created_at: string;
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly ragPipeline: RagPipelineService,
  ) {}

  async handleMessage(dto: ChatMessageDto): Promise<ChatResponseDto> {
    const supabase = this.supabaseService.getClient();

    // 1. Get or create session
    let sessionId = dto.session_id;
    if (!sessionId) {
      const { data, error } = await supabase
        .from('chat_sessions')
        .insert({ title: dto.message.slice(0, 50) })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create session: ${error.message}`);
      }
      sessionId = (data as SessionRow).id;
    }

    // 2. Store user message
    await supabase.from('messages').insert({
      session_id: sessionId,
      role: 'user',
      content: dto.message,
    });

    // 3. Load recent message history (last 10)
    const { data: historyData } = await supabase
      .from('messages')
      .select('role, content')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(10);

    const history: ChatMessage[] = (
      (historyData as Pick<MessageRow, 'role' | 'content'>[] || [])
    )
      .reverse()
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

    // 4. Run RAG pipeline
    const pipelineResult = await this.ragPipeline.query({
      question: dto.message,
      history,
      topK: 5,
    });

    // 5. Store assistant response
    await supabase.from('messages').insert({
      session_id: sessionId,
      role: 'assistant',
      content: pipelineResult.answer,
      sources: pipelineResult.sources as unknown as import('database.types').Json,
      tokens_used: pipelineResult.tokensUsed,
      metadata: {
        pipeline_metrics: pipelineResult.metrics,
        retrieval_confidence: pipelineResult.retrievalConfidence,
      },
    });

    // 6. Return response
    return {
      answer: pipelineResult.answer,
      sources: pipelineResult.sources,
      session_id: sessionId,
      tokens_used: pipelineResult.tokensUsed,
      retrieval_confidence: pipelineResult.retrievalConfidence,
    };
  }

  async getSessionMessages(sessionId: string) {
    const { data, error } = await this.supabaseService.getClient()
      .from('messages')
      .select('role, content, sources, metadata, tokens_used, created_at')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch messages: ${error.message}`);
    }

    return (data as MessageRow[]).map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
      sources: (m.sources as unknown[]) ?? undefined,
      retrieval_confidence: (m.metadata?.retrieval_confidence as string) ?? undefined,
      tokens_used: m.tokens_used ?? undefined,
    }));
  }

  async getSessions() {
    const { data, error } = await this.supabaseService.getClient()
      .from('chat_sessions')
      .select('id, title, created_at, updated_at')
      .order('updated_at', { ascending: false })
      .limit(20);

    if (error) {
      throw new Error(`Failed to fetch sessions: ${error.message}`);
    }
    return data;
  }
}
