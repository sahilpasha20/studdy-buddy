import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";

export function useStudyReminder() {
  const [reminderTime, setReminderTime] = useState<string>(
    () => localStorage.getItem("study-reminder-time") || ""
  );
  const [reminderEnabled, setReminderEnabled] = useState(
    () => !!localStorage.getItem("study-reminder-time")
  );
  const lastFiredRef = useRef("");

  const enableReminder = useCallback((time: string) => {
    localStorage.setItem("study-reminder-time", time);
    setReminderTime(time);
    setReminderEnabled(true);
    toast("📚 Reminder set!", {
      description: `You'll be reminded at ${time} every day to study!`,
      duration: 5000,
    });
  }, []);

  const disableReminder = useCallback(() => {
    localStorage.removeItem("study-reminder-time");
    setReminderTime("");
    setReminderEnabled(false);
    toast.info("Reminder turned off.");
  }, []);

  // Run the reminder check at the app level — works on any screen
  useEffect(() => {
    if (!reminderEnabled || !reminderTime) return;

    const check = () => {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      if (currentTime === reminderTime && lastFiredRef.current !== currentTime) {
        lastFiredRef.current = currentTime;
        toast("📚 Time to study!", {
          description: "Open your study plan and get started!",
          duration: 15000,
        });
      }
    };

    check();
    const interval = setInterval(check, 30_000);
    return () => clearInterval(interval);
  }, [reminderEnabled, reminderTime]);

  return { reminderTime, reminderEnabled, enableReminder, disableReminder };
}
