# Response Envelope Convention

## Overview

All API responses across the Nevo backend follow a **standardized envelope pattern** via the global `ResponseInterceptor`. This ensures clients have a consistent shape to handle all responses predictably.

## Standard Response Envelope

Every successful API response returns this structure:

```typescript
{
  // The actual response data (can be any type)
  data: T,

  // Whether the operation succeeded
  success: boolean,

  // Optional message for additional context
  message?: string,

  // ISO 8601 timestamp when response was generated
  timestamp: string,

  // [Optional] Pagination metadata (only for list endpoints)
  pagination?: {
    page: number,           // Current page (1-indexed)
    limit: number,          // Items per page
    total: number,          // Total items across all pages
    totalPages: number      // Calculated total pages
  },

  // [Optional] Transaction hash (only for blockchain submission endpoints)
  txHash?: string,

  // [Optional] Unsigned XDR (only for transaction preview endpoints)
  unsignedXdr?: string
}
```

## How It Works

### 1. **Service Layer Returns Data**

Services return raw data, pagination info, or wrapped `ApiResponseDto` instances:

```typescript
// For list operations with pagination:
return { items: [...], total: 100, page: 1, limit: 10 };

// For single item operations:
return rawEntity;

// For custom responses (blockchain ops):
const response = new ApiResponseDto(data, true, message);
response.unsignedXdr = xdr;
return response;
```

### 2. **Interceptor Auto-Wraps Responses**

The global `ResponseInterceptor` runs on all responses:

- **Already wrapped** (`ApiResponseDto` instance): Passes through unchanged
- **Pagination format** (has `items`, `total`): Converts to paginated `ApiResponseDto`
- **Plain objects/arrays**: Wraps in `ApiResponseDto` as `data`

### 3. **Client Receives Consistent Envelope**

All responses reach the client with the standardized shape.

## Service Integration Patterns

### Pattern 1: List Endpoints with Pagination

```typescript
// Service method
findAll(page = 1, limit = 10) {
  const items = [...];
  return { items, total: 100, page, limit };
}

// Interceptor detects pagination and returns:
{
  data: items,
  success: true,
  timestamp: "2026-08-29T...",
  pagination: { page: 1, limit: 10, total: 100, totalPages: 10 }
}
```

### Pattern 2: Single Item Endpoints

```typescript
// Service method
findOne(id: number) {
  return { id, title: "...", ... };
}

// Interceptor wraps and returns:
{
  data: { id, title: "...", ... },
  success: true,
  timestamp: "2026-08-29T..."
}
```

### Pattern 3: Blockchain Operations (Custom Response)

```typescript
// Service method
buildContribution(...) {
  const response = new ApiResponseDto(data, true);
  response.unsignedXdr = xdr;
  return response;
}

// Interceptor passes through:
{
  data: {...},
  success: true,
  unsignedXdr: "AAAAAgAAAAB...",
  timestamp: "2026-08-29T..."
}
```

## Error Handling

Errors are handled by `HttpExceptionFilter` and `AllExceptionsFilter`, which also wrap in a response envelope with `success: false`.

## Frontend Integration

Clients should:

1. **Always expect the envelope** - don't assume raw data
2. **Check `success` flag** - though HTTP status codes also indicate success/failure
3. **Extract `data` field** - this contains the actual payload
4. **Handle pagination** - check `response.pagination` for list endpoints
5. **Handle transaction fields** - check `response.txHash` or `response.unsignedXdr` where applicable

Example:

```typescript
const response = await fetch('/pools');
const envelope = await response.json();

if (envelope.success) {
  const pools = envelope.data;
  const { page, total, limit } = envelope.pagination;
}
```

## Testing

Tests should verify:
- Responses are wrapped in `ApiResponseDto`
- Pagination is calculated correctly (totalPages)
- Blockchain-specific fields are present when expected
- Timestamp is included
- Success flag is correct
