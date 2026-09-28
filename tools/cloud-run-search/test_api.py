"""Security boundary tests: no search runs until Siteverify accepts the token."""
import importlib.util, io, json, os, tempfile, unittest
from pathlib import Path
from unittest.mock import patch, Mock
from urllib.parse import urlencode, parse_qs
import turnstile
ROOT=Path(__file__).resolve().parents[2]

class ApiTests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.temp=tempfile.TemporaryDirectory();p=Path(cls.temp.name)
  (p/'index.json').write_bytes((ROOT/'output/search-prototype/index.json').read_bytes())
  (p/'_includes').symlink_to(ROOT/'_includes')
  os.environ['SEARCH_ROOT']=str(p);os.environ['HUMDRUM_BIN']='/Users/benjaminory/humdrum-tools/humextra/bin'
  spec=importlib.util.spec_from_file_location('cloud_api',ROOT/'output/cloud-run-search/app.py');cls.api=importlib.util.module_from_spec(spec);spec.loader.exec_module(cls.api)
 @classmethod
 def tearDownClass(cls):cls.temp.cleanup()
 def request(self,body='',method='POST',path='/api/search',origin='https://www.josqu.in',query='',length=None):
  data=body.encode();status=[]
  def start(code,headers):status.append(code);self.headers=dict(headers)
  env={'REQUEST_METHOD':method,'PATH_INFO':path,'QUERY_STRING':query,'HTTP_ORIGIN':origin,'CONTENT_TYPE':'application/x-www-form-urlencoded','CONTENT_LENGTH':str(len(data) if length is None else length),'wsgi.input':io.BytesIO(data)}
  result=json.loads(b''.join(self.api.application(env,start)))
  return status[0],result
 def valid(self,**changes):return dict(success=True,hostname='www.josqu.in',action='jrp-search',**changes)
 def siteverify(self,result):return io.BytesIO(json.dumps(result).encode())
 def test_valid_search_and_private_post_token(self):
  with patch.dict(os.environ,{'TURNSTILE_SECRET':'test-secret'}),patch.object(turnstile,'urlopen',return_value=self.siteverify(self.valid())) as call:
   status,result=self.request('work=Agr1001a&pitch=c+d+e&cf-turnstile-response=valid-token')
   self.assertEqual(status,'200 OK');self.assertEqual(result['matchcount'],32)
   request=call.call_args.args[0]
   self.assertEqual(request.full_url,'https://challenges.cloudflare.com/turnstile/v0/siteverify')
   self.assertEqual(parse_qs(request.data.decode()),{'secret':['test-secret'],'response':['valid-token']})
 def test_missing_and_duplicate_tokens_never_run_search(self):
  with patch.object(self.api.search,'search') as search,patch.object(turnstile,'urlopen') as verify:
   for body in ['pitch=c','pitch=c&cf-turnstile-response=','pitch=c&cf-turnstile-response=a&cf-turnstile-response=b','pitch=c&cf-turnstile-response='+'a'*2049]:
    self.assertEqual(self.request(body)[0],'403 Forbidden')
   search.assert_not_called();verify.assert_not_called()
 def test_rejected_expired_wrong_host_and_wrong_action(self):
  for result in [{'success':False,'error-codes':['timeout-or-duplicate']},{'success':True,'hostname':'evil.example','action':'jrp-search'},{'success':True,'hostname':'www.josqu.in','action':'contact'},{}]:
   with patch.dict(os.environ,{'TURNSTILE_SECRET':'test-secret'}),patch.object(turnstile,'urlopen',return_value=self.siteverify(result)),patch.object(self.api.search,'search') as search:
    self.assertEqual(self.request('pitch=c&cf-turnstile-response=invalid')[0],'403 Forbidden');search.assert_not_called()
    self.assertEqual(self.headers['Access-Control-Allow-Origin'],'https://www.josqu.in')
 def test_replay_calls_siteverify_again(self):
  with patch.dict(os.environ,{'TURNSTILE_SECRET':'test-secret'}),patch.object(turnstile,'urlopen',side_effect=[self.siteverify(self.valid()),self.siteverify({'success':False})]) as verify,patch.object(self.api.search,'search',return_value={}) as search:
   body='pitch=c&cf-turnstile-response=same-token'
   self.assertEqual(self.request(body)[0],'200 OK');self.assertEqual(self.request(body)[0],'403 Forbidden')
   self.assertEqual(search.call_count,1);self.assertEqual(verify.call_count,2)
 def test_configuration_and_network_fail_closed(self):
  with patch.dict(os.environ,{'TURNSTILE_SECRET':''}),patch.object(self.api.search,'search') as search:
   self.assertEqual(self.request('pitch=c&cf-turnstile-response=valid')[0],'503 Service Unavailable');search.assert_not_called()
  with patch.dict(os.environ,{'TURNSTILE_SECRET':'test-secret'}),patch.object(turnstile,'urlopen',side_effect=TimeoutError),patch.object(self.api.search,'search') as search:
   self.assertEqual(self.request('pitch=c&cf-turnstile-response=valid')[0],'503 Service Unavailable');search.assert_not_called()
 def test_no_get_bypass_and_request_bounds(self):
  with patch.object(self.api.search,'search') as search:
   self.assertEqual(self.request(method='GET',query='pitch=c')[0],'405 Method Not Allowed')
   self.assertEqual(self.request('pitch=c',length=9000)[0],'400 Bad Request')
   self.assertEqual(self.request('pitch=c&cf-turnstile-response=a',query='pitch=d')[0],'400 Bad Request')
   search.assert_not_called()
 def test_health_cors_and_static_files(self):
  self.assertEqual(self.request(method='GET',path='/health')[1]['scores'],1382)
  self.assertEqual(self.request(method='OPTIONS')[0],'200 OK')
  self.assertEqual(self.headers['Access-Control-Allow-Methods'],'POST, OPTIONS')
  self.request(method='GET',path='/health',origin='https://evil.example');self.assertNotIn('Access-Control-Allow-Origin',self.headers)
  self.assertEqual(self.request(method='GET',path='/source-manifest.json')[0],'404 Not Found')

if __name__=='__main__':unittest.main()
