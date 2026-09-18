export interface ActivityCreatedEvent {
  activityId: string;
  storeId: string;
  assignedStaffId: string;
  title: string;
  dueDate: string;
}

export interface ActivityStatusChangedEvent {
  activityId: string;
  storeId: string;
  previousStatus: string;
  newStatus: string;
}

export interface ActivityUpdatedEvent {
  activityId: string;
  storeId: string;
  assignedStaffId: string;
  previousStatus: string;
  newStatus: string;
  notes?: string;
}

export interface ProgrammeCreatedEvent {
  programmeId: string;
  storeId: string;
  ownerStaffId: string;
  name: string;
}

export interface ProgrammeStatusChangedEvent {
  programmeId: string;
  storeId: string;
  previousStatus: string;
  newStatus: string;
}

export interface DomainEventMap {
  'activity.created': ActivityCreatedEvent;
  'activity.statusChanged': ActivityStatusChangedEvent;
  'activity.updated': ActivityUpdatedEvent;
  'programme.created': ProgrammeCreatedEvent;
  'programme.statusChanged': ProgrammeStatusChangedEvent;
}

export type DomainEventName = keyof DomainEventMap;
