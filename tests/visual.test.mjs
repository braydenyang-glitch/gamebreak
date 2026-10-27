import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {matchCraft,trimmedGrid,WORLDS,CHALLENGES} from '../public/visual-data.js';
import {GAMES,GUIDES} from '../public/data.js';
import {readRoute,routeHref} from '../public/routes.js';

const {recipes}=JSON.parse(await readFile(new URL('../public/catalog/minecraft-recipes.json',import.meta.url)));
const p='oak_planks',s='stick',n=null;

test('practice crafting recognizes source-backed shapes and output quantities at different positions',()=>{
 assert.deepEqual(matchCraft([p,p,n,p,p,n,n,n,n],recipes),{id:'crafting_table',name:'Crafting Table',count:1});
 assert.equal(matchCraft([n,n,n,n,p,p,n,p,p],recipes)?.id,'crafting_table');
 assert.equal(matchCraft([n,n,p,n,n,p,n,n,n],recipes)?.count,4);
 assert.equal(matchCraft([s,n,s,s,s,s,s,n,s],recipes)?.id,'ladder');
 assert.equal(matchCraft([n,n,n,p,n,p,p,p,p],recipes)?.id,'oak_boat');
});

test('crafting rejects incomplete patterns, extra ingredients, wrong material and unsupported outputs',()=>{
 for(const grid of [[p,p,n,p,n,n,n,n,n],[p,p,s,p,p,n,n,n,n],[s,s,n,s,s,n,n,n,n],Array(9).fill(null)])assert.equal(matchCraft(grid,recipes),null);
 assert.deepEqual(trimmedGrid([null,p,null,null,p,null,null,null,null]),[[p],[p]]);
 assert.deepEqual(trimmedGrid([p]),[]);
 assert.equal(matchCraft([p,n,n,n,n,n,n,n,n],[{id:'unknown',recipes:[{shape:[[p]],outputCount:1}]}]),null);
});

test('crafting matcher supports mirrored shaped references while keeping empty internal cells',()=>{
 const fixture=[{id:'ladder',name:'Pattern fixture',recipes:[{shape:[[s,null],[s,s]],outputCount:1}]}];
 assert.equal(matchCraft([n,s,n,s,s,n,n,n,n],fixture)?.id,'ladder');
 assert.equal(matchCraft([s,s,n,s,s,n,n,n,n],fixture),null);
});

test('all ten world challenges resolve to same-game guides with sources and valid answer choices',()=>{
 assert.deepEqual(Object.keys(WORLDS).sort(),GAMES.map(g=>g.id).sort());
 assert.deepEqual(CHALLENGES.map(c=>c.game).sort(),GAMES.map(g=>g.id).sort());
 for(const challenge of CHALLENGES){
  const guide=GUIDES.find(g=>g.id===challenge.guide);
  assert.equal(guide?.game,challenge.game);
  assert.match(guide.source,/^https:\/\//);
  assert.equal(challenge.a.length,3);
  assert.ok(challenge.correct>=0&&challenge.correct<challenge.a.length);
  assert.ok(challenge.q.every(Boolean)&&challenge.a.every(pair=>pair.length===2&&pair.every(Boolean)));
 }
});

test('play lab can be linked directly with the selected game',()=>{
 const url=routeHref('playroom','',new URLSearchParams({game:'minecraft'}));
 assert.equal(url,'/playroom/?game=minecraft');
 assert.equal(readRoute(url).page,'playroom');
 assert.equal(readRoute(url).query.get('game'),'minecraft');
});
