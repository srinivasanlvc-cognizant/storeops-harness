import { randomUUID } from 'node:crypto';
import type { Report, ReportSummary } from '../reports.types';

export class ReportsRepository {
  private readonly records = new Map<string, Report>();

  create(storeId: string | null, summary: ReportSummary): Report {
    const record: Report = {
      id: randomUUID(),
      storeId,
      generatedAt: new Date().toISOString(),
      summary,
    };
    this.records.set(record.id, record);
    return record;
  }

  findById(id: string): Report | undefined {
    return this.records.get(id);
  }

  findAll(): Report[] {
    return Array.from(this.records.values());
  }
}

export const reportsRepository = new ReportsRepository();
