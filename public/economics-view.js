(function(root){
'use strict';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=(v,d=2)=>Number(v).toLocaleString('fa-IR',{maximumFractionDigits:d});
const money=v=>{let a=Math.abs(v),scale=a>=1e12?1e12:a>=1e9?1e9:a>=1e6?1e6:1;return '\u2066'+(v<0?'−':'')+num(a/scale,scale===1?(a<.01?8:2):3)+'\u2069 '+(scale===1e12?'تریلیون':scale===1e9?'میلیارد':scale===1e6?'میلیون':'')+' تومان';};
function render(r){
 if(!r||!r.economics)return '<p role="status">ابتدا اطلاعات معامله را تکمیل و محاسبه کنید.</p>';
 const e=r.economics,check=e.revenue-e.purchase-e.operations-e.financing-e.risk-e.other-e.profit;
 if(!Object.values(e).every(x=>x===null||Number.isFinite(x))||Math.abs(check)>e.tolerance||Math.abs(e.reconciliationDifference)>e.tolerance)return '<p role="alert">اجزای اقتصاد معامله تطبیق ندارند؛ نمودار قابل ارائه نیست.</p>';
 const rows=[['بهای خرید کالا',e.purchase,'#254f73'],['عملیات معامله',e.operations,'#4e87a7'],['تأمین مالی',e.financing,'#bc8931'],['ریسک وصول',e.risk,'#ac6377']];
 if(e.other)rows.push(['VAT غیرقابل بازیافت',e.other,'#786b96']);
 rows.push([e.profit<0?'زیان معامله':'سود معامله',e.profit,e.profit<0?'#a7384b':'#09877f']);
 const percent=v=>e.revenue>0?(v!==0&&Math.abs(v/e.revenue*100)<.01?(v<0?'−':'')+'کمتر از ۰٫۰۱٪':'\u2066'+num(v/e.revenue*100)+'٪\u2069'):'—';
 const tooltip=row=>row[0]+'؛ '+money(row[1])+'؛ '+percent(row[1])+' از فروش';
 const denom=Math.max(e.revenue,e.totalCosts,1),barRows=e.profit<0?rows.slice(0,-1):rows;
 const bar=barRows.filter(x=>x[1]>0).map(row=>'<span style="width:'+row[1]/denom*100+'%;background:'+row[2]+'" title="'+esc(tooltip(row))+'"></span>').join('');
 const detail=(title,list)=>'<details class="economics-detail"><summary>'+title+'</summary>'+list.map(x=>'<div><span>'+esc(x[0])+'</span><bdi>'+money(x[1])+'</bdi></div>').join('')+'</details>';
 const smallProfit=e.profit>0&&e.profitMargin*100<.01;
 const insight=e.revenue<=0?'درآمد فروش صفر است؛ نسبت هزینه به فروش قابل محاسبه نیست.':e.profit<0?'هزینه‌ها از درآمد فروش بیشتر است؛ معامله زیان‌ده است.':smallProfit?'از هر ۱۰۰ تومان فروش، کمتر از ۰٫۰۱ تومان سود باقی می‌ماند؛ حاشیه سود بسیار محدود است.':'از هر ۱۰۰ تومان فروش، '+num(e.profitMargin*100)+' تومان سود باقی می‌ماند.';
 const costDriver=rows.slice(1,-1).filter(x=>x[1]>0).sort((a,b)=>b[1]-a[1])[0];
 return '<div class="economics-v11"><div class="economics-head"><div><span>درآمد فروش خالص</span><strong><bdi>'+money(e.revenue)+'</bdi></strong></div><div class="'+(e.profit<0?'negative':'positive')+'"><span>'+ (e.profit<0?'زیان':'سود')+' معامله</span><strong><bdi>'+money(e.profit)+'</bdi></strong><small>حاشیه سود '+percent(e.profit)+'</small></div><div><span title="ارزش فعلی جریان‌های نقدی مورد انتظار با نرخ تنزیل شما">ارزش اقتصادی امروز · NPV</span><strong class="'+(e.npv<0?'negative':'positive')+'"><bdi>'+money(e.npv)+'</bdi></strong></div></div><div class="economics-layout"><div><p class="economics-insight">'+insight+'</p><div class="economics-bar" role="img" aria-label="'+esc(rows.map(tooltip).join('، '))+'">'+bar+'</div>'+(e.profit<0?'<p class="negative">کسری پوشش هزینه‌ها: <bdi>'+money(-e.profit)+'</bdi> · مقیاس نوار: کل هزینه‌ها</p>':'')+'<div class="economics-rows"><div class="economics-row economics-label"><span>جزء معامله</span><span>مبلغ</span><span>از فروش</span></div>'+rows.map(row=>'<div class="economics-row" tabindex="0" title="'+esc(tooltip(row))+'"><span><i style="background:'+row[2]+'"></i>'+row[0]+'</span><bdi>'+money(row[1])+'</bdi><bdi>'+percent(row[1])+'</bdi></div>').join('')+'</div>'+(costDriver?'<p class="economics-driver">بزرگ‌ترین هزینه پس از خرید: <strong>'+costDriver[0]+'</strong></p>':'')+detail('جزئیات هزینه عملیات',r.operations.map(x=>[x.label,x.amount]))+detail('جزئیات تأمین مالی',r.financeLegs.flatMap(x=>[['اضافه‌قیمت '+x.method,x.financeMarkup],['کارمزد '+x.method,x.fee]]))+'</div><aside class="economics-time"><h3>از سود تا ارزش اقتصادی</h3><p>اثر زمان‌بندی جریان نقد، جدا از هزینه‌های معامله</p><div><span>سود معامله</span><bdi>'+money(e.profit)+'</bdi></div><div><span>'+ (e.timeValueEffect<0?'هزینه ارزش زمانی پول':'منفعت زمان‌بندی جریان نقد')+'</span><bdi class="'+(e.timeValueEffect<0?'negative':'positive')+'">'+money(e.timeValueEffect)+'</bdi></div><div class="economics-total"><span>NPV</span><bdi>'+money(e.npv)+'</bdi></div><small>سود + اثر زمان‌بندی = NPV</small><p>VAT قابل بازیافت و وجه بلوکه هزینه نیستند؛ اثر زمان‌بندی آن‌ها در NPV لحاظ شده است.</p></aside></div>'+(r.warnings.length?'<details class="economics-detail"><summary>فرض‌ها و محدودیت‌های این محاسبه</summary>'+r.warnings.map(w=>'<p>'+esc(w)+'</p>').join('')+'</details>':'')+'</div>';
}
root.EconomicsView={render};
})(typeof window==='undefined'?globalThis:window);
