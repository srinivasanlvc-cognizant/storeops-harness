import { AppError, NotFoundError, ValidationError } from '../../shared/errors';
import { eventBus } from '../../shared/events';
import { assertStaffActive } from '../../staff';
import { activitiesRepository } from '../repository/activities.repository';
import type {
  Activity,
  ActivityFilter,
  ActivityStatus,
  BulkActivityStatus,
  BulkStatusUpdateErrorItem,
  BulkStatusUpdateItem,
  BulkStatusUpdateResult,
  CreateActivityInput,
  UpdateActivityStatusInput,
} from '../activities.types';

const VALID_STATUSES: ActivityStatus[] = ['pending', 'in_progress', 'completed', 'cancelled'];

const BULK_STATUSES: BulkActivityStatus[] = ['DONE', 'BLOCKED'];

const ALLOWED_TRANSITIONS: Record<ActivityStatus, ActivityStatus[]> = {
  pending: ['in_progress', 'cancelled', 'DONE', 'BLOCKED'],
  in_progress: ['completed', 'cancelled', 'DONE', 'BLOCKED'],
  completed: [],
  cancelled: [],
  DONE: [],
  BLOCKED: ['DONE'],
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

export function bulkUpdateActivityStatus(items: BulkStatusUpdateItem[]): BulkStatusUpdateResult {
  if (!Array.isArray(items) || items.length === 0) {
    throw new ValidationError('request body must be a non-empty array of status updates');
  }

  const updated: Activity[] = [];
  const errors: BulkStatusUpdateErrorItem[] = [];

  for (const item of items) {
    const rawId = typeof item?.id === 'string' ? item.id : '';
    try {
      const hasValidId = typeof rawId === 'string' && rawId.trim().length > 0;
      const hasValidStatus = BULK_STATUSES.includes(item?.status as BulkActivityStatus);
      if (!hasValidId || !hasValidStatus) {
        errors.push({
          id: rawId,
          code: 'VALIDATION_ERROR',
          message: `status must be one of: ${BULK_STATUSES.join(', ')}`,
        });
        continue;
      }

      const activity = getActivityById(item.id);

      if (!ALLOWED_TRANSITIONS[activity.status].includes(item.status)) {
        throw new ValidationError(`cannot transition activity from ${activity.status} to ${item.status}`);
      }

      assertStaffActive(activity.assignedStaffId);

      const previousStatus = activity.status;
      const updatedActivity = activitiesRepository.updateStatus(item.id, item.status, item.notes);
      if (!updatedActivity) throw new NotFoundError(`activity ${item.id} not found`);

      eventBus.publish('activity.updated', {
        activityId: updatedActivity.id,
        storeId: updatedActivity.storeId,
        assignedStaffId: updatedActivity.assignedStaffId,
        previousStatus,
        newStatus: item.status,
        notes: item.notes,
      });

      updated.push(updatedActivity);
    } catch (err) {
      if (err instanceof AppError) {
        errors.push({ id: rawId, code: err.code, message: err.message });
        continue;
      }
      throw err;
    }
  }

  return { updated, errors };
}
