"""Restricted WSGI API for the Cloud Run search pilot (no static file serving)."""
import importlib.util,json,os,subprocess
from pathlib import Path
from urllib.parse import parse_qs
from turnstile import verify, VerificationFailed, VerificationUnavailable
spec=importlib.util.spec_from_file_location('engine',Path(__file__).with_name('engine.py'))
engine=importlib.util.module_from_spec(spec);spec.loader.exec_module(engine)
engine.ROOT=Path(os.environ.get('SEARCH_ROOT','/app'))
engine.BIN=Path(os.environ.get('HUMDRUM_BIN','/usr/local/bin'))
search=engine.Engine(engine.ROOT/'index.json')
if any('error' in r for r in search.rows):raise RuntimeError('Incomplete search index')
ALLOWED={'a','pitch','interval','rhythm','work','composer','genre','voice'}
ORIGINS={'https://www.josqu.in','https://josqu.in','https://josquin.stanford.edu','http://127.0.0.1:4085'}
def application(env,start):
    status='200 OK'
    try:
        if env.get('PATH_INFO')=='/health' and env.get('REQUEST_METHOD')=='GET':result={'status':'ok','scores':len(search.rows)}
        elif env.get('PATH_INFO') not in ('/api/search','/'):status='404 Not Found';result={'error':'Not found'}
        elif env.get('PATH_INFO')=='/' and env.get('REQUEST_METHOD')=='GET':result={'service':'JRP search pilot','provisional':True,'endpoint':'/api/search'}
        elif env.get('REQUEST_METHOD')=='OPTIONS' and env.get('HTTP_ORIGIN') in ORIGINS:
            result={}
        elif env.get('REQUEST_METHOD')!='POST':status='405 Method Not Allowed';result={'error':'Reload the page to use verified search.'}
        else:
            if env.get('CONTENT_TYPE','').split(';')[0]!='application/x-www-form-urlencoded':raise ValueError('Unsupported request format')
            length=int(env.get('CONTENT_LENGTH') or 0)
            if length<1 or length>8192:raise ValueError('Invalid request size')
            if env.get('QUERY_STRING'):raise ValueError('Send search parameters in the request body')
            raw=env['wsgi.input'].read(length).decode('utf-8')
            values=parse_qs(raw,max_num_fields=10,keep_blank_values=True)
            tokens=values.pop('cf-turnstile-response',[])
            if len(tokens)!=1:raise VerificationFailed('Please complete the verification and try again.')
            if any(k not in ALLOWED or len(v)!=1 for k,v in values.items()):raise ValueError('Unsupported or repeated query parameter')
            q={k:v[0] for k,v in values.items()}
            if q.get('a','search') not in ('search','searchwork'):raise ValueError('Unsupported action')
            if any(len(v)>160 for v in q.values()):raise ValueError('Query field too long')
            engine.query_args(q)
            verify(tokens[0])
            result=search.search(q)
    except VerificationFailed as e:status='403 Forbidden';result={'error':str(e)}
    except VerificationUnavailable as e:status='503 Service Unavailable';result={'error':str(e)}
    except ValueError as e:status='400 Bad Request';result={'error':str(e)}
    except subprocess.TimeoutExpired:status='504 Gateway Timeout';result={'error':'Search exceeded its time limit; narrow the query.'}
    except Exception:status='500 Internal Server Error';result={'error':'Search could not be completed.'}
    body=json.dumps(result).encode()
    headers=[('Content-Type','application/json'),('Content-Length',str(len(body))),('Cache-Control','no-store'),('X-Content-Type-Options','nosniff'),('Vary','Origin')]
    origin=env.get('HTTP_ORIGIN','')
    if origin in ORIGINS:
        headers.extend([('Access-Control-Allow-Origin',origin),('Access-Control-Allow-Methods','POST, OPTIONS'),('Access-Control-Allow-Headers','Content-Type')])
    start(status,headers)
    return [body]
