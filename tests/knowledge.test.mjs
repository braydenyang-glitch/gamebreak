import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {GAMES,GUIDES} from '../public/data.js';
import {COLLECTIONS} from '../public/catalog-api.js';
import {RECIPES} from '../public/tool-data.js';
import {KNOWLEDGE_THEMES,addComparison,cleanComparison,comparisonRows,entryHref,recipeForEntry,recipeIngredients,relatedGuides,toolEntryHref} from '../public/knowledge-data.js';
const snapshot=async id=>JSON.parse(await readFile(new URL('../public/catalog/'+id+'.json',import.meta.url),'utf8'));
test('all ten themed archives have a real collection and valid featured entry',async()=>{
 for(const game of GAMES){const t=KNOWLEDGE_THEMES[game.id];assert.ok(t);const c=COLLECTIONS.find(c=>c.id===t.collection);assert.equal(c.game,game.id);const data=await snapshot(c.id);assert.ok(data.entries.length);if(t.feature)assert.ok(data.entries.some(x=>x.id===t.feature),game.id);}
});
test('comparison limits preserve edition and collection scope and allow removal',()=>{
 const a={game:'minecraft',collection:'minecraft-pc-items',id:'333'},b={...a,id:'937'},c={...a,id:'939'},wrong={game:'minecraft',collection:'minecraft-bedrock-items',id:'58'};
 const first=addComparison([],a,COLLECTIONS);assert.deepEqual(first.items,[a]);
 assert.equal(addComparison(first.items,wrong,COLLECTIONS).error,'collection');
 assert.deepEqual(addComparison(first.items,a,COLLECTIONS).items,[]);
 assert.equal(addComparison([a,b,c],{...a,id:'999'},COLLECTIONS).error,'full');
 assert.deepEqual(cleanComparison([null,{collection:'made-up',game:'gta',id:'x'},a,a],COLLECTIONS),[a]);
 const rows=comparisonRows([{facts:[['Damage','0']]},{facts:[['Ammo','9 mm']]}]);assert.deepEqual(rows[0],['Damage','0','—']);
});
test('crafting details and deep links keep Java and Bedrock ingredients distinct',async()=>{
 for(const id of ['minecraft-pc-items','minecraft-bedrock-items']){const cfg=COLLECTIONS.find(c=>c.id===id),data=await snapshot(id),entry=data.entries.find(x=>x.name==='Crafting Table');const recipe=recipeForEntry(entry,RECIPES);assert.equal(recipe.id,'crafting_table');const ingredients=recipeIngredients(recipe,id.includes('bedrock'));assert.equal(ingredients[0].count,4);assert.equal(ingredients[0].tag,id.includes('bedrock'));const u=new URL(toolEntryHref(cfg,entry,RECIPES),'https://gamebreak.test');assert.equal(u.searchParams.get('recipe'),'crafting_table');if(!id.includes('bedrock'))assert.equal(u.searchParams.get('platform'),'PC');assert.equal(u.searchParams.get('edition'),id.includes('bedrock')?'Bedrock':'Java');}
});
test('reference connections keep selected entities and do not cross games',async()=>{
 const cfg=COLLECTIONS.find(c=>c.id==='genshin-characters'),data=await snapshot(cfg.id),entry=data.entries.find(x=>x.name==='Nahida');assert.ok(relatedGuides(cfg.game,entry,GUIDES).every(g=>g.game==='genshin'));const u=new URL(toolEntryHref(cfg,entry),'https://gamebreak.test');assert.equal(u.searchParams.get('entry'),entry.id);assert.equal(u.searchParams.get('collection'),cfg.id);assert.equal(new URL(entryHref('genshin',cfg.id,'a&b'),'https://gamebreak.test').searchParams.get('entry'),'a&b');
});
test('Delta weapon references have provenance without manufactured performance',async()=>{
 const cfg=COLLECTIONS.find(c=>c.id==='delta-weapons-reference'),data=await snapshot(cfg.id);assert.equal(data.entries.length,6);for(const entry of data.entries){assert.ok(entry.source.startsWith('https://deltaforcedb.com/weapon/'));assert.ok(entry.sourceChecked);assert.equal(entry.playtested,null);assert.ok(entry.facts.some(([k])=>k==='Ammunition family'));assert.ok(!entry.facts.some(([k])=>/DPS|Damage|Fire rate|Recoil/.test(k)));assert.equal(new URL(toolEntryHref(cfg,entry),'https://gamebreak.test').searchParams.get('weapon'),entry.name);}
});
