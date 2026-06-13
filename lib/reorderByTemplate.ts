function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function stableStringify(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (typeof value === "bigint") return value.toString();
  if (typeof value === "undefined") return "undefined";
  if (typeof value === "function") return "function";
  if (typeof value === "symbol") return "symbol";

  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }

  if (isPlainObject(value)) {
    const keys = Object.keys(value).sort();
    const parts = keys.map((k) => `${JSON.stringify(k)}:${stableStringify(value[k])}`);
    return `{${parts.join(",")}}`;
  }

  return String(value);
}

function reorderValueByTemplate(
  target: unknown,
  template: unknown,
  reorderArrays: boolean
): unknown {
  if (isPlainObject(target) && isPlainObject(template)) {
    return reorderObjectByTemplate(target, template, reorderArrays);
  }
  if (Array.isArray(target) && Array.isArray(template)) {
    return reorderArrayByTemplate(target, template, reorderArrays);
  }
  return target;
}

function reorderArrayByTemplate(
  target: unknown[],
  template: unknown[],
  reorderArrays: boolean
): unknown[] {
  if (!reorderArrays) {
    return target.map((tItem, idx) => {
      const templateItem = template[idx];
      if (templateItem === undefined) return tItem;
      return reorderValueByTemplate(tItem, templateItem, false);
    });
  }

  const targetKeyToIndices = new Map<string, number[]>();
  for (let i = 0; i < target.length; i += 1) {
    const key = stableStringify(target[i]);
    const q = targetKeyToIndices.get(key);
    if (q) q.push(i);
    else targetKeyToIndices.set(key, [i]);
  }

  const used = new Array<boolean>(target.length).fill(false);
  const matched: unknown[] = [];

  for (const templateItem of template) {
    const key = stableStringify(templateItem);
    const q = targetKeyToIndices.get(key);
    if (!q || q.length === 0) continue;
    const idx = q.shift() as number;
    used[idx] = true;
    matched.push(reorderValueByTemplate(target[idx], templateItem, true));
  }

  const extras: unknown[] = [];
  for (let i = 0; i < target.length; i += 1) {
    if (!used[i]) extras.push(target[i]);
  }

  return matched.concat(extras);
}

function reorderObjectByTemplate(
  target: Record<string, unknown>,
  template: Record<string, unknown>,
  reorderArrays: boolean
): Record<string, unknown> {
  const out: Record<string, unknown> = {};

  for (const key of Object.keys(template)) {
    if (!(key in target)) continue;
    out[key] = reorderValueByTemplate(target[key], template[key], reorderArrays);
  }

  for (const key of Object.keys(target)) {
    if (key in template) continue;
    out[key] = target[key];
  }

  return out;
}

export function reorderByTemplate(
  target: Record<string, unknown>,
  template: Record<string, unknown>,
  reorderArrays: boolean
): Record<string, unknown> {
  // Runtime tolerant: if inputs aren't objects, return target untouched.
  if (!isPlainObject(target) || !isPlainObject(template)) return target;
  return reorderObjectByTemplate(target, template, reorderArrays);
}
