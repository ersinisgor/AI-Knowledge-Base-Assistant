import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';

export class ChatMessageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  message: string;

  @IsString()
  @IsOptional()
  session_id?: string;
}
