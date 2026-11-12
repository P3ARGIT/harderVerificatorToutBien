"""Pure numerical acceptance tests, no microphone/GUI/model required."""
import ast, math, pathlib, unittest
import numpy as np
source = ast.parse(pathlib.Path(__file__).with_name('app.py').read_text())
ns = {'np': np, 'math': math, 'RATE': 48000}
exec(compile(ast.Module(body=[n for n in source.body if isinstance(n, ast.FunctionDef) and n.name in ('dbfs','verdict')], type_ignores=[]), 'logic', 'exec'), ns)
class Tests(unittest.TestCase):
    def test_gate(self):
        result={'text':'harder','result':[{'start':1,'end':1.5,'conf':.95}]}
        x=np.zeros(144000); x[48000:72000]=.1
        self.assertFalse(ns['verdict'](result,x,100)[0]) # exactly 80
        self.assertTrue(ns['verdict'](result,x,101)[0])
        x[:1000]=.9 # loud noise outside the word must not help
        self.assertFalse(ns['verdict'](result,x,99)[0])
        self.assertFalse(ns['verdict']({'text':'water'},x,120)[0])
        result['result'][0]['conf']=.5
        self.assertFalse(ns['verdict'](result,x,120)[0])
        result['result'][0]['conf']=.95; x[50000]=1
        self.assertFalse(ns['verdict'](result,x,120)[0])
if __name__=='__main__': unittest.main()
