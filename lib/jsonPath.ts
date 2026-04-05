export type PathToken = { kind: "key"; key: string } | { kind: "index"; index: number };

function isWhitespace(ch: string) {
  return ch === " " || ch === "\t" || ch === "\n" || ch === "\r";
}

function unexpected(path: string, i: number, detail: string) {
  const pointer = `${" ".repeat(i)}^`;
  return new Error(`Invalid path: ${detail}\n${path}\n${pointer}`);
}

function readBracketString(path: string, start: number) {
  const quote = path[start];
  let i = start + 1;
  let out = "";
  while (i < path.length) {
    const ch = path[i];
    if (ch === "\\") {
      if (i + 1 >= path.length) throw unexpected(path, i, "Dangling escape in string.");
      out += path[i + 1];
      i += 2;
      continue;
    }
    if (ch === quote) return { value: out, next: i + 1 };
    out += ch;
    i += 1;
  }
  throw unexpected(path, start, "Unterminated quoted string.");
}

export function parseJsonPath(inputPath: string): PathToken[] {
  const raw = (inputPath ?? "").trim();
  const normalized = raw || "$";
  const path = normalized.startsWith("$")
    ? normalized
    : normalized.startsWith("[") || normalized.startsWith(".")
      ? `$${normalized}`
      : `$.${normalized}`;

  const tokens: PathToken[] = [];
  let i = 1;
  while (i < path.length) {
    const ch = path[i];
    if (isWhitespace(ch)) {
      i += 1;
      continue;
    }

    if (ch === ".") {
      i += 1;
      if (i >= path.length) throw unexpected(path, i, "Expected a key after '.'.");
      let key = "";
      while (i < path.length) {
        const c = path[i];
        if (c === "\\" && i + 1 < path.length) {
          key += path[i + 1];
          i += 2;
          continue;
        }
        if (c === "." || c === "[") break;
        key += c;
        i += 1;
      }
      key = key.trim();
      if (!key) throw unexpected(path, i, "Empty key segment.");
      tokens.push({ kind: "key", key });
      continue;
    }

    if (ch === "[") {
      i += 1;
      while (i < path.length && isWhitespace(path[i])) i += 1;
      if (i >= path.length) throw unexpected(path, i, "Unterminated '['.");

      const inner = path[i];
      if (inner === "'" || inner === '"') {
        const { value, next } = readBracketString(path, i);
        i = next;
        while (i < path.length && isWhitespace(path[i])) i += 1;
        if (path[i] !== "]") throw unexpected(path, i, "Expected closing ']'.");
        i += 1;
        tokens.push({ kind: "key", key: value });
        continue;
      }

      let numText = "";
      while (i < path.length && path[i] !== "]") {
        numText += path[i];
        i += 1;
      }
      if (i >= path.length) throw unexpected(path, i, "Unterminated '[' segment.");
      i += 1; // skip ]
      numText = numText.trim();
      if (!/^\d+$/.test(numText)) throw unexpected(path, i, `Invalid array index: ${numText}`);
      tokens.push({ kind: "index", index: Number(numText) });
      continue;
    }

    throw unexpected(path, i, `Unexpected character '${ch}'.`);
  }
  return tokens;
}

function tokenToString(token: PathToken) {
  if (token.kind === "key") return `.${token.key}`;
  return `[${token.index}]`;
}

function tokensToPath(tokens: PathToken[]) {
  return "$" + tokens.map(tokenToString).join("");
}

export function getNodeByPath(root: unknown, path: string | PathToken[]): unknown {
  const tokens = typeof path === "string" ? parseJsonPath(path) : path;
  let cur: unknown = root;
  const walked: PathToken[] = [];
  for (const token of tokens) {
    walked.push(token);
    if (token.kind === "key") {
      if (typeof cur !== "object" || cur === null || Array.isArray(cur)) {
        throw new Error(
          `Path not found: ${tokensToPath(walked)} is not an object (cannot read key '${token.key}').`
        );
      }
      const obj = cur as Record<string, unknown>;
      if (!(token.key in obj)) {
        throw new Error(`Path not found: missing key '${token.key}' at ${tokensToPath(walked)}.`);
      }
      cur = obj[token.key];
      continue;
    }

    if (!Array.isArray(cur)) {
      throw new Error(
        `Path not found: ${tokensToPath(walked)} is not an array (cannot read index ${token.index}).`
      );
    }
    if (token.index < 0 || token.index >= cur.length) {
      throw new Error(
        `Path not found: index ${token.index} out of bounds at ${tokensToPath(walked)}.`
      );
    }
    cur = cur[token.index];
  }
  return cur;
}

export function setNodeByPath(
  root: unknown,
  path: string | PathToken[],
  value: unknown
): unknown {
  const tokens = typeof path === "string" ? parseJsonPath(path) : path;
  if (tokens.length === 0) return value;

  const stack: { container: unknown; token: PathToken }[] = [];
  let cur: unknown = root;
  for (const token of tokens) {
    stack.push({ container: cur, token });
    if (token.kind === "key") {
      if (typeof cur !== "object" || cur === null || Array.isArray(cur)) {
        throw new Error(`Cannot set path: expected object before key '${token.key}'.`);
      }
      const obj = cur as Record<string, unknown>;
      if (!(token.key in obj)) throw new Error(`Cannot set path: missing key '${token.key}'.`);
      cur = obj[token.key];
      continue;
    }

    if (!Array.isArray(cur)) {
      throw new Error(`Cannot set path: expected array before index ${token.index}.`);
    }
    if (token.index < 0 || token.index >= cur.length) {
      throw new Error(`Cannot set path: index ${token.index} out of bounds.`);
    }
    cur = cur[token.index];
  }

  let next = value;
  for (let i = stack.length - 1; i >= 0; i -= 1) {
    const { container, token } = stack[i];
    if (token.kind === "key") {
      const obj = container as Record<string, unknown>;
      const clone: Record<string, unknown> = { ...obj, [token.key]: next };
      next = clone;
    } else {
      const arr = container as unknown[];
      const clone = arr.slice();
      clone[token.index] = next;
      next = clone;
    }
  }
  return next;
}
