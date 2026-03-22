import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { IngestionService } from './ingestion.service';
import { IngestContentDto } from './dto/ingest-content.dto';
import { IngestResponseDto } from './dto/ingest-response.dto';

@Controller('ingestion')
export class IngestionController {
  constructor(private readonly ingestionService: IngestionService) {}

  @Post('process')
  @HttpCode(HttpStatus.CREATED)
  async process(
    @Body() ingestContentDto: IngestContentDto,
  ): Promise<IngestResponseDto> {
    return this.ingestionService.process(ingestContentDto);
  }
}
