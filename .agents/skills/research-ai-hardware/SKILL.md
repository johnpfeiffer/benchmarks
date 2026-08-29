---
name: research-ai-hardware
description: Research and update AI hardware data on the dashboard (app/src/data/hardware.json open-weight model quant sizes, app/src/data/gpu.json GPU specs). Use when asked to add or refresh a model's Unsloth GGUF 1-bit or 2-bit quant sizes, add a GPU, fix GPU specs such as memory, bandwidth, or dense FP16 TFLOPS, or vet and dedupe hardware data sources.
---

# Research AI Hardware

Two datasets cover hardware: `app/src/data/hardware.json` (estimated disk
sizes for running open-weight models locally, the "HuggingFace Estimated
Hardware" chart) and `app/src/data/gpu.json` (the GPU specifications
table).

## hardware.json — Unsloth GGUF quant sizes

Row shape: `{ "model", "provider", "total_params", "iq1_s_gb",
"iq1_m_gb", "iq2_xxs_gb", "iq2_m_gb", "url" }`.

- Source of truth: the Unsloth GGUF repos on Hugging Face,
  `https://huggingface.co/unsloth/<Model>-GGUF` (the org root
  `https://huggingface.co/unsloth` is the section's credited source).
- The four quant columns are the GGUF file sizes in GB for Unsloth's
  dynamic quants: `UD-IQ1_S`, `UD-IQ1_M`, `UD-IQ2_XXS`, `UD-IQ2_M`. Read
  them from the repo's file list; the UI calls them "estimated sizes".
  Use SI GB with 1–2 decimals, matching existing rows (74.8, 594, 8.53).
- `null` means that quant is not published for the model — legitimate and
  common; never invent a size.
- `total_params` is a human string (`"264B"`, `"2.8T"`); `provider` and
  `url` are required (INV-001, missing `url` breaks the chart's HF link).
- Only open-weight models belong here; Unsloth publishes GGUFs for open
  weights. Rows track a specific variant (e.g. `GLM-5.2 (max)`).

## gpu.json — GPU specifications

Row shape: `{ "model", "date", "memory", "memory_type",
"memory_bandwidth_gbs", "fp16_tflops" }`.

- `model` and `date` are required; `memory_type`, `memory_bandwidth_gbs`,
  and `fp16_tflops` may be `null` when genuinely unknown.
- `date` is `"YYYY"` or `"YYYY-MM"`; `memory` is a string and may carry a
  range (`"80 GB"`, `"40-80 GB"`).
- `fp16_tflops` is the DENSE FP16/BF16 tensor number — the column is
  titled "Dense FP16 TFLOPS". NVIDIA marketing pages often lead with the
  sparse figure (2× dense); always use dense and say so in the PR body.
- Use exact marketing names and treat variants as separate rows:
  `RTX Pro 6000 Blackwell` vs `RTX Pro 6000 Server Edition` are different
  parts with different specs (a past fix renamed one and corrected its
  dense FP16), and datacenter parts split into `(SXM)` and `(PCIe)` rows
  when their specs differ (see the A100/H100 pairs).
- Sources, in rough order of authority: NVIDIA product pages and
  newsroom (`nvidia.com/en-us/data-center/...`, `nvidianews.nvidia.com`),
  TechPowerUp GPU database (`techpowerup.com/gpu-specs/`), ThunderCompute
  spec guides, Wikipedia microarchitecture pages, Inferbase GPU catalog.
  Cross-check bandwidth and TFLOPS against at least two sources; note
  conflicts and which value won in the PR body.
- Every source used goes into the `gpuSources` list in `App.tsx`, which
  renders as the "Sources:" line under the GPU table. Add new links
  there and dedupe (a past PR existed just to dedupe these); the page
  footer intentionally keeps only the non-GPU sources (Artificial
  Analysis, Senior SWE Bench, HuggingFace).

## Validation and PR workflow

- `data.test.ts` anchors both datasets: `hardware` has 6 rows, `gpu` has
  14, plus per-row spot values. Update the assertions and counts in the
  same commit as the data (Red/Green TDD).
- From `app/`, run `npm test` and `npm run build`. No task is complete
  with failing tests.
- Update `architecture.md` only if structure or behavior changed;
  data-only additions usually do not require it.
- Branch off the latest `main`, commit with a short lowercase prefix
  matching repo history (`feat:`, `tweak:`, `fix:`, `data:`), push, and
  open the PR with `gh pr create --base main`. Include the
  `Co-authored-by: factory-droid[bot] <138933559+factory-droid[bot]@users.noreply.github.com>`
  trailer.
- Push auth: reuse the authenticated `gh` session via
  `git config credential.helper "!gh auth git-credential"` (or a one-off
  `git -c credential.helper='!gh auth git-credential' push`), and set a
  repo-local `user.name`/`user.email` if git has no identity.
- The PR body lists every source consulted per row, flags `null`s and
  dense-vs-sparse calls, and notes any dropped candidates.

## Repo guardrails

- `/KERNEL/` is immutable and human-authored; never edit it, and the
  kernel wins any conflict with derived files.
- Keep business logic in `app/src/models/`; views stay dumb.
