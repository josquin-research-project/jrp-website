# Josquin Research Project Website

This repository contains the public website for the Josquin Research Project
(JRP), a static Jekyll site for searching, browsing, downloading, and analyzing
polyphonic music from roughly 1420-1520.

The production domain is configured in `CNAME` as `www.josqu.in`. The site is
designed to run as a mostly static site: metadata is checked into the repository
as JSON, while larger score/audio/analysis assets are served from external data
services.

## What the Site Does

The site provides:

- a homepage and project information pages;
- a Repertoire page for browsing works by composer, genre, voice count, and
  attribution category;
- work pages with metadata, score previews, download links, audio, and analysis
  links;
- search and search-results pages;
- analysis tools and links for Verovio/VHV, Ribbon, PROLL, cadences,
  dissonance, imitation, and parallel motion;
- contact and error-report forms.

## Repository Structure

```text
.
├── _config.yml              Site configuration and external service URLs
├── _includes/               Shared HTML, scripts, styles, and metadata
│   ├── metadata/            Checked-in JSON metadata files
│   ├── scripts/             Shared JavaScript helpers
│   └── styles/              Shared CSS
├── _layouts/                Jekyll layouts
├── about/                   About pages
├── analysis/                Analysis landing/tool pages
├── census/                  Legacy census redirect/compatibility area
├── contact/                 Contact form page
├── error/                   Error-report form page
├── images/                  Site images and icons
├── proll/                   PROLL audio-score viewer
├── repertoire/              Browse/repertoire interface
├── search/                  Search page
├── search-results/          Search-results page
├── under-the-hood/          Technical background page
├── work/                    Individual work pages
├── index.md                 Homepage
├── Makefile                 Metadata refresh shortcut
└── CNAME                    Production domain for GitHub Pages
```

Many page directories include page-specific `scripts-local.html` and
`styles-local.html` files. Shared helpers live under `_includes/`.

## Metadata and Data Sources

Core site metadata lives in `_includes/metadata/`:

- `works.json`
- `composers.json`
- `sources.json`
- `editions.json`

These files are checked into the repo so the site can build without a live
database. They are generated from the project's metadata spreadsheet through a
Google Apps Script endpoint defined in `_includes/metadata/Makefile`.

## External Services

### data.josqu.in

`data.josqu.in` is the main static data host for score-related assets. The base
URL is configured in `_config.yml` and used by `_includes/scripts/scripts-common.js`.

The site expects assets such as:

- Humdrum/Kern files: `https://data.josqu.in/Jos2012.krn`
- MEI files: `https://data.josqu.in/Jos2012.mei`
- MusicXML files: `https://data.josqu.in/Jos2012.musicxml`
- MIDI files: `https://data.josqu.in/Jos2012.mid`
- MP3 files: `https://data.josqu.in/Jos2012.mp3`
- incipit SVGs: `https://data.josqu.in/Jos2012-incipit.svg`
- analysis graphics and timemap JSON files.

Work pages try to load Humdrum scores from `data.josqu.in` first. Some code
also falls back to raw files in the `josquin-research-project` GitHub
organization when the data host does not have the needed Kern file.

### VHV / Verovio

The site uses Humdrum/Kern scores with Verovio-based rendering and analysis.
Work pages link to VHV at:

```text
https://verovio.humdrum.org/
```

Typical links pass a JRP work id with `file=jrp:Jos2012` and may also include
Humdrum filters for tools such as dissonance, imitation, or cadence extraction.

The local work-page score preview uses the Humdrum notation plugin loaded from:

```text
https://plugin.humdrum.org/scripts/humdrum-notation-plugin-worker.js
```

### Ribbon

Ribbon analysis is hosted separately at:

```text
https://ribbon.stanford.edu
```

The URL is configured in `_config.yml` as `ribbon_url`. Work-page analysis links
open Ribbon with the current JRP work id.

## URL Parameters

Several pages are driven by query parameters:

- `/work/?id=Jos2012` opens a specific work.
- `/repertoire/?c=Jos` filters by composer.
- `/repertoire/?g=Mass` filters by genre.
- `/repertoire/?v=4` filters by number of voices.
- `/repertoire/?home=census` opens the Repertoire page at the Statistics/Census
  section.
