export type DistortionClass =
  | "narrative"
  | "emotional"
  | "behavioral"
  | "perceptual"
  | "continuity";

type ProtocolInput = {
  distortion: DistortionClass;
  situation: string;
  action: string;
};

export function generateProtocolOutput(input: ProtocolInput): string {
  const { distortion, situation, action } = input;

  switch (distortion) {
    case "narrative":
      return `FACTS:
— ${extractFact(situation, 1)}
— ${extractFact(situation, 2)}

DISTORTION:
A constructed narrative is being treated as reality.

REFRAME:
The situation is: ${stripStory(situation)}.`;

    case "emotional":
      return `EMOTION IDENTIFIED:
Emotional signal present.

BEING USED AS PROOF OF:
Assumed meaning derived from feeling.

ACTUAL EVIDENCE:
The situation itself does not confirm the emotional conclusion.

SIGNAL CHECK:
Emotion is not sufficient evidence.`;

    case "behavioral":
      return `PATTERN IDENTIFIED:
Repeated avoidance or misaligned action.

FUNCTION OF PATTERN:
Avoiding discomfort of direct execution.

PATTERN INTERRUPT:
${action}`;

    case "perceptual":
      return `LOCKED ONTO:
A narrow interpretation of the situation.

MISSING FROM VIEW:
Alternative interpretations and broader context.

FRAME EXPANDERS:
— What is being ignored?
— What else could be true?
— What would an external observer say?`;

    case "continuity":
      return `ACCOUNTABILITY STATEMENT:
I will ${action} within 24 hours.

WHAT DOING THIS ENDS:
The loop of knowing and not acting.

THE COST OF NOT DOING IT:
The pattern continues unchanged.`;

    default:
      return "Execute the stated action.";
  }
}

function extractFact(input: string, index: number): string {
  const parts = input
    .split(".")
    .map((part) => part.trim())
    .filter(Boolean);
  return parts[index - 1] || parts[0] || "No clear fact provided.";
}

function stripStory(input: string): string {
  return input.replace(/I feel|I think|maybe|probably/gi, "").trim();
}
