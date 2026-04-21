export function detectFormat(
  input: string,
): "json" | "yaml" | "env" | "unknown" {
  const text = (input ?? "").trim();
  if (!text) return "unknown";

  // 1) JSON: valid parseable JSON (any JSON value).
  try {
    JSON.parse(text);
    return "json";
  } catch {
    // fall through
  }

  // Split into meaningful, non-comment lines once; used by env/yaml heuristics.
  const rawLines = (input ?? "").split(/\r?\n/);
  const lines = rawLines
    .map((l) => l.trimEnd())
    .map((l) => l.trimStart())
    .filter((l) => l.length > 0)
    .filter((l) => !l.startsWith("#"));

  if (lines.length === 0) return "unknown";

  // 2) ENV: dotenv style KEY=VALUE
  // Keep it conservative: require that most meaningful lines look like KEY=VALUE.
  const envLineRe =
    /^(?:export\s+)?[A-Za-z_][A-Za-z0-9_]*\s*=\s*(?:.*)?$/;
  const envLineCount = lines.filter((l) => envLineRe.test(l)).length;
  if (envLineCount > 0 && envLineCount / lines.length >= 0.8) return "env";

  // 3) YAML: key: value structure or significant indentation / list items.
  // Heuristic only (no YAML parsing).
  const yamlDocMarkerRe = /^(?:---|\.\.\.)\s*$/;
  const yamlLines = lines.filter((l) => !yamlDocMarkerRe.test(l));
  if (yamlLines.length === 0) return "unknown";

  const yamlKeyRe =
    /^(?:[A-Za-z_][A-Za-z0-9_."'-]*|"(?:[^"\\]|\\.)+"|'(?:[^'\\]|\\.)+')\s*:\s*(?:.*)?$/;
  const yamlKeyOnlyRe =
    /^(?:[A-Za-z_][A-Za-z0-9_."'-]*|"(?:[^"\\]|\\.)+"|'(?:[^'\\]|\\.)+')\s*:\s*$/;
  const yamlListItemRe = /^-\s+\S/;
  const yamlIndentedRe = /^(?: {2,}|\t+)\S/;

  const keyLineCount = yamlLines.filter((l) => yamlKeyRe.test(l)).length;
  const keyOnlyLineCount = yamlLines.filter((l) => yamlKeyOnlyRe.test(l)).length;
  const listItemLineCount = yamlLines.filter((l) => yamlListItemRe.test(l)).length;
  const indentedLineCount = rawLines.filter((l) => yamlIndentedRe.test(l)).length;

  // Strong signal: a majority of meaningful lines look like YAML mappings.
  if (keyLineCount > 0 && keyLineCount / yamlLines.length >= 0.5) return "yaml";

  // Common YAML shapes: "key:" followed by indented block or list items.
  if (
    keyOnlyLineCount > 0 &&
    (indentedLineCount > 0 || listItemLineCount > 0)
  ) {
    return "yaml";
  }

  // Significant indentation on multiple lines can be YAML even without ":".
  if (indentedLineCount >= 2 && indentedLineCount / rawLines.length >= 0.5) {
    return "yaml";
  }

  // Pure list YAML.
  if (
    listItemLineCount >= 2 &&
    listItemLineCount / Math.max(1, yamlLines.length) >= 0.5
  ) {
    return "yaml";
  }

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

