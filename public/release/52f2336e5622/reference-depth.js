import {getLocale} from './locale.js';

const packs=new Map();
export function entryLayout(entry,game){
 const kind=(entry.originalKind||entry.kind||'').toLowerCase();
 if(/character|brawler|角色|英雄/.test(kind))return 'character';
 if(/weapon|light cone|武器|光錐|光円錐/.test(kind))return 'weapon';
 if(/location|map|biome|地圖|地點/.test(kind))return 'location';
 if(/entity|encounter|遭遇/.test(kind)||game==='roblox')return 'encounter';
 if(/item|relic|cosmetic|outfit|物品|遺器/.test(kind)||game==='minecraft')return 'item';
 return 'system';
}
export function mergeDepth(entry,record,locale=getLocale()){
 if(!record)return {...entry,depth:{layout:entryLayout(entry,entry.game),sections:[],sources:[],skills:[],history:[],media:[]}};
 const lang=locale==='zh-Hant'?'zh':locale;
 const variant=record.locales?.[lang]||record.locales?.en||{};
 return {...entry,depth:{...record,...variant,locales:undefined,language:record.locales?.[lang]?lang:'en'}};
}
export async function enrichEntries(data,collection,game){
 const language=getLocale()==='zh-Hant'?'zh':getLocale(),cacheKey=language+':'+game;
 if(!packs.has(cacheKey))packs.set(cacheKey,fetch('/catalog/depth/'+language+'/'+game+'.json').then(r=>{if(!r.ok)throw Error('No depth pack');return r.json();}).catch(()=>{packs.delete(cacheKey);return {entries:{}};}));
 const pack=await packs.get(cacheKey);
 return {...data,entries:data.entries.map(entry=>mergeDepth(entry,pack.entries?.[collection]?.[entry.id]))};
}

// A value is formatted only when the source explicitly supplies a parameter.
export function formatSkillText(template,params=[]){
 return String(template||'').replace(/<[^>]*>/g,'').replace(/\{RUBY_[BE]#[^}]*\}/g,'').replace(/#(\d+)\[(?:i|f\d*)\](%|％)?/g,(token,n,percent)=>{
  const value=params[Number(n)-1];if(!Number.isFinite(value))return '—';
  return new Intl.NumberFormat('en',{maximumFractionDigits:3}).format(percent?value*100:value)+(percent||'');
 }).replace(/\{param(\d+):([A-Za-z0-9]+)\}/g,(token,n,format)=>{
  const value=params[Number(n)-1];if(!Number.isFinite(value))return '—';
  const percentage=format.includes('P');return new Intl.NumberFormat('en',{maximumFractionDigits:format.includes('F1')?1:2}).format(percentage?value*100:value)+(percentage?'%':'');
 });
}
export function youtubeVideoId(value){try{const u=new URL(value);if(u.protocol!=='https:')return null;if(u.hostname==='youtu.be')return /^[\w-]{11}$/.test(u.pathname.slice(1))?u.pathname.slice(1):null;if(['www.youtube.com','youtube.com','m.youtube.com'].includes(u.hostname)){const id=u.searchParams.get('v')||u.pathname.split('/').filter(Boolean)[1];return /^[\w-]{11}$/.test(id||'')?id:null;}}catch{}return null;}
export function baseStats(stats,level,stage){if(!Number.isInteger(stage)||!stats?.stages?.[stage]||!Number.isInteger(level)||level<[1,20,30,40,50,60,70][stage]||level>[20,30,40,50,60,70,80][stage])return [];return Object.entries(stats.stages[stage]).filter(([,v])=>Number.isFinite(v.base)&&Number.isFinite(v.step)).map(([key,v])=>[key,v.base+v.step*(level-1)]);}
export function craftingTotals(recipe,quantity){if(!Number.isInteger(quantity)||quantity<1||quantity>9999||!Number.isInteger(recipe?.outputCount)||recipe.outputCount<1)throw Error('Invalid crafting quantity');const batches=Math.ceil(quantity/recipe.outputCount);return {batches,output:batches*recipe.outputCount,ingredients:recipe.ingredients.map(x=>({...x,count:x.count*batches}))};}
export function depthAvailability(entry){const d=entry.depth||{};return {facts:!!entry.facts?.length,usage:!!d.sections?.some(s=>['usage','obtain','cautions'].includes(s.id))||!!d.recipes?.length||!!d.usedIn?.length,skills:!!d.skills?.length||!!entry.abilities?.length,history:!!d.history?.length,media:!!d.media?.length};}
