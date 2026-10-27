import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {IMAGE_MANIFEST,ENTITY_IMAGES,MISSING_IMAGES,IMAGE_AUDIT} from '../public/image-manifest.js';
import {imageSource,imageTag,referenceArt,loadMedia} from '../public/media.js';

await loadMedia();
test('every cached image is a real bundled WebP and no manifest path escapes assets',async()=>{
 const paths=new Set([...Object.values(IMAGE_MANIFEST),...Object.values(ENTITY_IMAGES)]);
 let bytes=0;
 for(const path of paths){
  assert.match(path,/^\/assets\/catalog\/[a-f0-9]+\.webp$/);
  const file=await readFile(new URL('../public'+path,import.meta.url));
  assert.equal(file.toString('ascii',0,4),'RIFF',path);
  assert.equal(file.toString('ascii',8,12),'WEBP',path);
  bytes+=file.length;
 }
 assert.equal(paths.size,IMAGE_AUDIT.uniqueLocalFiles);
 assert.ok(bytes<40*1024*1024,'Image cache stays below the stated size budget');
});

test('Genshin portraits and weapons always resolve to exact local art, including recovered missing URLs',async()=>{
 for(const collection of ['genshin-characters','genshin-weapons']){
  const data=JSON.parse(await readFile(new URL('../public/catalog/'+collection+'.json',import.meta.url)));
  for(const entry of data.entries)assert.match(imageSource(entry.image,{collection,id:entry.id,fallback:entry.imageFallback}),/^\/assets\/catalog\//,entry.name);
 }
 const data=JSON.parse(await readFile(new URL('../public/catalog/genshin-characters.json',import.meta.url)));
 const aether=data.entries.find(x=>x.name==='Aether'),lumine=data.entries.find(x=>x.name==='Lumine');
 assert.notEqual(imageSource(aether.image,{collection:'genshin-characters',id:aether.id}),imageSource(lumine.image,{collection:'genshin-characters',id:lumine.id}));
});

test('known missing upstream images become honest text cards; unknown unsafe URLs cannot render',()=>{
 const entry={id:'missing',name:'Missing <portrait>',kind:'Brawler',image:MISSING_IMAGES[0]};
 assert.equal(imageTag(entry),'');
 assert.ok(referenceArt(entry).includes('Reference note'));
 assert.ok(!referenceArt(entry).includes('<img'));
 assert.ok(!referenceArt(entry).includes('Image unavailable'));
 assert.equal(imageSource('javascript:alert(1)'),'');
 assert.equal(imageSource('/../../etc/passwd'),'');
 const remote=Object.keys(IMAGE_MANIFEST)[0];
 assert.equal(imageSource(remote),IMAGE_MANIFEST[remote]);
});
