import { IsString, IsOptional, IsInt, Min, Max, MinLength } from 'class-validator';

export class RagQueryDto {
  @IsString()
  @MinLength(1)
  question: string;

  @IsOptional()
  @IsString()
  session_id?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  top_k?: number = 5;
}
