"use client";

export type ThemeName = "github-light" | "github-dark" | "vitesse-light" | "vitesse-dark" | "dark-plus";

export type ShikiToken = {
  content: string;
  color?: string;
};

export type ShikiTokenLine = ShikiToken[];

type ShikiHighlighterLike = {
  codeToThemedTokens?: (code: string, opts: { lang: string; theme: string }) => unknown;
  codeToTokens?: (code: string, opts: { lang: string; theme?: string }) => unknown;
};

let cachedHighlighterPromise: Promise<ShikiHighlighterLike> | null = null;
let cachedThemePair: [ThemeName, ThemeName] | null = null;

async function createHighlighterWithThemes(
  shiki: Record<string, unknown>,
  themes: [ThemeName, ThemeName],
): Promise<ShikiHighlighterLike> {
  const createHighlighter = shiki.createHighlighter as
    | ((opts: { themes: string[]; langs: string[] }) => Promise<unknown>)
    | undefined;

  if (!createHighlighter) {
    const getHighlighter = shiki.getHighlighter as
      | ((opts: { theme: string; langs: string[] }) => Promise<unknown>)
      | undefined;
    if (!getHighlighter) throw new Error("Shiki highlighter factory not found.");
    return (await getHighlighter({ theme: themes[1], langs: ["json"] })) as ShikiHighlighterLike;
  }

  return (await createHighlighter({ themes: [...themes], langs: ["json"] })) as ShikiHighlighterLike;
}

export async function getShikiHighlighter(): Promise<ShikiHighlighterLike> {
  if (cachedHighlighterPromise) return cachedHighlighterPromise;

  cachedHighlighterPromise = (async () => {
    const shiki = (await import("shiki")) as unknown as Record<string, unknown>;

    const themePairs: Array<[ThemeName, ThemeName]> = [
      ["github-light", "dark-plus"],
      ["vitesse-light", "dark-plus"],
    ];

    let lastErr: unknown = null;
    for (const pair of themePairs) {
      try {
        const highlighter = await createHighlighterWithThemes(shiki, pair);
        cachedThemePair = pair;
        return highlighter;
      } catch (e) {
        lastErr = e;
      }
    }
    throw new Error(
      `Failed to initialize Shiki highlighter.${lastErr ? ` ${String(lastErr)}` : ""}`,
    );
  })();

  return cachedHighlighterPromise;
}

export function getCachedShikiThemePair(): [ThemeName, ThemeName] | null {
  return cachedThemePair;
}

function normalizeTokenLine(line: unknown): ShikiTokenLine {
  if (!Array.isArray(line)) return [{ content: String(line ?? "") }];
  return line
    .map((t) => {
      if (!t || typeof t !== "object") return { content: String(t ?? "") };
      const tok = t as Record<string, unknown>;
      const content = typeof tok.content === "string" ? tok.content : String(tok.content ?? "");
      const color = typeof tok.color === "string" ? tok.color : undefined;
      return { content, color };
    })
    .filter((t) => t.content.length > 0);
}

export async function shikiTokenizeLines(opts: {
  code: string;
  theme: ThemeName;
  lang?: string;
}): Promise<ShikiTokenLine[]> {
  const lang = opts.lang ?? "json";
  const highlighter = await getShikiHighlighter();
  const h = highlighter as unknown as Record<string, unknown>;

  if (typeof h.codeToThemedTokens === "function") {
    const raw = (h.codeToThemedTokens as (code: string, o: { lang: string; theme: string }) => unknown)(
      opts.code,
      { lang, theme: opts.theme },
    );
    if (Array.isArray(raw)) return raw.map(normalizeTokenLine);
  }

  if (typeof h.codeToTokens === "function") {
    const raw = (h.codeToTokens as (code: string, o: { lang: string; theme?: string }) => unknown)(
      opts.code,
      { lang, theme: opts.theme },
    );
    if (Array.isArray(raw)) return raw.map(normalizeTokenLine);
    if (raw && typeof raw === "object") {
      const tokens = (raw as Record<string, unknown>).tokens;
      if (Array.isArray(tokens)) return tokens.map(normalizeTokenLine);
    }
  }

  // Fallback: no token API detected; return plain text lines.
  return opts.code.split(/\r?\n/).map((content) => [{ content }]);
}

export async function shikiTokenizeLinesForMode(opts: {
  code: string;
  mode: "light" | "dark";
  lang?: string;
}): Promise<ShikiTokenLine[]> {
  await getShikiHighlighter();
  const pair = getCachedShikiThemePair();
  const theme: ThemeName =
    opts.mode === "light" ? (pair?.[0] ?? "github-light") : (pair?.[1] ?? "github-dark");
  return shikiTokenizeLines({ code: opts.code, theme, lang: opts.lang });
}
