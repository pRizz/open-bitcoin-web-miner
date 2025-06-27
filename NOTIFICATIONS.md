# Notifications System

This document describes the notifications system implemented in the Win3Bitcoi.in / WinABitco.in application.

## Overview

The notifications system provides a unified way to display user notifications throughout the application. It combines real-time toast notifications with persistent storage, allowing users to view their notification history.

## Features

- **Real-time Toast Notifications**: Instant visual feedback for user actions
- **Persistent Storage**: Notifications are saved to localStorage and persist across sessions
- **Notification History**: Dedicated page to view all notifications with filtering options
- **Unread Count Badge**: Visual indicator in the sidebar showing unread notifications
- **Multiple Notification Types**: Success, Error, Warning, and Info notifications
- **Filtering and Management**: Mark as read, delete, and filter notifications

## Architecture

### Core Components

1. **NotificationManager** (`src/utils/notifications.ts`)
   - Singleton class managing notification state
   - Handles localStorage persistence
   - Provides subscription mechanism for reactive updates

2. **useNotifications Hook** (`src/hooks/useNotifications.ts`)
   - React hook providing access to notification state
   - Handles reactive updates and filtering

3. **Notifications Page** (`src/pages/Notifications.tsx`)
   - Dedicated page for viewing notification history
   - Filtering by type and read status
   - Management actions (mark as read, delete, clear all)

4. **NotificationBadge Component** (`src/components/NotificationBadge.tsx`)
   - Displays unread notification count
   - Used in sidebar navigation

### Types

```typescript
type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface Notification {
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
  maybeDuration?: number;
}

interface NotificationFilters {
  maybeType?: NotificationType;
  maybeRead?: boolean;
  maybeStartDate?: number;
  maybeEndDate?: number;
}
```

## Usage

### Basic Usage

```typescript
import { showSuccess, showError, showWarning, showInfo } from '@/utils/notifications';

// Show different types of notifications
showSuccess("Operation Successful", "Your action was completed successfully");
showError("Operation Failed", "Something went wrong");
showWarning("Warning", "Please check your input");
showInfo("Information", "Here's some useful information");
```

### Advanced Usage

```typescript
import { showNotification } from '@/utils/notifications';

// Show notification with custom options
showNotification({
  title: "Custom Notification",
  maybeDescription: "With custom options",
  maybeType: "info",
  maybePersist: true, // Save to history (default: true)
  maybeDuration: 5000, // Show for 5 seconds
  maybeAction: {
    label: "View Details",
    onClick: () => navigate('/details')
  },
  maybeMetadata: {
    source: "mining",
    hashRate: 1000
  }
});
```

### Toast Duration

You can control how long toast notifications are displayed using the `maybeDuration` option:

```typescript
import { 
  showSuccess, 
  showShort, 
  showLong, 
  showPersistent 
} from '@/utils/notifications';

// Predefined durations
showShort("Quick Message", "Disappears in 3 seconds");
showLong("Important Message", "Stays for 10 seconds");
showPersistent("Manual Dismiss", "Won't auto-dismiss");

// Custom duration (in milliseconds)
showSuccess("Custom Duration", "5 second toast", { maybeDuration: 5000 });
showError("Quick Error", "2 second error", { maybeDuration: 2000 });

// Default behavior (uses Radix UI default)
showInfo("Default Duration", "Uses system default");
```

### Using the Hook

```typescript
import { useNotifications } from '@/hooks/useNotifications';

function MyComponent() {
  const {
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
    info
  } = useNotifications();

  // Filter notifications
  const { notifications: errorNotifications } = useNotifications({
    maybeType: 'error',
    maybeRead: false
  });

  return (
    <div>
      <p>Unread notifications: {unreadCount}</p>
      {notifications.map(notification => (
        <div key={notification.id}>
          {notification.title}
          <button onClick={() => markAsRead(notification.id)}>
            Mark as Read
          </button>
        </div>
      ))}
    </div>
  );
}
```

## Migration from Toast

The notification system replaces the previous toast-only approach. Here's how to migrate:

### Before (Toast)
```typescript
import { useToast } from '@/hooks/use-toast';

const { toast } = useToast();
toast({
  title: "Success",
  description: "Operation completed",
  variant: "default"
});
```

### After (Notifications)
```typescript
import { showSuccess } from '@/utils/notifications';

showSuccess("Success", "Operation completed");
```

## Storage

Notifications are stored in localStorage under the key `notifications`. The system automatically:

- Limits storage to 1000 notifications
- Handles storage errors gracefully
- Maintains notification order (newest first)

## Routing

The notifications page is accessible at `/notifications` and is included in the sidebar navigation with an unread count badge.

## Testing

A "Test Notifications" button is available on the main page to demonstrate the different notification types and timing.

## Future Enhancements

- IndexedDB storage for larger notification history
- Push notifications for real-time updates
- Notification preferences and settings
- Email integration for important notifications
- Notification categories and priority levels 