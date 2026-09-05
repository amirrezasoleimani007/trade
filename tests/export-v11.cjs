const fs=require('fs'),vm=require('vm'),assert=require('assert');
let captured;const ctx={console,TextEncoder,Uint8Array,Uint32Array,Blob,URL:{createObjectURL:b=>{captured=b;return 'blob:test'},revokeObjectURL:()=>{}},setTimeout:()=>{},document:{getElementById:id=>({value:id==='commodity'?'آزمون':'',classList:{add(){},remove(){}}}),createElement:()=>({click(){},remove(){}}),body:{appendChild(){}}}};ctx.window=ctx;vm.createContext(ctx);
ctx.document.documentElement={dataset:{}};
vm.runInContext(fs.readFileSync('public/trade-engine.js','utf8'),ctx);
let html=fs.readFileSync('public/cockpit.html','utf8'),js=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].at(-1)[1];
js=js.replace('installV11Inputs();','window.auditTest={setLast:function(v){last=v},export:exportExcelWorkbook};return;');vm.runInContext(js,ctx);
const d={qTon:100,buyTon:1e6,sellTon:1.2e6,holding:90,hurdle:35,finLegs:[{method:'lc',share:100,due:90,rate:2,costMode:'monthly',fee:1,feeMode:'annual',margin:20}],salesLegs:[{share:100,due:0,markup:0}],limits:{},buyCurrency:'TOMAN',sellCurrency:'TOMAN',buyBasis:'per_ton',sellBasis:'per_ton',buyFx:1,sellFx:1,quantityRaw:100,quantityUnit:'ton',vatCreditMode:'offset'};
const r=ctx.TradeEngine.simulate(d);ctx.auditTest.setLast({d,r,econ:1.3e6,minSell:1.1e6,target:1.2e6});ctx.auditTest.export();assert(captured&&captured.size>1000);captured.arrayBuffer().then(b=>{const out=process.argv[2];if(out)fs.writeFileSync(out,Buffer.from(b));console.log(JSON.stringify({bytes:captured.size,profit:r.nominal,npv:r.npv,peak:r.peak,finCost:r.finCost,fee:r.financeLegs[0].fee}));});
