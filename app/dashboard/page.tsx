"use client";

import { useEffect, useState } from "react";
import { getOrCreateOperatorId } from "@/lib/operator/client";

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function barWidth(value: number) {
  return `${Math.max(0, Math.min(100, value))}%`;
}

function continuityTone(score: number) {
  if (score < 35) return "text-red-300";
  if (score < 60) return "text-amber-300";
  if (score < 80) return "text-zinc-100";
  return "text-emerald-300";
}

type DashboardState = {
  continuity: {
    operator_id: string;
    perception_alignment: number;
    identity_alignment: number;
    intention_alignment: number;
    action_alignment: number;
    continuity_score: number;
    updated_at: string;
  };
  activeFracturesCount: number;
  recentSessions: Array<{
    id: string;
    trigger: string;
    distortion_class:
      | "narrative"
      | "emotional"
      | "behavioral"
      | "perceptual"
      | "continuity";
    outcome: "reduced" | "unresolved" | "escalated";
    clarity_rating: number;
    continuity_before: number;
    continuity_after: number;
    created_at: string;
  }>;
};

type ThirtyDaySummary = {
  total_sessions: number;
  distortion_frequency: {
    narrative: number;
    emotional: number;
    behavioral: number;
    perceptual: number;
    continuity: number;
  };
  outcome_distribution: {
    reduced: number;
    unresolved: number;
    escalated: number;
  };
  most_common_distortion: string | null;
  continuity_change: {
    start: number | null;
    end: number | null;
    delta: number | null;
  };
  most_repeated_pattern: string | null;
  most_common_action: string | null;
};

const EMPTY_STATE: DashboardState = {
  continuity: {
    operator_id: "",
    perception_alignment: 50,
    identity_alignment: 50,
    intention_alignment: 50,
    action_alignment: 50,
    continuity_score: 50,
    updated_at: "unavailable",
  },
  activeFracturesCount: 0,
  recentSessions: [],
};

const EMPTY_SUMMARY: ThirtyDaySummary = {
  total_sessions: 0,
  distortion_frequency: {
    narrative: 0,
    emotional: 0,
    behavioral: 0,
    perceptual: 0,
    continuity: 0,
  },
  outcome_distribution: {
    reduced: 0,
    unresolved: 0,
    escalated: 0,
  },
  most_common_distortion: null,
  continuity_change: {
    start: null,
    end: null,
    delta: null,
  },
  most_repeated_pattern: null,
  most_common_action: null,
};

function formatOptional(value: string | null) {
  return value ?? "None";
}

function formatNumber(value: number | null) {
  return value === null ? "None" : value.toFixed(1);
}

function formatDelta(value: number | null) {
  if (value === null) return "None";
  return value > 0 ? `+${value.toFixed(1)}` : value.toFixed(1);
}

function SummarySection({ summary }: { summary: ThirtyDaySummary }) {
  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-6">
      <div className="mb-5">
        <h2 className="text-lg font-medium text-zinc-100">
          30-Day Execution Summary
        </h2>
        <p className="mt-1 text-sm text-zinc-400">
          Operational memory from sessions logged in the last 30 days.
        </p>
      </div>

      {summary.total_sessions === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-800 px-4 py-8 text-sm text-zinc-500">
          No activity in the last 30 days.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
            <p className="text-sm text-zinc-400">Total Sessions</p>
            <p className="mt-2 text-3xl font-semibold text-zinc-100">
              {summary.total_sessions}
            </p>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
            <p className="text-sm text-zinc-400">Most Common Distortion</p>
            <p className="mt-2 text-xl font-semibold capitalize text-zinc-100">
              {formatOptional(summary.most_common_distortion)}
            </p>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
            <p className="text-sm text-zinc-400">Continuity Delta</p>
            <p className="mt-2 text-xl font-semibold text-zinc-100">
              {formatDelta(summary.continuity_change.delta)}
            </p>
            <p className="mt-2 text-xs text-zinc-500">
              {formatNumber(summary.continuity_change.start)} →{" "}
              {formatNumber(summary.continuity_change.end)}
            </p>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
            <p className="text-sm text-zinc-400">Outcome Counts</p>
            <div className="mt-2 space-y-1 text-sm text-zinc-100">
              <p>reduced: {summary.outcome_distribution.reduced}</p>
              <p>unresolved: {summary.outcome_distribution.unresolved}</p>
              <p>escalated: {summary.outcome_distribution.escalated}</p>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
            <p className="text-sm text-zinc-400">Most Repeated Pattern</p>
            <p className="mt-2 text-sm leading-6 text-zinc-100">
              {formatOptional(summary.most_repeated_pattern)}
            </p>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
            <p className="text-sm text-zinc-400">Most Common Action</p>
            <p className="mt-2 text-sm leading-6 text-zinc-100">
              {formatOptional(summary.most_common_action)}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

export default function DashboardPage() {
  const [operatorId] = useState(() => {
    if (typeof window === "undefined") return "";
    return getOrCreateOperatorId();
  });
  const [state, setState] = useState<DashboardState>(EMPTY_STATE);
  const [volatilityBand, setVolatilityBand] = useState<"low" | "medium" | "high">("low");
  const [summary, setSummary] = useState<ThirtyDaySummary>(EMPTY_SUMMARY);

  useEffect(() => {
    if (!operatorId) return;

    void (async () => {
      try {
        const response = await fetch("/api/v1/state", {
          method: "GET",
          headers: {
            "x-operator-id": operatorId,
          },
          cache: "no-store",
        });

        const body = (await response.json()) as {
          ok?: boolean;
          data?: DashboardState & { volatilityBand?: "low" | "medium" | "high" };
        };

        if (!response.ok || !body.ok || !body.data) return;

        setState({
          continuity: body.data.continuity,
          activeFracturesCount: body.data.activeFracturesCount,
          recentSessions: body.data.recentSessions ?? [],
        });
        setVolatilityBand(body.data.volatilityBand ?? "low");

        const summaryResponse = await fetch("/api/v1/summary/thirty-day", {
          method: "GET",
          headers: {
            "x-operator-id": operatorId,
          },
          cache: "no-store",
        });

        const summaryBody = (await summaryResponse.json()) as {
          ok?: boolean;
          data?: ThirtyDaySummary;
        };

        if (summaryResponse.ok && summaryBody.ok && summaryBody.data) {
          setSummary(summaryBody.data);
        }
      } catch {
        // Keep neutral fallback state on load failure.
      }
    })();
  }, [operatorId]);

  const { continuity, activeFracturesCount, recentSessions } = state;

  if (recentSessions.length === 0) {
    return (
      <main className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10">
        <header className="space-y-3">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-zinc-500">
            AXIS / Dashboard
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-100">
            Execution Patterns
          </h1>
          <p className="max-w-3xl text-sm leading-6 text-zinc-400">
            Patterns appear after you log sessions.
          </p>
        </header>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-6">
          <h2 className="text-lg font-medium text-zinc-100">
            What Will Appear
          </h2>
          <ul className="mt-4 grid gap-3 text-sm text-zinc-300 md:grid-cols-2">
            <li>Recurring distortion types</li>
            <li>Outcome trends</li>
            <li>Continuity movement</li>
            <li>Execution patterns</li>
          </ul>
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-6">
          <p className="text-sm text-zinc-200">Recommended Next Step</p>
          <p className="mt-3 text-sm leading-6 text-zinc-100">
            Start a session and log one real situation.
          </p>
          <a
            href="/session"
            className="mt-4 inline-flex rounded-xl border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-100 transition hover:border-zinc-500"
          >
            Go to Session
          </a>
        </section>

        <SummarySection summary={summary} />
      </main>
    );
  }

  const dimensions = [
    {
      label: "Perception",
      value: continuity.perception_alignment,
    },
    {
      label: "Identity",
      value: continuity.identity_alignment,
    },
    {
      label: "Intention",
      value: continuity.intention_alignment,
    },
    {
      label: "Action",
      value: continuity.action_alignment,
    },
  ];

  const distortionFrequency = {
    narrative: 0,
    emotional: 0,
    behavioral: 0,
    perceptual: 0,
    continuity: 0,
  };

  const outcomeDistribution = {
    reduced: 0,
    unresolved: 0,
    escalated: 0,
  };

  for (const session of recentSessions) {
    if (session.distortion_class in distortionFrequency) {
      distortionFrequency[
        session.distortion_class as keyof typeof distortionFrequency
      ] += 1;
    }

    if (session.outcome in outcomeDistribution) {
      outcomeDistribution[session.outcome as keyof typeof outcomeDistribution] +=
        1;
    }
  }

  const { reduced, unresolved, escalated } = outcomeDistribution;

  const stabilityTrendKey =
    reduced >= escalated + 2 && reduced >= unresolved
      ? "improving"
      : escalated >= reduced + 2 && escalated >= unresolved
        ? "unstable"
        : "neutral";

  const continuityStatusKey =
    reduced >= escalated + 2 && reduced >= unresolved
      ? "stable"
      : escalated >= reduced + 2 || unresolved > reduced
        ? "unstable"
        : "forming";

  const stabilityTrend =
    stabilityTrendKey === "improving"
      ? "↑ improving"
      : stabilityTrendKey === "unstable"
        ? "↓ unstable"
        : "→ neutral";

  const continuityStatus =
    continuityStatusKey === "stable"
      ? "↑ stable"
      : continuityStatusKey === "unstable"
        ? "↓ unstable"
        : "→ forming";

  const dominantDistortion = (
    Object.entries(distortionFrequency) as Array<
      [keyof typeof distortionFrequency, number]
    >
  ).reduce(
    (currentMax, nextEntry) =>
      nextEntry[1] > currentMax[1] ? nextEntry : currentMax,
    ["narrative", distortionFrequency.narrative],
  )[0];

  const recommendedNextStep =
    continuityStatusKey === "unstable"
      ? "Start a new session now and reduce the current instability before doing anything else."
      : dominantDistortion === "behavioral" && unresolved >= reduced
        ? "Run a new session focused on repeated behavior patterns and define one concrete next action."
        : dominantDistortion === "emotional" && stabilityTrendKey !== "improving"
          ? "Run a new session on the current emotional trigger and reduce reactivity before acting."
          : dominantDistortion === "narrative"
            ? "Review the recurring narrative pattern and run a session to convert it into a concrete action path."
            : continuityStatusKey === "forming"
              ? "Keep the system moving: log the next real trigger and continue building consistency."
              : continuityStatusKey === "stable" && reduced >= unresolved
                ? "Maintain the current pattern. Review logs and continue executing without adding complexity."
                : "Start a new session and clarify the current trigger before making the next move.";

  const recommendationText =
    recentSessions.length === 0
      ? "Log your first session to begin tracking patterns."
      : recommendedNextStep;

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10">
      <header className="space-y-3">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-zinc-500">
          AXIS / Dashboard
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-100">
          Runtime Status Report
        </h1>
        <p className="max-w-3xl text-sm leading-6 text-zinc-400">
          Read-only system view of your continuity, alignment, and recent outcomes.
        </p>
        <p className="max-w-3xl text-sm leading-6 text-zinc-300">
          This dashboard reflects patterns from your logged sessions. More
          entries = more accurate insights.
        </p>
      </header>

      <SummarySection summary={summary} />

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-6">
          <p className="text-sm text-zinc-200">Continuity Score</p>
          <p
            className={`mt-3 text-5xl font-bold tracking-tight ${continuityTone(
              continuity.continuity_score,
            )}`}
          >
            {Math.round(continuity.continuity_score)}
          </p>
          {recentSessions.length === 0 ? (
            <p className="mt-3 text-sm text-zinc-400">Baseline. Updates after first session.</p>
          ) : null}
          <p className="mt-3 text-sm text-zinc-300">
            Last continuity update: {formatDate(continuity.updated_at)}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-6">
          <p className="text-sm text-zinc-400">Active Fractures</p>
          <p className="mt-3 text-5xl font-semibold tracking-tight text-zinc-100">
            {activeFracturesCount}
          </p>
          <p className="mt-3 text-sm text-zinc-500">
            Sessions still unresolved or escalating.
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-6">
          <p className="text-sm text-zinc-400">30-Day Volatility</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight capitalize text-zinc-100">
            {volatilityBand}
          </p>
          <p className="mt-3 text-sm text-zinc-500">
            Low is steady. High means drift risk.
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-6">
          <p className="text-sm text-zinc-200">Distortion Frequency</p>
          <p className="mt-2 text-sm text-zinc-400">
            Patterns showing up most often
          </p>
          <div className="mt-3 space-y-1 text-sm text-zinc-100">
            <p>narrative: {distortionFrequency.narrative}</p>
            <p>emotional: {distortionFrequency.emotional}</p>
            <p>behavioral: {distortionFrequency.behavioral}</p>
            <p>perceptual: {distortionFrequency.perceptual}</p>
            <p>continuity: {distortionFrequency.continuity}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-6">
          <p className="text-sm text-zinc-200">Outcome Distribution</p>
          <p className="mt-2 text-sm text-zinc-400">
            How your situations are resolving
          </p>
          <div className="mt-3 space-y-1 text-sm text-zinc-100">
            <p>reduced: {outcomeDistribution.reduced}</p>
            <p>unresolved: {outcomeDistribution.unresolved}</p>
            <p>escalated: {outcomeDistribution.escalated}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-6">
          <p className="text-sm text-zinc-200">Stability Trend</p>
          <p className="mt-2 text-sm text-zinc-400">
            Short-term direction of your outcomes
          </p>
          <p className="mt-3 text-xl font-semibold text-zinc-100">
            {stabilityTrend}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-6">
          <p className="text-sm text-zinc-200">Continuity Status</p>
          <p className="mt-2 text-sm text-zinc-400">
            Overall system stability based on recent outcomes
          </p>
          <p className="mt-3 text-xl font-semibold text-zinc-100">
            {recentSessions.length === 0 ? "No data yet." : continuityStatus}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-6 md:col-span-2 xl:col-span-2">
          <p className="text-sm text-zinc-200">Recommended Next Step</p>
          <p className="mt-2 text-sm text-zinc-400">
            Priority action based on current pattern
          </p>
          <p className="mt-2 text-xs text-zinc-500">
            Recommended next step is based on your most recent session and
            current pattern trend.
          </p>
          <p className="mt-3 text-sm leading-6 text-zinc-100">
            {recommendationText}
          </p>
          <a
            href="/session"
            className="mt-4 inline-flex rounded-xl border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-100 transition hover:border-zinc-500"
          >
            Go to Session
          </a>
        </div>

        <p className="md:col-span-2 xl:col-span-4 text-xs text-zinc-500">
          More reduced = improvement. More escalated = instability.
        </p>
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-6">
        <div className="mb-5">
          <h2 className="text-lg font-medium text-zinc-100">Alignment Dimensions</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Balance across four core areas.
          </p>
        </div>

        <div className="space-y-5">
          {dimensions.map((dimension) => (
            <div key={dimension.label} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-zinc-200">
                  {dimension.label}
                </span>
                <span className="text-sm text-zinc-200">
                  {Math.round(dimension.value)}
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-zinc-900">
                <div
                  className="h-full rounded-full bg-zinc-200 transition-all"
                  style={{ width: barWidth(dimension.value) }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-6">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-medium text-zinc-100">Recent Sessions</h2>
            <p className="mt-1 text-sm text-zinc-400">
              Your most recent completed sessions.
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Log at least one session to begin generating reliable patterns.
            </p>
          </div>

          <a
            href="/session"
            className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-100 transition hover:border-zinc-500"
          >
            Start New Session
          </a>
        </div>

        {recentSessions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-800 px-4 py-8 text-center text-sm text-zinc-500">
            No sessions logged yet.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-zinc-800">
            <table className="w-full border-collapse">
              <thead className="bg-zinc-900/80">
                <tr className="text-left text-xs uppercase tracking-[0.16em] text-zinc-500">
                  <th className="px-4 py-3 font-medium">Trigger</th>
                  <th className="px-4 py-3 font-medium">Class</th>
                  <th className="px-4 py-3 font-medium">Outcome</th>
                  <th className="px-4 py-3 font-medium">Clarity</th>
                  <th className="px-4 py-3 font-medium">Continuity Δ</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {recentSessions.map((session) => {
                  const delta = session.continuity_after - session.continuity_before;
                  const deltaText =
                    delta > 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1);

                  return (
                    <tr
                      key={session.id}
                      className="border-t border-zinc-800 text-sm text-zinc-200"
                    >
                      <td className="max-w-[26rem] px-4 py-4 align-top text-zinc-100">
                        {session.trigger}
                      </td>
                      <td className="px-4 py-4 align-top capitalize text-zinc-100">
                        {session.distortion_class}
                      </td>
                      <td className="px-4 py-4 align-top capitalize text-zinc-300">
                        {session.outcome}
                      </td>
                      <td className="px-4 py-4 align-top text-zinc-100">
                        {session.clarity_rating}
                      </td>
                      <td className="px-4 py-4 align-top text-zinc-100">
                        {deltaText}
                      </td>
                      <td className="px-4 py-4 align-top text-zinc-500">
                        {formatDate(session.created_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
