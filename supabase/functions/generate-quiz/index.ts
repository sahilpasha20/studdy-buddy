import Anthropic from "npm:@anthropic-ai/sdk@0.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface MCQQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface ShortLongQuestion {
  question: string;
  type: "short" | "long";
  sampleAnswer: string;
}

async function fileToBase64(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const quizType = (formData.get("quizType") as string) || "mcq";
    const difficulty = (formData.get("difficulty") as string) || "medium";
    const chapterName = (formData.get("chapterName") as string) || "Chapter";
    const subjectName = (formData.get("subjectName") as string) || "Subject";

    const images: File[] = [];
    for (const [key, value] of formData.entries()) {
      if (key.startsWith("image") && value instanceof File) {
        images.push(value);
      }
    }

    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");

    if (!anthropicKey || images.length === 0) {
      return new Response(
        JSON.stringify({ error: "Anthropic API key or images missing" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const client = new Anthropic({ apiKey: anthropicKey });

    const imageContents: Anthropic.ImageBlockParam[] = await Promise.all(
      images.map(async (img) => {
        const base64 = await fileToBase64(img);
        const mediaType = img.type as "image/jpeg" | "image/png" | "image/gif" | "image/webp";
        return {
          type: "image" as const,
          source: {
            type: "base64" as const,
            media_type: mediaType,
            data: base64,
          },
        };
      })
    );

    const difficultyDescriptions: Record<string, string> = {
      easy: "basic recall and straightforward concepts - questions a student should be able to answer after a first read",
      medium: "application and understanding - questions that require applying concepts and making connections",
      hard: "analysis and critical thinking - challenging questions that require deep understanding and synthesis",
    };

    const difficultyDesc = difficultyDescriptions[difficulty] || difficultyDescriptions.medium;

    let prompt: string;
    let result: { mcqQuestions?: MCQQuestion[]; shortLongQuestions?: ShortLongQuestion[] };

    if (quizType === "mcq") {
      prompt = `You are an expert teacher creating exam questions. Analyze the uploaded chapter pages from "${chapterName}" (${subjectName}) and generate exactly 12 multiple choice questions based ONLY on the content visible in these images.

Difficulty level: ${difficulty.toUpperCase()} - ${difficultyDesc}

Rules:
- Questions must be directly based on content from the images
- Each question must have exactly 4 answer options (A, B, C, D)
- Only one option should be correct
- Include a brief explanation for the correct answer
- All 12 questions should match the ${difficulty} difficulty level
- Cover different parts of the chapter content

Respond with ONLY valid JSON in this exact format, no markdown, no extra text:
{
  "mcqQuestions": [
    {
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Brief explanation of why this answer is correct."
    }
  ]
}`;

      const response = await client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        messages: [
          {
            role: "user",
            content: [...imageContents, { type: "text", text: prompt }],
          },
        ],
      });

      const rawText = response.content[0].type === "text" ? response.content[0].text : "";
      let parsed: { mcqQuestions: MCQQuestion[] };
      try {
        parsed = JSON.parse(rawText);
      } catch {
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error("Could not parse quiz response from AI");
        }
        parsed = JSON.parse(jsonMatch[0]);
      }
      result = { mcqQuestions: parsed.mcqQuestions };

    } else {
      prompt = `You are an expert teacher creating exam questions. Analyze the uploaded chapter pages from "${chapterName}" (${subjectName}) and generate exactly 10 short and long answer questions based ONLY on the content visible in these images.

Difficulty level: ${difficulty.toUpperCase()} - ${difficultyDesc}

Rules:
- Questions must be directly based on content from the images
- Generate a mix of short answer (1-2 sentences) and long answer (paragraph) questions
- Include a sample answer for each question
- All questions should match the ${difficulty} difficulty level
- Cover different parts of the chapter content
- Aim for about 6 short and 4 long answer questions

Respond with ONLY valid JSON in this exact format, no markdown, no extra text:
{
  "shortLongQuestions": [
    {
      "question": "Question text here?",
      "type": "short",
      "sampleAnswer": "A brief 1-2 sentence sample answer."
    },
    {
      "question": "Question text here?",
      "type": "long",
      "sampleAnswer": "A detailed paragraph-length sample answer explaining the concept thoroughly."
    }
  ]
}`;

      const response = await client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        messages: [
          {
            role: "user",
            content: [...imageContents, { type: "text", text: prompt }],
          },
        ],
      });

      const rawText = response.content[0].type === "text" ? response.content[0].text : "";
      let parsed: { shortLongQuestions: ShortLongQuestion[] };
      try {
        parsed = JSON.parse(rawText);
      } catch {
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error("Could not parse quiz response from AI");
        }
        parsed = JSON.parse(jsonMatch[0]);
      }
      result = { shortLongQuestions: parsed.shortLongQuestions };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-quiz error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Failed to generate quiz" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
