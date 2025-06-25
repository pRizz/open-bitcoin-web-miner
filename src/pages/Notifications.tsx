import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { PageTransition } from '@/components/PageTransition';
import { useNotifications } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import {
  Bell,
  Check,
  X,
  Trash2,
  AlertCircle,
  Info,
  CheckCircle,
  AlertTriangle,
  Filter,
  Eye,
  EyeOff
} from 'lucide-react';
import type { NotificationType } from '@/types/notifications';

const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
  case 'success':
    return <CheckCircle className="h-5 w-5 text-green-500" />;
  case 'error':
    return <AlertCircle className="h-5 w-5 text-red-500" />;
  case 'warning':
    return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
  case 'info':
    return <Info className="h-5 w-5 text-blue-500" />;
  default:
    return <Bell className="h-5 w-5 text-gray-500" />;
  }
};

const getNotificationColor = (type: NotificationType) => {
  switch (type) {
  case 'success':
    return 'border-green-900 bg-green-950 text-green-100';
  case 'error':
    return 'border-red-900 bg-red-950 text-red-100';
  case 'warning':
    return 'border-yellow-900 bg-yellow-950 text-yellow-100';
  case 'info':
    return 'border-blue-900 bg-blue-950 text-blue-100';
  default:
    return 'border-gray-900 bg-gray-950 text-gray-100';
  }
};

const Notifications = () => {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  } = useNotifications();

  const [typeFilter, setTypeFilter] = useState<NotificationType | 'all'>('all');
  //   const [readFilter, setReadFilter] = useState<'all' | 'read' | 'unread'>('all');
  const [showRead, setShowRead] = useState(true);

  // Mark all notifications as read when visiting the page
  useEffect(() => {
    // TODO: Uncomment when we figure out why unreadCount starts at 0, mistakenly.
    // if (unreadCount > 0) {
    markAllAsRead();
    // }
  }, []); // Empty dependency array means this runs once when component mounts

  const filteredNotifications = notifications.filter(notification => {
    if (typeFilter !== 'all' && notification.type !== typeFilter) {
      return false;
    }

    // if (readFilter === 'read' && !notification.read) {
    //   return false;
    // }

    // if (readFilter === 'unread' && notification.read) {
    //   return false;
    // }

    if (!showRead && notification.read) {
      return false;
    }

    return true;
  });

  const handleMarkAsRead = (id: string) => {
    markAsRead(id);
  };

  const handleDelete = (id: string) => {
    deleteNotification(id);
  };

  return (
    <PageTransition>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Notifications</h1>
            {/* <p className="text-muted-foreground">
              {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            </p> */}
          </div>
          <div className="flex items-center gap-2">
            {/* {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={markAllAsRead}
                className="flex items-center gap-2"
              >
                <Check className="h-4 w-4" />
                Mark all as read
              </Button>
            )} */}

            <div className="flex items-center gap-2">
              <h3 className="font-semibold">Filter by type:</h3>
            </div>

            <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as NotificationType | 'all')}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="info">Info</SelectItem>
              </SelectContent>
            </Select>

            {notifications.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearAll}
                className="flex items-center gap-2 text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
                Clear all
              </Button>
            )}
          </div>
        </div>

        {/* Filters */}
        {/* <Card className="p-4 flex flex-row gap-4">
          <div className="flex items-center gap-4">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <div className="font-semibold flex items-center gap-2">
            <h3 >Filter by type</h3>
            </div>
            <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as NotificationType | 'all')}>
            <SelectTrigger>
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="info">Info</SelectItem>
            </SelectContent>
            </Select>

          </div>
        </Card> */}

        {/* Notifications List */}
        <div className="space-y-3">
          {filteredNotifications.length === 0 ? (
            <Card className="p-8 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No notifications</h3>
              <p className="text-muted-foreground">
                {notifications.length === 0
                  ? "You haven't received any notifications yet."
                  : "No notifications match your current filters."
                }
              </p>
            </Card>
          ) : (
            filteredNotifications.map((notification) => (
              <Card
                key={notification.id}
                className={`p-4 transition-all duration-200 hover:shadow-md ${
                  notification.read ? 'opacity-75' : ''
                } ${getNotificationColor(notification.type)}`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-sm">
                            {notification.title}
                          </h4>
                          {!notification.read && (
                            <Badge variant="secondary" className="text-xs">
                              New
                            </Badge>
                          )}
                          <Badge variant="outline" className={`text-xs capitalize ${getNotificationColor(notification.type)}`}>
                            {notification.type}
                          </Badge>
                        </div>

                        {notification.maybeDescription && (
                          <p className="text-sm text-muted-foreground mb-2">
                            {notification.maybeDescription}
                          </p>
                        )}

                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>
                            {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                          </span>
                          {notification.maybeMetadata && Object.keys(notification.maybeMetadata).length > 0 && (
                            <span>
                              {Object.keys(notification.maybeMetadata).length} metadata field{Object.keys(notification.maybeMetadata).length !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        {notification.maybeAction && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={notification.maybeAction.onClick}
                            className="text-xs"
                          >
                            {notification.maybeAction.label}
                          </Button>
                        )}

                        {/* {!notification.read ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="h-8 w-8 p-0"
                            title="Mark as read"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 opacity-50"
                            title="Already read"
                            disabled
                          >
                            <EyeOff className="h-4 w-4" />
                          </Button>
                        )} */}

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(notification.id)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          title="Delete notification"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Summary */}
        {notifications.length > 0 && (
          <Card className="p-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Showing {filteredNotifications.length} of {notifications.length} notifications
              </span>
            </div>
          </Card>
        )}
      </div>
    </PageTransition>
  );
};

export default Notifications;