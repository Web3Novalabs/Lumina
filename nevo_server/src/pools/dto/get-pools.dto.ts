import { IsIn, IsNumberString, IsOptional, IsString } from 'class-validator';

/**
 * Query string accepted by `GET /pools`.
 *
 * Every field is optional; omitting all of them returns the first page of all
 * pools, newest first. Values arrive as strings and are parsed by
 * `PoolsService.findAll`.
 *
 * The decorators below are load-bearing rather than cosmetic: the global
 * ValidationPipe runs with `whitelist`/`forbidNonWhitelisted`, so an
 * undecorated property is stripped and then rejected as unknown — without
 * them every filter here responds 400.
 */
export class GetPoolsDto {
  /** 1-based page number. Values below 1 are clamped to 1. Defaults to 1. */
  @IsOptional()
  @IsNumberString({}, { message: 'page must be a number' })
  page?: string;

  /** Results per page. Values below 1 are clamped to 1. Defaults to 10. */
  @IsOptional()
  @IsNumberString({}, { message: 'limit must be a number' })
  limit?: string;

  /** Case-insensitive substring match against pool title and description. */
  @IsOptional()
  @IsString()
  search?: string;

  /** Case-insensitive exact match against the pool's category. */
  @IsOptional()
  @IsString()
  category?: string;

  /** Pool status, matched case-insensitively against `Active` or `Completed`. */
  @IsOptional()
  @IsIn(['active', 'completed', 'Active', 'Completed'], {
    message: 'status must be one of: Active, Completed',
  })
  status?: string;
}
