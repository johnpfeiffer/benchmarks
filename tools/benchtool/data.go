package main

import (
	"encoding/json"
	"fmt"
	"net/url"
	"os"
	"path/filepath"
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
	Model      string  `json:"model"`
	Score      int     `json:"intelligence_score"`
	Provider   string  `json:"provider"`
	OpenWeight bool    `json:"open_weight"`
	Color      string  `json:"color"`
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
	released := "null"
	if r.Released != nil {
		released = jsonString(*r.Released)
	}
	return fmt.Sprintf(`{"model": %s, "intelligence_score": %d, "provider": %s, "open_weight": %t, "color": %s, "released": %s}`,
		jsonString(r.Model), r.Score, jsonString(r.Provider), r.OpenWeight, jsonString(r.Color), released)
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
		default:
			positional = append(positional, a)
		}
	}
	if len(positional) != 3 {
		return fmt.Errorf("ai-add expects <model> <score> <provider> [--open-weight] [--color=#hex] [--released=YYYY-MM-DD]")
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
		if r.Model == row.Model {
			return fmt.Errorf("duplicate: %q already in ai.json", row.Model)
		}
	}
	// Insert before the first lower score so equal scores keep file order.
	at := len(rows)
	for i, r := range rows {
		if r.Score < row.Score {
			at = i
			break
		}
	}
	rows = append(rows[:at], append([]aiRow{row}, rows[at:]...)...)
	if err := writeSingleLineJSON(path, renderAIRow, rows); err != nil {
		return err
	}
	fmt.Printf("ai.json: inserted %q at position %d, now %d entries\n", row.Model, at+1, len(rows))
	return nil
}

// cmdAISetReleased sets (or clears, with "null") the released date on an
// existing ai.json row, preserving order and one-row-per-line formatting.
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
	for i := range rows {
		if rows[i].Model == model {
			rows[i].Released = released
			if err := writeSingleLineJSON(path, renderAIRow, rows); err != nil {
				return err
			}
			fmt.Printf("ai.json: %q released -> %s\n", model, date)
			return nil
		}
	}
	return fmt.Errorf("model %q not found in ai.json", model)
}

// --- swe.json ---

type sweRow struct {
	Model    string  `json:"model"`
	Harness  string  `json:"harness"`
	Effort   string  `json:"effort"`
	Tasteful float64 `json:"tasteful_solve_rate_pct"`
	Basic    float64 `json:"basic_solve_rate_pct"`
	Steps    int     `json:"avg_steps"`
	Tokens   string  `json:"avg_tokens"`
}

// sweRate formats rates the way swe.json carries them: always one decimal
// ("34.7", "0.0").
func sweRate(v float64) string {
	return strconv.FormatFloat(v, 'f', 1, 64)
}

func renderSweRow(r sweRow) string {
	return fmt.Sprintf(`{"model": %s, "harness": %s, "effort": %s, "tasteful_solve_rate_pct": %s, "basic_solve_rate_pct": %s, "avg_steps": %d, "avg_tokens": %s}`,
		jsonString(r.Model), jsonString(r.Harness), jsonString(r.Effort), sweRate(r.Tasteful), sweRate(r.Basic), r.Steps, jsonString(r.Tokens))
}

func cmdSweAdd(args []string) error {
	row := sweRow{Model: args[0], Harness: args[1], Effort: args[2], Tokens: args[6]}
	var err error
	if row.Tasteful, err = strconv.ParseFloat(args[3], 64); err != nil {
		return fmt.Errorf("tasteful solve rate %q is not numeric", args[3])
	}
	if row.Basic, err = strconv.ParseFloat(args[4], 64); err != nil {
		return fmt.Errorf("basic solve rate %q is not numeric", args[4])
	}
	// avg_steps is an integer on the site; avg_tokens is the string column.
	if row.Steps, err = strconv.Atoi(args[5]); err != nil {
		return fmt.Errorf("avg_steps %q is not an integer", args[5])
	}
	if strings.TrimSpace(row.Model) == "" {
		return fmt.Errorf("model must be non-empty")
	}

	dir, err := dataDir()
	if err != nil {
		return err
	}
	path := filepath.Join(dir, "swe.json")
	var rows []sweRow
	if err := readJSON(path, &rows); err != nil {
		return err
	}
	for _, r := range rows {
		if r.Model == row.Model {
			return fmt.Errorf("duplicate: %q already in swe.json", row.Model)
		}
	}
	// Insert before the first lower tasteful rate so ties keep file order.
	at := len(rows)
	for i, r := range rows {
		if r.Tasteful < row.Tasteful {
			at = i
			break
		}
	}
	rows = append(rows[:at], append([]sweRow{row}, rows[at:]...)...)
	if err := writeSingleLineJSON(path, renderSweRow, rows); err != nil {
		return err
	}
	fmt.Printf("swe.json: inserted %q at position %d, now %d entries\n", row.Model, at+1, len(rows))
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
