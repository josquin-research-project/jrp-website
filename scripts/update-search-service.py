#!/usr/bin/env python3
"""Synchronize the existing JRP Cloud Run service after a successful asset run."""
import argparse
import fcntl
import hashlib
import json
import os
import ssl
from pathlib import Path
import subprocess
import sys
import tempfile
from urllib.error import HTTPError
from urllib.request import urlopen

SITE = Path(__file__).resolve().parents[1]
PROJECT = 'digital-library-music'
REGION = 'us-central1'
SERVICE = 'jrp-search-pilot'
TAG = 'make-check'
REPOSITORY = f'{REGION}-docker.pkg.dev/{PROJECT}/cloud-run-source-deploy/{SERVICE}'


def fingerprint(context):
    """Hash shipped bytes, not commit IDs or timestamps; include uncommitted edits."""
    digest = hashlib.sha256()
    for path in sorted(context.rglob('*')):
        if not path.is_file() or path.name in {'source-manifest.json', '.gcloudignore', 'search-build.json', 'cloudbuild.json', 'pdf-map-report.json'}:
            continue
        relative = path.relative_to(context).as_posix().encode()
        data = path.read_bytes()
        digest.update(len(relative).to_bytes(8, 'big') + relative)
        digest.update(len(data).to_bytes(8, 'big') + data)
    return digest.hexdigest()


def traffic(service):
    return {row['revisionName']: row['percent'] for row in service['status']['traffic']
            if row.get('percent', 0)}


def revision_fingerprint(revision):
    for entry in revision['spec']['containers'][0].get('env', []):
        if entry['name'] == 'JRP_BUILD_FINGERPRINT':
            return entry.get('value')


def ready(revision):
    return any(row['type'] == 'Ready' and row['status'] == 'True'
               for row in revision['status'].get('conditions', []))


def probe(url, scores):
    import truststore
    context = truststore.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
    with urlopen(url + '/health', timeout=120, context=context) as response:
        health = json.load(response)
    if health != {'status': 'ok', 'scores': scores}:
        raise RuntimeError(f'Unexpected search health response: {health}')
    for path, expected in [('/api/highlight-pdf?ticket=invalid', 403), ('/api/search', 405)]:
        try:
            with urlopen(url + path, timeout=120, context=context) as response:
                code = response.status
        except HTTPError as error:
            code = error.code
        if code != expected:
            raise RuntimeError(f'Hosted verification failed for {path}: {code}')


class Cloud:
    def __init__(self, toolkit):
        self.command = [sys.executable, str(toolkit / 'shared/runtime/gcloud-trusted.py')]

    def run(self, *args, capture=False):
        command = self.command + list(args) + ['--project', PROJECT, '--region', REGION, '--quiet']
        result = subprocess.run(command, check=True, text=True,
                                stdout=subprocess.PIPE if capture else None)
        return json.loads(result.stdout) if capture else None

    def service(self):
        return self.run('run', 'services', 'describe', SERVICE, '--format=json', capture=True)

    def revision(self, name):
        return self.run('run', 'revisions', 'describe', name, '--format=json', capture=True)


def synchronize(context, signature, cloud, check=probe):
    before = cloud.service()
    previous = traffic(before)
    if len(previous) != 1 or sum(previous.values()) != 100:
        raise RuntimeError('Search traffic is split; review it before an automatic update.')
    active = cloud.revision(next(iter(previous)))
    if ready(active) and revision_fingerprint(active) == signature:
        print('Search scores and published PDF maps are unchanged; skipping build and deployment.', flush=True)
        return False
    image = REPOSITORY + ':make-' + signature[:24]
    config = {'steps': [
        {'name': 'gcr.io/cloud-builders/docker', 'args': ['build', '-t', image, '.']},
        {'name': 'gcr.io/cloud-builders/docker',
         'args': ['run', '--rm', '--entrypoint', 'python', image, '/app/search-build-check.py']}],
        'images': [image], 'timeout': '1800s'}
    (context / 'cloudbuild.json').write_text(json.dumps(config, indent=2))
    print('Building and verifying the updated search service...', flush=True)
    cloud.run('builds', 'submit', str(context), '--config', str(context / 'cloudbuild.json'))
    if traffic(cloud.service()) != previous:
        raise RuntimeError('Live search traffic changed during the build; update stopped.')
    cloud.run('run', 'deploy', SERVICE, '--image', image, '--no-traffic', '--tag', TAG,
              '--update-env-vars', 'JRP_BUILD_FINGERPRINT=' + signature)
    return promote(context, signature, cloud, previous, active, check)


def promote(context, signature, cloud, previous, active, check=probe):
    """Verify and promote an already-staged revision, preserving rollback checks."""
    staged = cloud.service()
    if traffic(staged) != previous:
        raise RuntimeError('Unexpected traffic change while staging; update stopped.')
    candidate = next(row for row in staged['status']['traffic'] if row.get('tag') == TAG)
    revision = cloud.revision(candidate['revisionName'])
    if not ready(revision) or revision_fingerprint(revision) != signature:
        raise RuntimeError('The staged revision is not the verified build.')
    # Deploy changes only the image and our fingerprint; keep secrets, IAM and limits.
    for key in ('containerConcurrency', 'timeoutSeconds', 'serviceAccountName'):
        if revision['spec'].get(key) != active['spec'].get(key):
            raise RuntimeError('Staged revision changed runtime setting: ' + key)
    old_annotations = active.get('metadata', {}).get('annotations', {})
    new_annotations = revision.get('metadata', {}).get('annotations', {})
    for key in ('autoscaling.knative.dev/minScale', 'autoscaling.knative.dev/maxScale',
                'run.googleapis.com/cpu-throttling', 'run.googleapis.com/startup-cpu-boost',
                'run.googleapis.com/execution-environment'):
        if old_annotations.get(key) != new_annotations.get(key):
            raise RuntimeError('Staged revision changed resource setting: ' + key)
    old_container = active['spec']['containers'][0]
    new_container = revision['spec']['containers'][0]
    for key in ('resources', 'ports', 'command', 'args'):
        if old_container.get(key) != new_container.get(key):
            raise RuntimeError('Staged revision changed container setting: ' + key)
    def env(container):
        return {row['name']: row for row in container.get('env', [])
                if row['name'] != 'JRP_BUILD_FINGERPRINT'}
    if env(old_container) != env(new_container):
        raise RuntimeError('Staged revision changed existing environment or secret references.')
    scores = json.loads((context / 'search-build.json').read_text())['scores']
    print('Checking the staged endpoint before switching traffic...', flush=True)
    check(candidate['url'], scores)
    if traffic(cloud.service()) != previous:
        raise RuntimeError('Live search traffic changed during verification; update stopped.')
    cloud.run('run', 'services', 'update-traffic', SERVICE,
              '--to-revisions', candidate['revisionName'] + '=100')
    try:
        live = cloud.service()
        if traffic(live) != {candidate['revisionName']: 100}:
            raise RuntimeError('Traffic promotion did not complete.')
        check(live['status']['url'], scores)
    except Exception:
        cloud.run('run', 'services', 'update-traffic', SERVICE, '--to-revisions',
                  ','.join(f'{name}={percent}' for name, percent in previous.items()))
        raise
    print('Search service updated; highlighted results now use the published PDFs.', flush=True)
    return True


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--toolkit', type=Path, default=SITE.parent / 'digital-library-build')
    parser.add_argument('--plan', action='store_true', help='Inspect local inputs without contacting or deploying to Google Cloud')
    args = parser.parse_args()
    toolkit = args.toolkit.resolve()
    # Use an ignored local directory for the lock, never copy it into the image.
    output = SITE / 'tmp/search-service'
    output.mkdir(parents=True, exist_ok=True)
    with (output / 'update.lock').open('a') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        with tempfile.TemporaryDirectory(prefix='jrp-search-update-') as temporary:
            context = Path(temporary) / 'context'
            environment = dict(os.environ, JRP_SEARCH_CONTEXT=str(context), JRP_WEBSITE_DIR=str(SITE),
                               JRP_SEARCH_MAPS_MODE='existing' if args.plan else 'generate')
            subprocess.run([sys.executable, str(toolkit / 'tools/search/cloud_run/prepare.py')],
                           env=environment, check=True)
            (context / 'search-build-check.py').write_bytes((toolkit / 'tests/jrp_search_build_check.py').read_bytes())
            signature = fingerprint(context)
            manifest = json.loads((context / 'source-manifest.json').read_text())
            # Health reports every indexed source, including those hidden from results.
            scores = len(manifest['files'])
            (context / 'search-build.json').write_text(json.dumps({'fingerprint': signature, 'scores': scores}))
            if args.plan:
                maps = json.loads((context / 'pdf-map-report.json').read_text())
                if maps['pendingMaps']:
                    print(f"{len(maps['pendingMaps'])} position maps will be prepared from saved layouts during search-update. No catalogue assets need rebuilding for these maps.")
                print(f'Search build inputs: {scores} indexed scores; fingerprint {signature}. No cloud changes made.')
                return
            synchronize(context, signature, Cloud(toolkit))


if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        print('Search update stopped: ' + str(error), file=sys.stderr)
        sys.exit(1)
