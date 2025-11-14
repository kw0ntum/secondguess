import { Router, Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { ApiError } from '../types/api-types';
import { logger } from '../../utils/logger';

const router = Router();

/**
 * POST /api/auth/guest
 * Generate a guest token for anonymous users
 * This allows users to try the app without registration
 */
router.post('/guest', async (req: Request, res: Response) => {
  try {
    const token = AuthService.generateGuestToken();
    
    logger.info('Guest token generated');
    
    res.json({
      token,
      tokenType: 'Bearer',
      expiresIn: '24h',
      userType: 'guest'
    });
  } catch (error) {
    logger.error('Guest token generation failed:', error);
    const apiError: ApiError = {
      code: 'TOKEN_GENERATION_FAILED',
      message: 'Failed to generate guest token',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    };
    res.status(500).json({ error: apiError });
  }
});

/**
 * POST /api/auth/refresh
 * Refresh an existing token
 */
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const error: ApiError = {
        code: 'MISSING_AUTH_TOKEN',
        message: 'Authorization token is required',
        timestamp: new Date().toISOString()
      };
      res.status(401).json({ error });
      return;
    }
    
    const token = authHeader.substring(7);
    const payload = AuthService.verifyToken(token);
    
    if (!payload) {
      const error: ApiError = {
        code: 'INVALID_AUTH_TOKEN',
        message: 'Invalid or expired token',
        timestamp: new Date().toISOString()
      };
      res.status(401).json({ error });
      return;
    }
    
    // Generate new token with same user data
    const newToken = AuthService.generateToken({
      id: payload.userId,
      email: payload.email,
      roles: payload.roles
    });
    
    logger.info('Token refreshed', { userId: payload.userId });
    
    res.json({
      token: newToken,
      tokenType: 'Bearer',
      expiresIn: '24h'
    });
  } catch (error) {
    logger.error('Token refresh failed:', error);
    const apiError: ApiError = {
      code: 'TOKEN_REFRESH_FAILED',
      message: 'Failed to refresh token',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    };
    res.status(500).json({ error: apiError });
  }
});

export default router;
