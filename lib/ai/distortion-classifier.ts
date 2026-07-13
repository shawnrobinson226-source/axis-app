import "server-only";

import {
  DistortionClassifierResult,
  sanitizeClassifierResult,
} from "@/lib/kernel/distortion-types";

const OPENAI_API_URL = "https://api.openai.com/v1/responses";

const CLASSIFIER_PROMPT = `
You are the AXIS Distortion Classifier.

Your job is to classify the user's text into exactly one primary distortion class from this locked taxonomy:

- narrative
- emotional
- behavioral
- perceptual
- continuity

Definitions:
- narrative = false or destabilizing internal story, interpretation, or meaning-making
- emotional = disproportionate or overwhelming emotional reaction driving the state
- behavioral = action misalignment, avoidance, compulsion, sabotage, or failure to execute
- perceptual = inaccurate reading of reality, facts, other people, or circumstances
- continuity = drift between stated identity, intention, values, and current behavior over time

Rules:
1. Choose exactly one primary class.
2. Use only the five allowed classes.
3. Do not invent new categories.
4. Do not diagnose.
5. Do not moralize.
6. Do not claim certainty.
7. Treat your output as a suggestion for user confirmation.
8. Prefer the class that is most actionable for the next reduction step.
9. If multiple classes are present, choose the dominant one and list the others as secondary candidates.
10. Base your judgment only on the text provided.

Return only valid JSON matching the schema.
`.trim();

type OpenAIResponsesApiSuccess = {
  output?: Array<{
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
};

function extractOutputText(payload: OpenAIResponsesApiSuccess): string {
  const parts: string[] = [];

  for (const outputItem of payload.output ?? []) {
    for (const contentItem of outputItem.content ?? []) {
      if (contentItem.type === "output_text" && typeof contentItem.text === "string") {
        parts.push(contentItem.text);
      }
    }
  }

  return parts.join("").trim();
}

function buildUserInput(userText: string): string {
  return `
Classify the following user text.

USER_TEXT:
${userText}
  `.trim();
}

export async function classifyDistortionText(
  userText: string,
): Promise<DistortionClassifierResult> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY in environment variables.");
  }

  const trimmed = userText.trim();

  if (!trimmed) {
    throw new Error("Cannot classify empty text.");
  }

  const response = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-5",
      input: buildUserInput(trimmed),
      instructions: CLASSIFIER_PROMPT,
      temperature: 0,
      max_output_tokens: 500,
      text: {
        format: {
          type: "json_schema",
          name: "distortion_classifier_result",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              primary_class: {
                type: "string",
                enum: [
                  "narrative",
                  "emotional",
                  "behavioral",
                  "perceptual",
                  "continuity",
                ],
              },
              confidence: {
                type: "number",
                minimum: 0,
                maximum: 1,
              },
              secondary_candidates: {
                type: "array",
                maxItems: 3,
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    class: {
                      type: "string",
                      enum: [
                        "narrative",
                        "emotional",
                        "behavioral",
                        "perceptual",
                        "continuity",
                      ],
                    },
                    confidence: {
                      type: "number",
                      minimum: 0,
                      maximum: 1,
                    },
                  },
                  required: ["class", "confidence"],
                },
              },
              evidence: {
                type: "array",
                maxItems: 5,
                items: {
                  type: "string",
                },
              },
              reasoning: {
                type: "string",
              },
              user_confirmation_question: {
                type: "string",
              },
            },
            required: [
              "primary_class",
              "confidence",
              "secondary_candidates",
              "evidence",
              "reasoning",
              "user_confirmation_question",
            ],
          },
        },
      },
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Classifier request failed: ${response.status} ${errorText}`);
  }

  const payload = (await response.json()) as OpenAIResponsesApiSuccess;
  const outputText = extractOutputText(payload);

  if (!outputText) {
    throw new Error("Classifier returned empty output.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(outputText);
  } catch {
    throw new Error("Classifier returned invalid JSON.");
  }

  return sanitizeClassifierResult(parsed);
}
