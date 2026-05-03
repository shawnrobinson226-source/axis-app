const STORAGE_KEY = "axis_operator_id";
const LEGACY_STORAGE_KEY = "vanta_operator_id";

function randomId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `op_${crypto.randomUUID().replace(/-/g, "")}`;
  }

  return `op_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

export function getOrCreateOperatorId(): string {
  if (typeof window === "undefined") {
    return "";
  }

  const existing = window.localStorage.getItem(STORAGE_KEY);
  if (existing && existing.trim()) {
    return existing.trim();
  }

  const legacy = window.localStorage.getItem(LEGACY_STORAGE_KEY);
  if (legacy && legacy.trim()) {
    const migrated = legacy.trim();
    window.localStorage.setItem(STORAGE_KEY, migrated);
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);
    return migrated;
  }

  const id = randomId();
  window.localStorage.setItem(STORAGE_KEY, id);
  return id;
}
