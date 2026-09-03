package main

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

const aaFixture = `<html><head><title>Claude Fable 5.1 (max with fallback) - Intelligence, Performance &amp; Price Analysis | Artificial Analysis</title>
<script>{"self":{"__next_f":1},"datePublished":"2026-09-01"}</script></head>
<body>
<h1>Claude Fable 5.1 (Adaptive Reasoning, Max Effort, Default Fallback)</h1>
<h3>How intelligent is Claude Fable 5.1?</h3>
<p>Claude Fable 5.1 scores 66 on the Artificial Analysis Intelligence Index.</p>
<h3>Who created it?</h3><p>Claude Fable 5.1 was created by Anthropic.</p>
<h3>When?</h3><p>Claude Fable 5.1 was released on September 1, 2026.</p>
<h3>Is Claude Fable 5.1 open source?</h3>
<p>No</p>
</body></html>`

func TestExtractAAModel(t *testing.T) {
	m := extractAAModel(aaFixture, "https://artificialanalysis.ai/models/claude-fable-5-1")
	if m.Score != "66" {
		t.Errorf("score = %q, want 66", m.Score)
	}
	if m.Provider != "Anthropic" {
		t.Errorf("provider = %q, want Anthropic", m.Provider)
	}
	if m.Released != "September 1, 2026" {
		t.Errorf("released = %q", m.Released)
	}
	if m.OpenSource != "No" {
		t.Errorf("open source = %q, want No", m.OpenSource)
	}
	if !strings.Contains(m.Title, "Claude Fable 5.1 (max with fallback)") {
		t.Errorf("title = %q", m.Title)
	}
}

func TestExtractDateSignals(t *testing.T) {
	fixture := `<html><head>
<meta property="article:published_time" content="2026-09-01">
<script type="application/ld+json">{"datePublished":"2026-09-01","dateModified":"2026-09-02"}</script>
</head><body><time datetime="2026-09-01T18:00:00Z">September 1, 2026</time></body></html>`
	s := extractDateSignals(fixture, "https://example.com/2026/09/01/post")
	if len(s.JSONLD) != 2 || s.JSONLD[0] != "2026-09-01" || s.JSONLD[1] != "2026-09-02" {
		t.Errorf("jsonld = %v", s.JSONLD)
	}
	if len(s.Published) != 1 || s.Published[0] != "2026-09-01" {
		t.Errorf("published = %v", s.Published)
	}
	if len(s.Times) != 1 || s.Times[0] != "2026-09-01T18:00:00Z" {
		t.Errorf("times = %v", s.Times)
	}
	if len(s.Visible) != 1 || s.Visible[0] != "September 1, 2026" {
		t.Errorf("visible = %v", s.Visible)
	}
	if s.URLDate != "2026/09/01" {
		t.Errorf("url date = %q", s.URLDate)
	}
}

func TestParseTable(t *testing.T) {
	fixture := `<table>
<tr><th>#</th><th>Model</th><th>Tasteful</th></tr>
<tr><td class="sticky">1</td><td><a href="/runs?agent=melon">Claude Fable 5.1</a></td><td>34.7%</td></tr>
<tr><td class="sticky">2</td><td><a href="/runs?agent=fable5">Claude Fable 5</a></td><td>34.7%</td></tr>
</table>`
	rows := parseTable(fixture)
	if len(rows) != 3 {
		t.Fatalf("rows = %d, want 3 (incl. header)", len(rows))
	}
	if rows[0][1] != "Model" || rows[1][1] != "Claude Fable 5.1" || rows[2][2] != "34.7%" {
		t.Errorf("rows = %v", rows)
	}
}

func TestValidateISODate(t *testing.T) {
	for _, ok := range []string{"2026-09-01", "2026-02-28", "2024-02-29"} {
		if err := validateISODate(ok); err != nil {
			t.Errorf("validateISODate(%q) = %v, want nil", ok, err)
		}
	}
	for _, bad := range []string{"2026-02-30", "09-01-2026", "2026-9-1", "not-a-date"} {
		if err := validateISODate(bad); err == nil {
			t.Errorf("validateISODate(%q) = nil, want error", bad)
		}
	}
}

func TestValidateHTTPURL(t *testing.T) {
	if err := validateHTTPURL("https://example.com/x"); err != nil {
		t.Errorf("https URL rejected: %v", err)
	}
	for _, bad := range []string{"ftp://example.com", "not a url", "javascript:alert(1)"} {
		if err := validateHTTPURL(bad); err == nil {
			t.Errorf("validateHTTPURL(%q) = nil, want error", bad)
		}
	}
}

func TestRenderAIRow(t *testing.T) {
	got := renderAIRow(aiRow{Model: "Claude Fable 5.1 (max)", Score: 66, Provider: "Anthropic", OpenWeight: false, Color: "#cc785c"})
	want := `{"model": "Claude Fable 5.1 (max)", "intelligence_score": 66, "provider": "Anthropic", "open_weight": false, "color": "#cc785c"}`
	if got != want {
		t.Errorf("renderAIRow =\n%s\nwant\n%s", got, want)
	}
}

func TestRenderSweRow(t *testing.T) {
	got := renderSweRow(sweRow{Model: "Claude Fable 5.1", Harness: "Mini-SWE-Agent", Effort: "medium", Tasteful: 34.7, Basic: 57.9, Steps: 77, Tokens: "37.9K"})
	want := `{"model": "Claude Fable 5.1", "harness": "Mini-SWE-Agent", "effort": "medium", "tasteful_solve_rate_pct": 34.7, "basic_solve_rate_pct": 57.9, "avg_steps": 77, "avg_tokens": "37.9K"}`
	if got != want {
		t.Errorf("renderSweRow =\n%s\nwant\n%s", got, want)
	}
	// Zero rates keep swe.json's one-decimal style ("0.0", not "0").
	zero := renderSweRow(sweRow{Model: "X", Harness: "H", Effort: "max", Tasteful: 0, Basic: 0, Steps: 0, Tokens: "n/a"})
	if !strings.Contains(zero, `"tasteful_solve_rate_pct": 0.0`) {
		t.Errorf("zero rate formatting = %s", zero)
	}
}

// chdirToTempRepo builds a bare app/src/data under a temp dir and chdirs
// there so the add commands exercise the real dataDir discovery.
func chdirToTempRepo(t *testing.T) string {
	t.Helper()
	root := t.TempDir()
	data := filepath.Join(root, "app", "src", "data")
	if err := os.MkdirAll(data, 0o755); err != nil {
		t.Fatal(err)
	}
	old, err := os.Getwd()
	if err != nil {
		t.Fatal(err)
	}
	if err := os.Chdir(root); err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = os.Chdir(old) })
	return data
}

func TestCmdNewsAdd(t *testing.T) {
	data := chdirToTempRepo(t)
	seed := []byte("[\n  {\n    \"url\": \"https://example.com/old\",\n    \"date\": \"2026-08-14\"\n  }\n]\n")
	if err := os.WriteFile(filepath.Join(data, "news.json"), seed, 0o644); err != nil {
		t.Fatal(err)
	}
	if err := cmdNewsAdd("https://example.com/new", "2026-09-01"); err != nil {
		t.Fatal(err)
	}
	out, _ := os.ReadFile(filepath.Join(data, "news.json"))
	text := string(out)
	if !strings.Contains(text, `"url": "https://example.com/new"`) {
		t.Fatalf("new URL missing:\n%s", text)
	}
	// Newest first.
	if strings.Index(text, "example.com/new") > strings.Index(text, "example.com/old") {
		t.Errorf("not sorted newest first:\n%s", text)
	}
	// Duplicates and bad input are rejected.
	if err := cmdNewsAdd("https://example.com/new", "2026-09-02"); err == nil {
		t.Error("duplicate URL accepted")
	}
	if err := cmdNewsAdd("https://example.com/bad", "2026-13-40"); err == nil {
		t.Error("invalid date accepted")
	}
}

func TestCmdAIAdd(t *testing.T) {
	data := chdirToTempRepo(t)
	seed := []byte("[\n  {\"model\": \"Claude Opus 5 (max)\", \"intelligence_score\": 63, \"provider\": \"Anthropic\", \"open_weight\": false, \"color\": \"#cc785c\"},\n  {\"model\": \"GPT-5.6 Sol (max)\", \"intelligence_score\": 61, \"provider\": \"OpenAI\", \"open_weight\": false, \"color\": \"#1f1f1f\"}\n]\n")
	if err := os.WriteFile(filepath.Join(data, "ai.json"), seed, 0o644); err != nil {
		t.Fatal(err)
	}
	if err := cmdAIAdd([]string{"Claude Fable 5.1 (max)", "66", "Anthropic"}); err != nil {
		t.Fatal(err)
	}
	out, _ := os.ReadFile(filepath.Join(data, "ai.json"))
	text := string(out)
	// Highest score inserts at the top; palette color applied by provider.
	firstRow := strings.Split(strings.TrimPrefix(text, "[\n"), "\n")[0]
	if !strings.Contains(firstRow, `"Claude Fable 5.1 (max)"`) || !strings.Contains(firstRow, `"color": "#cc785c"`) {
		t.Errorf("first row = %q", firstRow)
	}
	if !strings.HasSuffix(text, "]\n") {
		t.Errorf("missing trailing newline/bracket: %q", text[len(text)-4:])
	}
	if err := cmdAIAdd([]string{"Claude Fable 5.1 (max)", "66", "Anthropic"}); err == nil {
		t.Error("duplicate model accepted")
	}
	if err := cmdAIAdd([]string{"Mystery", "50", "UnknownLab"}); err == nil {
		t.Error("unknown provider without --color accepted")
	}
}

func TestCmdSweAdd(t *testing.T) {
	data := chdirToTempRepo(t)
	seed := []byte("[\n  {\"model\": \"Claude Fable 5\", \"harness\": \"Mini-SWE-Agent\", \"effort\": \"high\", \"tasteful_solve_rate_pct\": 34.7, \"basic_solve_rate_pct\": 53.7, \"avg_steps\": 119, \"avg_tokens\": \"58.4K\"},\n  {\"model\": \"Claude Opus 4.8\", \"harness\": \"Mini-SWE-Agent\", \"effort\": \"max\", \"tasteful_solve_rate_pct\": 30.5, \"basic_solve_rate_pct\": 44.2, \"avg_steps\": 138, \"avg_tokens\": \"134.2K\"}\n]\n")
	if err := os.WriteFile(filepath.Join(data, "swe.json"), seed, 0o644); err != nil {
		t.Fatal(err)
	}
	if err := cmdSweAdd([]string{"Claude Fable 5.1", "Mini-SWE-Agent", "medium", "34.7", "57.9", "77", "37.9K"}); err != nil {
		t.Fatal(err)
	}
	out, _ := os.ReadFile(filepath.Join(data, "swe.json"))
	lines := strings.Split(string(out), "\n")
	// Ties keep file order: the new 34.7 row lands after the existing 34.7.
	if !strings.Contains(lines[1], "Claude Fable 5\"") || !strings.Contains(lines[2], "Claude Fable 5.1") {
		t.Errorf("tie order wrong:\n%s", out)
	}
	if !strings.Contains(lines[2], `"tasteful_solve_rate_pct": 34.7`) {
		t.Errorf("rate formatting = %q", lines[2])
	}
	if err := cmdSweAdd([]string{"Claude Fable 5.1", "Mini-SWE-Agent", "medium", "34.7", "57.9", "77", "37.9K"}); err == nil {
		t.Error("duplicate model accepted")
	}
}
