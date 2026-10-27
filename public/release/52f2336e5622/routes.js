import {getLocale,pathLocale,stripLocale,localizedHref} from './locale.js';
const sections=new Set(['privacy','me','sources','fieldnotes','showcase','studio','playroom','games','guides','tools','saved','testing','about','wiki','search','resources','playbook','offline','updates','reports','editor','explore','maps','help','history','share','contribute','quality','settings']);
export function readRoute(input){
 const u=new URL(input,'https://gamebreak.local');
 if(u.hash.startsWith('#/')){
  const [path,q='']=u.hash.slice(2).split('?');const [page,id='']=path.split('/');
  return {page:page==='discover'?'discover':page,id,query:new URLSearchParams(q)};
 }
 const locale=pathLocale(u.pathname);
 const pathname=stripLocale(u.pathname);
 const parts=pathname.replace(/\/index\.html$/,'/').split('/').filter(Boolean);
 if(!parts.length)return {page:'discover',id:'',query:u.searchParams};
 if(parts.length===4&&parts[0]==='wiki'){u.searchParams.set('collection',decodeURIComponent(parts[2]));u.searchParams.set('entry',decodeURIComponent(parts[3]));return {page:'wiki',id:parts[1],query:u.searchParams};}
 if(parts.length===2&&parts[0]==='wiki')return {page:'wiki',id:parts[1],query:u.searchParams};
 if(parts.length===2&&['games','guides'].includes(parts[0]))return {page:parts[0]==='games'?'game':'guide',id:parts[1],query:u.searchParams};
 return {page:parts.length===1&&sections.has(parts[0])?parts[0]:'not-found',id:'',query:u.searchParams};
}
export function routeHref(page='guides',id='',query=new URLSearchParams()){
 const path=page==='wiki'&&id?`/wiki/${encodeURIComponent(id)}/`:page==='discover'?'/':page==='game'?`/games/${encodeURIComponent(id)}/`:page==='guide'?`/guides/${encodeURIComponent(id)}/`:`/${page}/`;
 return (typeof window==='undefined'?path+(query.toString()?'?'+query.toString():''):localizedHref(path+(query.toString()?'?'+query.toString():'')));
}
export function canonicalHref(href){const r=readRoute(href);return routeHref(r.page,r.id,r.query);}
