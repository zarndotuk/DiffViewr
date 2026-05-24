# DiffViewr Codebase Map

This document describes the current DiffViewr page, component, hook, type, and support-module structure after the Next.js 16.2 upgrade.

## Framework

- **Next.js**: 16.2.2
- **React**: 19.2.x
- **Routing model**: App Router
- **Build output**: static export via `output: "export"` in `next.config.ts`
- **Linting**: ESLint CLI with flat config in `eslint.config.mjs`

## Pages And Layouts

- **app/layout.tsx**: Root HTML shell. Defines global metadata, injects the initial theme script, imports global CSS, renders `SiteHeader`, wraps page content, and renders `SiteFooter`.
- **app/page.tsx**: Landing page. Uses the landing hero and supporting marketing/product sections for DiffViewr.
- **app/tool/layout.tsx**: Route layout for `/tool`. Provides tool-specific metadata while leaving rendering to the page.
- **app/tool/page.tsx**: Main interactive diff tool page. Owns input state, validation, format detection flow, reorder/compare actions, result state, copy handling, rating modal state, and the ad-rail feature flag render.
- **app/docs/overview/page.tsx**: Documentation overview page with quick-start guidance and links back to the tool and repository.
- **app/not-found.tsx**: Custom 404 page.
- **app/globals.css**: Global styles, theme variables, component utility styles, and app-wide visual treatment.

## Components

### components/layout

- **components/layout/site-header.tsx**: Sticky global header with DiffViewr branding, primary navigation, mobile details menu behavior, and route links.
- **components/layout/site-footer.tsx**: Global footer with product note, privacy positioning, author link, and repository link.

### components/landing

- **components/landing/hero-section.tsx**: Landing page hero. Presents the core product pitch, GitHub link, primary calls to action, and the preview card.
- **components/landing/diff-preview-card.tsx**: Animated/static preview card that demonstrates a representative config diff on the landing page.

### components/tool

- **components/tool/json-input-grid.tsx**: Two-panel input grid for Template A and Target B. Handles textarea rendering, format badges, validation messages, line jump actions, and collapsed-input behavior once output is visible.
- **components/tool/output-section.tsx**: Results surface. Switches between visual compare and reordered result tabs, renders copy/start-over actions, and lazy-loads the visual compare panel.
- **components/tool/format-badge.tsx**: Animated format badge for JSON, YAML, .ENV, and unknown input states.
- **components/tool/rating-modal.tsx**: Client-side feedback modal used after successful tool interactions.
- **components/tool/reorder-badge.tsx**: Informational badge shown in the diff summary bar to communicate that Target B was reordered to match Template A.

### components/compare

- **components/compare/visual-compare-panel.tsx**: Side-by-side visual diff viewer. Builds aligned line pairs, syntax tokenizes content, renders gutters, mini-map markers, scroll sync, active filters, and summary interaction.
- **components/compare/diff-summary-bar.tsx**: Filterable summary strip for missing, extra, changed, and type-mismatch counts. Includes the reorder badge.

## Hooks

- **hooks/use-format-detection.ts**: Debounced format detection hook used by input panels.
- **hooks/use-reorder-arrays.ts**: Persists and toggles the "Reorder arrays to match A" user preference.

## Types

- **types/diff.ts**: Shared diff domain types, including `DiffKind`, `DiffNode`, `DiffSummary`, and `CompareResult`.

## Lib Modules

- **lib/flags.ts**: Environment-backed feature flags. `adsEnabled` is true only when `NEXT_PUBLIC_ADS_ENABLED` is exactly true after lowercase/trim normalization.
- **lib/utils.ts**: Shared utility helpers, currently `cn()` for class name joining.
- **lib/detectFormat.ts**: Detects whether input content appears to be JSON, YAML, .ENV, or unknown.
- **lib/validateInput.ts**: Validates supported input formats and returns structured validation results.
- **lib/stringifyLikeInput.ts**: Serializes output using indentation inferred from the original input.
- **lib/jsonText.ts**: JSON text helpers.
- **lib/jsonPath.ts**: JSON path parsing and node lookup helpers.
- **lib/serialize.ts**: Primitive type definitions and serialization helpers.
- **lib/diagnostics.ts**: Diagnostic result types and helpers for reorder operations.
- **lib/reorderArray.ts**: Array reordering logic.
- **lib/reorderObject.ts**: Object key reordering logic.
- **lib/reorderByTemplate.ts**: High-level template-driven reorder workflow.
- **lib/diff/compareJson.ts**: Entry point for recursive diff node creation.
- **lib/diff/compareObjects.ts**: Object comparison logic.
- **lib/diff/compareArrays.ts**: Array comparison logic for primitive, object, mixed, and index-based cases.
- **lib/diff/buildSummary.ts**: Produces aggregate diff counts from a diff tree.
- **lib/diff/getValueByPath.ts**: Reads nested values by path.
- **lib/diff/toTypedKey.ts**: Formats typed keys and primitive values for matching.
- **lib/shiki/getHighlighter.ts**: Shiki highlighter setup and tokenization helpers for JSON, YAML, and dotenv content.

## Environment Files

- **.env.example**: Documents `NEXT_PUBLIC_ADS_ENABLED=false`.
- **.env.local**: Local-only environment file, ignored by git.

## Removed During Cleanup

- **components/compare/diff-legend.tsx**: Removed because it had no imports or runtime usage.
- **components/layout/theme-selector.tsx**: Removed because it had no imports or runtime usage.
- **lib/config.ts**: Removed in favor of environment-backed `lib/flags.ts`.
- **components/site/**: Renamed to `components/layout/`.
- **components/tool/hero-section.tsx** and **components/tool/diff-preview-card.tsx**: Moved to `components/landing/`.
- **hooks/useFormatDetection.ts** and **hooks/useReorderArrays.ts**: Renamed to kebab-case hook filenames.
- **lib/diff/types.ts**: Moved to `types/diff.ts`.
