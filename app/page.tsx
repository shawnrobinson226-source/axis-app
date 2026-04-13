import Link from "next/link";
import { getDashboardState, getVolatilityBand } from "./session/actions";
import { withTimeout } from "@/lib/utils/withTimeout";

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
  try {
    const [state, volatilityBand] = await Promise.all([
      withTimeout(getDashboardState("op_legacy"), 3000),
      withTimeout(getVolatilityBand("op_legacy"), 3000),
    ]);

    return {
      state,
      volatilityBand,
      degraded: false,
    };
  } catch {
    return {
      state: {
        continuity: {
          operator_id: "op_legacy",
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
      degraded: true,
    };
  }
}

export default async function HomePage() {
  const { state, volatilityBand, degraded } = await getHomeStateSafe();
  const { continuity, activeFracturesCount, recentSessions } = state;

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10">
      <header className="space-y-4">
        <div className="space-y-3">
  <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-zinc-50">
    Turn confusion into clear next actions.
  </h1>

  <p className="max-w-3xl text-base leading-7 text-zinc-300">
    Continuity Engine takes any situation, breaks it down, and gives you a structured path forward so you can act instead of overthink.
  </p>

  <p className="text-sm text-zinc-400">
    Classify. Execute. Track. Stabilize.
  </p>

  <div className="pt-2">
    <Link
      href="/session"
      className="rounded-xl bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-white"
    >
      Start Session
    </Link>
  </div>
</div>
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-zinc-500">
          Continuity Engine / Entry Gate
        </p>

        <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-zinc-100">
          Structured input. Deterministic analysis. Clear next action.
        </h1>

        <p className="max-w-3xl text-base leading-7 text-zinc-400">
          Continuity Engine is a state-resolution system. It takes a raw trigger, classifies
          the distortion, maps the response path, logs the result, and updates
          continuity over time.
        </p>

        {degraded ? (
          <div className="rounded-xl border border-amber-800 bg-amber-950/40 px-4 py-3 text-sm text-amber-200">
            Live runtime data is temporarily unavailable. Showing safe baseline values.
          </div>
        ) : null}

        <div className="flex flex-wrap gap-3 pt-2">
        
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
          <p className="mt-3 text-sm text-zinc-500">
            Current system alignment across perception, identity, intention,
            and action.
          </p>
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-6">
          <p className="text-sm text-zinc-400">Active Fractures</p>
          <p className="mt-3 text-5xl font-semibold tracking-tight text-zinc-100">
            {activeFracturesCount}
          </p>
          <p className="mt-3 text-sm text-zinc-500">
            Count of unresolved or escalated sessions still affecting continuity.
          </p>
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-6">
          <p className="text-sm text-zinc-400">30-Day Volatility</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight capitalize text-zinc-100">
            {volatilityBand}
          </p>
          <p className="mt-3 text-sm text-zinc-500">
            Stability band derived from recent clarity and continuity variation.
          </p>
        </section>
      </section>

      <section className="grid gap-5 md:grid-cols-2">
        <Card title="What Continuity Engine Is">
          <ul className="space-y-2">
            <li>A deterministic state-processing system.</li>
            <li>A way to convert raw triggers into structured action.</li>
            <li>A continuity tracker that measures alignment over time.</li>
            <li>A tool for reducing distortion, not amplifying it.</li>
          </ul>
        </Card>

        <Card title="What Continuity Engine Is Not">
          <ul className="space-y-2">
            <li>Not journaling.</li>
            <li>Not therapy.</li>
            <li>Not a motivational assistant.</li>
            <li>Not a place to dump noise without action.</li>
          </ul>
        </Card>
      </section>

      <section className="grid gap-5 md:grid-cols-3">
        <Card title="How To Use It">
          <ol className="list-decimal space-y-2 pl-5">
            <li>Go to Session.</li>
            <li>Enter the trigger clearly.</li>
            <li>Confirm the distortion class.</li>
            <li>Define the next action.</li>
            <li>Save the result.</li>
          </ol>
        </Card>

        <Card title="What Continuity Means">
          <p>
            Continuity is your alignment score across perception, identity,
            intention, and action. It reflects whether your responses are
            becoming more stable, more accurate, and more executable over time.
          </p>
        </Card>

        <Card title="What Not To Do">
          <ul className="space-y-2">
            <li>Do not lie in the input.</li>
            <li>Do not skip the action step.</li>
            <li>Do not treat clarity as performance.</li>
            <li>Do not expect the system to work without execution.</li>
          </ul>
        </Card>
      </section>

      <section className="grid gap-5 md:grid-cols-2">
        <Card title="Recommended First Path">
          <p>
            Start with <span className="text-zinc-200">Session</span>. Submit one
            real trigger. Save it. Then open{" "}
            <span className="text-zinc-200">Dashboard</span> to inspect continuity
            and <span className="text-zinc-200">Logs</span> to review the record.
          </p>
        </Card>

        <Card title="Current Runtime Snapshot">
          {recentSessions.length === 0 ? (
            <p>No sessions recorded yet. The system is initialized and ready.</p>
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
