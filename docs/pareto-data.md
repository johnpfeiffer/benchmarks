# Pareto chart data

The Pareto frontier section plots **intelligence vs. total benchmark run
cost** (USD, log scale) and shades the region meeting the visitor's targets.

## Default snapshot

The published default is not a separate data file. It is derived at load time
from the `app/src/data/ai.json` rows that carry a `cost_usd` field
(`paretoSnapshotFromModels` in `app/src/models/pareto.ts`), so every plotted
point pairs a score and a cost read from the same Artificial Analysis model
page under the same index version. `ai.json` keeps one block of rows per
index version (`aa_version`), and `PARETO_SNAPSHOT_AA_VERSION` pins the block
the points are drawn from. The derivation sets `sample: false`; rows
without a verified cost are simply not plotted.

`PARETO_SNAPSHOT_AA_VERSION`, `PARETO_SNAPSHOT_VERSION`, and
`PARETO_SNAPSHOT_DATE` (same file) label the snapshot. Bump them whenever
`ai.json` gains a new version block from Artificial
Analysis.

## Paste format

The "Load chart data" panel accepts a JSON snapshot for temporary in-browser
previews. `app/src/data/pareto.json` is a fictional, clearly labeled example
of the format (the section links to it as a download).

```json
{
  "benchmark_version": "Artificial Analysis Intelligence Index v4.3",
  "date": "2026-09-13",
  "sample": false,
  "models": [
    { "model": "GLM-5.3 Flash", "provider": "Z AI", "intelligence": 42, "cost_usd": 280.28, "color": "#1c7ff8" }
  ]
}
```

Validation rules (`parseParetoDataset`):

- `benchmark_version`: non-empty string. One snapshot must contain scores
  from a single index version — never mix versions in one dataset.
- `date`: real `YYYY-MM-DD` calendar date (the retrieval/snapshot date).
- `sample`: explicit boolean. `true` marks fictional/demo data and shows a
  banner in the UI; measured data uses `false`.
- `models`: 1–1000 points, each with:
  - `model` — include the effort variant, e.g. `"GPT-5.6 Sol (max)"`.
  - `provider` — required (INV-001).
  - `intelligence` — number, 0–100.
  - `cost_usd` — positive finite number. Cost is the **total** to run the
    whole benchmark (AA's Comparison Summary total), not token pricing and
    not cost per task. Zero is rejected because the x-axis is logarithmic.
  - `color` — optional six-digit hex.
  - `provider` + `model` pairs must be unique.

Pasted data is validated before it replaces the chart, lives only in the
browser session, and is cleared on refresh. "Reload published data" restores
the ai.json-derived snapshot.

## Refreshing the real data

1. From `tools/benchtool/`, run `go run . aa-model <slug> --json` per model.
   It emits the Intelligence Index score, the page's `benchmark_version`, and
   the precise `total_cost_usd` with its provenance and precision.
2. Insert the refreshed rows with `ai-add --aa-version=<vX.Y> --cost=...` —
   the file keeps one block per index version, so a methodology revision adds
   a new block instead of overwriting the old one. Each new row pairs its
   score and cost from the same fetch (never pair a new cost with a stale
   score). Omit `cost_usd` when AA publishes no precise total or reports $0.
   Between blocks of the same version, update rows in place so the pairing
   stays atomic.
3. If the index version changed, bump the snapshot constants
   (`PARETO_SNAPSHOT_AA_VERSION` to the new tag), update the
   footer credit (`sources[0]` in `App.tsx`) to the new version article, and
   note the version in `architecture.md`.
4. `npm test` covers the rest: `data.test.ts` pins the derived snapshot
   against the real data.
