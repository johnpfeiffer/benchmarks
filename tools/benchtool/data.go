package main

import (
	"encoding/json"
	"fmt"
	"net/url"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strconv"
	"strings"
	"time"
)

// dataDir locates app/src/data by walking up from the working directory, so
// the tool works from the repo root, app/, or tools/benchtool.
func dataDir() (string, error) {
	dir, err := os.Getwd()
	if err != nil {
		return "", err
	}
	for {
		candidate := filepath.Join(dir, "app", "src", "data")
		if st, err := os.Stat(candidate); err == nil && st.IsDir() {
			return candidate, nil
		}
		parent := filepath.Dir(dir)
		if parent == dir {
			return "", fmt.Errorf("could not locate app/src/data above the working directory")
		}
		dir = parent
	}
}

func readJSON(path string, v any) error {
	data, err := os.ReadFile(path)
	if err != nil {
		return err
	}
	return json.Unmarshal(data, v)
}

func jsonString(s string) string {
	b, _ := json.Marshal(s)
	return string(b)
}

// --- news.json ---

type newsRow struct {
	URL  string `json:"url"`
	Date string `json:"date"`
}

// validateISO8601Date mirrors the strict real-calendar-date guard in
// app/src/models/parse.ts (parseNewsEntries).
func validateISODate(s string) error {
	t, err := time.Parse("2006-01-02", s)
	if err != nil || t.Format("2006-01-02") != s {
		return fmt.Errorf("invalid date %q: must be a real YYYY-MM-DD calendar date", s)
	}
	return nil
}

func validateHTTPURL(s string) error {
	u, err := url.Parse(s)
	if err != nil || (u.Scheme != "http" && u.Scheme != "https") || u.Host == "" {
		return fmt.Errorf("invalid URL %q: only http(s) URLs are allowed", s)
	}
	return nil
}

func cmdNewsAdd(rawURL, date string) error {
	if err := validateHTTPURL(rawURL); err != nil {
		return err
	}
	if err := validateISODate(date); err != nil {
		return err
	}
	dir, err := dataDir()
	if err != nil {
		return err
	}
	path := filepath.Join(dir, "news.json")
	var rows []newsRow
	if err := readJSON(path, &rows); err != nil {
		return err
	}
	for _, r := range rows {
		if r.URL == rawURL {
			return fmt.Errorf("duplicate: %s already in news.json", rawURL)
		}
	}
	rows = append(rows, newsRow{URL: rawURL, Date: date})
	sort.SliceStable(rows, func(i, j int) bool { return rows[i].Date > rows[j].Date })
	out, err := json.MarshalIndent(rows, "", "  ")
	if err != nil {
		return err
	}
	if err := os.WriteFile(path, append(out, '\n'), 0o644); err != nil {
		return err
	}
	fmt.Printf("news.json: inserted %s (%s), now %d entries\n", rawURL, date, len(rows))
	return nil
}

// --- ai.json ---

type aiRow struct {
	Model string `json:"model"`
	Score int    `json:"intelligence_score"`
	// AAVersion tags the Intelligence Index version the score (and cost)
	// were measured under, per AA's methodology version history. ai.json
	// keeps one row per model per version, newest block first.
	AAVersion string `json:"aa_version"`
	// CostUSD is the precise total Artificial Analysis charges to run the
	// Intelligence Index on this model (comparison summary), from the same
	// index version as Score. Nil renders the field away entirely; a row
	// either carries a verified positive cost or no cost key at all.
	CostUSD    *float64 `json:"cost_usd,omitempty"`
	Provider   string   `json:"provider"`
	OpenWeight bool     `json:"open_weight"`
	Color      string   `json:"color"`
	// Released is the model's release date (YYYY-MM-DD); nil renders null
	// for models whose date is unknown or unverified.
	Released *string `json:"released"`
}

// providerColors mirrors the palette in the research-ai-models skill and
// IntelligenceBarChart's fallback map.
var providerColors = map[string]string{
	"Anthropic":   "#cc785c",
	"OpenAI":      "#1f1f1f",
	"xAI":         "#736cd3",
	"Z AI":        "#1c7ff8",
	"Google":      "#34A853",
	"DeepSeek":    "#2243e6",
	"Moonshot AI": "#00B4D8",
	"NVIDIA":      "#86b737",
	"Alibaba":     "#F54F35",
	"Cerebras":    "#F15929",
}

func renderAIRow(r aiRow) string {
	cost := ""
	if r.CostUSD != nil {
		cost = fmt.Sprintf(`, "cost_usd": %s`, strconv.FormatFloat(*r.CostUSD, 'f', -1, 64))
	}
	released := "null"
	if r.Released != nil {
		released = jsonString(*r.Released)
	}
	return fmt.Sprintf(`{"model": %s, "intelligence_score": %d, "aa_version": %s%s, "provider": %s, "open_weight": %t, "color": %s, "released": %s}`,
		jsonString(r.Model), r.Score, jsonString(r.AAVersion), cost, jsonString(r.Provider), r.OpenWeight, jsonString(r.Color), released)
}

// aaVersionPattern mirrors the MODEL-AA-VERSION invariant in
// app/src/models/parse.ts: v<digits>[.<digits>]* such as v4.3 or v4.1.1.
var aaVersionPattern = regexp.MustCompile(`^v\d+(\.\d+)*$`)

func validateAAVersion(s string) error {
	if !aaVersionPattern.MatchString(s) {
		return fmt.Errorf("invalid AA version %q: expected v<major>[.<minor>...] like v4.3", s)
	}
	return nil
}

// compareAAVersions returns > 0 when a is the newer tag ("v4.3" vs "v4.2");
// missing parts count as zeros ("v4.2" == "v4.2.0"). Mirrors compareAAVersions
// in app/src/models/version.ts.
func compareAAVersions(a, b string) int {
	pa := versionParts(a)
	pb := versionParts(b)
	n := len(pa)
	if len(pb) > n {
		n = len(pb)
	}
	for i := 0; i < n; i++ {
		var x, y int
		if i < len(pa) {
			x = pa[i]
		}
		if i < len(pb) {
			y = pb[i]
		}
		if x != y {
			return x - y
		}
	}
	return 0
}

func versionParts(v string) []int {
	parts := strings.Split(strings.TrimPrefix(v, "v"), ".")
	out := make([]int, len(parts))
	for i, p := range parts {
		n, _ := strconv.Atoi(p)
		out[i] = n
	}
	return out
}

// parseAICost validates a --cost=USD flag value: a positive finite dollar
// amount. Zero is rejected because the Pareto chart's log cost axis (and the
// app-side parser) require a positive cost.
func parseAICost(flag string) (float64, error) {
	cost, err := strconv.ParseFloat(strings.TrimPrefix(flag, "--cost="), 64)
	if err != nil {
		return 0, fmt.Errorf("cost %q is not a number", flag)
	}
	if cost <= 0 {
		return 0, fmt.Errorf("cost must be a positive USD amount, got %v", cost)
	}
	return cost, nil
}

func cmdAIAdd(args []string) error {
	var positional []string
	row := aiRow{}
	for _, a := range args {
		switch {
		case a == "--open-weight":
			row.OpenWeight = true
		case strings.HasPrefix(a, "--color="):
			row.Color = strings.TrimPrefix(a, "--color=")
		case strings.HasPrefix(a, "--released="):
			date := strings.TrimPrefix(a, "--released=")
			if err := validateISODate(date); err != nil {
				return err
			}
			row.Released = &date
		case strings.HasPrefix(a, "--cost="):
			cost, err := parseAICost(a)
			if err != nil {
				return err
			}
			row.CostUSD = &cost
		case strings.HasPrefix(a, "--aa-version="):
			version := strings.TrimPrefix(a, "--aa-version=")
			if err := validateAAVersion(version); err != nil {
				return err
			}
			row.AAVersion = version
		default:
			positional = append(positional, a)
		}
	}
	if len(positional) != 3 {
		return fmt.Errorf("ai-add expects <model> <score> <provider> --aa-version=vX.Y [--open-weight] [--color=#hex] [--released=YYYY-MM-DD] [--cost=USD]")
	}
	if row.AAVersion == "" {
		return fmt.Errorf("ai-add requires --aa-version=vX.Y (the Intelligence Index version the score was measured under, e.g. v4.3)")
	}
	row.Model, row.Provider = positional[0], positional[2]
	score, err := strconv.Atoi(positional[1])
	if err != nil {
		return fmt.Errorf("score %q is not an integer", positional[1])
	}
	row.Score = score
	if strings.TrimSpace(row.Model) == "" || strings.TrimSpace(row.Provider) == "" {
		return fmt.Errorf("model and provider must be non-empty (INV-001)")
	}
	if row.Color == "" {
		row.Color = providerColors[row.Provider]
	}
	if row.Color == "" {
		return fmt.Errorf("no palette color for provider %q; pass --color=#hex", row.Provider)
	}

	dir, err := dataDir()
	if err != nil {
		return err
	}
	path := filepath.Join(dir, "ai.json")
	var rows []aiRow
	if err := readJSON(path, &rows); err != nil {
		return err
	}
	for _, r := range rows {
		if r.Model == row.Model && r.AAVersion == row.AAVersion {
			return fmt.Errorf("duplicate: %q already has a %s row in ai.json", row.Model, row.AAVersion)
		}
	}
	// ai.json is grouped into one block per AA version, newest first, score
	// descending within a block. Insert into the matching block; a brand-new
	// version starts its own block in newest-first position.
	at := len(rows)
	blockStart, blockEnd := -1, -1
	for i, r := range rows {
		if r.AAVersion == row.AAVersion {
			if blockStart == -1 {
				blockStart = i
			}
			blockEnd = i + 1
		}
	}
	if blockStart != -1 {
		at = blockEnd
		for i := blockStart; i < blockEnd; i++ {
			if rows[i].Score < row.Score {
				at = i
				break
			}
		}
	} else {
		for i, r := range rows {
			if compareAAVersions(row.AAVersion, r.AAVersion) > 0 {
				at = i
				break
			}
		}
	}
	rows = append(rows[:at], append([]aiRow{row}, rows[at:]...)...)
	if err := writeSingleLineJSON(path, renderAIRow, rows); err != nil {
		return err
	}
	fmt.Printf("ai.json: inserted %q at position %d, now %d entries\n", row.Model, at+1, len(rows))
	return nil
}

// cmdAISetReleased sets (or clears, with "null") the released date on every
// ai.json row for a model. A model has one row per AA version but a single
// release date, so all of its rows are updated together, preserving order
// and one-row-per-line formatting.
func cmdAISetReleased(model, date string) error {
	var released *string
	if date != "null" {
		if err := validateISODate(date); err != nil {
			return err
		}
		released = &date
	}
	dir, err := dataDir()
	if err != nil {
		return err
	}
	path := filepath.Join(dir, "ai.json")
	var rows []aiRow
	if err := readJSON(path, &rows); err != nil {
		return err
	}
	updated := 0
	for i := range rows {
		if rows[i].Model == model {
			rows[i].Released = released
			updated++
		}
	}
	if updated == 0 {
		return fmt.Errorf("model %q not found in ai.json", model)
	}
	if err := writeSingleLineJSON(path, renderAIRow, rows); err != nil {
		return err
	}
	fmt.Printf("ai.json: %q released -> %s (%d rows)\n", model, date, updated)
	return nil
}

// writeSingleLineJSON rewrites a data file in the repo's one-object-per-line
// style: [\n  {...},\n  {...}\n]\n
func writeSingleLineJSON[T any](path string, render func(T) string, rows []T) error {
	var b strings.Builder
	b.WriteString("[\n")
	for i, r := range rows {
		b.WriteString("  ")
		b.WriteString(render(r))
		if i < len(rows)-1 {
			b.WriteString(",")
		}
		b.WriteString("\n")
	}
	b.WriteString("]\n")
	return os.WriteFile(path, []byte(b.String()), 0o644)
}
