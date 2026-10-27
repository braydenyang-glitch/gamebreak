// Locale identifiers are independent of translated display labels and game IDs.
export const LOCALES=['en','zh-Hant','ja'];
export const normalizeLocale=value=>/^zh/i.test(value||'')?'zh-Hant':/^ja/i.test(value||'')?'ja':'en';
export const pathLocale=path=>{const first=String(path||'').split('/').filter(Boolean)[0];return LOCALES.includes(first)?first:null;};
let current=typeof location!=='undefined'?pathLocale(location.pathname):null;
if(!current&&typeof localStorage!=='undefined')try{current=normalizeLocale(JSON.parse(localStorage.getItem('gb-preferences')||'{}').language);}catch{}
current ||= 'en';
export const getLocale=()=>current;
export const setLocale=value=>(current=normalizeLocale(value));
export const stripLocale=path=>String(path||'/').replace(/^\/(?:en|zh-Hant|ja)(?=\/|$)/,'')||'/';
export function localizedHref(href,locale=current){
 if(!href||href.startsWith('#')||/^(?:[a-z]+:)?\/\//i.test(href)||!href.startsWith('/'))return href;
 let path=stripLocale(href);
 const u=new URL(path,'https://gamebreak.local');if(/^\/wiki\/[^/]+\/$/.test(u.pathname)&&u.searchParams.has('collection')&&u.searchParams.has('entry')){u.pathname+=encodeURIComponent(u.searchParams.get('collection'))+'/'+encodeURIComponent(u.searchParams.get('entry'))+'/';u.searchParams.delete('collection');u.searchParams.delete('entry');path=u.pathname+u.search+u.hash;}
 if(/^\/(?:assets|api|catalog|downloads|release|models|vendor|signin|signout|auth|sw\.js|manifest|robots|sitemap)(?:[-/?.]|$)/.test(path))return href;
 return '/'+normalizeLocale(locale)+(path.startsWith('/')?path:'/'+path);
}
export const formatDate=(value,withTime=false)=>{if(!value)return '—';const d=new Date(value);return Number.isNaN(d.valueOf())?String(value):new Intl.DateTimeFormat(current,{year:'numeric',month:'short',day:'numeric',...(withTime?{hour:'2-digit',minute:'2-digit'}:{})}).format(d);};
export const GAME_NAMES={genshin:['Genshin Impact','原神','原神'],starrail:['Honkai: Star Rail','崩壞：星穹鐵道','崩壊：スターレイル'],minecraft:['Minecraft','Minecraft 創世神','Minecraft マインクラフト'],gta:['Grand Theft Auto V','俠盜獵車手 V','グランド・セフト・オートV'],delta:['Delta Force','三角洲行動','Delta Force デルタフォース'],fortnite:['Fortnite','Fortnite 堡壘之夜','フォートナイト'],roblox:['Roblox · DOORS','Roblox · DOORS','Roblox · DOORS'],pubg:['PUBG: BATTLEGROUNDS','PUBG 絕地求生','PUBG: BATTLEGROUNDS'],brawl:['Brawl Stars','荒野亂鬥','ブロスタ'],wuwa:['Wuthering Waves','鳴潮','鳴潮']};
export const gameName=id=>(GAME_NAMES[id]||[id,id,id])[current==='ja'?2:current==='zh-Hant'?1:0];
export const gameAliases=id=>(GAME_NAMES[id]||[id]).join(' ');
