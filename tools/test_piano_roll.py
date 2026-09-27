import importlib.util, json, pathlib, tempfile, unittest
from unittest.mock import patch
import xml.etree.ElementTree as ET
spec=importlib.util.spec_from_file_location('piano',pathlib.Path(__file__).with_name('build-piano-roll.py'))
piano=importlib.util.module_from_spec(spec);spec.loader.exec_module(piano)
class PianoRollTest(unittest.TestCase):
    def render(self,mapping,raw=None):
        data={'minpitch':{'b12':60},'maxpitch':{'b12':60},'scorelength':[8],'scorelengthsec':999,'partcount':1,'partnames':['<Tenor>'],'barlines':[], 'partdata':[{'partindex':0,'notedata':[{'pitch':{'b12':60,'name':'C4'},'starttime':[2],'duration':[4]}]}]}
        with tempfile.TemporaryDirectory() as folder:
            path=pathlib.Path(folder); source=path/'Test.krn';source.write_text('test')
            with patch.object(piano.subprocess,'check_output',return_value=(raw or json.dumps(data)).encode()):
                result=piano.build('Test',source,mapping,path)
            return ET.fromstring(pathlib.Path(result['path']).read_bytes())
    def test_tempo_change_uses_audio_not_proll_seconds(self):
        root=self.render([{'qstamp':0,'tstamp':0},{'qstamp':4,'tstamp':2},{'qstamp':8,'tstamp':6}])
        note=next(n for n in root.iter() if ' ont-' in n.get('class',''))
        self.assertIn('ont-1.000000 offt-4.000000',note.get('class'))
        self.assertIn('<Tenor>',next(iter(note)).text)
    def test_out_of_range_timing_rejected(self):
        with self.assertRaisesRegex(ValueError,'outside audio'):
            self.render([{'qstamp':0,'tstamp':0},{'qstamp':4,'tstamp':2}])
    def test_nonmonotonic_timing_rejected(self):
        with self.assertRaisesRegex(ValueError,'Nonmonotonic'):
            self.render([{'qstamp':0,'tstamp':2},{'qstamp':4,'tstamp':1}])
    def test_upstream_quoted_section_label(self):
        raw='{"sectionlabel":"Agnus (texted \"dona nobis\")", "mensuration":"C|"}'
        parsed=piano.parse_proll_json(raw)
        self.assertEqual(parsed['sectionlabel'],'Agnus (texted "dona nobis")')
        self.assertEqual(parsed['mensuration'],'C|')
    def test_no_notes_rejected(self):
        raw='{"minpitch":{"b12":60},"maxpitch":{"b12":60},"scorelength":[8],"scorelengthsec":nan,"partcount":1,"partnames":["Tenor"],"barlines":[],"partdata":[{"partindex":0,"notedata":[ } ]}]}'
        with self.assertRaisesRegex(ValueError,'Empty piano roll'):
            self.render([{'qstamp':0,'tstamp':0},{'qstamp':8,'tstamp':4}],raw)
if __name__=='__main__':unittest.main()
