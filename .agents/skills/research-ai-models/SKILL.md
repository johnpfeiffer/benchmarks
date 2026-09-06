---
name: research-ai-models
description: Research and update AI model benchmark data on the dashboard (app/src/data/ai.json Artificial Analysis intelligence scores). Use when asked to add a model, refresh scores for a new Artificial Analysis Intelligence Index version, or verify a model's provider, open-weight status, release date, or bar color.
---

# Research AI Models

The dashboard tracks AI models in `app/src/data/ai.json` (Artificial
Analysis Intelligence Index scores). News coverage of models is a separate
concern handled by the `benchmark-news-lookup` skill.

## Sources of truth

Fetch these pages through the Go tool instead of pulling whole pages into
context. The tool is its own Go module: run it from `tools/benchtool/`
(`go run . <command>`) — `go run ./tools/benchtool` from the repo root
fails because the repo root has no go.mod.

- `go run . aa-model <slug-or-url>` prints the model page's
  Intelligence Index score, provider, open-weights status, and release date
  (exits non-zero when no score is found — wrong slug or estimate-only).
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
  version, update the footer credit (`sources[0]` in `App.tsx`) to the new
  article URL. The lead chart's source chip intentionally keeps linking to
  the AA homepage (`intelligenceSource`) — only the footer entry changes.

## ai.json contract

Row shape: `{ "model", "intelligence_score", "provider", "open_weight",
"color", "released" }`.

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
   `go run . ai-add "<model>" <score> "<provider>" [--open-weight] [--color=#hex] --released=<YYYY-MM-DD>`.
   The tool keeps score-descending order, rejects duplicates, and applies
   the provider palette automatically (`--color` only for providers missing
   from the palette). Every row must carry its verified release date
   (a data invariant enforced by the test suite); use the date from step 1,
   or `aa-releases` when filling dates in bulk.
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
