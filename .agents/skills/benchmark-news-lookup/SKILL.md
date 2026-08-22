---
name: benchmark-news-lookup
description: Find, vet, and add credible benchmark news articles to the Hand Picked News feed (app/src/data/news.json). Use when asked to look up news or coverage of an AI model release or benchmark result, when deciding whether an article is credible enough for the feed (independent benchmarks and technical breakdowns over vendor marketing), or when adding a news link to the benchmarks dashboard.
---

# Benchmark News Lookup

The Hand Picked News feed curates benchmark- and fact-focused coverage of AI
models. Vendor announcements are marketing-adjacent, so prefer independent
evaluators and technical breakdowns. Skip political angles and baseless AGI or
cyber speculation.

## What qualifies

Tier 1, independent benchmarkers and technical analysis (strongly preferred):

- Artificial Analysis (`artificialanalysis.ai` articles and model pages): independent Intelligence Index evals
- CodeRabbit blog (`coderabbit.ai/blog`): independent AI code-review benchmarks
- Semgrep blog (`semgrep.dev/blog`): independent security benchmark runs
- Fireworks blog (`fireworks.ai/blog`): inference-provider technical write-ups
- Hugging Face blog (`huggingface.co/blog`): open-weights technical breakdowns
- Interconnects (`interconnects.ai`, Nathan Lambert): technical training/analysis deep dives
- METR (`metr.org/blog`): independent capability evals

Tier 2, vendor primary sources, include when they carry real benchmark tables:

- `anthropic.com/news`, `blog.google`, `thinkingmachines.ai`, `z.ai/blog` and similar
- Established press with genuine technical depth (e.g. `theregister.com` for hardware)

Avoid:

- SEO aggregators and content farms that re-litigate vendor-reported numbers without independent testing
- Political or geopolitical angles, and AGI or cyber hype without data behind it

## Lookup procedure

1. Search per trusted outlet: `"<Model Name>" site:artificialanalysis.ai`,
   `site:coderabbit.ai`, `site:semgrep.dev`, `site:fireworks.ai`,
   `site:huggingface.co/blog`, `site:interconnects.ai`, `site:metr.org`.
   Then run one broad `"<Model Name>" benchmark` search to catch anything new.
2. Fetch each candidate page and confirm it contains substantive benchmark
   results or technical analysis, not a summary of someone else's numbers.
3. Resolve the published date from the page itself (byline or URL path), in
   ISO `YYYY-MM-DD` form.
4. Dedupe against `app/src/data/news.json` before adding.

## Adding an entry

- Entries are `{ "url": "https://…", "date": "YYYY-MM-DD" }`; keep the file
  ordered newest first.
- Validation contract (`app/src/models/parse.ts`): http(s) URLs only, strict
  ISO real calendar dates. The parser re-sorts newest first, so file order is
  convention, not correctness.
- Follow Red/Green TDD: update the news test in
  `app/src/models/__tests__/data.test.ts` (first-entry expectation, the URL
  presence set, and the total count), then the data.
- From `app/`, run `npm test` and `npm run build` (typecheck + production
  build). No task is complete with failing tests.
- Update `architecture.md` only if structure or behavior changed; data-only
  additions usually do not require it.

## Repo guardrails

- `/KERNEL/` is immutable and human-authored; never edit it, and the kernel
  wins any conflict with derived files.
- Keep business logic in `app/src/models/`; views stay dumb.
