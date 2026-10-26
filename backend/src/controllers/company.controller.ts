import { Request, Response } from 'express';
import { z } from 'zod';
import { companyService } from '../services/company.service';

const workingDaysConfigSchema = z.object({
  year: z.number().int().min(2020).max(2050),
  month: z.number().int().min(1).max(12),
  workingDays: z.number().int().min(0).max(31),
});

export class CompanyController {
  async getAllCompanies(req: Request, res: Response) {
    try {
      const companies = await companyService.getAllCompanies();
      return res.json({ success: true, data: companies });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  async getMyCompany(req: Request, res: Response) {
    try {
      const companyId = req.companyId!;
      const company = await companyService.getCompanyById(companyId);
      if (!company) {
        return res.status(404).json({ success: false, error: 'Company not found' });
      }
      return res.json({ success: true, data: company });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  async getEmployees(req: Request, res: Response) {
    try {
      const companyId = req.companyId!;
      const user = req.user;

      // Privacy / RBAC Enforcement:
      // If user is EMPLOYEE, strictly return ONLY their own profile! (Other employees are never exposed)
      const employees = (user && user.role === 'EMPLOYEE')
        ? await companyService.getEmployeeSelf(companyId, user.userId)
        : await companyService.getEmployeesByCompany(companyId);

      return res.json({ success: true, data: employees });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  async getWorkingDays(req: Request, res: Response) {
    try {
      const companyId = req.companyId!;
      const year = parseInt(req.query.year as string, 10) || 2026;
      const month = parseInt(req.query.month as string, 10) || 10;
      const config = await companyService.getWorkingDaysConfig(companyId, year, month);
      return res.json({ success: true, data: { year, month, ...config } });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  async setWorkingDays(req: Request, res: Response) {
    try {
      const companyId = req.companyId!;
      const parsed = workingDaysConfigSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ success: false, errors: parsed.error.errors });
      }

      const updated = await companyService.setWorkingDaysConfig(
        companyId,
        parsed.data.year,
        parsed.data.month,
        parsed.data.workingDays
      );
      return res.json({ success: true, data: updated });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}

export const companyController = new CompanyController();
