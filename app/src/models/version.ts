/**
 * Artificial Analysis Intelligence Index version tags ("v4.2", "v4.3", …),
 * as listed in AA's methodology version history. ai.json keeps one row per
 * model per version so older snapshots survive a methodology revision; these
 * helpers order and enumerate the versions present in a row set.
 */

/** Positive when `a` is the newer version; missing parts count as zeros (v4.2 == v4.2.0). */
export function compareAAVersions(a: string, b: string): number {
  const pa = a.replace(/^v/, '').split('.').map(Number)
  const pb = b.replace(/^v/, '').split('.').map(Number)
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0)
    if (diff !== 0) return diff
  }
  return 0
}

/** Distinct versions present in the rows, newest first. */
export function aaVersionsDesc(entries: readonly { aa_version: string }[]): string[] {
  return [...new Set(entries.map((entry) => entry.aa_version))].sort((a, b) => compareAAVersions(b, a))
}

/** Rows of one version, preserving input order. */
export function filterByAAVersion<T extends { aa_version: string }>(entries: readonly T[], version: string): T[] {
  return entries.filter((entry) => entry.aa_version === version)
}
