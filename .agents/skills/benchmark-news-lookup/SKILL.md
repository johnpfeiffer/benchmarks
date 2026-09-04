---
name: benchmark-news-lookup
description: Find, vet, and add credible benchmark news articles to the Hand Picked News feed (app/src/data/news.json). Use when asked to look up news or coverage of an AI model release or benchmark result, when deciding whether an article is credible enough for the feed (independent benchmarks and technical breakdowns over vendor marketing), when resolving an article's true published date or canonical URL, or when adding a news link to the benchmarks dashboard.
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

Tier 2, vendor primary sources, only after critical vetting:

- Judge a vendor's own piece on its substance, not its logo. A launch post
  with few facts and a cherry-picked benchmark selection is marketing, not
  evidence — skip it even when it contains some tables. Precedent: the
  blog.google Gemini 3.8 Flash launch post was vetted and dropped for
  exactly this.
- A vendor piece qualifies only when it carries full benchmark tables with
  real methodology and numbers (e.g. `anthropic.com/news` launch posts with
  eval suites, `thinkingmachines.ai`, `z.ai/blog`).
- Established press with genuine technical depth (e.g. `theregister.com`
  for hardware).
- In every case, prefer thorough third-party analysis with technical
  details and honest pros and cons over a vendor's own account.

Avoid:

- SEO aggregators and content farms that re-litigate vendor-reported numbers without independent testing
- Political or geopolitical angles, and AGI or cyber hype without data behind it

Prefer omission over guessing. When an article's credibility is borderline,
leave it out of `news.json` and list it in the PR body as a candidate for
human veto instead of silently adding it.

## Lookup procedure

1. Search per trusted outlet: `"<Model Name>" site:artificialanalysis.ai`,
   `site:coderabbit.ai`, `site:semgrep.dev`, `site:fireworks.ai`,
   `site:huggingface.co/blog`, `site:interconnects.ai`, `site:metr.org`.
   Then run one broad `"<Model Name>" benchmark` search to catch anything new.
2. Run `go run ./tools/benchtool fetch-meta <url>` for each candidate
   instead of fetching whole pages into context: it prints the title,
   canonical URL, final URL after redirects, and every date signal (URL
   path, JSON-LD, `article:published_time`, `<time>`, visible-date
   candidates). Only full-fetch a page when fetch-meta leaves the credibility
   or date genuinely undecidable.
3. Resolve the published date (next section) and the canonical URL.
4. Dedupe against `app/src/data/news.json` (`benchtool news-add` also
   hard-fails on duplicate URLs), and list any skipped duplicates in the PR
   body.

## Canonical URL rules

- Use the original outlet's URL, not a syndication or aggregator copy
  (e.g. not the Yahoo republish of another site's article), and strip
  tracking parameters.
- Verify the live page actually serves the article. A 403 or Cloudflare
  challenge means bot-blocked, not defunct; the original URL stays canonical
  (retry with a browser user-agent to confirm content). On a real 404,
  web-search the article title for a moved canonical on the same site before
  giving up; publishers re-slug posts.

## Resolve the published date

The feed needs the original publication date, and dates here have needed
correction before (see the Gemini Flash date comment in `data.test.ts`), so
record the date source in the PR body.

Resolution order, cheapest first (fetch-meta prints all of these signals):

1. URL path (`/2026/08/14/`, or a `/2026/08/` month prefix confirmed against
   the page).
2. Page metadata: JSON-LD `"datePublished"`, `article:published_time`,
   `<time datetime="...">`.
3. The visible byline date next to the title.
4. Web-search snippets for the exact article title.

Trust pitfalls:

- Conflicting fields on one page are common (a `datePublished` vs an
  update-stamped `article:published_time`). The value that agrees with the
  visible byline wins; document the conflict in the PR body.
- Related-posts sidebars and page chrome pollute visible-date scans;
  fetch-meta lists every visible date candidate on the page, and only the
  one adjacent to the article's own title or byline counts.
- Beware CMS restamps: an "updated" or migration date is not the publication
  date.

No precision fallback exists here: `news.json` requires a real ISO calendar
date (`parse.ts` enforces `YYYY-MM-DD`). If the exact day stays unverifiable,
do not guess; omit the entry and flag it in the PR body.

## Adding an entry

- Add entries with `go run ./tools/benchtool news-add <url> <YYYY-MM-DD>`
  (run from anywhere in the repo): it validates the http(s) URL and strict
  ISO calendar date, hard-fails on duplicate URLs, and inserts the entry so
  the file stays ordered newest first.
- Entries are `{ "url": "https://…", "date": "YYYY-MM-DD" }`.
- Validation contract (`app/src/models/parse.ts`): http(s) URLs only, strict
  ISO real calendar dates — the tool mirrors it, and `npm test` remains the
  final gate. The parser re-sorts newest first, so file order is convention,
  not correctness.
- Follow Red/Green TDD: update the news test in
  `app/src/models/__tests__/data.test.ts` (first-entry expectation, the URL
  presence set, and the total count), then the data.
- From `app/`, run `npm test` and `npm run build` (typecheck + production
  build). No task is complete with failing tests.
- Update `architecture.md` only if structure or behavior changed; data-only
  additions usually do not require it.
- If adding a link surfaces pre-existing anomalies (bad dates, duplicate
  URLs), surface them in the PR body and fix them in a separate commit, so
  they are easy to review or drop.

## PR workflow

- Branch off the latest `main`, commit with a short lowercase message
  (matching repo history, e.g. `news: add ...`), push, and open the PR with
  `gh pr create --base main`.
- Push auth: reuse the authenticated `gh` session via
  `git config credential.helper "!gh auth git-credential"` (or a one-off
  `git -c credential.helper='!gh auth git-credential' push`), and set a
  repo-local `user.name`/`user.email` if git has no identity.
- The PR body should list added links with their resolved published dates and
  the evidence for each date, plus any omitted candidates and duplicates.

## Repo guardrails

- `/KERNEL/` is immutable and human-authored; never edit it, and the kernel
  wins any conflict with derived files.
- Keep business logic in `app/src/models/`; views stay dumb.
