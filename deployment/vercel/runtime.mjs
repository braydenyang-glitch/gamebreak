import {readFileSync} from 'node:fs';
const ORIGIN='https://gamebreak-brayden.yenhui.chatgpt.site';
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const publicReads=new Set(['content','updates','source-monitor','history','share','helpful','contributions']);
export async function publicApi(request,fetcher=fetch){
 const url=new URL(request.url),path=url.pathname.replace(/\/$/,''),endpoint=path.slice(5);
 if(endpoint==='account'&&request.method==='GET')return json({user:null,admin:false,cloudAvailable:false,cloudWorkspace:ORIGIN+'/playbook/'});
 const refresh=endpoint==='reference-refresh'&&request.method==='POST';
 if(!refresh&&request.method!=='GET')return json({error:'Use the original GameBreak cloud workspace to save or submit online.',cloudWorkspace:ORIGIN+'/playbook/'},405);
 if(!refresh&&!publicReads.has(endpoint)&&!/^reference\/[a-z0-9-]+$/.test(endpoint))return json({error:'This endpoint is not available on this host.',cloudWorkspace:ORIGIN+'/playbook/'},404);
 const upstream=new URL(path,ORIGIN);upstream.search=url.search;
 const options={method:request.method,redirect:'manual',signal:AbortSignal.timeout(18000),headers:{Accept:'application/json'}};
 if(refresh){
  if(request.headers.get('origin')!==url.origin)return json({error:'Same-origin request required.'},403);
  if(!request.headers.get('content-type')?.startsWith('application/json'))return json({error:'JSON required.'},415);
  const body=await request.text();if(body.length>300)return json({error:'Request too large.'},413);
  let input;try{input=JSON.parse(body);}catch{return json({error:'Invalid JSON.'},400);}
  if(typeof input.collection!=='string'||!/^[-a-z0-9]{1,80}$/.test(input.collection))return json({error:'Invalid collection.'},400);
  options.headers['Content-Type']='application/json';options.headers.Origin=ORIGIN;options.body=JSON.stringify({collection:input.collection});
 }
 try{
  // Forward only public requests: never forward Cookie, Authorization or identity headers.
  const result=await fetcher(upstream,options);
  if(!result.headers.get('content-type')?.includes('application/json')||result.status>=300&&result.status<400)return json({error:'Reference service unavailable. Saved reference snapshots remain available.'},502);
  const data=await result.text();return new Response(data,{status:result.status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
 }catch{return json({error:'Reference service temporarily unavailable. Use the saved snapshot.'},502);}
}
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function renderWiki(request,entries,template,siteOrigin){
 const parts=new URL(request.url).pathname.split('/').filter(Boolean),locale=['en','zh-Hant','ja'].includes(parts[0])?parts.shift():'en';
 let key='';try{if(parts[0]==='wiki'&&parts.length===4)key=parts.slice(1).map(decodeURIComponent).join('/');}catch{}
 const record=entries[key];
 if(record){
  const data=record.locales[locale],path='/'+locale+'/wiki/'+key.split('/').map(encodeURIComponent).join('/')+'/',canonical=siteOrigin+path,title=esc(data.title+' — GameBreak'),description=esc(data.description);
  let html=template.replace('<html lang="en"','<html lang="'+locale+'"').replace(/<title>.*?<\/title>/,`<title>${title}</title>`).replace(/(<meta name="description" content=")[^"]*/,`$1${description}`).replace(/(<meta property="og:title" content=")[^"]*/,`$1${title}`).replace(/(<meta property="og:description" content=")[^"]*/,`$1${description}`).replace(/(<meta property="og:url" content=")[^"]*/,`$1${canonical}`).replace(/(<link rel="canonical" href=")[^"]*/,`$1${canonical}`);
  if(record.image?.startsWith('/assets/'))html=html.replace(/(<meta property="og:image" content=")[^"]*/,`$1${siteOrigin}${esc(record.image)}`);
  const note=locale==='ja'?'出典資料です。ゲーム内動作は未検証です。':locale==='zh-Hant'?'此為來源參考資料，尚未進行遊戲實測。':'Source reference; not gameplay-tested.';
  const body=`<article class="static-content"><a href="/${locale}/wiki/${esc(parts[1])}/">GameBreak Wiki</a><h1>${esc(data.title)}</h1><p>${description}</p>${data.body.map(p=>`<p>${esc(p)}</p>`).join('')}<dl>${data.facts.map(([k,v])=>`<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl><p>${note}</p><a href="${esc(record.source)}" rel="noopener">${esc(record.provider)}</a></article>`;
  html=html.replace(/(<main id="main" tabindex="-1">)[\s\S]*?<\/main>/,'$1'+body+'</main>').replace('</head>',['en','zh-Hant','ja'].map(l=>`<link rel="alternate" hreflang="${l}" href="${canonical.replace('/'+locale+'/','/'+l+'/')}">`).join('')+'</head>');
  return new Response(html,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'public,max-age=300'}});
 }
 const messages=locale==='ja'?['ページが見つかりません','ホームに戻る','検索']:locale==='zh-Hant'?['找不到這個頁面','返回首頁','搜尋']:['That page is outside the map.','Back to home','Search'];
 return new Response(`<!doctype html><html lang="${locale}"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>404 · GameBreak</title><style>body{background:#11182c;color:#f4f5ff;font:18px/1.6 system-ui;padding:10vh 24px}main{max-width:620px;margin:auto}a{color:#d8f694;display:inline-block;padding:12px}</style><main><p>GAMEBREAK / 404</p><h1>${messages[0]}</h1><a href="/${locale}/">${messages[1]} →</a><a href="/${locale}/search/">${messages[2]} →</a></main></html>`,{status:404,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}});
}
let entries,template,config;
export default async function handler(req,res){
 try{
  config??=JSON.parse(readFileSync(new URL('./site.json',import.meta.url),'utf8'));
  const host=req.headers.host||new URL(config.origin).host;
  const url=new URL(req.url,'https://'+host),headers=new Headers();
  for(const [k,v] of Object.entries(req.headers))if(v)headers.set(k,Array.isArray(v)?v.join(','):v);
  const method=req.method||'GET';let body;
  if(!['GET','HEAD'].includes(method)){const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>1024){res.writeHead(413,{'Content-Type':'application/json'});res.end('{"error":"Request too large."}');return;}chunks.push(chunk);}body=Buffer.concat(chunks);}
  const request=new Request(url,{method,headers,body});let response;
  if(url.pathname.startsWith('/api/'))response=await publicApi(request);
  else if(/^\/(signin-with-chatgpt|signout-with-chatgpt|callback)\/?$/.test(url.pathname))response=Response.redirect(ORIGIN+'/playbook/',302);
  else if(!['GET','HEAD'].includes(method))response=json({error:'Method not allowed.'},405);
  else{entries??=JSON.parse(readFileSync(new URL('./entry-pages.json',import.meta.url),'utf8'));template??=readFileSync(new URL('./index.html',import.meta.url),'utf8');response=renderWiki(request,entries,template,config.origin);}
  res.writeHead(response.status,Object.fromEntries(response.headers));res.end(method==='HEAD'?undefined:Buffer.from(await response.arrayBuffer()));
 }catch{res.writeHead(500,{'Content-Type':'application/json'});res.end('{"error":"GameBreak could not load this request. Please try again."}');}
}
