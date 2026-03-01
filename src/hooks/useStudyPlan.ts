import { useState, useEffect, useCallback } from "react";
import { supabase, getSessionId } from "@/integrations/supabase/client";
import { Subject, DayPlan, DayTask, StudyPace } from "@/lib/planGenerator";
import { toast } from "sonner";

export function useStudyPlan() {
  const [planId, setPlanId] = useState<string | null>(
    () => localStorage.getItem("current-plan-id")
  );
  const [extractedSubjects, setExtractedSubjects] = useState<Subject[]>([]);
  const [plan, setPlan] = useState<DayPlan[] | null>(null);
  const [checkedTasks, setCheckedTasks] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // Load existing plan from DB on mount
  useEffect(() => {
    if (!planId) {
      setLoading(false);
      return;
    }

    const loadPlan = async () => {
      try {
        // Load day tasks
        const { data: tasks, error } = await supabase
          .from("day_tasks")
          .select("*")
          .eq("plan_id", planId)
          .order("date", { ascending: true });

        if (error) throw error;

        if (!tasks || tasks.length === 0) {
          // Plan was deleted or empty
          localStorage.removeItem("current-plan-id");
          setPlanId(null);
          setLoading(false);
          return;
        }

        // Group tasks by date
        const dayMap = new Map<string, DayTask[]>();
        const completed = new Set<string>();

        tasks.forEach((t, i) => {
          const dateStr = t.date;
          if (!dayMap.has(dateStr)) dayMap.set(dateStr, []);
          dayMap.get(dateStr)!.push({
            subject: t.subject,
            chapters: t.chapters,
            type: t.type as "study" | "revision" | "exam",
          });
          if (t.is_completed) {
            completed.add(`${dateStr}-${dayMap.get(dateStr)!.length - 1}`);
          }
        });

        const loadedPlan: DayPlan[] = Array.from(dayMap.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, tasks]) => ({ date, tasks }));

        setPlan(loadedPlan);
        setCheckedTasks(completed);

        // Load subjects too
        const { data: subjects } = await supabase
          .from("subjects")
          .select("*")
          .eq("plan_id", planId);

        if (subjects) {
          setExtractedSubjects(
            subjects.map((s, i) => ({
              id: String(i),
              name: s.name,
              chapters: s.chapters,
              examDate: s.exam_date,
            }))
          );
        }
      } catch (err) {
        console.error("Failed to load plan:", err);
      } finally {
        setLoading(false);
      }
    };

    loadPlan();
  }, [planId]);

  // Save a new plan to DB
  const savePlan = useCallback(
    async (subjects: Subject[], pace: StudyPace, generatedPlan: DayPlan[]) => {
      try {
        const { data: planData, error: planError } = await supabase
          .from("study_plans")
          .insert({
            hours_per_day: pace.hoursPerDay,
            minutes_per_chapter: pace.minutesPerChapter,
            session_id: getSessionId(),
          })
          .select("id")
          .single();

        if (planError) throw planError;
        const newPlanId = planData.id;

        // Save subjects
        const subjectRows = subjects.map((s) => ({
          plan_id: newPlanId,
          name: s.name,
          chapters: s.chapters,
          exam_date: s.examDate,
        }));
        const { error: subError } = await supabase.from("subjects").insert(subjectRows);
        if (subError) throw subError;

        // Save day tasks
        const taskRows: any[] = [];
        generatedPlan.forEach((day) => {
          day.tasks.forEach((task) => {
            taskRows.push({
              plan_id: newPlanId,
              date: day.date,
              subject: task.subject,
              chapters: task.chapters,
              type: task.type,
              is_completed: false,
            });
          });
        });
        const { error: taskError } = await supabase.from("day_tasks").insert(taskRows);
        if (taskError) throw taskError;

        localStorage.setItem("current-plan-id", newPlanId);
        setPlanId(newPlanId);
        setPlan(generatedPlan);
        setExtractedSubjects(subjects);
        setCheckedTasks(new Set());
      } catch (err) {
        console.error("Failed to save plan:", err);
        toast.error("Failed to save plan to database.");
      }
    },
    []
  );

  // Toggle task completion in DB
  const toggleTask = useCallback(
    async (taskKey: string) => {
      if (!planId || !plan) return;

      const [dateStr, indexStr] = taskKey.split(/-(?=\d+$)/);
      const taskIndex = parseInt(indexStr);
      const isNowCompleted = !checkedTasks.has(taskKey);

      // Optimistic update
      setCheckedTasks((prev) => {
        const next = new Set(prev);
        if (next.has(taskKey)) next.delete(taskKey);
        else next.add(taskKey);
        return next;
      });

      // Find the task in DB
      const { data: tasks } = await supabase
        .from("day_tasks")
        .select("id")
        .eq("plan_id", planId)
        .eq("date", dateStr)
        .order("created_at", { ascending: true });

      if (tasks && tasks[taskIndex]) {
        await supabase
          .from("day_tasks")
          .update({ is_completed: isNowCompleted })
          .eq("id", tasks[taskIndex].id);
      }
    },
    [planId, plan, checkedTasks]
  );

  // Save reminder settings to DB
  const saveReminderSettings = useCallback(
    async (time: string, enabled: boolean) => {
      if (!planId) return;
      await supabase
        .from("study_plans")
        .update({ reminder_time: time, reminder_enabled: enabled })
        .eq("id", planId);
    },
    [planId]
  );

  // Reset plan
  const resetPlan = useCallback(() => {
    localStorage.removeItem("current-plan-id");
    setPlanId(null);
    setPlan(null);
    setExtractedSubjects([]);
    setCheckedTasks(new Set());
  }, []);

  return {
    planId,
    extractedSubjects,
    plan,
    checkedTasks,
    loading,
    savePlan,
    toggleTask,
    saveReminderSettings,
    resetPlan,
    setExtractedSubjects,
    setPlan,
  };
}
