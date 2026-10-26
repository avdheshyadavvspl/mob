import { Request, Response } from 'express';
import { z } from 'zod';
import { authService } from '../services/auth.service';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export class AuthController {
  async login(req: Request, res: Response) {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ success: false, errors: parsed.error.errors });
      }

      const result = await authService.login(parsed.data.email, parsed.data.password);
      return res.json({ success: true, data: result });
    } catch (error: any) {
      const status = error.statusCode || 500;
      return res.status(status).json({ success: false, error: error.message });
    }
  }

  async me(req: Request, res: Response) {
    return res.json({ success: true, user: req.user });
  }
}

export const authController = new AuthController();
