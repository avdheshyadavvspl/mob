import { calculatePayrollMath } from '../services/payroll.service';

describe('Payroll Calculation Engine Tests (Requirement 5)', () => {
  /**
   * Test Case 1: Perfect Attendance (Zero LOP)
   * 22 Working Days, 22 Present, 0 Absent, 0 Half-Day
   */
  test('Case 1: Full Attendance yields 0 LOP days and full salary minus standard deduction', () => {
    const result = calculatePayrollMath({
      baseMonthlySalary: 60000,
      workingDaysInMonth: 22,
      presentDays: 22,
      absentDays: 0,
      halfDays: 0,
      customDeductionPercent: 5.0,
    });

    expect(result.workingDays).toBe(22);
    expect(result.presentDays).toBe(22);
    expect(result.lossOfPayDays).toBe(0);
    expect(result.payableDays).toBe(22);
    expect(result.grossSalary).toBe(60000);
    expect(result.lossOfPayDeduction).toBe(0);
    expect(result.simpleDeduction).toBe(3000); // 5% of 60,000
    expect(result.totalDeductions).toBe(3000);
    expect(result.netSalary).toBe(57000); // 60,000 - 3,000
  });

  /**
   * Test Case 2: Mixed Attendance with Absences and Half-Days (Ramesh's Scenario)
   * 22 Working Days, 18 Present, 2 Absent, 2 Half-Days -> 3 LOP Days
   */
  test('Case 2: Mixed attendance with 2 full absences and 2 half days produces 3.0 LOP days and accurate fractional deductions', () => {
    const result = calculatePayrollMath({
      baseMonthlySalary: 60000,
      workingDaysInMonth: 22,
      presentDays: 18,
      absentDays: 2,
      halfDays: 2,
      customDeductionPercent: 5.0,
    });

    // 2 absent + 2 * 0.5 half day = 3 LOP days
    expect(result.lossOfPayDays).toBe(3.0);
    expect(result.payableDays).toBe(19.0); // 22 - 3
    expect(result.grossSalary).toBe(60000);

    // Per day rate: 60,000 / 22 = 2727.2727...
    expect(result.perDaySalary).toBeCloseTo(2727.27, 2);

    // LOP deduction: 3 * 2727.2727 = 8181.82
    expect(result.lossOfPayDeduction).toBe(8181.82);

    // 5% standard deduction: 3000
    expect(result.simpleDeduction).toBe(3000);

    // Total deductions = 8181.82 + 3000 = 11181.82
    expect(result.totalDeductions).toBe(11181.82);

    // Net salary = 60000 - 11181.82 = 48818.18
    expect(result.netSalary).toBe(48818.18);
  });

  /**
   * Test Case 3: Complete Month Absent (Full Loss of Pay)
   * 20 Working Days, 0 Present, 20 Absent -> 20 LOP Days
   */
  test('Case 3: Complete month absent results in 100% LOP and zero net salary without negative balance', () => {
    const result = calculatePayrollMath({
      baseMonthlySalary: 50000,
      workingDaysInMonth: 20,
      presentDays: 0,
      absentDays: 20,
      halfDays: 0,
      customDeductionPercent: 5.0,
    });

    expect(result.lossOfPayDays).toBe(20.0);
    expect(result.payableDays).toBe(0);
    expect(result.lossOfPayDeduction).toBe(50000); // capped at gross
    expect(result.netSalary).toBe(0); // non-negative floor
  });

  /**
   * Test Case 4: Company B Working Days Config (20 Days) and Fractional Half-Day
   * 20 Working Days, 17 Present, 1 Absent, 2 Half-Day (John Doe Scenario)
   */
  test('Case 4: Multi-tenant working-day differences (20 days vs 22 days) calculate exact per-day rates', () => {
    const result = calculatePayrollMath({
      baseMonthlySalary: 50000,
      workingDaysInMonth: 20,
      presentDays: 17,
      absentDays: 1,
      halfDays: 2,
      customDeductionPercent: 5.0,
    });

    // 1 absent + 2 * 0.5 = 2 LOP days
    expect(result.lossOfPayDays).toBe(2.0);
    expect(result.payableDays).toBe(18.0);

    // Per day: 50000 / 20 = 2500
    expect(result.perDaySalary).toBe(2500.0);

    // LOP deduction: 2 * 2500 = 5000
    expect(result.lossOfPayDeduction).toBe(5000.0);

    // Simple deduction 5% = 2500
    expect(result.simpleDeduction).toBe(2500.0);

    // Net salary: 50000 - 5000 - 2500 = 42500
    expect(result.netSalary).toBe(42500.0);
  });
});
