function formatJsonParseError(label: string, message: string) {
  const cleaned = message.replace(/^Unexpected token/, "Unexpected token in");
  return `${label} is invalid JSON.\n${cleaned}`;
}

export function parseJsonText(text: string, label: string): unknown {
  const trimmed = text.trim();
  if (!trimmed) throw new Error(`${label} is empty.`);
  try {
    return JSON.parse(trimmed) as unknown;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(formatJsonParseError(label, msg));
  }
}

export function formatJsonText(text: string): string {
  const value = parseJsonText(text, "JSON");
  return JSON.stringify(value, null, 2);
}

export function minifyJsonText(text: string): string {
  const value = parseJsonText(text, "JSON");
  return JSON.stringify(value);
}

