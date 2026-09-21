import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';

import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import pdvRoutes from './routes/pdv.routes';
import importRoutes from './routes/import.routes';
import dashboardRoutes from './routes/dashboard.routes';
import taskRoutes from './routes/task.routes';
import contactRoutes from './routes/contact.routes';
import exportRoutes from './routes/export.routes';
import notificationRoutes from './routes/notification.routes';
import configRoutes from './routes/config.routes';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '30mb' }));

  app.get('/api/health', (_req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/team', userRoutes);
  app.use('/api/pdvs', pdvRoutes);
  app.use('/api/import', importRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/tasks', taskRoutes);
  app.use('/api/contacts', contactRoutes);
  app.use('/api/export', exportRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/config', configRoutes);

  // Serve frontend estático em produção (SPA)
  const publicDir = path.join(__dirname, '..', 'public');
  if (fs.existsSync(publicDir)) {
    app.use(express.static(publicDir));
    app.get(/^\/(?!api).*/, (_req, res) => {
      res.sendFile(path.join(publicDir, 'index.html'));
    });
  }

  // Error handler
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err);
    res.status(err.status ?? 500).json({ error: err.message ?? 'Erro interno do servidor.' });
  });

  return app;
}
