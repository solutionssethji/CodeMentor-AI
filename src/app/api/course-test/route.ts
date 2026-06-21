import { NextResponse } from 'next/server';
import { generateTextWithFallback } from '@/lib/ai-provider';

export const maxDuration = 45; // Longer duration since it generates 10 questions

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { courseTitle, syllabus, difficulty = "Intermediate" } = body;

    if (!courseTitle || !syllabus) {
      return NextResponse.json({ error: "courseTitle and syllabus are required" }, { status: 400 });
    }

    const systemPrompt = `You are CodeMentor AI, an expert computer science professor and examiner.
Your task is to generate a comprehensive 10-question Multiple Choice Question (MCQ) exam for the course: "${courseTitle}".

Here is the syllabus the student just completed:
${JSON.stringify(syllabus)}

Requirements:
1. Generate exactly 10 high-quality MCQs based on the syllabus topics.
2. The difficulty should be appropriate for a final certification exam (${difficulty} level).
3. Each question MUST have exactly 4 options.
4. Only ONE option can be correct.
5. Provide a short explanation for the correct answer to help the student learn if they fail.

You MUST return your response as a valid JSON object matching this exact structure:
{
  "questions": [
    {
      "id": 1,
      "question": "The question text...",
      "options": [
        "Option A text",
        "Option B text",
        "Option C text",
        "Option D text"
      ],
      "correctAnswerIndex": 2,
      "explanation": "Brief explanation of why this is correct"
    }
  ]
}

CRITICAL RULES FOR JSON OUTPUT:
- DO NOT wrap the response in markdown code blocks. Return ONLY raw JSON text.
- DO NOT include ANY comments (like // or /* */) anywhere in the JSON.
- DO NOT use trailing commas.`;

    const result = await generateTextWithFallback({
      system: systemPrompt,
      prompt: "Generate the 10-question final exam JSON now.",
    });

    // Clean up potential markdown formatting from AI output
    const match = result.text.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error("AI failed to generate a valid JSON test.");
    }
    
    const testData = JSON.parse(match[0]);

    if (!testData.questions || !Array.isArray(testData.questions) || testData.questions.length === 0) {
       throw new Error("AI generated JSON but it is missing the questions array.");
    }

    return NextResponse.json(testData);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Course Test AI Error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate AI exam due to API Limits." }, { status: 500 });
  }
}
