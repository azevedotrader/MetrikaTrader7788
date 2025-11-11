import { Request } from 'express';
import { User } from '@shared/schema';

// Extend Express Request to include userId property
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
  
  // Add global type for OAuth pending logins
  var oauthPendingLogins: Map<string, {
    user: Omit<User, 'password'>;
    token: string;
    expiresAt: number;
  }> | undefined;
}

// Custom Request type with userId required
export interface AuthenticatedRequest extends Request {
  userId: string;
}