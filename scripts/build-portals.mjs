import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {GAMES} from '../public/data.js';
const base=new URL('../',import.meta.url),portals=[];
for(const name of ['rpg','sandbox','action'])portals.push(...JSON.parse(await readFile(new URL(`content/portal-${name}.json`,base))));
const commands=JSON.parse(await readFile(new URL('content/bedrock-command-index.json',base)));
const java=JSON.parse(await readFile(new URL('content/java-command-index.json',base)));
const ids=new Set();
for(const g of GAMES){const p=portals.find(x=>x.game===g.id);if(!p||p.articles.length<6)throw Error('Incomplete portal: '+g.id);for(const a of p.articles){if(ids.has(a.id))throw Error('Duplicate manual '+a.id);ids.add(a.id);for(const s of [a.title,a.summary,a.scope,...a.steps,...a.cautions])if(!Array.isArray(s)||s.length!==3||s.some(t=>!t))throw Error('Missing manual translation '+a.id);if(a.steps.length<4||!a.sources.length)throw Error('Incomplete manual '+a.id);for(const s of a.sources)if(new URL(s.url).protocol!=='https:')throw Error('Invalid source '+a.id);}}
await writeFile(new URL('public/wiki-portal-data.js',base),'// Generated from source-reviewed, original editorial summaries. Not gameplay verified.\nexport const PORTALS='+JSON.stringify(portals)+';\nexport const BEDROCK_COMMANDS='+JSON.stringify(commands)+';\nexport const JAVA_COMMANDS='+JSON.stringify(java)+';\n');
for(const [i,locale] of ['en','zh-Hant','ja'].entries()){
 const dir=new URL(`public/downloads/${locale}/`,base);await mkdir(dir,{recursive:true});
 for(const p of portals){const body=`# GameBreak — ${GAMES.find(g=>g.id===p.game).name}\n\n${p.intro.summary[i]}\n\n`+p.articles.map(a=>`## ${a.title[i]}\n\n${a.summary[i]}\n\n${a.scope[i]}\n\n${a.steps.map((s,j)=>`${j+1}. ${s[i]}`).join('\n')}\n\n${a.cautions.map(s=>s[i]).join('\n\n')}\n\n${a.sources.map(s=>`- [${s.label}](${s.url})`).join('\n')}\n\n2026-10-27 · ${['Source reviewed; not playtested.','已核對來源；尚未遊戲實測。','出典確認済み・ゲーム内未検証。'][i]}\n`).join('\n---\n\n');await writeFile(new URL(`${p.game}-field-manual.md`,dir),body);}
}
console.log(`Built ${portals.length} game introductions, ${ids.size} manuals in 3 languages and ${commands.entries.length} official command references.`);
