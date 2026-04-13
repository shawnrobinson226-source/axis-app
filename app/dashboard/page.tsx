import { getDashboardState, getVolatilityBand } from "../session/actions";

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

export default async function DashboardPage() {
  const [state, volatilityBand] = await Promise.all([
    getDashboardState("op_legacy"),
    getVolatilityBand("op_legacy"),
  ]);

  const { continuity, activeFracturesCount, recentSessions } = state;

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

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10">
      <header className="space-y-3">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-zinc-500">
          VANTA / Dashboard
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-100">
          Runtime Status Report
        </h1>
        <p className="max-w-3xl text-sm leading-6 text-zinc-400">
          Read-only kernel view. Continuity, alignment, open instability load,
          and recent session outcomes.
        </p>
        <p className="max-w-3xl text-sm leading-6 text-zinc-300">
          This dashboard reflects patterns from your logged sessions. More
          entries = more accurate insights.
        </p>
      </header>

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
          <p className="mt-3 text-sm text-zinc-300">
            Updated {formatDate(continuity.updated_at)}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-6">
          <p className="text-sm text-zinc-400">Active Fractures</p>
          <p className="mt-3 text-5xl font-semibold tracking-tight text-zinc-100">
            {activeFracturesCount}
          </p>
          <p className="mt-3 text-sm text-zinc-500">
            Count of unresolved or escalated sessions.
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-6">
          <p className="text-sm text-zinc-400">30-Day Volatility</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight capitalize text-zinc-100">
            {volatilityBand}
          </p>
          <p className="mt-3 text-sm text-zinc-500">
            Derived stability cache. Low is steadier. High means drift risk.
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-6">
          <p className="text-sm text-zinc-200">Distortion Frequency</p>
          <p className="mt-2 text-sm text-zinc-400">
            Which patterns show up most often
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
            {continuityStatus}
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
            {recommendedNextStep}
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
            Equal-weight continuity model across four domains.
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
              Last five closed sessions from the runtime ledger.
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
