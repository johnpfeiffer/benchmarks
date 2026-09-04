---
name: research-ai-models
description: Research and update AI model benchmark data on the dashboard (app/src/data/ai.json Artificial Analysis intelligence scores, app/src/data/swe.json Senior SWE Bench runs). Use when asked to add a model, refresh scores for a new Artificial Analysis Intelligence Index version, sync the Senior SWE Bench leaderboard, verify a model's provider or open-weight status or color, or reconcile models that appear on one leaderboard but not the other.
---

# Research AI Models

Two datasets track AI models: `app/src/data/ai.json` (Artificial Analysis
Intelligence Index scores) and `app/src/data/swe.json` (Senior SWE Bench
runs). News coverage of models is a separate concern handled by the
`benchmark-news-lookup` skill.

## Sources of truth

Fetch these pages through the Go tool instead of pulling whole pages into
context (run from anywhere in the repo):

- `go run ./tools/benchtool aa-model <slug-or-url>` prints the model page's
  Intelligence Index score, provider, open-weights status, and release date
  (exits non-zero when no score is found — wrong slug or estimate-only).
- `go run ./tools/benchtool swe-list` prints the Senior SWE Bench
  leaderboard (no_cheating filter) as TSV: rank, model, harness, effort,
  tasteful, basic, steps, tokens, cost.

Artificial Analysis:

- Leaderboard: https://artificialanalysis.ai/leaderboards/models
  - The default view hides superseded models behind "Status: Current";
    switch to All before concluding a model is gone.
  - Scores marked `*` are estimates; the column to use is the Artificial
    Analysis Intelligence Index (no other column goes into `ai.json`).
  - Each model links to a `/models/<slug>` page; record that slug in the
    PR body for the models you touch.
  - Pick the reasoning/max-effort variant consistent with existing naming
    (e.g. "with fallback" maps to the `(max)` suffix).
- Index version articles (e.g. `.../articles/artificial-analysis-intelligence-index-v4-1-1`)
  announce each score revision. When scores are refreshed for a new index
  version, update the footer credit (`sources[0]` in `App.tsx`) to the new
  article URL. The lead chart's source chip intentionally keeps linking to
  the AA homepage (`intelligenceSource`) — only the footer entry changes.

Senior SWE Bench: https://senior-swe-bench.snorkel.ai/agents?f_behavior=no_cheating

- The large-font number on a run card is the TASTEFUL solve rate; the
  leaderboard table lists Tasteful then Basic. `tasteful_solve_rate_pct`
  comes first in `swe.json`.
- Also capture harness (currently always "Mini-SWE-Agent"), effort, avg
  steps, and avg output tokens.
- The site periodically drops older runs; rows only on our side are kept
  unless the user says otherwise (precedent: Kimi K2.6, GPT-5.6 Luna,
  Inkling, Claude Sonnet 4.6 retained at last published values, noted in
  `architecture.md`).

## ai.json contract

Row shape: `{ "model", "intelligence_score", "provider", "open_weight", "color" }`.

- INV-001: every row requires a provider; the parser throws at load
  otherwise. Missing provider = add one, never omit.
- `open_weight` defaults to false; set true only for families in
  `parse.ts` `OPEN_WEIGHT_PREFIXES`: kimi, minimax, deepseek, nemotron,
  qwen, glm, mistral, gemma, gpt-oss, inkling.
- `color` is optional in the type but `ai.json` carries one per row.
  Provider palette (kernel `requirements-v1.md` is the authority;
  `IntelligenceBarChart` has the same fallback map): Anthropic `#cc785c`,
  OpenAI `#1f1f1f`, xAI/Grok `#736cd3`, Z AI `#1c7ff8`, Google `#34A853`,
  DeepSeek `#2243e6`, Moonshot/Kimi `#00B4D8`, NVIDIA `#86b737`,
  Alibaba/Qwen `#F54F35`, Cerebras `#F15929`. Unknown providers fall back
  to the theme gray.
- Naming: effort suffix in parentheses — `(max)`, `(xhigh)`, `(high)`;
  dated variants keep their date slug (`DeepSeek V4 Pro 0813 (max)`).
  Names must differ across charts only by the parenthetical so
  `modelMatchKey` can join them.
- Keep the file roughly sorted by `intelligence_score` descending.

## swe.json contract

Row shape: `{ "model", "harness", "effort", "tasteful_solve_rate_pct",
"basic_solve_rate_pct", "avg_steps", "avg_tokens" }`.

- No `rank` field (removed in PR #28); keep the file sorted by tasteful
  solve rate descending.
- Provider is NOT stored: `parse.ts` `SWE_PROVIDER_RULES` infers it from a
  model-family prefix (Claude, GPT, Grok, GLM, Kimi, Gemini, MiniMax,
  Inkling). A model from a new family makes parsing throw INV-001 — add a
  rule there, in the same PR.
- `open_weight` is inferred via `isOpenWeightModel` prefixes (same list as
  above).
- `effort` is not on `ModelEntry`; it is baked into the entry id
  `provider:model:harness:effort`. When the site re-runs a model at a new
  effort, the id changes — assert the change via the id in tests.
- SWE↔AI matching: `modelMatchKey` lowercases, strips `(...)` suffixes and
  the word `preview`. Every SWE model MUST have a matching `ai.json` row
  (regression test in `data.test.ts`); SWE-only models are merged into the
  main table as not-open-weight so the charts propagate deselection.
  Adding a SWE run for a model with no AI row means adding that AI row too.

## Update procedures

Add a model:

1. Run `go run ./tools/benchtool aa-model <slug>` for the score, provider,
   open-weights status, and release date; confirm the variant matches the
   naming convention.
2. Insert the row with
   `go run ./tools/benchtool ai-add "<model>" <score> "<provider>" [--open-weight] [--color=#hex]`.
   The tool keeps score-descending order, rejects duplicates, and applies
   the provider palette automatically (`--color` only for providers missing
   from the palette).
3. Add a per-model assertion in `app/src/models/__tests__/data.test.ts`
   (score, provider, open_weight) following the existing test style.
4. If the model also has a SWE run (`benchtool swe-list`), add that row with
   `go run ./tools/benchtool swe-add "<model>" <harness> <effort> <tasteful> <basic> <steps> <tokens>`
   (contract above; the tool inserts tasteful-descending and formats rates
   with one decimal).

Refresh scores for a new Intelligence Index version:

1. Fetch the leaderboard (Status: All) and the version article.
2. Build an old → new table of every changed score for the PR body.
3. For leaderboard-missing models: check Status first, then ask the user
   keep-vs-remove for each — never silently delete rows that SWE or news
   still reference.
4. Update the footer article URL in `App.tsx` (`sources[0]` only) and the
   version mention in `architecture.md`.

Sync Senior SWE Bench:

1. Fetch the agents page with the no_cheating filter.
2. Update changed rows in place (tasteful first, basic second; watch for
   effort changes that alter the id), append new runs, re-sort by tasteful.
3. Decide dropped runs with the user; default is to keep at last values.
4. Update the SWE assertions and entry count in `data.test.ts`.

## Validation and PR workflow

- Red/Green TDD: update the `data.test.ts` assertions alongside the data
  (per-model scores, SWE values and count, SWE↔AI matching).
- From `app/`, run `npm test` and `npm run build`. No task is complete
  with failing tests.
- `architecture.md` documents data conventions (index version tracked,
  retained SWE models); update it when conventions change — the kernel
  requires double-checking it.
- Branch off the latest `main`, commit with a short lowercase prefix
  matching repo history (`feat:`, `tweak:`, `fix:`, `data:`), push, and
  open the PR with `gh pr create --base main`. Include the
  `Co-authored-by: factory-droid[bot] <138933559+factory-droid[bot]@users.noreply.github.com>`
  trailer.
- Push auth: reuse the authenticated `gh` session via
  `git config credential.helper "!gh auth git-credential"` (or a one-off
  `git -c credential.helper='!gh auth git-credential' push`), and set a
  repo-local `user.name`/`user.email` if git has no identity.
- The PR body lists sources used and an old → new table for every changed
  score or solve rate, plus anything deliberately left unchanged.

## Repo guardrails

- `/KERNEL/` is immutable and human-authored; never edit it, and the
  kernel wins any conflict with derived files.
- Keep business logic in `app/src/models/`; views stay dumb.
