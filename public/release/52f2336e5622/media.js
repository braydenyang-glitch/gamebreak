let IMAGE_MANIFEST={},ENTITY_IMAGES={},unavailable=new Set(),mediaPromise;
const mediaGames=new Map();
export async function loadMedia(game){
 if(typeof window==='undefined')return mediaPromise??=(import('./image-manifest.js').then(data=>{IMAGE_MANIFEST=data.IMAGE_MANIFEST;ENTITY_IMAGES=data.ENTITY_IMAGES;unavailable=new Set(data.MISSING_IMAGES);}));
 const games=game?[game]:['genshin','starrail','minecraft','gta','delta','fortnite','roblox','pubg','brawl','wuwa'];
 await Promise.all(games.map(id=>{if(!mediaGames.has(id))mediaGames.set(id,fetch('/catalog/media/'+id+'.json').then(r=>{if(!r.ok)throw Error('Image index unavailable');return r.json();}).then(data=>{Object.assign(IMAGE_MANIFEST,data.IMAGE_MANIFEST);Object.assign(ENTITY_IMAGES,data.ENTITY_IMAGES);for(const x of data.MISSING_IMAGES||[])unavailable.add(x);}).catch(()=>{mediaGames.delete(id);}));return mediaGames.get(id);}));
}
const valid=value=>typeof value==='string'&&(/^\/assets\/[a-zA-Z0-9_./-]+$/.test(value)||/^https:\/\//.test(value));
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

// Preserve exact entity identity. A generic game cover must never stand in for an item portrait.
export function imageSource(url,{collection='',id='',fallback=''}={}){
 if(collection==='hsr-character-forms'&&/^[0-9]{4}$/.test(id))return '/assets/hsr/'+id+'.webp';
 const exact=ENTITY_IMAGES[collection+':'+id];
 if(exact&&valid(exact))return exact;
 for(const candidate of [url,fallback]){
  const local=IMAGE_MANIFEST[candidate];
  if(local&&valid(local))return local;
 }
 for(const candidate of [url,fallback])if(valid(candidate)&&!unavailable.has(candidate))return candidate;
 return '';
}

export function imageTag(entry,collection='',{className='',lazy=true,decorative=false}={}){
 const src=imageSource(entry.image,{collection,id:entry.id,fallback:entry.imageFallback});
 if(!src)return '';
 const fallback=imageSource(entry.imageFallback);
 return `<img src="${escape(src)}" ${fallback&&fallback!==src?`data-fallback="${escape(fallback)}"`:''} class="${escape(className)}" alt="${decorative?'':escape(entry.name)}" loading="${lazy?'lazy':'eager'}" decoding="async" referrerpolicy="no-referrer">`;
}

export function referenceArt(entry,collection=''){
 const img=imageTag(entry,collection);
 return img?`<div class="entity-art">${img}</div>`:`<div class="entity-reference"><span aria-hidden="true">${escape(entry.name.split(/\s+/).map(s=>s[0]).join('').slice(0,2))}</span><small>${escape(entry.kind||'Reference')}<br>Reference note</small></div>`;
}
