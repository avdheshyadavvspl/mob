import { Request, Response } from 'express';
import { z } from 'zod';
import { aiQueryService } from '../services/ai-query.service';

const askSchema = z.object({
  question: z.string().min(2, 'Question must not be empty'),
});

export class AiController {
  async ask(req: Request, res: Response) {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const parsed = askSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ success: false, errors: parsed.error.errors });
      }

      const result = await aiQueryService.processPlainEnglishQuery(parsed.data.question, user);
      return res.json({
        success: true,
        data: result,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}

export const aiController = new AiController();
