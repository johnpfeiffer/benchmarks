package main

import (
	"fmt"
	"io"
	"net/http"
	"regexp"
	"strings"
	"time"
)

// browserUA keeps sites that gate on user-agent (Cloudflare & friends)
// serving the same SSR HTML a browser would get.
const browserUA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"

const maxPageBytes = 25 << 20 // 25 MiB; AA model pages run ~3.5 MiB

// fetch GETs a page and returns the final URL (after redirects) and body.
func fetch(url string) (finalURL string, body string, err error) {
	client := &http.Client{Timeout: 45 * time.Second}
	req, err := http.NewRequest(http.MethodGet, url, nil)
	if err != nil {
		return "", "", err
	}
	req.Header.Set("User-Agent", browserUA)
	req.Header.Set("Accept", "text/html,application/xhtml+xml")
	resp, err := client.Do(req)
	if err != nil {
		return "", "", err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return "", "", fmt.Errorf("GET %s: HTTP %d (a 403 usually means bot-blocked, not defunct)", url, resp.StatusCode)
	}
	data, err := io.ReadAll(io.LimitReader(resp.Body, maxPageBytes))
	if err != nil {
		return "", "", err
	}
	return resp.Request.URL.String(), string(data), nil
}

var (
	reScript     = regexp.MustCompile(`(?is)<script.*?</script>`)
	reStyle      = regexp.MustCompile(`(?is)<style.*?</style>`)
	reTag        = regexp.MustCompile(`<[^>]+>`)
	reWhitespace = regexp.MustCompile(`\s+`) // parseTable cell collapse
	reSpaces     = regexp.MustCompile(`[ \t\x{00a0}]+`)
	reNewlines   = regexp.MustCompile(`\n+`)
)

// stripToText removes script/style blocks, replaces tags with newlines,
// unescapes entities, and normalizes whitespace (spaces within a line are
// preserved as single spaces so phrase patterns still match; newline runs
// collapse). Extraction patterns run against this text so page chrome markup
// cannot break them.
func stripToText(html string) string {
	s := reScript.ReplaceAllString(html, " ")
	s = reStyle.ReplaceAllString(s, " ")
	s = reTag.ReplaceAllString(s, "\n")
	s = htmlUnescape(s)
	s = reSpaces.ReplaceAllString(s, " ")
	s = reNewlines.ReplaceAllString(s, "\n")
	return strings.TrimSpace(s)
}

var reTitle = regexp.MustCompile(`(?is)<title[^>]*>(.*?)</title>`)

func pageTitle(html string) string {
	m := reTitle.FindStringSubmatch(html)
	if m == nil {
		return ""
	}
	return strings.TrimSpace(htmlUnescape(m[1]))
}
