"use client";

import { useMemo } from "react";

type Props = {
  onBlockChange?: (blocked: boolean) => void;
};

type PreflightStatus = "pass" | "warn" | "block";

function getStatus(
  stability: number,
  hasReference: boolean,
  impact: number,
): PreflightStatus {
  if (stability < 3 || !hasReference || impact > 7) return "block";
  if (stability < 5 || impact > 5) return "warn";
  return "pass";
}

function getMessages(
  stability: number,
  hasReference: boolean,
  impact: number,
): string[] {
  const messages: string[] = [];

  if (stability < 3) {
    messages.push("Low stability: session is blocked until stability improves.");
  } else if (stability < 5) {
    messages.push("Reduced stability: keep the session narrow and factual.");
  }

  if (!hasReference) {
    messages.push("No grounded reference: verify against a factual anchor first.");
  }

  if (impact > 7) {
    messages.push("High impact: avoid irreversible actions from this session.");
  } else if (impact > 5) {
    messages.push("Moderate impact: keep the next action small and reversible.");
  }

  return messages;
}

export default function PreflightChecklist({ onBlockChange }: Props) {
  const stability = 5;
  const hasReference = true;
  const impact = 3;

  const status = useMemo(
    () => getStatus(stability, hasReference, impact),
    [stability, hasReference, impact],
  );

  const messages = useMemo(
    () => getMessages(stability, hasReference, impact),
    [stability, hasReference, impact],
  );

  const blocked = status === "block";
  onBlockChange?.(blocked);

  const statusLabel =
    status === "pass" ? "PASS" : status === "warn" ? "WARN" : "BLOCK";

  const statusClasses =
    status === "pass"
      ? "border-emerald-600/30 bg-emerald-950/30 text-emerald-200"
      : status === "warn"
        ? "border-amber-600/30 bg-amber-950/30 text-amber-200"
        : "border-red-600/30 bg-red-950/30 text-red-200";

  return (
    <section className="space-y-4 border p-4 bg-zinc-900 text-white">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Pre-Flight Check</h2>
          <p className="text-sm text-zinc-300">
            Runtime guards run before the session engine. This does not change the locked loop.
          </p>
        </div>

        <div className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusClasses}`}>
          {statusLabel}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="block">
          <div className="mb-2 text-sm font-medium">Stability</div>
          <div className="mb-2 text-xs text-zinc-400">Sleep / stress / steadiness</div>
          <input
            type="number"
            name="stability"
            min="0"
            max="10"
            defaultValue={stability}
            required
            className="w-full p-2 bg-black text-white border"
          />
        </label>

        <label className="block">
          <div className="mb-2 text-sm font-medium">Reference Status</div>
          <div className="mb-2 text-xs text-zinc-400">Do you have a grounded external anchor?</div>
          <select
            name="reference"
            defaultValue={hasReference ? "yes" : "no"}
            className="w-full p-2 bg-black text-white border"
          >
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </label>

        <label className="block">
          <div className="mb-2 text-sm font-medium">Core Impact</div>
          <div className="mb-2 text-xs text-zinc-400">How much does this affect people / outcomes?</div>
          <input
            type="number"
            name="impact"
            min="0"
            max="10"
            defaultValue={impact}
            required
            className="w-full p-2 bg-black text-white border"
          />
        </label>
      </div>

      <div className="border p-3 bg-black">
        <div className="text-sm font-medium">Guard Result</div>
        {messages.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-300">
            Clear to proceed. Keep the next action specific and reversible.
          </p>
        ) : (
          <ul className="mt-2 list-disc ml-5 space-y-1 text-sm text-zinc-300">
            {messages.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
