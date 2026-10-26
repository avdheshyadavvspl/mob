export type Role = 'ADMIN' | 'EMPLOYEE';
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'HALF_DAY';

export interface UserSession {
  token: string;
  user: {
    id: string;
    company_id: string;
    name: string;
    email: string;
    role: Role;
    designation: string;
    base_monthly_salary: number;
  };
  company: {
    id: string;
    name: string;
    code: string;
    defaultWorkingDays: number;
  };
}

export interface Employee {
  id: string;
  company_id: string;
  name: string;
  email: string;
  role: Role;
  designation?: string;
  base_monthly_salary: number;
}

export interface AttendanceRecord {
  id: string;
  company_id: string;
  employee_id: string;
  date: string;
  status: AttendanceStatus;
  notes?: string;
}

export interface AttendanceSummary {
  totalRecords: number;
  presentCount: number;
  absentCount: number;
  halfDayCount: number;
  lopDays: number;
}

export interface PayrollResult {
  runId: string;
  calculatedAt: string;
  company: {
    id: string;
    name: string;
    code: string;
  };
  employee: {
    id: string;
    name: string;
    email: string;
    designation?: string;
  };
  period: {
    year: number;
    month: number;
    monthName: string;
  };
  workingDays: number;
  attendance: {
    presentDays: number;
    absentDays: number;
    halfDays: number;
    totalMarkedDays: number;
  };
  lossOfPayDays: number;
  grossSalary: number;
  deductions: {
    lossOfPayDeduction: number;
    simpleDeduction: number;
    totalDeductions: number;
  };
  netSalary: number;
  breakdown: {
    perDaySalary: number;
    payableDays: number;
    simpleDeductionRule: string;
  };
}

export interface AiResponse {
  question: string;
  answer: string;
  toolUsed: string;
  toolArguments: Record<string, any>;
  data?: PayrollResult;
  security: {
    tenantId: string;
    companyCode: string;
    enforcedRbac: boolean;
  };
}
