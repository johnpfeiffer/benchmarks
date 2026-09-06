// Command benchtool automates the deterministic, token-heavy parts of the
// benchmark data workflows described in .agents/skills/: fetching pages and
// extracting just the fields the agent needs (instead of dumping whole pages
// into context), and inserting rows into the embedded JSON data files with
// the repo's formatting and ordering conventions.
//
// Usage:
//
//	benchtool fetch-meta <url>                      title, canonical, and date metadata for a news candidate
//	benchtool aa-model <slug-or-url>                score/provider/open-weight/release for an Artificial Analysis model page
//	benchtool aa-releases                           every leaderboard variant's release date as TSV (one fetch)
//	benchtool news-add <url> <YYYY-MM-DD>           validate + dedupe + insert into news.json (newest first)
//	benchtool ai-add <model> <score> <provider> [--open-weight] [--color=#hex] [--released=YYYY-MM-DD]
//	benchtool ai-set-released <model> <YYYY-MM-DD|null>   set/clear the release date on an existing ai.json row
//
// The add commands rewrite files under app/src/data (located by walking up
// from the working directory) and only guarantee file conventions; run
// `npm test` in app/ afterwards for the real validation gate.
package main

import (
	"fmt"
	"os"
)

func usage() {
	fmt.Fprintln(os.Stderr, `usage:
  benchtool fetch-meta <url>
  benchtool aa-model <slug-or-url>
  benchtool aa-releases
  benchtool news-add <url> <YYYY-MM-DD>
  benchtool ai-add <model> <score> <provider> [--open-weight] [--color=#hex] [--released=YYYY-MM-DD]
  benchtool ai-set-released <model> <YYYY-MM-DD|null>`)
	os.Exit(2)
}

func main() {
	if len(os.Args) < 2 {
		usage()
	}
	var err error
	switch os.Args[1] {
	case "fetch-meta":
		if len(os.Args) != 3 {
			usage()
		}
		err = cmdFetchMeta(os.Args[2])
	case "aa-model":
		if len(os.Args) != 3 {
			usage()
		}
		err = cmdAAModel(os.Args[2])
	case "aa-releases":
		err = cmdAAReleases()
	case "news-add":
		if len(os.Args) != 4 {
			usage()
		}
		err = cmdNewsAdd(os.Args[2], os.Args[3])
	case "ai-add":
		err = cmdAIAdd(os.Args[2:])
	case "ai-set-released":
		if len(os.Args) != 4 {
			usage()
		}
		err = cmdAISetReleased(os.Args[2], os.Args[3])
	default:
		usage()
	}
	if err != nil {
		fmt.Fprintln(os.Stderr, "benchtool:", err)
		os.Exit(1)
	}
}
