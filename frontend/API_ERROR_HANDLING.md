# API Error Handling Strategy

## Overview

This document outlines the unified error handling approach for API calls across the Nevo frontend application.

## Problem Statement

Previously, error handling was inconsistent:
- Some pages silently set empty arrays on fetch errors
- Some pages only logged to console without user notification
- Others properly surfaced errors via toast notifications

This inconsistency made it difficult to debug issues and provided poor user experience.

## Solution

### Architecture

We've implemented a two-part solution:

#### 1. `parseApiError` Utility (`src/lib/errorHandling.ts`)

A pure function that normalizes various error types into user-friendly messages:

```typescript
export function parseApiError(error: unknown): string
```

**Features:**
- Handles Error objects, strings, and objects with message/error properties
- Provides a sensible fallback message
- Deterministic output for consistent error messages

**Usage:**
```typescript
const message = parseApiError(error);
```

#### 2. `useApiError` Hook (`src/lib/hooks/useApiError.ts`)

A React hook that combines error parsing with toast notifications:

```typescript
export function useApiError() {
  const { handleError } = useApiError();
  // ...
  try {
    // API call
  } catch (error) {
    handleError(error, "Custom error message (optional)");
  }
}
```

**Features:**
- Automatically parses and displays error toasts
- Logs errors to console for debugging
- Accepts optional custom message override
- Consistent UX across all API error scenarios

## Implementation

### Updated Components

#### 1. DonationModal.tsx
- Replaced `console.error` + `alert` with `useApiError` hook
- Error donations now properly surface to users

#### 2. ConnectWallet.tsx
- Added try-catch around balance fetching
- Errors during wallet connection now show toast

#### 3. ProfileSettingsPage.tsx
- localStorage operations now have error boundaries
- Both load and save errors surface to users

## Usage Pattern

When implementing new API calls, follow this pattern:

```typescript
"use client";

import { useApiError } from "@/lib/hooks/useApiError";

export default function MyComponent() {
  const { handleError } = useApiError();

  const handleAction = async () => {
    try {
      const response = await fetch("/api/endpoint");
      const data = await response.json();
      // Handle success
    } catch (error) {
      handleError(error, "Failed to perform action");
    }
  };

  // Component JSX
}
```

## Benefits

1. **Consistency** - All API errors follow the same pattern
2. **User Experience** - Errors are visible to users, not silently failing
3. **Maintainability** - Error handling logic is centralized
4. **Debuggability** - All errors are logged to console
5. **Testability** - Pure utility function is easy to test

## Future Enhancements

- Add error categorization (network, validation, server, etc.)
- Implement retry logic for specific error types
- Add error analytics/reporting
- Support for internationalized error messages
