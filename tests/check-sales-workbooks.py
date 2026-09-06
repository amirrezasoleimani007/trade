"""Reproduce one-sheet export and independent formula checks for all sales scenarios."""
import subprocess,os,json
from pathlib import Path
root=Path(__file__).resolve().parents[1]
run=lambda args,**kwargs:subprocess.run(args,cwd=root,text=True,capture_output=True,check=True,**kwargs)
scenarios=json.loads(run(['node','tests/sales-112.cjs']).stdout)['scenarios']
results=[]
for i,s in enumerate(scenarios):
    prefix=f'/tmp/audit112/{i}'
    run(['node','tests/export-v11.cjs',prefix+'.xlsx'],env={**os.environ,'AUDIT_SCENARIO':prefix+'.json'})
    result=json.loads(run(['python','tests/audit-workbook-v11.py',prefix+'.xlsx']).stdout)
    assert result['sheets']==1
    results.append({'scenario':s['name'],**result})
print(json.dumps({'status':'PASS','scenarios':len(results),'formulas':sum(r['formulas_independently_evaluated'] for r in results),'results':results},indent=2))
