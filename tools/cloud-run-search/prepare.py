"""Create an allowlisted build context; never copy whole repositories or credentials."""
import hashlib,json,shutil,subprocess
from pathlib import Path
HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[1]
OUT=ROOT/'output/cloud-run-search'
SCORES=Path('/Users/benjaminory/jrp-scores')
if OUT.exists():raise SystemExit('Build context already exists; review it before replacing.')
OUT.mkdir(parents=True)
for name in ('Dockerfile','app.py','turnstile.py'):shutil.copy2(HERE/name,OUT/name)
shutil.copy2(ROOT/'tools/jrp-search-local.py',OUT/'engine.py')
metadata=OUT/'_includes/metadata';metadata.mkdir(parents=True)
shutil.copy2(ROOT/'_includes/metadata/works.json',metadata/'works.json')
manifest={'scores_commit':subprocess.check_output(['git','-C',str(SCORES),'rev-parse','HEAD']).decode().strip(),'files':{}}
for src in sorted(SCORES.glob('[A-Z]??/*.krn')):
 rel=src.relative_to(SCORES);dst=OUT/'scores'/rel;dst.parent.mkdir(parents=True,exist_ok=True);dst.write_bytes(src.read_bytes())
 manifest['files'][str(rel)]=hashlib.sha256(dst.read_bytes()).hexdigest()
manifest['note']='Checksums describe actual working-tree scores, including any uncommitted changes.'
(OUT/'source-manifest.json').write_text(json.dumps(manifest,indent=2))
(OUT/'.gcloudignore').write_text('.git\n__pycache__\n*.pyc\n')
print(json.dumps({'context':str(OUT),'scores':len(manifest['files'])}))
