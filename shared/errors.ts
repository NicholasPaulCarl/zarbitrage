// Centralized error definitions with codes and user-friendly messages
export interface AppError {
  code: string;
  message: string;
  userMessage: string;
  statusCode: number;
}

export const ErrorCodes = {
  // Authentication errors (AUTH_XXX)
  AUTH_001: {
    code: "AUTH_001",
    message: "User must be logged in to access this feature",
    userMessage: "Please log in to continue using this feature.",
    statusCode: 401
  },
  AUTH_002: {
    code: "AUTH_002",
    message: "Invalid authentication token",
    userMessage: "Your session has expired. Please log in again.",
    statusCode: 401
  },
  AUTH_003: {
    code: "AUTH_003",
    message: "Authentication error",
    userMessage: "Something went wrong with your login. Please try again.",
    statusCode: 500
  },
  AUTH_004: {
    code: "AUTH_004",
    message: "Admin access required",
    userMessage: "You don't have permission to access this feature.",
    statusCode: 403
  },
  AUTH_005: {
    code: "AUTH_005",
    message: "Invalid username or password",
    userMessage: "The username or password you entered is incorrect. Please try again.",
    statusCode: 401
  },

  // User management errors (USER_XXX)
  USER_001: {
    code: "USER_001",
    message: "Username already exists",
    userMessage: "This username is already taken. Please choose a different one.",
    statusCode: 400
  },
  USER_002: {
    code: "USER_002",
    message: "Email already exists",
    userMessage: "An account with this email already exists. Please use a different email.",
    statusCode: 400
  },
  USER_003: {
    code: "USER_003",
    message: "User not found",
    userMessage: "We couldn't find your account. Please check your details and try again.",
    statusCode: 404
  },
  USER_004: {
    code: "USER_004",
    message: "Failed to create user",
    userMessage: "We couldn't create your account right now. Please try again later.",
    statusCode: 500
  },
  USER_005: {
    code: "USER_005",
    message: "Failed to update user",
    userMessage: "We couldn't save your changes. Please try again.",
    statusCode: 500
  },
  USER_006: {
    code: "USER_006",
    message: "Password update failed",
    userMessage: "We couldn't update your password. Please try again.",
    statusCode: 500
  },
  USER_007: {
    code: "USER_007",
    message: "Email is blacklisted",
    userMessage: "This email address cannot be used to create an account.",
    statusCode: 400
  },

  // Validation errors (VAL_XXX)
  VAL_001: {
    code: "VAL_001",
    message: "Invalid request data",
    userMessage: "The information you provided isn't valid. Please check and try again.",
    statusCode: 400
  },
  VAL_002: {
    code: "VAL_002",
    message: "Missing required fields",
    userMessage: "Please fill in all required fields.",
    statusCode: 400
  },
  VAL_003: {
    code: "VAL_003",
    message: "Invalid file format",
    userMessage: "Please upload a valid image file (JPG, PNG, or GIF).",
    statusCode: 400
  },
  VAL_004: {
    code: "VAL_004",
    message: "File too large",
    userMessage: "The file you uploaded is too large. Please choose a smaller file.",
    statusCode: 400
  },
  VAL_005: {
    code: "VAL_005",
    message: "Invalid webhook alert data",
    userMessage: "Please check your webhook settings and try again.",
    statusCode: 400
  },

  // Trade journal errors (TRADE_XXX)
  TRADE_001: {
    code: "TRADE_001",
    message: "Failed to create trade entry",
    userMessage: "We couldn't save your trade entry. Please try again.",
    statusCode: 500
  },
  TRADE_002: {
    code: "TRADE_002",
    message: "Trade entry not found",
    userMessage: "This trade entry doesn't exist or has been deleted.",
    statusCode: 404
  },
  TRADE_003: {
    code: "TRADE_003",
    message: "Failed to update trade entry",
    userMessage: "We couldn't update your trade entry. Please try again.",
    statusCode: 500
  },
  TRADE_004: {
    code: "TRADE_004",
    message: "Failed to delete trade entry",
    userMessage: "We couldn't delete this trade entry. Please try again.",
    statusCode: 500
  },

  // Feature request errors (FEAT_XXX)
  FEAT_001: {
    code: "FEAT_001",
    message: "Failed to create feature request",
    userMessage: "We couldn't submit your feature request. Please try again.",
    statusCode: 500
  },
  FEAT_002: {
    code: "FEAT_002",
    message: "Feature request not found",
    userMessage: "This feature request doesn't exist.",
    statusCode: 404
  },
  FEAT_003: {
    code: "FEAT_003",
    message: "Failed to update feature request",
    userMessage: "We couldn't update this feature request. Please try again.",
    statusCode: 500
  },

  // Webhook errors (WEBHOOK_XXX)
  WEBHOOK_001: {
    code: "WEBHOOK_001",
    message: "Failed to create webhook alert",
    userMessage: "We couldn't create your webhook alert. Please check your settings and try again.",
    statusCode: 500
  },
  WEBHOOK_002: {
    code: "WEBHOOK_002",
    message: "Webhook alert not found",
    userMessage: "This webhook alert doesn't exist or has been deleted.",
    statusCode: 404
  },
  WEBHOOK_003: {
    code: "WEBHOOK_003",
    message: "Failed to update webhook alert",
    userMessage: "We couldn't update your webhook alert. Please try again.",
    statusCode: 500
  },
  WEBHOOK_004: {
    code: "WEBHOOK_004",
    message: "Failed to delete webhook alert",
    userMessage: "We couldn't delete this webhook alert. Please try again.",
    statusCode: 500
  },
  WEBHOOK_005: {
    code: "WEBHOOK_005",
    message: "Invalid webhook URL",
    userMessage: "Please provide a valid webhook URL.",
    statusCode: 400
  },

  // File upload errors (FILE_XXX)
  FILE_001: {
    code: "FILE_001",
    message: "No file uploaded",
    userMessage: "Please select a file to upload.",
    statusCode: 400
  },
  FILE_002: {
    code: "FILE_002",
    message: "File upload failed",
    userMessage: "We couldn't upload your file. Please try again.",
    statusCode: 500
  },
  FILE_003: {
    code: "FILE_003",
    message: "Image processing failed",
    userMessage: "We couldn't process your image. Please try uploading a different image.",
    statusCode: 500
  },

  // Data errors (DATA_XXX)
  DATA_001: {
    code: "DATA_001",
    message: "Failed to fetch data",
    userMessage: "We couldn't load the data right now. Please refresh the page and try again.",
    statusCode: 500
  },
  DATA_002: {
    code: "DATA_002",
    message: "External API error",
    userMessage: "We're having trouble connecting to our data sources. Please try again in a few minutes.",
    statusCode: 503
  },
  DATA_003: {
    code: "DATA_003",
    message: "Database connection error",
    userMessage: "We're experiencing technical difficulties. Please try again later.",
    statusCode: 500
  },

  // Payment errors (PAY_XXX)
  PAY_001: {
    code: "PAY_001",
    message: "Payment processing failed",
    userMessage: "Your payment couldn't be processed. Please check your payment details and try again.",
    statusCode: 400
  },
  PAY_002: {
    code: "PAY_002",
    message: "Subscription expired",
    userMessage: "Your subscription has expired. Please renew to continue using premium features.",
    statusCode: 402
  },
  PAY_003: {
    code: "PAY_003",
    message: "Invalid payment method",
    userMessage: "Please provide valid payment information.",
    statusCode: 400
  },

  // General errors (GEN_XXX)
  GEN_001: {
    code: "GEN_001",
    message: "Internal server error",
    userMessage: "Something went wrong on our end. Please try again later.",
    statusCode: 500
  },
  GEN_002: {
    code: "GEN_002",
    message: "Service unavailable",
    userMessage: "This service is temporarily unavailable. Please try again later.",
    statusCode: 503
  },
  GEN_003: {
    code: "GEN_003",
    message: "Rate limit exceeded",
    userMessage: "You're making requests too quickly. Please wait a moment and try again.",
    statusCode: 429
  }
} as const;

// Helper function to create error response
export function createErrorResponse(errorCode: keyof typeof ErrorCodes, details?: string) {
  const error = ErrorCodes[errorCode];
  return {
    error: {
      code: error.code,
      message: error.userMessage,
      details: details || error.message
    }
  };
}

// Helper function for validation errors with custom message
export function createValidationError(message: string, details?: string) {
  return {
    error: {
      code: "VAL_001",
      message: message || ErrorCodes.VAL_001.userMessage,
      details: details || message
    }
  };
}