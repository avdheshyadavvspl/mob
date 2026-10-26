import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5050', 10),
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:root@localhost:5432/payroll_db',
  jwtSecret: process.env.JWT_SECRET || 'super_secret_attendance_payroll_jwt_key_2026!',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  geminiApiKey: process.env.GEMINI_API_KEY || ''
};
