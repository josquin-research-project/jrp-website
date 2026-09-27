"""Run against the prepared local context and existing local search index."""
import importlib.util, json, os, tempfile, unittest
from pathlib import Path
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
 def request(self,path,query='',method='GET',origin=''):
  status=[]
  def start(code,headers):status.append(code);self.headers=dict(headers)
  body=b''.join(self.api.application({'REQUEST_METHOD':method,'PATH_INFO':path,'QUERY_STRING':query,'HTTP_ORIGIN':origin},start))
  return status[0],json.loads(body)
 def test_health(self):
  status,r=self.request('/health');self.assertEqual(status,'200 OK');self.assertEqual(r['scores'],1382)
 def test_search(self):
  status,r=self.request('/api/search','work=Agr1001a&pitch=c+d+e');self.assertEqual(status,'200 OK');self.assertEqual(r['matchcount'],32)
 def test_repeated_or_unsupported(self):
  for q in ('pitch=c&pitch=d','pitch=c+and+d','pitch=c&shell=ls'):
   self.assertEqual(self.request('/api/search',q)[0],'400 Bad Request')
 def test_no_static_files_or_posts(self):
  self.assertEqual(self.request('/source-manifest.json')[0],'404 Not Found')
  self.assertEqual(self.request('/api/search','pitch=c','POST')[0],'405 Method Not Allowed')
 def test_browser_origins_and_error_responses(self):
  self.request('/api/search','pitch=c+and+d',origin='https://www.josqu.in')
  self.assertEqual(self.headers.get('Access-Control-Allow-Origin'),'https://www.josqu.in')
  self.request('/health',origin='https://unrelated.example')
  self.assertNotIn('Access-Control-Allow-Origin',self.headers)
if __name__=='__main__':unittest.main()
