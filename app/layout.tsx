import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "AXIS",
  description: "AXIS — Continuity Engine",
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
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          background: "#0b0b0c",
          color: "rgba(255,255,255,0.92)",
        }}
      >
        <header
          style={{
            borderBottom: "1px solid rgba(255,255,255,0.10)",
            position: "sticky",
            top: 0,
            backdropFilter: "blur(8px)",
            background: "rgba(11,11,12,0.82)",
            zIndex: 20,
          }}
        >
          <div
            style={{
              margin: "0 auto",
              maxWidth: 1100,
              padding: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <Link
              href="/"
              style={{
                color: "inherit",
                textDecoration: "none",
                fontWeight: 700,
                letterSpacing: 0.4,
              }}
            >
              AXIS
            </Link>

            <nav
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 10,
                alignItems: "center",
              }}
            >
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    color: "inherit",
                    textDecoration: "none",
                    fontSize: 14,
                    padding: "8px 10px",
                    borderRadius: 10,
                    border: "1px solid rgba(255,255,255,0.10)",
                    background: "rgba(255,255,255,0.03)",
                  }}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>

        <div style={{ margin: "0 auto", maxWidth: 1100 }}>{children}</div>
      </body>
    </html>
  );
}
