export type Primitive = string | number | boolean | null;

export function isPrimitive(value: unknown): value is Primitive {
  return (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  );
}

export function serializePrimitiveKey(value: Primitive): string {
  if (value === null) return "null";
  switch (typeof value) {
    case "string":
      return `s:${value}`;
    case "number":
      return `n:${String(value)}`;
    case "boolean":
      return value ? "b:1" : "b:0";
  }
}

export function formatPrimitive(value: Primitive): string {
  if (value === null) return "null";
  if (typeof value === "string") return `string:${JSON.stringify(value)}`;
  if (typeof value === "number") return `number:${String(value)}`;
  return `boolean:${String(value)}`;
}

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stableStringifyInternal(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) {
    return `[${value.map((v) => stableStringifyInternal(v)).join(",")}]`;
  }
  if (isPlainObject(value)) {
    const keys = Object.keys(value).sort();
    const body = keys
      .map((k) => `${JSON.stringify(k)}:${stableStringifyInternal(value[k])}`)
      .join(",");
    return `{${body}}`;
  }
  return JSON.stringify(value);
}

export function stableStringify(value: unknown): string {
  return stableStringifyInternal(value);
}

export function serializeValueKey(value: unknown): string {
  const type = value === null ? "null" : Array.isArray(value) ? "array" : typeof value;
  return `${type}:${stableStringifyInternal(value)}`;
}
