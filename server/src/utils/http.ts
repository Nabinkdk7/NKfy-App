import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

export function routeParam(req: Request, name: string): string {
  const value = req.params[name];
  if (typeof value !== 'string' || value.length === 0) {
    throw new ApiError(400, 'Invalid request path', 'invalid_path');
  }
  return value;
}

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, message: string, code = 'request_failed') {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    handler(req, res, next).catch(next);
  };
}

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ error: { code: 'not_found', message: 'Route not found' } });
}

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (error instanceof ApiError) {
    res.status(error.status).json({
      error: { code: error.code, message: error.message },
    });
    return;
  }

  if (error instanceof ZodError) {
    res.status(400).json({
      error: {
        code: 'invalid_request',
        message: 'Some fields are invalid',
        details: error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      },
    });
    return;
  }

  console.error('[nkfy] Unhandled error:', error);
  res.status(500).json({
    error: { code: 'internal_error', message: 'Something went wrong' },
  });
}
