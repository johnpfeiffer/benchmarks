# benchmarks
Benchmarks of interesting things

<https://feneky.com/benchmarks>



# Pareto chart data

The chart reads `app/public/data/pareto.json` at runtime. The included data uses
fictional model names and values; the visible sample banner is controlled by
`sample: true`.

## Snapshot format

```json
{
  "benchmark_version": "Illustrative example",
  "date": "2026-09-06",
  "sample": true,
  "models": [
    {
      "model": "Example Model (high)",
      "provider": "Example Labs",
      "intelligence": 50.5,
      "cost_usd": 1234.56,
      "color": "#34A853"
    }
  ]
}
```

For real data, use the actual benchmark version and snapshot date and set
`sample` to `false`. All points must use the same benchmark version and cost
definition. Cost means **total USD to run the Intelligence Index**, not price
per million tokens or weighted cost per task. Keep effort variants in the model
name so they remain distinct points. Intelligence can be decimal (0–100); cost
must be positive and finite because the x-axis is logarithmic. Color is optional.
Every model requires a provider (kernel INV-001). Duplicate model/provider pairs
are rejected. A snapshot can contain 1–1000 points.

## Updating the chart

- For a temporary preview, expand **Load chart data**, paste the snapshot JSON,
  and click **Apply JSON**. Data stays in page memory and is cleared on refresh.
  **Reload published data** restores the server snapshot.
- For a persistent update, replace `app/public/data/pareto.json` and use the
  normal deployment workflow. Vite copies it unchanged to `dist/data/pareto.json`.
  A host that supports updating static files directly can replace that JSON
  without rebuilding JavaScript; this repository's deployment pipeline may
  still run its normal build. No chart image generation is required.
- The fetch URL is relative (`data/pareto.json`), so the deployed
  `<base href="/benchmarks/">` resolves it to `/benchmarks/data/pareto.json`.
- The JSON format is our normalized format, not a claim of direct compatibility
  with Artificial Analysis exports. A downloaded CSV/JSON can be mapped to it
  once the actual export columns are available.

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

