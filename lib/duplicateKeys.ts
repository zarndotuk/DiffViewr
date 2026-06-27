import type { SupportedFormat } from "@/lib/validateInput";

export type DuplicateKeyIssue = {
  key: string;
  path?: string;
  occurrences: number;
  fileType: Exclude<SupportedFormat, "unknown">;
  note: string;
  line?: number;
};

export type DuplicateKeyValidationResult = {
  isValid: boolean;
  errorType?: "DUPLICATE_KEYS";
  message: string;
  issues?: DuplicateKeyIssue[];
  recommendation?: string;
};

type JsonKeyRecord = {
  count: number;
  firstLine: number;
};

class JsonDuplicateKeyScanner {
  private index = 0;
  private line = 1;
  private readonly issues: DuplicateKeyIssue[] = [];

  constructor(private readonly text: string) {}

  scan(): DuplicateKeyIssue[] {
    this.skipWhitespace();
    this.parseValue([]);
    return this.issues;
  }

  private parseValue(path: string[]): void {
    this.skipWhitespace();
    const ch = this.text[this.index];

    if (ch === "{") {
      this.parseObject(path);
      return;
    }

    if (ch === "[") {
      this.parseArray(path);
      return;
    }

    if (ch === "\"") {
      this.parseString();
      return;
    }

    this.parsePrimitive();
  }

  private parseObject(path: string[]): void {
    const keys = new Map<string, JsonKeyRecord>();
    this.index += 1;
    this.skipWhitespace();

    if (this.text[this.index] === "}") {
      this.index += 1;
      return;
    }

    while (this.index < this.text.length) {
      this.skipWhitespace();
      const keyLine = this.line;
      const key = this.parseString();
      const record = keys.get(key) ?? { count: 0, firstLine: keyLine };
      record.count += 1;
      keys.set(key, record);

      this.skipWhitespace();
      if (this.text[this.index] === ":") this.index += 1;
      this.parseValue([...path, key]);
      this.skipWhitespace();

      const next = this.text[this.index];
      if (next === ",") {
        this.index += 1;
        continue;
      }
      if (next === "}") {
        this.index += 1;
        break;
      }
      break;
    }

    for (const [key, record] of keys.entries()) {
      if (record.count <= 1) continue;
      this.issues.push({
        key,
        path: formatPath(path),
        occurrences: record.count,
        fileType: "json",
        note: "Duplicate key detected in the same JSON object scope.",
        line: record.firstLine
      });
    }
  }

  private parseArray(path: string[]): void {
    this.index += 1;
    this.skipWhitespace();

    if (this.text[this.index] === "]") {
      this.index += 1;
      return;
    }

    while (this.index < this.text.length) {
      this.parseValue(path);
      this.skipWhitespace();

      const next = this.text[this.index];
      if (next === ",") {
        this.index += 1;
        continue;
      }
      if (next === "]") {
        this.index += 1;
        break;
      }
      break;
    }
  }

  private parseString(): string {
    let value = "";
    this.index += 1;

    while (this.index < this.text.length) {
      const ch = this.text[this.index] ?? "";
      if (ch === "\"") {
        this.index += 1;
        return value;
      }

      if (ch === "\\") {
        const escaped = this.text[this.index + 1] ?? "";
        if (escaped === "u") {
          value += this.text.slice(this.index, this.index + 6);
          this.index += 6;
          continue;
        }
        value += escaped;
        this.index += 2;
        continue;
      }

      if (ch === "\n") this.line += 1;
      value += ch;
      this.index += 1;
    }

    return value;
  }

  private parsePrimitive(): void {
    while (this.index < this.text.length) {
      const ch = this.text[this.index] ?? "";
      if (ch === "\n") this.line += 1;
      if (ch === "," || ch === "}" || ch === "]") return;
      this.index += 1;
    }
  }

  private skipWhitespace(): void {
    while (this.index < this.text.length) {
      const ch = this.text[this.index] ?? "";
      if (ch === "\n") this.line += 1;
      if (!/\s/.test(ch)) return;
      this.index += 1;
    }
  }
}

type YamlScope = {
  indent: number;
  path: string[];
  keys: Map<string, JsonKeyRecord>;
};

function formatPath(path: string[]): string {
  return path.length > 0 ? path.join(".") : "Root object";
}

function duplicateResult(issues: DuplicateKeyIssue[]): DuplicateKeyValidationResult {
  if (issues.length === 0) {
    return {
      isValid: true,
      message: "No duplicate keys found. Configuration is valid."
    };
  }

  return {
    isValid: false,
    errorType: "DUPLICATE_KEYS",
    message: "Configuration contains duplicate keys which makes it invalid.",
    issues,
    recommendation: "Remove duplicate keys or merge values into a single definition."
  };
}

function scanEnvDuplicates(text: string): DuplicateKeyIssue[] {
  const counts = new Map<string, JsonKeyRecord>();
  const envLineRe = /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/;
  const lines = text.split(/\r?\n/);

  for (let i = 0; i < lines.length; i += 1) {
    const trimmed = (lines[i] ?? "").trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = envLineRe.exec(trimmed);
    if (!match) continue;

    const key = match[1];
    const record = counts.get(key) ?? { count: 0, firstLine: i + 1 };
    record.count += 1;
    counts.set(key, record);
  }

  return Array.from(counts.entries())
    .filter(([, record]) => record.count > 1)
    .map(([key, record]) => ({
      key,
      occurrences: record.count,
      fileType: "env" as const,
      note: "Duplicate variable detected. .env files must not contain duplicate keys.",
      line: record.firstLine
    }));
}

function stripYamlComment(line: string): string {
  let quote: "\"" | "'" | null = null;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (quote) {
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === "\"" || ch === "'") {
      quote = ch;
      continue;
    }
    if (ch === "#" && (i === 0 || /\s/.test(line[i - 1] ?? ""))) {
      return line.slice(0, i).trimEnd();
    }
  }

  return line;
}

function readYamlKey(content: string): string | null {
  const quoted = /^(?:"([^"]+)"|'([^']+)'|([^:[\]{},#][^:]*?))\s*:(?:\s|$)/.exec(content);
  if (!quoted) return null;
  return (quoted[1] ?? quoted[2] ?? quoted[3] ?? "").trim();
}

function pushYamlDuplicateIssues(scope: YamlScope, issues: DuplicateKeyIssue[]): void {
  for (const [key, record] of scope.keys.entries()) {
    if (record.count <= 1) continue;
    issues.push({
      key,
      path: formatPath(scope.path),
      occurrences: record.count,
      fileType: "yaml",
      note: "Duplicate key detected in the same YAML mapping scope.",
      line: record.firstLine
    });
  }
}

function scanYamlDuplicates(text: string): DuplicateKeyIssue[] {
  const issues: DuplicateKeyIssue[] = [];
  const scopes: YamlScope[] = [{ indent: -1, path: [], keys: new Map() }];
  const keyPathByIndent = new Map<number, string[]>();
  const lines = text.split(/\r?\n/);

  for (let i = 0; i < lines.length; i += 1) {
    const withoutComment = stripYamlComment(lines[i] ?? "");
    if (!withoutComment.trim()) continue;

    const rawIndent = withoutComment.match(/^\s*/)?.[0].length ?? 0;
    let rest = withoutComment.slice(rawIndent);
    let isSequenceItem = false;
    let consumed = 0;

    while (rest.startsWith("- ")) {
      rest = rest.slice(2);
      consumed += 2;
      isSequenceItem = true;
      const extraSpace = rest.match(/^\s*/)?.[0].length ?? 0;
      rest = rest.slice(extraSpace);
      consumed += extraSpace;
    }

    const indent = rawIndent + consumed; // effective indent, dash-width included
    const content = rest;

    const key = readYamlKey(content);
    if (!key) continue;

    while (
      scopes.length > 0 &&
      (indent < scopes[scopes.length - 1].indent ||
        (isSequenceItem && indent === scopes[scopes.length - 1].indent))
    ) {
      const scope = scopes.pop();
      if (scope) pushYamlDuplicateIssues(scope, issues);
    }

    let scope = scopes.find((candidate) => candidate.indent === indent);
    if (!scope) {
      const parentIndent = Array.from(keyPathByIndent.keys())
        .filter((candidateIndent) => candidateIndent < indent)
        .sort((a, b) => b - a)[0];
      const path = parentIndent === undefined ? [] : (keyPathByIndent.get(parentIndent) ?? []);
      scope = { indent, path, keys: new Map() };
      scopes.push(scope);
      scopes.sort((a, b) => a.indent - b.indent);
    }

    const record = scope.keys.get(key) ?? { count: 0, firstLine: i + 1 };
    record.count += 1;
    scope.keys.set(key, record);

    keyPathByIndent.set(indent, [...scope.path, key]);
    for (const knownIndent of Array.from(keyPathByIndent.keys())) {
      if (knownIndent > indent) keyPathByIndent.delete(knownIndent);
    }
  }

  while (scopes.length > 0) {
    const scope = scopes.pop();
    if (scope) pushYamlDuplicateIssues(scope, issues);
  }

  return issues;
}

export function validateDuplicateKeys(
  text: string,
  format: SupportedFormat
): DuplicateKeyValidationResult {
  if (format === "json") return duplicateResult(new JsonDuplicateKeyScanner(text).scan());
  if (format === "env") return duplicateResult(scanEnvDuplicates(text));
  if (format === "yaml") return duplicateResult(scanYamlDuplicates(text));

  return {
    isValid: true,
    message: "No duplicate keys found. Configuration is valid."
  };
}
