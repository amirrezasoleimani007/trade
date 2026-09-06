"""Independently evaluate the exported audit workbook's supported Excel formulas."""
import sys, math, json
import openpyxl
from openpyxl.formula.tokenizer import Tokenizer
from openpyxl.utils.cell import range_boundaries
w=openpyxl.load_workbook(sys.argv[1]); cached=openpyxl.load_workbook(sys.argv[1],data_only=True)
memo={}
def flat(x):
    return [v for a in x for v in (a if isinstance(a,list) else [a])]
def ref(s,v):
    if '!' in v: s,v=v.rsplit('!',1);s=s.strip("'")
    v=v.replace('$','')
    if ':' in v:
        c1,r1,c2,r2=range_boundaries(v)
        return [cell(s,w[s].cell(r,c).coordinate) for r in range(r1,r2+1) for c in range(c1,c2+1)]
    return cell(s,v)
def cell(s,a):
    if (s,a) in memo:return memo[s,a]
    c=w[s][a];v=c.value
    if c.data_type=='f':v=evaluate(s,v)
    elif v is None:v=0
    memo[s,a]=v;return v
def evaluate(s,f):
    ts=[t for t in Tokenizer(f).items if t.type!='WHITE-SPACE'];i=0
    def parse(minp=0):
        nonlocal i
        t=ts[i];i+=1
        if t.type=='OPERATOR-PREFIX':v=('unary',t.value,parse(5))
        elif t.type=='PAREN' and t.subtype=='OPEN':v=parse();i+=1
        elif t.type=='FUNC' and t.subtype=='OPEN':
            args=[]
            while ts[i].subtype!='CLOSE':
                args.append(parse())
                if ts[i].type=='SEP':i+=1
                else:break
            i+=1;v=('func',t.value[:-1],args)
        elif t.subtype=='NUMBER':v=('value',float(t.value))
        elif t.subtype=='TEXT':v=('value',t.value[1:-1].replace('""','"'))
        elif t.subtype=='RANGE':v=('ref',t.value)
        else:raise ValueError((t.type,t.subtype,t.value))
        ops={'=':1,'<=':1,'>=':1,'<':1,'>':1,'+':2,'-':2,'*':3,'/':3,'^':4}
        while i<len(ts) and ts[i].type=='OPERATOR-INFIX' and ops.get(ts[i].value,0)>=minp:
            op=ts[i].value;p=ops[op];i+=1;v=('op',op,v,parse(p+1))
        return v
    def run(t):
        kind=t[0]
        if kind=='value':return t[1]
        if kind=='ref':return ref(s,t[1])
        if kind=='unary':return -run(t[2]) if t[1]=='-' else run(t[2])
        if kind=='op':
            op=t[1];a,b=run(t[2]),run(t[3])
            return {'+':lambda:a+b,'-':lambda:a-b,'*':lambda:a*b,'/':lambda:a/b,'^':lambda:a**b,'=':lambda:a==b,'<=':lambda:a<=b,'>=':lambda:a>=b,'<':lambda:a<b,'>':lambda:a>b}[op]()
        name=t[1]
        if name=='IF':return run(t[2][1] if run(t[2][0]) else t[2][2])
        if name=='IFERROR':
            try:return run(t[2][0])
            except (ValueError,ZeroDivisionError,TypeError,OverflowError):return run(t[2][1])
        args=[run(x) for x in t[2]];nums=[x for x in flat(args) if isinstance(x,(int,float))]
        if name=='ISNUMBER':return isinstance(args[0],(int,float))
        if name=='SUM':return sum(nums)
        if name=='MAX':return max(nums) if nums else 0
        if name=='MIN':return min(nums) if nums else 0
        if name=='COUNT':return len(nums)
        if name=='ABS':return abs(args[0])
        if name=='COUNTIF':return sum(x==args[1] for x in args[0])
        if name=='SUMIF':return sum(b for a,b in zip(args[0],args[2]) if a==args[1])
        if name=='MATCH':return args[1].index(args[0])+1
        if name=='INDEX':return args[0][int(args[1])-1]
        raise ValueError(name)
    return run(parse())

count=0
for s in w:
    for row in s:
        for c in row:
            if c.data_type!='f':continue
            actual=cell(s.title,c.coordinate);expected=cached[s.title][c.coordinate].value
            if isinstance(actual,(int,float)) and not isinstance(actual,bool):
                assert math.isclose(actual,expected,rel_tol=1e-10,abs_tol=1e-5),(s.title,c.coordinate,actual,expected)
            else:assert actual==(expected if expected is not None else ''),(s.title,c.coordinate,actual,expected)
            count+=1
print(json.dumps({'status':'PASS','sheets':len(w.sheetnames),'formulas_independently_evaluated':count}))
