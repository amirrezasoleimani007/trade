const fs=require('fs'),vm=require('vm'),assert=require('assert');
const ctx={};vm.createContext(ctx);vm.runInContext(fs.readFileSync('public/trade-engine.js','utf8'),ctx);vm.runInContext(fs.readFileSync('public/economics-view.js','utf8'),ctx);
const E=ctx.TradeEngine,report=[];
const base={qTon:100,buyTon:1e6,sellTon:1.2e6,holding:30,hurdle:0,finLegs:[{method:'cash',share:100}],salesLegs:[{share:100,due:0,markup:0}],limits:{cash:null,cheque:null,lc:null,boe:null},vatRecoveryDay:5000};
function near(a,b,msg){assert(Math.abs(a-b)<=Math.max(1e-6,Math.abs(b)*1e-10),msg+': '+a+' != '+b)}
function run(name,patch,check){const d={...base,...patch},r=E.simulate(d);check(r);near(r.nominal+r.economics.timeValueEffect,r.npv,'NPV bridge');near(r.nominal,r.events.reduce((s,e)=>s+e.econ,0),'cash profit');if(!d.hurdle)near(r.npv,r.nominal,'zero discount');assert(!/NaN|Infinity|undefined/.test(ctx.EconomicsView.render(r)));report.push({name,profit:r.nominal,npv:r.npv,peak:r.peak,margin:r.profitMargin,result:'PASS'});return r;}
run('Cash baseline',{},r=>near(r.nominal,20e6,'cash profit'));
run('High profit',{sellTon:2e6},r=>near(r.nominal,100e6,'high'));
run('Low profit',{sellTon:1000001},r=>near(r.nominal,100,'low'));
run('Loss',{sellTon:900000},r=>{near(r.nominal,-10e6,'loss');assert.equal(r.periodReturn,null)});
run('Small costs',{customCosts:[{name:'small',amount:.01,type:'fixed_toman'}]},r=>near(r.op,.01,'small cost'));
const leg={method:'lc',share:100,due:90,rate:2,costMode:'monthly',fee:1,feeMode:'annual',margin:20};
run('Monthly finance + annual fee',{finLegs:[leg]},r=>{near(r.financeLegs[0].financeMarkup,6e6,'markup');near(r.financeLegs[0].fee,106e6*.01*90/365,'fee');near(r.usage.lc,106e6,'face');});
run('Flat fee',{finLegs:[{...leg,feeMode:'flat'}]},r=>near(r.financeLegs[0].fee,1.06e6,'flat fee'));
run('Heavy finance',{finLegs:[{...leg,rate:15,fee:4}]},r=>assert(r.nominal<0));
run('Financed VAT no rate on VAT',{purchaseVat:10,saleVat:10,finLegs:[{...leg,vatFinanced:true,chargeVat:false}]},r=>{near(r.financeLegs[0].facilityPrincipal,110e6,'facility');near(r.financeLegs[0].rateBase,100e6,'rate base');});
run('Financed VAT rate on VAT',{purchaseVat:10,saleVat:10,finLegs:[{...leg,vatFinanced:true,chargeVat:true}]},r=>near(r.financeLegs[0].rateBase,110e6,'VAT rate'));
run('Prices VAT inclusive',{purchaseVat:10,saleVat:10,buyTon:1.1e6,sellTon:1.32e6,purchasePriceIncludesVat:true,salePriceIncludesVat:true},r=>{near(r.saleNetTotal,120e6,'net sales');near(r.purchaseBase,100e6,'net buy')});
['refund','offset','nonrecoverable'].forEach(mode=>run('VAT credit '+mode,{tradeType:'export',purchaseVat:10,vatCreditMode:mode},r=>near(r.nominal,mode==='nonrecoverable'?10e6:20e6,'VAT credit')));
run('Same day netting',{holding:30,finLegs:[{method:'lc',share:100,due:30}]},r=>near(r.peak,0,'same day'));
run('Blank limit',{},r=>assert(r.cashOK));run('Zero limit',{limits:{cash:0}},r=>assert(!r.cashOK));
run('Mixed 30/40/30',{finLegs:[{method:'cash',share:30},{...leg,share:40},{method:'cheque',share:30,due:60}]},r=>near(r.financeLegs.reduce((s,l)=>s+l.principal,0),70e6,'mixed'));
['delivery','receivable'].forEach(mode=>run('ECL VAT '+mode,{saleVat:10,purchaseVat:10,expectedCreditLoss:10,salesLegs:[{share:100,due:90,markup:0}],vatCollectionMode:mode},r=>near(r.badDebtVatLoss,mode==='delivery'?0:1.2e6,'ECL VAT')));
run('Nonrecoverable custom VAT',{serviceVat:10,customCosts:[{amount:1e6,vat:true,vatRecoverable:false}]},r=>near(r.op,1.1e6,'cost VAT'));
run('Export shrinkage',{tradeType:'export',shrink:10,intFreight:1000},r=>near(r.op,90000,'export quantity'));
run('Zero revenue',{sellTon:0},r=>assert.equal(r.profitMargin,null));
run('Large amounts',{qTon:1e9,buyTon:1e12,sellTon:1.2e12},r=>assert(Number.isFinite(r.npv)));
let seed=113,nonMonotonicSales=0;function rand(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296}
for(let i=0;i<3000;i++){
 const d={...base,qTon:1+rand()*1e5,buyTon:rand()*1e9,sellTon:rand()*1e9,hurdle:i%2?rand()*100:0,holding:Math.floor(rand()*1000),purchaseVat:rand()*20,saleVat:rand()*20,serviceVat:rand()*20,inbound:rand()*1000,expectedCreditLoss:rand()*100,vatCreditMode:['refund','offset','nonrecoverable'][i%3],finLegs:[{...leg,method:['cheque','lc','boe'][i%3],due:Math.floor(rand()*1000),rate:rand()*10,fee:rand()*3,margin:rand()*100,vatFinanced:rand()>.5,chargeVat:rand()>.5}],salesLegs:[{share:100,due:Math.floor(rand()*300),markup:rand()*10}]};
 const r=E.simulate(d);near(r.nominal,r.events.reduce((s,e)=>s+e.cash,0),'random reconcile');if(!d.hurdle)near(r.npv,r.nominal,'random zero discount');assert(Number.isFinite(r.npv));assert(Number.isFinite(r.peak));assert(!/NaN|Infinity|undefined/.test(ctx.EconomicsView.render(r)));const buyUp=E.simulate({...d,buyTon:d.buyTon*1.01});assert(buyUp.npv<=r.npv+Math.max(1,Math.abs(r.npv)*1e-10));const saleUp=E.simulate({...d,sellTon:d.sellTon*1.01});if(saleUp.npv<r.npv-Math.max(1,Math.abs(r.npv)*1e-10)){nonMonotonicSales++;assert(d.expectedCreditLoss>0);assert.notEqual(E.solveBoundary(d,'sellTon','economic').status,'converged')};
}
console.log(JSON.stringify({scenarios:report,randomized:3000,nonMonotonicSales,status:'PASS'},null,2));
