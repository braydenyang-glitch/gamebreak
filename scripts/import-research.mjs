import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {COLLECTIONS,normalizeCollection} from '../dist/catalog-api.js';
const input=new URL('../../output/api-research/',import.meta.url),dist=new URL('../dist/',import.meta.url);
const sources=JSON.parse(await readFile(new URL('sources.json',input)));
const images=JSON.parse(await readFile(new URL('minecraft-image-map.json',input)));
const findings=JSON.parse(await readFile(new URL('findings.json',input)));
const index={};await mkdir(new URL('catalog/',dist),{recursive:true});
for(const c of COLLECTIONS.filter(x=>x.kind!=='curated')){
 const raw=JSON.parse(await readFile(new URL(c.id+'.json',input)));const data=normalizeCollection(c.id,raw,{images});
 const source=sources.find(s=>s.file===c.id+'.json');
 const snapshot={...data,retrievedAt:source.retrievedAt,version:c.version||null,mode:'snapshot'};
 await writeFile(new URL('catalog/'+c.id+'.json',dist),JSON.stringify(snapshot));
 index[c.id]={count:data.entries.length,retrievedAt:source.retrievedAt,version:c.version||null};
}
await writeFile(new URL('catalog-index.js',dist),'export const CATALOG_INDEX='+JSON.stringify(index)+';\n');
await mkdir(new URL('downloads/',dist),{recursive:true});
await writeFile(new URL('downloads/gamebreak-source-register.json',dist),JSON.stringify({preparedOn:'2026-10-15',notice:'Independent student reference project. Retrieval is not gameplay verification. Game imagery belongs to its publishers.',collections:COLLECTIONS.map(c=>({...c,...index[c.id]})),licenses:findings.recommendations,artwork:'Game identification images are publisher artwork. Minecraft texture inventory uses exact-name matches from minecraft-assets 1.21.8; missing textures use a generic symbol.',brawlNotice:'This material is unofficial and is not endorsed by Supercell. See https://supercell.com/en/fan-content-policy/'},null,2));
console.log(index);
