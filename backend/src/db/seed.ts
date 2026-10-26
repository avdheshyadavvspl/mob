import bcrypt from 'bcryptjs';
import { pool } from './index';

export async function seedDatabase() {
  console.log('Seeding multi-tenant attendance and payroll database...');
  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Insert Companies
  const companyARes = await pool.query(
    `INSERT INTO companies (name, code, default_monthly_working_days) 
     VALUES ($1, $2, $3) RETURNING id, name, code`,
    ['Acme Technologies', 'ACME', 22]
  );
  const companyA = companyARes.rows[0];

  const companyBRes = await pool.query(
    `INSERT INTO companies (name, code, default_monthly_working_days) 
     VALUES ($1, $2, $3) RETURNING id, name, code`,
    ['Globex Industries', 'GLOBEX', 20]
  );
  const companyB = companyBRes.rows[0];

  console.log(`Created Company A: ${companyA.name} (${companyA.id})`);
  console.log(`Created Company B: ${companyB.name} (${companyB.id})`);

  // 2. Insert Working Days Config for October 2026
  await pool.query(
    `INSERT INTO company_working_days_config (company_id, year, month, working_days)
     VALUES ($1, 2026, 10, 22), ($2, 2026, 10, 20)`,
    [companyA.id, companyB.id]
  );

  // Also config for September 2026 and November 2026 for testing
  await pool.query(
    `INSERT INTO company_working_days_config (company_id, year, month, working_days)
     VALUES 
      ($1, 2026, 9, 21), ($1, 2026, 11, 21),
      ($2, 2026, 9, 22), ($2, 2026, 11, 19)`,
    [companyA.id, companyB.id]
  );

  // 3. Insert Users for Company A
  // Admin
  const adminARes = await pool.query(
    `INSERT INTO users (company_id, name, email, password_hash, role, designation, base_monthly_salary)
     VALUES ($1, $2, $3, $4, 'ADMIN', 'HR & Payroll Director', 100000.00) RETURNING id, name, email`,
    [companyA.id, 'Alice Admin', 'admin@acme.com', passwordHash]
  );
  const adminA = adminARes.rows[0];

  // Employee: Ramesh Kumar
  const rameshRes = await pool.query(
    `INSERT INTO users (company_id, name, email, password_hash, role, designation, base_monthly_salary)
     VALUES ($1, $2, $3, $4, 'EMPLOYEE', 'Senior Software Engineer', 60000.00) RETURNING id, name, email`,
    [companyA.id, 'Ramesh Kumar', 'ramesh@acme.com', passwordHash]
  );
  const ramesh = rameshRes.rows[0];

  // Employee: Priya Sharma
  const priyaRes = await pool.query(
    `INSERT INTO users (company_id, name, email, password_hash, role, designation, base_monthly_salary)
     VALUES ($1, $2, $3, $4, 'EMPLOYEE', 'Lead UX Designer', 75000.00) RETURNING id, name, email`,
    [companyA.id, 'Priya Sharma', 'priya@acme.com', passwordHash]
  );
  const priya = priyaRes.rows[0];

  // 4. Insert Users for Company B
  // Admin
  const adminBRes = await pool.query(
    `INSERT INTO users (company_id, name, email, password_hash, role, designation, base_monthly_salary)
     VALUES ($1, $2, $3, $4, 'ADMIN', 'Operations Head', 95000.00) RETURNING id, name, email`,
    [companyB.id, 'Bob Admin', 'admin@globex.com', passwordHash]
  );
  const adminB = adminBRes.rows[0];

  // Employee: John Doe
  const johnRes = await pool.query(
    `INSERT INTO users (company_id, name, email, password_hash, role, designation, base_monthly_salary)
     VALUES ($1, $2, $3, $4, 'EMPLOYEE', 'Cloud Architect', 50000.00) RETURNING id, name, email`,
    [companyB.id, 'John Doe', 'john@globex.com', passwordHash]
  );
  const john = johnRes.rows[0];

  // Employee: Sara Connor
  const saraRes = await pool.query(
    `INSERT INTO users (company_id, name, email, password_hash, role, designation, base_monthly_salary)
     VALUES ($1, $2, $3, $4, 'EMPLOYEE', 'Cybersecurity Specialist', 65000.00) RETURNING id, name, email`,
    [companyB.id, 'Sara Connor', 'sara@globex.com', passwordHash]
  );
  const sara = saraRes.rows[0];

  // 5. Seed Attendance for October 2026
  // Generate working days for Oct 2026 (skipping weekends: Saturdays & Sundays)
  const getWorkingDates = (year: number, month: number, targetCount: number) => {
    const dates: string[] = [];
    const daysInMonth = new Date(year, month, 0).getDate();
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month - 1, day);
      const dayOfWeek = d.getDay(); // 0 is Sun, 6 is Sat
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        const str = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        dates.push(str);
        if (dates.length === targetCount) break;
      }
    }
    return dates;
  };

  const datesA = getWorkingDates(2026, 10, 22);
  const datesB = getWorkingDates(2026, 10, 20);

  // Ramesh: 18 PRESENT, 2 ABSENT (days 5, 6), 2 HALF_DAY (days 12, 13) -> LOP = 3
  for (let i = 0; i < datesA.length; i++) {
    const date = datesA[i];
    let status = 'PRESENT';
    let notes = 'Regular working day';
    if (i === 5 || i === 6) {
      status = 'ABSENT';
      notes = 'Sick leave without pay';
    } else if (i === 12 || i === 13) {
      status = 'HALF_DAY';
      notes = 'Personal errand half day';
    }
    await pool.query(
      `INSERT INTO attendance_records (company_id, employee_id, date, status, notes)
       VALUES ($1, $2, $3, $4, $5)`,
      [companyA.id, ramesh.id, date, status, notes]
    );
  }

  // Priya: All 22 PRESENT -> LOP = 0
  for (let i = 0; i < datesA.length; i++) {
    const date = datesA[i];
    await pool.query(
      `INSERT INTO attendance_records (company_id, employee_id, date, status, notes)
       VALUES ($1, $2, $3, 'PRESENT', 'Full day present')`,
      [companyA.id, priya.id, date]
    );
  }

  // John Doe (Company B): 17 PRESENT, 1 ABSENT, 2 HALF_DAY -> LOP = 2
  for (let i = 0; i < datesB.length; i++) {
    const date = datesB[i];
    let status = 'PRESENT';
    let notes = 'Normal work day';
    if (i === 3) {
      status = 'ABSENT';
      notes = 'Family function';
    } else if (i === 8 || i === 9) {
      status = 'HALF_DAY';
      notes = 'Doctor appointment';
    }
    await pool.query(
      `INSERT INTO attendance_records (company_id, employee_id, date, status, notes)
       VALUES ($1, $2, $3, $4, $5)`,
      [companyB.id, john.id, date, status, notes]
    );
  }

  console.log('✅ Database seeded successfully with companies, configs, users, and attendance records.');
}

if (require.main === module) {
  seedDatabase()
    .then(() => pool.end())
    .catch((err) => {
      console.error('❌ Seeding failed:', err);
      process.exit(1);
    });
}
