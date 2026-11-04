# Historical AA baselines after Intelligence Index v5.0

Verified 2026-10-29. Older reference models remain available, but distinguish
**a measured v5 aggregate** from **a historical Progress Index estimate**.

## What AA retained

The [v5 announcement](https://artificialanalysis.ai/articles/artificial-analysis-intelligence-index-v5)
also introduced **Progress Index v1**, explicitly for comparisons back to
November 2022. This is public, not an undocumented v5 backfill.

The full public chart datasets contained 716 model-variant records:
78 had non-null, non-estimated v5 Intelligence Index aggregates, and 685
had Progress Index scores. The initial HTML's `initialModels` contained
only 28 defaults. Neither default selection nor membership in the model
selector proves score availability.

### Concrete open-weight references

Progress values below are rounded to one decimal; v5 values use AA's
displayed integer rounding. These columns use **different scales**.
An em dash means no published v5 aggregate, not zero capability or absence
of individual evaluation results.

| Model / variant | Provider | Released | Progress v1 | Intelligence v5.0 |
| --- | --- | --- | ---: | ---: |
| Llama 2 Chat 70B | Meta | 2023-07-18 | 109.5 | — |
| Llama 3.1 Instruct 405B | Meta | 2024-07-23 | 162.8 | — |
| Qwen2.5 Instruct 72B | Alibaba | 2024-09-19 | 164.4 | — |
| DeepSeek R1 0528 | DeepSeek | 2025-05-28 | 230.8 | — |
| gpt-oss-120b (high) | OpenAI | 2025-08-05 | 239.8 | — |
| NVIDIA Nemotron 3 Nano 4B | NVIDIA | 2026-03-16 | 175.6 | 2 |
| Gemma 4 31B (reasoning) | Google | 2026-04-02 | 253.5 | — |
| Command A+ | Cohere | 2026-05-20 | 234.0 | 6 |
| MiniMax-M3 | MiniMax | 2026-06-01 | 290.9 | 19 |
| Nemotron 3 Ultra 550B A55B (reasoning) | NVIDIA | 2026-06-04 | 270.6 | 12 |
| DeepSeek V4 Pro 0813 (max) | DeepSeek | 2026-08-13 | 311.5 | 23 |

MiniMax-M3, Nemotron 3 Ultra, and DeepSeek V4 Pro 0813 are absent from
AA's 28 defaults but have measured v5 scores and already appear in our
current `ai.json`. The oldest published v5 record in this capture is
Nemotron 3 Nano **4B**. It is not the older 30B A3B model labeled
“NVIDIA Nemotron 3 Nano” in our historical snapshots.

For a small reproducible historical reference set, Llama 3.1 405B,
DeepSeek R1 0528, and gpt-oss-120b provide open-weight anchors across
2024–2025, but require the **Progress** scale, not invented v5 rows.
No Intelligence rows or chart selections were changed by this investigation.

## What the comparison means

The [Progress methodology](https://artificialanalysis.ai/methodology/progress-index)
uses item response theory to link models through overlapping evaluations.
It estimates model capability and task difficulty jointly, using task-level
results where coverage permits and aggregate legacy results otherwise.
It does **not** require rerunning every older model on all nine v5 evaluations.

Each included model has results on at least four benchmarks, and each
benchmark covers at least four models. Benchmarks receive equal weight
per model. AA anchors the scale at **OpenAI o3-mini (high) = 220** and
**OpenAI GPT-5.5 (xhigh) = 320**, both verified in the public data.
OpenAI GPT-3.5 Turbo (2022-11-30) also remains scored at **125.2** on
Progress, with a null v5 aggregate.

This supports long-run capability comparisons, not claims that an old
model passed the new private evaluations. For present-day model choice,
AA recommends the current Intelligence Index. Our versioned archives
preserve what each older index measured; raw v4/v5 differences do not
measure a model's improvement on a fixed suite.

## Rechecking the findings

Use [AA Trends](https://artificialanalysis.ai/trends) for Progress and the
[Intelligence Index page](https://artificialanalysis.ai/evaluations/artificial-analysis-intelligence-index)
for current measured aggregates. Load the full public chart data or export,
not just `initialModels` or the lightweight identity catalogs. The lazy-loaded
model dataset is the data the public page normally loads, not a paid export.

Match exact variant slugs. Read `score` for Progress, and require non-null
`intelligenceIndex` with `intelligenceIndexIsEstimated: false` for v5.
The table's slugs, in order, are:

```text
llama-2-chat-70b
llama-3-1-instruct-405b
qwen2-5-72b-instruct
deepseek-r1
gpt-oss-120b
nvidia-nemotron-3-nano-4b
gemma-4-31b
command-a-plus
minimax-m3
nvidia-nemotron-3-ultra-550b-a55b
deepseek-v4-pro
```

The `?models=<comma-separated variant slugs>` query selects these models
in the rendered charts. Raw initial HTML can still contain the defaults;
check the fully loaded dataset before concluding a model has no score.
