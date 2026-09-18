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
  'programme.created': ProgrammeCreatedEvent;
  'programme.statusChanged': ProgrammeStatusChangedEvent;
}

export type DomainEventName = keyof DomainEventMap;
