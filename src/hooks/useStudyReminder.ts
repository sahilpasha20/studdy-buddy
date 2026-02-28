import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import {
  getNotificationPermission,
  requestNotificationPermission,
  showStudyNotification,
  isNotificationSupported,
} from "@/lib/notifications";

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

  const lastFiredRef = useRef("");

  const requestPermission = useCallback(async () => {
    const permission = await requestNotificationPermission();
    setNotificationPermission(permission);
    return permission;
  }, []);

  const enableReminder = useCallback(
    async (time: string) => {
      let permission = notificationPermission;

      if (isNotificationSupported() && permission !== "granted") {
        permission = await requestPermission();
      }

      localStorage.setItem("study-reminder-time", time);
      setReminderTime(time);
      setReminderEnabled(true);

      if (permission === "granted") {
        toast.success("📚 Reminder set!", {
          description: `You'll get a notification at ${time} every day to study!`,
          duration: 5000,
        });
      } else {
        toast("📚 Reminder set!", {
          description: `You'll be reminded at ${time} every day. Enable browser notifications for better reminders!`,
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
    toast.info("Reminder turned off.");
  }, []);

  const toggleSound = useCallback((enabled: boolean) => {
    localStorage.setItem("study-reminder-sound", String(enabled));
    setSoundEnabled(enabled);
  }, []);

  useEffect(() => {
    if (!reminderEnabled || !reminderTime) return;

    const check = () => {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(
        now.getMinutes()
      ).padStart(2, "0")}`;

      if (currentTime === reminderTime && lastFiredRef.current !== currentTime) {
        lastFiredRef.current = currentTime;

        const notificationShown = showStudyNotification({
          title: "📚 Time to Study!",
          body: "Open your study plan and get started with today's tasks!",
          requireInteraction: true,
          silent: !soundEnabled,
        });

        if (!notificationShown) {
          toast("📚 Time to study!", {
            description: "Open your study plan and get started!",
            duration: 15000,
          });
        }
      }
    };

    check();
    const interval = setInterval(check, 10_000);
    return () => clearInterval(interval);
  }, [reminderEnabled, reminderTime, soundEnabled]);

  return {
    reminderTime,
    reminderEnabled,
    notificationPermission,
    soundEnabled,
    enableReminder,
    disableReminder,
    requestPermission,
    toggleSound,
  };
}
