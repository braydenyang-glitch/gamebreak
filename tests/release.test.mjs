import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
const root=new URL('../public/',import.meta.url);
test('published HTML loads one complete immutable release with no stale module paths',async()=>{
 const html=await readFile(new URL('index.html',root),'utf8');
 const entry=html.match(/src="(\/release\/([a-f0-9]+)\/app.js)"/);
 assert.ok(entry,'HTML must select a versioned release');
 const folder=new URL(`release/${entry[2]}/`,root),names=await readdir(folder);
 assert.ok(names.includes('expansion-content.js'));assert.ok(names.includes('media.js'));assert.ok(!names.includes('image-manifest.js'),'image registry loads per game');
 for(const name of names){const built=await readFile(new URL(name,folder),'utf8');assert.equal(built,await readFile(new URL(name,root),'utf8'),name);
  for(const match of built.matchAll(/from ['"]\.\/([^'"]+)['"]/g))assert.ok(names.includes(match[1]),`${name} imports ${match[1]}`);
 }
 const sw=await readFile(new URL('sw.js',root),'utf8');assert.ok(sw.includes(`gamebreak-shell-${entry[2]}`));
 for(const name of names)assert.ok(sw.includes(`./release/${entry[2]}/${name}`));
});
