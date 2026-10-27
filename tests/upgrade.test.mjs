import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {compareCrafts,compareTeams,orderedRoute,moveRoute,unreadUpdates,scenarioSteps} from '../public/upgrade-data.js';
import {GUIDES} from '../public/data.js';
import {CHALLENGES} from '../public/visual-data.js';
import {readRoute} from '../public/routes.js';
const recipes=JSON.parse(await readFile(new URL('../public/catalog/minecraft-recipes.json',import.meta.url))).starterRecipes;

test('A/B crafting uses independent inventories and preserves the caller inventory',()=>{
 const inventory={oak_log:1},plan={item:'crafting_table',quantity:1};
 const result=compareCrafts(recipes,plan,plan,inventory);
 assert.deepEqual(result.a,result.b);assert.deepEqual(result.a.raw,{});assert.deepEqual(inventory,{oak_log:1});
 assert.throws(()=>compareCrafts(recipes,{...plan,quantity:-1},plan),/Choose/);
});
test('team comparison rejects alternate forms together and reports attributes without scoring',()=>{
 const a=[{id:'8001',name:'Trailblazer',element:'Physical',path:'Destruction'}];
 const b=[{id:'1001',name:'March 7th',element:'Ice',path:'Preservation'}];
 assert.equal(compareTeams(a,b).b.sustain,true);assert.equal(compareTeams(a,b).a.sustain,false);
 assert.throws(()=>compareTeams([...a,{...a[0],id:'8002'}],b),/one form/);
});
test('route order removes stale and duplicate points, reorders safely, and never mutates inputs',()=>{
 const ids=['b','a','b','gone'],markers=[{id:'a'},{id:'b'}];
 assert.deepEqual(orderedRoute(markers,ids),[{id:'b'},{id:'a'}]);
 assert.deepEqual(moveRoute(['a','b'],0,1),['b','a']);assert.deepEqual(moveRoute(['a','b'],0,-1),['a','b']);
 assert.deepEqual(ids,['b','a','b','gone']);
});
test('inbox picks the newest followed revision regardless of response order',()=>{
 const revisions=[{id:'old',guideId:'g',date:'2026-01-01'},{id:'new',guideId:'g',date:'2026-02-01'},{id:'other',guideId:'x',date:'2026-03-01'}];
 assert.deepEqual(unreadUpdates(revisions,['g'],{g:'old'}),[{id:'new',guideId:'g',date:'2026-02-01',unread:true}]);
 assert.equal(unreadUpdates(revisions.reverse(),['g'],{g:'new'})[0].unread,false);
});
test('ten mission exercises retain exact source guide step order and support direct linking',()=>{
 for(const c of CHALLENGES){const g=GUIDES.find(g=>g.id===c.guide);const steps=scenarioSteps(g);assert.ok(steps.length>=2);assert.deepEqual(steps.map(s=>s.text),g.steps.slice(0,4));}
 assert.equal(readRoute('/studio/?game=starrail').page,'studio');
});
