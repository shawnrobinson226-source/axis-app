import type { FractureId } from "@/lib/kernel/v1/types";

export type PatternCategory =
  | "behavioral"
  | "emotional"
  | "narrative"
  | "perceptual"
  | "continuity";

type LockedSessionField =
  | `${"receiv"}ed`
  | `${"whatAxis"}Sees`
  | `${"reality"}Check`
  | `${"interrup"}tion`;

export type PatternMetadata = {
  id: FractureId;
  userLabel: string;
  userDescription: string;
  whyItHappens: string;
  category: PatternCategory;
} & Record<LockedSessionField, string>;

export const PATTERN_METADATA: Record<FractureId, PatternMetadata> = {
  control_loss: {
    id: "control_loss",
    userLabel: "Control Grip",
    userDescription:
      "Your attention is narrowing around what feels outside your control.",
    whyItHappens:
      "This pattern often appears when uncertainty feels costly and the mind tries to regain leverage by tightening around every variable.",
    received: "Something feels like it is slipping. That pressure is real.",
    whatAxisSees:
      "You may be tightening around variables that were never fully yours to control.",
    realityCheck:
      "Some things are outside your reach. That is not the same as failure.",
    interruption:
      "Control is not the same as clarity. You can act without owning the outcome.",
    category: "perceptual",
  },
  rejection_sensitivity: {
    id: "rejection_sensitivity",
    userLabel: "Rejection Alarm",
    userDescription:
      "Your system is reading possible disapproval as an immediate threat.",
    whyItHappens:
      "This pattern tends to activate when belonging, approval, or relational safety feels uncertain.",
    received: "Something landed hard. That reaction is worth examining.",
    whatAxisSees:
      "You may be reading disapproval into a situation that has not fully resolved yet.",
    realityCheck:
      "A signal of possible rejection is not confirmed rejection. The story may be running ahead of the facts.",
    interruption:
      "Do not let the fear of being excluded make the decision for you.",
    category: "emotional",
  },
  status_threat: {
    id: "status_threat",
    userLabel: "Status Threat",
    userDescription:
      "The situation is being filtered through rank, respect, or perceived standing.",
    whyItHappens:
      "This pattern shows up when a moment seems to imply something about competence, authority, or how others position you.",
    received:
      "Something felt like a challenge to your standing. That response is worth naming.",
    whatAxisSees:
      "You may be filtering this situation through rank, respect, or perceived position.",
    realityCheck:
      "What happened and what it means about you are two different things.",
    interruption:
      "Your value is not on trial in this moment. Act from what you know, not from what you are trying to protect.",
    category: "narrative",
  },
  uncertainty_intolerance: {
    id: "uncertainty_intolerance",
    userLabel: "Uncertainty Pressure",
    userDescription:
      "Your attention is pushing for certainty before the situation can provide it.",
    whyItHappens:
      "This pattern often appears when the next step feels risky without a complete map.",
    received:
      "The absence of a clear answer is creating pressure. That is worth seeing.",
    whatAxisSees:
      "You may be pushing for certainty before the situation can provide it.",
    realityCheck:
      "Incomplete information is not the same as the wrong direction.",
    interruption:
      "Clarity often arrives after contact with reality, not before it.",
    category: "perceptual",
  },
  self_worth_dependency: {
    id: "self_worth_dependency",
    userLabel: "Worth Attachment",
    userDescription:
      "The outcome is starting to feel like evidence about your value.",
    whyItHappens:
      "This pattern can activate when performance, approval, or achievement gets tied to identity instead of treated as feedback.",
    received:
      "The outcome is starting to feel like it means something about you. That is worth slowing down for.",
    whatAxisSees:
      "You may be treating this result as evidence about your value rather than as feedback.",
    realityCheck: "Performance is information. It is not identity.",
    interruption:
      "Do not let one outcome write the verdict on what you are worth.",
    category: "narrative",
  },
  boundary_violation: {
    id: "boundary_violation",
    userLabel: "Boundary Drift",
    userDescription:
      "The situation is pulling you past a limit that needs to be named or protected.",
    whyItHappens:
      "This pattern often forms when urgency, guilt, or pressure makes a clear boundary feel negotiable.",
    received:
      "Something pulled you past a limit you already know. That signal matters.",
    whatAxisSees:
      "You may be negotiating a boundary that should not be negotiable right now.",
    realityCheck:
      "Urgency, guilt, and pressure are not the same as a good reason to move the line.",
    interruption:
      "A limit that bends every time it is tested is not a limit. Name it or lose it.",
    category: "behavioral",
  },
  comparison_spiral: {
    id: "comparison_spiral",
    userLabel: "Comparison Loop",
    userDescription:
      "Your attention is measuring your position against someone else's path.",
    whyItHappens:
      "This pattern tends to appear when another person's progress becomes the reference point for your own adequacy or timing.",
    received:
      "Someone else's position is pulling at your attention. That pull is worth examining.",
    whatAxisSees:
      "You may be measuring your adequacy against someone else's visible progress.",
    realityCheck:
      "Their path is not your timeline. What you are seeing is a snapshot, not the full picture.",
    interruption:
      "Comparison does not tell you where you are. It only tells you where you are not.",
    category: "narrative",
  },
  over_responsibility: {
    id: "over_responsibility",
    userLabel: "Responsibility Overreach",
    userDescription:
      "You are taking ownership of more than your actual role requires.",
    whyItHappens:
      "This pattern often activates when care, control, or conflict avoidance makes other people's outcomes feel like your assignment.",
    received:
      "You may be carrying more than your actual assignment. That weight is worth naming.",
    whatAxisSees: "You may be absorbing outcomes that belong to someone else.",
    realityCheck:
      "Care and ownership are not the same thing. You can show up without taking the whole load.",
    interruption:
      "Other people's results are not your evidence. Do your part and release what is not yours.",
    category: "behavioral",
  },
  avoidance_loop: {
    id: "avoidance_loop",
    userLabel: "Avoidance Loop",
    userDescription:
      "The system is protecting you from discomfort by delaying the next concrete action.",
    whyItHappens:
      "This pattern shows up when starting feels more threatening than staying stuck.",
    received:
      "Something is being circled instead of met. That pattern is worth seeing.",
    whatAxisSees:
      "You may be refining, delaying, or preparing instead of letting the work meet reality.",
    realityCheck:
      "The discomfort of starting is not the same as evidence that you are not ready.",
    interruption:
      "Refinement can improve the work. It cannot replace exposure.",
    category: "behavioral",
  },
  shame_spike: {
    id: "shame_spike",
    userLabel: "Shame Spike",
    userDescription:
      "The moment is being interpreted as a personal defect rather than a workable signal.",
    whyItHappens:
      "This pattern often appears when a mistake, exposure, or unmet expectation gets fused with identity.",
    received:
      "Something landed like a verdict. That reaction deserves a closer look.",
    whatAxisSees:
      "You may be interpreting a mistake or exposure as evidence of a permanent defect.",
    realityCheck:
      "What happened is information. It is not the final word on who you are.",
    interruption:
      "Shame is not correction. It is noise. Take the lesson and leave the verdict.",
    category: "emotional",
  },
};

export function getPatternMetadata(id: FractureId): PatternMetadata {
  return PATTERN_METADATA[id];
}
