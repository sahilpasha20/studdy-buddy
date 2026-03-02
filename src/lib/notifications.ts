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
  const duration = 8;
  const buffer = audioContext.createBuffer(1, sampleRate * duration, sampleRate);
  const data = buffer.getChannelData(0);

  const melody = [
    { freq: 523.25, start: 0, dur: 0.3 },
    { freq: 659.25, start: 0.35, dur: 0.3 },
    { freq: 783.99, start: 0.7, dur: 0.3 },
    { freq: 659.25, start: 1.05, dur: 0.3 },
    { freq: 783.99, start: 1.4, dur: 0.5 },
    { freq: 880.00, start: 2.0, dur: 0.6 },
    { freq: 783.99, start: 2.7, dur: 0.3 },
    { freq: 659.25, start: 3.05, dur: 0.3 },
    { freq: 523.25, start: 3.4, dur: 0.3 },
    { freq: 659.25, start: 3.75, dur: 0.5 },
    { freq: 523.25, start: 4.4, dur: 0.8 },
    { freq: 392.00, start: 5.4, dur: 0.3 },
    { freq: 440.00, start: 5.75, dur: 0.3 },
    { freq: 523.25, start: 6.1, dur: 0.3 },
    { freq: 659.25, start: 6.45, dur: 0.4 },
    { freq: 523.25, start: 6.95, dur: 0.8 },
  ];

  for (let i = 0; i < buffer.length; i++) {
    const t = i / sampleRate;
    let sample = 0;

    for (const note of melody) {
      if (t >= note.start && t < note.start + note.dur) {
        const noteT = t - note.start;
        const attack = Math.min(1, noteT * 20);
        const release = Math.min(1, (note.dur - noteT) * 10);
        const env = attack * release;
        sample += env * 0.15 * (
          Math.sin(2 * Math.PI * note.freq * noteT) +
          0.3 * Math.sin(2 * Math.PI * note.freq * 2 * noteT) * Math.exp(-noteT * 3)
        );
      }
    }

    const masterFade = t > 7 ? (8 - t) : 1;
    data[i] = sample * masterFade;
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
