import { gzipSync } from "node:zlib";
import { readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const outputRoot = join(root, "out");
const pages = [
  join(outputRoot, "index.html"),
  join(outputRoot, "tool", "index.html"),
  join(outputRoot, "docs", "overview", "index.html")
];

const rows = pages.map((pagePath) => {
  const html = readFileSync(pagePath, "utf8");
  const scripts = [
    ...new Set(
      [...html.matchAll(/\/_next\/static\/chunks\/([^"\\]+\.js)/g)].map(
        (match) => match[1]
      )
    )
  ];

  let rawBytes = 0;
  let gzipBytes = 0;
  for (const script of scripts) {
    const scriptPath = join(outputRoot, "_next", "static", "chunks", script);
    rawBytes += statSync(scriptPath).size;
    gzipBytes += gzipSync(readFileSync(scriptPath)).length;
  }

  return {
    route:
      relative(outputRoot, pagePath)
        .replaceAll("\\", "/")
        .replace(/\/?index\.html$/, "") || "/",
    scripts: scripts.length,
    rawKB: (rawBytes / 1024).toFixed(1),
    gzipKB: (gzipBytes / 1024).toFixed(1)
  };
});

console.table(rows);
