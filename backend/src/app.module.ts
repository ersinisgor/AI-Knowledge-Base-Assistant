import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DocumentsModule } from './modules/documents/documents.module';
import { ChatModule } from './modules/chat/chat.module';
import { IngestionModule } from './modules/ingestion/ingestion.module';
import { CommonModule } from './modules/common/common.module';
import { SupabaseModule } from './infrastructure/supabase/supabase.module';
import { LlmModule } from './infrastructure/llm/llm.module';
import { EmbeddingsModule } from './infrastructure/embeddings/embeddings.module';
import { RagModule } from './modules/rag/rag.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    SupabaseModule,
    LlmModule,
    EmbeddingsModule,
    DocumentsModule,
    ChatModule,
    IngestionModule,
    CommonModule,
    RagModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
