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
  "MATH",
  "SCIENCE",
  "HISTORY & CIVICS",
  "HISTORY",
  "CIVICS",
  "GEOGRAPHY",
  "SANSKRIT",
  "FRENCH",
  "SPANISH",
  "COMPUTER STUDIES",
  "COMPUTER",
  "PHYSICS",
  "CHEMISTRY",
  "BIOLOGY",
  "ECONOMICS",
  "PSYCHOLOGY",
  "SOCIOLOGY",
  "COMMERCE",
  "ACCOUNTS",
  "POLITICAL SCIENCE",
  "POL SC",
  "EVS",
  "CS",
  "ART",
  "GROUP III",
];

const GRADE_COLUMN_ORDER = ["6", "7", "8", "9", "11"];

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
    "ENGLISH LITERATURE", "MATH", "MATHEMATICS", "HINDI", "FRENCH", "SPANISH",
    "GEOGRAPHY", "HISTORY & CIVICS", "ENGLISH LANGUAGE", "PHY", "PHYSICS",
    "EVS", "ECO", "ECONOMICS", "CHEMISTRY", "BIOLOGY", "GROUP III", "ART"
  ],
  "11": [
    "MATHEMATICS", "ENGLISH LANGUAGE", "HIST", "HISTORY", "EVS",
    "PHY", "PHYSICS", "COMMERCE", "ENGLISH LITERATURE", "PSYCHOLOGY",
    "CHEM", "CHEMISTRY", "POL SC", "POLITICAL SCIENCE", "GEO", "GEOGRAPHY",
    "ACCOUNTS", "SOCIOLOGY", "ECONOMICS", "BIO", "BIOLOGY", "COMP SC",
    "COMPUTER SCIENCE", "ART"
  ]
};

function normalizeSubjectName(name: string): string {
  const normalizations: Record<string, string> = {
    "MATH": "MATHEMATICS",
    "PHY": "PHYSICS",
    "CHEM": "CHEMISTRY",
    "BIO": "BIOLOGY",
    "GEO": "GEOGRAPHY",
    "HIST": "HISTORY",
    "POL SC": "POLITICAL SCIENCE",
    "COMP SC": "COMPUTER SCIENCE",
    "COMP": "COMPUTER STUDIES",
    "ECO": "ECONOMICS",
    "CS": "COMPUTER STUDIES",
  };
  return normalizations[name] || name;
}

function extractDatesForGrade(datesheetText: string, grade: string): Map<string, string> {
  const subjectDateMap = new Map<string, string>();
  const datePattern = /(\d{1,2})\/(\d{1,2})\/(\d{2,4})/g;
  const text = datesheetText.toUpperCase();
  const allowedSubjects = GRADE_SUBJECT_MAP[grade] || KNOWN_SUBJECTS;

  let match;
  while ((match = datePattern.exec(text)) !== null) {
    const [fullMatch, day, month, year] = match;
    const fullYear = year.length === 2 ? `20${year}` : year;
    const isoDate = `${fullYear}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;

    const startIdx = Math.max(0, match.index - 20);
    const endIdx = Math.min(text.length, match.index + fullMatch.length + 400);
    const contextLine = text.substring(startIdx, endIdx);

    for (const subject of allowedSubjects) {
      if (contextLine.includes(subject)) {
        const normalizedName = normalizeSubjectName(subject);
        const existing = subjectDateMap.get(normalizedName);
        if (!existing || isoDate < existing) {
          subjectDateMap.set(normalizedName, isoDate);
        }
      }
    }
  }

  return subjectDateMap;
}

function extractSubjectsFromSyllabus(syllabusText: string, grade: string): Map<string, string[]> {
  const subjectChapters = new Map<string, string[]>();
  const lines = syllabusText.split(/[\n\r]+/).map(l => l.trim()).filter(l => l.length > 0);
  const allowedSubjects = GRADE_SUBJECT_MAP[grade] || KNOWN_SUBJECTS;

  let currentSubject = "";
  let chapters: string[] = [];
  let currentSection = "";
  let inGrammarSection = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const upperLine = line.toUpperCase();

    const matchedSubject = allowedSubjects.find(s => {
      const upperS = s.toUpperCase();
      return (
        upperLine === upperS ||
        (upperLine.startsWith(upperS) && upperLine.length < upperS.length + 10) ||
        (upperLine.includes(upperS) && !upperLine.includes("PAGE") && upperLine.length < upperS.length + 20)
      );
    });

    if (matchedSubject) {
      if (currentSubject && chapters.length > 0) {
        const normalizedName = normalizeSubjectName(currentSubject);
        subjectChapters.set(normalizedName, [...chapters]);
      }
      currentSubject = matchedSubject.toUpperCase();
      chapters = [];
      currentSection = "";
      inGrammarSection = false;
      continue;
    }

    if (!currentSubject) continue;

    const sectionHeaders = ["PROSE", "POETRY", "GRAMMAR", "CHAPTER", "UNIT", "MODULE", "REFERENCE BOOK"];
    const matchedSection = sectionHeaders.find(s =>
      upperLine === s ||
      upperLine.startsWith(s + " ") ||
      upperLine.startsWith(s + "-")
    );

    if (matchedSection) {
      currentSection = matchedSection;
      inGrammarSection = matchedSection === "GRAMMAR";
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
      /^QUE GUAY/i,
      /^MON PASSEPORT/i,
      /^LESSON\s+\d/i,
    ];

    if (skipPatterns.some(p => p.test(line))) continue;

    if (inGrammarSection) {
      const grammarItemMatch = line.match(/^[a-z][\.\)]\s*(.+)/i);
      if (grammarItemMatch) {
        chapters.push(`Grammar: ${grammarItemMatch[1].trim()}`);
        continue;
      }
    }

    const isChapterLine =
      /^\d+[\.\)]\s+/.test(line) ||
      /^[•\-]\s+/.test(line) ||
      (line.length > 3 && line.length < 150 && /^[A-Z]/.test(line) &&
       !allowedSubjects.some(s => upperLine === s.toUpperCase()));

    if (isChapterLine) {
      let cleanChapter = line
        .replace(/^\d+[\.\)]\s*/, "")
        .replace(/^[•\-]\s*/, "")
        .trim();

      if (cleanChapter.length > 2 && cleanChapter.length < 150) {
        if (currentSection && currentSection !== "GRAMMAR" &&
            !cleanChapter.toLowerCase().includes(currentSection.toLowerCase())) {
          cleanChapter = `${currentSection}: ${cleanChapter}`;
        }
        const isDuplicate = chapters.some(c =>
          c.toLowerCase() === cleanChapter.toLowerCase() ||
          c.toLowerCase().includes(cleanChapter.toLowerCase())
        );
        if (!isDuplicate) {
          chapters.push(cleanChapter);
        }
      }
    }
  }

  if (currentSubject && chapters.length > 0) {
    const normalizedName = normalizeSubjectName(currentSubject);
    subjectChapters.set(normalizedName, chapters);
  }

  return subjectChapters;
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
            sw.length > 2 && dw.length > 2 &&
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
    console.log("Syllabus text preview:", syllabusText.substring(0, 1500));
    console.log("Datesheet text preview:", datesheetText.substring(0, 1500));

    const subjects = parseSubjectsFromText(syllabusText, datesheetText, grade);

    console.log("Extracted subjects:", JSON.stringify(subjects, null, 2));

    if (subjects.length === 0) {
      return new Response(
        JSON.stringify({
          error: "Could not extract subjects from PDFs. Please ensure they contain valid syllabus and exam date information for your selected grade.",
          debug: {
            grade,
            syllabusPreview: syllabusText.substring(0, 1500),
            datesheetPreview: datesheetText.substring(0, 1500)
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
