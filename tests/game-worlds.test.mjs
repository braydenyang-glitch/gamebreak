import test from 'node:test';
import assert from 'node:assert/strict';
import {access} from 'node:fs/promises';
import {WORLD_SKINS,COMPANIONS,worldAssets,craftingProgress,guideMission} from '../public/game-worlds-data.js';
import {GAMES,GUIDES} from '../public/data.js';
test('each supported game has an identity, an actual mission and offline assets',async()=>{
 assert.deepEqual(Object.keys(WORLD_SKINS).sort(),GAMES.map(g=>g.id).sort());
 for(const g of GAMES){const mission=guideMission(GUIDES,g.id);assert.equal(mission.game,g.id);assert.ok(mission.steps.length);assert.equal(guideMission(GUIDES,g.id,GUIDES.filter(x=>x.game===g.id&&x.steps.length).length).id,mission.id);for(const file of worldAssets(g.id))await access(new URL('../public'+file,import.meta.url));}
 assert.equal(guideMission(GUIDES,'not-a-game'),null);
});
test('crafting needs exactly four filled slots; incomplete grids do not produce a table',()=>{
 assert.deepEqual(craftingProgress([true,false,true,false]),{count:2,complete:false});
 assert.equal(craftingProgress([true,true,true,true]).complete,true);
 assert.equal(craftingProgress([true,true,true,true,true]).complete,false);
 assert.equal(craftingProgress([1,1,1,1]).complete,false);
 assert.equal(craftingProgress(null).complete,false);
});
test('companion artwork and profiles match actual catalog records',async()=>{
 const {readFile}=await import('node:fs/promises');const data=JSON.parse(await readFile(new URL('../public/catalog/genshin-characters.json',import.meta.url)));
 for(const c of COMPANIONS){assert.equal(data.entries.find(x=>x.id===c.entry)?.name,c.name[0]);await access(new URL('../public/assets/worlds/'+c.id+'.png',import.meta.url));}
});
