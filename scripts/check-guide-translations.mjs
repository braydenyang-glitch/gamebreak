// Validate content-only translations without altering source verification or gameplay evidence.
import fs from 'node:fs';
import {GUIDES} from '../public/data.js';
const locale=process.argv[2]||'ja';
if(!['ja','zh'].includes(locale))throw new Error('Supported translation packs: ja, zh');
const file=new URL(`../public/catalog/guide-${locale}.json`,import.meta.url);
const pack=JSON.parse(fs.readFileSync(file,'utf8'));
const errors=[];
const sourceIds=new Set(GUIDES.map(g=>g.id));
const required=['title','description','quick','note','needs','success','trouble'];
const immutable=['id','game','source','sourceName','sourceType','sourceLinks','status','playtested','reviewed','read','platforms','updatedAt'];
for(const id of Object.keys(pack))if(!sourceIds.has(id))errors.push(`${id}: no source guide`);
for(const g of GUIDES){
 const t=pack[g.id];
 if(!t||typeof t!=='object'||Array.isArray(t)){errors.push(`${g.id}: missing translation`);continue;}
 for(const k of required)if(typeof t[k]!=='string'||!t[k].trim())errors.push(`${g.id}.${k}: missing text`);
 if(!Array.isArray(t.steps)||t.steps.length!==g.steps.length||t.steps.some(s=>typeof s!=='string'||!s.trim()))errors.push(`${g.id}.steps: incomplete or different step count`);
 for(const k of immutable)if(k in t)errors.push(`${g.id}.${k}: translation must not overwrite source metadata`);
 if(locale==='ja'){
  for(const k of ['edition','version'])if(typeof t[k]!=='string'||!t[k].trim())errors.push(`${g.id}.${k}: missing scope label`);
  if(!/[\u3040-\u30ff]/u.test(t.title||''))errors.push(`${g.id}.title: Japanese script missing`);
  if(g.diagramCaption&&!t.diagramCaption)errors.push(`${g.id}.diagramCaption: missing translation`);
  if(g.troubleshooting?.length!==t.troubleshooting?.length)errors.push(`${g.id}.troubleshooting: different item count`);
  if(g.checklist&&JSON.stringify(g.checklist)!==JSON.stringify(t.checklist))errors.push(`${g.id}.checklist: preserve exact official mission identifiers`);
 }
 for(const [i,row]of (t.troubleshooting||[]).entries())if(typeof row!=='string'&&(!row?.problem?.trim()||!row?.solution?.trim()))errors.push(`${g.id}.troubleshooting[${i}]: missing content`);
}
if(errors.length){console.error(errors.join('\n'));process.exitCode=1;}
else console.log(`${locale}: ${GUIDES.length} guides, ${GUIDES.reduce((n,g)=>n+g.steps.length,0)} matching steps; source identities and verification metadata untouched.`);
