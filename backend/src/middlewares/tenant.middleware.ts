import { Request, Response, NextFunction } from 'express';
import { pool } from '../db';

/**
 * Requirement 4: Multi-Tenant Data Isolation
 * "Company A's data must never be visible to Company B."
 * Ensures that if an employeeId is present in params or body, that employee belongs to the current user's company.
 */
export async function enforceTenantIsolation(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const companyId = req.companyId || req.user?.companyId;

  if (!companyId) {
    res.status(401).json({ success: false, error: 'Tenant context missing' });
    return;
  }

  // Check employeeId from params or body if specified
  const employeeId = req.params.employeeId || req.body?.employeeId;

  if (employeeId) {
    try {
      const checkRes = await pool.query(
        `SELECT id, company_id FROM users WHERE id = $1`,
        [employeeId]
      );

      if (checkRes.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: 'Employee not found',
        });
        return;
      }

      if (checkRes.rows[0].company_id !== companyId) {
        // Explicit multi-tenant violation prevention
        res.status(403).json({
          success: false,
          error: 'Multi-Tenant Isolation Violation: You are not authorized to view or access data belonging to another company.',
          tenantSecurityViolation: true,
        });
        return;
      }
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
      return;
    }
  }

  next();
}
