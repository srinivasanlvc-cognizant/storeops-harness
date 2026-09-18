import type { Request, Response } from 'express';
import { NotFoundError } from '../errors';

export function notFoundHandler(req: Request, _res: Response): void {
  throw new NotFoundError(`route ${req.method} ${req.originalUrl} not found`);
}
