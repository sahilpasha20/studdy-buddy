import { DayPlan } from "@/lib/planGenerator";
import { format, parseISO, isToday, isTomorrow } from "date-fns";
import { motion } from "framer-motion";
import { BookOpen, RefreshCw, FileText, ArrowLeft, Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";

interface StudyPlanViewProps {
  plan: DayPlan[];
  onReset: () => void;
  reminder: {
    reminderTime: string;
    reminderEnabled: boolean;
    enableReminder: (time: string) => void;
    disableReminder: () => void;
  };
  checkedTasks: Set<string>;
  onToggleTask: (taskKey: string) => void;
  onReminderChange: (time: string, enabled: boolean) => void;
}

const typeConfig = {
  study: {
    icon: BookOpen,
    label: "Study",
    bg: "bg-study/10",
    text: "text-study",
    border: "border-study/20",
    dot: "bg-study",
  },
  revision: {
    icon: RefreshCw,
    label: "Revision",
    bg: "bg-revision/10",
    text: "text-revision",
    border: "border-revision/20",
    dot: "bg-revision",
  },
  exam: {
    icon: FileText,
    label: "Exam",
    bg: "bg-exam/10",
    text: "text-exam",
    border: "border-exam/20",
    dot: "bg-exam",
  },
};

const StudyPlanView = ({ plan, onReset, reminder, checkedTasks, onToggleTask, onReminderChange }: StudyPlanViewProps) => {
  const { reminderTime, reminderEnabled, enableReminder, disableReminder } = reminder;

  const handleReminderTimeChange = (time: string) => {
    enableReminder(time);
    onReminderChange(time, true);
  };

  const handleDisableReminder = () => {
    disableReminder();
    onReminderChange("", false);
  };

  const getDateLabel = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "EEEE");
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <Button variant="ghost" onClick={onReset} className="text-muted-foreground">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Start Over
        </Button>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          {Object.entries(typeConfig).map(([key, cfg]) => (
            <span key={key} className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
              {cfg.label}
            </span>
          ))}
        </div>
      </div>

      {/* Reminder Card */}
      <Card className="p-4 border-border/60 bg-card shadow-sm mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {reminderEnabled ? (
              <Bell className="w-4 h-4 text-primary" />
            ) : (
              <BellOff className="w-4 h-4 text-muted-foreground" />
            )}
            <span className="text-sm font-medium text-foreground">
              Daily Study Reminder
            </span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="time"
              value={reminderTime}
              onChange={(e) => {
                if (e.target.value) handleReminderTimeChange(e.target.value);
              }}
              className="text-sm border border-input rounded-md px-2 py-1 bg-background text-foreground"
            />
            {reminderEnabled && (
              <Button variant="ghost" size="sm" onClick={handleDisableReminder}>
                <BellOff className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>
        {reminderEnabled && (
          <p className="text-xs text-muted-foreground mt-2">
            You'll get a notification at {reminderTime} every day reminding you to study 🔔
          </p>
        )}
      </Card>

      <div className="relative">
        <div className="absolute left-[19px] top-0 bottom-0 w-px bg-border" />

        <div className="space-y-1">
          {plan.map((day, dayIndex) => (
            <motion.div
              key={day.date}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: dayIndex * 0.03, duration: 0.3 }}
              className="relative pl-12"
            >
              <div className="absolute left-[15px] top-3 w-[9px] h-[9px] rounded-full bg-primary border-2 border-background z-10" />

              <div className="pb-4">
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="font-display text-lg text-foreground">
                    {getDateLabel(day.date)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {format(parseISO(day.date), "MMM d, yyyy")}
                  </span>
                </div>

                <div className="space-y-2">
                  {day.tasks.map((task, taskIndex) => {
                    const cfg = typeConfig[task.type];
                    const Icon = cfg.icon;
                    const taskKey = `${day.date}-${taskIndex}`;
                    const isDone = checkedTasks.has(taskKey);
                    return (
                      <div
                        key={taskIndex}
                        className={`rounded-lg border ${cfg.border} ${cfg.bg} px-4 py-3 cursor-pointer transition-opacity ${isDone ? "opacity-50" : ""}`}
                        onClick={() => onToggleTask(taskKey)}
                      >
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={isDone}
                            onCheckedChange={() => onToggleTask(taskKey)}
                            onClick={(e) => e.stopPropagation()}
                            className="mt-0.5"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Icon className={`w-3.5 h-3.5 ${cfg.text}`} />
                              <span className={`text-sm font-semibold ${cfg.text} ${isDone ? "line-through" : ""}`}>
                                {task.subject}
                              </span>
                              <span className={`text-[10px] uppercase tracking-wider font-medium ${cfg.text} opacity-60`}>
                                {cfg.label}
                              </span>
                            </div>
                            <div className={`text-sm text-foreground/80 pl-5 ${isDone ? "line-through" : ""}`}>
                              {task.chapters.join(" · ")}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StudyPlanView;
