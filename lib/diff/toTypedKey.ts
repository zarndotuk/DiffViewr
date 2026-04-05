export function toTypedKey(value: unknown): string {
  if (value === null) return "null";
  switch (typeof value) {
    case "string":
      return `s:${value}`;
    case "number":
      return `n:${String(value)}`;
    case "boolean":
      return value ? "b:1" : "b:0";
    default:
      return `x:${String(value)}`;
  }
}

export function formatPrimitive(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return String(value);
}

