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
  playSound?: boolean;
}

let currentSpeech: SpeechSynthesisUtterance | null = null;

function speakMessage(message: string): void {
  if (!('speechSynthesis' in window)) {
    return;
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(message);
  utterance.rate = 0.9;
  utterance.pitch = 1.1;
  utterance.volume = 1;

  const voices = window.speechSynthesis.getVoices();
  const preferredVoice = voices.find(v =>
    v.lang.startsWith('en') && (v.name.includes('Female') || v.name.includes('Samantha') || v.name.includes('Google'))
  ) || voices.find(v => v.lang.startsWith('en'));

  if (preferredVoice) {
    utterance.voice = preferredVoice;
  }

  currentSpeech = utterance;
  window.speechSynthesis.speak(utterance);
}

export function playNotificationSound(): void {
  try {
    speakMessage("It's time to study! Good luck!");
  } catch (error) {
    console.error('Error playing notification sound:', error);
  }
}

export function stopNotificationSound(): void {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  currentSpeech = null;
}

export function showStudyNotification(options: StudyNotificationOptions): Notification | null {
  if (options.playSound) {
    playNotificationSound();
  }

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
      silent: true,
    });

    notification.onclick = () => {
      window.focus();
      stopNotificationSound();
      notification.close();
    };

    return notification;
  } catch (error) {
    console.error('Error showing notification:', error);
    return null;
  }
}

export function testNotification(playSound: boolean = true): boolean {
  if (playSound) {
    playNotificationSound();
  }

  const notification = showStudyNotification({
    title: 'Study Reminder Test',
    body: 'This is how your daily study reminder will look!',
    requireInteraction: false,
    playSound: false,
  });

  if (notification) {
    setTimeout(() => notification.close(), 5000);
    return true;
  }
  return playSound;
}
