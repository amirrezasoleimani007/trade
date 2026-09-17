const DATA=window.STEEL_DATA;
const P=DATA.pptSupplement;
const topics=[
 ['group','نمای کلی گروه فولاد مبارکه'],
 ['main','شرکت اصلی فولاد مبارکه'],
 ['groupfuture','سناریوهای آتی گروه'],
 ['country','موازنه آتی کشور'],
 ['slab','بازار اسلب'],
 ['hot','بازار کلاف گرم'],
 ['trade','روند تجارت و صادرات']
];
const subs={
 group:[['up','ظرفیت فعلی و افق ۱۴۱۰ - بالادست'],['down','ظرفیت فعلی و افق ۱۴۱۰ - پایین‌دست']],
 main:[['core','مقایسه ۱۴۰۴ و ۱۴۰۵ - حلقه‌های اصلی'],['downstream','مقایسه ۱۴۰۴ و ۱۴۰۵ - پایین‌دست']],
 groupfuture:[['18','سناریو ۱: تولید ۱۸ میلیون تن فولاد میانی'],['util','سناریو ۲: نرخ بهره‌وری فعلی'],['cap','ظرفیت پایین‌دست و خودمصرفی']],
 country:[['capacity','سناریو ۱: ظرفیت اسمی'],['energy','سناریو ۲: محدودیت انرژی'],['ore','سناریو ۳: محدودیت سنگ‌آهن'],['likely','سناریو ۴: سناریوی محتمل']],
 slab:[['capacity','سناریو ظرفیت اسمی'],['likely','سناریو محتمل']],
 hot:[['balance','ظرفیت اسمی و تقاضا']],
 trade:[['trend','روند تاریخی صادرات']]
};
const topicEl=document.getElementById('topic'), subEl=document.getElementById('sub');
topics.forEach(([v,l])=>topicEl.add(new Option(l,v)));
topicEl.value='group';
function fa(n,d=1){if(n==null||Number.isNaN(Number(n)))return '—';return Number(n).toLocaleString('fa-IR',{maximumFractionDigits:d,minimumFractionDigits:0})}
function pct(n,d=0){return fa(n*100,d)+'٪'}
function setSubs(){subEl.innerHTML='';subs[topicEl.value].forEach(([v,l])=>subEl.add(new Option(l,v)));render()}
topicEl.onchange=setSubs;subEl.onchange=render;
function legend(items){return '<div class="legend">'+items.map(x=>`<span><i style="background:${x[1]}"></i>${x[0]}</span>`).join('')+'</div>'}
function setMeta(title,subtitle,unit,scope,horizon,metrics){
 document.getElementById('title').textContent=title;document.getElementById('subtitle').textContent=subtitle;document.getElementById('unit').textContent=unit;
 const vals=[['دامنه تحلیل',scope],['افق / دوره',horizon],['تعداد اقلام',metrics+' مورد'],['منبع','Excel + PowerPoint']];
 document.getElementById('summary').innerHTML=vals.map(([a,b])=>`<div><small>${a}</small><b>${b}</b></div>`).join('');
}
function setInsights(arr,signal='تحلیل عرضه و تقاضا'){
 document.getElementById('insights').innerHTML=(arr&&arr.length?arr:['این نما برای مقایسه مستقیم داده‌های ظرفیت و موازنه بازار طراحی شده است.']).map(x=>`<li>${x}</li>`).join('');
 document.getElementById('signal').textContent=signal;
}
function compareChart(ds){
 const a=ds.series[0],b=ds.series[1],max=Math.max(...a.values.filter(x=>x!=null),...b.values.filter(x=>x!=null),1);
 return legend([[a.name,'#2d7bae'],[b.name,'#d3a14d']])+'<div class="compare-grid">'+ds.categories.map((c,i)=>{
   const av=a.values[i],bv=b.values[i],delta=(av!=null&&bv!=null&&av!==0)?(bv-av)/Math.abs(av):null;
   return `<div class="compare-row"><strong>${c}</strong><div class="bar-pair"><div class="bar-line"><i class="bar a" style="width:${av/max*100}%"></i><em>${fa(av,2)}</em></div><div class="bar-line"><i class="bar b" style="width:${bv/max*100}%"></i><em>${fa(bv,2)}</em></div></div><span class="delta ${delta<0?'down':''}">${delta==null?'—':(delta>=0?'+':'')+fa(delta*100,0)+'٪'}</span></div>`;
 }).join('')+'</div>';
}
function supplyDemand(ds){
 const s=ds.series.find(x=>/عرضه/.test(x.name))||ds.series[0],d=ds.series.find(x=>/تقاضا/.test(x.name)),bal=ds.series.find(x=>/موازنه|مازاد|کسری/.test(x.name));
 const all=[...(s?.values||[]),...(d?.values||[])].filter(x=>x!=null).map(Math.abs),max=Math.max(...all,1);
 return legend([['عرضه','#176cb5'],['تقاضا','#d3a14d'],['مازاد','#2f8a70'],['کسری','#bd5d56']])+'<div class="sd-grid">'+ds.categories.map((c,i)=>{
  const sv=s?.values[i],dv=d?.values[i],bv=bal?.values[i]??((sv!=null&&dv!=null)?sv-dv:null);
  return `<div class="sd-row"><strong>${c}</strong><div class="sd-bars"><div class="sdline"><span>عرضه</span><i class="track supply"><i style="width:${sv==null?0:Math.abs(sv)/max*100}%"></i></i><b>${fa(sv,2)}</b></div><div class="sdline"><span>تقاضا</span><i class="track demand"><i style="width:${dv==null?0:Math.abs(dv)/max*100}%"></i></i><b>${fa(dv,2)}</b></div></div><span class="balance ${bv!=null&&bv>=0?'pos':'neg'}">${bv==null?'—':(bv>=0?'+':'')+fa(bv,2)}</span></div>`;
 }).join('')+'</div>';
}
function mainCompany(ds,products,unit){
 const prod=ds.series[0].values,cons=ds.series[1].values,bal=ds.series[2].values;
 return '<div class="product-cards">'+products.map((p,pi)=>`<article class="product-card"><h3>${p}</h3><div class="years">${[0,1].map(y=>{const i=pi*2+y;return `<div class="yearbox"><strong>${ds.categories[i]}</strong><dl><div><dt>تولید</dt><dd>${fa(prod[i],unit==='هزار تن'?0:2)}</dd></div><div><dt>خودمصرفی</dt><dd>${fa(cons[i],unit==='هزار تن'?0:2)}</dd></div><div><dt>موازنه</dt><dd class="${bal[i]>=0?'posText':'negText'}">${bal[i]>=0?'+':''}${fa(bal[i],unit==='هزار تن'?0:2)}</dd></div></dl></div>`}).join('')}</div></article>`).join('')+'</div>';
}
function metricCards(ds){
 const vals=ds.series[0].values;
 return '<div class="cards4">'+ds.categories.map((c,i)=>`<div class="metric-card"><small>${c}</small><b>${fa(vals[i],2)}</b><span>میلیون تن</span></div>`).join('')+'</div>';
}
function oreFlow(){
 const d=P.scenario3;
 return `<div class="flow">${d.products.map((p,i)=>`<div class="node"><small>حلقه ${fa(i+1,0)}</small><b>${p}</b><strong>${fa(d.supply[i],2)} Mt</strong>${d.utilization[i]!=null?`<div class="gauge"><i style="width:${d.utilization[i]*100}%"></i></div><span>بهره‌وری این سناریو: ${pct(d.utilization[i])} · گذشته: ${pct(d.pastUtilization[i])}</span>`:'<span>محدودیت عرضه مبنا</span>'}</div>`).join('')}</div>`;
}
function likelyView(){
 const w=P.scenario4Weights;
 const weights=[['محدودیت سنگ‌آهن',w.oreConstraint],['تداوم روند گذشته',w.pastTrend],['محدودیت انرژی',w.energyConstraint]];
 const top='<div class="weight-grid">'+weights.map(x=>`<div class="weight"><strong>${pct(x[1])}</strong><b>${x[0]}</b><small>وزن در سناریوی محتمل</small></div>`).join('')+'</div>';
 const strip='<div class="likely-strip">'+w.products.map((p,i)=>`<div><span>${p}</span><b>${pct(w.likelyUtilization[i])}</b></div>`).join('')+'</div>';
 return top+strip+supplyDemand(P.slide11Likely);
}
function composition(ds,label){
 const total=ds.series.find(x=>x.name==='جمع')||ds.series[ds.series.length-1];
 const supply=total.values[0],demand=total.values[1],balance=total.values[2];
 const parts=ds.series.filter(x=>x.name!=='جمع').map(x=>[x.name,x.values[1]]).filter(x=>x[1]!=null);
 const sum=parts.reduce((a,x)=>a+x[1],0)||1;let acc=0;const cols=['#176cb5','#d3a14d','#2f8a70','#7654a7','#3f91a5'];
 const stops=parts.map((x,i)=>{const from=acc/sum*360;acc+=x[1];return `${cols[i%cols.length]} ${from}deg ${acc/sum*360}deg`}).join(',');
 return `<div class="composition"><div class="donut" style="background:conic-gradient(${stops})"><div class="donut-center"><small>تقاضای کل</small><b>${fa(demand,2)}</b><small>میلیون تن</small></div></div><div><div class="comp-list">${parts.map((x,i)=>`<div><span><i style="display:inline-block;width:8px;height:8px;border-radius:3px;background:${cols[i%cols.length]};margin-left:6px"></i>${x[0]}</span><b>${fa(x[1],2)}</b></div>`).join('')}</div><div class="cards4" style="grid-template-columns:repeat(3,1fr);margin-top:12px"><div class="metric-card"><small>عرضه</small><b>${fa(supply,2)}</b></div><div class="metric-card"><small>تقاضا</small><b>${fa(demand,2)}</b></div><div class="metric-card"><small>موازنه</small><b class="${balance>=0?'posText':'negText'}">${balance>=0?'+':''}${fa(balance,2)}</b></div></div></div></div>`;
}
function tradeView(){
 const products=[...new Set(DATA.tradeRows.map(r=>r.product))];const selected=window.tradeProduct&&products.includes(window.tradeProduct)?window.tradeProduct:products[0];window.tradeProduct=selected;
 const rows=DATA.tradeRows.filter(r=>r.product===selected).sort((a,b)=>a.year-b.year);
 const vals=rows.map(r=>r.exportsKt),max=Math.max(...vals,1),min=Math.min(...vals,0),w=760,h=300,pad=42;
 const pts=rows.map((r,i)=>{const x=pad+i*(w-2*pad)/Math.max(rows.length-1,1);const y=h-pad-(r.exportsKt-min)/(max-min||1)*(h-2*pad);return [x,y,r]})
 const poly=pts.map(p=>p[0]+','+p[1]).join(' ');
 const last=rows.at(-1),first=rows[0],change=first&&last&&first.exportsKt?((last.exportsKt-first.exportsKt)/Math.abs(first.exportsKt)):null;
 const select=`<div class="trade-controls"><select id="tradeProduct">${products.map(p=>`<option ${p===selected?'selected':''}>${p}</option>`).join('')}</select></div>`;
 const kpis=`<div class="trade-kpis"><div><small>آخرین مقدار</small><b>${fa(last?.exportsKt,0)} هزار تن</b></div><div><small>تغییر نسبت به ابتدای دوره</small><b class="${change>=0?'posText':'negText'}">${change==null?'—':(change>=0?'+':'')+fa(change*100,0)+'٪'}</b></div><div><small>دوره زمانی</small><b>${fa(first?.year,0)} تا ${typeof last?.year==='number'?fa(last?.year,0):String(last?.year||'—')}</b></div></div>`;
 const svg=`<div class="svg-wrap"><svg viewBox="0 0 ${w} ${h}" width="100%" height="330" role="img"><line x1="${pad}" y1="${h-pad}" x2="${w-pad}" y2="${h-pad}" stroke="#b9c6cc"/><polyline points="${poly}" fill="none" stroke="#176cb5" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/>${pts.map(p=>`<circle cx="${p[0]}" cy="${p[1]}" r="5" fill="#d3a14d" stroke="#fff" stroke-width="2"/><text x="${p[0]}" y="${h-16}" text-anchor="middle" font-size="10" fill="#718590">${typeof p[2].year==='number'?fa(p[2].year,0):String(p[2].year)}</text><text x="${p[0]}" y="${p[1]-10}" text-anchor="middle" font-size="9" font-weight="700" fill="#35505e">${fa(p[2].exportsKt,0)}</text>`).join('')}</svg></div>`;
 setTimeout(()=>{const e=document.getElementById('tradeProduct');if(e)e.onchange=()=>{window.tradeProduct=e.value;render()}},0);
 return select+kpis+svg;
}