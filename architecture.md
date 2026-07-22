# Architecture

AI model benchmarks dashboard: visualizes, filters, and sorts embedded model
benchmark datasets plus a dated news feed. It currently renders Artificial
Analysis scores and Senior SWE Bench tasteful/basic solve rates. Models can be
toggled in/out of the charts individually, or restricted to open-weight models
via the "Open Weights Only" preset. Derived from the immutable
[`/KERNEL/`](./KERNEL/); if anything here conflicts with the kernel, the kernel
wins.

## Stack

- **Vite + React 18 + TypeScript** (`app/`)
- **MUI** (`@mui/material`) for the UI, light-mode defaults per `KERNEL/DESIGN.md`
- **@mui/x-charts** for the bar chart
- **Vitest + Testing Library** for Red/Green TDD

## Layering (DDD / MVC)

The domain is encapsulated in `app/src/models/`; business logic is kept out of
the views. The `App` component is the controller (owns state and data flow).

```mermaid
flowchart TD
    AIJSON["data/ai.json<br/>(embedded)"] --> App["App.tsx<br/>(controller)"]
    SWEJSON["data/swe.json<br/>(embedded)"] --> App
    NEWSJSON["data/news.json<br/>(embedded)"] --> App
    App -->|parse + validate| Models["models/<br/>parse, sort, types"]
    Models -->|INV-001 gate| Validated["ModelEntry[] per source"]
    Models --> Merge["mergeSweMetrics<br/>(SWE columns on AI rows)"]
    App -->|sorted table rows + selected ids| Dashboard["views/Dashboard"]
    Dashboard --> ChartA["IntelligenceBarChart<br/>(Artificial Analysis)"]
    Dashboard --> News["NewsSection<br/>(expanded + collapsible)"]
    Dashboard --> Table["ModelTable<br/>(sortable + selectable + SWE columns)"]
    Dashboard --> ChartB["IntelligenceBarChart<br/>(SWE tasteful solve rate)"]
    Dashboard --> ChartC["IntelligenceBarChart<br/>(SWE basic solve rate)"]
    Dashboard --> Footer["Footer (source credits)"]
    Table -->|onSortChange / onToggleEntry| App
```

### Domain (`models/`)

| File | Responsibility |
| --- | --- |
| `types.ts` | `ModelEntry`, `NewsEntry`, their raw JSON shapes, and benchmark sort types; `ModelEntry.open_weight` is always present after parse; `ModelEntry.color` is the explicit bar color carried from `ai.json` |
| `parse.ts` | `parseModelEntries`, `parseSweEntries`, `parseNewsEntries`, provider/open-weight inference, and `InvariantError`; upholds **INV-001** (every model has a provider) and structural guards at the single gate. News URLs and ISO dates are validated, copied, and sorted newest first before reaching the view |
| `merge.ts` | `mergeSweMetrics`, `modelMatchKey`; adds optional SWE table columns to matching Artificial Analysis rows |
| `sort.ts` | `sortModels`, `nextSortState`, `DEFAULT_SORT` (score desc) |
| `filter.ts` | `openWeightIds`; the id set used by the "Open Weights Only" preset |
| `index.ts` | Public re-exports |

`data/swe.json` does not include provider fields, so `parseSweEntries` derives
provider from known model-family prefixes (Claude, GPT, Grok, GLM, Kimi,
Gemini). Unknown families fail as **INV-001** violations instead of being
rendered without a provider.

### Presentation (`views/`)

All views are pure (props in, callbacks out, no business logic):

- `IntelligenceBarChart` - vertical bars sorted by the controller (highest on
  the left by default), horizontally scrollable so labels stay readable,
  colored by the explicit `color` field each `ai.json` row carries, falling
  back to a provider/model-family lookup for SWE-only entries, with diagonal
  x-axis labels. The lead chart embeds its Artificial Analysis source credit as
  a chip in the upper-right of the chart frame and uses only a small margin
  below the x-axis allocation so the "Model" title sits close to the frame. The
  lower SWE comparison charts use fit-to-width mode with skinnier bars to avoid
  horizontal chart scrollbars.
- `ModelTable` - sortable table; headers `Provider`, `Model Name`, `Intelligence`;
  `tasteful_solve_rate_pct`, `basic_solve_rate_pct`, `avg_steps`, and
  `avg_tokens`; click headers to toggle asc/desc. The table expands to full
  height and scrolls horizontally on narrow viewports. Missing SWE values render
  as `*`. Model names are buttons; clicking toggles matching model inclusion
  across all charts while the row remains visible when deselected, with a gray
  background and faded text. An "Open Weights Only" toggle sits beside the
  title; turning it on sets the selection to the open-weight models, turning it
  off re-selects every model.
- `Footer` - credits both data sources,
  [Artificial Analysis](https://artificialanalysis.ai/) and
  [Senior SWE Bench](https://senior-swe-bench.snorkel.ai/), and links to the
  [GitHub repository](https://github.com/johnpfeiffer/benchmarks) with an inline
  GitHub SVG mark.
- `NewsSection` - outlined accordion immediately below the lead chart, expanded
  by default and user-collapsible. It displays only article URLs; each link's
  ISO publication date is exposed through its hover title. Input order is
  already newest-first.
- `Dashboard` - layout composing the intelligence chart, enriched details
  table, responsive side-by-side SWE comparison charts, then footer. News sits
  between the lead intelligence chart and model details.

### Controller (`App.tsx`)

Parses embedded JSON once (`useMemo`), including validated newest-first news,
merges SWE metrics into the main
Artificial Analysis table rows, holds the table `SortState` and selected model
IDs for the intelligence chart, computes sorted/chart-visible entries, and
forwards header clicks through `nextSortState`. Deselected table model names are
converted to match keys and filtered out of the Artificial Analysis chart plus
both SWE charts when corresponding SWE rows exist. The main table now includes
the three SWE-only models (Claude Opus 4.7, GPT-5.4 (xhigh), Claude Sonnet 4.6)
as not-open-weight rows, so every SWE model has an Artificial Analysis
counterpart and the "Open Weights Only" preset propagates fully to the SWE
charts. The preset is a selection: on ->
`replaceSelection(openWeightIds(...))`; off -> `replaceSelection(allIds)`, so the
table graying/fading and every chart follow the selection. The SWE charts are
rendered below the table from `swe.json` rows sorted by score descending: one
chart for `tasteful_solve_rate_pct`, one for `basic_solve_rate_pct`. Mounted at
the router index route (react-router retained).

## Invariants

- **INV-001** - Every model has a provider. Enforced in `parse.ts`; any
  violation throws `InvariantError` with the offending index before the data
  reaches the view layer.

## User Journey

```mermaid
journey
  title Benchmark dashboard
  section Open
    Load app: 5: User
    JSON parsed + INV-001 validated: 3: System
  section Explore Intelligence
    See Artificial Analysis chart (score desc): 5: User
    Open Artificial Analysis from source chip: 4: User
    Scroll chart horizontally for labels: 4: User
    Read newest-first News links and hover for dates: 4: User
    Collapse or expand News: 4: User
    Read details table with SWE columns: 5: User
    Click a header, including SWE metrics: 5: User
    Toggle asc/desc: 5: User
    Click model button to remove from all matching charts: 5: User
    Toggle "Open Weights Only" to restrict selection to open models: 5: User
  section Explore SWE
    See tasteful/basic charts side by side on desktop: 5: User
    See charts reflow vertically on mobile: 5: User
    Compare tasteful and basic solve rates: 5: User
  section Credit
    See data sources in footer: 3: User
    Open GitHub repository from footer icon link: 3: User
```

## Validation

- `npm test` - Vitest unit + component tests (domain logic + dashboard happy
  path / sort interaction / all-chart model filtering / SWE metric merge /
  source credits / news validation, ordering, tooltip, and collapse behavior).
- `npm run build` - `tsc -b` typecheck + Vite production build.

Tests follow Red/Green TDD with concise table-driven cases for the domain
(parse/INV-001, sorting, SWE metric merge) and high-value dashboard paths for
rendering, sorting, filtering, placeholders, and credits.
