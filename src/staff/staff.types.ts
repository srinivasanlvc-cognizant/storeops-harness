export type StaffRole = 'manager' | 'supervisor' | 'associate';

export interface Staff {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  storeId: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStaffInput {
  name: string;
  email: string;
  role: StaffRole;
  storeId: string;
}

export interface UpdateStaffInput {
  name?: string;
  email?: string;
  role?: StaffRole;
  active?: boolean;
}

export interface StaffFilter {
  storeId?: string;
  active?: boolean;
}
