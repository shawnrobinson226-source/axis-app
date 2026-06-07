"use client";

import { useEffect, useState, useTransition } from "react";
import {
  type SessionOutcome,
  type SessionLogRow,
} from "@/app/session/actions";
import { getOrCreateOperatorId } from "@/lib/operator/client";
import { PATTERN_METADATA } from "@/lib/patterns/registry";

function buttonStyle(primary = false) {
  return {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.2)",
    background: primary ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.03)",
    color: "inherit",
    textDecoration: "none",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 500,
  } as const;
}

function formatTime(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
}

function resolvePatternLabel(fractureId: string): string {
  const meta = PATTERN_METADATA[fractureId as keyof typeof PATTERN_METADATA];
  return meta?.userLabel ?? fractureId;
}

function formatOutcome(value: SessionOutcome) {
  switch (value) {
    case "reduced":
      return "Reduced";
    case "unresolved":
      return "Unresolved";
    case "escalated":
      return "Escalated";
    default:
      return value;
  }
}

type LogsClientProps = {
  initialRows: SessionLogRow[];
  initialLimit?: number;
};

export default function LogsClient({
  initialRows,
  initialLimit = 50,
}: LogsClientProps) {
  const [operatorId] = useState(() => {
    if (typeof window === "undefined") return "";
    return getOrCreateOperatorId();
  });
  const [limit, setLimit] = useState(initialLimit);
  const [rows, setRows] = useState<SessionLogRow[]>(initialRows);
  const [msg, setMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function load(nextLimit = limit) {
    setMsg(null);
    if (!operatorId) {
      setRows([]);
      return;
    }

    try {
      const response = await fetch(`/api/v1/logs?limit=${nextLimit}`, {
        method: "GET",
        headers: {
          "x-operator-id": operatorId,
        },
        cache: "no-store",
      });

      const body = (await response.json()) as {
        ok?: boolean;
        data?: { logs?: SessionLogRow[] };
        error?: string;
      };

      if (!response.ok || !body.ok) {
        throw new Error(body.error ?? "Failed to load session logs.");
      }

      setRows(body.data?.logs ?? []);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Failed to load session logs.");
    }
  }

  useEffect(() => {
    void load(initialLimit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [operatorId]);

  function apply() {
    startTransition(async () => {
      await load(limit);
    });
  }

  function refresh() {
    startTransition(async () => {
      await load(limit);
    });
  }

  function resetAll() {
    const confirmed = window.confirm(
      "Delete all session history? This cannot be undone.",
    );

    if (!confirmed) return;

    setMsg(null);
    startTransition(async () => {
      try {
        if (!operatorId) {
          throw new Error("Operator identity is required.");
        }

        const response = await fetch("/api/v1/reset", {
          method: "POST",
          headers: {
            "x-operator-id": operatorId,
          },
        });

        const body = (await response.json()) as { ok?: boolean; error?: string };
        if (!response.ok || !body.ok) {
          throw new Error(body.error ?? "Reset failed.");
        }

        await load(limit);
        setMsg("All sessions were cleared.");
      } catch (e) {
        setMsg(e instanceof Error ? e.message : "Reset failed.");
      }
    });
  }

  return (
    <main style={{ padding: 24, maxWidth: 1280 }}>
      <h1 style={{ marginBottom: 8 }}>Logs</h1>
      <p style={{ marginTop: 0, opacity: 0.8 }}>
        Review your recent sessions and outcomes.
      </p>

      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          flexWrap: "wrap",
          marginTop: 16,
        }}
      >
        <label
          htmlFor="limit"
          style={{ display: "flex", gap: 8, alignItems: "center" }}
        >
          <span>Show</span>
          <input
            id="limit"
            name="limit"
            type="number"
            min={1}
            max={200}
            value={limit}
            onChange={(e) =>
              setLimit(Math.max(1, Math.min(200, Number(e.target.value) || 1)))
            }
            style={{
              width: 96,
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.2)",
              background: "rgba(255,255,255,0.03)",
              color: "inherit",
            }}
          />
          <span>sessions</span>
        </label>

        <button
          type="button"
          onClick={apply}
          style={buttonStyle(true)}
          disabled={isPending}
        >
          Apply
        </button>

        <button
          type="button"
          onClick={refresh}
          style={buttonStyle(false)}
          disabled={isPending}
        >
          Refresh
        </button>

        <button
          type="button"
          onClick={resetAll}
          style={buttonStyle(false)}
          disabled={isPending}
        >
          Reset (Delete All)
        </button>
      </div>

      {msg ? <div style={{ marginTop: 12, opacity: 0.9 }}>{msg}</div> : null}

      <section
        style={{
          marginTop: 18,
          borderRadius: 14,
          border: "1px solid rgba(255,255,255,0.12)",
          background: "rgba(255,255,255,0.02)",
          overflow: "hidden",
        }}
      >
        {rows.length === 0 ? (
          <div style={{ padding: 20 }}>
            <div style={{ fontWeight: 700 }}>No sessions logged yet.</div>
            <div style={{ marginTop: 8, opacity: 0.78 }}>
              Each session records the trigger, pattern, next action, and outcome.
            </div>
            <div style={{ marginTop: 16 }}>
              <a href="/session" style={buttonStyle(true)}>
                Start Session →
              </a>
            </div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: 760,
              }}
            >
              <thead>
                <tr>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "16px 18px",
                      borderBottom: "1px solid rgba(255,255,255,0.1)",
                      fontSize: 13,
                      opacity: 0.8,
                      width: 190,
                    }}
                  >
                    Date
                  </th>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "16px 18px",
                      borderBottom: "1px solid rgba(255,255,255,0.1)",
                      fontSize: 13,
                      opacity: 0.8,
                      width: 140,
                    }}
                  >
                    Pattern
                  </th>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "16px 18px",
                      borderBottom: "1px solid rgba(255,255,255,0.1)",
                      fontSize: 13,
                      opacity: 0.8,
                      width: 180,
                    }}
                  >
                    Outcome
                  </th>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "16px 18px",
                      borderBottom: "1px solid rgba(255,255,255,0.1)",
                      fontSize: 13,
                      opacity: 0.8,
                      width: 100,
                    }}
                  >
                    Next Action
                  </th>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "16px 18px",
                      borderBottom: "1px solid rgba(255,255,255,0.1)",
                      fontSize: 13,
                      opacity: 0.8,
                      width: 320,
                    }}
                  >
                    Trigger
                  </th>
                </tr>
              </thead>

              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td
                      style={{
                        verticalAlign: "top",
                        padding: "16px 18px",
                        borderBottom: "1px solid rgba(255,255,255,0.06)",
                        opacity: 0.9,
                        lineHeight: 1.45,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {formatTime(row.created_at)}
                    </td>

                    <td
                      style={{
                        verticalAlign: "top",
                        padding: "16px 18px",
                        borderBottom: "1px solid rgba(255,255,255,0.06)",
                        fontWeight: 700,
                        lineHeight: 1.4,
                      }}
                    >
                      {resolvePatternLabel(row.fracture_id)}
                    </td>

                    <td
                      style={{
                        verticalAlign: "top",
                        padding: "16px 18px",
                        borderBottom: "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      {formatOutcome(row.outcome)}
                    </td>

                    <td
                      style={{
                        verticalAlign: "top",
                        padding: "16px 18px",
                        borderBottom: "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      {row.next_action}
                    </td>

                    <td
                      style={{
                        verticalAlign: "top",
                        padding: "16px 18px",
                        borderBottom: "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      {row.trigger}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
