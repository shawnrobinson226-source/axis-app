"use client";

import { useEffect, useState, useTransition } from "react";
import { getOrCreateOperatorId } from "@/lib/operator/client";

export default function OperatorIdentity() {
  const [operatorId] = useState(() => {
    if (typeof window === "undefined") return "";
    return getOrCreateOperatorId();
  });
  const [displayName, setDisplayName] = useState("Operator");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!operatorId) return;

    void (async () => {
      try {
        const response = await fetch("/api/v1/operator-profile", {
          method: "GET",
          headers: {
            "x-operator-id": operatorId,
          },
          cache: "no-store",
        });

        const body = (await response.json()) as {
          ok?: boolean;
          data?: {
            display_name?: string | null;
          };
        };

        if (!response.ok || !body.ok) return;
        setDisplayName(body.data?.display_name?.trim() || "Operator");
      } catch {
        setDisplayName("Operator");
      }
    })();
  }, [operatorId]);

  function saveDisplayName() {
    setMessage("");
    startTransition(async () => {
      try {
        if (!operatorId) {
          throw new Error("Operator identity is required.");
        }

        const cleanDisplayName = displayName.trim();
        const response = await fetch("/api/v1/operator-profile", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-operator-id": operatorId,
          },
          body: JSON.stringify({
            display_name: cleanDisplayName === "Operator" ? null : cleanDisplayName,
          }),
        });

        const body = (await response.json()) as {
          ok?: boolean;
          data?: {
            display_name?: string | null;
          };
          error?: string;
        };

        if (!response.ok || !body.ok) {
          throw new Error(body.error ?? "Failed to save display name.");
        }

        setDisplayName(body.data?.display_name?.trim() || "Operator");
        setMessage("Display name saved.");
      } catch (error) {
        setMessage(
          error instanceof Error ? error.message : "Failed to save display name.",
        );
      }
    });
  }

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <label style={{ display: "grid", gap: 8 }}>
        <span style={{ fontSize: 13, opacity: 0.78 }}>Permanent ID</span>
        <input
          readOnly
          value={operatorId}
          aria-label="Permanent operator identity"
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.2)",
            background: "rgba(255,255,255,0.03)",
            color: "inherit",
          }}
        />
      </label>

      <label style={{ display: "grid", gap: 8 }}>
        <span style={{ fontSize: 13, opacity: 0.78 }}>Display Name</span>
        <input
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          aria-label="Display name"
          placeholder="Operator"
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.2)",
            background: "rgba(255,255,255,0.03)",
            color: "inherit",
          }}
        />
      </label>

      <p style={{ margin: 0, fontSize: 13, opacity: 0.72 }}>
        Your display name may change. Your permanent AXIS identity does not.
      </p>

      <div>
        <button
          type="button"
          onClick={saveDisplayName}
          disabled={isPending}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.2)",
            background: "rgba(255,255,255,0.08)",
            color: "inherit",
            cursor: isPending ? "not-allowed" : "pointer",
            opacity: isPending ? 0.7 : 1,
          }}
        >
          {isPending ? "Saving..." : "Save Display Name"}
        </button>
      </div>

      {message ? <p style={{ margin: 0, fontSize: 13 }}>{message}</p> : null}
    </div>
  );
}
