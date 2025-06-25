export type NotificationType = 'success' | 'error' | 'warning' | 'info';

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
  maybeMetadata?: Record<string, any>;
}

export interface NotificationOptions {
  title: string;
  maybeDescription?: string;
  maybeType?: NotificationType;
  maybeAction?: {
    label: string;
    onClick: () => void;
  };
  maybeMetadata?: Record<string, any>;
  maybePersist?: boolean;
}

export interface NotificationFilters {
  maybeType?: NotificationType;
  maybeRead?: boolean;
  maybeStartDate?: number;
  maybeEndDate?: number;
}