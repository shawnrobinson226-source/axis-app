"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getDashboardState, getVolatilityBand } from "@/app/session/actions";

type DashboardClientState = {
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

function formatDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
}

function barWidth(value: number) {
  return `${Math.max(0, Math.min(100, value))}%`;
}

function continuityTone(score: number) {
  if (score < 35) return "#fca5a5";
  if (score < 60) return "#fcd34d";
  if (score < 80) return "#f4f4f5";
  return "#86efac";
}

function deltaText(before: number, after: number) {
  const delta = after - before;
  return delta > 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1);
}

function Tile({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string;
  subtitle?: string;
}) {
  return (
    <div
      style={{
        padding: 16,
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(255,255,255,0.02)",
      }}
    >
      <div style={{ fontSize: 12, opacity: 0.7 }}>{title}</div>
      <div
        style={{
          fontSize: 22,
          fontWeight: 700,
          marginTop: 6,
          wordBreak: "break-word",
        }}
      >
        {value}
      </div>
      {subtitle ? (
        <div style={{ marginTop: 8, fontSize: 12, opacity: 0.7, lineHeight: 1.4 }}>
          {subtitle}
        </div>
      ) : null}
    </div>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      style={{
        marginTop: 16,
        padding: 16,
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(255,255,255,0.02)",
      }}
    >
      <h2 style={{ margin: 0, fontSize: 16 }}>{title}</h2>
      <div style={{ marginTop: 10 }}>{children}</div>
    </section>
  );
}

export default function DashboardClient() {
  const [state, setState] = useState<DashboardClientState | null>(null);
  const [volatilityBand, setVolatilityBand] = useState("low");

  useEffect(() => {
    void (async () => {
      try {
        const [dashboard, volatility] = await Promise.all([
          getDashboardState("op_legacy"),
          getVolatilityBand("op_legacy"),
        ]);
        setState(dashboard);
        setVolatilityBand(volatility);
      } catch {
        // keep quiet in v1
      }
    })();
  }, []);

  if (!state) {
    return (
      <main style={{ padding: 24, maxWidth: 1100 }}>
        <h1 style={{ marginBottom: 8 }}>Dashboard</h1>
        <p style={{ marginTop: 0, opacity: 0.8 }}>Loading runtime state…</p>
      </main>
    );
  }

  const { continuity, activeFracturesCount, recentSessions } = state;

  const dimensions = [
    { label: "Perception", value: continuity.perception_alignment },
    { label: "Identity", value: continuity.identity_alignment },
    { label: "Intention", value: continuity.intention_alignment },
    { label: "Action", value: continuity.action_alignment },
  ];

  return (
    <main style={{ padding: 24, maxWidth: 1100 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1 style={{ marginBottom: 8 }}>Dashboard</h1>
          <p style={{ marginTop: 0, opacity: 0.8 }}>
            Runtime status report for the locked V1 kernel.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <Link
            href="/session"
            style={{
              display: "inline-flex",
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.2)",
              background: "rgba(255,255,255,0.08)",
              color: "inherit",
              textDecoration: "none",
            }}
          >
            New Session
          </Link>

          <Link
            href="/logs"
            style={{
              display: "inline-flex",
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.2)",
              background: "rgba(255,255,255,0.03)",
              color: "inherit",
              textDecoration: "none",
            }}
          >
            Logs
          </Link>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 12,
          marginTop: 16,
        }}
      >
        <Tile
          title="Continuity Score"
          value={String(Math.round(continuity.continuity_score))}
          subtitle="Current structural coherence across four alignment domains."
        />
        <Tile
          title="Active Fractures"
          value={String(activeFracturesCount)}
          subtitle="Unresolved or escalated sessions still carrying instability."
        />
        <Tile
          title="30-Day Volatility"
          value={volatilityBand}
          subtitle="Derived stability band from recent clarity and continuity variance."
        />
        <Tile
          title="Last Update"
          value={formatDate(continuity.updated_at)}
          subtitle="Most recent continuity state write."
        />
      </div>

      <Card title="Alignment Dimensions">
        <div style={{ display: "grid", gap: 16 }}>
          {dimensions.map((dimension) => (
            <div key={dimension.label}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  marginBottom: 6,
                  fontSize: 14,
                }}
              >
                <span>{dimension.label}</span>
                <span>{Math.round(dimension.value)}</span>
              </div>

              <div
                style={{
                  height: 10,
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.08)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: barWidth(dimension.value),
                    height: "100%",
                    borderRadius: 999,
                    background: "rgba(255,255,255,0.85)",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Continuity Status">
        <div style={{ lineHeight: 1.6, opacity: 0.92 }}>
          <div>
            <b>Current Score:</b>{" "}
            <span style={{ color: continuityTone(continuity.continuity_score) }}>
              {Math.round(continuity.continuity_score)}
            </span>
          </div>
          <div style={{ marginTop: 8 }}>
            This score is diagnostic, not motivational. It tracks alignment across
            perception, identity, intention, and action.
          </div>
        </div>
      </Card>

      <Card title="Recent Sessions">
        {recentSessions.length === 0 ? (
          <div style={{ opacity: 0.75 }}>No sessions logged yet.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                marginTop: 6,
                minWidth: 820,
              }}
            >
              <thead>
                <tr>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "10px 8px",
                      fontSize: 12,
                      opacity: 0.7,
                      borderBottom: "1px solid rgba(255,255,255,0.12)",
                    }}
                  >
                    Time
                  </th>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "10px 8px",
                      fontSize: 12,
                      opacity: 0.7,
                      borderBottom: "1px solid rgba(255,255,255,0.12)",
                    }}
                  >
                    Trigger
                  </th>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "10px 8px",
                      fontSize: 12,
                      opacity: 0.7,
                      borderBottom: "1px solid rgba(255,255,255,0.12)",
                    }}
                  >
                    Class
                  </th>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "10px 8px",
                      fontSize: 12,
                      opacity: 0.7,
                      borderBottom: "1px solid rgba(255,255,255,0.12)",
                    }}
                  >
                    Outcome
                  </th>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "10px 8px",
                      fontSize: 12,
                      opacity: 0.7,
                      borderBottom: "1px solid rgba(255,255,255,0.12)",
                    }}
                  >
                    Clarity
                  </th>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "10px 8px",
                      fontSize: 12,
                      opacity: 0.7,
                      borderBottom: "1px solid rgba(255,255,255,0.12)",
                    }}
                  >
                    Continuity Δ
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentSessions.map((session) => (
                  <tr key={session.id}>
                    <td
                      style={{
                        padding: "12px 8px",
                        borderBottom: "1px solid rgba(255,255,255,0.06)",
                        verticalAlign: "top",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {formatDate(session.created_at)}
                    </td>
                    <td
                      style={{
                        padding: "12px 8px",
                        borderBottom: "1px solid rgba(255,255,255,0.06)",
                        verticalAlign: "top",
                        lineHeight: 1.45,
                      }}
                    >
                      {session.trigger}
                    </td>
                    <td
                      style={{
                        padding: "12px 8px",
                        borderBottom: "1px solid rgba(255,255,255,0.06)",
                        verticalAlign: "top",
                        textTransform: "capitalize",
                      }}
                    >
                      {session.distortion_class}
                    </td>
                    <td
                      style={{
                        padding: "12px 8px",
                        borderBottom: "1px solid rgba(255,255,255,0.06)",
                        verticalAlign: "top",
                        textTransform: "capitalize",
                      }}
                    >
                      {session.outcome}
                    </td>
                    <td
                      style={{
                        padding: "12px 8px",
                        borderBottom: "1px solid rgba(255,255,255,0.06)",
                        verticalAlign: "top",
                      }}
                    >
                      {session.clarity_rating}
                    </td>
                    <td
                      style={{
                        padding: "12px 8px",
                        borderBottom: "1px solid rgba(255,255,255,0.06)",
                        verticalAlign: "top",
                      }}
                    >
                      {deltaText(session.continuity_before, session.continuity_after)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </main>
  );
}
