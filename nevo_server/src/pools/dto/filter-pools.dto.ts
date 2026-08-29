import { IsOptional, IsString, MaxLength } from 'class-validator';

export class FilterPoolsDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;
}
