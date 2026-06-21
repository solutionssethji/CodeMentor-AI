import { generateTextWithFallback } from '@/lib/ai-provider';

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages, role, difficulty, language, experienceLevel, technologies, interviewType, duration } = await req.json();

    // Map duration to a number of questions
    let questionLimit = 4;
    if (duration === "10 min") questionLimit = 3;
    if (duration === "20 min") questionLimit = 5;
    if (duration === "30 min") questionLimit = 8;
    if (duration === "60 min") questionLimit = 15;

    // Define instructions based on interview type
    let typeInstructions = "";
    if (interviewType === "HR" || interviewType === "Behavioral") {
      typeInstructions = `Focus EXCLUSIVELY on behavioral, cultural fit, and past experience questions using the STAR method. DO NOT ask for code snippets or algorithms.`;
    } else if (interviewType === "System Design") {
      typeInstructions = `Focus on high-level architecture, scalability, system design, data modeling, and trade-offs. Ask the user to describe architectures.`;
    } else if (interviewType === "Technical") {
      typeInstructions = `Focus strictly on deep technical coding questions, algorithms, data structures, and core concepts. If they submit code, evaluate its correctness, time/space complexity, and readability. Ask them to optimize it if there is a better approach.`;
    } else {
      typeInstructions = `Ask a mixed variety of technical coding questions, architecture questions, and behavioral questions.`;
    }

    const techString = technologies ? technologies : language || "their tech stack";

    const systemPrompt = `You are an expert interviewer named Alex conducting a ${interviewType} mock interview for a ${difficulty} level ${role} position. 
The candidate has ${experienceLevel} of experience.
Their key technologies are: ${techString}.

Your goal is to conduct a realistic, engaging, and challenging interview tailored to this specific profile.
Follow these rules:
1. Start your very first message by saying exactly: "Hi there! I'm Alex, and I'll be your interviewer today. It's great to meet you." followed by your first interview question.
2. ${typeInstructions}
3. The user will provide answers via text or submitted code snippets.
4. Review their answers and provide brief, constructive feedback before moving to the next topic.
5. Ask follow-up questions ONE AT A TIME. Do not ask multiple questions in a single response.
6. Keep your responses concise and conversational, just like a real interview.
7. Progress the interview naturally through different relevant topics.
8. If the user asks for a hint, provide a small hint without giving away the full answer.
9. Conclude the interview after you have asked exactly ${questionLimit} questions. Thank the user, provide a final overall summary of their performance. 
10. IMPORTANT: On your final concluding message, you MUST append the exact string "[INTERVIEW_CONCLUDED]" at the very end of your response. Do not use this string until the interview is completely over.`;

    // Strip out custom UI fields like isHidden so the AI SDK doesn't throw a validation error
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cleanMessages = messages.map((m: any) => ({
      role: m.role,
      content: m.content
    }));

    const result = await generateTextWithFallback({
      system: systemPrompt,
      messages: cleanMessages,
    });

    return Response.json({ text: result.text });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Error in interview API:', error);
    return new Response(JSON.stringify({ error: error.message || 'Failed to process interview request' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
