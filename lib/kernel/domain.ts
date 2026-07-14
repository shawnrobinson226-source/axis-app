/**
 * AXIS locked domain taxonomy.
 *
 * This file is the single authority for distortion classes
 * and session outcomes used throughout AXIS.
 */

export const DISTORTION_CLASS = [
  "narrative",
  "emotional",
  "behavioral",
  "perceptual",
  "continuity",
] as const;

export type DistortionClass = (typeof DISTORTION_CLASS)[number];

export const SESSION_OUTCOME = [
  "reduced",
  "unresolved",
  "escalated",
] as const;

export type SessionOutcome = (typeof SESSION_OUTCOME)[number];

export function parseDistortionClass(value: string): DistortionClass {
  if (DISTORTION_CLASS.includes(value as DistortionClass)) {
    return value as DistortionClass;
  }

  throw new Error(`Invalid distortion class: ${value}`);
}

export function parseSessionOutcome(value: string): SessionOutcome {
  if (SESSION_OUTCOME.includes(value as SessionOutcome)) {
    return value as SessionOutcome;
  }

  throw new Error(`Invalid session outcome: ${value}`);
}