const { writeLog } = require('../utils/logger');

/**
 * Custom Error Classes for better error handling
 */
class ValidationError extends Error {
  constructor(message, field = null) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
    this.code = 'validation_error';
    this.field = field;
  }
}

class AuthenticationError extends Error {
  constructor(message = 'Authentication required') {
    super(message);
    this.name = 'AuthenticationError';
    this.statusCode = 401;
    this.code = 'authentication_error';
  }
}

class AuthorizationError extends Error {
  constructor(message = 'Insufficient permissions') {
    super(message);
    this.name = 'AuthorizationError';
    this.statusCode = 403;
    this.code = 'authorization_error';
  }
}

class NotFoundError extends Error {
  constructor(message = 'Resource not found', resource = null) {
    super(message);
    this.name = 'NotFoundError';
    this.statusCode = 404;
    this.code = 'not_found';
    this.resource = resource;
  }
}

class ConflictError extends Error {
  constructor(message = 'Resource conflict') {
    super(message);
    this.name = 'ConflictError';
    this.statusCode = 409;
    this.code = 'conflict_error';
  }
}

class RateLimitError extends Error {
  constructor(message = 'Rate limit exceeded') {
    super(message);
    this.name = 'RateLimitError';
    this.statusCode = 429;
    this.code = 'rate_limit_exceeded';
  }
}

class ServiceUnavailableError extends Error {
  constructor(message = 'Service temporarily unavailable') {
    super(message);
    this.name = 'ServiceUnavailableError';
    this.statusCode = 503;
    this.code = 'service_unavailable';
  }
}

/**
 * Enhanced Error Handling Middleware
 * Provides comprehensive error logging and response formatting
 */
const errorHandler = (error, req, res, next) => {
  // If response already sent, delegate to Express default error handler
  if (res.headersSent) {
    return next(error);
  }

  // Default error structure
  let statusCode = 500;
  let code = 'internal_server_error';
  let message = 'Internal server error';
  let details = null;
  let stack = null;

  // Custom error handling based on error type
  if (error instanceof ValidationError ||
      error instanceof AuthenticationError ||
      error instanceof AuthorizationError ||
      error instanceof NotFoundError ||
      error instanceof ConflictError ||
      error instanceof RateLimitError ||
      error instanceof ServiceUnavailableError) {
    
    statusCode = error.statusCode;
    code = error.code;
    message = error.message;
    
    if (error instanceof ValidationError && error.field) {
      details = { field: error.field };
    }
    
    if (error instanceof NotFoundError && error.resource) {
      details = { resource: error.resource };
    }
  }
  // Supabase errors
  else if (error.code && error.code.startsWith('23')) { // PostgreSQL error codes
    statusCode = 400;
    code = 'database_constraint_error';
    
    if (error.code === '23505') { // Unique constraint violation
      message = 'Resource already exists';
      code = 'duplicate_resource';
      statusCode = 409;
    } else if (error.code === '23503') { // Foreign key constraint violation
      message = 'Referenced resource does not exist';
      code = 'invalid_reference';
    } else if (error.code === '23514') { // Check constraint violation
      message = 'Invalid data provided';
      code = 'constraint_violation';
    } else {
      message = 'Database constraint violation';
    }
  }
  // JWT errors
  else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    code = 'invalid_token';
    message = 'Invalid authentication token';
  }
  else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    code = 'token_expired';
    message = 'Authentication token has expired';
  }
  // Mongoose validation errors (if any legacy code exists)
  else if (error.name === 'ValidationError' && error.errors) {
    statusCode = 400;
    code = 'validation_error';
    message = 'Validation failed';
    details = Object.keys(error.errors).map(field => ({
      field,
      message: error.errors[field].message
    }));
  }
  // Axios/Network errors
  else if (error.response) {
    statusCode = 502;
    code = 'external_service_error';
    message = 'External service error';
    details = {
      service: error.config?.baseURL || 'external',
      status: error.response.status,
      statusText: error.response.statusText
    };
  }
  else if (error.request) {
    statusCode = 503;
    code = 'service_unavailable';
    message = 'External service unavailable';
  }
  // Syntax errors (malformed JSON, etc.)
  else if (error instanceof SyntaxError && error.status === 400) {
    statusCode = 400;
    code = 'invalid_json';
    message = 'Invalid JSON in request body';
  }

  // Log error details (but not for client errors like 400, 401, 403, 404)
  if (statusCode >= 500) {
    const errorLog = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.originalUrl,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id,
      error: {
        name: error.name,
        message: error.message,
        code: error.code,
        stack: error.stack
      }
    };
    
    console.error('🚨 SERVER ERROR:', JSON.stringify(errorLog, null, 2));
    
    // Log to file if logger is available
    if (writeLog) {
      writeLog('error', 'Server Error', errorLog);
    }
  } else if (statusCode >= 400) {
    // Log client errors at info level (less verbose)
    console.log(`⚠️  CLIENT ERROR [${statusCode}]: ${message} - ${req.method} ${req.originalUrl}`);
  }

  // Include stack trace in development mode only
  if (process.env.NODE_ENV !== 'production' && statusCode >= 500) {
    stack = error.stack;
  }

  // Create error response
  const errorResponse = {
    ok: false,
    code,
    message,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method
  };

  // Add optional fields
  if (details) errorResponse.details = details;
  if (stack) errorResponse.stack = stack;
  if (req.correlationId) errorResponse.correlationId = req.correlationId;

  // Send error response
  res.status(statusCode).json(errorResponse);
};

/**
 * Async Error Handler Wrapper
 * Wraps async route handlers to catch promise rejections
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 404 Not Found Handler
 */
const notFoundHandler = (req, res, next) => {
  const error = new NotFoundError(
    `Route ${req.method} ${req.originalUrl} not found`,
    'route'
  );
  next(error);
};

/**
 * Validation Helper Functions
 */
const validateRequired = (fields, body) => {
  const missing = [];
  
  for (const field of fields) {
    if (body[field] === undefined || body[field] === null || body[field] === '') {
      missing.push(field);
    }
  }
  
  if (missing.length > 0) {
    throw new ValidationError(
      `Missing required fields: ${missing.join(', ')}`,
      missing[0]
    );
  }
};

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ValidationError('Invalid email format', 'email');
  }
};

const validateUUID = (uuid, fieldName = 'id') => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(uuid)) {
    throw new ValidationError(`Invalid ${fieldName} format`, fieldName);
  }
};

const validateNumeric = (value, fieldName, min = null, max = null) => {
  const num = Number(value);
  if (isNaN(num)) {
    throw new ValidationError(`${fieldName} must be a valid number`, fieldName);
  }
  
  if (min !== null && num < min) {
    throw new ValidationError(`${fieldName} must be at least ${min}`, fieldName);
  }
  
  if (max !== null && num > max) {
    throw new ValidationError(`${fieldName} must be at most ${max}`, fieldName);
  }
  
  return num;
};

module.exports = {
  // Error classes
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  ServiceUnavailableError,
  
  // Middleware
  errorHandler,
  asyncHandler,
  notFoundHandler,
  
  // Validation helpers
  validateRequired,
  validateEmail,
  validateUUID,
  validateNumeric
};