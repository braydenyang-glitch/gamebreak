import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {CATALOG_INDEX} from '../dist/catalog-index.js';
import {IMAGE_AUDIT} from '../dist/image-manifest.js';
const dist=new URL('../dist/',import.meta.url);
const research=new URL('../research/',import.meta.url);
const parts=await Promise.all(['expansion-a-oct15.json','expansion-b-oct15.json'].map(async name=>JSON.parse(await readFile(new URL(name,research)))));
const guides=parts.flatMap(p=>p.guides),collections=parts.flatMap(p=>p.collections);
if(new Set(guides.map(g=>g.id)).size!==guides.length)throw Error('Duplicate expansion guide');
for(const guide of guides){
 for(const field of ['id','game','title','description','edition','quick','needs','success','trouble','source','sourceName','version'])if(!guide[field])throw Error('Incomplete guide '+guide.id+': '+field);
 if(guide.steps.length<5||guide.playtested!==null)throw Error('Guide scope/step check failed: '+guide.id);
 guide.reviewed=guide.sourceChecked||'2026-10-15';
 guide.status='Unverified';
 if(!guide.read){const words=[guide.quick,...guide.steps,guide.success,guide.trouble].join(' ').split(/\s+/).length;guide.read=Math.ceil(words/220*60/5)*5;}
}
await writeFile(new URL('expansion-content.js',dist),'// Source-reviewed additions. No in-game playtests are claimed.\nexport const EXPANSION_GUIDES='+JSON.stringify(guides,null,2)+';\n');
const index={...CATALOG_INDEX};
const configs=[];
for(const collection of collections){
 const {entries,...config}=collection;
 if(new Set(entries.map(x=>x.id)).size!==entries.length||entries.length<12)throw Error('Invalid reference collection '+collection.id);
 configs.push({...config,provider:'GameBreak · sourced reference',kind:'curated',endpoint:null});
 const snapshot={entries:entries.map(x=>({...x,image:x.image||'',sourceChecked:x.sourceChecked||'2026-10-15'})),meta:{scope:collection.note},mode:'curated',retrievedAt:'2026-10-15T00:00:00Z',version:null};
 await writeFile(new URL('catalog/'+collection.id+'.json',dist),JSON.stringify(snapshot));
 index[collection.id]={count:entries.length,retrievedAt:snapshot.retrievedAt,version:null,kind:'curated'};
}
await writeFile(new URL('curated-collections.js',dist),'// Manually reviewed starter references, not live APIs or complete game databases.\nexport const CURATED_COLLECTIONS='+JSON.stringify(configs,null,2)+';\n');
await writeFile(new URL('catalog-index.js',dist),'export const CATALOG_INDEX='+JSON.stringify(index)+';\n');
const registerFile=new URL('downloads/gamebreak-source-register.json',dist);
const register=JSON.parse(await readFile(registerFile));
register.collections=[...register.collections.filter(c=>!configs.some(x=>x.id===c.id)),...configs.map(c=>({...c,...index[c.id]}))];
register.images={generatedAt:IMAGE_AUDIT.generatedAt,localFiles:IMAGE_AUDIT.uniqueLocalFiles,bytes:IMAGE_AUDIT.totalBytes,notice:'Exact-entity image mapping. Missing upstream art uses text references; no unrelated pictures substituted.',additionalProvider:{name:'Enka.Network documented UI image service',url:'https://github.com/EnkaNetwork/API-docs/blob/master/api.md'}};
register.artwork='Publisher artwork and exact-identifier Minecraft textures. Local WebP copies improve reliability; original image and data attribution remains with the providers. Enka.Network supplies documented UI images for recovered Genshin weapons.';
await writeFile(registerFile,JSON.stringify(register,null,2));
await mkdir(new URL('downloads/',dist),{recursive:true});
await writeFile(new URL('downloads/gamebreak-starter-references.json',dist),JSON.stringify({notice:'Reviewed starter references for six games, not live APIs. Read each entry source and scope.',collections},null,2));
console.log('Imported '+guides.length+' guides and '+collections.reduce((n,c)=>n+c.entries.length,0)+' reference records across '+collections.length+' games.');
