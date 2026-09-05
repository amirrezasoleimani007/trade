/* Atieh v11 — contractual scenario model; no statutory tax assumptions. */
(function(root){
'use strict';
const pct=x=>Number(x||0)/100;
const sum=xs=>xs.reduce((a,b)=>a+b,0);
function normalize(input){
 const d=JSON.parse(JSON.stringify(input));
 const keys=['startDay','qTon','buyTon','sellTon','holding','advance','purchaseVat','saleVat','serviceVat','hurdle','safety','shrink','expectedCreditLoss','inbound','storage','outbound','vatUse','vatSettle','intFreight','insurancePct','customsPct','transferPct','salePrepayPct','salePrepayDays','foreignFreightDay','foreignCustomsDay','foreignVatDay'];
 keys.forEach(k=>{d[k]=d[k]==null||d[k]===''?0:Number(d[k]);if(!Number.isFinite(d[k])||d[k]<0)throw Error('ورودی نامعتبر: '+k)});
 ['advance','purchaseVat','saleVat','serviceVat','expectedCreditLoss','salePrepayPct','insurancePct','transferPct','safety'].forEach(k=>{if(d[k]>100)throw Error('درصد خارج از محدوده: '+k)});
 if(d.shrink>=100)throw Error('افت باید کمتر از ۱۰۰٪ باشد.');
 d.buyFx=d.buyFx==null?1:d.buyFx;d.sellFx=d.sellFx==null?1:d.sellFx;
 d.finLegs=d.finLegs||[{method:'cash',share:100}];d.salesLegs=d.salesLegs||[{share:100,due:0,markup:0}];d.customCosts=d.customCosts||[];
 [d.finLegs,d.salesLegs].forEach(legs=>{if(Math.abs(sum(legs.map(l=>Number(l.share)))-100)>1e-6)throw Error('جمع سهم روش‌ها باید ۱۰۰٪ باشد.');legs.forEach(l=>{['share','due','rate','fee','margin'].forEach(k=>{l[k]=Number(l[k]||0);if(!Number.isFinite(l[k])||l[k]<0)throw Error('شرایط ابزار مالی نامعتبر است.');});if(l.margin>100||l.share>100)throw Error('درصد ابزار نامعتبر است.');if(l.markup!=null&&(!Number.isFinite(l.markup)||l.markup<=-100))throw Error('اضافه‌قیمت فروش نامعتبر است.');});});
 d.limits=d.limits||{};Object.keys(d.limits).forEach(k=>{if(d.limits[k]!=null&&(!Number.isFinite(d.limits[k])||d.limits[k]<0))throw Error('سقف منابع نامعتبر است.');});
 d.vatCreditMode=d.vatCreditMode||'offset';d.vatCollectionMode=d.vatCollectionMode||'receivable';
 d.vatSettlementDay=d.vatSettlementDay==null?d.holding+d.vatSettle:Number(d.vatSettlementDay);
 d.vatRecoveryDay=d.vatRecoveryDay==null?d.holding+d.vatUse:Number(d.vatRecoveryDay);
 d.vatCollectionDay=Number(d.vatCollectionDay||0);
 [d.vatSettlementDay,d.vatRecoveryDay,d.vatCollectionDay].forEach(v=>{if(!Number.isFinite(v)||v<0)throw Error('روز VAT نامعتبر است.');});
 return d;
}
function financingLeg(p,v,l){
 const financedVAT=l.vatFinanced?v:0,facilityPrincipal=p+financedVAT,rateBase=p+(l.chargeVat?financedVAT:0);
 const financeMarkup=rateBase*pct(l.rate)*(l.costMode==='flat'?1:l.costMode==='annual'?l.due/365:l.due/30);
 const feeBase=facilityPrincipal+financeMarkup,feeMode=l.feeMode||'annual',fee=feeBase*pct(l.fee)*(feeMode==='flat'?1:l.due/365);
 const financedFee=l.feeFinanced?fee:0,faceValue=facilityPrincipal+financeMarkup+financedFee,marginBase=facilityPrincipal,marginAmount=marginBase*pct(l.margin);
 return {method:l.method,share:l.share,days:l.due,principal:p,financedVAT,facilityPrincipal,rateBase,rate:l.rate,rateMode:l.costMode||'monthly',financeMarkup,feeBase,feeRate:l.fee,feeMode,fee,financedFee,faceValue,marginBase,marginRate:l.margin,marginAmount,cashAtInception:v-financedVAT+fee-financedFee+marginAmount,amountAtMaturity:faceValue};
}
function dailyProfile(events,start){
 const map=new Map();events.filter(e=>e.affects).forEach(e=>{let row=map.get(e.day);if(!row){row={day:e.day,cash:0,inflow:0,outflow:0,labels:[]};map.set(e.day,row)}row.cash+=e.cash;row.inflow+=Math.max(0,e.cash);row.outflow+=Math.min(0,e.cash);row.labels.push(e.label)});
 const daily=[...map.values()].sort((a,b)=>a.day-b.day);let bal=0,peak=0,peakDay=start,cap=0,prev=start,firstNeg=null,recovery=null,initial=0;
 const tolerance=Math.max(1e-7,sum(events.map(e=>Math.abs(e.cash)))*1e-12);
 daily.forEach(row=>{cap+=Math.max(0,-bal)*(row.day-prev);bal+=row.cash;if(Math.abs(bal)<tolerance)bal=0;row.bal=bal;row.cum=bal;if(bal<0&&firstNeg===null)firstNeg=row.day;if(bal<0)recovery=null;if(firstNeg!==null&&recovery===null&&bal>=0)recovery=row.day;if(-bal>peak){peak=-bal;peakDay=row.day}if(row.day===start)initial=Math.max(0,-bal);prev=row.day});
 const lastDay=daily.length?daily[daily.length-1].day:start;
 // Recovery is final: a later deficit resets the recovery day.
 return {daily,peak,peakDay,cap,initial,firstNeg,recovery,ending:bal,lastDay,duration:firstNeg===null?0:(recovery===null?lastDay:recovery)-firstNeg};
}
function simulate(input){
 const d=normalize(input),events=[],operations=[],financeLegs=[],vatInputs=[];let inputVat=0,op=0,finCost=0,expectedLoss=0,badDebtVatLoss=0;
 function event(day,cash,cat,label,component){if(!cash)return;if(!Number.isFinite(cash)||day<0||!Number.isFinite(day))throw Error('جریان نقدی خارج از دامنه معتبر است.');events.push({day:day+d.startDay,seq:events.length,cash,econ:cash,cat,label,principal:0,affects:true,affectsCashFlow:true,affectsEconomicProfit:!['vat','margin'].includes(cat),affectsVAT:cat==='vat',affectsFacility:cat==='purchase',nominalAmount:cash,cashAmount:cash,economicAmount:component==null?cash:component,vatComponent:cat==='vat'?cash:0,financingComponent:cat==='fin_cost'?cash:0});}
 const saleable=d.qTon*(1-pct(d.shrink)),purchaseBase=d.qTon*d.buyTon/(d.purchasePriceIncludesVat&&d.tradeType!=='import'?1+pct(d.purchaseVat):1),saleBase=saleable*d.sellTon/(d.salePriceIncludesVat?1+pct(d.saleVat):1);
 const preBase=saleBase*pct(d.salePrepayPct),remaining=saleBase-preBase,receipts=d.salesLegs.map(l=>({day:d.holding+l.due,base:remaining*pct(l.share)*(1+(l.markup||0)/100),credit:l.due>0}));
 if(preBase){if(d.holding-d.salePrepayDays<0)throw Error('پیش‌دریافت قبل از شروع معامله است.');receipts.push({day:d.holding-d.salePrepayDays,base:preBase,credit:false});}
 const saleNetTotal=sum(receipts.map(x=>x.base)),outputVat=saleNetTotal*pct(d.saleVat);
 function addInput(day,v){if(v){inputVat+=v;vatInputs.push({day,amount:v});}}
 function addOp(day,net,label,vatOn,recoverable=true){const v=vatOn?net*pct(d.serviceVat):0;op+=net+(recoverable?0:v);operations.push({label,net,vat:v,recoverable,amount:net+(recoverable?0:v),day:day+d.startDay});event(day,-net,'op',label);event(day,-v,'vat','VAT '+label,recoverable?0:-v);if(recoverable)addInput(day,v);}
 function foreignDay(k){return d.foreignTimingPreset==='upfront'?0:d.foreignTimingPreset==='custom'?d[k==='freight'?'foreignFreightDay':k==='vat'?'foreignVatDay':'foreignCustomsDay']:k==='freight'?Math.round(d.holding/2):d.holding;}
 addOp(0,d.qTon*d.inbound,'حمل ورودی',true);addOp(Math.round(d.holding/2),d.qTon*d.storage*d.holding/30,'انبارداری',true);addOp(d.holding,saleable*d.outbound,'حمل خروجی',true);
 let supplierVAT=purchaseBase*pct(d.purchaseVat);
 if(d.tradeType==='import'){
  supplierVAT=0;const freight=d.qTon*d.intFreight*d.buyFx,insurance=d.importFreightIncluded?0:(purchaseBase+freight)*pct(d.insurancePct),border=d.importFreightIncluded?purchaseBase:purchaseBase+freight+insurance,customs=border*pct(d.customsPct);
  if(!d.importFreightIncluded){addOp(foreignDay('freight'),freight,'حمل بین‌المللی',false);addOp(foreignDay('freight'),insurance,'بیمه',false);}
  addOp(foreignDay('customs'),customs,'گمرک',false);addOp(0,purchaseBase*pct(d.transferPct),'انتقال ارز خرید',false);
  const v=(border+customs)*pct(d.purchaseVat);event(foreignDay('vat'),-v,'vat','VAT واردات',0);addInput(foreignDay('vat'),v);
 }
 if(d.tradeType==='export'){
  addOp(foreignDay('freight'),saleable*d.intFreight*d.sellFx,'حمل صادرات بر مقدار قابل فروش',false);addOp(foreignDay('freight'),saleNetTotal*pct(d.insurancePct),'بیمه صادرات',false);
  receipts.forEach(x=>addOp(x.day,x.base*pct(d.transferPct),'انتقال ارز هنگام وصول',false));
 }
 d.customCosts.forEach(c=>{
  if(!Number.isFinite(c.amount)||c.amount<0)throw Error('هزینه سفارشی نامعتبر است.');const t=c.type||'fixed_toman',a=c.amount,q=c.quantityBasis==='saleable'?saleable:d.qTon,fx=t.startsWith('buyfx')?d.buyFx:d.sellFx;
  let net=t==='pct_purchase'?purchaseBase*a/100:t==='pct_sale'?saleNetTotal*a/100:t.endsWith('per_ton')?a*q*(t==='toman_per_ton'?1:fx):t==='toman_per_kg'?a*q*1000:t==='toman_per_piece'?a*q*1000/d.pieceKg:t.endsWith('_fixed')?a*fx:a;
  if(!Number.isFinite(net))throw Error('مبنای هزینه سفارشی معتبر نیست.');addOp(c.timing==='purchase'?0:c.timing==='holding'?Math.round(d.holding/2):d.holding,net,c.name||'هزینه سفارشی',c.vat,c.vatRecoverable!==false);
 });
 addInput(0,supplierVAT);const adv=purchaseBase*pct(d.advance),advVAT=supplierVAT*pct(d.advance),rem=purchaseBase-adv,remVAT=supplierVAT-advVAT;
 event(0,-adv,'purchase','پیش‌پرداخت خرید');event(0,-advVAT,'vat','VAT پیش‌پرداخت',0);
 const usage={cheque:0,lc:0,boe:0};
 d.finLegs.forEach(l=>{const p=rem*pct(l.share),v=remVAT*pct(l.share);if(l.method==='cash'){event(0,-p,'purchase','خرید نقدی');event(0,-v,'vat','VAT خرید نقدی',0);return;}
  const f=financingLeg(p,v,l);financeLegs.push(f);usage[l.method]=(usage[l.method]||0)+f.faceValue;finCost+=f.financeMarkup+f.fee;
  event(0,-(v-f.financedVAT),'vat','VAT نقدی '+l.method,0);event(l.due,-p,'purchase','اصل '+l.method);event(l.due,-f.financedVAT,'vat','VAT تأمین‌شده '+l.method,0);
  event(l.due,-f.financeMarkup,'fin_cost','اضافه‌قیمت '+l.method);event(l.feeFinanced?l.due:0,-f.fee,'fin_cost','کارمزد '+l.method);
  event(0,-f.marginAmount,'margin','بلوکه '+l.method,0);event(l.due,f.marginAmount,'margin','آزادسازی '+l.method,0);
 });
 receipts.forEach(x=>{const loss=x.credit?x.base*pct(d.expectedCreditLoss):0,v=x.base*pct(d.saleVat),vday=d.vatCollectionMode==='delivery'?d.holding:d.vatCollectionMode==='custom'?d.vatCollectionDay:x.day,vl=x.credit&&vday>=x.day?v*pct(d.expectedCreditLoss):0;expectedLoss+=loss;badDebtVatLoss+=vl;event(x.day,x.base,'sale','وصول فروش');event(x.day,-loss,'risk','عدم وصول مورد انتظار');event(vday,v-vl,'vat','وصول VAT فروش',0);});
 const settle=d.vatSettlementDay,available=sum(vatInputs.filter(x=>x.day<=settle).map(x=>x.amount)),payable=Math.max(0,outputVat-available);
 event(settle,-payable,'vat','تسویه VAT',0);
 const credit=inputVat-outputVat+payable,badRecover=d.badDebtVatTreatment==='recoverable'?badDebtVatLoss:0,totalCredit=credit+badRecover;
 let vatWriteOff=0;const warnings=[];
 if(totalCredit>1e-8){if(d.vatCreditMode==='nonrecoverable'){vatWriteOff=totalCredit;}else{
  const earliest=Math.max(settle,...vatInputs.map(x=>x.day),...(badRecover?receipts.map(x=>x.day):[0]));
  if(d.vatRecoveryDay<earliest)throw Error('روز بازیافت VAT باید پس از ایجاد اعتبار و تسویه باشد (حداقل '+earliest+' روز).');
  event(d.vatRecoveryDay,totalCredit,'vat',d.vatCreditMode==='refund'?'استرداد VAT':'صرفه‌جویی نقدی تهاتر VAT آتی',0);
  if(d.vatCreditMode==='offset')warnings.push('بازیافت VAT بر فرض وجود بدهی مالیاتی آتی کافی در روز تعیین‌شده است؛ این رویداد صرفه‌جویی نقدی است، نه واریز بانکی.');
 }}
 const risk=expectedLoss+(d.badDebtVatTreatment==='recoverable'?0:badDebtVatLoss),nominal=saleNetTotal-purchaseBase-op-finCost-risk-vatWriteOff;
 events.sort((a,b)=>a.day-b.day||a.seq-b.seq);const prof=dailyProfile(events,d.startDay),npv=sum(events.map(e=>e.econ/Math.pow(1+pct(d.hurdle),e.day/365))),tol=Math.max(1e-6,(saleNetTotal+purchaseBase+op+finCost)*1e-10),difference=sum(events.map(e=>e.econ))-nominal;
 if(Math.abs(difference)>tol)throw Error('عدم تطبیق موتور اقتصاد و جریان نقدی.');
 const cashOK=d.limits.cash==null||prof.peak<=d.limits.cash+tol,facilityOK=Object.keys(usage).every(k=>d.limits[k]==null||usage[k]<=d.limits[k]+tol),feasible=cashOK&&facilityOK;
 const cashReturn=prof.peak>tol?nominal/prof.peak:null,periodReturn=prof.recovery!==null&&prof.ending>=0?cashReturn:null,periodDays=prof.duration;
 const equivalent=days=>{const v=periodReturn!=null&&periodReturn>-1&&periodDays>0?Math.expm1(Math.log1p(periodReturn)*days/periodDays):null;return Number.isFinite(v)?v:null;};
 const monthlyEquivalent=equivalent(30),annualEquivalent=equivalent(365),expectedPeriodReturn=periodDays>0?Math.expm1(Math.log1p(pct(d.hurdle))*periodDays/365):null;
 if(prof.firstNeg!==null&&(prof.recovery===null||prof.ending<0))warnings.push('سرمایه تا پایان افق مدل به‌طور کامل بازیافت نشده است؛ بازده دوره قابل ارائه نیست.');
 const accountingAdjustments=[];if(vatWriteOff)accountingAdjustments.push({label:'VAT غیرقابل بازیافت',amount:-vatWriteOff});if(d.badDebtVatTreatment!=='recoverable'&&badDebtVatLoss)accountingAdjustments.push({label:'VAT مطالبات سوخت‌شده',amount:-badDebtVatLoss});
 if(Math.abs(sum(events.map(e=>e.economicAmount))+sum(accountingAdjustments.map(a=>a.amount))-nominal)>tol)throw Error('عدم تطبیق دفتر اثر اقتصادی.');
 const financedPrincipal=sum(financeLegs.map(l=>l.facilityPrincipal));
 const economics={revenue:saleNetTotal,purchase:purchaseBase,operations:op,financing:finCost,risk,other:vatWriteOff,profit:nominal,npv,timeValueEffect:npv-nominal,profitMargin:saleNetTotal>0?nominal/saleNetTotal:null,totalCosts:purchaseBase+op+finCost+risk+vatWriteOff,reconciliationDifference:difference,tolerance:tol};
 return {...prof,accountingAdjustments,npv,nominal,gross:saleNetTotal-purchaseBase,op,finCost,saleNetTotal,purchaseBase,profitMargin:economics.profitMargin,periodReturn,periodDays,monthlyEquivalent,annualEquivalent,expectedPeriodReturn,periodExcess:periodReturn==null||expectedPeriodReturn==null?null:periodReturn-expectedPeriodReturn,annualReturn:annualEquivalent,cashReturn,recoveryDay:prof.recovery,firstFundingDay:prof.firstNeg,lastCashDay:prof.lastDay,weightedTenor:financedPrincipal?sum(financeLegs.map(l=>l.facilityPrincipal*l.days))/financedPrincipal:0,finCostPct:financedPrincipal?finCost/financedPrincipal*100:0,events,usage,cashOK,facilityOK,feasible,saleable,expectedLoss,badDebtVatLoss,inputVat,outputVat,vatPayable:payable,vatCredit:totalCredit,vatWriteOff,financeLegs,operations,economics,warnings,schemaVersion:11};
}
function solveBoundary(input,variable,kind){
 const d=normalize(input),limitKeys=kind==='cash'?['cash']:kind==='facility'?['cheque','lc','boe']:['cash','cheque','lc','boe'];
 if(kind!=='economic'&&limitKeys.every(k=>d.limits[k]==null))return {status:'unbounded',value:Infinity};
 const increasing=variable==='sellTon',base=Math.max(1,d[variable]||1),cap=Math.min(1e24,base*1e12),samples=[];
 function score(v){const r=simulate({...d,[variable]:v});return kind==='economic'?r.npv:kind==='cash'?(d.limits.cash==null?1:d.limits.cash-r.peak):kind==='facility'?Math.min(...['cheque','lc','boe'].filter(k=>d.limits[k]!=null).map(k=>d.limits[k]-r.usage[k])):Math.min(...['cash','cheque','lc','boe'].filter(k=>d.limits[k]!=null).map(k=>d.limits[k]-(k==='cash'?r.peak:r.usage[k])));}
 try{
  samples.push({x:0,y:score(0)});for(let x=base/1024;x<=cap;x*=2)samples.push({x,y:score(x)});
  const tol=Math.max(1e-7,Math.abs(samples[0].y)*1e-10);
  for(let i=1;i<samples.length;i++){if(!Number.isFinite(samples[i].y))return {status:'invalid',value:null};if(increasing?samples[i].y<samples[i-1].y-tol:samples[i].y>samples[i-1].y+tol)return {status:'nonmonotonic',value:null};}
  if(increasing&&samples[0].y>=0)return {status:'converged',value:0};if(!increasing&&samples[0].y<0)return {status:'no_solution',value:0};
  const index=samples.findIndex((s,i)=>i>0&&(increasing?s.y>=0:s.y<0));
  if(index<0)return {status:'search_limit',value:null};
  let lo=samples[index-1].x,hi=samples[index].x;
  for(let i=0;i<75;i++){const mid=(lo+hi)/2,ok=score(mid)>=0;if(increasing?ok:!ok)hi=mid;else lo=mid;}
  return {status:'converged',value:increasing?hi:lo};
 }catch(e){return {status:'invalid',value:null,message:e.message};}
}
root.TradeEngine={simulate,normalize,financingLeg,dailyProfile,solveBoundary};
})(typeof window==='undefined'?globalThis:window);
