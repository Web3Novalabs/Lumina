import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdatePoolDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;
}
