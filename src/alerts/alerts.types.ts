export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface Alert {
  id: string;
  type: string;
  message: string;
  severity: AlertSeverity;
  sourceModule: string;
  referenceId: string;
  storeId: string;
  acknowledged: boolean;
  createdAt: string;
  acknowledgedAt: string | null;
}

export interface CreateAlertInput {
  type: string;
  message: string;
  severity: AlertSeverity;
  sourceModule: string;
  referenceId: string;
  storeId: string;
}

export interface AlertFilter {
  severity?: AlertSeverity;
  acknowledged?: boolean;
  storeId?: string;
}
