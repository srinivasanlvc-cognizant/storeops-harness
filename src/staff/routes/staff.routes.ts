import { Router } from 'express';
import { asyncHandler } from '../../shared/http';
import * as staffService from '../service/staff.service';

export const staffRouter = Router();

staffRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const staff = staffService.createStaff(req.body);
    res.status(201).json(staff);
  }),
);

staffRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const { storeId, active } = req.query;
    res.json(
      staffService.listStaff({
        storeId: typeof storeId === 'string' ? storeId : undefined,
        active: typeof active === 'string' ? active === 'true' : undefined,
      }),
    );
  }),
);

staffRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    res.json(staffService.getStaffById(req.params.id));
  }),
);

staffRouter.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    res.json(staffService.updateStaff(req.params.id, req.body));
  }),
);

staffRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    res.json(staffService.deactivateStaff(req.params.id));
  }),
);
