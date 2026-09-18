import { Router } from 'express';
import { asyncHandler } from '../../shared/http';
import * as reportsService from '../service/reports.service';

export const reportsRouter = Router();

reportsRouter.post(
  '/generate',
  asyncHandler(async (req, res) => {
    const { storeId } = req.query;
    const report = reportsService.generateReport(typeof storeId === 'string' ? storeId : undefined);
    res.status(201).json(report);
  }),
);

reportsRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    res.json(reportsService.listReports());
  }),
);

reportsRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    res.json(reportsService.getReportById(req.params.id));
  }),
);
