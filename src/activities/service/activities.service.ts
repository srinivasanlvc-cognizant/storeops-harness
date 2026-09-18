import { NotFoundError, ValidationError } from '../../shared/errors';
import { eventBus } from '../../shared/events';
import { assertStaffActive } from '../../staff';
import { activitiesRepository } from '../repository/activities.repository';
import type {
  Activity,
  ActivityFilter,
  ActivityStatus,
  CreateActivityInput,
  UpdateActivityStatusInput,
} from '../activities.types';

const VALID_STATUSES: ActivityStatus[] = ['pending', 'in_progress', 'completed', 'cancelled'];

const ALLOWED_TRANSITIONS: Record<ActivityStatus, ActivityStatus[]> = {
  pending: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

function validateCreateInput(input: CreateActivityInput): void {
  if (!input.title?.trim()) throw new ValidationError('title is required');
  if (!input.storeId?.trim()) throw new ValidationError('storeId is required');
  if (!input.assignedStaffId?.trim()) throw new ValidationError('assignedStaffId is required');
  if (!input.dueDate || Number.isNaN(Date.parse(input.dueDate))) {
    throw new ValidationError('dueDate must be a valid ISO date string');
  }
}

export function createActivity(input: CreateActivityInput): Activity {
  validateCreateInput(input);
  assertStaffActive(input.assignedStaffId);

  const activity = activitiesRepository.create(input);

  eventBus.publish('activity.created', {
    activityId: activity.id,
    storeId: activity.storeId,
    assignedStaffId: activity.assignedStaffId,
    title: activity.title,
    dueDate: activity.dueDate,
  });

  return activity;
}

export function getActivityById(id: string): Activity {
  const activity = activitiesRepository.findById(id);
  if (!activity) throw new NotFoundError(`activity ${id} not found`);
  return activity;
}

export function listActivities(filter: ActivityFilter = {}): Activity[] {
  return activitiesRepository.findAll().filter((activity) => {
    if (filter.storeId && activity.storeId !== filter.storeId) return false;
    if (filter.status && activity.status !== filter.status) return false;
    if (filter.assignedStaffId && activity.assignedStaffId !== filter.assignedStaffId) return false;
    return true;
  });
}

export function updateActivityStatus(id: string, input: UpdateActivityStatusInput): Activity {
  const activity = getActivityById(id);

  if (!VALID_STATUSES.includes(input.status)) {
    throw new ValidationError(`status must be one of: ${VALID_STATUSES.join(', ')}`);
  }
  if (!ALLOWED_TRANSITIONS[activity.status].includes(input.status)) {
    throw new ValidationError(`cannot transition activity from ${activity.status} to ${input.status}`);
  }

  const previousStatus = activity.status;
  const updated = activitiesRepository.updateStatus(id, input.status);
  if (!updated) throw new NotFoundError(`activity ${id} not found`);

  eventBus.publish('activity.statusChanged', {
    activityId: updated.id,
    storeId: updated.storeId,
    previousStatus,
    newStatus: updated.status,
  });

  return updated;
}
