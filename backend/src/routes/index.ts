import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { companyController } from '../controllers/company.controller';
import { attendanceController } from '../controllers/attendance.controller';
import { payrollController } from '../controllers/payroll.controller';
import { aiController } from '../controllers/ai.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireAdmin, canAccessEmployeeData } from '../middlewares/rbac.middleware';
import { enforceTenantIsolation } from '../middlewares/tenant.middleware';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'multi-tenant-payroll-api', timestamp: new Date() });
});

// Authentication
router.post('/auth/login', authController.login.bind(authController));
router.get('/auth/me', authenticate, authController.me.bind(authController));

// Companies & Working Days Configuration (Requirement 1)
router.get('/companies', authenticate, companyController.getAllCompanies.bind(companyController));
router.get('/companies/my-company', authenticate, companyController.getMyCompany.bind(companyController));
router.get('/companies/employees', authenticate, companyController.getEmployees.bind(companyController));
router.get('/companies/working-days', authenticate, companyController.getWorkingDays.bind(companyController));
router.post(
  '/companies/working-days',
  authenticate,
  requireAdmin,
  companyController.setWorkingDays.bind(companyController)
);

// Attendance Management
router.get(
  '/attendance/:employeeId',
  authenticate,
  enforceTenantIsolation,
  canAccessEmployeeData((req) => req.params.employeeId),
  attendanceController.getEmployeeAttendance.bind(attendanceController)
);

router.post(
  '/attendance/:employeeId',
  authenticate,
  enforceTenantIsolation,
  requireAdmin,
  attendanceController.markSingle.bind(attendanceController)
);

router.post(
  '/attendance/:employeeId/batch',
  authenticate,
  enforceTenantIsolation,
  requireAdmin,
  attendanceController.markBatch.bind(attendanceController)
);

// Payroll Calculation (Requirements 2, 3, 4)
// An endpoint that takes a month's attendance (present / absent / half-day) for an employee
// and returns loss-of-pay days, gross salary, a simple deduction, and net salary.
router.post(
  '/payroll/calculate',
  authenticate,
  enforceTenantIsolation,
  canAccessEmployeeData((req) => req.body.employeeId),
  payrollController.calculate.bind(payrollController)
);

router.get(
  '/payroll/history/:employeeId',
  authenticate,
  enforceTenantIsolation,
  canAccessEmployeeData((req) => req.params.employeeId),
  payrollController.getHistory.bind(payrollController)
);

// Optional Bonus: Plain-English Query with LLM Tool Calling
router.post('/ai/ask', authenticate, aiController.ask.bind(aiController));

export default router;
