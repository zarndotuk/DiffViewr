# DiffViewr

**Review config changes, without the noise.**

[diffviewr.com](https://www.diffviewr.com) · [Live demo](https://www.diffviewr.com/tool/?sample=1)

DiffViewr is a 100% client-side config diff tool built for developers. Paste your template as **A** and your environment config as **B** — DiffViewr aligns key order before comparing, so you only see the values that actually changed.

No sign-up. No server. No paste limits.

---

## The problem

Standard `git diff` on a config file flags every reordered key as a change. On a real `appsettings.json`, that might mean 44 lines flagged when only 3 values actually differ. You're reviewing noise, not signal.

DiffViewr treats Template A as the source of truth, reorders Target B against it, then surfaces only the differences that matter.

---

## Features

- **Template A → Target B model** — one file is the reference, not an equal comparison
- **Key-order normalisation** — reordering is stripped before diffing so you see real changes only
- **Format-aware** — supports JSON, YAML, and `.env` files, with format detection and validation feedback
- **Visual side-by-side compare** — changed, missing, and added values are clearly marked
- **Export clean config** — copy a reordered, review-ready version of your target config
- **Entirely in-browser** — static Next.js export, no backend, no API routes, no data leaves your machine

---

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Production build

```bash
npm run build
```

The static site is emitted to `out/` via Next.js `output: "export"`. Deploy to any static host (Cloudflare Pages, Vercel, Netlify, etc.).

---

## Common workflows

- **Pre-release checks** — compare your template config against staging or production before deploying
- **Env drift detection** — spot meaningful differences between environment configs
- **Cleaner PRs** — normalise key order so reviewers aren't wading through noise

---

## License

[MIT](./LICENSE)
