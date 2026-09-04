package main

import (
	"fmt"
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

// cmdAAModel prints the fields ai.json needs from an Artificial Analysis
// model page (slug like "claude-fable-5-1" or a full URL).
func cmdAAModel(slugOrURL string) error {
	url := slugOrURL
	if !strings.HasPrefix(url, "http") {
		url = "https://artificialanalysis.ai/models/" + slugOrURL
	}
	finalURL, body, err := fetch(url)
	if err != nil {
		return err
	}
	m := extractAAModel(body, finalURL)
	fmt.Println("url:", m.URL)
	fmt.Println("title:", m.Title)
	fmt.Println("intelligence_index:", orMissing(m.Score))
	fmt.Println("provider:", orMissing(m.Provider))
	fmt.Println("open_weights:", orMissing(m.OpenSource))
	fmt.Println("released:", orMissing(m.Released))
	if m.Score == "" {
		return fmt.Errorf("no Intelligence Index score found on %s (wrong slug? estimates are marked on the leaderboard)", finalURL)
	}
	return nil
}

func orMissing(s string) string {
	if s == "" {
		return "(not found)"
	}
	return s
}

const sweAgentsURL = "https://senior-swe-bench.snorkel.ai/agents?f_behavior=no_cheating"

// cmdSweList prints the Senior SWE Bench leaderboard table as TSV so the
// agent can diff it against swe.json without the page entering context.
func cmdSweList() error {
	_, body, err := fetch(sweAgentsURL)
	if err != nil {
		return err
	}
	rows := parseTable(body)
	fmt.Printf("source: %s\n", sweAgentsURL)
	fmt.Printf("%d table rows (incl. header)\n", len(rows))
	for _, row := range rows {
		fmt.Println(strings.Join(row, "\t"))
	}
	return nil
}
