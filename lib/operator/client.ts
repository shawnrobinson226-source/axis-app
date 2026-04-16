const STORAGE_KEY = "vanta_operator_id";

function buildOperatorId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `op_${crypto.randomUUID()}`;
  }

  return `op_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function getStoredOperatorId() {
  if (typeof window === "undefined") return "";

  const raw = window.localStorage.getItem(STORAGE_KEY);
  return raw && raw.trim() ? raw.trim() : "";
}

export function getOrCreateOperatorId() {
  if (typeof window === "undefined") return "";

  const existing = getStoredOperatorId();
  if (existing) return existing;

  const next = buildOperatorId();
  window.localStorage.setItem(STORAGE_KEY, next);
  return next;
}
