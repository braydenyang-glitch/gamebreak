import {worldAssets} from '../public/game-worlds-data.js';
import {readFile,writeFile,stat,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {GAMES,GUIDES} from '../public/data.js';
import {COLLECTIONS} from '../public/catalog-api.js';
import {imageSource,loadMedia} from '../public/media.js';
await loadMedia();
const root=new URL('../public/',import.meta.url),html=await readFile(new URL('index.html',root),'utf8'),release=html.match(/\/release\/([a-f0-9]+)\/app.js/)[1];
const releaseFiles=(await readdir(new URL('release/'+release+'/',root))).map(n=>'/release/'+release+'/'+n);
const sharedFiles=[...releaseFiles,'/manifest-en.webmanifest','/manifest-zh-Hant.webmanifest','/manifest-ja.webmanifest','/catalog/guide-zh.json','/catalog/guide-ja.json','/catalog/handbook-zh.json','/catalog/handbook-ja.json','/catalog/ui-zh.json','/catalog/ui-ja.json','/catalog/ui-extra.json','/catalog/guide-search-names.json','/catalog/reference-locales.json','/catalog/expanded-reference-locales.json','/catalog/depth-names.json','/index.html'];
const shared={files:sharedFiles,bytes:0};for(const f of shared.files)shared.bytes+=(await stat(new URL(f.slice(1),root))).size;
const dossierMedia=JSON.parse(await readFile(new URL('catalog/dossier-media.json',root)));
const packs={};
for(const game of GAMES){const files=new Set(['/catalog/media/'+game.id+'.json','/games/'+game.id+'/', '/wiki/'+game.id+'/', '/assets/'+game.id+'.webp','/downloads/'+game.id+'-guides.md']);
 for(const locale of ['en','zh','ja'])files.add('/catalog/depth/'+locale+'/'+game.id+'.json');
 for(const locale of ['en','zh-Hant','ja']){files.add('/'+locale+'/games/'+game.id+'/');files.add('/'+locale+'/wiki/'+game.id+'/');files.add('/downloads/'+locale+'/'+game.id+'-guides.md');files.add('/downloads/'+locale+'/'+game.id+'-field-manual.md');}
 if(['genshin','minecraft','starrail'].includes(game.id))files.add('/catalog/locales/'+game.id+'.json');
 for(const g of GUIDES.filter(g=>g.game===game.id)){files.add('/guides/'+g.id+'/');for(const locale of ['en','zh-Hant','ja'])files.add('/'+locale+'/guides/'+g.id+'/');if(g.diagram)files.add(g.diagram);}
 for(const c of COLLECTIONS.filter(c=>c.game===game.id)){files.add('/catalog/'+c.id+'.json');const data=JSON.parse(await readFile(new URL('catalog/'+c.id+'.json',root)));for(const entry of data.entries.slice(0,24)){const src=imageSource(entry.image,{collection:c.id,id:entry.id});if(src.startsWith('/assets/'))files.add(src);}}
 if(['genshin','starrail','minecraft'].includes(game.id))files.add('/catalog/'+({genshin:'genshin-tools',starrail:'hsr-roster',minecraft:'minecraft-recipes'}[game.id])+'.json');
 if(game.id==='starrail'){const roster=JSON.parse(await readFile(new URL('catalog/hsr-roster.json',root)));for(const c of roster.entries)files.add(c.localIcon);}
 if(['gta','fortnite'].includes(game.id)){files.add('/catalog/atlas.json');if(game.id==='fortnite')files.add('/assets/atlas/fortnite.png');}
 for(const media of dossierMedia.filter(m=>m.game===game.id))files.add(media.src);
 for(const asset of worldAssets(game.id))files.add(asset);
 let bytes=0;for(const f of files)bytes+=(await stat(new URL(f.slice(1)+(f.endsWith('/')?'index.html':''),root))).size;
 packs[game.id]={files:[...files],bytes,guides:GUIDES.filter(g=>g.game===game.id).length};}
const digest=createHash('sha256').update(release+JSON.stringify(packs));for(const file of new Set([...shared.files,...Object.values(packs).flatMap(p=>p.files)])){digest.update(file).update(await readFile(new URL(file.slice(1)+(file.endsWith('/')?'index.html':''),root)));}const version=digest.digest('hex').slice(0,12);await writeFile(new URL('offline-packs.json',root),JSON.stringify({version,shared,packs}));console.log('Built 10 downloadable offline packs.');
