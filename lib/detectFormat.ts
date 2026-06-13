import { load } from "js-yaml";

export function detectFormat(
  input: string,
): "json" | "yaml" | "env" | "unknown" {
  const text = (input ?? "").trim();
  if (!text) return "unknown";

  // 1) JSON: valid parseable JSON (authoritative).
  try {
    JSON.parse(text);
    return "json";
  } catch {
    // fall through
  }

  // If it looks like JSON but strict JSON parsing failed, do not let YAML's
  // permissive superset grammar classify malformed JSON as YAML.
  if (text.startsWith("{") || text.startsWith("[")) return "unknown";

  // 2) YAML: strict parser check, but ignore plain scalar strings so ENV and
  // arbitrary text are not swallowed by YAML's permissive scalar parsing.
  try {
    const result = load(text);
    if (
      result !== null &&
      result !== undefined &&
      typeof result === "object"
    ) {
      return "yaml";
    }
  } catch {
    // fall through
  }

  // 3) ENV: dotenv style KEY=VALUE.
  const rawLines = (input ?? "").split(/\r?\n/);
  const lines = rawLines
    .map((l) => l.trimEnd())
    .map((l) => l.trimStart())
    .filter((l) => l.length > 0)
    .filter((l) => !l.startsWith("#"));

  if (lines.length === 0) return "unknown";

  const envLineRe =
    /^(?:export\s+)?[A-Za-z_][A-Za-z0-9_]*\s*=\s*(?:.*)?$/;
  const envLineCount = lines.filter((l) => envLineRe.test(l)).length;
  if (envLineCount > 0 && envLineCount / lines.length >= 0.8) return "env";

  return "unknown";
}

/*
Test cases (copy/paste into your test runner of choice):

// unknown
detectFormat("") === "unknown"
detectFormat("   \n\t ") === "unknown"
detectFormat("# comment only\n# another") === "unknown"
detectFormat("just some words") === "unknown"

// json
detectFormat("{}") === "json"
detectFormat("[]") === "json"
detectFormat("{\"a\":1}") === "json"
detectFormat("  { \"a\": [1,2,3] }  ") === "json"
detectFormat("\"string\"") === "json"
detectFormat("true") === "json"
detectFormat("null") === "json"
detectFormat("123") === "json"
detectFormat("{\n  \"a\": 1\n}\n") === "json"

// env
detectFormat("FOO=bar") === "env"
detectFormat("FOO=bar\nBAZ=qux") === "env"
detectFormat("FOO=\nBAR=2") === "env"
detectFormat(" export FOO=bar\nBAR=baz") === "env"
detectFormat("# comment\nFOO=bar\n# another\nBAR=baz") === "env"
detectFormat("FOO=bar\nnot-an-env-line") === "unknown"
detectFormat("FOO=bar\nkey: value") === "unknown"

// yaml (mappings)
detectFormat("foo: bar") === "yaml"
detectFormat("foo: bar\nbaz: qux") === "yaml"
detectFormat("foo:\n  bar: baz") === "yaml"
detectFormat("---\nfoo: bar\n...\n") === "yaml"
detectFormat("\"my key\": 1") === "yaml"
detectFormat("'my key': true") === "yaml"

// yaml (lists / indentation)
detectFormat("- one\n- two\n- three") === "yaml"
detectFormat("items:\n  - one\n  - two") === "yaml"
detectFormat("  indented\n  lines\n  only") === "yaml"
*/

