import { generateTextWithFallback } from '@/lib/ai-provider';

export const maxDuration = 30;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const dateStr = url.searchParams.get('date') || new Date().toISOString().split('T')[0];
  const tech = url.searchParams.get('tech') || 'JavaScript';
  const level = url.searchParams.get('level') || 'Beginner';


  try {
    const systemPrompt = `You are CodeMentor AI, an expert at designing coding challenges.
Create a unique, high-quality coding algorithm challenge specifically tailored for a ${level} level developer using ${tech}.
The date is: ${dateStr}.

The challenge should be engaging, appropriate for their ${level} skill level, test core programming concepts, and have clear constraints.

You MUST return your response as a valid JSON object with the following exact structure. Do not wrap it in markdown code blocks, just raw JSON:
{
  "title": "A short, catchy title (e.g., 'Merge Intervals')",
  "difficulty": "Easy", "Medium", or "Hard",
  "description": "A full markdown description of the problem, including the story, input/output formats, and constraints.",
  "examples": [
    { "input": "...", "output": "...", "explanation": "..." }
  ],
  "starterCode": "Write the starter code template strictly in ${tech} syntax here.\\n// Example:\\nfunction solve() {\\n}"
}`;

    const result = await generateTextWithFallback({
      system: systemPrompt,
      prompt: "Generate today's challenge.",
    });

    // Clean up potential markdown formatting from AI output
    const match = result.text.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error("AI failed to generate a valid JSON challenge.");
    }
    
    const challengeData = JSON.parse(match[0]);

    return Response.json(challengeData);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Daily Challenge AI Error:", error);
    return new Response(JSON.stringify({ error: error.message || "Failed to generate AI response due to API Limits." }), { status: 500 });
  }
}
