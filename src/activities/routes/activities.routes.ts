import { Router } from 'express';
import { asyncHandler } from '../../shared/http';
import * as activitiesService from '../service/activities.service';
import type { ActivityStatus } from '../activities.types';

export const activitiesRouter = Router();

activitiesRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const activity = activitiesService.createActivity(req.body);
    res.status(201).json(activity);
  }),
);

activitiesRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const { storeId, status, assignedStaffId } = req.query;
    res.json(
      activitiesService.listActivities({
        storeId: typeof storeId === 'string' ? storeId : undefined,
        status: typeof status === 'string' ? (status as ActivityStatus) : undefined,
        assignedStaffId: typeof assignedStaffId === 'string' ? assignedStaffId : undefined,
      }),
    );
  }),
);

activitiesRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    res.json(activitiesService.getActivityById(req.params.id));
  }),
);

activitiesRouter.patch(
  '/bulk-status',
  asyncHandler(async (req, res) => {
    res.status(200).json(activitiesService.bulkUpdateActivityStatus(req.body));
  }),
);

activitiesRouter.patch(
  '/:id/status',
  asyncHandler(async (req, res) => {
    res.json(activitiesService.updateActivityStatus(req.params.id, req.body));
  }),
);
