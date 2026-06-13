"use client";

import { createBundledHighlighter } from "@shikijs/core";
import { createJavaScriptRegexEngine } from "@shikijs/engine-javascript";
import type { HighlighterGeneric } from "@shikijs/types";

export type ThemeName = "dark-plus";
export type ShikiLang = "json" | "yaml" | "dotenv";

export type ShikiToken = {
  content: string;
  color?: string;
};

export type ShikiTokenLine = ShikiToken[];

type ShikiHighlighterLike = HighlighterGeneric<ShikiLang, ThemeName>;

const highlighterPromises = new Map<ShikiLang, Promise<ShikiHighlighterLike>>();

const languageLoaders = {
  json: () => import("@shikijs/langs/json"),
  yaml: () => import("@shikijs/langs/yaml"),
  dotenv: () => import("@shikijs/langs/dotenv")
} satisfies Record<ShikiLang, () => Promise<unknown>>;

function getShikiHighlighter(lang: ShikiLang): Promise<ShikiHighlighterLike> {
  const cached = highlighterPromises.get(lang);
  if (cached) return cached;

  const createHighlighter = createBundledHighlighter<ShikiLang, ThemeName>({
    langs: languageLoaders,
    themes: {
      "dark-plus": () => import("@shikijs/themes/dark-plus")
    },
    engine: () => createJavaScriptRegexEngine()
  });

  const promise = createHighlighter({
    themes: ["dark-plus"],
    langs: [lang]
  });
  highlighterPromises.set(lang, promise);
  return promise;
}

function normalizeTokenLine(line: unknown): ShikiTokenLine {
  if (!Array.isArray(line)) return [{ content: String(line ?? "") }];
  return line
    .map((token) => {
      if (!token || typeof token !== "object") {
        return { content: String(token ?? "") };
      }
      const value = token as Record<string, unknown>;
      return {
        content:
          typeof value.content === "string"
            ? value.content
            : String(value.content ?? ""),
        color: typeof value.color === "string" ? value.color : undefined
      };
    })
    .filter((token) => token.content.length > 0);
}

export async function shikiTokenizeLines(options: {
  code: string;
  lang?: ShikiLang;
}): Promise<ShikiTokenLine[]> {
  const lang = options.lang ?? "json";
  const highlighter = await getShikiHighlighter(lang);
  const value = highlighter as unknown as Record<string, unknown>;

  if (typeof value.codeToTokens === "function") {
    const raw = (
      value.codeToTokens as (
        code: string,
        options: { lang: string; theme: string }
      ) => unknown
    )(options.code, { lang, theme: "dark-plus" });
    if (Array.isArray(raw)) return raw.map(normalizeTokenLine);
    if (raw && typeof raw === "object") {
      const tokens = (raw as Record<string, unknown>).tokens;
      if (Array.isArray(tokens)) return tokens.map(normalizeTokenLine);
    }
  }

  return options.code
    .split(/\r?\n/)
    .map((content) => [{ content }]);
}
