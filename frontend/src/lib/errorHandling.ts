/**
 * Parses an error object and returns a user-friendly error message
 */
export function parseApiError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  if (error && typeof error === "object") {
    if ("message" in error) {
      return String(error.message);
    }
    if ("error" in error) {
      return String(error.error);
    }
  }

  return "An unexpected error occurred. Please try again.";
}
