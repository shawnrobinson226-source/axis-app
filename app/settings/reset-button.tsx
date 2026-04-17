"use client";

import { useState, useTransition } from "react";
import { getOrCreateOperatorId } from "@/lib/operator/client";

export default function ResetButton() {
  const [isPending, startTransition] = useTransition();
  const [operatorId] = useState(() => {
    if (typeof window === "undefined") return "";
    return getOrCreateOperatorId();
  });

  function handleReset() {
    const confirmed = window.confirm(
      "Delete all session history? This cannot be undone.",
    );

    if (!confirmed) return;

    startTransition(async () => {
      try {
        if (!operatorId) {
          throw new Error("Operator identity is required.");
        }

        const response = await fetch("/api/v1/reset", {
          method: "POST",
          headers: {
            "x-operator-id": operatorId,
          },
        });

        const body = (await response.json()) as { ok?: boolean; error?: string };
        if (!response.ok || !body.ok) {
          throw new Error(body.error ?? "Reset failed.");
        }

        window.location.reload();
      } catch (error) {
        console.error("Reset failed:", error);
        window.alert("Reset failed. Check console for details.");
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleReset}
      disabled={isPending}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "10px 14px",
        borderRadius: 10,
        border: "1px solid rgba(255,255,255,0.2)",
        background: "rgba(255,255,255,0.03)",
        color: "inherit",
        cursor: isPending ? "not-allowed" : "pointer",
        opacity: isPending ? 0.7 : 1,
      }}
    >
      {isPending ? "Resetting…" : "Reset All Session Data"}
    </button>
  );
}
