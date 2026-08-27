# Nevo Server

NestJS backend API for the Nevo platform with standardized response envelopes.

## Architecture

### Standardized Response Envelope

All API responses follow a consistent structure:

```typescript
{
  "data": T,                    // Actual response data
  "success": boolean,           // Operation success status
  "message": string,            // Optional: user-friendly message
  "timestamp": string,          // ISO 8601 timestamp
  "pagination": {               // Optional: for list endpoints
    "page": number,
    "limit": number,
    "total": number,
    "totalPages": number
  },
  "txHash": string,             // Optional: blockchain transaction hash
  "unsignedXdr": string         // Optional: unsigned transaction for signing
}
```

### Response Handling

**Global Interceptor** (`ResponseInterceptor`)
- Automatically wraps all successful responses
- Detects pagination metadata and adds pagination object
- Passes through already-wrapped responses

**Global Exception Filters**
- `HttpExceptionFilter`: Catches HTTP exceptions
- `AllExceptionsFilter`: Catches unhandled errors
- Both format errors in the standard envelope

## API Endpoints

### Pools

- `GET /pools` - List pools with pagination
- `GET /pools/:id` - Get single pool
- `POST /pools` - Create pool
- `PATCH /pools/:id` - Update pool
- `DELETE /pools/:id` - Delete pool

Response: `{ data: Pool | Pool[], pagination?: {...}, success: true }`

### Contract

- `POST /contract/contribute` - Build contribution transaction
  - Returns: `{ data: {...}, unsignedXdr: "...", success: true }`
  
- `POST /contract/submit` - Submit signed transaction
  - Returns: `{ data: {...}, txHash: "0x...", success: true }`
  
- `GET /contract/state/:contractId` - Get contract state
  - Returns: `{ data: ContractState, success: true }`
  
- `POST /contract/call` - Call contract method
  - Returns: `{ data: MethodResult, success: true }`

## Setup

```bash
# Install dependencies
npm install

# Run tests
npm test

# Start development server
npm run dev

# Build for production
npm build
```

## Environment

Copy `.env.example` to `.env` and configure:

```env
PORT=3001
NODE_ENV=development
STELLAR_NETWORK=testnet
STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
```

## Testing

All modules include comprehensive unit tests:

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:cov
```

## Key Files

- `src/common/dto/api-response.dto.ts` - Response envelope definitions
- `src/common/interceptors/response.interceptor.ts` - Global response handler
- `src/common/filters/http-exception.filter.ts` - Global error handler
- `src/pools/` - Pool management module
- `src/contract/` - Smart contract interaction module
