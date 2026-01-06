// Centralized Error Type Definitions for Nzila Gym Manager

/**
 * Base application error class
 * Extends native Error with additional properties for better error handling
 */
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * Supabase-specific error type
 */
export interface SupabaseError {
  message: string;
  code: string;
  hint: string;
  details: string;
}

/**
 * Type guard for Supabase errors
 */
export function isSupabaseError(error: unknown): error is SupabaseError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    'code' in error
  );
}

/**
 * Generic API error response
 */
export interface ApiError {
  message: string;
  code: string;
  status?: number;
  path?: string;
}

/**
 * Network error for failed requests
 */
export class NetworkError extends AppError {
  constructor(message: string = 'Network error occurred') {
    super(message, 'NETWORK_ERROR', 0);
    this.name = 'NetworkError';
  }
}

/**
 * Validation error for form/input validation failures
 */
export class ValidationError extends AppError {
  constructor(message: string, public fields?: Record<string, string>) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
    this.details = fields;
  }
}

/**
 * Authentication error for login/signup failures
 */
export class AuthError extends AppError {
  constructor(message: string, public errorCode?: string) {
    super(message, 'AUTH_ERROR', 401, { errorCode });
    this.name = 'AuthError';
  }
}

/**
 * Authorization error for permission denials
 */
export class AuthorizationError extends AppError {
  constructor(message: string = 'You do not have permission to perform this action') {
    super(message, 'AUTHORIZATION_ERROR', 403);
    this.name = 'AuthorizationError';
  }
}

/**
 * Not found error for missing resources
 */
export class NotFoundError extends AppError {
  constructor(message: string, public resourceType?: string) {
    super(message, 'NOT_FOUND', 404, { resourceType });
    this.name = 'NotFoundError';
  }
}

/**
 * Rate limit error
 */
export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests. Please try again later.') {
    super(message, 'RATE_LIMIT', 429);
    this.name = 'RateLimitError';
  }
}

/**
 * Type for all possible application errors
 */
export type ErrorType =
  | AppError
  | NetworkError
  | ValidationError
  | AuthError
  | AuthorizationError
  | NotFoundError
  | RateLimitError
  | SupabaseError
  | Error
  | unknown;

/**
 * Centralized error handler
 * Converts unknown errors into typed AppError instances
 */
export function handleError(error: unknown, context?: string): AppError {
  // Already an AppError
  if (error instanceof AppError) {
    return error;
  }

  // Supabase error
  if (isSupabaseError(error)) {
    const statusCode = getSupabaseStatusCode(error.code);
    return new AppError(
      error.message,
      error.code,
      statusCode,
      { hint: error.hint, details: error.details }
    );
  }

  // Native Error
  if (error instanceof Error) {
    // Try to identify specific error types
    if (error.message.includes('Network')) {
      return new NetworkError(error.message);
    }
    if (error.message.includes('permission') || error.message.includes('authorized')) {
      return new AuthorizationError(error.message);
    }
    if (error.message.includes('not found') || error.message.includes('404')) {
      return new NotFoundError(error.message);
    }
    if (error.message.includes('rate limit') || error.message.includes('429')) {
      return new RateLimitError(error.message);
    }
    if (error.message.includes('auth') || error.message.includes('login') || error.message.includes('password')) {
      return new AuthError(error.message);
    }

    // Generic error
    return new AppError(
      error.message,
      'UNKNOWN_ERROR',
      500,
      { context, originalError: error.name }
    );
  }

  // String error
  if (typeof error === 'string') {
    return new AppError(error, 'STRING_ERROR', 500, { context });
  }

  // Unknown error type
  return new AppError(
    'An unknown error occurred',
    'UNKNOWN_ERROR',
    500,
    { context, originalError: error }
  );
}

/**
 * Map Supabase error codes to HTTP status codes
 */
function getSupabaseStatusCode(code: string): number {
  const statusMap: Record<string, number> = {
    '23505': 409,    // Unique violation
    '23503': 409,    // Foreign key violation
    '42501': 400,    // Insufficient privilege
    'PGRST116': 401, // API key missing
    'PGRST301': 403, // API key disabled
    'JWT0001': 401,  // Invalid JWT
  };
  return statusMap[code] || 500;
}

/**
 * Get user-friendly error message
 */
export function getUserErrorMessage(error: AppError): string {
  switch (error.code) {
    case 'VALIDATION_ERROR':
      return error.message;
    case 'AUTH_ERROR':
      return error.message;
    case 'AUTHORIZATION_ERROR':
      return error.message;
    case 'NOT_FOUND':
      return error.message;
    case 'RATE_LIMIT':
      return error.message;
    case 'NETWORK_ERROR':
      return 'Network error. Please check your connection and try again.';
    case '23505': // Unique violation
      return 'This record already exists.';
    case '23503': // Foreign key violation
      return 'Referenced record does not exist.';
    default:
      return error.message || 'Something went wrong. Please try again.';
  }
}

/**
 * Log error to monitoring service (placeholder for Sentry integration)
 */
export function logError(error: AppError, context?: string): void {
  // TODO: Integrate with Sentry or other monitoring service
  const errorData = {
    name: error.name,
    message: error.message,
    code: error.code,
    statusCode: error.statusCode,
    details: error.details,
    context,
    timestamp: new Date().toISOString(),
  };

  // In production, send to monitoring service
  if (import.meta.env.PROD) {
    // Sentry.captureException(error, { contexts: { errorData } });
  } else {
    // Development: log to console
    console.error('[Error Logger]', errorData);
  }
}
