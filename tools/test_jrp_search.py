import importlib.util,unittest,tempfile
from pathlib import Path
s=importlib.util.spec_from_file_location('search',Path(__file__).with_name('jrp-search-local.py'));m=importlib.util.module_from_spec(s);s.loader.exec_module(m)
class SearchTests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):cls.engine=m.Engine(m.ROOT/'output/search-prototype/index.json')
 def test_pitch_locations(self):
  r=self.engine.search({'work':'Agr1001a','pitch':'c d e'})
  self.assertEqual(len(r['locations']),1);self.assertGreater(r['matchcount'],0)
  first=r['locations'][0]['loc'][0]['loc'][0];self.assertIn('L141C1',first);self.assertIn('=12B3',first)
  source=Path(next(x['source'] for x in self.engine.rows if x['id']=='Agr1001a')).read_text().splitlines()
  self.assertIn('c',source[140].split('\t')[0].lower())
 def test_tandem_is_subset(self):
  p=self.engine.search({'work':'Agr1001a','pitch':'c c'});t=self.engine.search({'work':'Agr1001a','pitch':'c c','interval':'8'})
  self.assertGreater(t['matchcount'],0);self.assertLess(t['matchcount'],p['matchcount'])
 def test_scope_and_no_matches(self):
  r=self.engine.search({'work':'Agr1001','interval':'+2 +2','rhythm':'224'})
  self.assertGreater(r['matchcount'],0);self.assertTrue(all(x['id'].startswith('Agr1001') for x in r['locations']))
  self.assertEqual(self.engine.search({'work':'Agr1001a','pitch':'c'*100})['matchcount'],0)
 def test_reject_unsupported_input(self):
  for q in [{'pitch':'c and d'},{'pitch':'$(whoami)'},{}]:
   with self.assertRaises(ValueError):m.query_args(q)
 def test_precomputed_locations_match_original_converter(self):
  with tempfile.TemporaryDirectory() as directory:
   root=Path(directory);(root/'Agr').mkdir()
   row=next(r for r in self.engine.rows if r['id']=='Agr1001a')
   source=Path(row['source']);(root/'Agr'/source.name).write_bytes(source.read_bytes())
   m.build(root,root/'index.json');cached=m.Engine(root/'index.json')
   self.assertIn('positions',cached.rows[0])
   for query in [{'pitch':'c d e'},{'pitch':'c c','interval':'8'},{'rhythm':'224'},{'pitch':'c'*100}]:
    query['work']='Agr1001a'
    self.assertEqual(cached.search(query),self.engine.search(query))
if __name__=='__main__':unittest.main()
