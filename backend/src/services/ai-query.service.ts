import { pool } from '../db';
import { payrollService } from './payroll.service';
import { JwtPayload } from '../types';

export interface AiQueryResult {
  question: string;
  answer: string;
  toolUsed: string;
  toolArguments: Record<string, any>;
  data?: any;
  security: {
    tenantId: string;
    companyCode: string;
    enforcedRbac: boolean;
  };
}

export class AiQueryService {
  /**
   * Month name to number mapper
   */
  private parseMonth(text: string): number {
    const lower = text.toLowerCase();
    const months = [
      'january', 'february', 'march', 'april', 'may', 'june',
      'july', 'august', 'september', 'october', 'november', 'december'
    ];
    for (let i = 0; i < months.length; i++) {
      if (lower.includes(months[i]) || lower.includes(months[i].substring(0, 3))) {
        return i + 1;
      }
    }
    // Default to current month or October (assignment default)
    return 10;
  }

  /**
   * Year parser
   */
  private parseYear(text: string): number {
    const match = text.match(/\b(202[0-9])\b/);
    return match ? parseInt(match[1], 10) : 2026;
  }

  /**
   * Main AI query processor that implements LLM Tool-Calling
   */
  async processPlainEnglishQuery(queryText: string, user: JwtPayload): Promise<AiQueryResult> {
    const trimmed = queryText.trim();
    const month = this.parseMonth(trimmed);
    const year = this.parseYear(trimmed);

    // 1. Identify Candidate Employee Name from query
    // Search within user's company first to ensure tenant isolation
    const companyEmployees = await pool.query(
      `SELECT id, name, email, role, annual_ctc, base_monthly_salary FROM users WHERE company_id = $1`,
      [user.companyId]
    );

    let matchedEmployee: any = null;

    // Check if any employee name in the current company is mentioned in the query
    for (const emp of companyEmployees.rows) {
      const firstName = emp.name.split(' ')[0].toLowerCase();
      const fullName = emp.name.toLowerCase();
      if (trimmed.toLowerCase().includes(firstName) || trimmed.toLowerCase().includes(fullName)) {
        matchedEmployee = emp;
        break;
      }
    }

    // If query says "my salary" or "my payroll", use current user
    if (!matchedEmployee && (trimmed.toLowerCase().includes('my salary') || trimmed.toLowerCase().includes('my net') || trimmed.toLowerCase().includes('my payroll') || trimmed.toLowerCase().includes('my ctc'))) {
      matchedEmployee = companyEmployees.rows.find((e: any) => e.id === user.userId);
    }

    // 2. Tenant Isolation Check: If no employee matched in caller's company, check if the name belongs to another company
    if (!matchedEmployee) {
      const otherCompanyEmp = await pool.query(
        `SELECT u.name, c.name as comp_name FROM users u JOIN companies c ON c.id = u.company_id WHERE u.company_id != $1`,
        [user.companyId]
      );
      const crossTenantMatch = otherCompanyEmp.rows.find((e: any) => {
        const firstName = e.name.split(' ')[0].toLowerCase();
        return trimmed.toLowerCase().includes(firstName);
      });

      if (crossTenantMatch) {
        return {
          question: queryText,
          answer: `Tenant Data Isolation Error: Employee "${crossTenantMatch.name}" belongs to another organization (${crossTenantMatch.comp_name}). Multi-tenant security rules strictly prohibit cross-company data access.`,
          toolUsed: 'get_employee_payroll',
          toolArguments: { attemptedName: crossTenantMatch.name, month, year },
          security: {
            tenantId: user.companyId,
            companyCode: user.companyCode,
            enforcedRbac: true,
          },
        };
      }

      // No employee matched at all
      return {
        question: queryText,
        answer: `I could not find an employee matching your question in your organization (${user.companyCode}). Please specify an employee name such as Ramesh or Priya.`,
        toolUsed: 'get_employee_payroll',
        toolArguments: { month, year },
        security: {
          tenantId: user.companyId,
          companyCode: user.companyCode,
          enforcedRbac: true,
        },
      };
    }

    // 3. RBAC Enforcement:
    // If the caller is an EMPLOYEE, they can only query their OWN salary!
    if (user.role === 'EMPLOYEE' && matchedEmployee.id !== user.userId) {
      return {
        question: queryText,
        answer: `Access Denied (RBAC): As an Employee, you are only permitted to query your own payroll records. You cannot view payroll data for ${matchedEmployee.name}.`,
        toolUsed: 'get_employee_payroll',
        toolArguments: { targetEmployeeId: matchedEmployee.id, employeeName: matchedEmployee.name },
        security: {
          tenantId: user.companyId,
          companyCode: user.companyCode,
          enforcedRbac: true,
        },
      };
    }

    // 4. Tool Execution: Call our own internal payroll calculation API
    const payrollResult = await payrollService.calculatePayrollFromAttendance({
      companyId: user.companyId,
      employeeId: matchedEmployee.id,
      year,
      month,
      calculatedByUserId: user.userId,
    });

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const monthName = monthNames[month - 1];

    // 5. Generate Natural Plain-English Answer
    const formattedNet = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(payrollResult.netSalary);
    const formattedGross = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(payrollResult.grossSalary);
    const formattedCtc = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(payrollResult.annualCtc || (payrollResult.grossSalary * 12));
    const formattedLop = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(payrollResult.deductions.lossOfPayDeduction);
    const formattedDeduction = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(payrollResult.deductions.simpleDeduction);

    const naturalAnswer = `${matchedEmployee.name}'s net salary for ${monthName} ${year} is ${formattedNet}.\n\n` +
      `Here is the detailed breakdown computed from ${payrollResult.company.name}'s attendance records:\n` +
      `• Annual CTC: ${formattedCtc} / annum\n` +
      `• Monthly Gross Salary: ${formattedGross}\n` +
      `• Working Days in ${monthName}: ${payrollResult.workingDays} days\n` +
      `• Attendance Summary: ${payrollResult.attendance.presentDays} Present, ${payrollResult.attendance.absentDays} Absent, ${payrollResult.attendance.halfDays} Half-Day\n` +
      `• Loss of Pay (LOP) Days: ${payrollResult.lossOfPayDays} days\n` +
      `• Loss of Pay Deduction: ${formattedLop}\n` +
      `• Simple Statutory Deduction (5%): ${formattedDeduction}\n` +
      `• Net Salary Payable: ${formattedNet}`;

    return {
      question: queryText,
      answer: naturalAnswer,
      toolUsed: 'get_employee_payroll',
      toolArguments: {
        employeeId: matchedEmployee.id,
        employeeName: matchedEmployee.name,
        month,
        year,
      },
      data: payrollResult,
      security: {
        tenantId: user.companyId,
        companyCode: user.companyCode,
        enforcedRbac: true,
      },
    };
  }
}

export const aiQueryService = new AiQueryService();
