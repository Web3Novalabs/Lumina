"use client";

import { toast } from "sonner";
import { parseApiError } from "../errorHandling";

/**
 * Hook for consistent API error handling across the app
 * Combines parseApiError with toast notifications
 */
export function useApiError() {
  const handleError = (error: unknown, fallbackMessage?: string) => {
    const message = fallbackMessage || parseApiError(error);
    toast.error(message);
    console.error("API Error:", error);
  };

  return { handleError };
}
