import {
  IsString,
  IsOptional,
  IsObject,
  MinLength,
  IsEnum,
} from 'class-validator';

export class IngestContentDto {
  @IsString()
  @MinLength(1)
  content: string;

  @IsString()
  @IsEnum(['pdf', 'markdown', 'slack', 'github'])
  source_type: 'pdf' | 'markdown' | 'slack' | 'github';

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
