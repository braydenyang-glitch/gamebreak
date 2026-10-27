import {stat,writeFile,readFile} from 'node:fs/promises';
import {GAMES,GUIDES} from '../public/data.js';
import {IMAGE_MANIFEST} from '../public/image-manifest.js';
import {COLLECTIONS} from '../public/catalog-api.js';
const root=new URL('../public/',import.meta.url),roster=JSON.parse(await readFile(new URL('catalog/hsr-roster.json',root)));
const collections=await Promise.all(COLLECTIONS.map(async c=>JSON.parse(await readFile(new URL('catalog/'+c.id+'.json',root))))),dossiers=JSON.parse(await readFile(new URL('catalog/dossier-media.json',root)));
const paths=[...new Set([...GAMES.map(g=>'/assets/'+g.id+'.webp'),...GUIDES.map(g=>g.diagram).filter(Boolean),...Object.values(IMAGE_MANIFEST),...roster.entries.map(c=>c.localIcon),...collections.flatMap(c=>c.entries.map(e=>e.image).filter(p=>p?.startsWith('/assets/'))),...dossiers.map(m=>m.src),'/assets/atlas/fortnite.png'])];
const missing=[];for(const path of paths){try{if(!(await stat(new URL(path.slice(1),root))).size)missing.push(path);}catch{missing.push(path);}}
await writeFile(new URL('catalog/quality-audit.json',root),JSON.stringify({date:new Date().toISOString(),checked:paths.length,missing}));
console.log(`Quality audit: ${paths.length} asset references; ${missing.length} missing.`);
if(missing.length)throw Error('Missing referenced assets: '+missing.join(', '));
