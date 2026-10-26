import { Request, Response, NextFunction } from 'express';

/**
 * Restricts endpoint to ADMIN role only.
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  if (req.user.role !== 'ADMIN') {
    res.status(403).json({
      success: false,
      error: 'Forbidden: Admin access required for this operation',
    });
    return;
  }

  next();
}

/**
 * Requirement 3:
 * "Role-based access: an Admin can run it for anyone; an Employee can only see their own data."
 * Checks if target employee matches user OR user is Admin in the same company.
 */
export function canAccessEmployeeData(targetEmployeeIdResolver: (req: Request) => string | undefined) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const targetEmployeeId = targetEmployeeIdResolver(req);

    if (!targetEmployeeId) {
      res.status(400).json({ success: false, error: 'Target employee ID is required' });
      return;
    }

    // Admin can access anyone in their company
    if (req.user.role === 'ADMIN') {
      return next();
    }

    // Employee can ONLY access their own data
    if (req.user.role === 'EMPLOYEE' && req.user.userId === targetEmployeeId) {
      return next();
    }

    res.status(403).json({
      success: false,
      error: 'Forbidden: Employees are strictly restricted to accessing only their own payroll and attendance data.',
    });
  };
}
