// /app/settings/page.tsx
export const runtime = "nodejs";

import packageJson from "../../package.json";
import OperatorIdentity from "./operator-identity";
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
        Identity, execution records, and AXIS controls.
      </p>

      <Card title="Operator Identity">
        <div style={{ opacity: 0.9, lineHeight: 1.5 }}>
          Your permanent AXIS identity and optional display name.
        </div>
        <OperatorIdentity />
      </Card>

      <Card title="System Version">
        <div style={{ opacity: 0.9, lineHeight: 1.5 }}>
          {packageJson.version}
        </div>
      </Card>

      <Card title="Clear Execution Record">
        <div style={{ opacity: 0.9, lineHeight: 1.5 }}>
          This deletes all pattern checks and execution records.
        </div>

        <div style={{ marginTop: 8, fontSize: 13, opacity: 0.7 }}>
          Use this only when you intend to permanently clear your recorded evidence.
          This action cannot be undone.
        </div>

        <div style={{ marginTop: 12 }}>
          <ResetButton />
        </div>
      </Card>

      <Card title="AXIS Operating Rules">
        <ul style={{ margin: 0, paddingLeft: 18, opacity: 0.9, lineHeight: 1.5 }}>
          <li>AXIS identifies patterns, supports deliberate action, and records evidence.</li>
          <li>No diagnosis.</li>
          <li>No hidden decisions.</li>
          <li>You remain the decision authority.</li>
        </ul>

        <div style={{ marginTop: 10, fontSize: 12, opacity: 0.7 }}>
          AXIS structures the process. The operator retains authority.
        </div>
      </Card>
    </main>
  );
}
