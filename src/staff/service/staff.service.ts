import { ConflictError, NotFoundError, ValidationError } from '../../shared/errors';
import { staffRepository } from '../repository/staff.repository';
import type { CreateStaffInput, Staff, StaffFilter, StaffRole, UpdateStaffInput } from '../staff.types';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ROLES: StaffRole[] = ['manager', 'supervisor', 'associate'];

function validateEmail(email: string): void {
  if (!EMAIL_REGEX.test(email)) {
    throw new ValidationError('email must be a valid email address');
  }
}

function validateRole(role: StaffRole): void {
  if (!ROLES.includes(role)) {
    throw new ValidationError(`role must be one of: ${ROLES.join(', ')}`);
  }
}

export function createStaff(input: CreateStaffInput): Staff {
  if (!input.name?.trim()) throw new ValidationError('name is required');
  if (!input.storeId?.trim()) throw new ValidationError('storeId is required');
  validateEmail(input.email);
  validateRole(input.role);

  const emailTaken = staffRepository.findAll().some((s) => s.email === input.email);
  if (emailTaken) {
    throw new ConflictError(`staff with email ${input.email} already exists`);
  }

  return staffRepository.create(input);
}

export function getStaffById(id: string): Staff {
  const staff = staffRepository.findById(id);
  if (!staff) throw new NotFoundError(`staff ${id} not found`);
  return staff;
}

export function listStaff(filter: StaffFilter = {}): Staff[] {
  return staffRepository.findAll().filter((staff) => {
    if (filter.storeId && staff.storeId !== filter.storeId) return false;
    if (filter.active !== undefined && staff.active !== filter.active) return false;
    return true;
  });
}

export function updateStaff(id: string, input: UpdateStaffInput): Staff {
  getStaffById(id);
  if (input.email !== undefined) validateEmail(input.email);
  if (input.role !== undefined) validateRole(input.role);

  const updated = staffRepository.update(id, input);
  if (!updated) throw new NotFoundError(`staff ${id} not found`);
  return updated;
}

export function deactivateStaff(id: string): Staff {
  return updateStaff(id, { active: false });
}

export function staffExists(id: string): boolean {
  return staffRepository.findById(id) !== undefined;
}

export function assertStaffActive(id: string): Staff {
  const staff = getStaffById(id);
  if (!staff.active) {
    throw new ValidationError(`staff ${id} is not active`);
  }
  return staff;
}
