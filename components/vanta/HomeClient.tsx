"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getDashboardState, getVolatilityBand } from "@/app/session/actions";
import StateCheckPanel from "@/components/vanta/StateCheckPanel";

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

function formatDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
}

function scoreTone(score: number) {
  if (score < 35) return "#fca5a5";
  if (score < 60) return "#fcd34d";
  if (score < 80) return "#f4f4f5";
  return "#86efac";
}

function deltaText(before: number, after: number) {
  const delta = after - before;
  return delta > 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1);
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

export default function HomeClient() {
  const [state, setState] = useState<HomeState | null>(null);
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
        // silent in v1
      }
    })();
  }, []);

  if (!state) {
    return (
      <main style={{ padding: 24, maxWidth: 1100 }}>
        <h1 style={{ marginBottom: 8 }}>VANTA</h1>
        <p style={{ marginTop: 0, opacity: 0.8 }}>Loading kernel state…</p>
      </main>
    );
  }

  const { continuity, activeFracturesCount, recentSessions } = state;

  return (
    <main style={{ padding: 24, maxWidth: 1100 }}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
          alignItems: "flex-start",
        }}
      >
        <div>
          <h1 style={{ marginBottom: 8 }}>VANTA</h1>
          <p style={{ marginTop: 0, opacity: 0.8, maxWidth: 720, lineHeight: 1.6 }}>
            Deterministic distortion reduction engine. Reduce distortion, restore
            continuity, and execute the next aligned action.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
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
            Start Session
          </Link>

          <Link
            href="/dashboard"
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
            Dashboard
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
      </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 12,
          marginTop: 18,
        }}
      >
        <Card title="Continuity Score">
          <div
            style={{
              fontSize: 42,
              fontWeight: 700,
              color: scoreTone(continuity.continuity_score),
            }}
          >
            {Math.round(continuity.continuity_score)}
          </div>
          <div style={{ marginTop: 8, fontSize: 13, opacity: 0.72 }}>
            Updated {formatDate(continuity.updated_at)}
          </div>
        </Card>

        <Card title="Active Fractures">
          <div style={{ fontSize: 42, fontWeight: 700 }}>
            {activeFracturesCount}
          </div>
          <div style={{ marginTop: 8, fontSize: 13, opacity: 0.72 }}>
            Unresolved or escalated sessions still requiring correction.
          </div>
        </Card>

        <Card title="30-Day Volatility">
          <div style={{ fontSize: 34, fontWeight: 700, textTransform: "capitalize" }}>
            {volatilityBand}
          </div>
          <div style={{ marginTop: 8, fontSize: 13, opacity: 0.72 }}>
            Derived from clarity and continuity variance.
          </div>
        </Card>
      </div>

      <div style={{ marginTop: 18 }}>
        <StateCheckPanel />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.2fr 0.8fr",
          gap: 16,
          marginTop: 18,
        }}
      >
        <Card title="Recent Sessions">
          {recentSessions.length === 0 ? (
            <div style={{ opacity: 0.75 }}>No sessions logged yet.</div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {recentSessions.slice(0, 3).map((session) => (
                <div
                  key={session.id}
                  style={{
                    padding: 12,
                    borderRadius: 10,
                    border: "1px solid rgba(255,255,255,0.08)",
                    background: "rgba(255,255,255,0.02)",
                  }}
                >
                  <div style={{ fontSize: 12, opacity: 0.68 }}>
                    {formatDate(session.created_at)}
                  </div>
                  <div style={{ marginTop: 6, lineHeight: 1.5 }}>{session.trigger}</div>
                  <div
                    style={{
                      marginTop: 8,
                      display: "flex",
                      gap: 12,
                      flexWrap: "wrap",
                      fontSize: 13,
                      opacity: 0.82,
                    }}
                  >
                    <span>Class: {session.distortion_class}</span>
                    <span>Outcome: {session.outcome}</span>
                    <span>Clarity: {session.clarity_rating}</span>
                    <span>
                      Δ {deltaText(session.continuity_before, session.continuity_after)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="System Intent">
          <div style={{ lineHeight: 1.7, opacity: 0.9 }}>
            <div>Detect distortion.</div>
            <div>Map structural fracture.</div>
            <div>Apply reduction protocol.</div>
            <div>Restore continuity.</div>
            <div>Track alignment over time.</div>
          </div>
        </Card>
      </div>
    </main>
  );
}
