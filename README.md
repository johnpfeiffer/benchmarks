# benchmarks
Benchmarks of interesting things

<https://feneky.com/benchmarks>

## Developer setup

Install and validate the dashboard from `app/`:

```sh
npm install
npm test
npm run build
```

The benchmark research CLI is a separate Go module:

```sh
cd tools/benchtool
go test ./...
go run . aa-model glm-5-3-flash
go run . aa-model gemini-3-5-flash-lite --json
```

`aa-model` reports score, provider, open-weight status, release date, benchmark
version, and the precise total USD cost from the model's Comparison Summary.
The JSON form keeps score/cost numeric and open-weight status boolean; a missing
published total is `null`. It does not scrape the multi-model comparison chart.


# Intelligence Index versions

`app/src/data/ai.json` keeps one block of rows per Artificial Analysis
Intelligence Index version (`aa_version`), so methodology revisions never
erase the previous snapshot. The toggle in the chart header swaps the chart
and the Model Details table between versions (currently v4.3 and v4.2, plus
the v3.0 snapshot backfilled from 2025-12-30 in
`app/src/data/ai-2025-12-30.json`, which the app concatenates with `ai.json`);
hardware tables always show the newest version's scores. A model that was
never re-measured under a version simply has no row in that block. Models that
first appear in the selected version start selected in the table and chart;
the captured v3.0 charts also live in the collapsed "Historical Artificial
Analysis Intelligence charts" expander below Model Details.


# Pareto chart data

The chart's default snapshot is derived at load time from the
`app/src/data/ai.json` rows carrying a `cost_usd` field, so it always shows
real measured data from a single Artificial Analysis Intelligence Index
version (currently v4.3). `app/src/data/pareto.json` keeps a fictional,
clearly labeled sample purely as the paste-format example behind the
section's download link. The full format and the refresh procedure are
documented in [docs/pareto-data.md](docs/pareto-data.md).

- For a temporary preview, expand **Load chart data**, paste the snapshot JSON,
  and click **Apply JSON**. Data stays in page memory and is cleared on refresh.
  **Reload published data** restores the ai.json-derived snapshot.
- For a persistent update, refresh the `cost_usd` values in `ai.json`
  (`benchtool aa-model <slug> --json` extracts them) and deploy normally.

## Reading the chart

The green region is `cost_usd < cost target` and `intelligence > score target`.
Points exactly on a threshold do not count toward the target. The frontier is
computed independently: a point is excluded if another costs no more and scores
no lower, with at least one strict improvement. Equal tradeoffs remain eligible.
The dotted connecting line is a visual guide, not an interpolation of available
models or a prediction. The frontier covers this snapshot's models only and
does not follow the main dashboard's model selection.

The historical PNG remains available in the reference panel. Its date and
scores can differ from the interactive snapshot.
