import { eventBus } from '../../shared/events';
import { recordAlert } from '../service/alerts.service';

let registered = false;

// Alerts never import other modules directly — this listener is the only
// way alerts learns about activity/programme domain events.
export function registerAlertListeners(): void {
  if (registered) return;
  registered = true;

  eventBus.subscribe('activity.created', (event) => {
    recordAlert({
      type: 'activity.created',
      message: `New activity "${event.title}" assigned, due ${event.dueDate}`,
      severity: 'info',
      sourceModule: 'activities',
      referenceId: event.activityId,
      storeId: event.storeId,
    });
  });

  eventBus.subscribe('activity.statusChanged', (event) => {
    if (event.newStatus === 'cancelled') {
      recordAlert({
        type: 'activity.cancelled',
        message: `Activity ${event.activityId} was cancelled`,
        severity: 'warning',
        sourceModule: 'activities',
        referenceId: event.activityId,
        storeId: event.storeId,
      });
    }
  });

  eventBus.subscribe('programme.created', (event) => {
    recordAlert({
      type: 'programme.created',
      message: `New programme "${event.name}" created`,
      severity: 'info',
      sourceModule: 'programmes',
      referenceId: event.programmeId,
      storeId: event.storeId,
    });
  });

  eventBus.subscribe('programme.statusChanged', (event) => {
    if (event.newStatus === 'cancelled') {
      recordAlert({
        type: 'programme.cancelled',
        message: `Programme ${event.programmeId} was cancelled`,
        severity: 'warning',
        sourceModule: 'programmes',
        referenceId: event.programmeId,
        storeId: event.storeId,
      });
    }
  });
}
