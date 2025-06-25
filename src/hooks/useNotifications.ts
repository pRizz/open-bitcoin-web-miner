import { useState, useEffect } from 'react';
import { notificationManager } from '@/utils/notifications';
import type { Notification, NotificationOptions, NotificationFilters } from '@/types/notifications';

export function useNotifications(filters?: NotificationFilters) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const unsubscribe = notificationManager.subscribe((allNotifications) => {
      const filtered = notificationManager.getNotifications(filters);
      setNotifications(filtered);
      setUnreadCount(notificationManager.getUnreadCount());
    });

    return unsubscribe;
  }, [filters]);

  const markAsRead = (id: string) => {
    notificationManager.markAsRead(id);
  };

  const markAllAsRead = () => {
    notificationManager.markAllAsRead();
  };

  const deleteNotification = (id: string) => {
    notificationManager.deleteNotification(id);
  };

  const clearAll = () => {
    notificationManager.clearAll();
  };

  const show = (options: NotificationOptions) => {
    return notificationManager.show(options);
  };

  const success = (title: string, maybeDescription?: string, options?: Partial<NotificationOptions>) => {
    return notificationManager.success(title, maybeDescription, options);
  };

  const error = (title: string, maybeDescription?: string, options?: Partial<NotificationOptions>) => {
    return notificationManager.error(title, maybeDescription, options);
  };

  const warning = (title: string, maybeDescription?: string, options?: Partial<NotificationOptions>) => {
    return notificationManager.warning(title, maybeDescription, options);
  };

  const info = (title: string, maybeDescription?: string, options?: Partial<NotificationOptions>) => {
    return notificationManager.info(title, maybeDescription, options);
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    show,
    success,
    error,
    warning,
    info,
  };
}