import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger';
import { AppError, ErrorResponse } from '../types';

// Handle PostgreSQL unique constraint violation
const handleUniqueViolation = (err: any): AppError => {
  const message = `Duplicate field value. Please use another value!`;
  return new AppError(message, 400);
};

// Handle PostgreSQL foreign key violation
const handleForeignKeyViolation = (err: any): AppError => {
  const message = `Invalid reference. The referenced record does not exist.`;
  return new AppError(message, 400);
};

// Handle PostgreSQL not null violation
const handleNotNullViolation = (err: any): AppError => {
  const message = `Missing required field: ${err.column}`;
  return new AppError(message, 400);
};

// Handle Validation Error
const handleValidationError = (err: any): AppError => {
  const errors = Object.values(err.errors || {}).map((el: any) => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

// Handle JWT Error
const handleJWTError = (): AppError =>
  new AppError('Invalid token. Please log in again!', 401);

// Handle JWT Expired Error
const handleJWTExpiredError = (): AppError =>
  new AppError('Your token has expired! Please log in again.', 401);

// Send error response in development
const sendErrorDev = (err: AppError, res: Response): void => {
  const response: ErrorResponse = {
    status: err.statusCode >= 400 && err.statusCode < 500 ? 'fail' : 'error',
    message: err.message,
    stack: err.stack,
    errors: (err as any).errors,
  };

  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    statusCode: err.statusCode,
  });

  res.status(err.statusCode).json(response);
};

// Send error response in production
const sendErrorProd = (err: AppError, res: Response): void => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    const response: ErrorResponse = {
      status: err.statusCode >= 400 && err.statusCode < 500 ? 'fail' : 'error',
      message: err.message,
    };

    logger.error('Operational Error:', {
      message: err.message,
      statusCode: err.statusCode,
    });

    res.status(err.statusCode).json(response);
  } else {
    // Programming or other unknown error: don't leak error details
    logger.error('CRITICAL ERROR 💥', {
      message: err.message,
      stack: err.stack,
    });

    res.status(500).json({
      status: 'error',
      message: 'Something went wrong!',
    });
  }
};

// Global error handler
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    error.message = err.message;

    // PostgreSQL error codes
    if (err.code === '23505') error = handleUniqueViolation(err);
    if (err.code === '23503') error = handleForeignKeyViolation(err);
    if (err.code === '23502') error = handleNotNullViolation(err);

    // Validation errors
    if (err.name === 'ValidationError') error = handleValidationError(err);

    // JWT errors
    if (err.name === 'JsonWebTokenError') error = handleJWTError();
    if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendErrorProd(error, res);
  }
};

// Handle 404 Not Found
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const err = new AppError(
    `Can't find ${req.originalUrl} on this server!`,
    404
  );
  next(err);
};

// Async error wrapper
export const catchAsync = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
