import Link from "next/link";
import AxisBootScreen from "@/components/ui/AxisBootScreen";

export default function HomePage() {
  return (
    <>
      <AxisBootScreen />
      <main className="mx-auto flex max-w-4xl flex-col gap-10 px-6 py-16">
        <header className="space-y-6">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-zinc-500">
            AXIS
          </p>

          <div className="space-y-4">
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-zinc-50 md:text-5xl">
              The pattern ends when action changes.
            </h1>

            <p className="max-w-2xl text-lg leading-8 text-zinc-300">
              AXIS helps you identify the active pattern, interrupt it, and take one deliberate action.
            </p>
          </div>

          <div className="max-w-2xl space-y-2 text-base leading-7 text-zinc-300">
            <p>State what is happening.</p>
            <p>Identify the pattern.</p>
            <p>Choose one next action.</p>
            <p>Record the evidence.</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/session"
              className="inline-flex rounded-xl bg-zinc-100 px-5 py-3 text-sm font-medium text-zinc-900 transition hover:bg-white"
            >
              Run a Pattern Check →
            </Link>

            <Link
              href="/logs"
              className="inline-flex rounded-xl border border-zinc-700 px-5 py-3 text-sm font-medium text-zinc-200 transition hover:border-zinc-500 hover:text-white"
            >
              View Execution Record
            </Link>
          </div>
        </header>

        <section className="border-t border-zinc-800 pt-6">
          <p className="max-w-2xl text-sm leading-6 text-zinc-400">
            AXIS is a behavioral reflection and execution tool. It is not medical care, therapy, or crisis support.
          </p>
        </section>
      </main>
    </>
  );
}
