import { GAMES } from './data.js';
import { SNAPSHOT } from './snapshot.js';
const CACHE_KEY='gamebreak-game-info-v1';
export const API_ENDPOINT='https://en.wikipedia.org/w/api.php';
let metadata={...SNAPSHOT};
let state={mode:'snapshot',updatedAt:'2026-10-06T05:26:00Z',message:'Included reference copy'};
export function getMetadata(){return metadata;}
export function getApiState(){return {...state};}
export function makeApiUrl(){
 const p=new URLSearchParams({action:'query',prop:'extracts|info|pageimages',titles:GAMES.map(g=>g.wiki).join('|'),format:'json',formatversion:'2',exintro:'1',explaintext:'1',exsentences:'2',inprop:'url',redirects:'1',piprop:'thumbnail',pithumbsize:'400',origin:'*'});
 return `${API_ENDPOINT}?${p}`;
}
export async function refreshMetadata(force=false){
 if(!force){try{const c=JSON.parse(localStorage.getItem(CACHE_KEY));if(c?.data&&Date.now()-c.time<86400000){metadata={...metadata,...c.data};state={mode:'cache',updatedAt:new Date(c.time).toISOString(),message:'Previously loaded from Wikipedia'};return {metadata,state};}}catch{}}
 state={...state,mode:'loading',message:'Getting game information…'};
 try{
  const r=await fetch(makeApiUrl(),{signal:AbortSignal.timeout(12000)});
  if(!r.ok)throw new Error('API unavailable');
  const body=await r.json();
  if(!Array.isArray(body.query?.pages))throw new Error('Unexpected API response');
  let updated=0;
  for(const game of GAMES){
   const redirect=body.query.redirects?.find(x=>x.from===game.wiki)?.to;
   const page=body.query.pages.find(p=>p.title===game.wiki||p.title===redirect);
   if(!page||page.missing||!page.extract)continue;
   const source=typeof page.fullurl==='string'&&page.fullurl.startsWith('https://en.wikipedia.org/wiki/')?page.fullurl:metadata[game.id]?.source;
   metadata[game.id]={title:page.title,extract:page.extract,source,thumbnail:page.thumbnail?.source};updated++;
  }
  if(!updated)throw new Error('No matching games');
  const now=Date.now();state={mode:'live',updatedAt:new Date(now).toISOString(),message:`${updated} game entries loaded from Wikipedia`};
  try{localStorage.setItem(CACHE_KEY,JSON.stringify({time:now,data:metadata}));}catch{}
 }catch{state={...state,mode:'fallback',message:'Game info could not refresh. Showing previously available game information.'};}
 return {metadata,state};
}
