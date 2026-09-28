# JRP hosted musical search

Project `digital-library-music` (384288870841), service `jrp-search-pilot`, region `us-central1`.
Endpoint: https://jrp-search-pilot-384288870841.us-central1.run.app/api/search
Website configuration: `search_api_url` and the public `search_turnstile_sitekey` in `_config.yml`.

The API uses the original Humdrum Extras `tindex`, `themax`, and `theloc`, pinned to revision `3247806c845b76d5fc932a3a73a5a2bce701f23b`. Legacy CGI equivalence remains unverified. AND queries and highlighted PDFs are not implemented; the website identifies search as beta and links to ordinary PDFs.

## Build and update

`prepare.py` snapshots 1,382 working-tree Humdrum scores and the website metadata into `output/cloud-run-search`, recording source SHA-256 checksums and the scores repository commit. It refuses to overwrite an existing context. Archive the previous context before preparing a new one. No repository history, audio, PDFs, or credentials are copied.

The Docker build compiles the original tools on Linux, indexes every score and resolves all note locations once. Queries retrieve cached locations rather than reparse every matching score. The build fails if any score cannot be indexed or its note locations cannot be resolved. Source changes require a new snapshot and build; this is not yet an automatic GitHub update workflow.

Build with `gcloud builds submit output/cloud-run-search --project digital-library-music --region us-central1 --tag IMAGE`. Deploy that image to `jrp-search-pilot` using the settings below, then compare hosted results with the local engine before publishing website changes. Never deploy `jrp-search-local.py`'s development HTTP server.

## Runtime

Request-based billing, 1 CPU, 1 GiB RAM, minimum zero and maximum one instance, concurrency one, 120-second timeout. The container uses the runtime identity `jrp-search-runtime@digital-library-music.iam.gserviceaccount.com`, which has no project roles or downloaded keys. Only `/`, `/health`, and `/api/search` are served; local files are not exposed.

Public invocation is required for the static website. CORS allows the two josqu.in origins, josquin.stanford.edu, and the local verification preview on port 4085. CORS is browser policy, not authentication or a cost control. The maximum instance count limits resources but does not cap spending; the user configured a $10 monthly budget alert.

## Verification

Run `python tools/test_jrp_search.py` and `python tools/cloud-run-search/test_api.py` with the documented local Humdrum installation and prepared context. Tests cover source-linked matches, combined patterns, work scope, invalid queries, API routing and CORS on success/error responses.

The first hosted pilot matched four local searches exactly (32, 5, 353, 4 matches). Broader searches exposed a timeout in per-query location generation, prompting build-time precomputation. Additional release results are recorded below when verified.

The initial private revision is `jrp-search-pilot-00001-lwt`. Retain its image for rollback, but it is unsuitable for unrestricted full-corpus searches because of the timeout.

Full-repertoire verification uses a saved reference of 21,531 matches across 1,325 scores for `pitch=c d e`. Passing only the requested feature streams to `themax` preserves all result locations while removing the cost of scanning unrelated index fields. Local full-corpus results were exactly equal to that reference (9.545 seconds including the uncached location path). The build-time position cache removes the remaining per-score conversion work.

Release verification: revision `jrp-search-pilot-00003-z55`, image digest `sha256:9154e187c2d40b34d77c0e8324d9c2bcac655306656e8c1df075e0d069682c38`. Full-corpus hosted results exactly matched the reference in 12.816 seconds; the other three queries returned 353, 5, and 4 matches in 0.610, 0.814, and 0.558 seconds. Allowed-origin CORS headers verified on all responses. Results: `output/cloud-run-search-release-verification.json`.

Public invocation (`allUsers` / `roles/run.invoker` on this service only) was explicitly approved and enabled. Anonymous API access and CORS passed. The website preview returned 353 Agricola matches and 143 within-work matches for Agr1001, with correct movement labels, measure lists, and ordinary R2 PDF links.

## Turnstile protection

Both repertoire and within-work searches obtain a fresh Managed Turnstile token before posting form-encoded parameters to `/api/search`. GET searches are rejected. The API verifies the token with Cloudflare before running the engine, checks the hostname and `jrp-search` action, and fails closed when verification is unavailable. Tokens are single-use; the website offers retry after verification errors. Browsing and health checks do not require a challenge.

The widget currently permits `www.josqu.in`. Add `josquin.stanford.edu` to the widget before deploying the website on that hostname. The backend already accepts that hostname. The secret is never included in website code or the repository: Cloud Run reads `TURNSTILE_SECRET` from Google Secret Manager `jrp-search-turnstile:1`. The runtime identity has Secret Accessor on this secret only, with no project roles. Preserve this secret reference when deploying future images (`--set-secrets=TURNSTILE_SECRET=jrp-search-turnstile:1`).

Run `node --test tools/test-search-verification.cjs` alongside the Python API tests. They cover fresh tokens, POST-only transport, cleanup, missing/invalid/replayed tokens, hostname/action checks and fail-closed behavior. Turnstile prevents unverified requests from running searches; it does not prevent all requests from reaching Cloud Run or provide a hard spending cap.
