export type DistortionClass =
  | "narrative"
  | "emotional"
  | "behavioral"
  | "perceptual"
  | "continuity";

export type SessionOutcome = "reduced" | "unresolved" | "escalated";

export type SessionInput = {
  trigger: string;
  distortionClass: DistortionClass;
  origin: string;
  thought: string;
  emotion: string;
  behavior: string;
  protocol: string;
  nextAction: string;
  clarityRating: number;
  outcome: SessionOutcome;
};

export type SessionEngineResult = {
  fracture: {
    type: DistortionClass;
    originDescription: string;
    triggerDescription: string;
  };
  distortion: {
    class: DistortionClass;
    description: string;
    currentEffect: string;
    severity: number;
    status: "active" | "reduced" | "unresolved";
  };
  session: {
    stepsCompleted: number;
    outcome: SessionOutcome;
    exitStateClarityRating: number;
  };
  continuityDelta: {
    perception: number;
    identity: number;
    intention: number;
    action: number;
  };
  lessonLine: string;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function mapSeverity(clarityRating: number, outcome: SessionOutcome): number {
  const base = 10 - clarityRating;

  if (outcome === "escalated") return clamp(base + 2, 1, 10);
  if (outcome === "unresolved") return clamp(base + 1, 1, 10);
  return clamp(base, 1, 10);
}

function getCurrentEffect(
  distortionClass: DistortionClass,
  thought: string,
  emotion: string,
  behavior: string,
): string {
  switch (distortionClass) {
    case "narrative":
      return `Story distortion active: ${thought}`;
    case "emotional":
      return `Emotional overload active: ${emotion}`;
    case "behavioral":
      return `Behavior drift active: ${behavior}`;
    case "perceptual":
      return `Reality misread active: ${thought}`;
    case "continuity":
      return `Identity drift active across thought/emotion/behavior`;
    default:
      return "Distortion active";
  }
}

function getDistortionDescription(
  distortionClass: DistortionClass,
  origin: string,
): string {
  switch (distortionClass) {
    case "narrative":
      return `False internal story rooted in: ${origin}`;
    case "emotional":
      return `Disproportionate emotional reaction rooted in: ${origin}`;
    case "behavioral":
      return `Action misalignment rooted in: ${origin}`;
    case "perceptual":
      return `Misreading of reality rooted in: ${origin}`;
    case "continuity":
      return `Identity drift rooted in: ${origin}`;
    default:
      return origin;
  }
}

function computeContinuityDelta(
  distortionClass: DistortionClass,
  outcome: SessionOutcome,
  clarityRating: number,
) {
  const multiplier =
    outcome === "reduced" ? 1 : outcome === "unresolved" ? -0.5 : -1;

  const delta = {
    perception: 0,
    identity: 0,
    intention: 0,
    action: 0,
  };

  switch (distortionClass) {
    case "narrative":
      delta.perception += 6 * multiplier;
      delta.intention += 2 * multiplier;
      break;
    case "emotional":
      delta.identity += 3 * multiplier;
      delta.intention += 4 * multiplier;
      break;
    case "behavioral":
      delta.action += 6 * multiplier;
      delta.intention += 2 * multiplier;
      break;
    case "perceptual":
      delta.perception += 7 * multiplier;
      delta.identity += 1 * multiplier;
      break;
    case "continuity":
      delta.identity += 6 * multiplier;
      delta.action += 2 * multiplier;
      break;
  }

  if (clarityRating >= 7 && outcome === "reduced") {
    delta.perception += 1;
    delta.identity += 1;
    delta.action += 1;
  }

  return delta;
}

function buildLessonLine(
  distortionClass: DistortionClass,
  outcome: SessionOutcome,
  nextAction: string,
) {
  return `Class ${distortionClass} ended as ${outcome}. Next aligned action: ${nextAction}`;
}

export function runSessionEngine(input: SessionInput): SessionEngineResult {
  const severity = mapSeverity(input.clarityRating, input.outcome);

  const distortionStatus =
    input.outcome === "reduced"
      ? "reduced"
      : input.outcome === "escalated"
      ? "unresolved"
      : "unresolved";

  return {
    fracture: {
      type: input.distortionClass,
      originDescription: input.origin,
      triggerDescription: input.trigger,
    },
    distortion: {
      class: input.distortionClass,
      description: getDistortionDescription(input.distortionClass, input.origin),
      currentEffect: getCurrentEffect(
        input.distortionClass,
        input.thought,
        input.emotion,
        input.behavior,
      ),
      severity,
      status: distortionStatus,
    },
    session: {
      stepsCompleted: 9,
      outcome: input.outcome,
      exitStateClarityRating: input.clarityRating,
    },
    continuityDelta: computeContinuityDelta(
      input.distortionClass,
      input.outcome,
      input.clarityRating,
    ),
    lessonLine: buildLessonLine(
      input.distortionClass,
      input.outcome,
      input.nextAction,
    ),
  };
}
