import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import {SITE_REFERENCES} from '../public/site-references.js';
import {SOURCE_TYPES,INTENTS,filterSites,cleanPins,chooseSession,cleanSessionProgress} from '../public/atlas-model.js';
import {PORTALS} from '../public/wiki-portal-data.js';
import {portalDirectory} from '../public/wiki-portal-model.js';

test('all 39 requested destinations have safe URLs, complete original locale notes and classifications',()=>{
 assert.equal(SITE_REFERENCES.length,39);assert.equal(new Set(SITE_REFERENCES.map(s=>s.url)).size,39);
 assert.equal(new Set(SITE_REFERENCES.map(s=>s.id)).size,39);
 for(const s of SITE_REFERENCES){assert.equal(new URL(s.url).protocol,'https:');assert.ok(SOURCE_TYPES[s.type]);for(const locale of ['en','zh','ja'])assert.ok(s.note[locale]?.trim().length>10,s.id+':'+locale);assert.ok(s.features.length);}
 assert.deepEqual(Object.fromEntries(PORTALS.map(p=>[p.game,SITE_REFERENCES.filter(s=>s.game===p.game).length])),{genshin:3,starrail:4,wuwa:4,minecraft:5,roblox:4,fortnite:3,gta:4,delta:5,pubg:4,brawl:3});
});
test('known obsolete mirrors and weapon data are explicitly historical',()=>{
 for(const id of ['minecraft-fandom-legacy','gta-fandom-legacy','doors-fandom-legacy','pubg-weapons-legacy'])assert.equal(SITE_REFERENCES.find(s=>s.id===id).type,'legacy');
 assert.match(SITE_REFERENCES.find(s=>s.id==='pubg-weapons-legacy').note.en,/2023/);
});
test('source search intersects game, type, all keyword terms and saved state',()=>{
 const opts={game:'minecraft',type:'community',q:'texture',pinned:true,pins:['minecraft-textures','gtaweb']};
 assert.deepEqual(filterSites(SITE_REFERENCES,opts).map(x=>x.id),['minecraft-textures']);
 assert.equal(filterSites(SITE_REFERENCES,{...opts,pins:[]}).length,0);
 assert.equal(filterSites(SITE_REFERENCES,{q:'not-a-real-source-9649'}).length,0);
 assert.ok(filterSites(SITE_REFERENCES,{q:'地圖'}).length>0);
});
test('corrupt saved links cannot introduce arbitrary destinations or duplicate cards',()=>{
 assert.deepEqual(cleanPins(null,SITE_REFERENCES),[]);
 assert.deepEqual(cleanPins(['gtaweb','gtaweb','https://malicious.example/',{},null],SITE_REFERENCES),['gtaweb']);
});
test('every learning route uses three distinct original manuals for that game, in every locale',()=>{
 for(const locale of ['en','zh-Hant','ja'])for(const p of PORTALS){const entries=portalDirectory(p.game,{portals:PORTALS,guides:[],handbook:[],locale});for(const intent of Object.keys(INTENTS)){const route=chooseSession(entries,p.game,intent);assert.equal(route.length,3);assert.equal(new Set(route.map(x=>x.id)).size,3);assert.ok(route.every(x=>x.game===p.game&&x.kind==='manual'&&x.href.includes('manual=')));assert.ok(route.some(x=>INTENTS[intent].topics.includes(x.topic)));}}
 assert.deepEqual(chooseSession([], 'unknown'),[]);
});
test('reading completion only accepts valid unique manual IDs',()=>{
 const entries=portalDirectory('minecraft',{portals:PORTALS,guides:[],handbook:[]});const id=entries[0].id;
 assert.deepEqual(cleanSessionProgress([id,id,'unknown',42],entries),[id]);
 assert.deepEqual(cleanSessionProgress({},entries),[]);
});
test('every featured dossier and download target exists in the shipped data',async()=>{
 const {DEPTH_INDEX}=await import('../public/depth-index.js');
 for(const p of PORTALS){for(const locale of ['en','zh-Hant','ja'])await access(new URL(`../public/downloads/${locale}/${p.game}-field-manual.md`,import.meta.url));for(const x of DEPTH_INDEX[p.game].featured){const data=JSON.parse(await readFile(new URL(`../public/catalog/${x.collection}.json`,import.meta.url)));assert.ok(data.entries.some(a=>a.id===x.id),p.game+':'+x.id);}}
});
