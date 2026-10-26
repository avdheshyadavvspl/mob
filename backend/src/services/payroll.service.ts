import { pool } from '../db';
import {
  PayrollCalculationInput,
  PayrollCalculationResult,
  AttendanceStatus,
} from '../types';

/**
 * Pure calculation function for payroll
 * Easy to unit test and verify edge cases
 */
export function calculatePayrollMath(input: PayrollCalculationInput): PayrollCalculationResult {
  const {
    baseMonthlySalary,
    workingDaysInMonth,
    presentDays,
    absentDays,
    halfDays,
    customDeductionPercent = 5.0, // 5% simple standard statutory deduction
    flatDeduction = 0,
  } = input;

  if (workingDaysInMonth < 0) {
    throw new Error('Working days in month cannot be negative');
  }
  if (baseMonthlySalary < 0) {
    throw new Error('Base salary cannot be negative');
  }

  // Calculate Loss of Pay (LOP) days:
  // Each ABSENT = 1.0 day LOP
  // Each HALF_DAY = 0.5 day LOP
  const lossOfPayDays = Number((absentDays * 1.0 + halfDays * 0.5).toFixed(2));

  // Payable days cannot be negative
  const effectivePayableDays = workingDaysInMonth > 0 
    ? Math.max(0, Number((workingDaysInMonth - lossOfPayDays).toFixed(2)))
    : 0;

  // Per-day salary rate
  const perDaySalary = workingDaysInMonth > 0
    ? Number((baseMonthlySalary / workingDaysInMonth).toFixed(4))
    : 0;

  // LOP deduction
  // Capped at base gross salary
  const lossOfPayDeduction = Number(
    Math.min(baseMonthlySalary, Math.round(lossOfPayDays * perDaySalary * 100) / 100).toFixed(2)
  );

  // Simple deduction (e.g. 5% standard deduction + any flat tax/PF deduction)
  const percentDeduction = Math.round((baseMonthlySalary * (customDeductionPercent / 100)) * 100) / 100;
  const simpleDeduction = Number((percentDeduction + flatDeduction).toFixed(2));

  const totalDeductions = Number((lossOfPayDeduction + simpleDeduction).toFixed(2));

  // Net salary = Gross - LOP deduction - Simple deduction (min 0)
  const netSalary = Number(Math.max(0, baseMonthlySalary - totalDeductions).toFixed(2));

  return {
    workingDays: workingDaysInMonth,
    presentDays,
    absentDays,
    halfDays,
    lossOfPayDays,
    payableDays: effectivePayableDays,
    grossSalary: Number(baseMonthlySalary.toFixed(2)),
    perDaySalary: Number(perDaySalary.toFixed(2)),
    lossOfPayDeduction,
    simpleDeduction,
    totalDeductions,
    netSalary,
  };
}

export class PayrollService {
  /**
   * Get working days configuration for a company for a specific month/year.
   * If no specific override exists, falls back to company's default_monthly_working_days.
   */
  async getWorkingDaysForCompany(companyId: string, year: number, month: number): Promise<number> {
    const configRes = await pool.query(
      `SELECT working_days FROM company_working_days_config 
       WHERE company_id = $1 AND year = $2 AND month = $3`,
      [companyId, year, month]
    );

    if (configRes.rows.length > 0) {
      return Number(configRes.rows[0].working_days);
    }

    const companyRes = await pool.query(
      `SELECT default_monthly_working_days FROM companies WHERE id = $1`,
      [companyId]
    );

    if (companyRes.rows.length === 0) {
      throw new Error(`Company not found: ${companyId}`);
    }

    return Number(companyRes.rows[0].default_monthly_working_days);
  }

  /**
   * Endpoint implementation for Requirement 2:
   * Takes a month's attendance (present / absent / half-day) for an employee
   * and returns loss-of-pay days, gross salary, a simple deduction, and net salary.
   */
  async calculatePayrollFromAttendance(params: {
    companyId: string;
    employeeId: string;
    year: number;
    month: number;
    attendanceList?: Array<{ date?: string; status: AttendanceStatus }>;
    attendanceCounts?: { present: number; absent: number; halfDay: number };
    customWorkingDays?: number;
    calculatedByUserId?: string;
  }) {
    const { companyId, employeeId, year, month, attendanceList, attendanceCounts, customWorkingDays, calculatedByUserId } = params;

    // 1. Verify employee exists and belongs to company (tenant isolation)
    const empRes = await pool.query(
      `SELECT u.id, u.name, u.email, u.base_monthly_salary, u.designation, u.company_id, c.name as company_name, c.code as company_code
       FROM users u
       JOIN companies c ON c.id = u.company_id
       WHERE u.id = $1 AND u.company_id = $2`,
      [employeeId, companyId]
    );

    if (empRes.rows.length === 0) {
      const err = new Error('Employee not found in your organization');
      (err as any).statusCode = 404;
      throw err;
    }

    const employee = empRes.rows[0];
    const baseMonthlySalary = Number(employee.base_monthly_salary);

    // 2. Determine monthly working days
    const workingDays = customWorkingDays !== undefined
      ? customWorkingDays
      : await this.getWorkingDaysForCompany(companyId, year, month);

    // 3. Determine attendance counts
    let presentDays = 0;
    let absentDays = 0;
    let halfDays = 0;

    if (attendanceCounts) {
      presentDays = attendanceCounts.present || 0;
      absentDays = attendanceCounts.absent || 0;
      halfDays = attendanceCounts.halfDay || 0;
    } else if (attendanceList && attendanceList.length > 0) {
      for (const item of attendanceList) {
        if (item.status === 'PRESENT') presentDays++;
        else if (item.status === 'ABSENT') absentDays++;
        else if (item.status === 'HALF_DAY') halfDays++;
      }
    } else {
      // Fetch from database attendance_records for that month
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const endDate = `${year}-${String(month).padStart(2, '0')}-31`;

      const attRes = await pool.query(
        `SELECT status, count(*)::int as count
         FROM attendance_records
         WHERE company_id = $1 AND employee_id = $2 AND date >= $3 AND date <= $4
         GROUP BY status`,
        [companyId, employeeId, startDate, endDate]
      );

      for (const row of attRes.rows) {
        if (row.status === 'PRESENT') presentDays = Number(row.count);
        if (row.status === 'ABSENT') absentDays = Number(row.count);
        if (row.status === 'HALF_DAY') halfDays = Number(row.count);
      }
    }

    // 4. Perform calculation
    const calc = calculatePayrollMath({
      baseMonthlySalary,
      workingDaysInMonth: workingDays,
      presentDays,
      absentDays,
      halfDays,
      customDeductionPercent: 5.0, // 5% simple standard deduction
    });

    // 5. Store run in audit table
    const auditRes = await pool.query(
      `INSERT INTO payroll_runs (
        company_id, employee_id, year, month, working_days,
        present_days, absent_days, half_days, lop_days, payable_days,
        gross_salary, per_day_salary, lop_deduction, simple_deduction,
        net_salary, calculated_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING id, calculated_at`,
      [
        companyId,
        employeeId,
        year,
        month,
        calc.workingDays,
        calc.presentDays,
        calc.absentDays,
        calc.halfDays,
        calc.lossOfPayDays,
        calc.payableDays,
        calc.grossSalary,
        calc.perDaySalary,
        calc.lossOfPayDeduction,
        calc.simpleDeduction,
        calc.netSalary,
        calculatedByUserId || null,
      ]
    );

    return {
      runId: auditRes.rows[0].id,
      calculatedAt: auditRes.rows[0].calculated_at,
      company: {
        id: employee.company_id,
        name: employee.company_name,
        code: employee.company_code,
      },
      employee: {
        id: employee.id,
        name: employee.name,
        email: employee.email,
        designation: employee.designation,
      },
      period: {
        year,
        month,
        monthName: new Date(year, month - 1).toLocaleString('en-US', { month: 'long' }),
      },
      workingDays: calc.workingDays,
      attendance: {
        presentDays: calc.presentDays,
        absentDays: calc.absentDays,
        halfDays: calc.halfDays,
        totalMarkedDays: calc.presentDays + calc.absentDays + calc.halfDays,
      },
      // Explicit requirement outputs:
      lossOfPayDays: calc.lossOfPayDays,
      grossSalary: calc.grossSalary,
      deductions: {
        lossOfPayDeduction: calc.lossOfPayDeduction,
        simpleDeduction: calc.simpleDeduction, // Standard simple deduction
        totalDeductions: calc.totalDeductions,
      },
      netSalary: calc.netSalary,
      breakdown: {
        perDaySalary: calc.perDaySalary,
        payableDays: calc.payableDays,
        simpleDeductionRule: '5% statutory/standard deduction on gross salary',
      },
    };
  }

  /**
   * Get past payroll calculations for an employee (filtered by tenant)
   */
  async getPayrollHistory(companyId: string, employeeId: string, limit = 12) {
    const res = await pool.query(
      `SELECT pr.*, u.name as employee_name, u.email as employee_email
       FROM payroll_runs pr
       JOIN users u ON u.id = pr.employee_id
       WHERE pr.company_id = $1 AND pr.employee_id = $2
       ORDER BY pr.year DESC, pr.month DESC, pr.calculated_at DESC
       LIMIT $3`,
      [companyId, employeeId, limit]
    );
    return res.rows;
  }
}

export const payrollService = new PayrollService();
