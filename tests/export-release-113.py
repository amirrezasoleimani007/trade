import subprocess,os,json,pathlib
out=pathlib.Path('/tmp/release113');reports=[]
for i in [0,1,3,9,10,12,15,20,21,26,30,31,32,33,34]:
 target=out/f'export-{i}.xlsx'
 env={**os.environ,'AUDIT_SCENARIO':str(out/f'{i}.json')}
 engine=json.loads(subprocess.check_output(['node','tests/export-v11.cjs',str(target)],env=env,text=True))
 result=json.loads(subprocess.check_output(['python','tests/audit-workbook-v11.py',str(target)],text=True))
 reports.append({'scenario':i,**result,'engine':engine})
out.joinpath('workbooks.json').write_text(json.dumps(reports,indent=2))
print(json.dumps({'status':'PASS','exports':len(reports),'formulas':sum(r['formulas_independently_evaluated'] for r in reports)}))
