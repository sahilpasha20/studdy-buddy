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

  // Sort subjects by exam date (closest first)
  const sorted = [...subjects].sort(
    (a, b) => parseISO(a.examDate).getTime() - parseISO(b.examDate).getTime()
  );

  const planMap = new Map<string, DayTask[]>();

  const initDate = (dateStr: string) => {
    if (!planMap.has(dateStr)) planMap.set(dateStr, []);
  };

  for (const subject of sorted) {
    const examDate = parseISO(subject.examDate);
    const daysUntilExam = differenceInDays(examDate, today);
    if (daysUntilExam <= 0) continue;

    // Exam day marker
    const examDateStr = format(examDate, "yyyy-MM-dd");
    initDate(examDateStr);
    planMap.get(examDateStr)!.push({
      subject: subject.name,
      chapters: ["📝 Exam Day"],
      type: "exam",
    });

    // 4-day revision period before exam
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
    }

    // Study: 1 chapter per day, starting from today, ending before revision period
    const studyEndDate = addDays(examDate, -(REVISION_DAYS + 1));
    let currentDay = 0;

    for (let ci = 0; ci < subject.chapters.length; ci++) {
      let dateCandidate = addDays(today, currentDay);

      // Skip past the study end date — can't fit, stop
      if (differenceInDays(dateCandidate, studyEndDate) > 0) {
        // If we run out of days, pack remaining into last available day
        const lastDateStr = format(studyEndDate, "yyyy-MM-dd");
        initDate(lastDateStr);
        const existing = planMap.get(lastDateStr)!;
        const existingStudy = existing.find(
          (t) => t.subject === subject.name && t.type === "study"
        );
        if (existingStudy) {
          existingStudy.chapters.push(subject.chapters[ci]);
        } else {
          existing.push({
            subject: subject.name,
            chapters: [subject.chapters[ci]],
            type: "study",
          });
        }
        continue;
      }

      const dateStr = format(dateCandidate, "yyyy-MM-dd");
      initDate(dateStr);
      planMap.get(dateStr)!.push({
        subject: subject.name,
        chapters: [subject.chapters[ci]],
        type: "study",
      });
      currentDay++;
    }
  }

  // Convert map to sorted array
  const plan: DayPlan[] = [];
  const entries = Array.from(planMap.entries()).sort();
  for (const [date, tasks] of entries) {
    plan.push({ date, tasks });
  }

  return plan;
}
