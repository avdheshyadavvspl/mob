export type UserRole = 'ADMIN' | 'EMPLOYEE';

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'HALF_DAY';

export interface Company {
  id: string;
  name: string;
  code: string;
  default_monthly_working_days: number;
  created_at: Date;
}

export interface CompanyWorkingDaysConfig {
  id: string;
  company_id: string;
  year: number;
  month: number;
  working_days: number;
  created_at: Date;
}

export interface User {
  id: string;
  company_id: string;
  name: string;
  email: string;
  role: UserRole;
  designation?: string;
  base_monthly_salary: number;
  created_at: Date;
}

export interface AttendanceRecord {
  id: string;
  company_id: string;
  employee_id: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  notes?: string;
  created_at: Date;
}

export interface AttendanceSummary {
  totalRecords: number;
  presentCount: number;
  absentCount: number;
  halfDayCount: number;
  lopDays: number;
  payableDays: number;
}

export interface PayrollCalculationInput {
  baseMonthlySalary: number;
  workingDaysInMonth: number;
  presentDays: number;
  absentDays: number;
  halfDays: number;
  customDeductionPercent?: number; // default 5%
  flatDeduction?: number;
}

export interface PayrollCalculationResult {
  workingDays: number;
  presentDays: number;
  absentDays: number;
  halfDays: number;
  lossOfPayDays: number;
  payableDays: number;
  grossSalary: number;
  perDaySalary: number;
  lossOfPayDeduction: number;
  simpleDeduction: number;
  totalDeductions: number;
  netSalary: number;
}

export interface JwtPayload {
  userId: string;
  companyId: string;
  companyCode: string;
  role: UserRole;
  email: string;
  name: string;
}

// Extension to Express Request
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
      companyId?: string;
    }
  }
}
