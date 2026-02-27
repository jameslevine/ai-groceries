import { NextFunction, Request, Response } from 'express';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  console.error('Unhandled error:', err);

  const statusCode = (err as any).statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
