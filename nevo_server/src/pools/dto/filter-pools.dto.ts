import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { PoolStatus } from '../pool.entity.js';

/**
 * Query string accepted by `GET /pools`. Every field is optional.
 *
 * - `search` — case-insensitive substring match on pool title and description.
 * - `category` — case-insensitive exact match on the pool's category.
 * - `status` — one of the {@link PoolStatus} values (`Active`, `Completed`);
 *   anything else is rejected with a 400.
 * - `page` — 1-based page number, defaults to 1. Must be an integer >= 1.
 * - `limit` — results per page, defaults to 20. Must be an integer in 1-100.
 *
 * `page` and `limit` arrive as strings and are coerced to numbers by
 * `@Type(() => Number)` before validation, so the service always receives
 * numbers. The decorators are what let these fields through the global
 * ValidationPipe at all: it runs with `whitelist`/`forbidNonWhitelisted`, so an
 * undecorated property would be stripped and then rejected as unknown.
 */
export class FilterPoolsDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsEnum(PoolStatus)
  status?: PoolStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;
}
