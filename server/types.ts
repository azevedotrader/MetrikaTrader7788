import { Request } from 'express';

// Extend Express Request to include userId property
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

// Custom Request type with userId required
export interface AuthenticatedRequest extends Request {
  userId: string;
}