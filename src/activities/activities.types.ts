export type ActivityStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

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
