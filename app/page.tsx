export default function HomePage() {
  return (
    <main className="min-h-screen p-6">
      <h1 className="text-2xl font-semibold">VANTA</h1>
      <p className="mt-2 text-sm opacity-80">
        Guardian of Becoming • Deterministic Execution OS
      </p>

      <div className="mt-6 grid gap-3 text-sm">
        <a className="underline" href="/session">Go to Session</a>
        <a className="underline" href="/logs">View Logs</a>
        <a className="underline" href="/dashboard">Open Dashboard</a>
        <a className="underline" href="/settings">Settings</a>
      </div>
    </main>
  );
}
