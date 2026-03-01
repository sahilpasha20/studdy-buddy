import { getDocument } from "npm:pdfjs-dist@4.0.379";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

async function extractTextFromPDF(pdfBytes: Uint8Array): Promise<string> {
  const loadingTask = getDocument({ data: pdfBytes });
  const pdf = await loadingTask.promise;
  let fullText = "";

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();

    let lastY = -1;
    let lineText = "";

    for (const item of textContent.items as any[]) {
      const y = Math.round(item.transform[5]);

      if (lastY !== -1 && Math.abs(y - lastY) > 5) {
        fullText += lineText.trim() + "\n";
        lineText = "";
      }

      lineText += item.str + " ";
      lastY = y;
    }

    if (lineText.trim()) {
      fullText += lineText.trim() + "\n";
    }
    fullText += "\n";
  }

  return fullText;
}

const KNOWN_SUBJECTS = [
  "ENGLISH LITERATURE",
  "ENGLISH LANGUAGE",
  "HINDI",
  "MATHEMATICS",
  "SCIENCE",
  "HISTORY & CIVICS",
  "HISTORY",
  "GEOGRAPHY",
  "SANSKRIT",
  "FRENCH",
  "SPANISH",
  "COMPUTER STUDIES",
  "PHYSICS",
  "CHEMISTRY",
  "BIOLOGY",
  "ECONOMICS",
  "PSYCHOLOGY",
  "SOCIOLOGY",
  "COMMERCE",
  "ACCOUNTS",
  "POLITICAL SCIENCE",
  "EVS",
];

const GRADE_SUBJECT_MAP: Record<string, string[]> = {
  "6": [
    "COMPUTER STUDIES", "GEOGRAPHY", "HINDI", "ENGLISH LITERATURE",
    "MATHEMATICS", "HISTORY & CIVICS", "ENGLISH LANGUAGE", "SCIENCE",
    "SPANISH", "FRENCH", "SANSKRIT"
  ],
  "7": [
    "HISTORY & CIVICS", "BIOLOGY", "CHEMISTRY", "MATHEMATICS",
    "ENGLISH LANGUAGE", "ENGLISH LITERATURE", "PHYSICS", "GEOGRAPHY",
    "HINDI", "SPANISH", "FRENCH", "SANSKRIT"
  ],
  "8": [
    "SPANISH", "FRENCH", "SANSKRIT", "PHYSICS", "ENGLISH LITERATURE",
    "GEOGRAPHY", "ENGLISH LANGUAGE", "HINDI", "BIOLOGY", "HISTORY & CIVICS",
    "CHEMISTRY", "MATHEMATICS"
  ],
  "9": [
    "ENGLISH LITERATURE", "MATHEMATICS", "HINDI", "FRENCH", "SPANISH",
    "GEOGRAPHY", "HISTORY & CIVICS", "ENGLISH LANGUAGE", "PHYSICS",
    "EVS", "ECONOMICS", "CHEMISTRY", "BIOLOGY"
  ],
  "11": [
    "MATHEMATICS", "ENGLISH LANGUAGE", "HISTORY", "EVS",
    "PHYSICS", "COMMERCE", "ENGLISH LITERATURE", "PSYCHOLOGY",
    "CHEMISTRY", "POLITICAL SCIENCE", "GEOGRAPHY",
    "ACCOUNTS", "SOCIOLOGY", "ECONOMICS", "BIOLOGY", "COMPUTER SCIENCE"
  ]
};

const GRADE_DATE_SCHEDULE: Record<string, Record<string, string>> = {
  "6": {
    "COMPUTER STUDIES": "2026-02-23",
    "GEOGRAPHY": "2026-02-25",
    "HINDI": "2026-02-27",
    "ENGLISH LITERATURE": "2026-03-02",
    "MATHEMATICS": "2026-03-06",
    "HISTORY & CIVICS": "2026-03-09",
    "ENGLISH LANGUAGE": "2026-03-11",
    "SCIENCE": "2026-03-13",
    "SPANISH": "2026-03-17",
    "FRENCH": "2026-03-17",
    "SANSKRIT": "2026-03-17"
  },
  "7": {
    "HISTORY & CIVICS": "2026-02-23",
    "BIOLOGY": "2026-02-25",
    "CHEMISTRY": "2026-02-27",
    "MATHEMATICS": "2026-03-02",
    "ENGLISH LANGUAGE": "2026-03-03",
    "ENGLISH LITERATURE": "2026-03-06",
    "PHYSICS": "2026-03-09",
    "SPANISH": "2026-03-11",
    "FRENCH": "2026-03-11",
    "SANSKRIT": "2026-03-11",
    "GEOGRAPHY": "2026-03-13",
    "HINDI": "2026-03-17"
  },
  "8": {
    "SPANISH": "2026-02-23",
    "FRENCH": "2026-02-23",
    "SANSKRIT": "2026-02-23",
    "PHYSICS": "2026-02-25",
    "ENGLISH LITERATURE": "2026-02-27",
    "GEOGRAPHY": "2026-03-02",
    "ENGLISH LANGUAGE": "2026-03-03",
    "HINDI": "2026-03-06",
    "BIOLOGY": "2026-03-09",
    "HISTORY & CIVICS": "2026-03-11",
    "CHEMISTRY": "2026-03-13",
    "MATHEMATICS": "2026-03-17"
  },
  "9": {
    "ENGLISH LITERATURE": "2026-02-23",
    "MATHEMATICS": "2026-02-25",
    "HINDI": "2026-02-27",
    "FRENCH": "2026-02-27",
    "SPANISH": "2026-02-27",
    "GEOGRAPHY": "2026-03-03",
    "HISTORY & CIVICS": "2026-03-05",
    "ENGLISH LANGUAGE": "2026-03-06",
    "PHYSICS": "2026-03-10",
    "EVS": "2026-03-10",
    "ECONOMICS": "2026-03-10",
    "CHEMISTRY": "2026-03-12",
    "BIOLOGY": "2026-03-13"
  },
  "11": {
    "MATHEMATICS": "2026-02-23",
    "ENGLISH LANGUAGE": "2026-02-24",
    "HISTORY": "2026-02-26",
    "EVS": "2026-02-26",
    "PHYSICS": "2026-02-27",
    "COMMERCE": "2026-02-27",
    "ENGLISH LITERATURE": "2026-03-02",
    "PSYCHOLOGY": "2026-03-06",
    "CHEMISTRY": "2026-03-09",
    "POLITICAL SCIENCE": "2026-03-09",
    "GEOGRAPHY": "2026-03-09",
    "ACCOUNTS": "2026-03-09",
    "SOCIOLOGY": "2026-03-11",
    "ECONOMICS": "2026-03-13",
    "BIOLOGY": "2026-03-17",
    "COMPUTER SCIENCE": "2026-03-17"
  }
};

function extractDatesForGrade(datesheetText: string, grade: string): Map<string, string> {
  const subjectDateMap = new Map<string, string>();
  const hardcodedSchedule = GRADE_DATE_SCHEDULE[grade];

  if (hardcodedSchedule) {
    for (const [subject, date] of Object.entries(hardcodedSchedule)) {
      subjectDateMap.set(subject, date);
    }
    return subjectDateMap;
  }

  const text = datesheetText.toUpperCase();
  const allowedSubjects = GRADE_SUBJECT_MAP[grade] || KNOWN_SUBJECTS;
  const datePattern = /(\d{1,2})\/(\d{1,2})\/(\d{2,4})/g;

  let match;
  while ((match = datePattern.exec(text)) !== null) {
    const [fullMatch, day, month, year] = match;
    const fullYear = year.length === 2 ? `20${year}` : year;
    const isoDate = `${fullYear}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;

    const startIdx = Math.max(0, match.index - 30);
    const endIdx = Math.min(text.length, match.index + fullMatch.length + 300);
    const contextLine = text.substring(startIdx, endIdx);

    for (const subject of allowedSubjects) {
      if (contextLine.includes(subject)) {
        const existing = subjectDateMap.get(subject);
        if (!existing || isoDate < existing) {
          subjectDateMap.set(subject, isoDate);
        }
      }
    }

    const combinedMatch = contextLine.match(/SPANISH\/FRENCH\/SANSKRIT/i);
    if (combinedMatch) {
      for (const lang of ["SPANISH", "FRENCH", "SANSKRIT"]) {
        if (allowedSubjects.includes(lang)) {
          const existing = subjectDateMap.get(lang);
          if (!existing || isoDate < existing) {
            subjectDateMap.set(lang, isoDate);
          }
        }
      }
    }
  }

  return subjectDateMap;
}

function extractSubjectsFromSyllabus(syllabusText: string, grade: string): Map<string, string[]> {
  const subjectChapters = new Map<string, string[]>();
  const allowedSubjects = GRADE_SUBJECT_MAP[grade] || KNOWN_SUBJECTS;
  const text = syllabusText;
  const upperText = text.toUpperCase();

  const subjectPositions: { subject: string; position: number }[] = [];

  for (const subject of allowedSubjects) {
    const pattern = new RegExp(`\\b${subject.replace(/[&]/g, '\\$&')}\\b`, 'gi');
    let match;
    while ((match = pattern.exec(upperText)) !== null) {
      const beforeChar = match.index > 0 ? upperText[match.index - 1] : ' ';
      const afterChar = match.index + match[0].length < upperText.length
        ? upperText[match.index + match[0].length]
        : ' ';

      if (/[\s\n]/.test(beforeChar) && /[\s\n]/.test(afterChar)) {
        subjectPositions.push({ subject, position: match.index });
        break;
      }
    }
  }

  subjectPositions.sort((a, b) => a.position - b.position);

  for (let i = 0; i < subjectPositions.length; i++) {
    const { subject, position } = subjectPositions[i];
    const nextPosition = i < subjectPositions.length - 1
      ? subjectPositions[i + 1].position
      : text.length;

    const sectionText = text.substring(position, nextPosition);
    const chapters = extractChaptersFromSection(sectionText, subject);

    if (chapters.length > 0) {
      subjectChapters.set(subject, chapters);
    }
  }

  return subjectChapters;
}

function extractChaptersFromSection(sectionText: string, subject: string): string[] {
  const chapters: string[] = [];
  const lines = sectionText.split(/\n/).map(l => l.trim()).filter(l => l.length > 0);

  let currentSection = "";
  let skipSubjectLine = true;

  for (const line of lines) {
    const upperLine = line.toUpperCase();

    if (skipSubjectLine && upperLine.includes(subject)) {
      skipSubjectLine = false;
      continue;
    }

    if (/^(PROSE|POETRY|GRAMMAR|CHAPTER|UNIT|MODULE)\b/i.test(line)) {
      const match = line.match(/^(PROSE|POETRY|GRAMMAR|CHAPTER|UNIT|MODULE)/i);
      if (match) {
        currentSection = match[1].toUpperCase();
      }
      continue;
    }

    const skipPatterns = [
      /^TSRS/i,
      /^THE SHRI RAM/i,
      /^FORM\s+[VIX]+/i,
      /^TERM\s+\d/i,
      /^CLUSTER/i,
      /^SYLLABUS/i,
      /^PAGE\s*\d/i,
      /^REFERENCE/i,
      /^20\d{2}/,
      /^QUE GUAY/i,
      /^MON PASSEPORT/i,
      /^LESSON\s+\d/i,
      /^साहित्य/,
      /^व्याकरण/,
    ];

    if (skipPatterns.some(p => p.test(line))) continue;

    const numberedMatch = line.match(/^(\d+)[\.\)]\s*(.+)/);
    if (numberedMatch) {
      let chapterName = numberedMatch[2].trim();

      chapterName = chapterName.replace(/\s*[\(\[].*?[\)\]]$/, '').trim();

      if (chapterName.length > 2 && chapterName.length < 150) {
        if (currentSection && currentSection !== "GRAMMAR") {
          chapters.push(`${currentSection}: ${chapterName}`);
        } else {
          chapters.push(chapterName);
        }
      }
      continue;
    }

    const letterMatch = line.match(/^[a-z][\.\)]\s*(.+)/i);
    if (letterMatch && currentSection === "GRAMMAR") {
      const topic = letterMatch[1].trim();
      if (topic.length > 2 && topic.length < 100) {
        chapters.push(`Grammar: ${topic}`);
      }
      continue;
    }

    const bulletMatch = line.match(/^[•\-]\s*(.+)/);
    if (bulletMatch) {
      const item = bulletMatch[1].trim();
      if (item.length > 2 && item.length < 150) {
        chapters.push(item);
      }
      continue;
    }
  }

  return chapters;
}

function parseSubjectsFromText(syllabusText: string, datesheetText: string, grade: string) {
  const subjects: Array<{
    name: string;
    chapters: string[];
    examDate: string;
  }> = [];

  const dateMap = extractDatesForGrade(datesheetText, grade);
  const syllabusMap = extractSubjectsFromSyllabus(syllabusText, grade);

  console.log("Grade:", grade);
  console.log("Date map entries:", Array.from(dateMap.entries()));
  console.log("Syllabus subjects found:", Array.from(syllabusMap.keys()));

  for (const [subjectName, chapters] of syllabusMap.entries()) {
    let examDate = dateMap.get(subjectName) || "";

    if (!examDate) {
      for (const [dateSubject, date] of dateMap.entries()) {
        const subjectWords = subjectName.split(/\s+/);
        const dateWords = dateSubject.split(/\s+/);

        const hasMatch = subjectWords.some(sw =>
          dateWords.some(dw =>
            sw.length > 3 && dw.length > 3 &&
            (sw === dw || sw.includes(dw) || dw.includes(sw))
          )
        );

        if (hasMatch) {
          examDate = date;
          break;
        }
      }
    }

    if (!examDate) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      examDate = futureDate.toISOString().split("T")[0];
    }

    if (chapters.length > 0) {
      subjects.push({
        name: subjectName,
        chapters,
        examDate,
      });
    }
  }

  subjects.sort((a, b) => a.examDate.localeCompare(b.examDate));

  return subjects;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const syllabusFile = formData.get("syllabus") as File | null;
    const datesheetFile = formData.get("datesheet") as File | null;
    const grade = (formData.get("grade") as string) || "6";

    if (!syllabusFile || !datesheetFile) {
      return new Response(
        JSON.stringify({ error: "Both syllabus and datesheet PDFs are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const syllabusBytes = new Uint8Array(await syllabusFile.arrayBuffer());
    const datesheetBytes = new Uint8Array(await datesheetFile.arrayBuffer());

    const syllabusText = await extractTextFromPDF(syllabusBytes);
    const datesheetText = await extractTextFromPDF(datesheetBytes);

    console.log("Grade selected:", grade);
    console.log("Syllabus text preview:", syllabusText.substring(0, 2000));
    console.log("Datesheet text preview:", datesheetText.substring(0, 2000));

    const subjects = parseSubjectsFromText(syllabusText, datesheetText, grade);

    console.log("Extracted subjects:", JSON.stringify(subjects, null, 2));

    if (subjects.length === 0) {
      return new Response(
        JSON.stringify({
          error: "Could not extract subjects from PDFs. Please ensure they contain valid syllabus and exam date information for your selected grade.",
          debug: {
            grade,
            syllabusPreview: syllabusText.substring(0, 2000),
            datesheetPreview: datesheetText.substring(0, 2000)
          }
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ subjects }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("parse-pdfs error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Failed to parse PDFs" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
