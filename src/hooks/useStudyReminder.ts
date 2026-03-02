import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import {
  getNotificationPermission,
  requestNotificationPermission,
  showStudyNotification,
  isNotificationSupported,
  playNotificationSound,
  stopNotificationSound,
  isAlarmActive,
} from "@/lib/notifications";
import {
  createReminderWorker,
  startReminderWorker,
  stopReminderWorker,
  updateReminderTime,
  terminateReminderWorker,
} from "@/lib/reminderWorker";

export function useStudyReminder() {
  const [reminderTime, setReminderTime] = useState<string>(
    () => localStorage.getItem("study-reminder-time") || ""
  );
  const [reminderEnabled, setReminderEnabled] = useState(
    () => !!localStorage.getItem("study-reminder-time")
  );
  const [notificationPermission, setNotificationPermission] = useState<
    "granted" | "denied" | "default"
  >(() => getNotificationPermission());

  const [soundEnabled, setSoundEnabled] = useState(
    () => localStorage.getItem("study-reminder-sound") !== "false"
  );

  const [alarmActive, setAlarmActive] = useState(false);

  const workerInitializedRef = useRef(false);
  const soundEnabledRef = useRef(soundEnabled);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  const dismissAlarm = useCallback(() => {
    stopNotificationSound();
    setAlarmActive(false);
  }, []);

  const triggerReminder = useCallback(() => {
    setAlarmActive(true);

    const notificationShown = showStudyNotification({
      title: "Time to Study!",
      body: "Open your study plan and get started with today's tasks!",
      requireInteraction: true,
      playSound: soundEnabledRef.current,
    });

    if (!notificationShown && soundEnabledRef.current) {
      playNotificationSound();
    }
  }, []);

  useEffect(() => {
    if (!workerInitializedRef.current) {
      createReminderWorker(triggerReminder);
      workerInitializedRef.current = true;
    }

    return () => {
      terminateReminderWorker();
      workerInitializedRef.current = false;
    };
  }, [triggerReminder]);

  useEffect(() => {
    if (reminderEnabled && reminderTime) {
      startReminderWorker(reminderTime);
    } else {
      stopReminderWorker();
    }
  }, [reminderEnabled, reminderTime]);

  useEffect(() => {
    if (reminderEnabled && reminderTime) {
      updateReminderTime(reminderTime);
    }
  }, [reminderTime, reminderEnabled]);

  const requestPermission = useCallback(async () => {
    const result = await requestNotificationPermission();
    setNotificationPermission(result.permission);
    return result;
  }, []);

  const enableReminder = useCallback(
    async (time: string) => {
      let permission = notificationPermission;

      if (isNotificationSupported() && permission !== "granted") {
        const result = await requestPermission();
        permission = result.permission;
        if (result.error && result.permission !== "granted") {
          toast.error(result.error, { duration: 6000 });
        }
      }

      localStorage.setItem("study-reminder-time", time);
      setReminderTime(time);
      setReminderEnabled(true);

      if (permission === "granted") {
        toast.success("Reminder set!", {
          description: `You'll get a notification at ${time} every day to study!`,
          duration: 5000,
        });
      } else {
        toast("Reminder set!", {
          description: `You'll be reminded at ${time} every day via in-app notifications.`,
          duration: 5000,
        });
      }
    },
    [notificationPermission, requestPermission]
  );

  const disableReminder = useCallback(() => {
    localStorage.removeItem("study-reminder-time");
    setReminderTime("");
    setReminderEnabled(false);
    stopReminderWorker();
    toast.info("Reminder turned off.");
  }, []);

  const toggleSound = useCallback((enabled: boolean) => {
    localStorage.setItem("study-reminder-sound", String(enabled));
    setSoundEnabled(enabled);
  }, []);

  return {
    reminderTime,
    reminderEnabled,
    notificationPermission,
    soundEnabled,
    alarmActive,
    enableReminder,
    disableReminder,
    requestPermission,
    toggleSound,
    dismissAlarm,
  };
}
