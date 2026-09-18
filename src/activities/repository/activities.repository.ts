import { randomUUID } from 'node:crypto';
import type { Activity, ActivityStatus, CreateActivityInput } from '../activities.types';

export class ActivitiesRepository {
  private readonly records = new Map<string, Activity>();

  create(input: CreateActivityInput): Activity {
    const now = new Date().toISOString();
    const record: Activity = {
      id: randomUUID(),
      title: input.title,
      description: input.description ?? '',
      storeId: input.storeId,
      assignedStaffId: input.assignedStaffId,
      dueDate: input.dueDate,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    };
    this.records.set(record.id, record);
    return record;
  }

  findById(id: string): Activity | undefined {
    return this.records.get(id);
  }

  findAll(): Activity[] {
    return Array.from(this.records.values());
  }

  updateStatus(id: string, status: ActivityStatus): Activity | undefined {
    const existing = this.records.get(id);
    if (!existing) return undefined;
    const updated: Activity = { ...existing, status, updatedAt: new Date().toISOString() };
    this.records.set(id, updated);
    return updated;
  }
}

export const activitiesRepository = new ActivitiesRepository();
