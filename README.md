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
- `commentary.json`
- `editions.json`

These files are checked into the repo so the site can build without a live
database. They are generated from the project's metadata spreadsheet through a
Google Apps Script endpoint defined in `_includes/metadata/Makefile`.

Source references live in the Commentary tab (`commentary.json`), with one row
per work–source pairing. `WORK_ID` matches either the page's exact work ID or
its first seven characters: `Agr1004` appears on the complete-work page and
every movement/version, while `Agr1004a` appears only on that movement's page.
A movement displays both shared and exact-ID entries. Works need no separate
Source or Commentary ID columns.

Use a readable manuscript shorthand in `Source`, or `Printer, Title (date)`
for a print (for example, `Petrucci, Odhecaton (1501)`). DIAMM/RISM links,
folios/pages/item numbers, attribution, movements, notes, and catalogue sigla
are optional. Catalogue sigla are retained as editorial metadata; source names
and links are displayed on work pages. The former Sources tab is hidden as an
archive, and `sources.json` is retained as a historical snapshot, excluded from
metadata refreshes.

## External Services

### Local preservation archive

`tools/archive-legacy-assets.py` copies local source scores and PDF backups,
recovers missing PDFs from the legacy site, and downloads static assets from
the Stanford mirror. Its default destination is `.legacy-archive/`, excluded
from Git and website publication by its leading dot. Run phases sequentially:

```sh
python3 tools/archive-legacy-assets.py --phase local
python3 tools/archive-legacy-assets.py --phase pdfs
python3 tools/archive-legacy-assets.py --phase assets
```

Local inputs default to `~/jrp-scores` and `~/jrp-scores-backup/scores`; override
them with `--scores` and `--pdf-backup`. Use `--ids Jos2721,Agr1001a` for a pilot.
Each successful file has a SHA-256 checksum and provenance recorded in
`journal.jsonl`. Resuming checks saved hashes and skips completed files.
Use `--retry-failed` to retry recorded failures. The default is six concurrent
requests; `--workers` changes that limit. No files are uploaded or deleted from
the original repositories. `summary.json` records totals and unresolved failures.

Validation checks file signatures, XML/JSON parsing, and selected end markers;
it is not a full musical, PDF-rendering, or audio-decoding comparison. The archive
preserves the server responses without claiming they match the latest local
score revision. The data-server phase covers 14 formats/plot variants for each
current metadata ID; dynamic search, critical notes, and legacy analysis endpoints
require separate preservation work.

**A structurally valid PDF can be completely blank.** Never interpret a saved
PDF or an `ok` journal status as a usable score. Run the separate page-rendering
audit with a Python environment containing `pypdfium2` and `numpy`:

```sh
python3 tools/audit-archived-pdfs.py
```

The audit renders every page and records blank documents, documents containing
blank pages, rendering failures, and visible content that still needs review in
`pdf-audit-all.json`. `--recovered-only` checks only PDFs downloaded from Stanford.
Keep blank/error PDFs as preservation evidence, but exclude them from future
publication. Nonblank pages still require checks for correct and complete music.

For The 1520s Project, use `--project 1520s --phase local` followed by
`--project 1520s --phase assets`. This reads the sibling `1520s-project-scores`
and `1520s-project-website` repositories without modifying them, and writes into
`.legacy-archive/1520s/`. The local phase also preserves MusicXML, Sibelius,
MuseScore, and text originals. Proprietary/editor source files are copied and
checksummed, not application-validated. Run the PDF audit with
`--archive .legacy-archive/1520s`. The JRP-specific remote PDF phase is disabled
for this project. Neither project's filenames alone establish shared content;
compare hashes and provenance before deduplicating for R2.

### R2 upload planning

The shared R2 bucket is `digital-library-music`. To prepare local review
manifests and an eight-file pilot (four files from each project), run:

```sh
python3 tools/prepare-r2-manifests.py
python3 -m unittest discover -s tools -p 'test_prepare_r2_manifests.py'
```

Plans are written to `.legacy-archive/r2-plan/`, including a readable `README.md`,
separate project manifests, and `pilot.json`. The generator checks every saved
file against its journal hash and size. Publication holds apply to both paths
and matching file hashes across projects. PDFs need a current matching page
audit. Failed downloads, private metadata, and notation-editor/text originals
are excluded. Each candidate still requires content review; source-to-derivative
revision matching is unverified. No deduplication is performed.

These are private local proposals, not public website manifests: they contain
local paths and provenance. The script has no network or upload capability.
The generated plans default to no upload or publication approval. The eight-file
private pilot was subsequently uploaded and retrieved successfully; all eight
SHA-256 checksums and sizes matched. Its result is recorded locally in
`.legacy-archive/r2-plan/pilot-upload-result.json`. The pilot verification token
and its temporary local credential file were removed.

#### Bulk uploader

`tools/upload-r2-assets.py` defaults to a local-only dry run. It checks manifests
against current archive journals, PDF audits and holds, then verifies file hashes:

```sh
python3 tools/upload-r2-assets.py \
  --manifest .legacy-archive/r2-plan/jrp-manifest.json \
  --manifest .legacy-archive/r2-plan/1520s-manifest.json
python3 -m unittest discover -s tools -p 'test_*r2*.py'
```

No SDK or credentials are needed for a dry run. `--limit N` checks only the first
N candidates; `--manifest .legacy-archive/r2-plan/pilot.json` selects the pilot.

Actual transfers require explicit `--execute`, a Python 3.10+ environment with
`tools/requirements-r2.txt` installed, and `R2_ACCESS_KEY_ID` and
`R2_SECRET_ACCESS_KEY` supplied securely in the process environment. Do not put
credentials in Git, manifests, command arguments, or shell history. Use an
Object Read & Write token restricted to `digital-library-music`. The endpoint
and bucket are fixed to this project's Cloudflare account. Confirm that the
bucket is still private before execution: the object-only token cannot verify
bucket access configuration. `--execute` authorizes private transfers for that
invocation; it does not change the review status in the manifests.

The uploader downloads and hashes existing objects before skipping them. New
objects use conditional PUT (`If-None-Match: *`), explicit content types, and
checksum metadata, then are downloaded and checked. Conflicting content is never
overwritten. Existing metadata differences are recorded without modifying the
object, including the pilot's `.krn` files uploaded by the dashboard as
`application/octet-stream`.

Progress is flushed to `.legacy-archive/r2-plan/upload-journal.jsonl`. Use
`--workers 1` through `--workers 8` to control concurrency (default 4). The first
failure stops new transfers; already-running transfers finish and are recorded.
After resolving it, rerun the same command; remote bytes
are checked again rather than trusting an earlier journal entry. A local lock
prevents overlapping uploader runs against the same archive. SDK request retries
are bounded, with up to three per-file attempts for temporary connection, proxy,
or service errors. Each retry checks remote bytes before deciding whether to
write. Interrupted body transfers can also be recovered by rerunning. Files
larger than 128 MiB require a separate multipart workflow. Changes to archive
journals or PDF policy files stop a running transfer pass.

The full private transfer is complete: 32,297 objects totaling 12,762,936,996 bytes
were downloaded and checksum-verified in R2. A final complete bucket listing
matched the manifests exactly; none of the 112 held PDFs were present. See
`.legacy-archive/r2-plan/BULK-TRANSFER-RESULT.md` and its JSON counterpart for
reconciliation details. Public access remains disabled and website asset URLs
are unchanged. The transfer's temporary local credential file was removed.

The bulk uploader passed a full local dry run and a live ten-file test: eight
existing objects were verified, two new MEI objects were uploaded and verified,
then a repeat run verified all ten without uploading again. The test used boto3
1.42.97; results are in `.legacy-archive/r2-plan/uploader-live-test-result.json`.
The test environment's Python 3.9 produced an SDK deprecation warning, so use
Python 3.10+ for ongoing transfers. It cannot create buckets, change public
access, delete remote objects, or modify website URLs. Bulk execution and public
publication remain separate decisions. SDK setup follows
[Cloudflare's boto3 example](https://developers.cloudflare.com/r2/examples/aws/boto3/)
and [S3 compatibility documentation](https://developers.cloudflare.com/r2/api/s3/api/).

### data.josqu.in

`data.josqu.in` is the preferred static data host for score-related assets. If
an individual asset is missing or unreachable there, the site retries it from
the Stanford mirror at `data2.josqu.in`. Both URLs are configured in
`_config.yml` and used by `_includes/scripts/scripts-common.js`.

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

The generated asset-availability manifest checks both `data.josqu.in` and
`data2.josqu.in`. Its asset flags are true when either data server has the file;
the browser then tries the primary URL before falling back to the mirror.

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

## Work Texts

Edited texts live in `josquin-research-project/jrp-scores` under
`texts/`, named with the work ID followed by a hyphen and title
(for example, `texts/Agr/Agr3028-Jay_beau_heur.txt`).
Run `make` (or `make texts`) here to refresh `_includes/metadata/texts.json`
when adding, renaming, or removing text files, then publish the updated index.
Existing texts load directly from the scores repository, so editing their
contents does not require refreshing the index. Work pages show four lines
below the score, with a See more button for the full text. Original line and
stanza breaks are preserved, with hanging indents for wrapped lines.

### Cloudflare asset delivery

`asset_base_url` selects the project prefix in the shared R2 bucket. The browser tries Cloudflare first, then the existing data server(s) and repository URLs. `cloudflare-assets.json` maps preserved repository/PDF files to their uploaded object keys; it is a snapshot of the verified September 2026 transfer, not a claim of current source revision. Refresh it when publishing a new archive. Known blank JRP PDFs remain blocked. The identical `asset-delivery.js` helpers in both websites implement bounded request timeouts and reject HTML error responses. The bucket needs read-only GET/HEAD CORS for browser score and download requests. Dynamic legacy CGI services remain separate.
