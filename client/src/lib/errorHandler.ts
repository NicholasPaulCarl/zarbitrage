// Frontend error handling utilities
export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: string;
  };
}

export function isApiError(error: any): error is ApiError {
  return error && error.error && error.error.code && error.error.message;
}

export function getErrorMessage(error: any): string {
  // If it's our structured API error, use the user-friendly message
  if (isApiError(error)) {
    return error.error.message;
  }
  
  // If it's a response with a message property
  if (error && error.message) {
    return error.message;
  }
  
  // If it's a string
  if (typeof error === 'string') {
    return error;
  }
  
  // Default fallback
  return "Something went wrong. Please try again.";
}

export function getErrorCode(error: any): string | null {
  if (isApiError(error)) {
    return error.error.code;
  }
  return null;
}

export function getErrorDetails(error: any): string | null {
  if (isApiError(error)) {
    return error.error.details || null;
  }
  return null;
}

// Error toast helper
export function createErrorToast(error: any) {
  const message = getErrorMessage(error);
  const code = getErrorCode(error);
  
  return {
    title: "Error",
    description: code ? `${message} (${code})` : message,
    variant: "destructive" as const
  };
}

// Success toast helper
export function createSuccessToast(message: string) {
  return {
    title: "Success",
    description: message,
  };
}