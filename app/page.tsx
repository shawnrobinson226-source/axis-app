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
              When you&apos;re stuck, name it.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-zinc-300">
              Turn any situation into a clear next action—and track if it worked.
            </p>
          </div>
          <div className="max-w-2xl space-y-2 text-base leading-7 text-zinc-300">
            <p>Describe what&apos;s happening.</p>
            <p>AXIS classifies it.</p>
            <p>You decide what to do next.</p>
            <p>Every session builds a record.</p>
          </div>
          <Link
            href="/session"
            className="inline-flex rounded-xl bg-zinc-100 px-5 py-3 text-sm font-medium text-zinc-900 transition hover:bg-white"
          >
            Start Session →
          </Link>
        </header>

        <section className="border-t border-zinc-800 pt-6">
          <p className="max-w-2xl text-sm leading-6 text-zinc-400">
            No prediction. No automation. No hidden decisions. You stay in control.
          </p>
        </section>
      </main>
    </>
  );
}
