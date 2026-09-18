import type { ActivityStatus } from '../activities';
import type { AlertSeverity } from '../alerts';
import type { ProgrammeStatus } from '../programmes';

export type ActivityStatusCounts = Record<ActivityStatus, number> & { total: number };
export type ProgrammeStatusCounts = Record<ProgrammeStatus, number> & { total: number };

export interface ReportSummary {
  staff: { total: number; active: number };
  activities: ActivityStatusCounts;
  programmes: ProgrammeStatusCounts;
  alerts: {
    total: number;
    unacknowledged: number;
    bySeverity: Record<AlertSeverity, number>;
  };
}

export interface Report {
  id: string;
  storeId: string | null;
  generatedAt: string;
  summary: ReportSummary;
}
