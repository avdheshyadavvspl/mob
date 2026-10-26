import { pool } from '../db';
import { Company, CompanyWorkingDaysConfig, User } from '../types';

export class CompanyService {
  async getCompanyById(companyId: string): Promise<Company | null> {
    const res = await pool.query(
      `SELECT id, name, code, default_monthly_working_days, created_at
       FROM companies WHERE id = $1`,
      [companyId]
    );
    return res.rows[0] || null;
  }

  async getAllCompanies(): Promise<Company[]> {
    const res = await pool.query(
      `SELECT id, name, code, default_monthly_working_days, created_at
       FROM companies ORDER BY name ASC`
    );
    return res.rows;
  }

  async getEmployeesByCompany(companyId: string): Promise<Omit<User, 'password_hash'>[]> {
    const res = await pool.query(
      `SELECT id, company_id, name, email, role, designation, annual_ctc, base_monthly_salary, created_at
       FROM users
       WHERE company_id = $1
       ORDER BY role ASC, name ASC`,
      [companyId]
    );
    return res.rows.map(r => ({
      ...r,
      annual_ctc: Number(r.annual_ctc || Number(r.base_monthly_salary) * 12),
      base_monthly_salary: Number(r.base_monthly_salary),
    }));
  }

  /**
   * For employee self-view: strictly return ONLY the employee's own record
   */
  async getEmployeeSelf(companyId: string, employeeId: string): Promise<Omit<User, 'password_hash'>[]> {
    const res = await pool.query(
      `SELECT id, company_id, name, email, role, designation, annual_ctc, base_monthly_salary, created_at
       FROM users
       WHERE company_id = $1 AND id = $2`,
      [companyId, employeeId]
    );
    return res.rows.map(r => ({
      ...r,
      annual_ctc: Number(r.annual_ctc || Number(r.base_monthly_salary) * 12),
      base_monthly_salary: Number(r.base_monthly_salary),
    }));
  }

  async getWorkingDaysConfig(
    companyId: string,
    year: number,
    month: number
  ): Promise<{ workingDays: number; isCustomOverride: boolean }> {
    const res = await pool.query(
      `SELECT working_days FROM company_working_days_config
       WHERE company_id = $1 AND year = $2 AND month = $3`,
      [companyId, year, month]
    );

    if (res.rows.length > 0) {
      return { workingDays: Number(res.rows[0].working_days), isCustomOverride: true };
    }

    const comp = await this.getCompanyById(companyId);
    return {
      workingDays: comp ? Number(comp.default_monthly_working_days) : 22,
      isCustomOverride: false,
    };
  }

  async setWorkingDaysConfig(
    companyId: string,
    year: number,
    month: number,
    workingDays: number
  ): Promise<CompanyWorkingDaysConfig> {
    const res = await pool.query(
      `INSERT INTO company_working_days_config (company_id, year, month, working_days)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (company_id, year, month)
       DO UPDATE SET working_days = EXCLUDED.working_days, created_at = CURRENT_TIMESTAMP
       RETURNING id, company_id, year, month, working_days, created_at`,
      [companyId, year, month, workingDays]
    );
    return res.rows[0];
  }
}

export const companyService = new CompanyService();
