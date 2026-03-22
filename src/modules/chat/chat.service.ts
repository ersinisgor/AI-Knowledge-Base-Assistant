import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../infrastructure/supabase/supabase.service';
import { ChatMessageDto } from './dto/chat-message.dto';
import { ChatResponseDto } from './dto/chat-response.dto';

interface ChatHistoryRow {
  id: string;
  user_message: string;
  ai_response: string;
  created_at: string;
}

@Injectable()
export class ChatService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async sendMessage(chatMessageDto: ChatMessageDto): Promise<ChatResponseDto> {
    const supabase = this.supabaseService.getClient();

    const aiResponse =
      'This is a placeholder AI response. RAG integration coming in Phase 2.';

    const { data, error } = await supabase
      .from('chat_history')
      .insert({
        user_message: chatMessageDto.message,
        ai_response: aiResponse,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to save chat history: ${error.message}`);
    }

    const chatData = data as ChatHistoryRow;

    return {
      user_message: chatMessageDto.message,
      ai_response: aiResponse,
      chat_id: chatData.id,
    };
  }
}
