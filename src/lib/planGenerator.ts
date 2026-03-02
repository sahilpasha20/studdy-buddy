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

export interface StudyPace {
  minutesPerChapter: number;
  hoursPerDay: number;
}

const REVISION_DAYS = 4;

export function generateStudyPlan(subjects: Subject[], pace: StudyPace): DayPlan[] {
  if (subjects.length === 0) return [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const sorted = [...subjects]
    .filter((s) => differenceInDays(parseISO(s.examDate), today) > 0)
    .sort((a, b) => parseISO(a.examDate).getTime() - parseISO(b.examDate).getTime());

  if (sorted.length === 0) return [];

  const lastExam = parseISO(sorted[sorted.length - 1].examDate);
  const totalDays = differenceInDays(lastExam, today) + 1;

  const chaptersPerDay = Math.max(1, Math.floor((pace.hoursPerDay * 60) / pace.minutesPerChapter));

  const daySlots = new Map<string, DayTask[]>();

  const examsByDate = new Map<string, string[]>();
  for (const subject of sorted) {
    const dateStr = format(parseISO(subject.examDate), "yyyy-MM-dd");
    if (!examsByDate.has(dateStr)) {
      examsByDate.set(dateStr, []);
    }
    examsByDate.get(dateStr)!.push(subject.name);
  }

  for (const [dateStr, subjectNames] of examsByDate.entries()) {
    const combinedSubject = subjectNames.join(", ");
    daySlots.set(dateStr, [{
      subject: combinedSubject,
      chapters: ["Exam Day"],
      type: "exam" as const,
    }]);
  }

  const revisionsByDate = new Map<string, string[]>();
  for (const subject of sorted) {
    const examDate = parseISO(subject.examDate);
    for (let r = 1; r <= REVISION_DAYS; r++) {
      const revDate = addDays(examDate, -r);
      if (differenceInDays(revDate, today) < 0) continue;
      const dateStr = format(revDate, "yyyy-MM-dd");
      if (daySlots.has(dateStr)) continue;
      if (!revisionsByDate.has(dateStr)) {
        revisionsByDate.set(dateStr, []);
      }
      if (!revisionsByDate.get(dateStr)!.includes(subject.name)) {
        revisionsByDate.get(dateStr)!.push(subject.name);
      }
    }
  }

  for (const [dateStr, subjectNames] of revisionsByDate.entries()) {
    if (!daySlots.has(dateStr)) {
      const combinedSubject = subjectNames.join(", ");
      daySlots.set(dateStr, [{
        subject: combinedSubject,
        chapters: [`Revision — Review all chapters`],
        type: "revision" as const,
      }]);
    }
  }

  const chapterQueue: { subject: string; chapter: string }[] = [];
  for (const subject of sorted) {
    for (const ch of subject.chapters) {
      chapterQueue.push({ subject: subject.name, chapter: ch });
    }
  }

  let qi = 0;
  for (let d = 0; d < totalDays && qi < chapterQueue.length; d++) {
    const dateStr = format(addDays(today, d), "yyyy-MM-dd");
    if (daySlots.has(dateStr)) continue;

    const dayChapters: string[] = [];
    const subjectName = chapterQueue[qi].subject;
    for (let c = 0; c < chaptersPerDay && qi < chapterQueue.length; c++) {
      dayChapters.push(chapterQueue[qi].chapter);
      qi++;
    }

    daySlots.set(dateStr, [{
      subject: subjectName,
      chapters: dayChapters,
      type: "study",
    }]);
  }

  return Array.from(daySlots.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, tasks]) => ({ date, tasks }));
}
