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

let notificationAudio: HTMLAudioElement | null = null;

function createAlarmSound(): HTMLAudioElement {
  const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  const sampleRate = audioContext.sampleRate;
  const duration = 2;
  const buffer = audioContext.createBuffer(1, sampleRate * duration, sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < buffer.length; i++) {
    const t = i / sampleRate;
    const freq1 = 440 * Math.pow(2, Math.floor(t * 4) % 2 === 0 ? 0 : 2/12);
    const freq2 = 880;
    const envelope = Math.min(1, (duration - t) * 2) * Math.min(1, t * 10);
    data[i] = envelope * 0.3 * (
      Math.sin(2 * Math.PI * freq1 * t) +
      0.5 * Math.sin(2 * Math.PI * freq2 * t) +
      0.25 * Math.sin(2 * Math.PI * freq1 * 2 * t)
    );
  }

  const wavBlob = audioBufferToWav(buffer);
  const audioUrl = URL.createObjectURL(wavBlob);
  const audio = new Audio(audioUrl);
  audio.loop = false;
  return audio;
}

function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1;
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const data = buffer.getChannelData(0);
  const dataLength = data.length * bytesPerSample;
  const bufferLength = 44 + dataLength;
  const arrayBuffer = new ArrayBuffer(bufferLength);
  const view = new DataView(arrayBuffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, bufferLength - 8, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(36, 'data');
  view.setUint32(40, dataLength, true);

  let offset = 44;
  for (let i = 0; i < data.length; i++) {
    const sample = Math.max(-1, Math.min(1, data[i]));
    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
    offset += 2;
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

export function playNotificationSound(): void {
  try {
    if (!notificationAudio) {
      notificationAudio = createAlarmSound();
    }
    notificationAudio.currentTime = 0;
    notificationAudio.play().catch(console.error);
  } catch (error) {
    console.error('Error playing notification sound:', error);
  }
}

export function stopNotificationSound(): void {
  if (notificationAudio) {
    notificationAudio.pause();
    notificationAudio.currentTime = 0;
  }
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
