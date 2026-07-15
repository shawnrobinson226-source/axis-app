// /lib/kernel/recompute.ts

export const RECOMPUTE_WINDOWS_DAYS = [7, 30, 90] as const;
export type RecomputeWindowDays = (typeof RECOMPUTE_WINDOWS_DAYS)[number];

export const VOLATILITY_WINDOWS_DAYS = [30, 90] as const;
export type VolatilityWindowDays = (typeof VOLATILITY_WINDOWS_DAYS)[number];

import {
  DISTORTION_CLASS,
  SESSION_OUTCOME,
} from "@/lib/kernel/domain";

export type {
  DistortionClass,
  SessionOutcome,
} from "@/lib/kernel/domain";

export const DISTORTION_CLASSES = DISTORTION_CLASS;
export const OUTCOMES = SESSION_OUTCOME;

// V1 guardrails (match your validator assumptions)
export const REDUCED_MIN_STEPS = 6;
export const REDUCED_MIN_CLARITY = 6;

// Volatility bands (tune later; deterministic now)
export const VOL_BAND = {
  LOW_MAX: 4,
  MED_MAX: 12,
} as const;