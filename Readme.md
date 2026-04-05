## JSON Reorder Tool (Next.js static export)

Fully client-side JSON reorder utility:

- Paste **Reference JSON (A)** and **Target JSON (B)**
- Choose a **target path** (default: `$`)
- Reorder **only ordering** at that path:
  - array → reorder B array items based on A
  - object → reorder B object keys based on A
- No backend, no API routes, no server actions

### Run

```bash
npm install
npm run dev
```

### Static export build

```bash
npm run build
```

The static site is emitted to `out/` (Next.js `output: "export"`).

### Path syntax

- Root: `$`
- Object keys: `$.items` or `items`
- Array indices: `$.items[0]`
- Bracket keys: `$['key.with.dots']`

### Array matching

- Arrays of primitives match by strict value + type (`"1"` ≠ `1`, `"true"` ≠ `true`)
- Arrays of objects match using a **match field path** like `id` or `meta.code`
- Missing items from A are reported, but never inserted into B
