import { apiError, apiOk } from "@/lib/api/responses";
import { rateLimit } from "@/lib/api/rateLimit";

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") ?? "local";
  const rl = rateLimit(`discern:${ip}`, 10, 60000);
  if (!rl.allowed) {
    return apiError("Rate limit exceeded", 429);
  }

  try {
    const body = await req.json();
    const trigger = typeof body.trigger === "string" ? body.trigger.trim() : "";
    const fractureId =
      typeof body.fracture_id === "string" ? body.fracture_id.trim() : "";
    const patternLabel =
      typeof body.pattern_label === "string" ? body.pattern_label.trim() : "";

    if (!trigger) return apiError("Trigger is required", 400);
    if (!fractureId) return apiError("Pattern is required", 400);

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return apiError("Service unavailable", 503);

    const systemPrompt = `You are AXIS — a behavioral operating system built on the Reapers of Reality framework.

Your purpose is Reality Discernment: helping operators separate what is actually happening from the story attached to it.

You are not a therapist. You are not a coach. You are not a chatbot.
You are a pattern interruption system. You are direct, grounded, precise, and warm without being soft.

You never use motivational language.
You never use self-help framing.
You never use mystical or theatrical language.
You never flatter the operator.
You never catastrophize.
You speak in plain declarative sentences.

The operator has submitted a situation. You have identified the active pattern.
Your task is to generate situation-specific copy for four sections of the AXIS session.

You must respond with valid JSON only. No preamble. No explanation. No markdown.
Exact format:
{
  "received": "one to three sentences acknowledging the specific pressure in this situation without validating the story attached to it",
  "whatAxisSees": "one to two sentences identifying what the pattern is doing in this specific situation",
  "realityCheck": "two to four sentences separating the observable facts from the interpretation the operator may be running",
  "interruption": "one to three sentences that directly challenge the automatic pattern loop specific to this situation"
}

Rules:
- Every field must be specific to the operator's exact input. Do not use generic pattern copy.
- Received acknowledges the weight without confirming the story.
- What AXIS Sees names what the pattern is doing right now in this situation.
- Reality Check separates facts from story. State what is actually true versus what is being assumed.
- The Interruption challenges the loop directly. It does not comfort. It does not punish. It interrupts.
- Maximum 4 sentences per field.
- No bullet points. No headers. No lists. Plain prose only.
- Do not use the word "journey". Do not use the word "growth". Do not use the word "healing".
- Do not use phrases like "it sounds like" or "I hear that" or "that must be hard".`;

    const userMessage = `Operator situation: "${trigger}"

Detected pattern: ${patternLabel} (${fractureId})

Generate the four AXIS session sections for this specific situation.`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
      }),
    });

    if (!response.ok) {
      return apiError("Discernment service unavailable", 503);
    }

    const data = await response.json();
    const text = data?.content?.[0]?.text ?? "";

    let parsed: {
      received?: string;
      whatAxisSees?: string;
      realityCheck?: string;
      interruption?: string;
    } = {};

    try {
      parsed = JSON.parse(text);
    } catch {
      return apiError("Failed to parse discernment output", 500);
    }

    if (
      !parsed.received ||
      !parsed.whatAxisSees ||
      !parsed.realityCheck ||
      !parsed.interruption
    ) {
      return apiError("Incomplete discernment output", 500);
    }

    return apiOk({
      received: parsed.received,
      whatAxisSees: parsed.whatAxisSees,
      realityCheck: parsed.realityCheck,
      interruption: parsed.interruption,
    });
  } catch (err) {
    return apiError(err instanceof Error ? err.message : "Unknown error", 500);
  }
}

export async function GET() {
  return apiError("Method not allowed", 405);
}

export async function PUT() {
  return apiError("Method not allowed", 405);
}

export async function PATCH() {
  return apiError("Method not allowed", 405);
}

export async function DELETE() {
  return apiError("Method not allowed", 405);
}
