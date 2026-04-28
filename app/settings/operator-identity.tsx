"use client";

import { useState } from "react";
import { getOrCreateOperatorId } from "@/lib/operator/client";

export default function OperatorIdentity() {
  const [operatorId] = useState(() => {
    if (typeof window === "undefined") return "";
    return getOrCreateOperatorId();
  });

  return (
    <input
      readOnly
      value={operatorId}
      aria-label="Operator identity"
      style={{
        width: "100%",
        marginTop: 8,
        padding: "10px 12px",
        borderRadius: 10,
        border: "1px solid rgba(255,255,255,0.2)",
        background: "rgba(255,255,255,0.03)",
        color: "inherit",
      }}
    />
  );
}
