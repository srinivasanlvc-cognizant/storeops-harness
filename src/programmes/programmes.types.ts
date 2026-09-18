export type ProgrammeStatus = 'draft' | 'active' | 'completed' | 'cancelled';

export interface Programme {
  id: string;
  name: string;
  description: string;
  storeId: string;
  ownerStaffId: string;
  startDate: string;
  endDate: string;
  status: ProgrammeStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProgrammeInput {
  name: string;
  description?: string;
  storeId: string;
  ownerStaffId: string;
  startDate: string;
  endDate: string;
}

export interface UpdateProgrammeStatusInput {
  status: ProgrammeStatus;
}

export interface ProgrammeFilter {
  storeId?: string;
  status?: ProgrammeStatus;
  ownerStaffId?: string;
}
