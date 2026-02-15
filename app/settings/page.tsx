"use client";

import { useTransition } from "react";
import { clearLogs } from "@/app/session/actions";

export default function SettingsPage() {
  const [isPending, startTransition] = useTransition();

  function handleClear() {
    startTransition(async () => {
      await clearLogs();
      window.location.reload();
    });
  }

  return (
    <main className="min-h-screen p-6">
      <h1 className="text-2xl font-semibold">VANTA — Settings</h1>
      <p className="mt-2 text-sm opacity-80">
        Controlled settings (local dev foundation).
      </p>

      <div className="mt-6 rounded-lg border p-4">
        <h2 className="text-lg font-medium">Logs</h2>
        <p className="mt-2 text-sm opacity-80">
          This clears <span className="font-mono">data/logs.json</span>.
        </p>

        <button
          onClick={handleClear}
          disabled={isPending}
          className="mt-4 rounded border px-3 py-2 text-sm"
        >
          {isPending ? "Clearing..." : "Clear logs"}
        </button>

        <p className="mt-3 text-xs opacity-70">
          Note: Local file persistence.
        </p>
      </div>
    </main>
  );
}
