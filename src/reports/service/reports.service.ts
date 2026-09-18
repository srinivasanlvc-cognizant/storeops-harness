import { listActivities } from '../../activities';
import { listAlerts } from '../../alerts';
import { NotFoundError } from '../../shared/errors';
import { listProgrammes } from '../../programmes';
import { listStaff } from '../../staff';
import { reportsRepository } from '../repository/reports.repository';
import type { Report, ReportSummary } from '../reports.types';

function buildSummary(storeId?: string): ReportSummary {
  const staff = listStaff(storeId ? { storeId } : {});
  const activities = listActivities(storeId ? { storeId } : {});
  const programmes = listProgrammes(storeId ? { storeId } : {});
  const alerts = listAlerts(storeId ? { storeId } : {});

  const activityCounts = { pending: 0, in_progress: 0, completed: 0, cancelled: 0, total: activities.length };
  for (const activity of activities) activityCounts[activity.status] += 1;

  const programmeCounts = { draft: 0, active: 0, completed: 0, cancelled: 0, total: programmes.length };
  for (const programme of programmes) programmeCounts[programme.status] += 1;

  const alertsBySeverity = { info: 0, warning: 0, critical: 0 };
  for (const alert of alerts) alertsBySeverity[alert.severity] += 1;

  return {
    staff: { total: staff.length, active: staff.filter((s) => s.active).length },
    activities: activityCounts,
    programmes: programmeCounts,
    alerts: {
      total: alerts.length,
      unacknowledged: alerts.filter((a) => !a.acknowledged).length,
      bySeverity: alertsBySeverity,
    },
  };
}

export function generateReport(storeId?: string): Report {
  const summary = buildSummary(storeId);
  return reportsRepository.create(storeId ?? null, summary);
}

export function getReportById(id: string): Report {
  const report = reportsRepository.findById(id);
  if (!report) throw new NotFoundError(`report ${id} not found`);
  return report;
}

export function listReports(): Report[] {
  return reportsRepository.findAll();
}
