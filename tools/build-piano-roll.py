"""Generate validated piano-roll SVGs from Humdrum and matching audio-build reports."""
import bisect, hashlib, html, json, pathlib, subprocess, math, re
ROOT = pathlib.Path(__file__).resolve().parents[1]
PROLL = '/Users/benjaminory/humdrum-tools/humextra/bin/proll'
def rational(v):
    return v[0] / v[1] if len(v) == 2 else v[0]
def parse_proll_json(raw):
    # proll emits non-JSON nan/inf in its unused seconds fields for some mensurations.
    raw = re.sub(r'("(?:scorelengthsec|starttimesec|durationsec|timesec)"\s*:\s*)-?(?:nan|inf)\b', r'\1null', raw)
    # An empty spine is serialized as [ } ] by proll; preserve it as an empty part.
    raw = re.sub(r'("notedata"\s*:\s*\[)\s*}\s*]', r'\1]', raw)
    # sectionlabel is emitted without JSON string escaping by the upstream tool.
    raw = re.sub(r'("sectionlabel":)"(.*?)"(?=, "mensuration":|}\s*,?\s*$)',
                 lambda m: m[1]+json.dumps(m[2]), raw, flags=re.MULTILINE)
    return json.loads(raw)

def audio_signature(source, proll=PROLL):
    raw=subprocess.check_output([str(proll), '-j', str(source)],timeout=60,stderr=subprocess.PIPE).decode()
    data=parse_proll_json(raw)
    notes=[[(n['pitch']['b12'],rational(n['starttime']),rational(n['duration'])) for n in part['notedata'] if n.get('pitch',{}).get('b12',0)>0] for part in data['partdata']]
    # Keep explicit tempo instructions in the comparison as well as all note events.
    tempos=[line for line in pathlib.Path(source).read_text().splitlines() if any(t.startswith('*MM') for t in line.split('\t'))]
    return (rational(data['scorelength']), notes, tempos)

def build(work, source, mapping, out, proll=PROLL):
    if not re.fullmatch(r'[A-Za-z0-9.]+', work): raise ValueError('Invalid work ID')
    source_digest=hashlib.sha256(source.read_bytes()).hexdigest()
    raw = subprocess.check_output([str(proll), '-j', str(source)], timeout=60, stderr=subprocess.PIPE).decode()
    data = parse_proll_json(raw)
    if len(mapping)<2: raise ValueError('Incomplete audio timemap')
    beats = [p['qstamp'] for p in mapping]
    if any(not math.isfinite(p[k]) for p in mapping for k in ['qstamp','tstamp']): raise ValueError('Nonfinite timing')
    if any(b['qstamp']<=a['qstamp'] or b['tstamp']<a['tstamp'] for a,b in zip(mapping,mapping[1:])): raise ValueError('Nonmonotonic timing')
    def seconds(beat):
        if beat < beats[0] or beat > beats[-1] + .001: raise ValueError('Note outside audio timemap')
        i = min(max(0, bisect.bisect_right(beats, beat)-1), len(beats)-2)
        a,b = mapping[i:i+2]
        return a['tstamp']+(beat-a['qstamp'])/(b['qstamp']-a['qstamp'])*(b['tstamp']-a['tstamp'])
    low, high = data['minpitch']['b12']-2, data['maxpitch']['b12']+2
    length = rational(data['scorelength']); width = length*3+65; height = (high-low+1)*8+36
    y = lambda pitch: 28+(high-pitch)*8
    svg = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" role="img" aria-label="{work} piano roll">']
    for pitch in range(low, high+1):
        color = '#efefef' if pitch%12 in (1,3,6,8,10) else '#fff'
        svg.append(f'<rect x="0" y="{y(pitch)}" width="{width}" height="8" fill="{color}"/>')
        name = ['C','C♯','D','E♭','E','F','F♯','G','A♭','A','B♭','B'][pitch%12]+str(pitch//12-1)
        svg.append(f'<text x="3" y="{y(pitch)+7}" font-size="7" fill="#777">{name}</text>')
    for bar in data['barlines']:
        x = 45+rational(bar['time'])*3
        svg.append(f'<path d="M{x},25 V{height}" stroke="#ccc" stroke-width=".4"/>')
        if 'label' in bar: svg.append(f'<text x="{x+1}" y="19" font-size="7" fill="#777">{html.escape(bar["label"])}</text>')
    svg.append('<g class="staff-lines" stroke="#777" stroke-width=".7">')
    for pitch in [43,47,50,53,57,64,67,71,74,77]:
        if low <= pitch <= high: svg.append(f'<path d="M40,{y(pitch)+4} H{width}"/>')
    svg.append('</g>')
    count=0
    for part in data['partdata']:
        index=part['partindex']; track=data['partcount']-index
        color=['#d34e49','#dfab28','#479d63','#4d8dcc','#9663ad','#b56634'][index%6]
        notes=[n for n in part['notedata'] if n.get('pitch',{}).get('b12',0)>0]
        if not notes: continue
        minimum=min(n['pitch']['b12'] for n in notes); maximum=max(n['pitch']['b12'] for n in notes)
        previous=None
        for note in notes:
            start=rational(note['starttime']); duration=rational(note['duration']); pitch=note['pitch']['b12']
            x=45+start*3; w=duration*3; yy=y(pitch)+1
            if not math.isfinite(start+duration) or duration<=0: raise ValueError('Invalid note duration')
            on,off=seconds(start),seconds(start+duration)
            if not 0<=on<off: raise ValueError('Invalid note timing')
            if previous and abs(previous[0]-start)<.001:
                svg.append(f'<g class="track-{track}"><path class="note-lines" d="M{x},{previous[1]} L{x},{yy+3}" stroke="{color}" stroke-width="1"/></g>')
            flags=(' maxima' if pitch==maximum else '')+(' minima' if pitch==minimum else '')
            svg.append(f'<rect class="track-{track} ont-{on:.6f} offt-{off:.6f}{flags}" x="{x}" y="{yy}" width="{max(.2,w-.3)}" height="6" rx="1" fill="{color}"><title>{html.escape(data["partnames"][index])}: {html.escape(note["pitch"]["name"])} · {on:.2f}s</title></rect>')
            previous=(start+duration,yy+3); count+=1
    svg.append('</svg>')
    if not count: raise ValueError('Empty piano roll')
    if hashlib.sha256(source.read_bytes()).hexdigest()!=source_digest: raise ValueError('Source changed during generation')
    out.mkdir(parents=True,exist_ok=True)
    path=out/f'{work}-piano-roll.svg'
    path.write_text('\n'.join(svg))

    return {'path':str(path.resolve()),'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'source':str(source.resolve()),'work':work,'notes':count,'parts':data['partcount'],'partnames':data['partnames'],'source_sha256':source_digest,'timemap_seconds':mapping[-1]['tstamp'],'proll_seconds':data['scorelengthsec']}


def main():
    import argparse, concurrent.futures
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--scores',type=pathlib.Path,required=True)
    parser.add_argument('--media-report',type=pathlib.Path,action='append',required=True)
    parser.add_argument('--out',type=pathlib.Path,required=True)
    parser.add_argument('--proll',default=PROLL)
    args=parser.parse_args(); candidates={}
    for report in args.media_report:
        for work,row in json.loads(report.read_text())['works'].items():
            candidates.setdefault(work,[]).append(row)
    sources=sorted(args.scores.glob('[A-Z]??/*.krn'))
    ids=[p.name.split('-')[0] for p in sources]
    if len(ids)!=len(set(ids)): raise ValueError('Duplicate source IDs')
    def run(source):
        work=source.name.split('-')[0]
        try:
            digest=hashlib.sha256(source.read_bytes()).hexdigest()
            rows=[r for r in candidates.get(work,[]) if r['status']=='passed' and r['source_sha256']==digest]
            if not rows: raise ValueError('No validated audio with matching source revision')
            row=rows[-1]
            def asset(suffix):
                entry=next(o for o in row['outputs'] if o['file'].endswith(suffix))
                path=pathlib.Path(entry['file'])
                if hashlib.sha256(path.read_bytes()).hexdigest()!=entry['sha256']: raise ValueError('Media changed since validation')
                return path
            audio=asset('.mp3'); timepath=asset('-timemap.json')
            result=build(work,source,json.loads(timepath.read_text()),args.out,args.proll)
            return dict(result,status='validated',audio=str(audio),audio_md5=hashlib.md5(audio.read_bytes()).hexdigest(),audio_sha256=hashlib.sha256(audio.read_bytes()).hexdigest(),timemap=str(timepath),timemap_sha256=hashlib.sha256(timepath.read_bytes()).hexdigest())
        except Exception as e: return {'work':work,'status':'held','reason':str(e)}
    args.out.mkdir(parents=True,exist_ok=True)
    rows=[]
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        for row in pool.map(run,sources):
            rows.append(row)
            if len(rows)%100==0: print(f'{len(rows)}/{len(sources)} processed',flush=True)
    report={'works':rows,'validated':sum(r['status']=='validated' for r in rows),'held':sum(r['status']=='held' for r in rows)}
    (args.out/'report.json').write_text(json.dumps(report,indent=2)+'\n')
    print({k:v for k,v in report.items() if k!='works'},flush=True)
if __name__=='__main__': main()
