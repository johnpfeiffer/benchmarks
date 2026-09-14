package main

import (
	"bytes"
	"encoding/json"
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
<p>Artificial Analysis Intelligence Index v4.3 incorporates 10 evaluations.</p>
<p>In total, it cost $13,129.07 to evaluate Claude Fable 5.1 on the Intelligence Index.</p>
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
	if m.IndexVersion != "v4.3" {
		t.Errorf("index version = %q, want v4.3", m.IndexVersion)
	}
	if m.TotalCostUSD != "13129.07" || m.TotalCostSource != "comparison_summary" || m.TotalCostPrecision != "precise" {
		t.Errorf("total cost fields = %q, %q, %q", m.TotalCostUSD, m.TotalCostSource, m.TotalCostPrecision)
	}
	if !strings.Contains(m.Title, "Claude Fable 5.1 (max with fallback)") {
		t.Errorf("title = %q", m.Title)
	}
}

func TestExtractAAModelTotalCost(t *testing.T) {
	tests := []struct {
		name, summary, cost, precision string
	}{
		{"precise", "In total, it cost $280.28 to evaluate GLM-5.3-Flash on the Intelligence Index.", "280.28", "precise"},
		{"rounded or whole", "In total, it cost $280 to evaluate GLM-5.3-Flash on the Intelligence Index.", "280", "rounded_or_whole"},
		{"missing", "No total cost is published.", "", ""},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			m := extractAAModel("<html><body>"+tt.summary+"</body></html>", "https://artificialanalysis.ai/models/glm-5-3-flash")
			if m.TotalCostUSD != tt.cost || m.TotalCostPrecision != tt.precision {
				t.Errorf("cost/precision = %q/%q, want %q/%q", m.TotalCostUSD, m.TotalCostPrecision, tt.cost, tt.precision)
			}
			if tt.cost == "" && m.TotalCostSource != "" {
				t.Errorf("missing cost source = %q, want empty", m.TotalCostSource)
			}
		})
	}
}

func TestWriteAAModelJSON(t *testing.T) {
	m := extractAAModel(aaFixture, "https://artificialanalysis.ai/models/claude-fable-5-1")
	var out bytes.Buffer
	if err := writeAAModel(&out, m, true); err != nil {
		t.Fatal(err)
	}
	var got struct {
		IntelligenceIndex int     `json:"intelligence_index"`
		OpenWeights       bool    `json:"open_weights"`
		TotalCostUSD      float64 `json:"total_cost_usd"`
		BenchmarkVersion  string  `json:"benchmark_version"`
		TotalCostSource   string  `json:"total_cost_source"`
	}
	if err := json.Unmarshal(out.Bytes(), &got); err != nil {
		t.Fatalf("invalid JSON: %v\n%s", err, out.String())
	}
	if got.IntelligenceIndex != 66 || got.OpenWeights || got.TotalCostUSD != 13129.07 || got.BenchmarkVersion != "v4.3" || got.TotalCostSource != "comparison_summary" {
		t.Errorf("JSON output = %+v", got)
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
	date := "2026-09-01"
	got := renderAIRow(aiRow{Model: "Claude Fable 5.1 (max)", Score: 66, AAVersion: "v4.3", Provider: "Anthropic", OpenWeight: false, Color: "#cc785c", Released: &date})
	want := `{"model": "Claude Fable 5.1 (max)", "intelligence_score": 66, "aa_version": "v4.3", "provider": "Anthropic", "open_weight": false, "color": "#cc785c", "released": "2026-09-01"}`
	if got != want {
		t.Errorf("renderAIRow =\n%s\nwant\n%s", got, want)
	}
	// Unknown release dates render as explicit null.
	got = renderAIRow(aiRow{Model: "Inkling", Score: 42, AAVersion: "v4.3", Provider: "Thinking Machines", OpenWeight: true, Color: "#676767"})
	if !strings.HasSuffix(got, `"released": null}`) {
		t.Errorf("nil released = %s", got)
	}
	// A measured total run cost renders between the version and the provider.
	cost := 13128.86
	got = renderAIRow(aiRow{Model: "Claude Fable 5.1 (max)", Score: 53, AAVersion: "v4.3", Provider: "Anthropic", OpenWeight: false, Color: "#cc785c", CostUSD: &cost, Released: &date})
	want = `{"model": "Claude Fable 5.1 (max)", "intelligence_score": 53, "aa_version": "v4.3", "cost_usd": 13128.86, "provider": "Anthropic", "open_weight": false, "color": "#cc785c", "released": "2026-09-01"}`
	if got != want {
		t.Errorf("renderAIRow with cost =\n%s\nwant\n%s", got, want)
	}
}

func TestAIRowRoundTrip(t *testing.T) {
	// Rows must survive read + rewrite byte-identically, or ai-add and
	// ai-set-released would silently strip measured costs and version tags.
	line := `{"model": "GLM-5.3 Flash", "intelligence_score": 42, "aa_version": "v4.3", "cost_usd": 280.28, "provider": "Z AI", "open_weight": true, "color": "#1c7ff8", "released": "2026-08-26"}`
	var row aiRow
	if err := json.Unmarshal([]byte(line), &row); err != nil {
		t.Fatal(err)
	}
	if got := renderAIRow(row); got != line {
		t.Errorf("round trip =\n%s\nwant\n%s", got, line)
	}
}

func TestValidateAAVersion(t *testing.T) {
	for _, ok := range []string{"v4.3", "v4.10", "v3", "v4.1.1"} {
		if err := validateAAVersion(ok); err != nil {
			t.Errorf("validateAAVersion(%q) = %v, want nil", ok, err)
		}
	}
	for _, bad := range []string{"4.3", "v", "v4.", "v4.x", "V4.3", "v4 3"} {
		if err := validateAAVersion(bad); err == nil {
			t.Errorf("validateAAVersion(%q) = nil, want error", bad)
		}
	}
}

func TestCompareAAVersions(t *testing.T) {
	if compareAAVersions("v4.3", "v4.2") <= 0 {
		t.Error("v4.3 should sort newer than v4.2")
	}
	if compareAAVersions("v4.10", "v4.3") <= 0 {
		t.Error("v4.10 should sort newer than v4.3 (numeric, not lexicographic)")
	}
	if compareAAVersions("v4.2", "v4.2.0") != 0 {
		t.Error("v4.2 should equal v4.2.0")
	}
}

func TestAIAddCostFlag(t *testing.T) {
	if _, err := parseAICost("--cost=280.28"); err != nil {
		t.Errorf("valid cost rejected: %v", err)
	}
	for _, bad := range []string{"--cost=0", "--cost=-5", "--cost=abc", "--cost="} {
		if _, err := parseAICost(bad); err == nil {
			t.Errorf("parseAICost(%q) = nil, want error", bad)
		}
	}
}

func TestExtractAAReleases(t *testing.T) {
	// The live page embeds the payload as an escaped JS string; the first
	// row here mirrors that, the rest use plain JSON.
	fixture := `<script>self.__next_f.push(["1:{\"rows\":[` +
		`{\"name\":\"Claude Fable 5.1 (Adaptive Reasoning, Max Effort, Default Fallback)\",\"deprecated\":false,\"isReasoning\":true,\"effort\":{\"slug\":\"max\",\"label\":\"max\",\"level\":60},\"release\":{\"slug\":\"claude-fable-5-1\",\"name\":\"Claude Fable 5.1\"},\"releaseDate\":\"2026-09-01\"},` +
		`{\"name\":\"Gemini 3.6 Flash (Non-reasoning)\",\"deprecated\":false,\"isReasoning\":false,\"effort\":null,\"release\":{\"slug\":\"gemini-3-6-flash\",\"name\":\"Gemini 3.6 Flash\"},\"releaseDate\":\"2026-07-21\"},` +
		`{\"name\":\"Claude Fable 5.1 (Adaptive Reasoning, Max Effort, Default Fallback)\",\"deprecated\":false,\"isReasoning\":true,\"effort\":{\"slug\":\"max\",\"label\":\"max\",\"level\":60},\"release\":{\"slug\":\"claude-fable-5-1\",\"name\":\"Claude Fable 5.1\"},\"releaseDate\":\"2026-09-01\"}` +
		`]}"])</script>` +
		// The full-catalog shape (slug first, no effort key) covers models the
		// intelligence payload omits, e.g. deprecated ones.
		`<script>[{\"slug\":\"claude-4-5-haiku\",\"name\":\"Claude 4.5 Haiku (Non-reasoning)\",\"deprecated\":false,\"isReasoning\":false,\"release\":{\"slug\":\"claude-4-5-haiku\",\"name\":\"Claude 4.5 Haiku\"},\"releaseDate\":\"2025-10-15\"}]</script>`
	releases := extractAAReleases(fixture)
	if len(releases) != 3 {
		t.Fatalf("releases = %d, want 3 (duplicate embedded row deduped)", len(releases))
	}
	if releases[2].Variant != "Claude 4.5 Haiku (Non-reasoning)" || releases[2].Released != "2025-10-15" || releases[2].Effort != "" {
		t.Errorf("releases[2] = %+v", releases[2])
	}
	if releases[0].Variant != "Claude Fable 5.1 (Adaptive Reasoning, Max Effort, Default Fallback)" ||
		releases[0].Effort != "max" || releases[0].Release != "Claude Fable 5.1" ||
		releases[0].Slug != "claude-fable-5-1" || releases[0].Released != "2026-09-01" {
		t.Errorf("releases[0] = %+v", releases[0])
	}
	if releases[1].Effort != "" || releases[1].Released != "2026-07-21" {
		t.Errorf("releases[1] = %+v", releases[1])
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
	seed := []byte("[\n  {\"model\": \"Claude Opus 5 (max)\", \"intelligence_score\": 63, \"aa_version\": \"v4.3\", \"provider\": \"Anthropic\", \"open_weight\": false, \"color\": \"#cc785c\"},\n  {\"model\": \"GPT-5.6 Sol (max)\", \"intelligence_score\": 61, \"aa_version\": \"v4.3\", \"provider\": \"OpenAI\", \"open_weight\": false, \"color\": \"#1f1f1f\"}\n]\n")
	if err := os.WriteFile(filepath.Join(data, "ai.json"), seed, 0o644); err != nil {
		t.Fatal(err)
	}
	if err := cmdAIAdd([]string{"Claude Fable 5.1 (max)", "66", "Anthropic", "--aa-version=v4.3"}); err != nil {
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
	if err := cmdAIAdd([]string{"Claude Fable 5.1 (max)", "66", "Anthropic", "--aa-version=v4.3"}); err == nil {
		t.Error("duplicate (model, version) accepted")
	}
	if err := cmdAIAdd([]string{"Mystery", "50", "UnknownLab", "--aa-version=v4.3"}); err == nil {
		t.Error("unknown provider without --color accepted")
	}
	if err := cmdAIAdd([]string{"Bad Date", "40", "Anthropic", "--aa-version=v4.3", "--released=September 1, 2026"}); err == nil {
		t.Error("non-ISO --released accepted")
	}
	if err := cmdAIAdd([]string{"No Version", "40", "Anthropic"}); err == nil {
		t.Error("missing --aa-version accepted")
	}
	if err := cmdAIAdd([]string{"Bad Version", "40", "Anthropic", "--aa-version=4.3"}); err == nil {
		t.Error("malformed --aa-version accepted")
	}
}

func TestCmdAIAddVersionBlocks(t *testing.T) {
	data := chdirToTempRepo(t)
	seed := []byte("[\n" +
		"  {\"model\": \"Apex (max)\", \"intelligence_score\": 50, \"aa_version\": \"v4.3\", \"provider\": \"Anthropic\", \"open_weight\": false, \"color\": \"#cc785c\"},\n" +
		"  {\"model\": \"Base (max)\", \"intelligence_score\": 40, \"aa_version\": \"v4.3\", \"provider\": \"Anthropic\", \"open_weight\": false, \"color\": \"#cc785c\"},\n" +
		"  {\"model\": \"Apex (max)\", \"intelligence_score\": 55, \"aa_version\": \"v4.2\", \"provider\": \"Anthropic\", \"open_weight\": false, \"color\": \"#cc785c\"},\n" +
		"  {\"model\": \"Base (max)\", \"intelligence_score\": 44, \"aa_version\": \"v4.2\", \"provider\": \"Anthropic\", \"open_weight\": false, \"color\": \"#cc785c\"}\n" +
		"]\n")
	if err := os.WriteFile(filepath.Join(data, "ai.json"), seed, 0o644); err != nil {
		t.Fatal(err)
	}
	// A new row lands inside its own version block, score descending.
	if err := cmdAIAdd([]string{"Mid (max)", "45", "Anthropic", "--aa-version=v4.3"}); err != nil {
		t.Fatal(err)
	}
	// The same model name under a different version is not a duplicate.
	if err := cmdAIAdd([]string{"Mid (max)", "48", "Anthropic", "--aa-version=v4.2"}); err != nil {
		t.Fatal(err)
	}
	// A brand-new older version starts a trailing block; a newer one leads.
	if err := cmdAIAdd([]string{"Old (max)", "70", "Anthropic", "--aa-version=v4.1"}); err != nil {
		t.Fatal(err)
	}
	if err := cmdAIAdd([]string{"New (max)", "60", "Anthropic", "--aa-version=v4.4"}); err != nil {
		t.Fatal(err)
	}
	out, _ := os.ReadFile(filepath.Join(data, "ai.json"))
	lines := strings.Split(strings.TrimPrefix(string(out), "[\n"), "\n")
	order := make([]string, 0, len(lines)-1)
	for _, l := range lines {
		l = strings.TrimSuffix(strings.TrimPrefix(l, "  "), ",")
		if l == "]" || l == "" {
			continue
		}
		var row struct {
			Model   string `json:"model"`
			Version string `json:"aa_version"`
		}
		if err := json.Unmarshal([]byte(l), &row); err != nil {
			t.Fatal(err)
		}
		order = append(order, row.Version+":"+row.Model)
	}
	want := []string{
		"v4.4:New (max)",
		"v4.3:Apex (max)", "v4.3:Mid (max)", "v4.3:Base (max)",
		"v4.2:Apex (max)", "v4.2:Mid (max)", "v4.2:Base (max)",
		"v4.1:Old (max)",
	}
	if strings.Join(order, "|") != strings.Join(want, "|") {
		t.Errorf("block order =\n%v\nwant\n%v", order, want)
	}
}

func TestCmdAIAddReleasedFlag(t *testing.T) {
	data := chdirToTempRepo(t)
	if err := os.WriteFile(filepath.Join(data, "ai.json"), []byte("[]\n"), 0o644); err != nil {
		t.Fatal(err)
	}
	if err := cmdAIAdd([]string{"Gemini 3.8 Flash (high)", "59", "Google", "--aa-version=v4.3", "--released=2026-09-02"}); err != nil {
		t.Fatal(err)
	}
	out, _ := os.ReadFile(filepath.Join(data, "ai.json"))
	if !strings.Contains(string(out), `"released": "2026-09-02"`) {
		t.Errorf("released missing:\n%s", out)
	}
}

func TestCmdAISetReleased(t *testing.T) {
	data := chdirToTempRepo(t)
	// One model with a row in each of two version blocks: the release date is
	// a model fact, so both rows update together.
	seed := []byte("[\n" +
		"  {\"model\": \"Claude Opus 5 (max)\", \"intelligence_score\": 60, \"aa_version\": \"v4.3\", \"provider\": \"Anthropic\", \"open_weight\": false, \"color\": \"#cc785c\", \"released\": null},\n" +
		"  {\"model\": \"GPT-5.6 Sol (max)\", \"intelligence_score\": 58, \"aa_version\": \"v4.3\", \"provider\": \"OpenAI\", \"open_weight\": false, \"color\": \"#1f1f1f\", \"released\": null},\n" +
		"  {\"model\": \"Claude Opus 5 (max)\", \"intelligence_score\": 63, \"aa_version\": \"v4.2\", \"provider\": \"Anthropic\", \"open_weight\": false, \"color\": \"#cc785c\", \"released\": null}\n" +
		"]\n")
	if err := os.WriteFile(filepath.Join(data, "ai.json"), seed, 0o644); err != nil {
		t.Fatal(err)
	}
	if err := cmdAISetReleased("Claude Opus 5 (max)", "2026-07-24"); err != nil {
		t.Fatal(err)
	}
	out, _ := os.ReadFile(filepath.Join(data, "ai.json"))
	text := string(out)
	if strings.Count(text, `"Claude Opus 5 (max)"`) != 2 || strings.Count(text, `"released": "2026-07-24"`) != 2 {
		t.Errorf("expected both version rows updated:\n%s", text)
	}
	// Other rows untouched, order preserved.
	lines := strings.Split(text, "\n")
	if !strings.Contains(lines[1], "Claude Opus 5") || !strings.Contains(lines[2], `"GPT-5.6 Sol (max)"`) || !strings.Contains(lines[2], `"released": null`) {
		t.Errorf("order/content wrong:\n%s", text)
	}
	// "null" clears a date.
	if err := cmdAISetReleased("Claude Opus 5 (max)", "null"); err != nil {
		t.Fatal(err)
	}
	out, _ = os.ReadFile(filepath.Join(data, "ai.json"))
	if strings.Contains(string(out), "2026-07-24") {
		t.Errorf("null did not clear:\n%s", out)
	}
	if err := cmdAISetReleased("No Such Model", "2026-01-01"); err == nil {
		t.Error("unknown model accepted")
	}
	if err := cmdAISetReleased("GPT-5.6 Sol (max)", "2026-13-40"); err == nil {
		t.Error("invalid date accepted")
	}
}
