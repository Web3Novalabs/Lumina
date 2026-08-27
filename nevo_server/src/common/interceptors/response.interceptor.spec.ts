import { ResponseInterceptor } from './response.interceptor';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';
import { ApiResponseDto } from '../dto/api-response.dto';

describe('ResponseInterceptor', () => {
  let interceptor: ResponseInterceptor;
  let mockExecutionContext: ExecutionContext;
  let mockCallHandler: CallHandler;

  beforeEach(() => {
    interceptor = new ResponseInterceptor();
    mockExecutionContext = {} as ExecutionContext;
  });

  it('should wrap plain data in ApiResponseDto', (done) => {
    const data = { id: 1, name: 'Test' };
    mockCallHandler = { handle: () => of(data) } as CallHandler;

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe((result) => {
      expect(result).toBeInstanceOf(ApiResponseDto);
      expect(result.data).toEqual(data);
      expect(result.success).toBe(true);
      expect(result.timestamp).toBeDefined();
      done();
    });
  });

  it('should return already-wrapped ApiResponseDto as-is', (done) => {
    const wrapped = new ApiResponseDto({ id: 1 }, true, 'Already wrapped');
    mockCallHandler = { handle: () => of(wrapped) } as CallHandler;

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe((result) => {
      expect(result).toBe(wrapped);
      done();
    });
  });

  it('should wrap paginated data with pagination metadata', (done) => {
    const data = {
      items: [{ id: 1 }, { id: 2 }],
      total: 100,
      page: 1,
      limit: 10,
    };
    mockCallHandler = { handle: () => of(data) } as CallHandler;

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe((result) => {
      expect(result).toBeInstanceOf(ApiResponseDto);
      expect(result.data).toEqual(data.items);
      expect(result.pagination).toBeDefined();
      expect(result.pagination?.page).toBe(1);
      expect(result.pagination?.limit).toBe(10);
      expect(result.pagination?.total).toBe(100);
      expect(result.pagination?.totalPages).toBe(10);
      done();
    });
  });

  it('should set default page and limit for pagination', (done) => {
    const data = {
      items: [{ id: 1 }],
      total: 50,
    };
    mockCallHandler = { handle: () => of(data) } as CallHandler;

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe((result) => {
      expect(result.pagination?.page).toBe(1);
      expect(result.pagination?.limit).toBe(10);
      done();
    });
  });
});
