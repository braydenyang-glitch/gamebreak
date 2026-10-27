import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {GAMES} from '../public/data.js';
const root=new URL('../public/',import.meta.url),read=async file=>JSON.parse(await readFile(new URL(file,root),'utf8'));
const games=Object.fromEntries(GAMES.map(g=>[g.id,{entries:{}}]));
for(const game of ['genshin','starrail','minecraft'])games[game]=JSON.parse(await readFile(new URL('../content/entry-depth/'+game+'.json',import.meta.url),'utf8'));
const localeText=(value,lang)=>typeof value==='object'?(value[lang]??value.en):value;
const index={};
const references=await read('catalog/reference-locales.json'),expanded=await read('catalog/expanded-reference-locales.json');
const media=await read('catalog/dossier-media.json');
for(const file of ['dossiers-rpg','dossiers-sandbox','dossiers-action']){
 let bundle;try{bundle=await read('catalog/'+file+'.json');}catch{console.warn('Research pack pending:',file);continue;}
 for(const x of bundle.entries){
  const pack=games[x.game];if(!pack)throw Error('Unknown dossier game '+x.game);
  const dataset=await read('catalog/'+x.collection+'.json'),base=dataset.entries.find(e=>String(e.id)===String(x.entryId));if(!base)throw Error('Dossier target missing: '+x.collection+':'+x.entryId);
  pack.entries[x.collection]??={};const d=pack.entries[x.collection][x.entryId]??={locales:{}};d.layout=x.layout;d.editorialReviewedAt=bundle.reviewedAt;d.editorial=true;
  d.sources=[...(d.sources||[]),...x.sources.map(s=>({...s,id:'editorial-'+s.id}))];
  for(const lang of ['en','zh','ja']){const v=d.locales[lang]??={};v.sections=[...(v.sections||[]),...(x.sections||[]).map(s=>({...s,title:localeText(s.title,lang),paragraphs:localeText(s.paragraphs,lang),sourceIds:s.sourceIds.map(id=>'editorial-'+id)}))];v.history=[...(v.history||[]),...(x.history||[]).map(h=>({...h,label:localeText(h.label,lang),detail:localeText(h.detail,lang),sourceIds:h.sourceIds.map(id=>'editorial-'+id)}))];v.media=(x.media||[]).map(m=>({...m,label:localeText(m.label,lang),description:localeText(m.description,lang)}));}
  for(const m of media.filter(m=>m.collection===x.collection&&String(m.entryId)===String(x.entryId)))for(const lang of ['en','zh','ja'])d.locales[lang].media.unshift({...m,url:m.sourceUrl,label:localeText(m.label,lang),description:localeText(m.description,lang)});
  index[x.game]??={featured:[]};index[x.game].featured.push({collection:x.collection,id:String(x.entryId),name:base.name,names:Object.fromEntries(['en','zh','ja'].map(lang=>[lang,d.locales[lang]?.name||expanded[x.collection]?.[x.entryId]?.[lang]?.name||references[x.collection]?.[x.entryId]?.[lang]?.name||base.name])),layout:x.layout});
 }
}
for(const [game,pack]of Object.entries(games)){
 index[game]??={featured:[]};index[game].entries=Object.values(pack.entries).reduce((n,x)=>n+Object.keys(x).length,0);index[game].editorial=index[game].featured.length;
 for(const lang of ['en','zh','ja']){const dir=new URL('catalog/depth/'+lang+'/',root);await mkdir(dir,{recursive:true});const localized={entries:Object.fromEntries(Object.entries(pack.entries).map(([key,entries])=>[key,Object.fromEntries(Object.entries(entries).map(([id,d])=>[id,{...d,locales:{[lang]:d.locales?.[lang]||d.locales?.en||{}}}]))]))};await writeFile(new URL(game+'.json',dir),JSON.stringify(localized));}
}
await writeFile(new URL('depth-index.js',root),'// Generated encyclopedia depth coverage; not a completeness score.\nexport const DEPTH_INDEX='+JSON.stringify(index)+';\n');
console.log('Built localized depth packs:',Object.values(index).reduce((n,x)=>n+x.entries,0),'enhanced records;',Object.values(index).reduce((n,x)=>n+x.editorial,0),'editorial dossiers.');
