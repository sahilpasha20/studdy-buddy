import { format, addDays, differenceInDays, isBefore, isSameDay, parseISO } from "date-fns";

export interface Subject {
  id: string;
  name: string;
  chapters: string[];
  examDate: string; // ISO date string
}

export interface DayPlan {
  date: string;
  tasks: DayTask[];
}

export interface DayTask {
  subject: string;
  chapters: string[];
  type: "study" | "revision" | "exam";
}

export function generateStudyPlan(subjects: Subject[]): DayPlan[] {
  if (subjects.length === 0) return [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Sort subjects by exam date (closest first)
  const sorted = [...subjects].sort(
    (a, b) => parseISO(a.examDate).getTime() - parseISO(b.examDate).getTime()
  );

  const lastExamDate = parseISO(sorted[sorted.length - 1].examDate);
  const totalDays = differenceInDays(lastExamDate, today) + 1;
  if (totalDays <= 0) return [];

  // Build the plan
  const planMap = new Map<string, DayTask[]>();

  const initDate = (dateStr: string) => {
    if (!planMap.has(dateStr)) planMap.set(dateStr, []);
  };

  // For each subject, distribute chapters across available days
  for (const subject of sorted) {
    const examDate = parseISO(subject.examDate);
    const daysUntilExam = differenceInDays(examDate, today);
    if (daysUntilExam <= 0) continue;

    // Reserve 1 revision day before exam (day before exam)
    const revisionDate = addDays(examDate, -1);
    const revisionDateStr = format(revisionDate, "yyyy-MM-dd");
    initDate(revisionDateStr);

    // Add revision task
    const existingRevision = planMap.get(revisionDateStr)!;
    existingRevision.push({
      subject: subject.name,
      chapters: [`Revise all ${subject.chapters.length} chapters`],
      type: "revision",
    });

    // Add exam day marker
    const examDateStr = format(examDate, "yyyy-MM-dd");
    initDate(examDateStr);
    planMap.get(examDateStr)!.push({
      subject: subject.name,
      chapters: ["📝 Exam Day"],
      type: "exam",
    });

    // Distribute chapters across study days (today to 2 days before exam)
    const studyEndDate = addDays(examDate, -2);
    const studyDays = Math.max(1, differenceInDays(studyEndDate, today) + 1);
    const chaptersPerDay = Math.ceil(subject.chapters.length / studyDays);

    let chapterIndex = 0;
    for (let d = 0; d < studyDays && chapterIndex < subject.chapters.length; d++) {
      const date = addDays(today, d);
      const dateStr = format(date, "yyyy-MM-dd");
      initDate(dateStr);

      const dayChapters: string[] = [];
      for (let c = 0; c < chaptersPerDay && chapterIndex < subject.chapters.length; c++) {
        dayChapters.push(subject.chapters[chapterIndex]);
        chapterIndex++;
      }

      if (dayChapters.length > 0) {
        planMap.get(dateStr)!.push({
          subject: subject.name,
          chapters: dayChapters,
          type: "study",
        });
      }
    }
  }

  // Convert map to sorted array
  const plan: DayPlan[] = [];
  const entries = Array.from(planMap.entries()).sort();
  for (const [date, tasks] of entries) {
    // Limit to ~3 subjects per day by keeping closest exams
    plan.push({ date, tasks: tasks.slice(0, 4) });
  }

  return plan;
}
