import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { logger } from '../../utils/logger';
import { AuthenticatedUser } from '../types/api-types';

// In production, this should be loaded from environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRY: string | number = process.env.JWT_EXPIRY || '24h';

export interface TokenPayload {
  userId: string;
  email: string;
  roles: string[];
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name?: string;
}

/**
 * Authentication Service
 * Handles JWT token generation, validation, and user authentication
 */
export class AuthService {
  /**
   * Generate a JWT token for a user
   */
  static generateToken(user: AuthenticatedUser): string {
    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      roles: user.roles
    };

    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: '24h',
      issuer: 'ai-voice-sop-agent',
      audience: 'api'
    });
  }

  /**
   * Verify and decode a JWT token
   */
  static verifyToken(token: string): TokenPayload | null {
    try {
      const decoded = jwt.verify(token, JWT_SECRET, {
        issuer: 'ai-voice-sop-agent',
        audience: 'api'
      }) as TokenPayload;

      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        logger.warn('Token expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        logger.warn('Invalid token');
      } else {
        logger.error('Token verification error:', error);
      }
      return null;
    }
  }

  /**
   * Hash a password
   */
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Compare a password with a hash
   */
  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Create a guest/anonymous user token
   * For demo purposes - allows users to try the app without registration
   */
  static generateGuestToken(): string {
    const guestUser: AuthenticatedUser = {
      id: `guest-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      email: 'guest@example.com',
      roles: ['guest']
    };

    return this.generateToken(guestUser);
  }

  /**
   * Validate password strength
   */
  static validatePassword(password: string): { valid: boolean; message?: string } {
    if (password.length < 8) {
      return { valid: false, message: 'Password must be at least 8 characters long' };
    }
    if (!/[A-Z]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one uppercase letter' };
    }
    if (!/[a-z]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one lowercase letter' };
    }
    if (!/[0-9]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one number' };
    }
    return { valid: true };
  }

  /**
   * Validate email format
   */
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
