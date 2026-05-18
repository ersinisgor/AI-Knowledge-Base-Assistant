import { Controller, Get, Post, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatMessageDto } from './dto/chat-message.dto';
import { ChatResponseDto } from './dto/chat-response.dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('sessions')
  async getSessions() {
    return this.chatService.getSessions();
  }

  @Get('sessions/:id/messages')
  async getSessionMessages(@Param('id') id: string) {
    return this.chatService.getSessionMessages(id);
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  async sendMessage(
    @Body() chatMessageDto: ChatMessageDto,
  ): Promise<ChatResponseDto> {
    return this.chatService.handleMessage(chatMessageDto);
  }
}
