const workerCode = `
let intervalId = null;
let reminderTime = null;
let lastFired = null;

self.onmessage = function(e) {
  const { type, time } = e.data;

  if (type === 'start') {
    reminderTime = time;
    lastFired = null;

    if (intervalId) {
      clearInterval(intervalId);
    }

    intervalId = setInterval(() => {
      if (!reminderTime) return;

      const now = new Date();
      const currentTime = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');

      if (currentTime === reminderTime && lastFired !== currentTime) {
        lastFired = currentTime;
        self.postMessage({ type: 'trigger' });
      }
    }, 5000);
  }

  if (type === 'stop') {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
    reminderTime = null;
  }

  if (type === 'updateTime') {
    reminderTime = time;
    lastFired = null;
  }
};
`;

let worker: Worker | null = null;

export function createReminderWorker(onTrigger: () => void): Worker | null {
  if (typeof Worker === 'undefined') {
    return null;
  }

  try {
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    worker = new Worker(url);

    worker.onmessage = (e) => {
      if (e.data.type === 'trigger') {
        onTrigger();
      }
    };

    return worker;
  } catch (error) {
    console.error('Failed to create reminder worker:', error);
    return null;
  }
}

export function startReminderWorker(time: string): void {
  if (worker) {
    worker.postMessage({ type: 'start', time });
  }
}

export function stopReminderWorker(): void {
  if (worker) {
    worker.postMessage({ type: 'stop' });
  }
}

export function updateReminderTime(time: string): void {
  if (worker) {
    worker.postMessage({ type: 'updateTime', time });
  }
}

export function terminateReminderWorker(): void {
  if (worker) {
    worker.terminate();
    worker = null;
  }
}
