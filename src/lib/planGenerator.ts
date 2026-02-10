import { format, addDays, differenceInDays, parseISO } from "date-fns";

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

const REVISION_DAYS = 4;

export function generateStudyPlan(subjects: Subject[]): DayPlan[] {
  if (subjects.length === 0) return [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const sorted = [...subjects].sort(
    (a, b) => parseISO(a.examDate).getTime() - parseISO(b.examDate).getTime()
  );

  const planMap = new Map<string, DayTask[]>();
  const blockedDays = new Set<string>(); // days reserved for revision/exam

  const initDate = (dateStr: string) => {
    if (!planMap.has(dateStr)) planMap.set(dateStr, []);
  };

  // First pass: mark exam days and revision days
  for (const subject of sorted) {
    const examDate = parseISO(subject.examDate);
    if (differenceInDays(examDate, today) <= 0) continue;

    const examDateStr = format(examDate, "yyyy-MM-dd");
    initDate(examDateStr);
    planMap.get(examDateStr)!.push({
      subject: subject.name,
      chapters: ["📝 Exam Day"],
      type: "exam",
    });
    blockedDays.add(examDateStr);

    for (let r = 1; r <= REVISION_DAYS; r++) {
      const revDate = addDays(examDate, -r);
      if (differenceInDays(revDate, today) < 0) continue;
      const revDateStr = format(revDate, "yyyy-MM-dd");
      initDate(revDateStr);
      planMap.get(revDateStr)!.push({
        subject: subject.name,
        chapters: [`Revision Day ${REVISION_DAYS - r + 1} — Review all chapters`],
        type: "revision",
      });
      blockedDays.add(revDateStr);
    }
  }

  // Second pass: assign 1 chapter per day across ALL subjects, skipping blocked days
  // Build a queue of (subject, chapter) ordered by exam urgency
  const chapterQueue: { subject: string; chapter: string }[] = [];
  for (const subject of sorted) {
    const examDate = parseISO(subject.examDate);
    if (differenceInDays(examDate, today) <= 0) continue;
    for (const ch of subject.chapters) {
      chapterQueue.push({ subject: subject.name, chapter: ch });
    }
  }

  // Find the last exam date to know our range
  const lastExam = parseISO(sorted[sorted.length - 1].examDate);
  const totalDays = differenceInDays(lastExam, today) + 1;

  let qi = 0;
  for (let d = 0; d < totalDays && qi < chapterQueue.length; d++) {
    const date = addDays(today, d);
    const dateStr = format(date, "yyyy-MM-dd");

    // Skip days that already have revision or exam
    if (blockedDays.has(dateStr)) continue;

    const item = chapterQueue[qi];
    initDate(dateStr);
    planMap.get(dateStr)!.push({
      subject: item.subject,
      chapters: [item.chapter],
      type: "study",
    });
    qi++;
  }

  // If chapters remain, pack them onto the last available days
  while (qi < chapterQueue.length) {
    const item = chapterQueue[qi];
    // Find last non-blocked day
    for (let d = totalDays - 1; d >= 0; d--) {
      const dateStr = format(addDays(today, d), "yyyy-MM-dd");
      if (!blockedDays.has(dateStr)) {
        initDate(dateStr);
        const existing = planMap.get(dateStr)!;
        const existingStudy = existing.find(t => t.subject === item.subject && t.type === "study");
        if (existingStudy) {
          existingStudy.chapters.push(item.chapter);
        } else {
          existing.push({ subject: item.subject, chapters: [item.chapter], type: "study" });
        }
        break;
      }
    }
    qi++;
  }

  // Convert to sorted array
  return Array.from(planMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, tasks]) => ({ date, tasks }));
}
