import { Request, Response } from 'express';
import { z } from 'zod';
import { attendanceService } from '../services/attendance.service';

const markAttendanceSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  status: z.enum(['PRESENT', 'ABSENT', 'HALF_DAY']),
  notes: z.string().optional(),
});

const batchAttendanceSchema = z.object({
  records: z.array(markAttendanceSchema),
});

export class AttendanceController {
  async getEmployeeAttendance(req: Request, res: Response) {
    try {
      const companyId = req.companyId!;
      const employeeId = req.params.employeeId;
      const year = parseInt(req.query.year as string, 10) || 2026;
      const month = parseInt(req.query.month as string, 10) || 10;

      const result = await attendanceService.getEmployeeAttendance(companyId, employeeId, year, month);
      return res.json({ success: true, data: result });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  async markSingle(req: Request, res: Response) {
    try {
      const companyId = req.companyId!;
      const employeeId = req.params.employeeId;
      const parsed = markAttendanceSchema.safeParse(req.body);

      if (!parsed.success) {
        return res.status(400).json({ success: false, errors: parsed.error.errors });
      }

      const result = await attendanceService.markAttendance({
        companyId,
        employeeId,
        date: parsed.data.date,
        status: parsed.data.status,
        notes: parsed.data.notes,
      });

      return res.json({ success: true, data: result });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  async markBatch(req: Request, res: Response) {
    try {
      const companyId = req.companyId!;
      const employeeId = req.params.employeeId;
      const parsed = batchAttendanceSchema.safeParse(req.body);

      if (!parsed.success) {
        return res.status(400).json({ success: false, errors: parsed.error.errors });
      }

      const result = await attendanceService.batchMarkAttendance({
        companyId,
        employeeId,
        records: parsed.data.records,
      });

      return res.json({ success: true, count: result.length, data: result });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}

export const attendanceController = new AttendanceController();
