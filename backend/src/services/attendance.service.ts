import { pool } from '../db';
import { AttendanceRecord, AttendanceStatus, AttendanceSummary } from '../types';

export class AttendanceService {
  async getEmployeeAttendance(
    companyId: string,
    employeeId: string,
    year: number,
    month: number
  ): Promise<{ records: AttendanceRecord[]; summary: AttendanceSummary }> {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-31`;

    const res = await pool.query(
      `SELECT id, company_id, employee_id, TO_CHAR(date, 'YYYY-MM-DD') as date, status, notes, created_at
       FROM attendance_records
       WHERE company_id = $1 AND employee_id = $2 AND date >= $3 AND date <= $4
       ORDER BY date ASC`,
      [companyId, employeeId, startDate, endDate]
    );

    let present = 0;
    let absent = 0;
    let halfDay = 0;

    for (const row of res.rows) {
      if (row.status === 'PRESENT') present++;
      else if (row.status === 'ABSENT') absent++;
      else if (row.status === 'HALF_DAY') halfDay++;
    }

    const lopDays = Number((absent * 1.0 + halfDay * 0.5).toFixed(2));

    return {
      records: res.rows,
      summary: {
        totalRecords: res.rows.length,
        presentCount: present,
        absentCount: absent,
        halfDayCount: halfDay,
        lopDays,
        payableDays: 0, // will be combined with working days in payroll
      },
    };
  }

  async markAttendance(params: {
    companyId: string;
    employeeId: string;
    date: string;
    status: AttendanceStatus;
    notes?: string;
  }) {
    const { companyId, employeeId, date, status, notes } = params;

    const res = await pool.query(
      `INSERT INTO attendance_records (company_id, employee_id, date, status, notes)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (employee_id, date)
       DO UPDATE SET status = EXCLUDED.status, notes = EXCLUDED.notes, created_at = CURRENT_TIMESTAMP
       RETURNING id, company_id, employee_id, TO_CHAR(date, 'YYYY-MM-DD') as date, status, notes`,
      [companyId, employeeId, date, status, notes || null]
    );

    return res.rows[0];
  }

  async batchMarkAttendance(params: {
    companyId: string;
    employeeId: string;
    records: Array<{ date: string; status: AttendanceStatus; notes?: string }>;
  }) {
    const { companyId, employeeId, records } = params;
    const results = [];

    for (const item of records) {
      const saved = await this.markAttendance({
        companyId,
        employeeId,
        date: item.date,
        status: item.status,
        notes: item.notes,
      });
      results.push(saved);
    }

    return results;
  }
}

export const attendanceService = new AttendanceService();
