// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VANTA",
  description: "VANTA — deterministic clarity and execution OS",
};

const nav = [
  { href: "/", label: "Home" },
  { href: "/session", label: "Session" },
  { href: "/logs", label: "Logs" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/settings", label: "Settings" },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <header className="border-b">
          <div className="mx-auto flex max-w-5xl items-center justify-between p-4">
            <div className="font-semibold">VANTA</div>
            <nav className="flex flex-wrap gap-3 text-sm">
              {nav.map((item) => (
                <a key={item.href} href={item.href} className="underline">
                  {item.label}
                </a>
              ))}
            </nav>
          </div>
        </header>

        <div className="mx-auto max-w-5xl">{children}</div>
      </body>
    </html>
  );
}
