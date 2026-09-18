import { Router } from 'express';
import { asyncHandler } from '../../shared/http';
import * as programmesService from '../service/programmes.service';
import type { ProgrammeStatus } from '../programmes.types';

export const programmesRouter = Router();

programmesRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const programme = programmesService.createProgramme(req.body);
    res.status(201).json(programme);
  }),
);

programmesRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const { storeId, status, ownerStaffId } = req.query;
    res.json(
      programmesService.listProgrammes({
        storeId: typeof storeId === 'string' ? storeId : undefined,
        status: typeof status === 'string' ? (status as ProgrammeStatus) : undefined,
        ownerStaffId: typeof ownerStaffId === 'string' ? ownerStaffId : undefined,
      }),
    );
  }),
);

programmesRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    res.json(programmesService.getProgrammeById(req.params.id));
  }),
);

programmesRouter.patch(
  '/:id/status',
  asyncHandler(async (req, res) => {
    res.json(programmesService.updateProgrammeStatus(req.params.id, req.body));
  }),
);
