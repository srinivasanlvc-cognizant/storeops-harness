// Public API for the staff module. Other modules may only READ staff data —
// creation, updates, and deactivation stay internal to this module and are
// reachable only through staff.routes.ts.
export { getStaffById, listStaff, staffExists, assertStaffActive } from './service/staff.service';
export type { Staff, StaffRole, StaffFilter } from './staff.types';
