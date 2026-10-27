import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {DatabaseSync} from 'node:sqlite';
import {handleApi} from '../server/api.mjs';
import {handleReferenceRefresh} from '../server/reference-refresh.mjs';
import {filterGuides} from '../public/data.js';
const req=(path,method='GET',body)=>new Request('https://gamebreak.test/api/'+path,{method,headers:method==='GET'?{}:{Origin:'https://gamebreak.test','Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
async function database(){const sql=new DatabaseSync(':memory:');for(const name of (await readdir(new URL('../drizzle/',import.meta.url))).filter(n=>n.endsWith('.sql')).sort())sql.exec(await readFile(new URL('../drizzle/'+name,import.meta.url),'utf8'));const db={prepare(q){let args=[];const s={bind(...a){args=a;return s;},async all(){return {results:sql.prepare(q).all(...args)};},async first(){return sql.prepare(q).get(...args)||null;},async run(){sql.prepare(q).run(...args);return {success:true};}};return s;},async batch(statements){sql.exec('BEGIN');try{const results=[];for(const s of statements)results.push(await s.run());sql.exec('COMMIT');return results;}catch(e){sql.exec('ROLLBACK');throw e;}}};return {sql,db};}
test('combined Chinese intent search finds a useful, same-game guide',()=>{
 for(const q of ['原神 配隊','原神配队','genshin team'])assert.ok(filterGuides({query:q}).some(g=>g.id==='genshin-beginner-hyperbloom-team'),q);
 for(const q of ['Minecraft 鑽石','麥塊鑽石','我的世界 钻石'])assert.ok(filterGuides({query:q}).some(g=>g.id==='minecraft-find-diamonds'),q);
 assert.ok(filterGuides({query:'原神任務'}).every(g=>g.game==='genshin'));
});
test('shared refresh is bounded, persists successful data and preserves it when the provider fails',async()=>{
 const {sql,db}=await database();let requests=0;const body={collection:'minecraft-pc-items'};
 const run=(now,{fail=false,body:input=body}={})=>handleReferenceRefresh(req('reference-refresh','POST',input),{db,now,read:async()=>input,fetcher:async(url,options)=>{requests++;assert.ok(url.startsWith('https://raw.githubusercontent.com/PrismarineJS/'));assert.equal(options.redirect,'manual');if(fail)throw Error('offline');return Response.json([{id:1,name:'stone',displayName:'Stone',stackSize:64}]);}});
 assert.equal((await run('2026-10-25T00:00:00Z',{body:{collection:'https://127.0.0.1/private'}})).status,400);assert.equal(requests,0);
 const concurrent=await Promise.all([run('2026-10-25T00:00:00Z'),run('2026-10-25T00:00:00Z')]);assert.equal(requests,1);assert.ok((await concurrent[0].json()).ok);
 const read=()=>handleReferenceRefresh(req('reference/minecraft-pc-items'),{db});assert.equal((await (await read()).json()).entries[0].name,'Stone');
 await run('2026-10-25T07:00:00Z',{fail:true});const retained=await (await read()).json();assert.equal(retained.retrievedAt,'2026-10-25T00:00:00Z');assert.equal(sql.prepare('SELECT status FROM provider_checks').get().status,'unavailable');
 await run('2026-10-25T07:01:00Z');assert.equal(requests,2);
 await run('2026-10-25T07:06:00Z');assert.equal(requests,3);assert.equal((await (await read()).json()).retrievedAt,'2026-10-25T07:06:00Z');sql.close();
});
test('account export and deletion require identity, exact origin, explicit confirmation and only touch the owner',async()=>{
 const {sql,db}=await database(),user={userId:'one'};
 for(const id of ['one','two'])sql.prepare('INSERT INTO player_records VALUES(?,?,?,?,?)').run(id,'gamebreak-saved','[]',1,'2026-10-25');
 const call=(request,who=user)=>handleApi(request,{db,user:who});
 assert.equal((await call(req('account-data'),null)).status,401);
 const exported=await (await call(req('account-data'))).json();assert.equal(exported.data.player_records.length,1);assert.equal(exported.data.player_records[0].user_id,'one');
 assert.equal((await call(req('account-data','POST',{action:'delete-my-data'}))).status,400);
 assert.equal((await call(new Request('https://gamebreak.test/api/account-data',{method:'POST',headers:{Origin:'https://evil.test','Content-Type':'application/json'},body:'{}'}))).status,403);
 assert.equal((await call(req('account-data','POST',{action:'delete-my-data',confirmation:'DELETE'}))).status,200);
 assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM player_records WHERE user_id=?').get('one').n,0);assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM player_records WHERE user_id=?').get('two').n,1);sql.close();
});
test('release history is public while private routes are excluded from the sitemap',async()=>{
 const {sql,db}=await database();const payload=await (await handleApi(req('updates'),{db,user:null})).json();assert.ok(payload.releases.length);assert.equal(payload.revisions.length,0);sql.close();
 const map=await readFile(new URL('../public/sitemap.xml',import.meta.url),'utf8');assert.ok(!map.includes('/editor/'));assert.ok(!map.includes('/share/'));assert.ok(map.includes('/wiki/starrail/'));
 const robots=await readFile(new URL('../public/robots.txt',import.meta.url),'utf8');assert.ok(robots.startsWith('User-agent:'));const html=await readFile(new URL('../public/index.html',import.meta.url),'utf8');assert.ok(!html.includes('rel="modulepreload"'));
});

test('provider redirects are rejected without following another origin',async()=>{
 const {sql,db}=await database();let calls=0;const result=await handleReferenceRefresh(req('reference-refresh','POST',{collection:'brawl-modes'}),{db,now:'2026-10-25T00:00:00Z',read:async()=>({collection:'brawl-modes'}),fetcher:async(url,options)=>{calls++;assert.equal(options.redirect,'manual');return new Response(null,{status:302,headers:{Location:'https://unexpected.example/data'}});}});
 assert.equal((await result.json()).status,'unavailable');assert.equal(calls,1);assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM provider_snapshots').get().n,0);sql.close();
});
