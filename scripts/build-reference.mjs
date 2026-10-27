import {readFile,writeFile} from 'node:fs/promises';
const root=new URL('../public/',import.meta.url);
const expanded=JSON.parse(await readFile(new URL('catalog/expanded-reference.json',root)));
await writeFile(new URL('expanded-collections.js',root),'// Generated from source-reviewed reference articles.\nexport const EXPANDED_COLLECTIONS='+JSON.stringify(expanded.collections)+';\n');
for(const [id,data]of Object.entries(expanded.datasets))await writeFile(new URL('catalog/'+id+'.json',root),JSON.stringify(data));
const {COLLECTIONS}=await import('../public/catalog-api.js');
const index={};for(const c of COLLECTIONS){const d=JSON.parse(await readFile(new URL('catalog/'+c.id+'.json',root)));index[c.id]={count:d.entries.length,retrievedAt:d.retrievedAt,version:d.version||c.version||null,kind:c.kind};}
await writeFile(new URL('catalog-index.js',root),'export const CATALOG_INDEX='+JSON.stringify(index)+';\n');
console.log('Built reference collection index and 40 expanded entries.');

const translations=await Promise.all(['zh','ja'].map(async l=>JSON.parse(await readFile(new URL('catalog/guide-'+l+'.json',root)))));const {GUIDES}=await import('../public/data.js');await writeFile(new URL('catalog/guide-search-names.json',root),JSON.stringify(Object.fromEntries(GUIDES.map(g=>[g.id,translations.map(t=>t[g.id]?.title).filter(Boolean)]))));
