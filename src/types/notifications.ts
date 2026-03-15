export type NotificationType = 'success' | 'error' | 'warning' | 'info';
export type NotificationMetadata = Record<string, unknown>;

export interface Notification {
  id: string;
  title: string;
  maybeDescription?: string;
  type: NotificationType;
  timestamp: number;
  read: boolean;
  maybeAction?: {
    label: string;
    onClick: () => void;
  };
  maybeMetadata?: NotificationMetadata;
}

export interface NotificationOptions {
  title: string;
  maybeDescription?: string;
  maybeType?: NotificationType;
  maybeAction?: {
    label: string;
    onClick: () => void;
  };
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
