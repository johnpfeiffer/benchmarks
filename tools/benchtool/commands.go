package main

import (
	"encoding/json"
	"fmt"
	"io"
	"os"
	"strconv"
	"strings"
)

// cmdFetchMeta prints the metadata needed to vet and date a news candidate.
func cmdFetchMeta(url string) error {
	finalURL, body, err := fetch(url)
	if err != nil {
		return err
	}
	tags := findTags(body)
	signals := extractDateSignals(body, finalURL)
	fmt.Println("url:", finalURL)
	fmt.Println("title:", pageTitle(body))
	if c := metaValues(tags, "rel", "canonical", "href"); len(c) > 0 {
		fmt.Println("canonical:", c[0])
	}
	printList := func(label string, values []string) {
		if len(values) > 0 {
			fmt.Printf("%s: %s\n", label, strings.Join(values, ", "))
		}
	}
	printList("url path date", []string{signals.URLDate})
	printList("jsonld datePublished/Modified", signals.JSONLD)
	printList("article:published_time", signals.Published)
	printList("time datetime", signals.Times)
	printList("visible date candidates", signals.Visible)
	return nil
}

// cmdAAModel prints model metadata and Pareto inputs from an Artificial
// Analysis model page (slug like "claude-fable-5-1" or a full URL).
func cmdAAModel(slugOrURL string, jsonOutput bool) error {
	url := slugOrURL
	if !strings.HasPrefix(url, "http") {
		url = "https://artificialanalysis.ai/models/" + slugOrURL
	}
	finalURL, body, err := fetch(url)
	if err != nil {
		return err
	}
	m := extractAAModel(body, finalURL)
	if err := writeAAModel(os.Stdout, m, jsonOutput); err != nil {
		return err
	}
	if m.Score == "" {
		return fmt.Errorf("no Intelligence Index score found on %s (wrong slug? estimates are marked on the leaderboard)", finalURL)
	}
	return nil
}

type aaModelJSON struct {
	URL                string   `json:"url"`
	Title              string   `json:"title"`
	IntelligenceIndex  *int     `json:"intelligence_index"`
	Provider           string   `json:"provider"`
	OpenWeights        *bool    `json:"open_weights"`
	Released           string   `json:"released,omitempty"`
	BenchmarkVersion   string   `json:"benchmark_version,omitempty"`
	TotalCostUSD       *float64 `json:"total_cost_usd"`
	TotalCostSource    string   `json:"total_cost_source,omitempty"`
	TotalCostPrecision string   `json:"total_cost_precision,omitempty"`
}

func aaModelAsJSON(m aaModel) (aaModelJSON, error) {
	out := aaModelJSON{
		URL: m.URL, Title: m.Title, Provider: m.Provider, Released: m.Released,
		BenchmarkVersion: m.IndexVersion, TotalCostSource: m.TotalCostSource,
		TotalCostPrecision: m.TotalCostPrecision,
	}
	if m.Score != "" {
		score, err := strconv.Atoi(m.Score)
		if err != nil {
			return out, fmt.Errorf("invalid extracted Intelligence Index %q: %w", m.Score, err)
		}
		out.IntelligenceIndex = &score
	}
	switch m.OpenSource {
	case "Yes":
		value := true
		out.OpenWeights = &value
	case "No":
		value := false
		out.OpenWeights = &value
	}
	if m.TotalCostUSD != "" {
		cost, err := strconv.ParseFloat(m.TotalCostUSD, 64)
		if err != nil {
			return out, fmt.Errorf("invalid extracted total cost %q: %w", m.TotalCostUSD, err)
		}
		out.TotalCostUSD = &cost
	}
	return out, nil
}

func writeAAModel(w io.Writer, m aaModel, jsonOutput bool) error {
	if jsonOutput {
		out, err := aaModelAsJSON(m)
		if err != nil {
			return err
		}
		encoder := json.NewEncoder(w)
		encoder.SetIndent("", "  ")
		return encoder.Encode(out)
	}
	fmt.Fprintln(w, "url:", m.URL)
	fmt.Fprintln(w, "title:", m.Title)
	fmt.Fprintln(w, "intelligence_index:", orMissing(m.Score))
	fmt.Fprintln(w, "provider:", orMissing(m.Provider))
	fmt.Fprintln(w, "open_weights:", orMissing(m.OpenSource))
	fmt.Fprintln(w, "released:", orMissing(m.Released))
	fmt.Fprintln(w, "benchmark_version:", orMissing(m.IndexVersion))
	fmt.Fprintln(w, "total_cost_usd:", orMissing(m.TotalCostUSD))
	fmt.Fprintln(w, "total_cost_source:", orMissing(m.TotalCostSource))
	fmt.Fprintln(w, "total_cost_precision:", orMissing(m.TotalCostPrecision))
	return nil
}

func orMissing(s string) string {
	if s == "" {
		return "(not found)"
	}
	return s
}

const aaLeaderboardURL = "https://artificialanalysis.ai/leaderboards/models"

// cmdAAReleases prints every leaderboard variant's release date as TSV so
// the agent can map ai.json rows to dates without per-model page fetches.
func cmdAAReleases() error {
	_, body, err := fetch(aaLeaderboardURL)
	if err != nil {
		return err
	}
	releases := extractAAReleases(body)
	fmt.Printf("source: %s\n", aaLeaderboardURL)
	fmt.Printf("%d variants\n", len(releases))
	fmt.Println("variant\teffort\trelease\tslug\treleased")
	for _, r := range releases {
		fmt.Printf("%s\t%s\t%s\t%s\t%s\n", r.Variant, orMissing(r.Effort), r.Release, r.Slug, r.Released)
	}
	return nil
}
