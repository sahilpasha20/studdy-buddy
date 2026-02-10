import { format, addDays, differenceInDays, parseISO } from "date-fns";

export interface Subject {
  id: string;
  name: string;
  chapters: string[];
  examDate: string;
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

const REVISION_DAYS = 4;

export function generateStudyPlan(subjects: Subject[]): DayPlan[] {
  if (subjects.length === 0) return [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const sorted = [...subjects]
    .filter((s) => differenceInDays(parseISO(s.examDate), today) > 0)
    .sort((a, b) => parseISO(a.examDate).getTime() - parseISO(b.examDate).getTime());

  if (sorted.length === 0) return [];

  const lastExam = parseISO(sorted[sorted.length - 1].examDate);
  const totalDays = differenceInDays(lastExam, today) + 1;

  // Each day gets exactly ONE task
  const daySlots = new Map<string, DayTask>();

  // 1) Reserve exam days first (highest priority)
  for (const subject of sorted) {
    const dateStr = format(parseISO(subject.examDate), "yyyy-MM-dd");
    // If two exams on same day, only first gets shown — but that's rare
    if (!daySlots.has(dateStr)) {
      daySlots.set(dateStr, {
        subject: subject.name,
        chapters: ["📝 Exam Day"],
        type: "exam",
      });
    }
  }

  // 2) Reserve revision days (4 days before each exam)
  for (const subject of sorted) {
    const examDate = parseISO(subject.examDate);
    for (let r = 1; r <= REVISION_DAYS; r++) {
      const revDate = addDays(examDate, -r);
      if (differenceInDays(revDate, today) < 0) continue;
      const dateStr = format(revDate, "yyyy-MM-dd");
      if (!daySlots.has(dateStr)) {
        daySlots.set(dateStr, {
          subject: subject.name,
          chapters: [`Revision Day ${REVISION_DAYS - r + 1} — Review all chapters`],
          type: "revision",
        });
      }
    }
  }

  // 3) Build study queue: 1 chapter each, ordered by exam urgency
  const chapterQueue: { subject: string; chapter: string }[] = [];
  for (const subject of sorted) {
    for (const ch of subject.chapters) {
      chapterQueue.push({ subject: subject.name, chapter: ch });
    }
  }

  // 4) Fill remaining open days with 1 chapter each
  let qi = 0;
  for (let d = 0; d < totalDays && qi < chapterQueue.length; d++) {
    const dateStr = format(addDays(today, d), "yyyy-MM-dd");
    if (daySlots.has(dateStr)) continue;

    daySlots.set(dateStr, {
      subject: chapterQueue[qi].subject,
      chapters: [chapterQueue[qi].chapter],
      type: "study",
    });
    qi++;
  }

  // Convert to sorted array — each day has exactly 1 task
  return Array.from(daySlots.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, task]) => ({ date, tasks: [task] }));
}
