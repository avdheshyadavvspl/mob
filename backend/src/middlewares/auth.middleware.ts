import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: 'Authentication token required (Bearer <token>)',
    });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = authService.verifyToken(token);
    req.user = payload;
    req.companyId = payload.companyId;
    next();
  } catch (error: any) {
    res.status(401).json({
      success: false,
      error: error.message || 'Unauthorized',
    });
  }
}
