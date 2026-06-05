import { Module, Global } from '@nestjs/common';
import { EmbeddingService } from './embedding.service';
import { ChatbotService } from './chatbot.service';
import { ChatbotController } from './chatbot.controller';

@Global()
@Module({
  providers: [EmbeddingService, ChatbotService],
  controllers: [ChatbotController],
  exports: [EmbeddingService, ChatbotService],
})
export class AiModule {}
