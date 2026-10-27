import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import {GAMES,GUIDES,filterGuides} from '../public/data.js';
import {refreshMetadata,getMetadata,makeApiUrl} from '../public/api.js';
import {buildCommand,validateCheck,validateStudy} from '../public/tools.js';
import vm from 'node:vm';

test('network HTML upgrades legacy cached app once without first-install reloads',async()=>{
 const html=await readFile(new URL('../public/index.html',import.meta.url),'utf8');
 const bootstrap=html.match(/<script>\s*([\s\S]*?)<\/script>/)[1];
 let handler,reloads=0;
 vm.runInNewContext(bootstrap,{navigator:{serviceWorker:{controller:{},addEventListener:(event,cb)=>{assert.equal(event,'controllerchange');handler=cb;}}},location:{reload:()=>reloads++}});
 handler();handler();assert.equal(reloads,1);
 vm.runInNewContext(bootstrap,{navigator:{serviceWorker:{controller:null,addEventListener:()=>assert.fail('First install should not reload')}}});
});

test('all ten games have at least fifteen complete guides without invented playtests',()=>{
 assert.equal(GAMES.length,10);assert.equal(new Set(GAMES.map(g=>g.id)).size,10);
 assert.ok(GUIDES.length>=150);assert.equal(new Set(GUIDES.map(g=>g.id)).size,GUIDES.length);
 for(const game of GAMES)assert.ok(GUIDES.filter(g=>g.game===game.id).length>=15);
 for(const guide of GUIDES){assert.equal(guide.status,'Unverified');assert.equal(guide.playtested,null);assert.ok(new URL(guide.source).protocol==='https:');assert.ok(guide.steps.length>=3);for(const key of ['needs','success','trouble'])assert.ok(guide[key]?.length>10,guide.id+' missing '+key);}
});
test('search supports Chinese and combined English terms',()=>{
 assert.equal(filterGuides({query:'鳴潮'}).length,16);
 assert.ok(filterGuides({query:'minecraft commands'}).some(g=>g.id==='minecraft-java-lan')); // Commands are mentioned inside the LAN guide body.
 assert.deepEqual(filterGuides({query:'mincraft command'}).map(g=>g.id),filterGuides({query:'minecraft commands'}).map(g=>g.id));
 assert.equal(filterGuides({query:'fortntie'}).length,16);
 assert.equal(filterGuides({query:'gta5'}).length,16);
 assert.ok(filterGuides({query:'原神任務'}).some(g=>g.id==='genshin-track-quest'));assert.ok(filterGuides({query:'原神任務'}).every(g=>g.game==='genshin'));
 assert.deepEqual(filterGuides({query:'鳴潮閃避'}).map(g=>g.id),['wuwa-dodge-counter','wuwa-parry']);
 assert.equal(filterGuides({query:'no-such-guide-9876'}).length,0);
});
test('edition and platform filters cannot mix incompatible Minecraft guides',()=>{
 assert.equal(filterGuides({game:'minecraft',edition:'Java'}).length,15);
 assert.equal(filterGuides({game:'minecraft',edition:'Bedrock',platform:'Mobile'}).length,12);
 assert.ok(filterGuides({game:'minecraft',platform:'Mobile'}).every(g=>g.id!=='minecraft-java-commands'));
});
test('Minecraft edition and platform together cannot imply Java on a phone',()=>{
 assert.equal(filterGuides({game:'minecraft',edition:'Java',platform:'Mobile'}).length,0);
});
test('source filters and sort keep the selected game and scope',()=>{
 const list=filterGuides({game:'fortnite',source:'Official',sort:'quick'});
 assert.equal(list.length,16);assert.equal(list[0].id,'fortnite-visual-audio');
 assert.equal(filterGuides({game:'genshin',source:'Official'}).length,14);
});
test('command generator supports both editions and rejects arbitrary input',()=>{
 for(const edition of ['Java','Bedrock']){assert.equal(buildCommand(edition,'day'),'/time set day');assert.equal(buildCommand(edition,'rain'),'/weather rain');}
 assert.throws(()=>buildCommand('Java','delete'));assert.throws(()=>buildCommand('Pocket','day'));
});
test('test records require real fields; future playtest dates are rejected',()=>{
 const guide=GUIDES.find(g=>g.id==='minecraft-java-commands');
 const entry={build:'QA fixture only',platform:'PC',date:'2026-10-06',result:'Worked'};
 assert.equal(validateCheck(entry,guide,'2026-10-06'),true);
 assert.equal(validateCheck({...entry,date:'2027-01-01'},guide,'2026-10-06'),false);
 assert.equal(validateCheck({...entry,platform:'Mobile'},guide),false);
 assert.equal(validateCheck({...entry,build:' '},guide),false);
 assert.equal(validateStudy({participant:'Nami',seconds:0,device:'QA',notes:'UI test only',revision:'No peer feedback asserted',success:'Yes'}),true);
 assert.equal(validateStudy({participant:'Nami',seconds:-1}),false);
});
test('API requests all ten games without requiring a secret',()=>{
 const u=new URL(makeApiUrl());assert.equal(u.hostname,'en.wikipedia.org');assert.equal(u.searchParams.get('titles').split('|').length,10);assert.equal(u.searchParams.get('origin'),'*');
});
test('live metadata caches and survives both network and malformed responses',async()=>{
 const memory=new Map();globalThis.localStorage={getItem:k=>memory.get(k),setItem:(k,v)=>memory.set(k,v)};
 const originalFetch=globalThis.fetch;
 try{
 globalThis.fetch=async()=>({ok:true,json:async()=>({query:{pages:[{title:'Minecraft',extract:'A live API test overview.',fullurl:'https://en.wikipedia.org/wiki/Minecraft'}]}})});
 assert.equal((await refreshMetadata(true)).state.mode,'live');assert.equal(getMetadata().minecraft.extract,'A live API test overview.');
 globalThis.fetch=async()=>{throw new Error('offline');};
 assert.equal((await refreshMetadata()).state.mode,'cache');assert.equal((await refreshMetadata(true)).state.mode,'fallback');assert.equal(getMetadata().minecraft.extract,'A live API test overview.');
 globalThis.fetch=async()=>({ok:true,json:async()=>({error:{code:'bad'}})});
 assert.equal((await refreshMetadata(true)).state.mode,'fallback');
 }finally{globalThis.fetch=originalFetch;delete globalThis.localStorage;}
});
test('service worker precaches all content, tools and ten photographs',async()=>{
 const manifest=JSON.parse(await readFile(new URL('../public/manifest.webmanifest',import.meta.url)));
 assert.equal(manifest.display,'standalone');
 for(const icon of manifest.icons)await access(new URL('../public/'+icon.src,import.meta.url));
 await access(new URL('../public/assets/og.png',import.meta.url));
 await access(new URL('../public/improvements.css',import.meta.url));
 const sw=await readFile(new URL('../public/sw.js',import.meta.url),'utf8');
 assert.ok(sw.includes('/data.js'));assert.ok(sw.includes('/snapshot.js'));
 assert.ok(sw.includes('/site-bundle.css')); 
 const events={};let files=[];
 const context={URL,Request,self:{location:'https://example.test/sw.js',addEventListener:(name,fn)=>events[name]=fn,skipWaiting:async()=>{}},caches:{open:async()=>({addAll:async list=>{assert.ok(list.every(r=>r.cache===(new URL(r.url).pathname.startsWith('/release/')?'default':'reload')));files=list.map(r=>'.'+new URL(r.url).pathname);}})}};
 vm.runInNewContext(sw,context);let installation;events.install({waitUntil:p=>installation=p});await installation;
 for(const f of files.filter(x=>x!=='./'))await access(new URL('../public/'+f.slice(2),import.meta.url));
 for(const game of GAMES)assert.ok(files.includes('./assets/'+game.id+'.webp'));
 assert.ok(files.some(f=>f.endsWith('/guide-content.js')));assert.ok(files.some(f=>f.endsWith('/workspace.js')));assert.ok(!files.some(f=>f.endsWith('/image-manifest.js')));
});
