import Link from "next/link";

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-6">
      <h2 className="text-lg font-medium text-zinc-100">{title}</h2>
      <div className="mt-3 text-sm leading-7 text-zinc-400">{children}</div>
    </section>
  );
}

function tone(score: number) {
  if (score < 35) return "text-red-300";
  if (score < 60) return "text-amber-300";
  if (score < 80) return "text-zinc-100";
  return "text-emerald-300";
}

type HomeState = {
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

async function getHomeStateSafe(): Promise<{
  state: HomeState;
  volatilityBand: "low" | "medium" | "high";
  degraded: boolean;
}> {
  return {
    state: {
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
    },
    volatilityBand: "low",
    degraded: false,
  };
}

export default async function HomePage() {
  const { state, volatilityBand, degraded } = await getHomeStateSafe();
  const { continuity, activeFracturesCount, recentSessions } = state;

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10">
      <header className="space-y-4">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-zinc-500">
          Continuity Engine / Entry
        </p>
        <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-zinc-50">
          Continuity Engine
        </h1>
        <p className="max-w-3xl text-base leading-7 text-zinc-300">
          Turn confusion into clear next actions.
        </p>
        <p className="text-sm text-zinc-400">Classify. Execute. Track. Stabilize.</p>

        {degraded ? (
          <div className="rounded-xl border border-amber-800 bg-amber-950/40 px-4 py-3 text-sm text-amber-200">
            Live runtime data is temporarily unavailable. Showing safe baseline values.
          </div>
        ) : null}

        <div className="flex flex-wrap gap-3 pt-2">
          <Link
            href="/session"
            className="rounded-xl bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-white"
          >
            Start Session
          </Link>
          <Link
            href="/dashboard"
            className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-100 transition hover:border-zinc-500"
          >
            View Dashboard
          </Link>

          <Link
            href="/logs"
            className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-100 transition hover:border-zinc-500"
          >
            Review Logs
          </Link>

          <Link
            href="/settings"
            className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-100 transition hover:border-zinc-500"
          >
            Settings
          </Link>
        </div>
      </header>

      <section className="grid gap-5 md:grid-cols-3">
        <section className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-6">
          <p className="text-sm text-zinc-400">Continuity Score</p>
          <p
            className={`mt-3 text-5xl font-semibold tracking-tight ${tone(
              continuity.continuity_score,
            )}`}
          >
            {Math.round(continuity.continuity_score)}
          </p>
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-6">
          <p className="text-sm text-zinc-400">Active Fractures</p>
          <p className="mt-3 text-5xl font-semibold tracking-tight text-zinc-100">
            {activeFracturesCount}
          </p>
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-6">
          <p className="text-sm text-zinc-400">30-Day Volatility</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight capitalize text-zinc-100">
            {volatilityBand}
          </p>
        </section>
      </section>

      <section className="grid gap-5 md:grid-cols-2">
        <Card title="Recommended Next Step">
          <p>Log one real trigger in Session and save it.</p>
          <p>Then review Dashboard for pattern signal and Logs for record trace.</p>
        </Card>

        <Card title="Reference">
          <p>
            Distortions: Narrative, Emotional, Behavioral, Perceptual, Continuity
          </p>
        </Card>
      </section>

      <section className="grid gap-5">
        <Card title="Current Snapshot">
          {recentSessions.length === 0 ? (
            <p>No sessions recorded yet. Start Session to generate signals.</p>
          ) : (
            <div className="space-y-2">
              <div>Recent sessions: {recentSessions.length}</div>
              <div>
                Latest outcome:{" "}
                <span className="capitalize text-zinc-200">
                  {recentSessions[0].outcome}
                </span>
              </div>
              <div>
                Latest class:{" "}
                <span className="capitalize text-zinc-200">
                  {recentSessions[0].distortion_class}
                </span>
              </div>
            </div>
          )}
        </Card>
      </section>
    </main>
  );
}
