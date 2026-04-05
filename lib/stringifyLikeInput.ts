export function detectIndentFromText(input: string): number | null {
  if (!input.includes("\n")) return null;
  const lines = input.split(/\r?\n/);
  const indents: number[] = [];
  for (const line of lines) {
    const m = /^([ \t]+)\S/.exec(line);
    if (!m) continue;
    const ws = m[1];
    if (ws.includes("\t")) return 2; // keep it simple: tabs -> 2-space output
    const n = ws.length;
    if (n === 0) continue;
    indents.push(n);
  }
  if (indents.length === 0) return 2;

  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  let unit = indents[0];
  for (let i = 1; i < indents.length; i += 1) {
    unit = gcd(unit, indents[i]);
    if (unit === 1) break;
  }
  if (unit <= 0) return 2;
  if (unit >= 8) return 2;
  return unit;
}

export function stringifyLikeInput(value: unknown, originalText: string): string {
  const trimmed = (originalText ?? "").trim();
  if (!trimmed) return JSON.stringify(value, null, 2);
  const indent = detectIndentFromText(originalText);
  if (indent === null) return JSON.stringify(value);
  return JSON.stringify(value, null, indent);
}
