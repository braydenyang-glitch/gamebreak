import {getLocale} from './locale.js';
import {CORE} from './ui-core.js';
const cache=new Map(),terms=Object.fromEntries(CORE.map(([en,zh,ja])=>[en,{zh,ja}]));
const code=()=>getLocale()==='zh-Hant'?'zh':getLocale();
export const catalogTerm=value=>{if(typeof value!=='string')return value;return terms[value]?.[code()]||value;};
async function pack(file){if(!cache.has(file))cache.set(file,fetch('/catalog/'+file).then(r=>r.ok?r.json():{}).catch(()=>({})));return cache.get(file);}
export async function localizeCollection(data,key){
 const game=key.startsWith('hsr')?'starrail':key.split('-')[0],locale=code();
 const [names,references,expanded,depthNames]=await Promise.all([['genshin','minecraft','starrail'].includes(game)?pack('locales/'+game+'.json'):Promise.resolve({}),pack('reference-locales.json'),pack('expanded-reference-locales.json'),pack('depth-names.json')]);
 return {...data,entries:data.entries.map(entry=>{
  const variants={...(names.collections?.[key]?.[entry.id]||{}),...(references[key]?.[entry.id]||{}),...(expanded[key]?.[entry.id]||{}),...(depthNames[key]?.[entry.id]||{})};
  if(game==='minecraft'){const identifier=(entry.facts||[]).find(([k])=>k==='Identifier')?.[1]?.replace('minecraft:','');if(identifier)for(const l of ['zh','ja']){const name=names.names?.[l]?.['item.minecraft.'+identifier]||names.names?.[l]?.['block.minecraft.'+identifier];if(name)variants[l]={name};}}
  const translation=variants[locale]||{},aliases=[entry.name,...Object.values(variants).map(x=>x.name),...(entry.aliases||[])].filter(Boolean);
  const value={...entry,...translation,originalName:entry.originalName||entry.name,originalFacts:entry.originalFacts||entry.facts,group:entry.group,aliases,contentLanguage:Object.keys(translation).length?locale:'en'};
  // Localize display labels while keeping group identifiers stable for filters/tool handoff.
  value.facts=(value.facts||[]).map(([k,v])=>[catalogTerm(k),catalogTerm(v)]);
  value.kind=catalogTerm(translation.kind||entry.kind);value.displayGroup=catalogTerm(translation.group||entry.group);
  if(value.tables)value.tables=value.tables.map((t,i)=>({...t,title:/^Ascension \d+$/.test(entry.tables?.[i]?.title||'')?entry.tables[i].title:t.title}));
  if(key==='hsr-character-forms'){value.name=value.name.replaceAll('{NICKNAME}',locale==='en'?'Trailblazer':'開拓者');const facts=entry.originalFacts||entry.facts;const field=k=>facts.find(x=>x[0]===k)?.[1];value.summary=[field('Rarity')+'★',catalogTerm(field('Path')),catalogTerm(field('Element'))].filter(Boolean).join(' · ');}
  if(game==='minecraft'&&translation.name)value.summary=translation.name+' · '+entry.summary;
  return value;
 })};
}
export const entrySearchText=entry=>[entry.name,entry.originalName,...(entry.aliases||[]),entry.summary,entry.kind,entry.group,...(entry.facts||[]).flat()].join(' ').normalize('NFKC').toLowerCase();
