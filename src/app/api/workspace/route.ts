import { generateTextWithFallback } from '@/lib/ai-provider';

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages, code, language } = await req.json();

    const systemPrompt = `You are CodeMentor AI, an expert programming tutor. 
The user is currently looking at code written in ${language}. 
Here is their current code editor context:
\`\`\`${language}
${code || '// Empty editor'}
\`\`\`
Help them debug, understand, or optimize this code based on their question. 
Be concise, educational, and friendly. Provide code snippets if it helps explain the concept.

CRITICAL RULE:
If the user's current code completely and correctly solves the problem they are working on, you MUST include the exact string "[SOLVED]" at the very end of your response. Only include this if the code is a fully working, correct solution.`;

    const result = await generateTextWithFallback({
      system: systemPrompt,
      messages,
    });

    let text = result.text;
    let isSolved = false;
    if (text.includes('[SOLVED]')) {
      isSolved = true;
      text = text.replace('[SOLVED]', '').trim();
    }

    return Response.json({ text, isSolved });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Workspace AI Error:", error);
    return new Response(JSON.stringify({ error: error.message || "Failed to generate AI response" }), { status: 500 });
  }
}
