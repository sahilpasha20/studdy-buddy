export type NotificationPermission = 'granted' | 'denied' | 'default';

export function isNotificationSupported(): boolean {
  return 'Notification' in window && typeof Notification.requestPermission === 'function';
}

export function isInIframe(): boolean {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) {
    return 'denied';
  }
  return Notification.permission as NotificationPermission;
}

export async function requestNotificationPermission(): Promise<{
  permission: NotificationPermission;
  error?: string
}> {
  if (!isNotificationSupported()) {
    return {
      permission: 'denied',
      error: 'Your browser does not support notifications.'
    };
  }

  if (isInIframe()) {
    const currentPermission = getNotificationPermission();
    if (currentPermission !== 'granted') {
      return {
        permission: 'denied',
        error: 'Notifications are blocked in embedded mode. Please open this app in a new tab to enable notifications.'
      };
    }
  }

  try {
    const permission = await Notification.requestPermission();

    if (permission === 'default') {
      return {
        permission: 'default',
        error: 'The notification prompt was dismissed. Please try again and click "Allow" when prompted.'
      };
    }

    if (permission === 'denied') {
      return {
        permission: 'denied',
        error: 'Notifications were blocked. To enable them, click the lock icon in your browser address bar and allow notifications.'
      };
    }

    return { permission: permission as NotificationPermission };
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return {
      permission: 'denied',
      error: 'Failed to request notification permission. This may be due to browser restrictions.'
    };
  }
}

export interface StudyNotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  requireInteraction?: boolean;
  silent?: boolean;
}

export function showStudyNotification(options: StudyNotificationOptions): Notification | null {
  if (!isNotificationSupported() || getNotificationPermission() !== 'granted') {
    return null;
  }

  try {
    const notification = new Notification(options.title, {
      body: options.body,
      icon: options.icon || '/favicon.ico',
      badge: options.badge || '/favicon.ico',
      tag: options.tag || 'study-reminder',
      requireInteraction: options.requireInteraction ?? true,
      silent: options.silent ?? false,
      vibrate: [200, 100, 200],
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    return notification;
  } catch (error) {
    console.error('Error showing notification:', error);
    return null;
  }
}

export function testNotification(): boolean {
  const notification = showStudyNotification({
    title: '📚 Study Reminder Test',
    body: 'This is how your daily study reminder will look!',
    requireInteraction: false,
  });

  if (notification) {
    setTimeout(() => notification.close(), 5000);
    return true;
  }
  return false;
}
