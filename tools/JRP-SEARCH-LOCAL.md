# Local JRP musical search

Run `python tools/jrp-search-local.py --build`, then `python tools/jrp-search-local.py --site /path/to/jekyll-build`.
The default preview uses the existing build at `/private/tmp/jrp-piano-roll-site` and listens only on localhost:4084. Open `/search/` or `/work/?id=Agr1001a`.

The local development server uses the existing result templates and does not upload or deploy anything. The website integration and hosted API are documented in `cloud-run-search/README.md`.

## Engine and scope

- Original Humdrum Extras binaries: `tindex --poly --all --rest`, `themax --startloc`, and `theloc --all`.
- Index all current JRP source files, recording SHA-256; reject searches against changed sources until rebuilding. Failed index entries are reported during build.
- Pitch uses `-D`, interval uses `-I`, and rhythm uses `-u`, following the existing frontend's `createThemax` mapping. Multiple fields are passed together for aligned matching.
- Composer, genre, voice count, work, and movement filtering; complete-work search includes its movements.
- No shell evaluation of queries. Local subprocesses have timeouts and input length/character limits.
- The preview renders the original repertoire results and within-work measure lists. PDF links open ordinary archived PDFs, not highlighted search PDFs.

## Not yet verified or implemented

This HTTP server is for local development; the hosted service uses the separate WSGI wrapper. Legacy CGI flags and parity have not been recovered. Rest boundaries, overlapping matches (themax default), grace notes, split voices, and attribution filters need broader fixtures. AND queries are explicitly rejected; advanced regex syntax is not supported. Highlighted PDF generation is not implemented. The preview uses a prebuilt site snapshot, not a fresh deployment build. The old server timed out during comparison.

Tests: `python tools/test_jrp_search.py` using the same Python environment as the generator. Cover source-linked locations, combined pitch/interval matching, whole-work scope, no matches, and rejected input.
