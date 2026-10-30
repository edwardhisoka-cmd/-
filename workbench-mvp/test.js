'use strict';
const assert=require('node:assert/strict');global.CRM=require('./crm.js');const W=require('./core.js');let n=0;
function test(name,f){f();n++;console.log('PASS '+name);}
const clone=()=>structuredClone(W.seed);
test('全部示範資料與關聯通過驗證',()=>W.validate(clone()));
test('媒合完整符合、部分符合及預算邊界',()=>{const b=W.seed.buyers[0],p=W.seed.properties[0];assert.equal(CRM.match(b,p).score,100);assert.equal(CRM.match(b,{...p,price:b.budget}).score,100);assert.equal(CRM.match(b,{...p,price:b.budget+1}).score,80);assert.equal(CRM.match(b,W.seed.properties[2]).score,40);});
test('估值、安全折扣與負安全邊際',()=>{assert.deepEqual(W.valuation(10,20,30,150),{fair:200,buy:140,actual:25});assert.equal(W.valuation(10,20,0,220).actual.toFixed(2),'-10.00');for(const a of [[-1,20,30,1],[0,20,30,1],[1,0,30,1],[1,20,100,1],[1,20,30,-1],[NaN,20,30,1]])assert.throws(()=>W.valuation(...a));});
test('間隔複習 1、3、7、14、30 日與忘記重設',()=>{let q={level:0,next:'2026-10-30'};for(const days of [1,3,7,14,30,30]){q=W.review(q,true,'2026-10-30');assert.equal(q.next,W.addDays('2026-10-30',days));}q=W.review(q,false,'2026-12-31');assert.equal(q.level,0);assert.equal(q.next,'2027-01-01');});
test('嚴格日期包含閏年',()=>{assert.equal(W.dateOK('2026-02-30'),false);assert.equal(W.dateOK('2024-02-29'),true);assert.equal(W.dateOK('2026-02-29'),false);});
test('拒絕遺失資料表與錯誤版本',()=>{const d=clone();delete d.buyers;assert.throws(()=>W.validate(d));assert.throws(()=>W.validate({...clone(),version:2}));});
test('拒絕重複代碼、負預算、不存在的關聯與重複企業年度',()=>{let d=clone();d.buyers.push(d.buyers[0]);assert.throws(()=>W.validate(d));d=clone();d.buyers[0].budget=-1;assert.throws(()=>W.validate(d));d=clone();d.sessions[0].courseId='missing';assert.throws(()=>W.validate(d));d=clone();d.financials.push({...d.financials[0],id:'different'});assert.throws(()=>W.validate(d));});
test('拒絕完成單元超額與小數單元；允許負現金流與 EPS',()=>{let d=clone();d.courses[0].completed=100;assert.throws(()=>W.validate(d));d=clone();d.sessions[0].units=1.5;assert.throws(()=>W.validate(d));d=clone();d.financials[0].eps=-1;d.financials[0].operating=-20;W.validate(d);});
test('刪除關聯保護',()=>{assert.equal(W.referenced(clone(),'buyers','B001'),true);assert.equal(W.referenced(clone(),'companies','C1'),true);assert.equal(W.referenced(clone(),'courses','L1'),true);assert.equal(W.referenced(clone(),'buyers','B002'),false);});
test('JSON 完整往返保存三模組',()=>assert.deepEqual(W.validate(JSON.parse(JSON.stringify(W.seed))),W.seed));
console.log(`完成 ${n} 組測試`);
