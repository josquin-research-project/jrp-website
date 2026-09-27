"""Local JRP search with original Humdrum tools. Never deploy this development server."""
import argparse, concurrent.futures, functools, hashlib, json, re, subprocess
from pathlib import Path
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse, parse_qs
ROOT=Path(__file__).resolve().parents[1]
BIN=Path('/Users/benjaminory/humdrum-tools/humextra/bin')

def run(name,args=(),data=None):
    p=subprocess.run([str(BIN/name),*map(str,args)],input=data,capture_output=True,timeout=45)
    if p.returncode:raise ValueError(name+' failed: '+p.stderr.decode(errors='replace')[:200])
    return p.stdout

def query_args(q):
    args=[]
    for key,flag in [('pitch','-D'),('interval','-I'),('rhythm','-u')]:
        value=q.get(key,'').strip()
        if not value:continue
        if len(value)>160 or re.search(r'\band\b',value,re.I):raise ValueError('Use one pattern per field for this prototype; AND queries are not implemented yet.')
        if not re.fullmatch(r'[a-gA-GnNrRmMdDbBlLwWhHqQeE0-9+*#.\s-]+',value):raise ValueError('Unsupported query character')
        if key=='interval':value=re.sub(r'(?<=[2-9])(?=[1-9])',' ',value)
        if key=='rhythm':
            value=' '.join(value.split())
            value=' '.join(value.replace(' ','')).replace(' .','d')
            for a,b in [('e','8'),('q','4'),('h','2'),('w','1'),('b','B'),('l','L')]:value=re.sub(a,b,value,flags=re.I)
        args.extend([flag,value])
    if not args:raise ValueError('Enter a pitch, rhythm, or interval pattern.')
    return args

def build(scores,out):
    paths=sorted(scores.glob('[A-Z]??/*.krn'))
    def one(p):
        digest=hashlib.sha256(p.read_bytes()).hexdigest()
        try:
            index=run('tindex',['--poly','--all','--rest',p]).decode()
            if hashlib.sha256(p.read_bytes()).hexdigest()!=digest:raise ValueError('Source changed while indexing')
            # Resolve every indexed note once during the build, not once per search.
            starts=run('themax',['--startloc','-D','.'],index.encode())
            located=run('theloc',['--all','--path',p.parent],starts).decode()
            positions={}
            for line in located.splitlines():
                if '\t' not in line or '::' not in line:continue
                tag,values=line.split('\t',1)
                points=values.split()
                if any(not re.search(r'^\d+L\d+.*=\d+.*B',point) for point in points):raise ValueError('Unresolved note location')
                positions[tag.rsplit('::',1)[1]]={re.match(r'\d+',point)[0]:point for point in points}
            if not positions:raise ValueError('No note locations')
            return {'id':p.name.split('-')[0],'source':str(p),'sha256':digest,'index':index,'positions':positions}
        except Exception as e:return {'id':p.name.split('-')[0],'error':str(e)}
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:rows=list(pool.map(one,paths))
    ids=[r['id'] for r in rows]
    if len(ids)!=len(set(ids)):raise ValueError('Duplicate score IDs')
    out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(rows))
    print(json.dumps({'indexed':sum('index' in r for r in rows),'failures':[r for r in rows if 'error' in r]}),flush=True)

class Engine:
    def __init__(self,index):
        self.rows=json.loads(index.read_text());self.meta={w['WORK_ID']:w for w in json.loads((ROOT/'_includes/metadata/works.json').read_text())}
    def search(self,q):
        args=query_args(q);selected=[]
        for r in self.rows:
            if 'index' not in r:continue
            m=self.meta.get(r['id'],{})
            work=q.get('work','')
            if work and r['id']!=work and not (re.fullmatch(r'[A-Z][a-z]{2}\d{4}(?:\.\d+)*',work) and re.fullmatch(re.escape(work)+r'[a-z]+',r['id'])):continue
            if q.get('composer') and q['composer'] not in re.split(r'[;,\s]+',m.get('COMPOSER_ID','')):continue
            if q.get('genre') and q['genre'].lower()!=m.get('Genre','').lower():continue
            if q.get('voice') and q['voice']!=m.get('Voices'):continue
            if hashlib.sha256(Path(r['source']).read_bytes()).hexdigest()!=r['sha256']:raise ValueError('Score changed since indexing: '+r['id']+'. Rebuild the search index.')
            selected.append(r)
        # tindex --all includes many unused analyses. themax scans them on each
        # match; preserve field order but pass only the requested feature streams.
        markers={marker for key,marker in [('pitch','J'),('interval','}'),('rhythm',';')] if q.get(key,'').strip()}
        lines=[]
        for row in selected:
            for line in row['index'].splitlines():
                if '\t' not in line:continue
                fields=line.split('\t')
                lines.append('\t'.join([fields[0]]+[f for f in fields[1:] if f and f[0] in markers]))
        raw=run('themax',['--startloc',*args],('\n'.join(lines)+'\n').encode()) if selected else b''
        byname={Path(r['source']).name:r for r in selected};grouped={}
        for line in raw.decode().splitlines():
            if '\t' not in line or '::' not in line:continue
            tag,points=line.split('\t',1);filename,part=tag.rsplit('::',1)
            row=byname.get(Path(filename).name)
            if row:grouped.setdefault(row['id'],[]).append(line)
        locations=[]
        byid={r['id']:r for r in selected}
        for work,lines in sorted(grouped.items()):
            row=byid[work]
            if 'positions' in row:
                parts=[]
                for line in lines:
                    tag,values=line.split('\t',1);part=tag.rsplit('::',1)[1]
                    points=[row['positions'][part][n] for n in values.split()]
                    parts.append({'ipart':int(part),'loc':points})
                locations.append({'id':work,'count':sum(len(p['loc']) for p in parts),'loc':parts})
                continue
            source=Path(byid[work]['source'])
            located=run('theloc',['--all','--path',source.parent],('\n'.join(lines)+'\n').encode()).decode()
            parts=[]
            for line in located.splitlines():
                if '\t' not in line:continue
                tag,values=line.split('\t',1);part=tag.rsplit('::',1)[1]
                points=values.split()
                if any(not re.search(r'=\d+.*B',p) for p in points):raise ValueError('Could not resolve match measures for '+work)
                parts.append({'ipart':int(part),'loc':points})
            locations.append({'id':work,'count':sum(len(p['loc']) for p in parts),'loc':parts})
        return {'matchcount':sum(r['count'] for r in locations),'locations':locations,'provisional':True}

INJECT='''<script>
document.addEventListener('DOMContentLoaded',()=>{
let b=document.createElement('div');b.style='background:#fff1c7;padding:10px;text-align:center';b.textContent='Local search preview · original Humdrum engine · legacy equivalence unverified · highlighted PDFs and AND queries not yet supported';document.body.prepend(b);
if(typeof Handlebars!=='undefined'){
Handlebars.registerHelper('sectiontitle',id=>{let w=WORKS.find(w=>w.WORK_ID===id);return Handlebars.escapeExpression(w?.Subtitle||w?.Title||id);});
Handlebars.registerHelper('matchscore',id=>'<a target="_blank" href="'+getBestPdfUrl(id,'no_edit')+'">PDF score</a>');
Handlebars.registerHelper('matchlocations',entry=>entry.count+' '+printLocationThumbnail(entry));
}
});
</script>'''
class Handler(SimpleHTTPRequestHandler):
    def do_GET(self):
        parsed=urlparse(self.path)
        if parsed.path=='/api/search':
            try:
                q={k:v[0] for k,v in parse_qs(parsed.query).items()}
                if q.get('a') not in ('search','searchwork'):raise ValueError('This legacy action is not implemented in the local prototype')
                result=self.server.engine.search(q);status=200
            except Exception as e:result={'error':str(e)};status=400
            body=json.dumps(result).encode();self.send_response(status);self.send_header('Content-Type','application/json');self.send_header('Content-Length',str(len(body)));self.end_headers();self.wfile.write(body);return
        path=Path(self.translate_path(parsed.path))
        if path.is_dir():path=path/'index.html'
        if path.suffix=='.html' and path.is_file():
            body=path.read_text().replace('JOSQUIN_LEGACY.replace(/\\/+$/, "") + "/cgi-bin/jrp"','"/api/search"')
            # Improve the existing work-search error handling only in this local served copy.
            body=body.replace('if (this.status !== 200) {\n\t\t\treturn;', 'if (this.status !== 200) {\n document.body.style.cursor="default"; document.getElementById("work-search-results").textContent="Search unavailable: "+JSON.parse(this.responseText).error;\n\t\t\treturn;')
            body=body.replace('</body>',INJECT+'</body>').encode();self.send_response(200);self.send_header('Content-Type','text/html; charset=utf-8');self.send_header('Content-Length',str(len(body)));self.end_headers();self.wfile.write(body);return
        super().do_GET()

def main():
    p=argparse.ArgumentParser();p.add_argument('--build',action='store_true');p.add_argument('--scores',type=Path,default=Path('/Users/benjaminory/jrp-scores'));p.add_argument('--index',type=Path,default=ROOT/'output/search-prototype/index.json');p.add_argument('--site',type=Path,default=Path('/private/tmp/jrp-piano-roll-site'));p.add_argument('--port',type=int,default=4084);a=p.parse_args()
    if a.build:build(a.scores,a.index);return
    if not (a.site/'search/index.html').exists():raise SystemExit('Build the Jekyll site first and supply --site')
    server=ThreadingHTTPServer(('127.0.0.1',a.port),functools.partial(Handler,directory=str(a.site)));server.engine=Engine(a.index)
    print(f'Local JRP search: http://127.0.0.1:{a.port}/search/',flush=True);server.serve_forever()
if __name__=='__main__':main()
