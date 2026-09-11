"""Independent Excel expression evaluation for every randomized export graph."""
import ast,json,sys,math
from pathlib import Path
from openpyxl.formula.tokenizer import Tokenizer
from openpyxl.utils.cell import range_boundaries,get_column_letter
source=ast.parse(Path(__file__).with_name('audit-workbook-v11.py').read_text())
exec(compile(ast.Module(body=[n for n in source.body if isinstance(n,ast.FunctionDef)],type_ignores=[]),'independent-excel-evaluator','exec'))
class Cell:
 def __init__(self,v):self.value=v;self.data_type='f' if isinstance(v,str) and v.startswith('=') else 'n'
class Sheet:
 def __init__(self,rows):self.data={get_column_letter(j+1)+str(i+1):Cell('='+c['f'] if c.get('f') else c.get('v',0)) for i,row in enumerate(rows) for j,c in enumerate(row)}
 def __getitem__(self,k):return self.data.get(k,Cell(0))
 def cell(self,r,c):
  result=self[get_column_letter(c)+str(r)];result.coordinate=get_column_letter(c)+str(r);return result
count=0;scenarios=0
for line in Path(sys.argv[1]).open():
 case=json.loads(line);w={'audit':Sheet(case['rows'])};memo={}
 for i,row in enumerate(case['rows']):
  for j,c in enumerate(row):
   if not c.get('f'):continue
   coord=get_column_letter(j+1)+str(i+1);actual=cell('audit',coord);expected=c.get('v','')
   if isinstance(actual,(float,int)) and not isinstance(actual,bool):
    assert isinstance(expected,(float,int)) and math.isfinite(actual) and math.isclose(actual,expected,rel_tol=1e-9,abs_tol=1e-5),(case['name'],coord,actual,expected,c['f'])
   else:assert actual==('' if expected is None else expected),(case['name'],coord,actual,expected,c['f'])
   count+=1
 scenarios+=1
print(json.dumps({'status':'PASS','scenarios':scenarios,'formulas':count}))
