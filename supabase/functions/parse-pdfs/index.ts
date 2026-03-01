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

function parseSubjectsFromText(syllabusText: string, datesheetText: string) {
  const subjects: Array<{
    name: string;
    chapters: string[];
    examDate: string;
  }> = [];

  const syllabusLines = syllabusText.split("\n").map(l => l.trim()).filter(l => l);
  const datesheetLines = datesheetText.split("\n").map(l => l.trim()).filter(l => l);

  const datePattern = /(\d{1,2}\/\d{1,2}\/\d{2,4})/;
  const subjectDateMap = new Map<string, string>();

  for (const line of datesheetLines) {
    const dateMatch = line.match(datePattern);
    if (!dateMatch) continue;

    const datePart = dateMatch[1];
    const parts = datePart.split("/");

    if (parts.length === 3) {
      let [day, month, year] = parts;
      if (year.length === 2) year = `20${year}`;
      const isoDate = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;

      const beforeDate = line.substring(0, line.indexOf(datePart)).trim();
      const afterDate = line.substring(line.indexOf(datePart) + datePart.length).trim();

      const subjectNames = [beforeDate, afterDate]
        .join(" ")
        .split(/\s+/)
        .filter(s => s.length > 2 && !/monday|tuesday|wednesday|thursday|friday|saturday|sunday/i.test(s));

      for (const subj of subjectNames) {
        const cleanSubj = subj.replace(/[^a-zA-Z\s&]/g, " ").trim().toLowerCase();
        if (cleanSubj.length > 2) {
          subjectDateMap.set(cleanSubj, isoDate);
        }
      }
    }
  }

  const subjectHeaders = [
    "ENGLISH LITERATURE", "ENGLISH LANGUAGE", "HINDI", "MATHEMATICS",
    "SCIENCE", "HISTORY & CIVICS", "HISTORY", "CIVICS", "GEOGRAPHY",
    "SANSKRIT", "FRENCH", "SPANISH", "COMPUTER STUDIES", "PHYSICS",
    "CHEMISTRY", "BIOLOGY"
  ];

  let currentSubject = "";
  let chapters: string[] = [];

  for (let i = 0; i < syllabusLines.length; i++) {
    const line = syllabusLines[i];

    const matchedHeader = subjectHeaders.find(h =>
      line.toUpperCase() === h ||
      (line.toUpperCase().includes(h) && line.length < h.length + 10)
    );

    if (matchedHeader) {
      if (currentSubject && chapters.length > 0) {
        const examDate = findExamDate(currentSubject, subjectDateMap);
        if (examDate) {
          subjects.push({
            name: currentSubject,
            chapters: [...chapters],
            examDate,
          });
        }
      }

      currentSubject = matchedHeader;
      chapters = [];
    } else if (currentSubject) {
      const isChapterLine =
        line.match(/^\d+[\.\)]/i) ||
        (line.length > 10 && line.length < 200 &&
         !line.match(/^(page|form|term|cluster|test|syllabus|prose|poetry|grammar)/i));

      if (isChapterLine) {
        const cleanChapter = line.replace(/^\d+[\.\)]\s*/, "").trim();
        if (cleanChapter.length > 3 && !subjectHeaders.some(h => cleanChapter.toUpperCase().includes(h))) {
          chapters.push(cleanChapter);
        }
      }
    }
  }

  if (currentSubject && chapters.length > 0) {
    const examDate = findExamDate(currentSubject, subjectDateMap);
    if (examDate) {
      subjects.push({
        name: currentSubject,
        chapters: [...chapters],
        examDate,
      });
    }
  }

  return subjects;
}

function findExamDate(subjectName: string, dateMap: Map<string, string>): string {
  const subjectLower = subjectName.toLowerCase().replace(/\s+/g, " ").trim();

  for (const [key, date] of dateMap.entries()) {
    const keyWords = key.split(/\s+/);
    const subjectWords = subjectLower.split(/\s+/);

    const matchCount = keyWords.filter(kw =>
      subjectWords.some(sw => sw.includes(kw) || kw.includes(sw))
    ).length;

    if (matchCount >= Math.min(2, keyWords.length)) {
      return date;
    }
  }

  for (const [key, date] of dateMap.entries()) {
    if (subjectLower.includes(key) || key.includes(subjectLower)) {
      return date;
    }
  }

  return "";
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

    console.log("Syllabus text preview:", syllabusText.substring(0, 500));
    console.log("Datesheet text preview:", datesheetText.substring(0, 500));

    const subjects = parseSubjectsFromText(syllabusText, datesheetText);

    console.log("Extracted subjects:", subjects.length);

    if (subjects.length === 0) {
      return new Response(
        JSON.stringify({
          error: "Could not extract subjects from PDFs. Please ensure they contain valid syllabus and exam date information.",
          debug: {
            syllabusPreview: syllabusText.substring(0, 500),
            datesheetPreview: datesheetText.substring(0, 500)
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
