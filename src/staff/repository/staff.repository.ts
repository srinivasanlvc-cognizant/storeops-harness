import { randomUUID } from 'node:crypto';
import type { CreateStaffInput, Staff, UpdateStaffInput } from '../staff.types';

export class StaffRepository {
  private readonly records = new Map<string, Staff>();

  create(input: CreateStaffInput): Staff {
    const now = new Date().toISOString();
    const record: Staff = {
      id: randomUUID(),
      ...input,
      active: true,
      createdAt: now,
      updatedAt: now,
    };
    this.records.set(record.id, record);
    return record;
  }

  findById(id: string): Staff | undefined {
    return this.records.get(id);
  }

  findAll(): Staff[] {
    return Array.from(this.records.values());
  }

  update(id: string, input: UpdateStaffInput): Staff | undefined {
    const existing = this.records.get(id);
    if (!existing) return undefined;
    const updated: Staff = { ...existing, ...input, updatedAt: new Date().toISOString() };
    this.records.set(id, updated);
    return updated;
  }
}

export const staffRepository = new StaffRepository();
