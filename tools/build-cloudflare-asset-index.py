#!/usr/bin/env python3
"""Build browser URL mappings from a verified R2 upload manifest and PDF holds.

Use after upload verification, not as a substitute for verifying uploaded bytes.
The index preserves archived URLs; it does not certify derivative/source revisions.
"""
import argparse
import json
from pathlib import Path


def build_index(manifest, holds):
    project = manifest['project']
    index = {'sources': {}, 'pdfs': {}, 'blocked': []}
    for asset in manifest['assets']:
        key = asset['objectKey'].removeprefix(project + '/')
        source = asset['source']
        if source.startswith('https://') and not source.startswith(('https://data.josqu.in/', 'https://data2.josqu.in/', 'https://data.1520s-project.org/')):
            index['sources'][source] = key
        if project == 'jrp' and key.startswith('pdfs/'):
            index['pdfs'][Path(key).name] = key
            index['sources']['https://cdn.jsdelivr.net/gh/benory/jrp-scores-backup@main/scores/' + key[5:]] = key
        elif project == '1520s' and '/1520s-project-scores/' in source:
            path = source.split('/1520s-project-scores/', 1)[1]
            index['sources']['https://raw.githubusercontent.com/benory/1520s-project-scores/main/' + path] = key
    for hold in holds.get('files', []):
        name = Path(hold['key']).name
        if project == 'jrp' and name not in index['pdfs']:
            index['pdfs'][name] = None
            index['blocked'].append('https://cdn.jsdelivr.net/gh/benory/jrp-scores-backup@main/scores/' + hold['key'][5:])
    return index


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--manifest', type=Path, required=True)
    parser.add_argument('--holds', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    index = build_index(json.loads(args.manifest.read_text()), json.loads(args.holds.read_text()))
    args.output.write_text(json.dumps(index, separators=(',', ':')) + '\n')
