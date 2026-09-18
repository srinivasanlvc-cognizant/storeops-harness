import { randomUUID } from 'node:crypto';
import type { CreateProgrammeInput, Programme, ProgrammeStatus } from '../programmes.types';

export class ProgrammesRepository {
  private readonly records = new Map<string, Programme>();

  create(input: CreateProgrammeInput): Programme {
    const now = new Date().toISOString();
    const record: Programme = {
      id: randomUUID(),
      name: input.name,
      description: input.description ?? '',
      storeId: input.storeId,
      ownerStaffId: input.ownerStaffId,
      startDate: input.startDate,
      endDate: input.endDate,
      status: 'draft',
      createdAt: now,
      updatedAt: now,
    };
    this.records.set(record.id, record);
    return record;
  }

  findById(id: string): Programme | undefined {
    return this.records.get(id);
  }

  findAll(): Programme[] {
    return Array.from(this.records.values());
  }

  updateStatus(id: string, status: ProgrammeStatus): Programme | undefined {
    const existing = this.records.get(id);
    if (!existing) return undefined;
    const updated: Programme = { ...existing, status, updatedAt: new Date().toISOString() };
    this.records.set(id, updated);
    return updated;
  }
}

export const programmesRepository = new ProgrammesRepository();
