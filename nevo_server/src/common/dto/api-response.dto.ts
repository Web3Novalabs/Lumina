/**
 * Unified API Response Envelope
 *
 * All API endpoints return responses wrapped in this envelope to ensure
 * consistency across the application. This allows clients to predictably
 * handle responses and errors.
 */
export class ApiResponseDto<T = unknown> {
  /**
   * The actual response data. Can be any type depending on the endpoint.
   */
  data: T;

  /**
   * Whether the operation was successful
   */
  success: boolean;

  /**
   * Optional message for additional context (errors or user info)
   */
  message?: string;

  /**
   * Pagination metadata (only present for list endpoints)
   */
  pagination?: PaginationMetaDto;

  /**
   * Transaction hash for blockchain operations
   */
  txHash?: string;

  /**
   * Unsigned XDR for transaction preview/signing
   */
  unsignedXdr?: string;

  /**
   * Timestamp when the response was generated
   */
  timestamp: string;

  constructor(data: T, success = true, message?: string) {
    this.data = data;
    this.success = success;
    this.message = message;
    this.timestamp = new Date().toISOString();
  }
}

/**
 * Pagination metadata for list responses
 */
export class PaginationMetaDto {
  /**
   * Current page number (1-indexed)
   */
  page: number;

  /**
   * Number of items per page
   */
  limit: number;

  /**
   * Total number of items across all pages
   */
  total: number;

  /**
   * Total number of pages
   */
  totalPages: number;

  constructor(page: number, limit: number, total: number) {
    this.page = page;
    this.limit = limit;
    this.total = total;
    this.totalPages = Math.ceil(total / limit);
  }
}
