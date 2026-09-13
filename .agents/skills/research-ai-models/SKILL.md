---
name: research-ai-models
description: Research and update AI model benchmark data on the dashboard (app/src/data/ai.json Artificial Analysis intelligence scores). Use when asked to add a model, refresh scores for a new Artificial Analysis Intelligence Index version, verify a model's provider, open-weight status, release date, or bar color, or extract total Intelligence Index evaluation costs for a Pareto chart.
---

# Research AI Models

The dashboard tracks AI models in `app/src/data/ai.json` (Artificial
Analysis Intelligence Index scores). News coverage of models is a separate
concern handled by the `benchmark-news-lookup` skill.

## Sources of truth

For score, release-date, and total-cost research, fetch model pages through the
Go tool instead of pulling whole pages into context. For total evaluation
costs, also follow the interpretation rules in the extraction section below.
The tool is its own Go module: run it from `tools/benchtool/`
(`go run . <command>`) — `go run ./tools/benchtool` from the repo root
fails because the repo root has no go.mod.

- `go run . aa-model <slug-or-url> [--json]` prints the model page's
  Intelligence Index score, provider, open-weights status, release date,
  index version, precise total evaluation cost, and cost provenance/precision.
  JSON mode emits numbers and booleans with their native types for easier
  Pareto snapshot authoring. The command exits non-zero when no score is found
  (wrong slug or estimate-only); unavailable cost fields are missing/null.
- `go run . aa-releases` prints every AA leaderboard
  variant's release date as TSV (one fetch; includes deprecated models) for
  filling or checking the `released` field across ai.json.

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
  version, update the footer credit (`sources[0]` in `App.tsx`): both the
  article URL and the version number in its label
  (`Artificial Analysis Intelligence Index vX.Y`). The lead chart's source
  chip intentionally keeps linking to the AA homepage (`intelligenceSource`)
  — only the footer entry changes.

## ai.json contract

Row shape: `{ "model", "intelligence_score", "cost_usd"?, "provider",
"open_weight", "color", "released" }`.

- INV-001: every row requires a provider; the parser throws at load
  otherwise. Missing provider = add one, never omit.
- `open_weight` defaults to false; set true only for the curated
  open-weight families: kimi, minimax, deepseek, nemotron, qwen, glm,
  mistral, gemma, gpt-oss, inkling.
- `color` is optional in the type but `ai.json` carries one per row.
  Provider palette (kernel `requirements-v1.md` is the authority;
  `IntelligenceBarChart` has the same fallback map): Anthropic `#cc785c`,
  OpenAI `#1f1f1f`, xAI/Grok `#736cd3`, Z AI `#1c7ff8`, Google `#34A853`,
  DeepSeek `#2243e6`, Moonshot/Kimi `#00B4D8`, NVIDIA `#86b737`,
  Alibaba/Qwen `#F54F35`, Cerebras `#F15929`. Unknown providers fall back
  to the theme gray.
- `released` is the model's release date (`YYYY-MM-DD`) or null; the data
  invariant requires it populated for every row.
- `cost_usd` is optional: the precise total USD Artificial Analysis charges
  to run the Intelligence Index on the model, read from the same model page
  under the same index version as the score. Omit the key when AA publishes
  no precise total (or a $0 total, which the Pareto log axis cannot plot).
  The parser rejects zero, negative, and non-numeric values (`MODEL-COST`).
  Costed rows feed the Pareto chart's default snapshot
  (`paretoSnapshotFromModels` in `app/src/models/pareto.ts`).
- Naming: effort suffix in parentheses — `(max)`, `(xhigh)`, `(high)`;
  dated variants keep their date slug (`DeepSeek V4 Pro 0813 (max)`).
  `hardware.json` joins `ai.json` rows via `modelMatchKey` (lowercases,
  strips `(...)` suffixes and the word `preview`); a rename that breaks
  the join fails `data.test.ts`.
- Keep the file roughly sorted by `intelligence_score` descending.

## Update procedures

Add a model:

1. Run `go run . aa-model <slug>` (from `tools/benchtool/`) for the score,
   provider, open-weights status, and release date; confirm the variant
   matches the naming convention.
2. Insert the row with
   `go run . ai-add "<model>" <score> "<provider>" [--open-weight] [--color=#hex] --released=<YYYY-MM-DD> [--cost=USD]`.
   The tool keeps score-descending order, rejects duplicates, and applies
   the provider palette automatically (`--color` only for providers missing
   from the palette). Every row must carry its verified release date
   (a data invariant enforced by the test suite); use the date from step 1,
   or `aa-releases` when filling dates in bulk. Pass `--cost=` with the
   precise total from step 1 when the model page publishes one.
3. No test edits are needed for the new row: the acceptance suite
   (`app/src/views/__tests__/acceptance.test.tsx`) renders the real data
   through the UI and checks every JSON row appears in its listing, and
   `data.test.ts` holds only cross-file invariants (unique names, score
   order, color presence, release dates populated).

Refresh scores for a new Intelligence Index version:

1. Fetch the leaderboard (Status: All) and the version article.
2. Build an old → new table of every changed score for the PR body.
3. For leaderboard-missing models: check Status first, then ask the user
   keep-vs-remove for each — never silently delete rows that
   `hardware.json` or news still reference.
4. Update the footer article URL in `App.tsx` (`sources[0]` only) and the
   version mention in `architecture.md`.

## Extract total Intelligence Index evaluation costs

The target metric is **Cost to Run Artificial Analysis Intelligence Index**:
USD to run all evaluations in the index. It is not input/output pricing per
million tokens, a blended token price, or the weighted **Cost per Intelligence
Index task**. Do not derive the total by multiplying the latter by a task
count; that metric uses evaluation weights.

1. Run `go run . aa-model <slug-or-url> --json` from `tools/benchtool/`.
   It extracts the requested model's own precise Comparison Summary total and
   index version without scraping the comparison chart. Open the requested AA
   `/models/<slug>` page when the command reports a missing field. Its charts contain
   other models too: the page slug is not the identity of every plotted point.
   Confirm the exact model, reasoning/effort variant, and provider (INV-001).
2. For a single model, prefer its own page's **Comparison Summary**: it can
   expose a precise total in the sentence describing the cost to evaluate the
   model on the Intelligence Index, even when chart values are absent from
   text extraction. Read only the relevant summary and index-version text.
3. For chart inspection, go to **Cost**, then **Intelligence Index Total Cost**
   for the stacked bar chart, or **Intelligence Index vs. Total Cost** for the
   Pareto chart. Confirm the title/axis says total cost, not cost per task.
   Use the table toggle if available, otherwise hover the exact bar or point
   in a rendered browser. Check model selections and Model Comparison versus
   API Provider Benchmarks; endpoint-specific runs must retain that identity.
4. Prefer a precise displayed total (summary, table, Pareto tooltip, or an
   authorized export) over rounded bar labels. Preserve USD decimals; do not
   estimate from bar height or the logarithmic x-axis. If only a rounded
   value is available, label it rounded rather than inventing cents. If a
   download requires paid access, use public displayed values or ask for the
   user's export; do not bypass the gate.
5. Capture source URL, retrieval date, index version, exact variant/provider,
   intelligence score, total USD cost, and whether the value is rounded.
   Pair scores and costs from the same index version/snapshot; never silently
   combine current costs with older `ai.json` scores. If the version or total
   is unavailable, report that gap rather than assume it.

Verified examples on 2026-09-13 (page text identified index v4.3; these are
dated examples, not constants to reuse without checking):

- [GLM-5.3-Flash](https://artificialanalysis.ai/models/glm-5-3-flash):
  Z AI, intelligence 42, total **$280.28**. The user-supplied screenshots
  show $280.28 in the Pareto tooltip and **$280** in the bar tooltip.
- [Gemini 3.5 Flash-Lite](https://artificialanalysis.ai/models/gemini-3-5-flash-lite):
  Google, intelligence 23, total **$266.94**, displayed as $267 in the
  supplied bar-chart screenshot. Its $0.12 cost per task is a different metric.

The GLM screenshot's component labels (Output $15, Reasoning $76, Cache Write
$22, Cache Read $164, Non-Cache Input $4) sum to $281 because the components
are independently rounded. Keep the authoritative $280.28 total; do not
replace it with the sum of rounded components. Capture component costs only
when requested and preserve their original labels and precision.

For a requested data update, record the verified total on the model's
`ai.json` row as `cost_usd` (the contract above); the Pareto chart's default
snapshot derives automatically from costed rows. When a refresh re-snapshots
scores under a new index version, bump `PARETO_SNAPSHOT_VERSION` and
`PARETO_SNAPSHOT_DATE` in `app/src/models/pareto.ts` to the new version and
the retrieval date. Keep provenance (source URL, retrieval date, precision)
in the PR body or accompanying research notes. A skill-only request does not
authorize changing benchmark data.

## Validation and PR workflow

- From `app/`, run `npm test` (typecheck + vitest) and `npm run build`.
  No task is complete with failing tests.
- `architecture.md` documents data conventions (index version tracked);
  update it when conventions change — the kernel requires
  double-checking it.
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
  score, plus anything deliberately left unchanged.

## Repo guardrails

- `/KERNEL/` is immutable and human-authored; never edit it, and the
  kernel wins any conflict with derived files.
- Keep business logic in `app/src/models/`; views stay dumb.
- The Pareto frontier image's relative `images/...` URL is intentional and
  works (the deployed host injects `<base href="/benchmarks/">`); do not
  "fix" it — see `architecture.md`.
