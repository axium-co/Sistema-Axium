import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import { prisma } from './config/database.js';

import authRoutes from './routes/auth.js';
import leadsRoutes from './routes/leads.js';
import eventsRoutes from './routes/events.js';
import boardsRoutes from './routes/boards.js';
import invoicesRoutes from './routes/invoices.js';
import expensesRoutes from './routes/expenses.js';
import activityLogsRoutes from './routes/activity-logs.js';
import notificationsRoutes from './routes/notifications.js';
import whatsappTemplatesRoutes from './routes/whatsapp-templates.js';
import profilesRoutes from './routes/profiles.js';
import employeesRoutes from './routes/employees.js';
import integrationsRoutes from './routes/integrations.js';
import userRolesRoutes from './routes/user-roles.js';
import pageEventsRoutes from './routes/page-events.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: '10mb' }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas requisições. Tente novamente em breve.' },
});
app.use('/api', limiter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/leads', leadsRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/boards', boardsRoutes);
app.use('/api/invoices', invoicesRoutes);
app.use('/api/expenses', expensesRoutes);
app.use('/api/activity-logs', activityLogsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/whatsapp-templates', whatsappTemplatesRoutes);
app.use('/api/profiles', profilesRoutes);
app.use('/api/employees', employeesRoutes);
app.use('/api/integrations', integrationsRoutes);
app.use('/api/user-roles', userRolesRoutes);
app.use('/api/page-events', pageEventsRoutes);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Server] Unhandled error:', err);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

app.listen(env.PORT, () => {
  console.log(`[Server] API rodando em http://localhost:${env.PORT}`);
  console.log(`[Server] Health check: http://localhost:${env.PORT}/api/health`);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
