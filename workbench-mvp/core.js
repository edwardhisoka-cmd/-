(function(root){
const fields={
buyers:[['name','買方代稱'],['district','需求區域（以、分隔）'],['budget','預算上限（萬元）','number'],['size','總建坪下限','number'],['age','屋齡上限（年）','number'],['parking','車位',['不限','平面車位','機械車位','無']],['status','狀態',['新需求','追蹤中','待帶看','議價中','已成交','暫停']],['next','追蹤日期','date',true],['notes','其他需求','textarea',true]],
properties:[['name','物件名稱'],['district','區域'],['price','開價（萬元）','number'],['size','總建坪','number'],['age','屋齡（年）','number'],['parking','車位',['平面車位','機械車位','無']],['stage','案件階段',['開發中','已委託','已成交']],['notes','物件備註','textarea',true]],
visits:[['buyerId','買方','buyers'],['propertyId','物件','properties'],['date','帶看日期','date'],['feedback','帶看回饋','textarea']],
companies:[['name','企業名稱'],['ticker','股票代號'],['sector','產業'],['thesis','投資論點','textarea'],['risk','風險與待查證','textarea']],
financials:[['companyId','企業','companies'],['year','年度','year'],['eps','EPS（元）','signed'],['roe','ROE（%）','signed'],['operating','營業現金流（億元）','signed'],['capex','資本支出（億元）','number']],
courses:[['name','課程名稱'],['subject','科目',['初級會計','數學','英文']],['total','總單元數','positive'],['completed','已完成單元','number'],['goal','學習目標','textarea',true]],
sessions:[['courseId','課程','courses'],['date','學習日期','date'],['minutes','學習時間（分鐘）','positive'],['units','本次完成單元數','number'],['notes','學習內容','textarea',true]],
questions:[['subject','科目',['初級會計','數學','英文']],['prompt','錯題題目','textarea'],['answer','正確答案與解析','textarea'],['next','下次複習日','date']]
};
const seed={version:1,...structuredClone(CRM.seed),companies:[{id:'C1',name:'台積電',ticker:'2330',sector:'半導體',thesis:'示範研究：檢視製程領先、客戶黏著度與資本配置。所有數據均為虛構。',risk:'資本密集、景氣循環及地緣風險。待查證：年報與法說資料。'},{id:'C2',name:'統一企業',ticker:'1216',sector:'食品與民生消費',thesis:'示範研究：觀察品牌、通路及穩定現金流。所有數據均為虛構。',risk:'原物料成本與匯率波動。待查證：分部營運及負債。'}],financials:[{id:'F1',companyId:'C1',year:2023,eps:30,roe:25,operating:900,capex:600},{id:'F2',companyId:'C1',year:2024,eps:36,roe:28,operating:1100,capex:680},{id:'F3',companyId:'C1',year:2025,eps:42,roe:30,operating:1300,capex:750},{id:'F4',companyId:'C2',year:2023,eps:3,roe:12,operating:180,capex:90},{id:'F5',companyId:'C2',year:2024,eps:3.3,roe:13,operating:195,capex:95},{id:'F6',companyId:'C2',year:2025,eps:3.6,roe:14,operating:210,capex:100}],courses:[{id:'L1',name:'從分錄到財務報表',subject:'初級會計',total:20,completed:6,goal:'理解三大報表與借貸法則'},{id:'L2',name:'基礎代數與函數',subject:'數學',total:16,completed:4,goal:'每週完成兩個單元'},{id:'L3',name:'每日英文閱讀',subject:'英文',total:30,completed:9,goal:'每天閱讀並整理五個生字'}],sessions:[{id:'S1',courseId:'L1',date:'2026-10-29',minutes:45,units:1,notes:'借貸法則與練習'},{id:'S2',courseId:'L2',date:'2026-10-28',minutes:30,units:1,notes:'一元一次方程式'},{id:'S3',courseId:'L3',date:'2026-10-30',minutes:25,units:1,notes:'短文閱讀與生字'}],questions:[{id:'Q1',subject:'初級會計',prompt:'收到客戶預付貨款，應認列收入嗎？',answer:'尚未履約前應認列合約負債，履約後再認列收入。',next:'2026-10-30',level:0},{id:'Q2',subject:'英文',prompt:'He ___ to school every day. (go)',answer:'goes：第三人稱單數現在式加 -es。',next:'2026-10-29',level:0}]};
seed.properties=seed.properties.map((p,i)=>({...p,stage:i===0?'已委託':i===1?'已成交':'開發中'}));

// Shared entity definitions used by the browser, server, SQLite foreign keys and tests.
fields.properties.splice(2,0,['assetKey','唯一建物識別碼（自訂，不填門牌）'],['road','路名（不得填門牌）','text',true]);
fields.properties=fields.properties.filter(([k])=>k!=='stage');
Object.assign(fields,{
 owners:[['name','屋主代稱'],['phone','電話（僅管理者）','text',true],['email','Email（僅管理者）','text',true],['source','開發來源',['轉介紹','社區開發','來電','網路','舊客戶','其他']],['developed','開始開發日','date'],['willingness','出售意願',['積極出售','價格合適可談','觀望中','暫不出售']],['next','下次追蹤日','date',true],['notes','私人備註','textarea',true]],
 propertyOwners:[['propertyId','既有物件','properties'],['ownerId','屋主或窗口','owners'],['role','關係',['所有權人','共有人','代理人','聯絡窗口']],['share','持分說明','text',true]],
 mandates:[['propertyId','物件','properties'],['ownerId','委託窗口','owners'],['type','委託類型',['一般委託','專任委託']],['start','委託起日','date'],['end','委託到期日','date'],['status','合約狀態',['有效','已終止','已撤銷']],['asking','委託開價（萬元）','number'],['floor','底價（萬元，僅管理者）','number'],['reason','本次價格說明','textarea',true]],
 activities:[['ownerId','屋主','owners'],['propertyId','物件','properties'],['kind','紀錄類型',['聯絡','拜訪','委託洽談','帶看回報','追蹤']],['date','紀錄日期','date'],['visitId','關聯帶看（回報必填）','visits',true],['next','下次追蹤日','date',true],['status','追蹤狀態',['待追蹤','已完成']],['notes','聯絡內容（僅管理者）','textarea']],
 deals:[['propertyId','成交物件','properties'],['mandateId','成交委託','mandates'],['buyerId','成交買方','buyers'],['visitId','成交帶看（選填）','visits',true],['date','成交日期','date'],['amount','實際成交價（萬元）','positive'],['commission','實收佣金（萬元）','number']],
 priceHistory:[['mandateId','委託','mandates'],['propertyId','物件','properties'],['date','調價日期','date'],['asking','開價（萬元）','number'],['floor','底價（僅管理者）','number'],['reason','調價說明','textarea',true]]
});
fields.visits.push(['mandateId','關聯委託（選填）','mandates',true]);
const legacySeed=structuredClone(seed);
function migrate(input){
 const d=structuredClone(input);if(d.version===2)return validate(d);if(d.version!==1)throw Error('不支援的備份版本');
 d.version=2;for(const p of d.properties){p.assetKey='LEGACY-'+p.id;p.road='';}for(const v of d.visits)v.mandateId='';
 for(const t of ['owners','propertyOwners','mandates','activities','deals','priceHistory'])d[t]=[];
 return prepare(d);
}
// No fictional relationships are invented when importing a user's v1 backup.
const upgraded=migrate(legacySeed);Object.assign(seed,upgraded);
seed.properties.forEach((p,i)=>{p.road=['公園路','光明路','河岸路'][i]||'';});
seed.owners=[
 {id:'O1',name:'示範屋主甲',phone:'示範：電話未提供',email:'owner-a@example.invalid',source:'轉介紹',developed:'2026-09-01',willingness:'積極出售',next:'2026-10-30',notes:'純示範：希望先確認付款條件。'},
 {id:'O2',name:'示範共有人乙',phone:'示範：電話未提供',email:'owner-b@example.invalid',source:'社區開發',developed:'2026-09-10',willingness:'價格合適可談',next:'2026-11-02',notes:'純示範：共有人與聯絡窗口。'},
 {id:'O3',name:'示範屋主丙',phone:'示範：電話未提供',email:'',source:'網路',developed:'2026-10-01',willingness:'觀望中',next:'2026-11-05',notes:'純示範：尚未委託。'}];
seed.propertyOwners=[{id:'PO1',propertyId:'P001',ownerId:'O1',role:'所有權人',share:'1/2'},{id:'PO2',propertyId:'P001',ownerId:'O2',role:'共有人',share:'1/2'},{id:'PO3',propertyId:'P002',ownerId:'O1',role:'所有權人',share:'全部'},{id:'PO4',propertyId:'P003',ownerId:'O3',role:'所有權人',share:'全部'},{id:'PO5',propertyId:'P003',ownerId:'O2',role:'聯絡窗口',share:''}];
seed.mandates=[{id:'M1',propertyId:'P001',ownerId:'O1',type:'專任委託',start:'2026-10-01',end:'2027-03-31',status:'有效',asking:1450,floor:1380,reason:'示範：配合市場調整'},
 {id:'M2',propertyId:'P002',ownerId:'O1',type:'一般委託',start:'2026-09-01',end:'2026-12-31',status:'有效',asking:1180,floor:1100,reason:'示範：初始委託'}];
seed.visits[0].mandateId='M1';
seed.deals=[{id:'D1',propertyId:'P002',mandateId:'M2',buyerId:'B002',visitId:'',date:'2026-10-20',amount:1150,commission:23}];
seed.activities=[{status:'待追蹤',id:'A1',ownerId:'O1',propertyId:'P001',kind:'帶看回報',date:'2026-10-28',visitId:'V001',next:'2026-10-30',notes:'示範：買方喜歡採光，已向屋主回報。'},
{status:'待追蹤',id:'A2',ownerId:'O3',propertyId:'P003',kind:'拜訪',date:'2026-10-25',visitId:'',next:'2026-11-05',notes:'示範：先提供行情，下週追蹤出售意願。'}];
seed.priceHistory=[{id:'H1',mandateId:'M1',propertyId:'P001',date:'2026-10-01',asking:1500,floor:1400,reason:'初始委託'},
{id:'H2',mandateId:'M1',propertyId:'P001',date:'2026-10-15',asking:1450,floor:1380,reason:'示範：配合市場調整'},
{id:'H3',mandateId:'M2',propertyId:'P002',date:'2026-09-01',asking:1180,floor:1100,reason:'初始委託'}];
function publicRoad(value){
 // Fail closed. Only a road/street/avenue and optional numeric section can be public.
 const m=String(value||'').match(/^([^\d０-９巷弄號号樓楼室之#\r\n]{1,45}(?:大道|路|街))(?:([一二三四五六七八九十百0-9]+段))?/u);return m?m[1]+(m[2]||''):'';
}
function validateEstate(d){
 const ids=t=>new Map(d[t].map(x=>[x.id,x]));const ps=ids('properties'),ms=ids('mandates'),vs=ids('visits');
 const assets=new Set();for(const p of d.properties){if(!/^[\p{Script=Han}]{1,12}(?:區|市|鎮|鄉)$/u.test(p.district))throw Error('物件區域請只填行政區，不填詳細地址');const key=p.assetKey.trim().toUpperCase();if(assets.has(key))throw Error('建物識別碼重複：請將新窗口關聯到既有物件');assets.add(key);if(p.road&&p.road!==publicRoad(p.road))throw Error('地址僅能填到路名或段，請勿輸入巷弄、門牌或樓層');}
 const links=new Set();for(const l of d.propertyOwners){const key=l.ownerId+'|'+l.propertyId+'|'+l.role;if(links.has(key))throw Error('屋主物件關係重複');links.add(key);}
 const linked=(owner,property)=>d.propertyOwners.some(l=>l.ownerId===owner&&l.propertyId===property);
 for(const m of d.mandates){if(m.start>m.end)throw Error('委託到期日不可早於起日');if(+m.floor>+m.asking)throw Error('底價不可高於開價');if(!linked(m.ownerId,m.propertyId))throw Error('委託窗口必須先關聯到該物件');for(const other of d.mandates)if(m.id<other.id&&m.propertyId===other.propertyId&&m.status==='有效'&&other.status==='有效'&&m.start<=other.end&&other.start<=m.end)throw Error('同物件有效委託期間不可重疊，請先終止原委託');}
 for(const v of d.visits){if(v.mandateId){const m=ms.get(v.mandateId);if(m.propertyId!==v.propertyId||v.date<m.start||v.date>m.end)throw Error('帶看必須屬於同物件且在關聯委託期限內');}}
 for(const a of d.activities){if(!linked(a.ownerId,a.propertyId))throw Error('追蹤屋主與物件未建立關係');if(a.kind==='帶看回報'&&!a.visitId)throw Error('帶看回報必須關聯帶看');if(a.visitId&&vs.get(a.visitId).propertyId!==a.propertyId)throw Error('回報帶看與物件不符');}
 const sold=new Set();for(const deal of d.deals){const m=ms.get(deal.mandateId);if(sold.has(deal.propertyId))throw Error('同物件已有成交，請勿重複建立');sold.add(deal.propertyId);if(m.propertyId!==deal.propertyId||deal.date<m.start||deal.date>m.end)throw Error('成交必須屬於同物件委託且在期限內');if(deal.visitId){const v=vs.get(deal.visitId);if(v.propertyId!==deal.propertyId||v.buyerId!==deal.buyerId||v.date>deal.date)throw Error('成交帶看、物件、買方或日期不一致');}}
 for(const h of d.priceHistory){if(ms.get(h.mandateId).propertyId!==h.propertyId||+h.floor>+h.asking)throw Error('調價紀錄關聯或價格錯誤');}
 for(const m of d.mandates){const history=d.priceHistory.filter(h=>h.mandateId===m.id);const h=history.at(-1);if(h&&(+h.asking!==+m.asking||+h.floor!==+m.floor))throw Error('委託價格與最新調價紀錄不一致');}
 return d;
}
function activeMandate(d,id,date=today()){return d.mandates.find(m=>m.propertyId===id&&m.status==='有效'&&m.start<=date&&m.end>=date);}
function prepare(input,previous=null,date=today()){
 const d=structuredClone(input);
 if(previous){
 // History is append-only via mandate changes; it cannot be silently rewritten by a normal save.
 d.priceHistory=structuredClone(previous.priceHistory);
 for(const m of d.mandates){const old=previous.mandates.find(x=>x.id===m.id);if(old&&old.propertyId!==m.propertyId)throw Error('已有委託不可改綁物件，請建立新委託');if(!old||+old.asking!==+m.asking||+old.floor!==+m.floor){d.priceHistory.push({id:'H'+(globalThis.crypto?.randomUUID?.()||Date.now().toString(36)+Math.random().toString(36).slice(2)),mandateId:m.id,propertyId:m.propertyId,date,asking:m.asking,floor:m.floor,reason:m.reason||(!old?'初始委託':'價格調整')});}}
 }
 for(const p of d.properties){const m=activeMandate(d,p.id,date);if(m)p.price=+m.asking;p.stage=d.deals.some(x=>x.propertyId===p.id)?'已成交':m?'已委託':'開發中';}
 return validate(d);
}
function availableProperties(d,date=today()){return d.properties.filter(p=>!d.deals.some(x=>x.propertyId===p.id)&&activeMandate(d,p.id,date));}
function estateStats(d){const own=d.owners.filter(o=>d.propertyOwners.some(l=>l.ownerId===o.id&&['所有權人','共有人'].includes(l.role))), converted=new Set();for(const o of own)if(d.propertyOwners.some(l=>l.ownerId===o.id&&['所有權人','共有人'].includes(l.role)&&d.mandates.some(m=>m.propertyId===l.propertyId&&m.status!=='已撤銷')))converted.add(o.id);return {owners:own.length,converted:converted.size,conversion:own.length?converted.size/own.length*100:0,properties:d.properties.length,mandated:new Set(d.mandates.filter(m=>m.status!=='已撤銷').map(m=>m.propertyId)).size,deals:d.deals.length,amount:d.deals.reduce((n,x)=>n+(+x.amount),0),commission:d.deals.reduce((n,x)=>n+(+x.commission),0)};}
function filterEstate(d,table,options={}){const {district='',min='',max='',willingness='',due='',from=''}=options;return d[table].filter(r=>{const props=table==='owners'?d.properties.filter(p=>d.propertyOwners.some(l=>l.ownerId===r.id&&l.propertyId===p.id)):table==='properties'?[r]:r.propertyId?d.properties.filter(p=>p.id===r.propertyId):[];const owners=table==='owners'?[r]:d.owners.filter(o=>props.some(p=>d.propertyOwners.some(l=>l.ownerId===o.id&&l.propertyId===p.id)));if((district||min!==''||max!=='')&&!props.some(p=>(!district||p.district.includes(district))&&(min===''||+p.price>=+min)&&(max===''||+p.price<=+max)))return false;if(willingness&&!owners.some(o=>o.willingness===willingness))return false;if(from||due){const dates=[...(r.next?[r.next]:[]),...owners.map(o=>o.next).filter(Boolean),...d.activities.filter(a=>a.status!=='已完成'&&props.some(p=>p.id===a.propertyId)&&(table!=='owners'||a.ownerId===r.id)).map(a=>a.next).filter(Boolean)];if(!dates.some(date=>(!from||date>=from)&&(!due||date<=due)))return false;}return true;});}
function viewerState(d){
 // Static mode uses only this projection; server uses the same strict allowlist.
 return {version:2,buyers:[],owners:d.owners.map(o=>({id:o.id,name:'屋主 '+o.id,source:o.source,developed:o.developed,willingness:o.willingness,next:o.next})),properties:d.properties.map(p=>({id:p.id,name:p.district+' '+publicRoad(p.road),district:p.district,road:publicRoad(p.road),price:p.price,size:p.size,age:p.age,parking:p.parking,stage:p.stage,assetKey:p.id})),propertyOwners:d.propertyOwners.map(l=>({id:l.id,propertyId:l.propertyId,ownerId:l.ownerId,role:l.role})),mandates:d.mandates.map(m=>({id:m.id,propertyId:m.propertyId,ownerId:m.ownerId,type:m.type,start:m.start,end:m.end,status:m.status,asking:m.asking})),priceHistory:d.priceHistory.map(h=>({id:h.id,mandateId:h.mandateId,propertyId:h.propertyId,date:h.date,asking:h.asking})),activities:[],visits:[],deals:d.deals.map(x=>({id:x.id,propertyId:x.propertyId,mandateId:x.mandateId,date:x.date,amount:x.amount})),companies:[],financials:[],courses:[],sessions:[],questions:[]};
}
function dateOK(v){if(typeof v!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(v))return false;const d=new Date(v+'T00:00:00Z');return !isNaN(d)&&d.toISOString().slice(0,10)===v;}
function today(){return new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Taipei'});}
function addDays(date,n){const d=new Date(date+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);}
function review(q,remembered,date=today()){const level=remembered?Math.min((q.level||0)+1,5):0;return {...q,level,next:addDays(date,remembered?[1,1,3,7,14,30][level]:1)};}
function valuation(eps,pe,margin,price){if(![eps,pe,margin,price].every(Number.isFinite)||eps<=0||pe<=0||margin<0||margin>=100||price<0)throw Error('請輸入正的 EPS、本益比，以及 0～99.99% 安全折扣與非負股價。');const fair=eps*pe;return {fair,buy:fair*(1-margin/100),actual:(1-price/fair)*100};}
function validate(data){if(!data||data.version!==2)throw Error('不支援的備份版本');for(const [table,defs] of Object.entries(fields)){if(!Array.isArray(data[table]))throw Error('缺少資料表：'+table);const ids=new Set();for(const r of data[table]){if(!r||typeof r.id!=='string'||!/^[-A-Za-z0-9_]{1,100}$/.test(r.id)||ids.has(r.id))throw Error('紀錄代碼錯誤或重複');ids.add(r.id);for(const [key,label,type,optional] of defs){const v=r[key];if(optional&&(v===''||v===undefined))continue;if(v===undefined||v===null||String(v).trim()==='')throw Error(label+'必填');if(['number','positive','signed','year'].includes(type)){if(!['number','string'].includes(typeof v)||!Number.isFinite(+v)||(type!=='signed'&&+v<0)||(type==='positive'&&+v<=0)||(type==='year'&&(!Number.isInteger(+v)||+v<1900||+v>2200)))throw Error(label+'數值不正確');}else if(type==='date'){if(!dateOK(v))throw Error(label+'日期不正確');}else if(Array.isArray(type)){if(!type.includes(v))throw Error(label+'選項不正確');}else if(typeof v!=='string')throw Error(label+'應為文字');}
if(table==='courses'&&(+r.completed>+r.total||!Number.isInteger(+r.completed)||!Number.isInteger(+r.total)))throw Error('課程單元必須為整數，且完成數不可超過總數');if(table==='questions'&&(!Number.isInteger(r.level)||r.level<0||r.level>5))throw Error('複習等級錯誤');if(table==='sessions'&&!Number.isInteger(+r.units))throw Error('完成單元數必須為整數');}}
for(const [table,defs] of Object.entries(fields))for(const r of data[table])for(const [key,label,type] of defs)if(typeof type==='string'&&fields[type]&&r[key]&&!data[type].some(x=>x.id===r[key]))throw Error(label+'關聯不存在');const years=new Set();for(const r of data.financials){const k=r.companyId+':'+r.year;if(years.has(k))throw Error('同企業同年度財報不可重複');years.add(k);}return validateEstate(data);}
function referenced(data,table,id){return Object.entries(fields).some(([t,defs])=>defs.some(([key,,type])=>type===table&&data[t].some(r=>r[key]===id)));}
const api={fields,seed,dateOK,today,addDays,review,valuation,validate,referenced,migrate,prepare,activeMandate,availableProperties,estateStats,filterEstate,publicRoad,viewerState};if(typeof module!=='undefined')module.exports=api;else root.Workbench=api;
})(globalThis);
