import { Request, Response } from 'express';
import { z } from 'zod';
import { payrollService } from '../services/payroll.service';

const calculatePayrollSchema = z.object({
  employeeId: z.string().uuid(),
  year: z.number().int().min(2020).max(2050).default(2026),
  month: z.number().int().min(1).max(12).default(10),
  // Optional payload: Can provide attendance list directly
  attendanceList: z.array(
    z.object({
      date: z.string().optional(),
      status: z.enum(['PRESENT', 'ABSENT', 'HALF_DAY']),
    })
  ).optional(),
  // Or provide attendance summary counts directly
  attendanceCounts: z.object({
    present: z.number().min(0).default(0),
    absent: z.number().min(0).default(0),
    halfDay: z.number().min(0).default(0),
  }).optional(),
  // Or optional custom working days override for calculation simulation
  customWorkingDays: z.number().int().min(1).max(31).optional(),
});

export class PayrollController {
  /**
   * Requirement 2:
   * Endpoint that takes a month's attendance (present / absent / half-day) for an employee
   * and returns loss-of-pay days, gross salary, a simple deduction, and net salary.
   */
  async calculate(req: Request, res: Response) {
    try {
      const companyId = req.companyId!;
      const parsed = calculatePayrollSchema.safeParse(req.body);

      if (!parsed.success) {
        return res.status(400).json({ success: false, errors: parsed.error.errors });
      }

      const { employeeId, year, month, attendanceList, attendanceCounts, customWorkingDays } = parsed.data;

      const result = await payrollService.calculatePayrollFromAttendance({
        companyId,
        employeeId,
        year,
        month,
        attendanceList,
        attendanceCounts,
        customWorkingDays,
        calculatedByUserId: req.user?.userId,
      });

      return res.json({
        success: true,
        data: result,
      });
    } catch (err: any) {
      const status = err.statusCode || 500;
      return res.status(status).json({ success: false, error: err.message });
    }
  }

  async viewPayroll(req: Request, res: Response) {
    try {
      const companyId = req.companyId!;
      const employeeId = req.params.employeeId;
      const year = parseInt(req.query.year as string, 10) || 2026;
      const month = parseInt(req.query.month as string, 10) || 10;

      const result = await payrollService.getPayrollView(companyId, employeeId, year, month);
      return res.json({ success: true, data: result });
    } catch (err: any) {
      const status = err.statusCode || 500;
      return res.status(status).json({ success: false, error: err.message });
    }
  }

  async getHistory(req: Request, res: Response) {
    try {
      const companyId = req.companyId!;
      const employeeId = req.params.employeeId;
      const history = await payrollService.getPayrollHistory(companyId, employeeId);
      return res.json({ success: true, data: history });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}

export const payrollController = new PayrollController();
