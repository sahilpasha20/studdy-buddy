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

  const syllabusLines = syllabusText.split("\n").filter((line) => line.trim());
  const datesheetLines = datesheetText.split("\n").filter((line) => line.trim());

  const datePattern = /\d{4}-\d{2}-\d{2}|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/;
  const subjectDateMap = new Map<string, string>();

  for (const line of datesheetLines) {
    const dateMatch = line.match(datePattern);
    if (dateMatch) {
      const datePart = dateMatch[0];
      const subjectPart = line.replace(datePart, "").trim();

      let isoDate = datePart;
      if (datePart.includes("/") || datePart.includes("-")) {
        const parts = datePart.split(/[\/\-]/);
        if (parts.length === 3) {
          const [d, m, y] = parts;
          const year = y.length === 2 ? `20${y}` : y;
          isoDate = `${year}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
        }
      }

      subjectDateMap.set(subjectPart.toLowerCase(), isoDate);
    }
  }

  let currentSubject = "";
  const chapters: string[] = [];

  for (const line of syllabusLines) {
    const lowerLine = line.toLowerCase();

    const isSubjectHeader = line.length < 100 &&
      (line.match(/^[A-Z][a-zA-Z\s]+$/) ||
       line.match(/subject|course|module/i));

    if (isSubjectHeader) {
      if (currentSubject && chapters.length > 0) {
        const subjectLower = currentSubject.toLowerCase();
        let examDate = "";

        for (const [key, date] of subjectDateMap.entries()) {
          if (subjectLower.includes(key) || key.includes(subjectLower)) {
            examDate = date;
            break;
          }
        }

        if (examDate) {
          subjects.push({
            name: currentSubject,
            chapters: [...chapters],
            examDate,
          });
        }
        chapters.length = 0;
      }
      currentSubject = line.trim();
    } else if (currentSubject && line.trim()) {
      const isChapter = line.match(/chapter|unit|topic|section|\d+\./i) ||
                       (line.length > 10 && line.length < 200);

      if (isChapter) {
        chapters.push(line.trim());
      }
    }
  }

  if (currentSubject && chapters.length > 0) {
    const subjectLower = currentSubject.toLowerCase();
    let examDate = "";

    for (const [key, date] of subjectDateMap.entries()) {
      if (subjectLower.includes(key) || key.includes(subjectLower)) {
        examDate = date;
        break;
      }
    }

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

    const subjects = parseSubjectsFromText(syllabusText, datesheetText);

    if (subjects.length === 0) {
      return new Response(
        JSON.stringify({
          error: "Could not extract subjects from PDFs. Please ensure they contain valid syllabus and exam date information."
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
