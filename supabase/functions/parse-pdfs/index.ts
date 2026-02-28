const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

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

    // Read files as base64 for the AI
    const syllabusBytes = new Uint8Array(await syllabusFile.arrayBuffer());
    const datesheetBytes = new Uint8Array(await datesheetFile.arrayBuffer());
    const syllabusB64 = btoa(String.fromCharCode(...syllabusBytes));
    const datesheetB64 = btoa(String.fromCharCode(...datesheetBytes));

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `You are a study planner assistant. You will receive two PDF documents:
1. A syllabus - containing subjects and their chapters/topics
2. A datesheet - containing exam dates for each subject

Extract and return ONLY valid JSON (no markdown, no code fences) with this exact structure:
{
  "subjects": [
    {
      "name": "Subject Name",
      "chapters": ["Chapter 1 name", "Chapter 2 name", ...],
      "examDate": "YYYY-MM-DD"
    }
  ]
}

Rules:
- Match each subject from the syllabus with its exam date from the datesheet
- List ALL chapters/topics for each subject
- Use ISO date format (YYYY-MM-DD) for exam dates
- If a subject appears in the syllabus but not the datesheet, skip it
- Keep chapter names concise but descriptive
- Return ONLY the JSON object, nothing else`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Here are my two PDFs. The first is my syllabus and the second is my datesheet/exam schedule. Please extract all subjects, their chapters, and exam dates.",
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:application/pdf;base64,${syllabusB64}`,
                  },
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:application/pdf;base64,${datesheetB64}`,
                  },
                },
              ],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI usage limit reached. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      throw new Error("AI gateway error");
    }

    const aiResult = await response.json();
    let content = aiResult.choices?.[0]?.message?.content || "";
    
    // Clean up potential markdown fences
    content = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    
    const parsed = JSON.parse(content);

    return new Response(JSON.stringify(parsed), {
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
