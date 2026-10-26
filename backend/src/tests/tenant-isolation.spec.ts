import request from 'supertest';
import { app } from '../index';
import { pool } from '../db';
import { authService } from '../services/auth.service';

describe('Multi-Tenant Isolation & Role-Based Access Control (Requirements 3 & 4)', () => {
  let adminAToken: string;
  let rameshToken: string;
  let priyaToken: string;
  let adminBToken: string;
  let rameshId: string;
  let priyaId: string;
  let johnId: string;

  beforeAll(async () => {
    // Login as Alice Admin (Company A)
    const loginA = await authService.login('admin@acme.com', 'password123');
    adminAToken = loginA.token;

    // Login as Ramesh (Employee in Company A)
    const loginRamesh = await authService.login('ramesh@acme.com', 'password123');
    rameshToken = loginRamesh.token;
    rameshId = loginRamesh.user.id;

    // Login as Priya (Employee in Company A)
    const loginPriya = await authService.login('priya@acme.com', 'password123');
    priyaToken = loginPriya.token;
    priyaId = loginPriya.user.id;

    // Login as Bob Admin (Company B)
    const loginB = await authService.login('admin@globex.com', 'password123');
    adminBToken = loginB.token;

    // Fetch John Doe ID (Company B)
    const johnRes = await pool.query(`SELECT id FROM users WHERE email = 'john@globex.com'`);
    johnId = johnRes.rows[0].id;
  });

  afterAll(async () => {
    await pool.end();
  });

  /**
   * Requirement 3: Admin can run it for anyone in their company
   */
  test('Requirement 3 (A): Admin of Company A CAN calculate payroll for any employee in Company A (Ramesh)', async () => {
    const res = await request(app)
      .post('/api/payroll/calculate')
      .set('Authorization', `Bearer ${adminAToken}`)
      .send({
        employeeId: rameshId,
        year: 2026,
        month: 10,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.employee.name).toBe('Ramesh Kumar');
    expect(res.body.data.lossOfPayDays).toBe(3.0);
    expect(res.body.data.grossSalary).toBe(60000);
    expect(res.body.data.netSalary).toBe(48818.18);
  });

  /**
   * Requirement 3: Employee can only see their own data
   */
  test('Requirement 3 (B): Employee (Ramesh) CAN calculate/view his own payroll data', async () => {
    const res = await request(app)
      .post('/api/payroll/calculate')
      .set('Authorization', `Bearer ${rameshToken}`)
      .send({
        employeeId: rameshId,
        year: 2026,
        month: 10,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.netSalary).toBe(48818.18);
  });

  test('Requirement 3 (C): Employee (Ramesh) CANNOT access another employee (Priya) in the same company', async () => {
    const res = await request(app)
      .post('/api/payroll/calculate')
      .set('Authorization', `Bearer ${rameshToken}`)
      .send({
        employeeId: priyaId,
        year: 2026,
        month: 10,
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('Employees are strictly restricted to accessing only their own payroll');
  });

  /**
   * Requirement 4: Company A's data must never be visible to Company B
   */
  test('Requirement 4 (A): Admin of Company B CANNOT access Company A employee (Ramesh) - returns 403 Tenant Isolation', async () => {
    const res = await request(app)
      .post('/api/payroll/calculate')
      .set('Authorization', `Bearer ${adminBToken}`)
      .send({
        employeeId: rameshId,
        year: 2026,
        month: 10,
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('Multi-Tenant Isolation Violation');
  });

  test('Requirement 4 (B): Company B employee attendance endpoint blocks Company A employee ID', async () => {
    const res = await request(app)
      .get(`/api/attendance/${rameshId}?year=2026&month=10`)
      .set('Authorization', `Bearer ${adminBToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('Multi-Tenant Isolation Violation');
  });

  /**
   * Optional Bonus: Plain English LLM Tool-Calling query
   */
  test('Optional Bonus: Answers "What is Ramesh\'s net salary for October?" via internal payroll tool', async () => {
    const res = await request(app)
      .post('/api/ai/ask')
      .set('Authorization', `Bearer ${adminAToken}`)
      .send({
        question: "What is Ramesh's net salary for October?",
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.answer).toContain('Ramesh Kumar');
    expect(res.body.data.answer).toContain('48,818.18');
    expect(res.body.data.toolUsed).toBe('get_employee_payroll');
    expect(res.body.data.toolArguments.employeeName).toBe('Ramesh Kumar');
    expect(res.body.data.data.netSalary).toBe(48818.18);
  });

  test('Optional Bonus: Cross-Tenant plain-English query prevents data leakage', async () => {
    // Bob Admin (Company B) tries to ask about Ramesh (Company A)
    const res = await request(app)
      .post('/api/ai/ask')
      .set('Authorization', `Bearer ${adminBToken}`)
      .send({
        question: "What is Ramesh's net salary for October?",
      });

    expect(res.status).toBe(200);
    expect(res.body.data.answer).toContain('Tenant Data Isolation Error');
    expect(res.body.data.answer).toContain('strictly prohibit cross-company data access');
  });
});
