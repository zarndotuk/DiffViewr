# Component Summaries

This document summarizes the purpose of each React component in the codebase.

## Components

- **components/tool/tool-intro.tsx**: Introductory component that displays descriptive text about the tool's purpose and a button to load sample diff data.

- **app/page.tsx**: Main page component managing the entire diff tool interface, including state for inputs, validation, comparison logic, and rendering of sub-components like inputs, outputs, and modals.

- **components/tool/output-section.tsx**: Component for the output section, providing tabs to switch between visual compare view and reordered result view, along with action buttons for copying results and starting over.

- **components/compare/visual-compare-panel.tsx**: Advanced component for side-by-side visual comparison of JSON inputs, featuring syntax highlighting, diff color-coding, a mini scrollbar overview, line navigation, and a summary bar.

- **components/tool/validation-status.tsx**: Displays validation feedback for input fields, showing validity status, error messages, and a button to jump to specific lines in the input.

- **components/tool/tool-info.tsx**: Collapsible information panel explaining what the tool does (reordering keys for diff-friendly output) and what it does not do (e.g., no data merging).

- **components/tool/json-input-grid.tsx**: Renders a responsive grid for two JSON input textareas (Template A and Target B), including format badges, validation statuses, and collapse/expand functionality when outputs are visible.

- **components/tool/format-badge.tsx**: Animated badge component that displays the detected input format (e.g., JSON, YAML) with color-coding and transitions.

- **components/site/site-header.tsx**: Site navigation header with menus for About (author/repo links) and Docs, plus a theme selector; includes mobile-friendly dropdown menus.

- **components/compare/diff-summary-bar.tsx**: Summary bar displaying counts of diff statistics (missing in B, extra in B, changed values, type mismatches) with a reorder indicator badge.

- **components/ReorderBadge.tsx**: Informational badge indicating that Target B's keys have been reordered to match Template A's structure, with a tooltip.

- **app/layout.tsx**: Root layout component that applies fonts, metadata, theme initialization script, and renders the site header and footer around page content, with background animations.

- **app/docs/overview/page.tsx**: Documentation overview page providing a description of the tool, quick start steps, and navigation links back to the tool and to the GitHub repo.

- **components/tool/rating-modal.tsx**: Modal dialog for collecting user feedback via star ratings, with confirmation and close options.

- **components/site/theme-selector.tsx**: Dropdown selector for theme preferences (light, dark, system), persisting to localStorage and applying changes dynamically.

- **components/site/site-footer.tsx**: Site footer with credits, privacy notes, and links to the author and GitHub repository.

- **components/compare/diff-node-row.tsx**: Renders a single row in the diff tree view, showing the key path, diff badge, and side-by-side value cells for A and B, with expansion toggle for nested structures.

- **components/compare/diff-tree.tsx**: Recursive component that renders the entire hierarchical diff tree, handling node expansion, filtering (differences only or show unchanged), and rendering rows.

- **components/compare/diff-value-cell.tsx**: Styled cell component for displaying diff values in the tree view, color-coded based on diff kind (missing, extra, changed, etc.).

- **components/compare/diff-legend.tsx**: Legend component showing color-coded examples for each diff type (missing, extra, changed, same, type mismatch) to aid interpretation.

## Gutter Implementation Details

The gutter in the visual compare panel is a narrow column (10px wide) that displays colored markers indicating lines with differences.

Internally:

- It uses a memoized component that creates a Set from changeLineIndices for O(1) lookup of changed lines.

- For each aligned line, it checks if the index is in the changeSet.

- If a change exists, it determines the diff kind using inferBetweenKind and maps it to a color with diffKindColor.

- Each marker is a 6px wide, 12px tall rounded div, centered in a 26.4px high container (matching json-editor-line total height including padding).

- The gutter container has vertical padding of 10px to align with json-view padding offset, and font styling (fontSize 14, lineHeight 1.6) matching the editor.

- Dependencies (aligned, inferBetweenKind, changeLineIndices) ensure re-rendering only when necessary.

This provides visual cues for navigating differences without cluttering the code view.