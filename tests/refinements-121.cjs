const fs=require('fs'),vm=require('vm'),assert=require('assert');
require('../trade-engine.js');require('../single-sheet-export.js');
const E=globalThis.TradeEngine,html=fs.readFileSync(require('path').join(__dirname,'../index.html'),'utf8');
const elements={};const el=id=>elements[id]||(elements[id]={value:'',dataset:{},textContent:'',innerHTML:'',classList:{contains:()=>false},querySelectorAll:()=>[]});
const state={funding:'mixed',pathInitialized:true},fundingDetails={cash:{method:'cash'},cheque:{method:'cheque'},lc:{method:'lc'},boe:{method:'boe'}},mixShares={cash:0,cheque:0,lc:0,boe:0};
const ctx=vm.createContext({el,state,fundingDetails,mixShares,Intl,Number,Math,window:{TradeEngine:E},setQuote:(side,v)=>{const [c,b]=v.split('|');el(side+'Currency').value=c;el(side+'PriceBasis').value=b},renderFx:()=>{},currencyFx:()=>1});
for(const name of ['parseNum','value','smartDecimals','fmtSmart','quantityTon','quantityUnitName','pricePerTon','changeQuantityUnitPreserve','changeQuotePreserve','syncFundingInputs','liveSummary','fmt','faDigits','exact','short']){const line=html.split('\n').find(l=>l.startsWith('function '+name+'('));assert(line,name);vm.runInContext(line,ctx)}
for(const unit of ['ton','kg','piece']){el('quantity').value='۱۲۳٫۴۵۶۷۸۹';ctx.changeQuantityUnitPreserve(unit);assert.equal(el('quantity').value,'۱۲۳٫۴۵۶۷۸۹')}
el('purchasePrice').value='۳۸۷۵۰٫۱۲۳۴';ctx.changeQuotePreserve('purchase','RIAL|per_kg');assert.equal(el('purchasePrice').value,'۳۸۷۵۰٫۱۲۳۴');assert.equal(el('purchaseCurrency').value,'RIAL');
el('quantity').value='1234.5';el('quantityUnit').value='kg';el('purchasePrice').value='';el('salePrice').value='';ctx.liveSummary();assert.equal(el('sumWeight').textContent,'۱٫۲۳۴۵ تن');
el('quantity').value='.001';el('quantityUnit').value='kg';ctx.liveSummary();assert(!/^۰ تن$/.test(el('sumWeight').textContent));
const detail=(method,key,value)=>({dataset:{md:method+'|'+key},value:String(value)}),shares=[{dataset:{mix:'cheque'},value:'۱۰۰'}],fields=[detail('cheque','due',90),detail('cheque','rate',2),detail('cheque','costMode','monthly'),detail('cheque','fee',1.5),detail('cheque','feeMode','flat'),detail('cheque','feeBaseMode','facility'),detail('cheque','feeFinanced','false')];
el('fundingMixed').querySelectorAll=selector=>selector==='[data-mix]'?shares:fields;ctx.syncFundingInputs();assert.equal(mixShares.cheque,100);assert.equal(fundingDetails.cheque.fee,1.5);
const base={qTon:100,buyTon:3e7,sellTon:3.3e7,holding:72,hurdle:35,advance:20,salesLegs:[{method:'cash',share:100}],limits:{}};
const leg={...fundingDetails.cheque,share:100},a=E.simulate({...base,finLegs:[leg]}),b=E.simulate({...base,finLegs:[{...leg,share:40},{...leg,share:60}]});
assert(Math.abs(a.finCost-b.finCost)<1e-6);assert.equal(a.financeLegs[0].fee,36000000);
for(const method of ['cheque','lc','boe'])for(const feeMode of ['flat','monthly','annual']){const l={...leg,method,feeMode},one=E.simulate({...base,finLegs:[l]}),split=E.simulate({...base,finLegs:[{...l,share:25},{...l,share:75}]});assert(Math.abs(one.finCost-split.finCost)<1e-5);assert(Math.abs(one.npv-split.npv)<1e-5);}
const cash={...base,advance:0,finLegs:[{method:'cash',share:100}]};
assert(Math.abs(E.simulate(cash).periodReturn-.1)<1e-10);
const loss=E.simulate({...cash,sellTon:2.7e7});assert(Math.abs(loss.periodReturn+.1)<1e-10);assert(Math.abs(loss.profitMargin+1/9)<1e-10);
assert.equal(E.simulate({...base,advance:0,finLegs:[leg]}).periodReturn,null);
const boundary=E.solveBoundary(cash,'buyTon','economic');assert.equal(boundary.status,'converged');assert(Math.abs(E.simulate({...cash,buyTon:boundary.value}).npv)<1e-5);
console.log(JSON.stringify({status:'PASS',checks:['unchanged input on unit changes','weight without prices','tiny weight','mixed purchase synchronization','split fee invariance in 9 contracts','negative return','nonconventional return','economic boundary']}));
