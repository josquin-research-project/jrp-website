# Piano-roll generation

`build-piano-roll.py` renders the approved SVG style from Craig's local `proll -j` note data. It uses quarter-note positions and the matching MIDI-derived timemap, not proll's tempo assumptions. Humdrum remains the master; scores are never edited by this process.

Run with Python 3, a compiled `proll`, the scores checkout, and the media generation reports:

```sh
python3 tools/build-piano-roll.py --scores /path/to/jrp-scores \
  --proll /path/to/proll --media-report /path/to/media/report.json \
  --out output/piano-roll-corpus
```

Repeat `--media-report` to include later repairs. A source must match a passed audio build's SHA-256; local audio and timemap hashes must still match that report. Empty voices, nonfinite upstream seconds fields, and unescaped upstream section labels are normalized without altering musical data. Note durations, monotonic timing, and coverage are checked. Failures are recorded in `report.json`.

`publish-piano-roll.py` requires boto3. It defaults to a read-only preflight; `--execute` uploads. Pass `--report`, `--out`, and `--credentials` (a private JSON file outside the repository with `accessKeyId` and `secretAccessKey`). Optional repeated `--media-report` arguments allow selecting an earlier validated audio build **only when its source hash (or exact note-event and explicit-tempo comparison) and both published media hashes match**. It never replaces an occupied, different object.

Before publishing each plot, it checks the current source, SVG checksum, live MP3 checksum/ETag, and live timemap checksum. New objects use `jrp/score-assets/ID-piano-roll.svg`; a download checksum verifies each upload. The output `piano-roll-assets.json` includes only verified plots. Review the result and copy that index into `_includes/metadata/piano-roll-assets.json` before deploying the website.

The website reads R2 directly, with a checksum query parameter for cache updates. It does not call the old piano-roll CGI. Unsupported IDs show an explicit availability message. Audio is also loaded directly from the checked R2 path.

Future source/audio changes require regenerating the matching plot. Replacing a previously published plot is deliberately not automatic in this first publication script: retain the old object and approve a conditional replacement or versioned key before updating the index.

Tests: `python3 tools/test_piano_roll.py`.

For a score whose live recording cannot be matched, `--visual-only` publishes its validated plot with `audioVerified: false`; the page hides playback and explains why. It does not replace or remove any recording.
