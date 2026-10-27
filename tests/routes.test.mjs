import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {GAMES,GUIDES} from '../public/data.js';
import {readRoute,routeHref,canonicalHref} from '../public/routes.js';

test('direct page URLs preserve query filters and legacy shared links',()=>{
 for(const page of ['discover','games','guides','tools','saved','testing','about'])assert.equal(readRoute(routeHref(page)).page,page);
 for(const g of GAMES)assert.equal(readRoute(`/games/${g.id}/index.html`).id,g.id);
 for(const g of GUIDES)assert.equal(readRoute(`/guides/${g.id}/`).page,'guide');
 assert.equal(canonicalHref('https://example.test/#/game/minecraft?edition=Java'),'/games/minecraft/?edition=Java');
 assert.equal(canonicalHref('#/discover'),'/');
 assert.equal(readRoute('/guides/?game=minecraft&page=2').query.get('game'),'minecraft');
 assert.equal(readRoute('/unknown/path/').page,'not-found');
});

test('each game and guide has a static entry with its own share metadata and readable content',async()=>{
 for(const [section,items] of [['games',GAMES],['guides',GUIDES]])for(const item of items){
  const path=`/${section}/${item.id}/`,html=await readFile(new URL('../public'+path+'index.html',import.meta.url),'utf8');
  assert.ok(html.includes(`<link rel="canonical" href="https://gamebreak-brayden.yenhui.chatgpt.site/en${path}">`));
  assert.ok(html.includes('<base href="/">'));assert.ok(html.includes('<h1>'));
  if(section==='guides'){assert.ok(html.includes('<h2>Steps</h2>'));assert.ok(html.includes(item.source.replaceAll('&','&amp;')));}
 }
});

test('offline cache serves versioned entry script and deep route navigation',async()=>{
 const sw=await readFile(new URL('../public/sw.js',import.meta.url),'utf8');
 const {default:vm}=await import('node:vm');const handlers={},lookups=[];
 const scope={href:'https://example.test/sw.js',origin:'https://example.test',toString(){return this.href;}};
 vm.runInNewContext(sw,{URL,self:{location:scope,addEventListener:(name,fn)=>handlers[name]=fn},fetch:async()=>{throw Error('Offline');},caches:{match:async(req,options)=>{lookups.push({req,options});return 'cached';}}});
 const entry=sw.match(/\.\/release\/[a-f0-9]+\/app\.js/)[0].slice(1);let response;handlers.fetch({request:{method:'GET',url:'https://example.test'+entry,mode:'cors'},respondWith:p=>response=p});assert.equal(await response,'cached');assert.equal(lookups[0].req.url,'https://example.test'+entry);
 handlers.fetch({request:{method:'GET',url:'https://example.test/guides/minecraft-java-commands/',mode:'navigate'},respondWith:p=>response=p});assert.equal(await response,'cached');assert.equal(lookups[1].req.url,'https://example.test/guides/minecraft-java-commands/');assert.equal(lookups[1].options.ignoreSearch,true);
});
