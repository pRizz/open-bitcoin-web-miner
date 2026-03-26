import { toast } from '@/hooks/use-toast';
import type {
  Notification,
  NotificationFilters,
  NotificationMetadata,
  NotificationOptions,
  NotificationType,
  StoredNotification,
} from '@/types/notifications';

const STORAGE_KEY = 'notifications';
const MAX_NOTIFICATIONS = 1000;
const DEFAULT_DURATION = 7000;

function isNotificationType(value: unknown): value is NotificationType {
  return value === 'success' || value === 'error' || value === 'warning' || value === 'info';
}

function isNotificationMetadata(value: unknown): value is NotificationMetadata {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseStoredNotification(value: unknown): StoredNotification | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  const { id, title, type, timestamp, read, maybeDescription, maybeMetadata } = candidate;

  if (typeof id !== 'string' || typeof title !== 'string' || !isNotificationType(type)) {
    return null;
  }

  if (typeof timestamp !== 'number' || !Number.isFinite(timestamp) || typeof read !== 'boolean') {
    return null;
  }

  const notification: StoredNotification = {
    id,
    title,
    type,
    timestamp,
    read,
  };

  if (typeof maybeDescription === 'string') {
    notification.maybeDescription = maybeDescription;
  }

  if (isNotificationMetadata(maybeMetadata)) {
    notification.maybeMetadata = maybeMetadata;
  }

  return notification;
}

export function parseStoredNotifications(raw: string | null): StoredNotification[] {
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map(parseStoredNotification)
      .filter((notification): notification is StoredNotification => notification !== null);
  } catch {
    return [];
  }
}

export function toStoredNotifications(notifications: Notification[]): StoredNotification[] {
  return notifications.map(({ maybeAction: _maybeAction, ...notification }) => notification);
}

class NotificationManager {
  private notifications: Notification[] = [];
  private listeners: Set<(notifications: Notification[]) => void> = new Set();

  constructor() {
    this.loadFromStorage();
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private saveToStorage(): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toStoredNotifications(this.notifications)));
    } catch (error) {
      console.warn('Failed to save notifications to localStorage:', error);
    }
  }

  private loadFromStorage(): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      this.notifications = parseStoredNotifications(stored);
    } catch (error) {
      console.warn('Failed to load notifications from localStorage:', error);
      this.notifications = [];
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener([...this.notifications]));
  }

  private addNotification(notification: Notification): void {
    this.notifications.unshift(notification);

    // Keep only the most recent notifications
    if (this.notifications.length > MAX_NOTIFICATIONS) {
      this.notifications = this.notifications.slice(0, MAX_NOTIFICATIONS);
    }

    this.saveToStorage();
    this.notifyListeners();
  }

  public show(options: NotificationOptions): string {
    const id = this.generateId();
    const notification: Notification = {
      id,
      title: options.title,
      maybeDescription: options.maybeDescription,
      type: options.maybeType || 'info',
      timestamp: Date.now(),
      read: false,
      maybeAction: options.maybeAction,
      maybeMetadata: options.maybeMetadata,
    };

    // Always show toast
    toast({
      title: notification.title,
      description: notification.maybeDescription,
      variant: this.getToastVariant(notification.type),
      duration: options.maybeDuration ?? DEFAULT_DURATION,
    });

    // Persist to storage if requested
    if (options.maybePersist !== false) {
      this.addNotification(notification);
    }

    return id;
  }

  public success(title: string, maybeDescription?: string, options?: Partial<NotificationOptions>): string {
    return this.show({
      title,
      maybeDescription,
      maybeType: 'success',
      ...options,
    });
  }

  public error(title: string, maybeDescription?: string, options?: Partial<NotificationOptions>): string {
    return this.show({
      title,
      maybeDescription,
      maybeType: 'error',
      ...options,
    });
  }

  public warning(title: string, maybeDescription?: string, options?: Partial<NotificationOptions>): string {
    return this.show({
      title,
      maybeDescription,
      maybeType: 'warning',
      ...options,
    });
  }

  public info(title: string, maybeDescription?: string, options?: Partial<NotificationOptions>): string {
    return this.show({
      title,
      maybeDescription,
      maybeType: 'info',
      ...options,
    });
  }

  // Convenience methods for common durations
  public showShort(title: string, maybeDescription?: string, options?: Partial<NotificationOptions>): string {
    return this.show({
      title,
      maybeDescription,
      maybeDuration: 3000, // 3 seconds
      ...options,
    });
  }

  public showLong(title: string, maybeDescription?: string, options?: Partial<NotificationOptions>): string {
    return this.show({
      title,
      maybeDescription,
      maybeDuration: 10000, // 10 seconds
      ...options,
    });
  }

  public showPersistent(title: string, maybeDescription?: string, options?: Partial<NotificationOptions>): string {
    return this.show({
      title,
      maybeDescription,
      maybeDuration: undefined, // No auto-dismiss
      ...options,
    });
  }

  private getToastVariant(type: NotificationType): 'default' | 'destructive' {
    return type === 'error' ? 'destructive' : 'default';
  }

  public getNotifications(filters?: NotificationFilters): Notification[] {
    let filtered = [...this.notifications];

    if (filters?.maybeType) {
      filtered = filtered.filter(n => n.type === filters.maybeType);
    }

    if (filters?.maybeRead !== undefined) {
      filtered = filtered.filter(n => n.read === filters.maybeRead);
    }

    if (filters?.maybeStartDate) {
      filtered = filtered.filter(n => n.timestamp >= filters.maybeStartDate!);
    }

    if (filters?.maybeEndDate) {
      filtered = filtered.filter(n => n.timestamp <= filters.maybeEndDate!);
    }

    return filtered;
  }

  public markAsRead(id: string): void {
    const notification = this.notifications.find(n => n.id === id);
    if (notification) {
      notification.read = true;
      this.saveToStorage();
      this.notifyListeners();
    }
  }

  public markAllAsRead(): void {
    this.notifications.forEach(n => n.read = true);
    this.saveToStorage();
    this.notifyListeners();
  }

  public deleteNotification(id: string): void {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.saveToStorage();
    this.notifyListeners();
  }

  public clearAll(): void {
    this.notifications = [];
    this.saveToStorage();
    this.notifyListeners();
  }

  public getUnreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  public subscribe(listener: (notifications: Notification[]) => void): () => void {
    this.listeners.add(listener);
    // Immediately call with current state
    listener([...this.notifications]);

    return () => {
      this.listeners.delete(listener);
    };
  }
}

// Create singleton instance
export const notificationManager = new NotificationManager();

// Export convenience functions
export const showNotification = (options: NotificationOptions) => notificationManager.show(options);
export const showSuccess = (title: string, maybeDescription?: string, options?: Partial<NotificationOptions>) =>
  notificationManager.success(title, maybeDescription, options);
export const showError = (title: string, maybeDescription?: string, options?: Partial<NotificationOptions>) =>
  notificationManager.error(title, maybeDescription, options);
export const showWarning = (title: string, maybeDescription?: string, options?: Partial<NotificationOptions>) =>
  notificationManager.warning(title, maybeDescription, options);
export const showInfo = (title: string, maybeDescription?: string, options?: Partial<NotificationOptions>) =>
  notificationManager.info(title, maybeDescription, options);

export const showShort = (title: string, maybeDescription?: string, options?: Partial<NotificationOptions>) =>
  notificationManager.showShort(title, maybeDescription, options);
export const showLong = (title: string, maybeDescription?: string, options?: Partial<NotificationOptions>) =>
  notificationManager.showLong(title, maybeDescription, options);
export const showPersistent = (title: string, maybeDescription?: string, options?: Partial<NotificationOptions>) =>
  notificationManager.showPersistent(title, maybeDescription, options);

export default notificationManager;
