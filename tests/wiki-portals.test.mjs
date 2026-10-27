import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import {PORTALS,BEDROCK_COMMANDS,JAVA_COMMANDS} from '../public/wiki-portal-data.js';
import {GAMES,GUIDES,filterGuides} from '../public/data.js';
import {HANDBOOK} from '../public/handbook.js';
import {PORTAL_TOPICS,portalDirectory,filterDirectory,checklistProgress,portalHref,textMatches,guideTopic} from '../public/wiki-portal-model.js';
import {readRoute} from '../public/routes.js';

test('topic filters remain meaningful after titles are translated',()=>{
 for(const title of ['Elemental reactions','元素反應','元素反応'])assert.equal(guideTopic({id:'genshin-elemental-reactions',title}),'combat');
 assert.equal(guideTopic({id:'genshin-encounter-point-claims',title:'領取每日委託獎勵',keywords:['combat']}),'resources');
 assert.equal(guideTopic({id:'genshin-artifacts',title:'聖遺物部位與屬性'}),'teams');
});

test('all ten portals have real introductions and source-linked manuals in three languages',()=>{
 assert.equal(PORTALS.length,10);assert.equal(new Set(PORTALS.map(p=>p.game)).size,10);
 for(const game of GAMES){const p=PORTALS.find(p=>p.game===game.id);assert.equal(p.articles.length,6);for(const text of [p.intro.tagline,p.intro.summary,...p.intro.loop,...p.intro.start,...p.intro.pitfalls]){assert.equal(text.length,3);assert.ok(text.every(s=>typeof s==='string'&&s.length>5));}
  const topics=new Set();for(const a of p.articles){topics.add(a.topic);assert.ok(PORTAL_TOPICS[a.topic]);assert.ok(a.steps.length>=4);for(const text of [a.title,a.summary,a.scope,...a.steps,...a.cautions]){assert.equal(text.length,3);assert.ok(text.every(s=>typeof s==='string'&&s.length>5));}assert.ok(a.sources.length);for(const s of a.sources)assert.equal(new URL(s.url).protocol,'https:');assert.match(a.reviewedAt,/^\d{4}-\d{2}-\d{2}$/);}assert.ok(topics.size>=5);
 }
});
test('localized manual downloads and article routes preserve game and article identity',async()=>{
 for(const locale of ['en','zh-Hant','ja']){for(const game of GAMES){for(const a of PORTALS.find(p=>p.game===game.id).articles){const r=readRoute('/'+locale+portalHref(game.id,{manual:a.id}));assert.equal(r.page,'wiki');assert.equal(r.id,game.id);assert.equal(r.query.get('manual'),a.id);}
 const text=await readFile(new URL(`../public/downloads/${locale}/${game.id}-field-manual.md`,import.meta.url),'utf8');assert.ok(text.length>1000);assert.ok(text.includes(PORTALS.find(p=>p.game===game.id).articles[0].title[locale==='en'?0:locale==='zh-Hant'?1:2]));}}
});
test('directory searches article bodies, handles synonyms and preserves topic/type filters',()=>{
 const entries=portalDirectory('genshin',{portals:PORTALS,guides:GUIDES,handbook:HANDBOOK,locale:'zh-Hant'});assert.ok(entries.length>=25);assert.ok(entries.every(e=>e.game==='genshin'));
 assert.ok(filterDirectory(entries,{q:'配隊',topic:'teams',kind:'manual'}).length);assert.ok(filterDirectory(entries,{q:'抽卡',topic:'gacha'}).length);
 assert.equal(filterDirectory(entries,{q:'impossibleword987654'}).length,0);
 assert.ok(textMatches('原神攻擊','Genshin attack timing'));assert.ok(textMatches('ダイヤモンド','diamond pickaxe'));
 assert.ok(filterGuides({query:'minecraft commands'}).some(g=>g.id==='minecraft-java-lan'));
});
test('Bedrock directory contains every captured official index row and distinguishes permissions',async()=>{
 const source=JSON.parse(await readFile(new URL('../content/bedrock-command-index.json',import.meta.url)));
 assert.equal(BEDROCK_COMMANDS.entries.length,source.entries.length);assert.ok(source.entries.length>=80);assert.equal(new Set(source.entries.map(c=>c.name)).size,source.entries.length);
 for(const c of BEDROCK_COMMANDS.entries){assert.match(c.name,/^\/[a-z]+$/);assert.equal(new URL(c.url).hostname,'learn.microsoft.com');assert.equal(c.label.length,3);assert.equal(typeof c.cheats,'boolean');assert.ok(c.permission);}
 assert.equal(BEDROCK_COMMANDS.entries.find(c=>c.name==='/help').cheats,false);assert.equal(BEDROCK_COMMANDS.entries.find(c=>c.name==='/op').permission,'Admin');

});
test('checklist values cannot inflate progress or leak another game’s route state',()=>{
 assert.deepEqual(checklistProgress([true,false,true,true],3),{values:[true,false,true],done:2,total:3});assert.equal(checklistProgress(['true',1,null],3).done,0);assert.equal(checklistProgress(null,3).done,0);
 const href=portalHref('minecraft',{view:'directory',q:'diamond & coal',topic:'resources'}),r=readRoute(href);assert.equal(r.query.get('q'),'diamond & coal');assert.equal(r.query.get('topic'),'resources');
});

test('Java commands retain their own operator levels and source links',()=>{
 assert.ok(JAVA_COMMANDS.entries.length>=90);assert.equal(JAVA_COMMANDS.entries.find(c=>c.name==='/help').level,'0');
 for(const c of JAVA_COMMANDS.entries){assert.equal(new URL(c.url).hostname,'minecraft.wiki');assert.equal(c.label.length,3);assert.match(c.level,/^[0-4]/);}
 assert.ok(JAVA_COMMANDS.entries.some(c=>c.name==='/advancement'));assert.ok(!JAVA_COMMANDS.entries.some(c=>c.name==='/aimassist'));assert.equal(JAVA_COMMANDS.entries.find(c=>c.name==='/advancement').level,'2');
});
