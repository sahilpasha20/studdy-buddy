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
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(" ");
    fullText += pageText + "\n";
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
  "CIVICS",
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

function extractDatesFromDatesheet(datesheetText: string): Map<string, string> {
  const subjectDateMap = new Map<string, string>();
  const datePattern = /(\d{1,2})\/(\d{1,2})\/(\d{2,4})/g;
  const text = datesheetText.toUpperCase();

  let match;
  while ((match = datePattern.exec(text)) !== null) {
    const [fullMatch, day, month, year] = match;
    const fullYear = year.length === 2 ? `20${year}` : year;
    const isoDate = `${fullYear}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;

    const startIdx = Math.max(0, match.index - 20);
    const endIdx = Math.min(text.length, match.index + fullMatch.length + 300);
    const contextLine = text.substring(startIdx, endIdx);

    for (const subject of KNOWN_SUBJECTS) {
      if (contextLine.includes(subject)) {
        const existing = subjectDateMap.get(subject);
        if (!existing || isoDate < existing) {
          subjectDateMap.set(subject, isoDate);
        }
      }
    }
  }

  return subjectDateMap;
}

function extractSubjectsFromSyllabus(syllabusText: string): Map<string, string[]> {
  const subjectChapters = new Map<string, string[]>();
  const lines = syllabusText.split(/\n/).map(l => l.trim()).filter(l => l.length > 0);

  let currentSubject = "";
  let chapters: string[] = [];
  let currentSection = "";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const upperLine = line.toUpperCase();

    const matchedSubject = KNOWN_SUBJECTS.find(s =>
      upperLine === s ||
      (upperLine.startsWith(s) && upperLine.length < s.length + 5) ||
      (upperLine.includes(s) && !upperLine.includes("PAGE") && upperLine.length < s.length + 15)
    );

    if (matchedSubject) {
      if (currentSubject && chapters.length > 0) {
        subjectChapters.set(currentSubject, [...chapters]);
      }
      currentSubject = matchedSubject;
      chapters = [];
      currentSection = "";
      continue;
    }

    if (!currentSubject) continue;

    const sectionHeaders = ["PROSE", "POETRY", "GRAMMAR", "CHAPTER", "UNIT", "MODULE"];
    const isSection = sectionHeaders.some(s => upperLine === s || upperLine.startsWith(s + " "));
    if (isSection) {
      currentSection = upperLine.split(/\s/)[0];
      continue;
    }

    const skipPatterns = [
      /^TSRS/i,
      /^THE SHRI RAM/i,
      /^FORM\s+[VIX]+/i,
      /^TERM\s+\d/i,
      /^CLUSTER\s+TEST/i,
      /^SYLLABUS/i,
      /^PAGE\s+\d/i,
      /^REFERENCE\s+BOOK/i,
      /^20\d{2}/,
      /^[a-z]\.\s+/i,
    ];

    if (skipPatterns.some(p => p.test(line))) continue;

    const isChapterLine =
      /^\d+[\.\)]\s+/.test(line) ||
      /^[•\-]\s+/.test(line) ||
      (line.length > 5 && line.length < 150 && /^[A-Z]/.test(line) && !KNOWN_SUBJECTS.some(s => upperLine.includes(s)));

    if (isChapterLine) {
      let cleanChapter = line
        .replace(/^\d+[\.\)]\s*/, "")
        .replace(/^[•\-]\s*/, "")
        .trim();

      if (cleanChapter.length > 3 && cleanChapter.length < 150) {
        if (currentSection && !cleanChapter.toLowerCase().includes(currentSection.toLowerCase())) {
          cleanChapter = `${currentSection}: ${cleanChapter}`;
        }
        chapters.push(cleanChapter);
      }
    }
  }

  if (currentSubject && chapters.length > 0) {
    subjectChapters.set(currentSubject, chapters);
  }

  return subjectChapters;
}

function parseSubjectsFromText(syllabusText: string, datesheetText: string) {
  const subjects: Array<{
    name: string;
    chapters: string[];
    examDate: string;
  }> = [];

  const dateMap = extractDatesFromDatesheet(datesheetText);
  const syllabusMap = extractSubjectsFromSyllabus(syllabusText);

  console.log("Date map entries:", Array.from(dateMap.entries()));
  console.log("Syllabus subjects found:", Array.from(syllabusMap.keys()));

  for (const [subjectName, chapters] of syllabusMap.entries()) {
    let examDate = dateMap.get(subjectName) || "";

    if (!examDate) {
      for (const [dateSubject, date] of dateMap.entries()) {
        const subjectWords = subjectName.split(/\s+/);
        const dateWords = dateSubject.split(/\s+/);

        const hasMatch = subjectWords.some(sw =>
          dateWords.some(dw => sw === dw || sw.includes(dw) || dw.includes(sw))
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

    console.log("Syllabus text preview:", syllabusText.substring(0, 1000));
    console.log("Datesheet text preview:", datesheetText.substring(0, 1000));

    const subjects = parseSubjectsFromText(syllabusText, datesheetText);

    console.log("Extracted subjects:", JSON.stringify(subjects, null, 2));

    if (subjects.length === 0) {
      return new Response(
        JSON.stringify({
          error: "Could not extract subjects from PDFs. Please ensure they contain valid syllabus and exam date information.",
          debug: {
            syllabusPreview: syllabusText.substring(0, 1000),
            datesheetPreview: datesheetText.substring(0, 1000)
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
