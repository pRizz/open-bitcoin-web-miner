import { describe, expect, it } from 'vitest';

import type { Notification } from '@/types/notifications';
import { parseStoredNotifications, toStoredNotifications } from '@/utils/notifications';

describe('toStoredNotifications', () => {
  it('omits runtime actions when persisting notifications', () => {
    // Arrange
    const notifications: Notification[] = [
      {
        id: 'notification-1',
        title: 'Leaderboard updated',
        maybeDescription: 'You moved up a rank.',
        type: 'success',
        timestamp: 1_700_000_000_000,
        read: false,
        maybeAction: {
          label: 'Open leaderboard',
          onClick: () => undefined,
        },
        maybeMetadata: {
          source: 'test',
        },
      },
    ];

    // Act
    const storedNotifications = toStoredNotifications(notifications);

    // Assert
    expect(storedNotifications).toEqual([
      {
        id: 'notification-1',
        title: 'Leaderboard updated',
        maybeDescription: 'You moved up a rank.',
        type: 'success',
        timestamp: 1_700_000_000_000,
        read: false,
        maybeMetadata: {
          source: 'test',
        },
      },
    ]);
  });
});

describe('parseStoredNotifications', () => {
  it('rehydrates valid stored notifications', () => {
    // Arrange
    const rawNotifications = JSON.stringify([
      {
        id: 'notification-1',
        title: 'Leaderboard updated',
        maybeDescription: 'You moved up a rank.',
        type: 'success',
        timestamp: 1_700_000_000_000,
        read: true,
        maybeMetadata: {
          source: 'test',
        },
      },
    ]);

    // Act
    const notifications = parseStoredNotifications(rawNotifications);

    // Assert
    expect(notifications).toEqual([
      {
        id: 'notification-1',
        title: 'Leaderboard updated',
        maybeDescription: 'You moved up a rank.',
        type: 'success',
        timestamp: 1_700_000_000_000,
        read: true,
        maybeMetadata: {
          source: 'test',
        },
      },
    ]);
  });

  it('drops legacy persisted actions that cannot be executed', () => {
    // Arrange
    const rawNotifications = JSON.stringify([
      {
        id: 'notification-1',
        title: 'Leaderboard updated',
        type: 'success',
        timestamp: 1_700_000_000_000,
        read: false,
        maybeAction: {
          label: 'Open leaderboard',
        },
      },
    ]);

    // Act
    const notifications = parseStoredNotifications(rawNotifications);

    // Assert
    expect(notifications).toHaveLength(1);
    expect(notifications[0]).not.toHaveProperty('maybeAction');
  });

  it('drops malformed stored notifications', () => {
    // Arrange
    const rawNotifications = JSON.stringify([
      {
        title: 'Missing id',
        type: 'info',
        timestamp: 1_700_000_000_000,
        read: false,
      },
    ]);

    // Act
    const notifications = parseStoredNotifications(rawNotifications);

    // Assert
    expect(notifications).toEqual([]);
  });

  it('returns an empty list for invalid JSON', () => {
    // Arrange
    const rawNotifications = '{"id":';

    // Act
    const notifications = parseStoredNotifications(rawNotifications);

    // Assert
    expect(notifications).toEqual([]);
  });
});
