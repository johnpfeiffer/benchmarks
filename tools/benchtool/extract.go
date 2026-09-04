package main

import (
	"html"
	"regexp"
	"strings"
)

func htmlUnescape(s string) string { return html.UnescapeString(s) }

var (
	reTagOpen = regexp.MustCompile(`(?is)<(meta|link|time)\b([^>]*)>`)
	reAttr    = regexp.MustCompile(`([\w:-]+)="([^"]*)"`)
)

type tagAttrs map[string]string

// findTags returns the attribute maps of every <meta>/<link>/<time> tag.
// Attribute order varies between CMSes, so filter by key first and read the
// value attribute second.
func findTags(htmlText string) []tagAttrs {
	var out []tagAttrs
	for _, m := range reTagOpen.FindAllStringSubmatch(htmlText, -1) {
		attrs := tagAttrs{"__name": strings.ToLower(m[1])}
		for _, a := range reAttr.FindAllStringSubmatch(m[2], -1) {
			attrs[strings.ToLower(a[1])] = htmlUnescape(a[2])
		}
		out = append(out, attrs)
	}
	return out
}

// metaValues collects values of valueAttr from tags whose keyAttr equals key.
func metaValues(tags []tagAttrs, keyAttr, key, valueAttr string) []string {
	var out []string
	for _, t := range tags {
		if t[keyAttr] == key && t[valueAttr] != "" {
			out = append(out, t[valueAttr])
		}
	}
	return dedupe(out)
}

func dedupe(in []string) []string {
	seen := map[string]bool{}
	var out []string
	for _, s := range in {
		if !seen[s] {
			seen[s] = true
			out = append(out, s)
		}
	}
	return out
}

func submatchValues(re *regexp.Regexp, s string) []string {
	var out []string
	for _, m := range re.FindAllStringSubmatch(s, -1) {
		out = append(out, m[1])
	}
	return dedupe(out)
}

var (
	reJSONLDDate  = regexp.MustCompile(`"date(?:Published|Modified)"\s*:\s*"([^"]+)"`)
	reVisibleDate = regexp.MustCompile(`\b((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4})\b`)
)

// dateCandidates pulls every date signal a page carries. Trust order is the
// news skill's business (URL path, JSON-LD/meta, byline, snippets); this just
// prints the evidence compactly so the page never enters context.
type dateSignals struct {
	JSONLD    []string // "datePublished"/"dateModified" from JSON-LD blobs
	Published []string // article:published_time meta
	Times     []string // <time datetime="...">
	Visible   []string // "Month D, YYYY" strings in visible text (chrome pollutes these)
	URLDate   string   // /YYYY/MM/DD/ or /YYYY/MM/ in the URL path
}

func extractDateSignals(rawHTML, finalURL string) dateSignals {
	tags := findTags(rawHTML)
	var times []string
	for _, t := range tags {
		if t["__name"] == "time" && t["datetime"] != "" {
			times = append(times, t["datetime"])
		}
	}
	var urlDate string
	if m := regexp.MustCompile(`/((?:\d{4}/\d{2}/\d{2})|(?:\d{4}/\d{2}))/`).FindStringSubmatch(finalURL); m != nil {
		urlDate = m[1]
	}
	return dateSignals{
		JSONLD:    submatchValues(reJSONLDDate, rawHTML),
		Published: metaValues(tags, "property", "article:published_time", "content"),
		Times:     dedupe(times),
		Visible:   submatchValues(reVisibleDate, stripToText(rawHTML)),
		URLDate:   urlDate,
	}
}

// --- Artificial Analysis model page ---

type aaModel struct {
	Title      string
	Score      string
	Provider   string
	OpenSource string // "Yes" / "No" / "" when not found
	Released   string
	URL        string
}

var (
	reAAScore    = regexp.MustCompile(`scores (?:an estimated )?(\d+) on the Artificial Analysis Intelligence Index`)
	reAAProvider = regexp.MustCompile(`was created by ([^\n.]+)`)
	reAAReleased = regexp.MustCompile(`was released on ([^\n.]+)`)
	reAAOpen     = regexp.MustCompile(`open source\?\s*\n\s*(Yes|No)`)
)

func extractAAModel(rawHTML, finalURL string) aaModel {
	text := stripToText(rawHTML)
	m := aaModel{Title: pageTitle(rawHTML), URL: finalURL}
	if s := reAAScore.FindStringSubmatch(text); s != nil {
		m.Score = s[1]
	}
	if s := reAAProvider.FindStringSubmatch(text); s != nil {
		m.Provider = strings.TrimSpace(s[1])
	}
	if s := reAAReleased.FindStringSubmatch(text); s != nil {
		m.Released = strings.TrimSpace(s[1])
	}
	if s := reAAOpen.FindStringSubmatch(text); s != nil {
		m.OpenSource = s[1]
	}
	return m
}

// --- Senior SWE Bench leaderboard table ---

var (
	reTR  = regexp.MustCompile(`(?is)<tr[^>]*>(.*?)</tr>`)
	reCell = regexp.MustCompile(`(?is)<t[dh][^>]*>(.*?)</t[dh]>`)
)

// parseTable extracts every <tr> as a slice of cell texts (tags stripped,
// whitespace collapsed). The SSR table on the agents page is the single
// source of truth the skill mirrors into swe.json.
func parseTable(htmlText string) [][]string {
	var rows [][]string
	for _, tr := range reTR.FindAllStringSubmatch(htmlText, -1) {
		var cells []string
		for _, td := range reCell.FindAllStringSubmatch(tr[1], -1) {
			cell := reTag.ReplaceAllString(td[1], " ")
			cell = htmlUnescape(cell)
			cell = reWhitespace.ReplaceAllString(strings.TrimSpace(cell), " ")
			cells = append(cells, cell)
		}
		if len(cells) > 0 {
			rows = append(rows, cells)
		}
	}
	return rows
}
