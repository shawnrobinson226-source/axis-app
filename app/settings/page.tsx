// /app/settings/page.tsx
export const runtime = "nodejs";

import ResetButton from "./reset-button";

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

export default function SettingsPage() {
  return (
    <main style={{ padding: 24, maxWidth: 720 }}>
      <h1 style={{ marginBottom: 8 }}>Settings</h1>

      <p style={{ marginTop: 0, opacity: 0.8 }}>
        Starter Pack controls and system utilities.
      </p>

      <Card title="Reset Logs">
        <div style={{ opacity: 0.9, lineHeight: 1.5 }}>
          This deletes all stored session entries.
        </div>

        <div style={{ marginTop: 8, fontSize: 13, opacity: 0.7 }}>
          Use this if you want to clear the dataset and start fresh.
          This action cannot be undone.
        </div>

        <div style={{ marginTop: 12 }}>
          <ResetButton />
        </div>
      </Card>

      <Card title="System Notes">
        <ul style={{ margin: 0, paddingLeft: 18, opacity: 0.9, lineHeight: 1.5 }}>
          <li>Deterministic engine.</li>
          <li>No predictive behavior.</li>
          <li>No external integrations.</li>
          <li>You remain the decision authority.</li>
        </ul>

        <div style={{ marginTop: 10, fontSize: 12, opacity: 0.7 }}>
          V1 focuses on clarity, repeatability, and structural stability.
        </div>
      </Card>
    </main>
  );
}
