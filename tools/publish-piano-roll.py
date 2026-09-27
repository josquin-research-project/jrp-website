"""Publish validated piano rolls into empty R2 slots, verifying matching live audio."""
import argparse, concurrent.futures, hashlib, importlib.util, json, os
from pathlib import Path
import xml.etree.ElementTree as ET


def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--report',type=Path,required=True)
    p.add_argument('--credentials',type=Path,required=True)
    p.add_argument('--out',type=Path,required=True)
    p.add_argument('--execute',action='store_true')
    p.add_argument('--visual-only',action='store_true',help='Publish the plot with playback disabled')
    p.add_argument('--media-report',type=Path,action='append',default=[])
    args=p.parse_args()
    import boto3
    from botocore.config import Config
    credential=json.loads(args.credentials.read_text())
    sdk=boto3.client('s3', endpoint_url='https://dfe88f9edf8a1d61fadf1560affbe143.r2.cloudflarestorage.com',region_name='auto',
                     aws_access_key_id=credential['accessKeyId'],aws_secret_access_key=credential['secretAccessKey'],
                     config=Config(signature_version='s3v4',retries={'mode':'standard','total_max_attempts':5},connect_timeout=15,read_timeout=60,
                                   request_checksum_calculation='when_required',response_checksum_validation='when_required'))
    class Client:
        def request(self,method,**kwargs):
            try: return getattr(sdk,method)(Bucket='digital-library-music',**kwargs)
            except Exception as error:
                response=getattr(error,'response',{})
                code=response.get('Error',{}).get('Code','')
                status=response.get('ResponseMetadata',{}).get('HTTPStatusCode','unknown')
                if method=='get_object' and code in ('NoSuchKey','NotFound','404'): return None
                raise RuntimeError(f'R2 {method} failed (HTTP {status})') from None
        def get(self,key): return self.request('get_object',Key=key)
    client=Client(); args.out.mkdir(parents=True,exist_ok=True)
    alternatives={}
    for path in args.media_report:
        for work,entry in json.loads(path.read_text())['works'].items():
            if entry['status']=='passed': alternatives.setdefault(work,[]).append(entry)
    buildspec=importlib.util.spec_from_file_location('piano',Path(__file__).with_name('build-piano-roll.py'))
    builder=importlib.util.module_from_spec(buildspec);buildspec.loader.exec_module(builder)
    def run(row):
        if row['status']!='validated': return row
        work=row['work']; key='jrp/score-assets/'+work+'-piano-roll.svg'
        try:
            if hashlib.sha256(Path(row['source']).read_bytes()).hexdigest()!=row['source_sha256']: raise ValueError('Source changed after build')
            data=Path(row['path']).read_bytes()
            if hashlib.sha256(data).hexdigest()!=row['sha256']: raise ValueError('SVG changed after validation')
            svg=ET.fromstring(data)
            if svg.tag!='{http://www.w3.org/2000/svg}svg': raise ValueError('Invalid SVG')
            notes=[n for n in svg.iter() if ' ont-' in n.get('class','')]
            if len(notes)!=row['notes']: raise ValueError('Note count mismatch')
            if not args.visual_only:
                audio=client.request('head_object',Key='jrp/score-assets/'+work+'.mp3')
                remote=client.get('jrp/score-assets/'+work+'-timemap.json')
                if remote is None: raise ValueError('Published timemap missing')
                body=remote['Body'].read();remote['Body'].close()
                live_timing_hash=hashlib.sha256(body).hexdigest()
                audio_matches=(audio['ETag'].strip('"')==row['audio_md5'] or audio.get('Metadata',{}).get('sha256')==row['audio_sha256'])
                if not audio_matches or live_timing_hash!=row['timemap_sha256']:
                    matched=False
                    for candidate in alternatives.get(work,[]):
                        if candidate['source_sha256']!=row['source_sha256']:
                            original=next((o for o in candidate['outputs'] if o['file'].endswith('/00000000.krn')),None)
                            if not original: continue
                            original_path=Path(original['file'])
                            if hashlib.sha256(original_path.read_bytes()).hexdigest()!=candidate['source_sha256']: continue
                            if builder.audio_signature(original_path)!=builder.audio_signature(Path(row['source'])): continue
                        timing=next((x for x in candidate['outputs'] if x['file'].endswith('-timemap.json')),None)
                        mp3=next((x for x in candidate['outputs'] if x['file'].endswith('.mp3')),None)
                        if not timing or not mp3 or timing['sha256']!=live_timing_hash: continue
                        path=Path(mp3['file']); audio_bytes=path.read_bytes()
                        audio_hash=hashlib.sha256(audio_bytes).hexdigest(); audio_md5=hashlib.md5(audio_bytes).hexdigest()
                        if audio_hash!=mp3['sha256']: continue
                        if audio['ETag'].strip('"')!=audio_md5 and audio.get('Metadata',{}).get('sha256')!=audio_hash: continue
                        rebuilt=builder.build(work,Path(row['source']),json.loads(body),Path(row['path']).parent)
                        row=dict(row,**rebuilt)
                        row.update(audio_source_sha256=candidate['source_sha256'],audio_note_equivalence_verified=True,audio=str(path),audio_md5=audio_md5,audio_sha256=audio_hash,timemap=timing['file'],timemap_sha256=live_timing_hash)
                        data=Path(row['path']).read_bytes(); matched=True; break
                    if not matched: raise ValueError('No source-matched local audio/timemap pair matches the published files')
            existing=client.get(key)
            if existing:
                body=existing['Body'].read();existing['Body'].close()
                if hashlib.sha256(body).hexdigest()!=row['sha256']: raise ValueError('Destination exists with different content; not overwritten')
            if args.execute:
                if hashlib.sha256(Path(row['source']).read_bytes()).hexdigest()!=row['source_sha256']: raise ValueError('Source changed during preflight')
                if not existing:
                    client.request('put_object',Key=key,Body=data,ContentType='image/svg+xml',CacheControl='public, max-age=300, must-revalidate',Metadata={'sha256':row['sha256'],'source-sha256':row['source_sha256']},IfNoneMatch='*')
                remote=client.get(key);body=remote['Body'].read();remote['Body'].close()
                if hashlib.sha256(body).hexdigest()!=row['sha256']: raise ValueError('Upload checksum mismatch')
            return dict(row,status='published' if args.execute else 'ready',objectKey=key,audioVerified=not args.visual_only)
        except Exception as e:
            return dict(row,status='held',reason=str(e))
    results=[]
    with concurrent.futures.ThreadPoolExecutor(max_workers=16) as pool:
        for row in pool.map(run,json.loads(args.report.read_text())['works']):
            results.append(row)
            with (args.out/'journal.jsonl').open('a') as journal: journal.write(json.dumps(row)+'\n')
            if len(results)%100==0: print(f'{len(results)} checked; {sum(r["status"]=="published" for r in results)} uploaded/verified',flush=True)
    (args.out/'result.json').write_text(json.dumps(results,indent=2)+'\n')
    if args.execute:
        index={r['work']:{'sha256':r['sha256'],'partnames':r['partnames'],'audioVerified':r['audioVerified']} for r in results if r['status']=='published'}
        (args.out/'piano-roll-assets.json').write_text(json.dumps(index,sort_keys=True,indent=2)+'\n')
    from collections import Counter
    print(dict(Counter(r['status'] for r in results)),flush=True)

if __name__=='__main__': main()
