import { randomUUID } from 'node:crypto';
import type { Alert, CreateAlertInput } from '../alerts.types';

export class AlertsRepository {
  private readonly records = new Map<string, Alert>();

  create(input: CreateAlertInput): Alert {
    const record: Alert = {
      id: randomUUID(),
      ...input,
      acknowledged: false,
      createdAt: new Date().toISOString(),
      acknowledgedAt: null,
    };
    this.records.set(record.id, record);
    return record;
  }

  findById(id: string): Alert | undefined {
    return this.records.get(id);
  }

  findAll(): Alert[] {
    return Array.from(this.records.values());
  }

  acknowledge(id: string): Alert | undefined {
    const existing = this.records.get(id);
    if (!existing) return undefined;
    const updated: Alert = { ...existing, acknowledged: true, acknowledgedAt: new Date().toISOString() };
    this.records.set(id, updated);
    return updated;
  }
}

export const alertsRepository = new AlertsRepository();
