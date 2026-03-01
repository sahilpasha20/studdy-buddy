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

  const datePattern = /\b(\d{4}[-\/]\d{1,2}[-\/]\d{1,2}|\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})\b/;
  const subjectDateMap = new Map<string, string>();

  for (let i = 0; i < datesheetLines.length; i++) {
    const line = datesheetLines[i];
    const dateMatch = line.match(datePattern);

    if (dateMatch) {
      const datePart = dateMatch[1];
      let subjectPart = line.replace(datePart, "").trim();

      subjectPart = subjectPart.replace(/[:\-\|]/g, " ").trim();

      let isoDate = datePart;
      const parts = datePart.split(/[\/\-]/);
      if (parts.length === 3) {
        let [first, second, third] = parts;

        if (first.length === 4) {
          isoDate = `${first}-${second.padStart(2, "0")}-${third.padStart(2, "0")}`;
        } else {
          const year = third.length === 2 ? `20${third}` : third;
          isoDate = `${year}-${second.padStart(2, "0")}-${first.padStart(2, "0")}`;
        }
      }

      if (subjectPart.length > 2) {
        const cleanSubject = subjectPart.replace(/\s+/g, " ").toLowerCase();
        subjectDateMap.set(cleanSubject, isoDate);
      }
    } else {
      if (i + 1 < datesheetLines.length) {
        const nextLine = datesheetLines[i + 1];
        const nextDateMatch = nextLine.match(datePattern);

        if (nextDateMatch && line.length > 2 && line.length < 150) {
          const datePart = nextDateMatch[1];
          const parts = datePart.split(/[\/\-]/);
          let isoDate = datePart;

          if (parts.length === 3) {
            let [first, second, third] = parts;
            if (first.length === 4) {
              isoDate = `${first}-${second.padStart(2, "0")}-${third.padStart(2, "0")}`;
            } else {
              const year = third.length === 2 ? `20${third}` : third;
              isoDate = `${year}-${second.padStart(2, "0")}-${first.padStart(2, "0")}`;
            }
          }

          const cleanSubject = line.replace(/[:\-\|]/g, " ").replace(/\s+/g, " ").trim().toLowerCase();
          subjectDateMap.set(cleanSubject, isoDate);
        }
      }
    }
  }

  let currentSubject = "";
  const chapters: string[] = [];
  let inSubjectSection = false;

  for (let i = 0; i < syllabusLines.length; i++) {
    const line = syllabusLines[i];
    const nextLine = i + 1 < syllabusLines.length ? syllabusLines[i + 1] : "";

    const isPotentialSubject =
      (line.length > 3 && line.length < 150) &&
      (line.match(/^[A-Z]/) || line.match(/^\d+[\.\)]/)) &&
      !line.match(/^(chapter|unit|topic|section|page|contents?|syllabus)\s/i);

    const hasChapterIndicators =
      nextLine.match(/chapter|unit|topic|section|module|\d+\.\d+/i) ||
      (chapters.length > 0 && line.match(/chapter|unit|topic|section|module|\d+\.\d+/i));

    if (isPotentialSubject && (hasChapterIndicators || inSubjectSection)) {
      if (currentSubject && chapters.length > 0) {
        const examDate = findExamDate(currentSubject, subjectDateMap);

        if (examDate) {
          subjects.push({
            name: currentSubject,
            chapters: [...chapters],
            examDate,
          });
        }
        chapters.length = 0;
      }

      currentSubject = line.replace(/^\d+[\.\)]\s*/, "").trim();
      inSubjectSection = true;
    } else if (currentSubject && line.length > 5) {
      const isChapter =
        line.match(/^\d+[\.\)]/i) ||
        line.match(/chapter|unit|topic|section|module/i) ||
        line.match(/^\d+\.\d+/) ||
        (line.length > 10 && line.length < 300 && !line.match(/^(page|contents?|syllabus)\s/i));

      if (isChapter) {
        const cleanChapter = line.replace(/^\d+[\.\)]\s*/, "").trim();
        if (cleanChapter.length > 3) {
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
