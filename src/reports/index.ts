// reports is a terminal consumer in the module graph — nothing else depends on it.
export { generateReport, getReportById, listReports } from './service/reports.service';
export type { Report, ReportSummary } from './reports.types';
