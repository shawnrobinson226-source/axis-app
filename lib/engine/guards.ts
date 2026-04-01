export interface GuardInput {
  stability: number;
  reference: boolean;
  impact: number;
}

export interface GuardResult {
  allowed: boolean;
  flags: string[];
}

export function runGuards(input: GuardInput): GuardResult {
  const flags: string[] = [];

  if (input.stability < 3) {
    flags.push("LOW_STABILITY");
  }

  if (!input.reference) {
    flags.push("NO_REFERENCE");
  }

  if (input.impact > 7) {
    flags.push("HIGH_IMPACT");
  }

  return {
    allowed: flags.length === 0,
    flags,
  };
}