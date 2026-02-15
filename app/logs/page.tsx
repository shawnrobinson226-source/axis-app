// app/logs/page.tsx
export const dynamic = "force-dynamic";

import { listLogs } from "@/lib/storage/logStore";
import { clearLogs } from "@/app/session/actions";

export default async function LogsPage() {
  const logs = await listLogs(50);

  return (
    <main className="min-h-screen p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">VANTA — Logs</h1>
          <p className="mt-2 text-sm opacity-80">
            File-based JSON logs (local). Newest first.
          </p>
        </div>

        <form action={clearLogs}>
          <button className="rounded border px-3 py-2 text-sm" type="submit">
            Clear logs
          </button>
        </form>
      </div>

      <div className="mt-4">
        <a className="underline text-sm" href="/logs">
          Refresh
        </a>
      </div>

      {logs.length === 0 ? (
        <div className="mt-6 rounded-lg border p-4">
          <p className="text-sm opacity-70">
            No logs yet. Go to <a className="underline" href="/session">/session</a> and log a run.
          </p>
        </div>
      ) : (
        <ul className="mt-6 grid gap-2 text-sm">
          {logs.map((l) => (
            <li key={l.id} className="rounded border p-3">
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs opacity-70">
                <span className="font-mono">{l.timestamp}</span>
                <span className="font-mono">{l.type}</span>
                {l.stateId && <span className="font-mono">state:{l.stateId}</span>}
                {l.modeId && <span className="font-mono">mode:{l.modeId}</span>}
                {l.toolId && <span className="font-mono">tool:{l.toolId}</span>}
                {typeof l.level === "number" && (
                  <span className="font-mono">level:{l.level}</span>
                )}
              </div>
              <div className="mt-1">{l.message}</div>
              {l.tags?.length ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {l.tags.map((t) => (
                    <span key={t} className="rounded border px-2 py-0.5 text-xs opacity-80">
                      {t}
                    </span>
                  ))}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
