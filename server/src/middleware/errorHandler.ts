import { Request, Response, NextFunction } from 'express';

/**
 * Global error handling middleware.
 * In production, this prevents leaking internal stack traces or implementation details to the client.
 */
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  // Always log the full error for server-side debugging
  console.error('[Error]:', err.stack || err.message || err);

  const isProduction = process.env.NODE_ENV === 'production';
  const status = err.status || 500;

  // Mask detailed error information in production
  res.status(status).json({
    error: {
      message: isProduction ? 'An internal error occurred. Please contact support if the problem persists.' : (err.message || 'Internal Server Error'),
      status: status,
      ...(isProduction ? {} : { stack: err.stack })
    }
  });
};
