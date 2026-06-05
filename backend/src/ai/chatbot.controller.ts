import { Controller, Post, Body } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';

@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Post('query')
  async askChatbot(
    @Body('userId') userId: string,
    @Body('message') message: string,
  ) {
    return this.chatbotService.chatWithCareerBot(userId, message);
  }
}
