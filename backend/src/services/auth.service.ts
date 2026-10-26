import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db';
import { config } from '../config';
import { JwtPayload, User } from '../types';

export class AuthService {
  async login(email: string, passwordPlain: string): Promise<{ token: string; user: Omit<User, 'password_hash'>; company: { id: string; name: string; code: string; defaultWorkingDays: number } }> {
    const userRes = await pool.query(
      `SELECT u.id, u.company_id, u.name, u.email, u.password_hash, u.role, u.designation, u.base_monthly_salary, u.created_at,
              c.name as company_name, c.code as company_code, c.default_monthly_working_days
       FROM users u
       JOIN companies c ON c.id = u.company_id
       WHERE LOWER(u.email) = LOWER($1)`,
      [email]
    );

    if (userRes.rows.length === 0) {
      const err = new Error('Invalid email or password');
      (err as any).statusCode = 401;
      throw err;
    }

    const row = userRes.rows[0];
    const passwordMatch = await bcrypt.compare(passwordPlain, row.password_hash);

    if (!passwordMatch) {
      const err = new Error('Invalid email or password');
      (err as any).statusCode = 401;
      throw err;
    }

    const payload: JwtPayload = {
      userId: row.id,
      companyId: row.company_id,
      companyCode: row.company_code,
      role: row.role,
      email: row.email,
      name: row.name,
    };

    const token = jwt.sign(payload, config.jwtSecret, { expiresIn: '7d' });

    return {
      token,
      user: {
        id: row.id,
        company_id: row.company_id,
        name: row.name,
        email: row.email,
        role: row.role,
        designation: row.designation,
        base_monthly_salary: Number(row.base_monthly_salary),
        created_at: row.created_at,
      },
      company: {
        id: row.company_id,
        name: row.company_name,
        code: row.company_code,
        defaultWorkingDays: Number(row.default_monthly_working_days),
      },
    };
  }

  verifyToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, config.jwtSecret) as JwtPayload;
    } catch (err) {
      const error = new Error('Invalid or expired token');
      (error as any).statusCode = 401;
      throw error;
    }
  }
}

export const authService = new AuthService();
