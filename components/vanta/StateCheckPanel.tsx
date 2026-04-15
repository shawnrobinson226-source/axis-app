"use client";

import { useEffect, useState } from "react";
import { getDashboardState } from "@/app/session/actions";

type RuntimeState = {
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
};

function formatDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
}

function barWidth(value: number) {
  return `${Math.max(0, Math.min(100, value))}%`;
}

export default function StateCheckPanel() {
  const [state, setState] = useState<RuntimeState | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const result = await getDashboardState("op_legacy");
        setState({
          continuity: result.continuity,
          activeFracturesCount: result.activeFracturesCount,
        });
      } catch {
        // keep silent in v1
      }
    })();
  }, []);

  if (!state) {
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
        <h2 style={{ margin: 0, fontSize: 16 }}>Runtime State</h2>
        <p style={{ marginTop: 10, opacity: 0.75 }}>Loading continuity state…</p>
      </section>
    );
  }

  const { continuity, activeFracturesCount } = state;

  const dimensions = [
    { label: "Perception", value: continuity.perception_alignment },
    { label: "Identity", value: continuity.identity_alignment },
    { label: "Intention", value: continuity.intention_alignment },
    { label: "Action", value: continuity.action_alignment },
  ];

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
      <h2 style={{ margin: 0, fontSize: 16 }}>Runtime State</h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 12,
          marginTop: 14,
        }}
      >
        <div
          style={{
            padding: 12,
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(255,255,255,0.02)",
          }}
        >
          <div style={{ fontSize: 12, opacity: 0.7 }}>Continuity Score</div>
          <div style={{ fontSize: 28, fontWeight: 700, marginTop: 6 }}>
            {Math.round(continuity.continuity_score)}
          </div>
        </div>

        <div
          style={{
            padding: 12,
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(255,255,255,0.02)",
          }}
        >
          <div style={{ fontSize: 12, opacity: 0.7 }}>Active Fractures</div>
          <div style={{ fontSize: 28, fontWeight: 700, marginTop: 6 }}>
            {activeFracturesCount}
          </div>
        </div>

        <div
          style={{
            padding: 12,
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(255,255,255,0.02)",
          }}
        >
          <div style={{ fontSize: 12, opacity: 0.7 }}>Last Update</div>
          <div style={{ fontSize: 14, fontWeight: 600, marginTop: 8, lineHeight: 1.4 }}>
            {formatDate(continuity.updated_at)}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
        {dimensions.map((dimension) => (
          <div key={dimension.label}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 10,
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
    </section>
  );
}
