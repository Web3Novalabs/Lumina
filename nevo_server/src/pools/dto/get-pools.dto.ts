import { ApiPropertyOptional } from '@nestjs/swagger';

// TODO: Replace with real DTO validation/class-validator annotations from issue #17
export class GetPoolsDto {
  @ApiPropertyOptional({ description: '1-based page number. Defaults to 1.' })
  page?: string;

  @ApiPropertyOptional({ description: 'Page size. Defaults to 10.' })
  limit?: string;

  @ApiPropertyOptional({
    description: 'Free-text match against pool title and description.',
  })
  search?: string;

  @ApiPropertyOptional({ description: 'Exact category match, case-insensitive.' })
  category?: string;

  @ApiPropertyOptional({
    description: 'Pool status, e.g. Active or Completed.',
  })
  status?: string;
}
