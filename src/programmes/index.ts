// Public read-only API for the programmes module, for use by reports.
export { getProgrammeById, listProgrammes } from './service/programmes.service';
export type { Programme, ProgrammeStatus, ProgrammeFilter } from './programmes.types';
