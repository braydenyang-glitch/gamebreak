import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {ARTIFACTS,filterArtifacts} from '../public/showcase-data.js';
import {GAMES,GUIDES} from '../public/data.js';
import {readRoute} from '../public/routes.js';

test('all ten collection files contain self-contained 3D mesh geometry and three real inspection anchors',async()=>{
 const manifest=JSON.parse(await readFile(new URL('../public/models/v1/manifest.json',import.meta.url)));
 assert.deepEqual(new Set(ARTIFACTS.map(x=>x.id)),new Set(GAMES.map(x=>x.id)));
 for(const a of ARTIFACTS){
  const m=manifest.models.find(m=>m.id===a.id),b=await readFile(new URL('../public'+m.path,import.meta.url));
  assert.equal(b.toString('utf8',0,4),'glTF');assert.equal(b.readUInt32LE(4),2);assert.equal(b.readUInt32LE(8),b.length);assert.equal(b.length,m.bytes);
  const j=JSON.parse(b.toString('utf8',20,20+b.readUInt32LE(12)));
  assert.ok(j.meshes.length>=10);assert.ok(j.materials.length>=3);assert.ok(j.buffers.every(x=>!x.uri));assert.ok(!j.images?.length,'Models must not rely on remote image textures');
  for(const anchor of ['detail1','detail2','detail3'])assert.ok(j.nodes.some(n=>n.name===anchor));
  const position=j.meshes.flatMap(m=>m.primitives).map(p=>j.accessors[p.attributes.POSITION]);assert.ok(position.some(p=>p.max.every((n,i)=>n>p.min[i])),'Real volumetric geometry, not a flat image');
  assert.ok(GUIDES.some(g=>g.id===a.guide&&g.game===a.id));assert.equal(a.parts.length,3);assert.ok(a.parts.every(p=>p.length===4&&p.every(Boolean)));
 }
});
test('3D categories and search narrow the collection without losing direct model links',()=>{
 assert.equal(filterArtifacts('machines').length,3);assert.deepEqual(filterArtifacts('all','方塊').map(a=>a.id),['minecraft']);assert.equal(filterArtifacts('all','not-an-object').length,0);
 for(const a of ARTIFACTS){const r=readRoute('/showcase/?game='+a.id);assert.equal(r.page,'showcase');assert.equal(r.query.get('game'),a.id);}
});
