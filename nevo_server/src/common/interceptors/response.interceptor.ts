import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponseDto, PaginationMetaDto } from '../dto/api-response.dto';

/**
 * Response Interceptor
 *
 * Automatically wraps all successful responses in the standardized ApiResponseDto envelope.
 * This ensures consistent response shapes across all endpoints.
 *
 * Usage: Register globally in app.module.ts or on specific controllers/routes
 */
@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((data) => {
        // If data is already wrapped in ApiResponseDto, return as-is
        if (data instanceof ApiResponseDto) {
          return data;
        }

        // If data has pagination metadata, create paginated response
        if (data && typeof data === 'object' && 'items' in data && 'total' in data) {
          const { items, total, page = 1, limit = 10 } = data as {
            items: unknown[];
            total: number;
            page?: number;
            limit?: number;
          };

          const response = new ApiResponseDto(items, true);
          response.pagination = new PaginationMetaDto(page, limit, total);
          return response;
        }

        // Default: wrap plain data
        return new ApiResponseDto(data, true);
      }),
    );
  }
}
