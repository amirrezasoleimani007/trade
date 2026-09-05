const fs=require('fs'),vm=require('vm'),assert=require('assert');
const ctx={};vm.createContext(ctx);vm.runInContext(fs.readFileSync('public/trade-engine.js','utf8'),ctx);
const profile=ctx.TradeEngine.dailyProfile([[0,-100],[10,120],[20,-80],[30,100]].map(([day,cash])=>({day,cash,affects:true,label:'test'})),0);
assert.equal(profile.recovery,30);assert.equal(profile.duration,30);assert.equal(profile.peak,100);
console.log('PASS: final recovery after a renewed funding deficit');
