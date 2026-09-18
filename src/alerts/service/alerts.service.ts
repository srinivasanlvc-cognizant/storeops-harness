import { ConflictError, NotFoundError } from '../../shared/errors';
import { alertsRepository } from '../repository/alerts.repository';
import type { Alert, AlertFilter, CreateAlertInput } from '../alerts.types';

export function recordAlert(input: CreateAlertInput): Alert {
  return alertsRepository.create(input);
}

export function getAlertById(id: string): Alert {
  const alert = alertsRepository.findById(id);
  if (!alert) throw new NotFoundError(`alert ${id} not found`);
  return alert;
}

export function listAlerts(filter: AlertFilter = {}): Alert[] {
  return alertsRepository.findAll().filter((alert) => {
    if (filter.severity && alert.severity !== filter.severity) return false;
    if (filter.acknowledged !== undefined && alert.acknowledged !== filter.acknowledged) return false;
    if (filter.storeId && alert.storeId !== filter.storeId) return false;
    return true;
  });
}

export function acknowledgeAlert(id: string): Alert {
  const alert = getAlertById(id);
  if (alert.acknowledged) {
    throw new ConflictError(`alert ${id} is already acknowledged`);
  }
  const updated = alertsRepository.acknowledge(id);
  if (!updated) throw new NotFoundError(`alert ${id} not found`);
  return updated;
}
