import { AttendanceRecord, AttendanceSummary, Employee, PayrollResult, UserSession, AiResponse } from './types';

const API_BASE = '/api';

export const PRESET_ACCOUNTS = [
  {
    label: '🏢 Tata Technologies — Admin (Aarav Sharma)',
    email: 'admin@tata.com',
    password: 'password123',
    role: 'ADMIN',
    company: 'TATA',
    desc: 'Can calculate/view payroll for anyone at Tata Technologies',
  },
  {
    label: '👨‍💻 Tata Technologies — Employee (Ramesh Kumar)',
    email: 'ramesh@tata.com',
    password: 'password123',
    role: 'EMPLOYEE',
    company: 'TATA',
    desc: 'Self only. Has 3 LOP days in Oct 2026',
  },
  {
    label: '👩‍🎨 Tata Technologies — Employee (Priya Sharma)',
    email: 'priya@tata.com',
    password: 'password123',
    role: 'EMPLOYEE',
    company: 'TATA',
    desc: 'Self only. Has 100% perfect attendance',
  },
  {
    label: '🏭 Reliance Industries — Admin (Vikram Malhotra)',
    email: 'admin@reliance.com',
    password: 'password123',
    role: 'ADMIN',
    company: 'RELIANCE',
    desc: 'Cannot view any Tata data (Strict Tenant Isolation)',
  },
  {
    label: '☁️ Reliance Industries — Employee (Rohan Verma)',
    email: 'rohan@reliance.com',
    password: 'password123',
    role: 'EMPLOYEE',
    company: 'RELIANCE',
    desc: 'Reliance employee. 20 working days/mo (2 LOP days)',
  },
  {
    label: '🛡️ Reliance Industries — Employee (Ananya Iyer)',
    email: 'ananya@reliance.com',
    password: 'password123',
    role: 'EMPLOYEE',
    company: 'RELIANCE',
    desc: 'Cybersecurity Specialist at Reliance',
  },
];

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      const err = new Error(json.error || `HTTP ${res.status}`);
      (err as any).status = res.status;
      (err as any).data = json;
      throw err;
    }

    return json.data;
  }

  async login(email: string, password: string): Promise<UserSession> {
    const data = await this.request<UserSession>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(data.token);
    return data;
  }

  async getEmployees(): Promise<Employee[]> {
    return this.request<Employee[]>('/companies/employees');
  }

  async getWorkingDays(year = 2026, month = 10): Promise<{ year: number; month: number; workingDays: number; isCustomOverride: boolean }> {
    return this.request(`/companies/working-days?year=${year}&month=${month}`);
  }

  async setWorkingDays(year: number, month: number, workingDays: number): Promise<any> {
    return this.request('/companies/working-days', {
      method: 'POST',
      body: JSON.stringify({ year, month, workingDays }),
    });
  }

  async getAttendance(employeeId: string, year = 2026, month = 10): Promise<{ records: AttendanceRecord[]; summary: AttendanceSummary }> {
    return this.request(`/attendance/${employeeId}?year=${year}&month=${month}`);
  }

  async markAttendance(employeeId: string, date: string, status: 'PRESENT' | 'ABSENT' | 'HALF_DAY', notes?: string) {
    return this.request(`/attendance/${employeeId}`, {
      method: 'POST',
      body: JSON.stringify({ date, status, notes }),
    });
  }

  async getPayrollView(employeeId: string, year = 2026, month = 10): Promise<PayrollResult> {
    return this.request<PayrollResult>(`/payroll/view/${employeeId}?year=${year}&month=${month}`);
  }

  async calculatePayroll(payload: {
    employeeId: string;
    year?: number;
    month?: number;
    attendanceCounts?: { present: number; absent: number; halfDay: number };
    customWorkingDays?: number;
  }): Promise<PayrollResult> {
    return this.request<PayrollResult>('/payroll/calculate', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async askAi(question: string): Promise<AiResponse> {
    return this.request<AiResponse>('/ai/ask', {
      method: 'POST',
      body: JSON.stringify({ question }),
    });
  }
}

export const api = new ApiClient();
