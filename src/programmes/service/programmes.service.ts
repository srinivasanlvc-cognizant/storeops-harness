import { NotFoundError, ValidationError } from '../../shared/errors';
import { eventBus } from '../../shared/events';
import { assertStaffActive } from '../../staff';
import { programmesRepository } from '../repository/programmes.repository';
import type {
  CreateProgrammeInput,
  Programme,
  ProgrammeFilter,
  ProgrammeStatus,
  UpdateProgrammeStatusInput,
} from '../programmes.types';

const VALID_STATUSES: ProgrammeStatus[] = ['draft', 'active', 'completed', 'cancelled'];

const ALLOWED_TRANSITIONS: Record<ProgrammeStatus, ProgrammeStatus[]> = {
  draft: ['active', 'cancelled'],
  active: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

function validateCreateInput(input: CreateProgrammeInput): void {
  if (!input.name?.trim()) throw new ValidationError('name is required');
  if (!input.storeId?.trim()) throw new ValidationError('storeId is required');
  if (!input.ownerStaffId?.trim()) throw new ValidationError('ownerStaffId is required');
  if (!input.startDate || Number.isNaN(Date.parse(input.startDate))) {
    throw new ValidationError('startDate must be a valid ISO date string');
  }
  if (!input.endDate || Number.isNaN(Date.parse(input.endDate))) {
    throw new ValidationError('endDate must be a valid ISO date string');
  }
  if (Date.parse(input.endDate) < Date.parse(input.startDate)) {
    throw new ValidationError('endDate must not be before startDate');
  }
}

export function createProgramme(input: CreateProgrammeInput): Programme {
  validateCreateInput(input);
  assertStaffActive(input.ownerStaffId);

  const programme = programmesRepository.create(input);

  eventBus.publish('programme.created', {
    programmeId: programme.id,
    storeId: programme.storeId,
    ownerStaffId: programme.ownerStaffId,
    name: programme.name,
  });

  return programme;
}

export function getProgrammeById(id: string): Programme {
  const programme = programmesRepository.findById(id);
  if (!programme) throw new NotFoundError(`programme ${id} not found`);
  return programme;
}

export function listProgrammes(filter: ProgrammeFilter = {}): Programme[] {
  return programmesRepository.findAll().filter((programme) => {
    if (filter.storeId && programme.storeId !== filter.storeId) return false;
    if (filter.status && programme.status !== filter.status) return false;
    if (filter.ownerStaffId && programme.ownerStaffId !== filter.ownerStaffId) return false;
    return true;
  });
}

export function updateProgrammeStatus(id: string, input: UpdateProgrammeStatusInput): Programme {
  const programme = getProgrammeById(id);

  if (!VALID_STATUSES.includes(input.status)) {
    throw new ValidationError(`status must be one of: ${VALID_STATUSES.join(', ')}`);
  }
  if (!ALLOWED_TRANSITIONS[programme.status].includes(input.status)) {
    throw new ValidationError(`cannot transition programme from ${programme.status} to ${input.status}`);
  }

  const previousStatus = programme.status;
  const updated = programmesRepository.updateStatus(id, input.status);
  if (!updated) throw new NotFoundError(`programme ${id} not found`);

  eventBus.publish('programme.statusChanged', {
    programmeId: updated.id,
    storeId: updated.storeId,
    previousStatus,
    newStatus: updated.status,
  });

  return updated;
}
