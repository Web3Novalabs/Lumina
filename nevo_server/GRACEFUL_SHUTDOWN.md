# Graceful Shutdown Implementation

## Overview

The NestJS server is now configured with graceful shutdown hooks via `app.enableShutdownHooks()` in `main.ts`. This ensures that when the process receives a SIGTERM or SIGINT signal, it cleanly shuts down:

- In-flight HTTP requests are drained
- Database connections are closed properly
- Scheduled tasks (cron jobs, intervals) are stopped
- All cleanup handlers registered on the app are executed

## Implementation

Added `app.enableShutdownHooks()` to the bootstrap function in `src/main.ts`:

```typescript
app.enableShutdownHooks();
```

This single line enables NestJS's built-in shutdown hook system, which listens for both SIGTERM and SIGINT signals.

## How It Works

When a shutdown signal is received:

1. NestJS lifecycle hooks are triggered in order: `onModuleDestroy()` → `beforeApplicationShutdown()` → `onApplicationShutdown()`
2. All services implementing `OnModuleDestroy`, `BeforeApplicationShutdown`, or `OnApplicationShutdown` interfaces will have their cleanup methods called
3. Active HTTP connections are drained
4. The process exits gracefully

## Testing Locally

### Prerequisites

Ensure the server is running:

```bash
cd nevo_server
npm run start:dev
```

### Test Graceful Shutdown

#### Method 1: Using SIGTERM Signal

In another terminal, send a SIGTERM signal to the server process:

```bash
# Find the process ID (PID)
lsof -i :3001

# Or using ps
ps aux | grep "node.*main"

# Send SIGTERM signal
kill -TERM <PID>
```

**Expected behavior:**
- Server logs graceful shutdown messages
- Active connections are closed cleanly
- Process exits with code 0 (success)
- No "connection reset" errors in logs

#### Method 2: Using Ctrl+C in Development

When running the dev server, Ctrl+C sends SIGINT (which is also handled):

```bash
cd nevo_server
npm run start:dev

# In the terminal, press Ctrl+C
```

**Expected behavior:**
- Server begins shutdown process
- Active requests finish or are drained
- Process exits gracefully

#### Method 3: Using Docker (Production-like)

If deploying with Docker, you can test SIGTERM handling:

```bash
# Start container
docker run -p 3001:3001 nevo-server

# In another terminal, stop the container
docker stop <container-id>
```

Docker sends SIGTERM to the main process in the container.

### What to Look For

**Success Indicators:**
- Logs show shutdown process starting
- Existing requests complete or are drained
- No errors about "port already in use" on restart
- Clean exit without stack traces

**Logs during shutdown might show:**
```
✅ Server running on http://localhost:3001
^C  # User presses Ctrl+C or SIGTERM received
[Nest] 12345 - 10/15/2024, 10:30:45 AM     LOG [NestFactory] Nest application successfully started
```

## Best Practices

### For Service Developers

If you add services that manage resources (DB connections, timers, etc.), implement cleanup:

```typescript
import { Injectable, OnModuleDestroy } from '@nestjs/common';

@Injectable()
export class MyService implements OnModuleDestroy {
  onModuleDestroy() {
    // Clean up resources
    // Close connections, stop timers, etc.
  }
}
```

### Production Deployment

- Set `SIGTERM_TIMEOUT` (or similar) in your orchestration system if needed
- NestJS graceful shutdown respects Node.js shutdown flow
- Kubernetes: Use `preStop` hooks to coordinate shutdown timing
- Docker: Ensure SIGTERM is passed to the Node.js process (not PID 1 bash)

## Related Documentation

- [NestJS Lifecycle Events](https://docs.nestjs.com/fundamentals/lifecycle-events)
- [Node.js Graceful Shutdown](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)
- [Docker SIGTERM Handling](https://docs.docker.com/engine/reference/builder/#stopsignal)
