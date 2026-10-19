# Josquin Research Project Website

The Josquin Research Project (JRP) supports searching, browsing, downloading, and analyzing polyphonic music from approximately 1420–1520.

This repository contains the public website, built with Jekyll and published through GitHub Pages.

- [Website](https://josquin.stanford.edu/)
- [Humdrum scores](https://github.com/josquin-research-project/jrp-scores)

## Website features

The website provides a repertoire browser, individual work pages, musical scores, downloadable editions, audio playback, and musical analysis tools. Search supports pitch, interval, and rhythm queries, with score excerpts and highlighted PDFs among the results.

Work pages bring together attribution, editorial credits, source references, texts, movements, and available downloads. Analysis features include piano roll, ribbon, vocal ranges, activity plots, parallel motion, rhythmic patterns, dissonance, cadences, and imitation.

## Repository structure

| Location | Purpose |
| --- | --- |
| `index.md` | Homepage |
| `_config.yml` | Site settings and service connections |
| `_layouts/` | Shared Jekyll page layouts |
| `_includes/` | Reusable page components, JavaScript, styles, and metadata |
| `_includes/metadata/` | Work, composer, edition, commentary, text, and asset indexes |
| `work/` | Individual work pages and score controls |
| `repertoire/` | Repertoire browsing and filtering |
| `search/`, `search-results/` | Musical search interface and results |
| `analysis/` | Analysis pages and controls |
| `proll/`, `ribbon/` | Piano-roll and ribbon viewers |
| `about/`, `under-the-hood/` | Project information and technical background |
| `contact/`, `error/` | Feedback and error-reporting pages |
| `images/` | Website graphics |
| `census/` | Compatibility routes for the earlier census pages |
| `Makefile` | Metadata and asset maintenance tasks |
| `Gemfile`, `Gemfile.lock` | Jekyll dependencies |
| `CNAME` | GitHub Pages custom domain |

Page directories commonly contain `scripts-local.html` and `styles-local.html` for page-specific behavior and appearance. Shared components belong in `_includes/`.

## Scores, metadata, and digital tools

Humdrum scores are maintained in the separate JRP scores repository. Website metadata comes from the project's master spreadsheet and is stored here as JSON, allowing the site to build without querying the spreadsheet for each visitor.

The separate **digital-library-build** toolkit supports both the JRP and The 1520s Project. It generates PDFs, MEI, MusicXML, MIDI, MP3 audio, timemaps, incipits, vocal-range plots, and activity plots from Humdrum scores. Build tools and generated files are maintained outside this website repository.

Verovio provides browser-based notation rendering. Analysis tools combine score processing with interactive displays on the website.

## Hosting and services

**GitHub Pages** hosts the website.

**Cloudflare R2** stores PDFs, audio, score formats, and other static assets, delivered through [assets.1520s-project.org](https://assets.1520s-project.org). That hostname serves individual files rather than a browsable directory.

**Google Cloud Run** hosts the musical search service. Cloudflare Turnstile provides a human-verification step before searches are submitted.

## Maintenance and local development

For a local website preview, install dependencies with `bundle install`, then run `bundle exec jekyll serve`.

Maintenance commands use the separately configured `digital-library-build` toolkit. Asset uploads require storage credentials; search deployment also requires an authenticated Google Cloud CLI.

- `make`: refresh metadata, rebuild changed or missing assets, and update the search service when its inputs have changed.
- `make assets-plan`: preview the asset work needed.
- `make assets ASSET_IDS="Jos0603c"`: update assets for selected works.
- `make search-plan`: preview search updates.
- `make search-update`: update the search service independently of asset generation.

The website itself is published through GitHub Pages.
