-- Enable UUID generation extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if needed for clean re-run
DROP TABLE IF EXISTS payroll_runs CASCADE;
DROP TABLE IF EXISTS attendance_records CASCADE;
DROP TABLE IF EXISTS company_working_days_config CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS companies CASCADE;

-- 1. Companies Table
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    default_monthly_working_days INT NOT NULL DEFAULT 22,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Monthly Working Days Configuration Table
CREATE TABLE company_working_days_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    year INT NOT NULL,
    month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
    working_days INT NOT NULL CHECK (working_days >= 0 AND working_days <= 31),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_company_month_year UNIQUE (company_id, year, month)
);

-- 3. Users Table (Admins and Employees)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('ADMIN', 'EMPLOYEE')),
    designation VARCHAR(100),
    annual_ctc NUMERIC(12, 2) NOT NULL DEFAULT 600000.00,
    base_monthly_salary NUMERIC(12, 2) NOT NULL DEFAULT 50000.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Attendance Records Table
CREATE TABLE attendance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('PRESENT', 'ABSENT', 'HALF_DAY')),
    notes VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_employee_date UNIQUE (employee_id, date)
);

-- 5. Payroll Calculations / Audit Runs Table
CREATE TABLE payroll_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    year INT NOT NULL,
    month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
    working_days INT NOT NULL,
    present_days NUMERIC(5, 2) NOT NULL,
    absent_days NUMERIC(5, 2) NOT NULL,
    half_days NUMERIC(5, 2) NOT NULL,
    lop_days NUMERIC(5, 2) NOT NULL,
    payable_days NUMERIC(5, 2) NOT NULL,
    annual_ctc NUMERIC(12, 2) NOT NULL DEFAULT 600000.00,
    gross_salary NUMERIC(12, 2) NOT NULL,
    per_day_salary NUMERIC(12, 2) NOT NULL,
    lop_deduction NUMERIC(12, 2) NOT NULL,
    simple_deduction NUMERIC(12, 2) NOT NULL,
    net_salary NUMERIC(12, 2) NOT NULL,
    calculated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Performance and multi-tenant isolation indexes
CREATE INDEX idx_users_company ON users(company_id);
CREATE INDEX idx_attendance_company_employee ON attendance_records(company_id, employee_id);
CREATE INDEX idx_attendance_date ON attendance_records(date);
CREATE INDEX idx_payroll_company_employee ON payroll_runs(company_id, employee_id);
CREATE INDEX idx_config_company_date ON company_working_days_config(company_id, year, month);
