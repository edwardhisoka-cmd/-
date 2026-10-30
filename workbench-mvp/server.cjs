'use strict';
// Node.js 24 LTS; standard library only. Never serves the database or source server files.
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {DatabaseSync}=require('node:sqlite');global.CRM=require('./crm.js');const W=require('./core.js');
const TABLES=Object.keys(W.fields),MAX=5*1024*1024;
function passwordHash(password,salt){return crypto.scryptSync(password,salt,64).toString('hex');}
function openStore(file){
 fs.mkdirSync(path.dirname(file),{recursive:true,mode:0o700});const db=new DatabaseSync(file);try{fs.chmodSync(file,0o600);}catch{}
 db.exec('PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS metadata (id INTEGER PRIMARY KEY CHECK(id=1), revision INTEGER NOT NULL); CREATE TABLE IF NOT EXISTS users (username TEXT PRIMARY KEY, salt TEXT NOT NULL, hash TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN (\'admin\',\'viewer\'))); CREATE TABLE IF NOT EXISTS audit (id INTEGER PRIMARY KEY, time TEXT NOT NULL, username TEXT NOT NULL, action TEXT NOT NULL, revision INTEGER);');
 for(const table of TABLES){const relations=W.fields[table].filter(([,,t])=>TABLES.includes(t));db.exec(`CREATE TABLE IF NOT EXISTS ${table} (id TEXT PRIMARY KEY, payload TEXT NOT NULL ${relations.map(([key,,target])=>`, ${key} TEXT REFERENCES ${target}(id) DEFERRABLE INITIALLY DEFERRED`).join('')})`);}
 function load(){const data={version:2};for(const t of TABLES)data[t]=db.prepare(`SELECT payload FROM ${t} ORDER BY rowid`).all().map(r=>JSON.parse(r.payload));return {data:W.prepare(data),revision:db.prepare('SELECT revision FROM metadata WHERE id=1').get()?.revision??0};}
 function write(data,expected,user='system',restore=false){db.exec('BEGIN IMMEDIATE');try{const revision=db.prepare('SELECT revision FROM metadata WHERE id=1').get()?.revision??0;if(expected!==revision){const e=Error('資料已被其他分頁修改，請重新載入後再編輯。');e.status=409;throw e;}const prev=revision?load().data:null;
 // Ordinary writes derive append-only price history server-side. Restores are explicit admin operations.
 const next=restore?W.prepare(W.migrate(data)):W.prepare(data,prev);
 for(const t of TABLES)db.exec(`DELETE FROM ${t}`);
 for(const t of TABLES){const refs=W.fields[t].filter(([,,target])=>TABLES.includes(target));const keys=['id','payload',...refs.map(([k])=>k)];const stmt=db.prepare(`INSERT INTO ${t} (${keys.join(',')}) VALUES (${keys.map(()=>'?').join(',')})`);for(const r of next[t])stmt.run(r.id,JSON.stringify(r),...refs.map(([k])=>r[k]||null));}
 db.prepare('INSERT INTO metadata(id,revision) VALUES(1,?) ON CONFLICT(id) DO UPDATE SET revision=excluded.revision').run(revision+1);db.prepare('INSERT INTO audit(time,username,action,revision) VALUES(?,?,?,?)').run(new Date().toISOString(),user,restore?'restore':'save',revision+1);db.exec('COMMIT');return {data:next,revision:revision+1};}catch(e){db.exec('ROLLBACK');throw e;}}
 if(!db.prepare('SELECT revision FROM metadata WHERE id=1').get())write(W.seed,0);
 function addUser(username,password,role){if(!/^[a-zA-Z0-9_-]{1,40}$/.test(username)||password.length<12||password.length>256||!['admin','viewer'].includes(role))throw Error('帳號限英數、底線、連字號；密碼至少 12 字元；角色 admin 或 viewer。');const salt=crypto.randomBytes(32).toString('hex');db.prepare('INSERT INTO users(username,salt,hash,role) VALUES(?,?,?,?) ON CONFLICT(username) DO UPDATE SET salt=excluded.salt,hash=excluded.hash,role=excluded.role').run(username,salt,passwordHash(password,salt),role);}
 return {db,load,write,addUser};
}
function createServer(store,{secure=false}={}){
 const sessions=new Map(),attempts=new Map();const allowedStatic=new Set(['index.html','style.css','crm.js','core.js','app.js']);
 const server=http.createServer(async(req,res)=>{
 const host=req.headers.host||'';const origin=(secure?'https://':'http://')+host;
 function json(status,body,extra={}){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',...extra});res.end(JSON.stringify(body));}
 try{
 res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('X-Frame-Options','DENY');res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");
 // Reject cross-site writes, including form submissions; no CORS allowances.
 if(['POST','PUT','DELETE'].includes(req.method)&&req.headers.origin!==origin)return json(403,{error:'來源驗證失敗'});
 const pathname=new URL(req.url,'http://localhost').pathname;
 let body={};if(['POST','PUT'].includes(req.method)){if(!(req.headers['content-type']||'').startsWith('application/json'))return json(415,{error:'只接受 JSON'});let chunks=[],len=0;for await(const chunk of req){len+=chunk.length;if(len>MAX)return json(413,{error:'資料超過 5MB 限制'});chunks.push(chunk);}try{body=JSON.parse(Buffer.concat(chunks).toString())}catch{return json(400,{error:'JSON 格式錯誤'});}}
 const token=(req.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith('senyan_session='))?.slice(15);let session=sessions.get(token);if(session&&session.expires<Date.now()){sessions.delete(token);session=null;}
 if(pathname==='/api/login'&&req.method==='POST'){
 const address=req.socket.remoteAddress;const now=Date.now(),a=attempts.get(address)||{count:0,until:0};if(a.until>now)return json(429,{error:'登入失敗次數過多，請稍後再試'});const user=store.db.prepare('SELECT * FROM users WHERE username=?').get(typeof body.username==='string'?body.username:'');const candidate=passwordHash(typeof body.password==='string'&&body.password.length<=256?body.password:'',user?.salt||'invalid-user-salt');if(!user||!crypto.timingSafeEqual(Buffer.from(candidate,'hex'),Buffer.from(user.hash,'hex'))){a.count++;a.until=a.count>=5?now+60000:0;attempts.set(address,a);return json(401,{error:'帳號或密碼錯誤'});}attempts.delete(address);if(token)sessions.delete(token);const key=crypto.randomBytes(32).toString('hex'),csrf=crypto.randomBytes(24).toString('hex');sessions.set(key,{username:user.username,role:user.role,csrf,expires:now+8*3600000});return json(200,{username:user.username,role:user.role,csrf},{'Set-Cookie':`senyan_session=${key}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800${secure?'; Secure':''}`});}
 if(pathname.startsWith('/api/')){
 if(!session)return json(401,{error:'請先登入'});
 if(['POST','PUT','DELETE'].includes(req.method)&&req.headers['x-csrf-token']!==session.csrf)return json(403,{error:'操作驗證失敗，請重新登入'});
 if(pathname==='/api/session'&&req.method==='GET')return json(200,{username:session.username,role:session.role,csrf:session.csrf});
 if(pathname==='/api/logout'&&req.method==='POST'){sessions.delete(token);return json(200,{ok:true},{'Set-Cookie':'senyan_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0'});}
 if(pathname==='/api/state'&&req.method==='GET'){const state=store.load();return json(200,{...state,data:session.role==='admin'?state.data:W.viewerState(state.data)});}
 if(session.role!=='admin')return json(403,{error:'此操作限管理者；唯讀帳號無法取得私人欄位或備份'});
 if(pathname==='/api/backup'&&req.method==='GET')return json(200,store.load().data,{'Content-Disposition':'attachment; filename="senyan-backup.json"'});
 if((pathname==='/api/state'||pathname==='/api/restore')&&req.method==='PUT')return json(200,store.write(body.data,body.revision,session.username,pathname==='/api/restore'));
 return json(404,{error:'找不到操作'});
 }
 if(req.method!=='GET')return json(405,{error:'不支援的操作'});
 const file=pathname==='/'?'index.html':pathname.slice(1);if(!allowedStatic.has(file))return json(404,{error:'找不到檔案'});const mime=file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html';res.writeHead(200,{'Content-Type':mime+'; charset=utf-8','Cache-Control':'no-store'});res.end(fs.readFileSync(path.join(__dirname,file)));
 }catch(e){json(e.status||400,{error:e.message?.includes('FOREIGN KEY')?'關聯資料不存在，未儲存':e.message||'操作失敗'});}
 });return server;
}
async function main(){const args=process.argv.slice(2);const opt=(k,def)=>{const i=args.indexOf(k);return i<0?def:args[i+1];};const store=openStore(path.resolve(opt('--db',path.join(__dirname,'data','workbench.sqlite'))));
 if(args.includes('--user')){const readline=require('node:readline/promises'),{Writable}=require('node:stream');const sink=new Writable({write(chunk,enc,cb){if(!sink.muted)process.stdout.write(chunk);cb();}});const rl=readline.createInterface({input:process.stdin,output:sink,terminal:true});let password;process.stdout.write('設定密碼（至少 12 字元，輸入不顯示）: ');sink.muted=true;try{password=await rl.question('');}finally{rl.close();sink.muted=false;process.stdout.write('\n');}store.addUser(opt('--user'),password,opt('--role','admin'));console.log('帳號已設定。');store.db.close();return;}
 if(!store.db.prepare('SELECT username FROM users WHERE role=\'admin\'').get())throw Error('請先執行 node server.cjs --user admin --role admin 設定管理者密碼。');const host=opt('--host','127.0.0.1'),port=Number(opt('--port','8000'));const server=createServer(store,{secure:args.includes('--secure-cookie')});server.listen(port,host,()=>console.log(`張森焱 AI 工作台：http://${host}:${port}（僅本機／指定區網，未公開部署）`));}
if(require.main===module)main().catch(e=>{console.error(e.message);process.exitCode=1;});module.exports={openStore,createServer};
