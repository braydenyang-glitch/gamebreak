import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
import {COLLECTIONS,normalizeCollection,filterEntries,csvRows,loadCollection,safeUrl} from '../public/catalog-api.js';
import {HANDBOOK} from '../public/handbook.js';import {GUIDES,GAMES} from '../public/data.js';import {readRoute,routeHref} from '../public/routes.js';
const root=new URL('../public/',import.meta.url);
test('all ten games have references; curated collections stay source reviewed even on refresh',async()=>{
 for(const game of GAMES)assert.ok(COLLECTIONS.some(c=>c.game===game.id),game.id);
 for(const c of COLLECTIONS.filter(c=>c.kind==='curated')){
  const bundled=JSON.parse(await readFile(new URL('catalog/'+c.id+'.json',root)));assert.equal(bundled.entries.length,c.id.includes('-field-reference')?8:12);
  let calls=0;const result=await loadCollection(c.id,{refresh:true,fetcher:async path=>{calls++;assert.equal(path,'/catalog/'+c.id+'.json');return {ok:true,json:async()=>bundled};}});
  assert.equal(result.mode,'curated');assert.equal(calls,1);assert.ok(!c.endpoint);
  for(const e of result.entries){assert.ok(e.facts.length);assert.equal(new URL(e.source).protocol,'https:');}
 }
});
test('curated articles and downloadable guides have complete source records and correct game scope',async()=>{
 assert.equal(HANDBOOK.length,40);for(const game of GAMES)assert.equal(HANDBOOK.filter(h=>h.game===game.id).length,4);
 for(const h of HANDBOOK){assert.ok(h.body.length>=2);assert.ok(h.facts.length);assert.equal(new URL(h.source).protocol,'https:');assert.ok(h.sourceCheckMethod);}
 for(const g of GUIDES){const text=await readFile(new URL('downloads/guides/'+g.id+'.md',root),'utf8');assert.ok(text.includes(g.source));assert.ok(text.includes('Unverified'));}
 assert.equal(GUIDES.find(g=>g.id==='doors-rush').reviewed,'2026-10-06');assert.equal(GUIDES.find(g=>g.id==='starrail-weakness').sourceType,'Community');
});
test('all reference snapshots contain unique linked entries, no invented NaN statistics and correct edition separation',async()=>{
 for(const c of COLLECTIONS){const data=JSON.parse(await readFile(new URL('catalog/'+c.id+'.json',root)));assert.ok(data.entries.length>0);assert.equal(new Set(data.entries.map(e=>e.id)).size,data.entries.length,c.id);for(const e of data.entries){assert.ok(e.name);assert.ok(!JSON.stringify(e).includes('NaN'));assert.ok(!e.image||e.image.startsWith('https://')||/^\/assets\/[a-zA-Z0-9_./-]+$/.test(e.image));if(e.image?.startsWith('/assets/'))assert.ok(e.imageSourceUrl?.startsWith('https://'));}assert.ok(Date.parse(data.retrievedAt));}
 const java=JSON.parse(await readFile(new URL('catalog/minecraft-pc-items.json',root))).entries;const bedrock=JSON.parse(await readFile(new URL('catalog/minecraft-bedrock-items.json',root))).entries;
 assert.ok(java.every(x=>x.group==='Java 26.1'));assert.ok(bedrock.every(x=>x.group==='Bedrock data 1.26.30'));
 assert.ok(filterEntries(java,{q:'diamond sword'}).some(x=>x.name==='Diamond Sword'));
});
test('invalid providers fail safely and missing values never become zero; CSV remains literal text',()=>{
 assert.throws(()=>normalizeCollection('genshin-characters',{}));assert.throws(()=>normalizeCollection('brawl-brawlers',{list:[]}));assert.equal(safeUrl('javascript:alert(1)'),'');
 const b=normalizeCollection('brawl-brawlers',{list:[{id:1,name:'Example',released:false,class:{name:'Tank'},rarity:{name:'Rare'}}]}).entries[0];assert.equal(b.active,false);assert.ok(!b.facts.some(([k])=>k==='Health'));
 assert.equal(filterEntries([b],{active:'active'}).length,0);assert.equal(filterEntries([b],{active:'archived'}).length,1);
 assert.ok(csvRows([{name:'=SUM(1,2)',kind:'Test',group:'Test',summary:'a"b',source:'https://example.com'}]).includes('"\'=SUM(1,2)"'));
});
test('malformed local cache falls back to bundled data, then survives provider failure and can refresh',async()=>{
 globalThis.localStorage={getItem:()=>'{"entries":false}',setItem(){}};
 let calls=0;const fallback={entries:[{id:'amber',name:'Amber',image:'',summary:'test'}],retrievedAt:'2026-10-15T00:00:00Z'};
 const fetched=await loadCollection('genshin-characters',{fetcher:async()=>({ok:true,json:async()=>fallback})});assert.equal(fetched.mode,'snapshot');
 const failed=await loadCollection('genshin-characters',{refresh:true,fetcher:async()=>{calls++;throw Error('Offline');}});assert.equal(failed.mode,'fallback');assert.equal(failed.entries[0].name,'Amber');
 const live=await loadCollection('genshin-characters',{refresh:true,fetcher:async()=>({ok:true,json:async()=>[{id:1,name:'Amber',rarity:4,elementText:'Pyro',weaponText:'Bow'}]})});assert.equal(live.mode,'live');assert.equal(live.entries[0].name,'Amber');assert.equal(calls,1);
 delete globalThis.localStorage;
});
test('encyclopedia direct links preserve collection, item, filters and page state',async()=>{
 const q=new URLSearchParams({collection:'minecraft-pc-items',entry:'793',view:'table'});const href=routeHref('wiki','minecraft',q);assert.equal(href,'/wiki/minecraft/?collection=minecraft-pc-items&entry=793&view=table');const r=readRoute(href);assert.equal(r.page,'wiki');assert.equal(r.id,'minecraft');assert.equal(r.query.get('entry'),'793');
 for(const path of ['wiki/','search/','resources/',...GAMES.map(g=>'wiki/'+g.id+'/')])assert.ok((await readFile(new URL(path+'index.html',root),'utf8')).includes('GameBreak'));
});
test('shared API reads accept newer dated snapshots, retain artwork and fall back without a POST',async()=>{
 for(const scenario of ['newer','older','offline']){
  const {loadCollection:load}=await import('../public/catalog-api.js?shared-read='+scenario);
  const bundled={entries:[{id:'1',name:'Reference',image:'https://example.com/item.png'}],retrievedAt:'2026-10-24T00:00:00Z'};
  const paths=[];
  const fetcher=async(path,options={})=>{paths.push(path);assert.notEqual(options.method,'POST');if(path.startsWith('/catalog/'))return {ok:true,json:async()=>bundled};if(scenario==='offline')throw Error('Offline');return {ok:true,json:async()=>({entries:[{id:'1',name:'Shared reference'}],retrievedAt:scenario==='newer'?'2026-10-25T00:00:00Z':'2026-10-20T00:00:00Z'})};};
  const data=await load('genshin-weapons',{shared:true,fetcher});
  assert.equal(data.entries[0].image,'https://example.com/item.png');assert.equal(data.mode,scenario==='newer'?'shared':'snapshot');
  await load('genshin-weapons',{shared:true,fetcher});assert.deepEqual(paths,['/catalog/genshin-weapons.json','/api/reference/genshin-weapons']);
 }
});
