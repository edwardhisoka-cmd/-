const assert=require('node:assert/strict');const C=require('./core.js');
assert.equal(C.match(C.seed.buyers[0],C.seed.properties[0]).score,100);
assert.equal(C.match(C.seed.buyers[0],C.seed.properties[2]).score,40);
const special=[{id:'X',name:'測試,"引號"\n換行',district:'東區',budget:1000,size:25,age:0,parking:'不限',status:'新需求',next:'',notes:'中文'}];
assert.deepEqual(C.parseCSV(C.csv(special,C.columns.buyers)),special.map(r=>Object.fromEntries(Object.entries(r).map(([k,v])=>[k,String(v)]))));
assert.throws(()=>C.parseCSV('a,b\n"未關閉,x'));assert.throws(()=>C.validate('buyers',[{...special[0],budget:-1}],C.seed));assert.throws(()=>C.validate('buyers',[special[0],special[0]],C.seed));assert.throws(()=>C.validate('visits',[{...C.seed.visits[0],buyerId:'missing'}],C.seed));assert.ok(C.csv([{notes:'=cmd'}],['notes']).includes("'=cmd"));
for(const t of Object.keys(C.columns)) C.validate(t,C.seed[t],C.seed);
console.log('PASS: matching boundaries, CSV quotes/newlines/BOM roundtrip, invalid CSV, negative budget, duplicate IDs, relation validation, formula protection, fixtures');
