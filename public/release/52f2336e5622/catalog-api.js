import {enrichEntries} from './reference-depth.js';
import {DEPTH_COLLECTIONS} from './depth-collections.js';
import {localizeCollection,entrySearchText,catalogTerm} from './catalog-locales.js';
import {EXPANDED_COLLECTIONS} from './expanded-collections.js';
import {CURATED_COLLECTIONS} from './curated-collections.js';
// Public, no-secret game datasets. A retrieval time is not a gameplay verification.
const raw='https://raw.githubusercontent.com/PrismarineJS/minecraft-data/master/data/';
export const COLLECTIONS=[
 {id:'delta-weapons-reference',game:'delta',label:'Operations weapon reference',provider:'DeltaForceDB / Garena',kind:'snapshot',version:'Source review 25 Oct 2026',source:'https://deltaforcedb.com/weapons',note:'Six selected weapons. Type and caliber are community references; mode scope has historical official support where linked. Damage, current meta and import codes are not verified.'},
 ...CURATED_COLLECTIONS,
 ...EXPANDED_COLLECTIONS,
 ...DEPTH_COLLECTIONS,
 {id:'hsr-character-forms',game:'starrail',label:'Character forms',provider:'StarRailRes',kind:'snapshot',version:'Pinned data 4.6.0',source:'https://github.com/Mar-7th/StarRailRes',note:'98 character forms in the included snapshot, not 98 separate people. Roster presence does not prove release. March 7th and Trailblazer forms must not be counted as separate teammates. No automatic latest-version claim.'},
 {id:'genshin-characters',game:'genshin',label:'Characters',provider:'genshin-db',endpoint:'https://genshin-db-api.vercel.app/api/v5/characters?query=names&matchCategories=true&verboseCategories=true',source:'https://github.com/theBowja/genshin-db',note:'Community character data. Introduction version is not the current game patch.'},
 {id:'genshin-weapons',game:'genshin',label:'Weapons',provider:'genshin-db',endpoint:'https://genshin-db-api.vercel.app/api/v5/weapons?query=names&matchCategories=true&verboseCategories=true',source:'https://github.com/theBowja/genshin-db',note:'Weapon attributes and ascension materials. Check refinement and level in-game.'},
 {id:'brawl-brawlers',game:'brawl',label:'Brawlers',provider:'BrawlAPI',endpoint:'https://api.brawlapi.com/v1/brawlers',source:'https://brawlapi.com',note:'Community reference data, not player statistics or a live tier list.'},
 {id:'brawl-modes',game:'brawl',label:'Game modes',provider:'BrawlAPI',endpoint:'https://api.brawlapi.com/v1/gamemodes',source:'https://brawlapi.com',note:'Enabled does not mean currently in rotation. Check the event screen in-game.'},
 {id:'brawl-maps',game:'brawl',label:'Maps',provider:'BrawlAPI',endpoint:'https://api.brawlapi.com/v1/maps',source:'https://brawlapi.com',note:'Includes archived maps. Map status comes from the dataset, not the current event rotation.'},
 {id:'minecraft-pc-items',game:'minecraft',label:'Java items',provider:'minecraft-data',version:'Java 26.1',endpoint:raw+'pc/26.1/items.json',source:'https://github.com/PrismarineJS/minecraft-data',note:'Pinned Java 26.1 item registry. Numeric IDs are dataset IDs, not chat commands. This is not a claim of latest release.'},
 {id:'minecraft-bedrock-items',game:'minecraft',label:'Bedrock items',provider:'minecraft-data',version:'Bedrock data 1.26.30',endpoint:raw+'bedrock/1.26.30/items.json',source:'https://github.com/PrismarineJS/minecraft-data',note:'Pinned Bedrock 1.26.30 item data. Separate from Java; item IDs and recipes must not be mixed.'},
 {id:'fortnite-map',game:'fortnite',label:'Map & locations',provider:'Fortnite-API',endpoint:'https://fortnite-api.com/v1/map',source:'https://fortnite-api.com',note:'Provider map data may lag an in-game update. Match location labels against your current Battle Royale map.'},
 {id:'fortnite-shop',game:'fortnite',label:'Shop cosmetics',provider:'Fortnite-API',endpoint:'https://fortnite-api.com/v2/shop',source:'https://fortnite-api.com',note:'Battle Royale cosmetics in the returned shop snapshot. This is not the complete cosmetic archive. Prices and availability must be checked in-game.'}
];
export const getCollection=id=>COLLECTIONS.find(c=>c.id===id);
export const safeUrl=value=>{try{const u=new URL(value);return u.protocol==='https:'?u.href:'';}catch{return '';}};
const plain=s=>String(s??'').replace(/<[^>]*>/g,'').replace(/\{[^}]*\}/g,'').trim();
const fact=(k,v)=>v!==undefined&&v!==null&&String(v)!==''&&!(typeof v==='number'&&!Number.isFinite(v))?[k,String(v)]:null;
const facts=(...rows)=>rows.filter(Boolean);
const id=s=>s==null?'':String(s);
function costs(data){return Object.entries(data||{}).map(([stage,rows])=>({title:stage.replace('ascend','Ascension '),rows:rows.map(r=>[plain(r.name),String(r.count)])}));}
export function normalizeCollection(key,data,{images={}}={}){
 const cfg=getCollection(key);if(!cfg)throw Error('Unknown collection');
 let entries=[],meta={};
 if(key.startsWith('genshin-')){
  if(!Array.isArray(data))throw Error('Invalid Genshin response');
  const character=key.endsWith('characters');
  entries=data.map(x=>({id:id(x.id),name:plain(x.name),kind:character?'Character':'Weapon',group:character?x.elementText:x.weaponText,image:safeUrl(x.images?.hoyowiki_icon||x.images?.mihoyo_icon||x.images?.icon||x.images?.image),imageFallback:safeUrl(x.images?.mihoyo_icon),summary:character?`${x.rarity}-star ${x.elementText||'variable-element'} character · ${x.weaponText}.`:`${x.rarity}-star ${x.weaponText}. Base attributes depend on level and ascension.`,facts:facts(fact('Rarity',x.rarity+' stars'),fact('Element',character?x.elementText:null),fact('Weapon',x.weaponText),fact('Region',x.region),fact('Affiliation',x.affiliation),fact('Constellation',x.constellation),fact('Introduced in',x.version),fact('Base ATK at level 1',x.baseAtkValue),fact('Secondary attribute',x.mainStatText)),tables:costs(x.costs),source:safeUrl(x.url?.fandom)||cfg.source,active:true}));
 }else if(key.startsWith('brawl-')){
  if(!Array.isArray(data.list))throw Error('Invalid BrawlAPI response');
  entries=data.list.map(x=>({id:id(x.id),name:plain(x.name),kind:key==='brawl-maps'?'Map':key==='brawl-modes'?'Mode':'Brawler',group:plain(x.gameMode?.name||x.class?.name||x.title||'Game mode'),image:safeUrl(x.imageUrl2&&key==='brawl-brawlers'?x.imageUrl2:x.imageUrl),summary:key==='brawl-brawlers'?`${x.rarity?.name||'Unspecified rarity'} · ${x.class?.name||'Unspecified class'}.` : key==='brawl-maps'?`${x.gameMode?.name||'Game mode'} map in the ${x.environment?.name||'listed'} environment.`:plain(x.shortDescription||x.title),body:key==='brawl-modes'?[plain(x.description||x.tutorial)]:[],facts:facts(fact('Class',x.class?.name),fact('Rarity',x.rarity?.name),fact('Mode',x.gameMode?.name),fact('Environment',x.environment?.name),fact('Team format',x.title),fact('Dataset status',x.disabled?'Archived / disabled':x.released===false?'Not released':'Enabled / released')),abilities:[...(x.gadgets||[]).map(a=>({name:plain(a.name),type:'Gadget',description:plain(a.description),image:safeUrl(a.imageUrl)})),...(x.starPowers||[]).map(a=>({name:plain(a.name),type:'Star Power',description:plain(a.description),image:safeUrl(a.imageUrl)}))],source:safeUrl(x.link)||cfg.source,active:!x.disabled&&x.released!==false}));
 }else if(key.startsWith('minecraft-')){
  if(!Array.isArray(data))throw Error('Invalid item registry');
  entries=data.map(x=>({id:id(x.id),name:plain(x.displayName||x.name),kind:'Item',group:cfg.version,image:images[x.name]||'',summary:`minecraft:${x.name} · ${cfg.version}.`,facts:facts(fact('Identifier','minecraft:'+x.name),fact('Edition / dataset',cfg.version),fact('Max stack',x.stackSize),fact('Durability',x.maxDurability),fact('Dataset ID',x.id)),source:cfg.source,active:true}));
 }else if(key==='fortnite-map'){
  if(!Array.isArray(data.data?.pois))throw Error('Invalid map response');
  meta={mapImage:safeUrl(data.data.images?.pois),mapBlank:safeUrl(data.data.images?.blank)};
  entries=data.data.pois.map(x=>({id:id(x.id),name:plain(x.name),kind:'Location',group:x.id.includes('UnNamedPOI')?'Landmark':'Named location',image:'',summary:x.id.includes('UnNamedPOI')?'Landmark from the provider map.':'Named location from the provider map.',facts:facts(fact('Map X',Math.round(x.location?.x)),fact('Map Y',Math.round(x.location?.y)),fact('Map Z',Math.round(x.location?.z))),source:cfg.source,active:true}));
 }else if(key==='fortnite-shop'){
  if(!Array.isArray(data.data?.entries))throw Error('Invalid shop response');
  meta={providerDate:data.data.date};const seen=new Set();
  for(const offer of data.data.entries)for(const x of offer.brItems||[]){if(seen.has(x.id))continue;seen.add(x.id);entries.push({id:id(x.id),name:plain(x.name),kind:plain(x.type?.displayValue||'Cosmetic'),group:plain(x.type?.displayValue||'Cosmetic'),image:safeUrl(x.images?.icon||x.images?.smallIcon||x.images?.featured),summary:plain(x.set?.text||x.introduction?.text||x.type?.displayValue),facts:facts(fact('Type',x.type?.displayValue),fact('Rarity',x.rarity?.displayValue),fact('Set',x.set?.value),fact('Introduced',x.introduction?.text),fact('Provider shop date',data.data.date),fact('Offer price (V-Bucks)',offer.finalPrice),fact('Offer scope',(offer.brItems?.length||0)>1?'Bundle price; not individual item price':'Single BR cosmetic in this offer'),fact('Offer end (provider)',offer.outDate)),source:'https://www.fortnite.com/item-shop',active:true});}
 }
 entries=entries.filter(x=>x.id&&x.name);if(!entries.length)throw Error('No usable records');
 return {entries,meta};
}
const memory=new Map(),sharedReads=new Set();const TTL=6*60*60*1000;
function cached(key){try{const value=JSON.parse(localStorage.getItem('gb-catalog-v2-'+key));return Array.isArray(value?.entries)&&value.entries.length?{...value,mode:'cache'}:null;}catch{return null;}}
async function loadRawCollection(key,{refresh=false,fetcher=fetch,shared=typeof window!=='undefined'}={}){
 const cfg=getCollection(key);if(!cfg)throw Error('Unknown collection');
 let previous=memory.get(key)||cached(key);
 if(!previous){const r=await fetcher('/catalog/'+key+'.json');if(!r.ok)throw Error('Reference copy unavailable');previous=await r.json();previous.mode='snapshot';}
 if(!cfg.endpoint){previous={...previous,mode:cfg.kind==='curated'?'curated':'snapshot'};memory.set(key,previous);return previous;}
 if(!refresh){
  // Read the existing shared snapshot once per session before falling back to the
  // bundled file. Merely opening an entry never triggers a provider mutation.
  if(shared&&!sharedReads.has(key)){
   sharedReads.add(key);
   try{const response=await fetcher('/api/reference/'+encodeURIComponent(key),{cache:'no-store',signal:AbortSignal.timeout(3500)});
    if(response.ok){const data=await response.json();if(Array.isArray(data.entries)&&data.entries.length&&Date.parse(data.retrievedAt)>=Date.parse(previous.retrievedAt||0)){
     const images=new Map(previous.entries.filter(x=>x.image).map(x=>[x.id,x.image]));previous={...data,entries:data.entries.map(x=>({...x,image:x.image||images.get(x.id)||''})),mode:'shared'};
     try{localStorage.setItem('gb-catalog-v2-'+key,JSON.stringify(previous));}catch{}
    }}
   }catch{/* The dated local snapshot remains available offline. */}
  }
  memory.set(key,previous);return previous;
 }
 try{
  if(shared){
   try{
    await fetcher('/api/reference-refresh',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({collection:key}),signal:AbortSignal.timeout(15000)});
    const response=await fetcher('/api/reference/'+encodeURIComponent(key),{cache:'no-store',signal:AbortSignal.timeout(10000)});
    if(response.ok){const data=await response.json();if(!Array.isArray(data.entries)||!data.entries.length)throw Error('Invalid shared data');
     // Preserve locally packaged item images when the registry has no artwork.
     const priorImages=new Map(previous.entries.filter(x=>x.image).map(x=>[x.id,x.image]));
     data.entries=data.entries.map(x=>({...x,image:x.image||priorImages.get(x.id)||''}));
     const next={...data,mode:'shared'};memory.set(key,next);try{localStorage.setItem('gb-catalog-v2-'+key,JSON.stringify(next));}catch{}return next;
    }
   }catch{/* Direct provider access remains available when the shared service is offline. */}
  }
  const r=await fetcher(cfg.endpoint,{signal:AbortSignal.timeout(10000)});if(!r.ok)throw Error('Provider unavailable');
  const payload=await r.json();const images=Object.fromEntries(previous.entries.filter(x=>x.image&&x.summary?.startsWith('minecraft:')).map(x=>[x.summary.split(' · ')[0].slice(10),x.image]));
  const normalized=normalizeCollection(key,payload,{images});
  const next={...normalized,retrievedAt:new Date().toISOString(),mode:'live',version:cfg.version||null};
  memory.set(key,next);try{localStorage.setItem('gb-catalog-v2-'+key,JSON.stringify(next));}catch{}
  return next;
 }catch{const fallback={...previous,mode:'fallback'};memory.set(key,fallback);return fallback;}
}
export async function loadCollection(key,options={}){const data=await loadRawCollection(key,options);return typeof window==='undefined'?data:enrichEntries(await localizeCollection(data,key),key,getCollection(key).game);}
export function needsRefresh(data){return data.mode!=='curated'&&(!data.retrievedAt||Date.now()-Date.parse(data.retrievedAt)>TTL);}
export function filterEntries(entries,{q='',group='',active='all'}={}){const words=String(q).normalize('NFKC').toLowerCase().split(/\s+/).filter(Boolean);return entries.filter(x=>(!group||x.group===group)&&(active!=='active'||x.active)&&(active!=='archived'||!x.active)&&words.every(w=>entrySearchText(x).includes(w))).sort((a,b)=>a.name.localeCompare(b.name));}
export function csvRows(entries){const cell=v=>'"'+String(v??'').replace(/^[=+@\-]/,m=>"'"+m).replaceAll('"','""')+'"';return [['Name','Type','Category','Description','Source'].map(catalogTerm),...entries.map(x=>[x.name,x.kind,x.group,x.summary,x.source])].map(r=>r.map(cell).join(',')).join('\r\n');}
