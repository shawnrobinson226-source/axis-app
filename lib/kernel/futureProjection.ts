// lib/kernel/futureProjection.ts
// Single source of truth for the operator’s target trajectory.
// Plain TS object only. No database.

export type FutureProjection = Readonly<{
  identity_name: string;
  principles: readonly string[];
  non_negotiables: readonly string[];
  drift_signals: readonly string[];
  alignment_signals: readonly string[];
}>;

export const FUTURE_PROJECTION: FutureProjection = {
  identity_name: "Sovereign Operator",
  principles: [
    "Integrity over impulse",
    "Truth in service of evolution",
    "Consistency beats intensity",
    "Boundaries protect outcomes",
    "Proof through action",
  ],
  non_negotiables: [
    "No self-attack language",
    "Sleep and recovery protected",
    "Daily anchor action completed",
    "Chosen relationships protected",
    "No ‘burn it all’ decisions while overloaded",
  ],
  drift_signals: [
    "Skipping the daily anchor",
    "Overconsumption (scrolling, numbing)",
    "Avoiding the smallest next step",
    "Isolation when stressed",
    "Escalating intensity to ‘prove’ worth",
  ],
  alignment_signals: [
    "One concrete action logged daily",
    "Clear next step written before starting",
    "Boundaries held without apology",
    "Recovery respected after load",
    "Tools used before escalation",
  ],
} as const;
