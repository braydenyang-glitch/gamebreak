import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {formatSkillText,baseStats,craftingTotals,youtubeVideoId,mergeDepth} from '../public/reference-depth.js';
const read=async name=>JSON.parse(await readFile(new URL('../public/catalog/'+name+'.json',import.meta.url),'utf8'));

test('provider skill parameters preserve percentage units, zero and missing data',()=>{
 assert.equal(formatSkillText('Deals #1[i]% damage for #2[i] turns.',[1.2,3]),'Deals 120% damage for 3 turns.');
 assert.equal(formatSkillText('{param1:F1P} / {param2:I}',[.075,0]),'7.5% / 0');
 assert.equal(formatSkillText('#1[i]% / #2[i]',[]),'— / —');
 assert.equal(formatSkillText('{RUBY_B#きおく}記憶{RUBY_E#} #1[i]ターン',[3]),'記憶 3ターン');
});
test('Genshin sparse source parameter IDs retain plunge damage columns',async()=>{const d=(await read('depth/en/genshin')).entries['genshin-characters']['10000002'].locales.en;const row=d.skills[0].metrics.find(m=>m.label.includes('Low/High Plunge'));assert.ok(row);assert.equal(row.values[0],'127.84%/159.68%');});

test('Star Rail base values follow the pinned promotion formula and valid level gates',async()=>{
 const d=(await read('depth/en/starrail')).entries['hsr-character-forms']['1001'].locales.en;
 assert.equal(Object.fromEntries(baseStats(d.stats,1,0)).hp,144);
 assert.ok(Math.abs(Object.fromEntries(baseStats(d.stats,80,6)).hp-1058.4)<.001);
 assert.deepEqual(baseStats(d.stats,80,0),[]);
 assert.deepEqual(baseStats(d.stats,1,6),[]);
 assert.deepEqual(baseStats(d.stats,10.5,0),[]);
 assert.deepEqual(baseStats(d.stats,1,-1),[]);
});
test('crafting quantities round whole batches and preserve material identity',async()=>{
 const data=await read('depth/en/minecraft'),d=data.entries['minecraft-pc-items']['333'].locales.en;
 const recipe=d.recipes[0],totals=craftingTotals(recipe,3);
 assert.equal(totals.batches,3);assert.equal(totals.ingredients.reduce((n,x)=>n+x.count,0),12);
 assert.equal(craftingTotals({outputCount:4,ingredients:[{id:'wood',count:1}]},5).ingredients[0].count,2);
 assert.throws(()=>craftingTotals(recipe,-1));assert.throws(()=>craftingTotals(recipe,1.5));
 assert.equal(data.entries['minecraft-bedrock-items'],undefined);
 const ids=new Set((await read('minecraft-pc-items')).entries.map(e=>e.id));
 for(const record of Object.values(data.entries['minecraft-pc-items']))for(const r of record.locales.en.recipes||[])for(const item of r.ingredients)assert.ok(ids.has(item.id),item.id);
});
test('every curated dossier resolves in all languages with sources and distinct entity IDs',async()=>{
 const games=new Set(),seen=new Set();
 for(const file of ['rpg','sandbox','action'])for(const x of (await read('dossiers-'+file)).entries){
  games.add(x.game);const key=x.collection+':'+x.entryId;assert.ok(!seen.has(key));seen.add(key);
  const base=(await read(x.collection)).entries.find(e=>String(e.id)===String(x.entryId));assert.ok(base,key);
  for(const lang of ['en','zh','ja']){const d=(await read('depth/'+lang+'/'+x.game)).entries[x.collection][x.entryId],merged=mergeDepth(base,d,lang);assert.ok(merged.depth.editorial);assert.ok(merged.depth.sections.length>=3);for(const section of merged.depth.sections){assert.ok(section.title);assert.ok(section.paragraphs.length);for(const id of section.sourceIds)assert.ok(d.sources.find(s=>s.id===id),key+' '+id);}assert.ok(merged.depth.history.length);}
 }
 assert.equal(games.size,10);assert.equal(seen.size,30);
});
test('new equipment and referenced gallery assets exist with source provenance',async()=>{
 for(const [key,count] of [['hsr-light-cones',170],['hsr-relic-sets',62]]){const data=await read(key);assert.equal(data.entries.length,count);for(const x of data.entries){assert.ok(x.image.startsWith('/assets/hsr-gear/'));assert.ok((await stat(new URL('../public'+x.image,import.meta.url))).size);assert.match(x.imageSourceUrl,/StarRailRes/);}}
 const media=await read('dossier-media');assert.equal(media.length,10);for(const x of media){assert.ok((await stat(new URL('../public'+x.src,import.meta.url))).size);assert.ok(x.sourceUrl.startsWith('https://'));for(const lang of ['en','zh','ja'])assert.ok(x.description[lang]);}
});
test('video embedding rejects untrusted hosts and protocols',()=>{
 assert.equal(youtubeVideoId('https://www.youtube.com/watch?v=hUDhKYxGh0M'),'hUDhKYxGh0M');
 for(const x of ['https://youtube.com.evil.example/watch?v=hUDhKYxGh0M','ftp://youtube.com/watch?v=hUDhKYxGh0M','javascript:alert(1)','https://youtu.be/bad'])assert.equal(youtubeVideoId(x),null);
});
