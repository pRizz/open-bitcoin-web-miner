export type NotificationType = 'success' | 'error' | 'warning' | 'info';
export type NotificationMetadata = Record<string, unknown>;

export interface NotificationAction {
  label: string;
  onClick: () => void;
}

export interface StoredNotification {
  id: string;
  title: string;
  maybeDescription?: string;
  type: NotificationType;
  timestamp: number;
  read: boolean;
  maybeMetadata?: NotificationMetadata;
}

export interface Notification extends StoredNotification {
  maybeAction?: NotificationAction;
}

export interface NotificationOptions {
  title: string;
  maybeDescription?: string;
  maybeType?: NotificationType;
  maybeAction?: NotificationAction;
  maybeMetadata?: NotificationMetadata;
  maybePersist?: boolean;
  maybeDuration?: number;
}

export interface NotificationFilters {
  maybeType?: NotificationType;
  maybeRead?: boolean;
  maybeStartDate?: number;
  maybeEndDate?: number;
}
