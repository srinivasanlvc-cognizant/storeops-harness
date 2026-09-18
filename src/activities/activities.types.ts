export type ActivityStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'DONE'
  | 'BLOCKED';

export interface Activity {
  id: string;
  title: string;
  description: string;
  storeId: string;
  assignedStaffId: string;
  status: ActivityStatus;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

export interface CreateActivityInput {
  title: string;
  description?: string;
  storeId: string;
  assignedStaffId: string;
  dueDate: string;
}

export interface UpdateActivityStatusInput {
  status: ActivityStatus;
}

export interface ActivityFilter {
  storeId?: string;
  status?: ActivityStatus;
  assignedStaffId?: string;
}

export type BulkActivityStatus = 'DONE' | 'BLOCKED';

export interface BulkStatusUpdateItem {
  id: string;
  status: BulkActivityStatus;
  notes?: string;
}

export interface BulkStatusUpdateErrorItem {
  id: string;
  code: string;
  message: string;
}

export interface BulkStatusUpdateResult {
  updated: Activity[];
  errors: BulkStatusUpdateErrorItem[];
}
