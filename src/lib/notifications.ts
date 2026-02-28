export type NotificationPermission = 'granted' | 'denied' | 'default';

export function isNotificationSupported(): boolean {
  return 'Notification' in window;
}

export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) {
    return 'denied';
  }
  return Notification.permission as NotificationPermission;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) {
    return 'denied';
  }

  try {
    const permission = await Notification.requestPermission();
    return permission as NotificationPermission;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return 'denied';
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
