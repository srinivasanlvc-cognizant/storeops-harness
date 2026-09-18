import { Router } from 'express';
import { asyncHandler } from '../../shared/http';
import * as alertsService from '../service/alerts.service';
import type { AlertSeverity } from '../alerts.types';

export const alertsRouter = Router();

alertsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const { storeId, severity, acknowledged } = req.query;
    res.json(
      alertsService.listAlerts({
        storeId: typeof storeId === 'string' ? storeId : undefined,
        severity: typeof severity === 'string' ? (severity as AlertSeverity) : undefined,
        acknowledged: typeof acknowledged === 'string' ? acknowledged === 'true' : undefined,
      }),
    );
  }),
);

alertsRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    res.json(alertsService.getAlertById(req.params.id));
  }),
);

alertsRouter.patch(
  '/:id/acknowledge',
  asyncHandler(async (req, res) => {
    res.json(alertsService.acknowledgeAlert(req.params.id));
  }),
);
