import express, { type Express } from 'express';
import { activitiesRouter } from './activities/routes/activities.routes';
import { alertsRouter } from './alerts/routes/alerts.routes';
import { registerAlertListeners } from './alerts';
import { programmesRouter } from './programmes/routes/programmes.routes';
import { reportsRouter } from './reports/routes/reports.routes';
import { errorHandler, notFoundHandler } from './shared/http';
import { staffRouter } from './staff/routes/staff.routes';

export function createApp(): Express {
  registerAlertListeners();

  const app = express();
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api/staff', staffRouter);
  app.use('/api/activities', activitiesRouter);
  app.use('/api/programmes', programmesRouter);
  app.use('/api/alerts', alertsRouter);
  app.use('/api/reports', reportsRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
