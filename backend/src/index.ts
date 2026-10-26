import express from 'express';
import cors from 'cors';
import { config } from './config';
import routes from './routes';

export const app = express();

// Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

// API Routes
app.use('/api', routes);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled application error:', err);
  const status = err.statusCode || 500;
  res.status(status).json({
    success: false,
    error: err.message || 'Internal server error',
  });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(config.port, () => {
    console.log(`🚀 Multi-Tenant Attendance-to-Payroll API running on http://localhost:${config.port}`);
    console.log(`📋 Health check available at http://localhost:${config.port}/api/health`);
  });
}
