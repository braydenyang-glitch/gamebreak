const json=(value,status=200)=>Response.json(value,{status,headers:{'Cache-Control':'private, no-store','Vary':'Cookie','X-Content-Type-Options':'nosniff'}});
const text=(value,max=2000)=>typeof value==='string'?value.trim().slice(0,max):'';
const https=value=>{try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password?u.href:'';}catch{return '';}};
export function sharePayload(input,games){
 const title=text(input?.title,100),game=text(input?.game,40),tasks=Array.isArray(input?.tasks)?input.tasks.map(t=>text(t,700)).filter(Boolean):[];
 if(!title||!games.includes(game)||tasks.length<1||tasks.length>100)throw Error('A title, game and 1–100 tasks are required.');
 return {title,game,tasks};
}
export function screenshotData(value){
 if(!value)return '';
 if(typeof value!=='string'||value.length>180000||!/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+=*$/.test(value))throw Error('A PNG, JPEG or WebP screenshot under 135 KB is required.');
 const [prefix,data]=value.split(',');let raw;try{raw=atob(data);}catch{throw Error('A valid screenshot is required.');}
 if(!(prefix.includes('png')&&raw.startsWith('\x89PNG\r\n\x1a\n')||prefix.includes('jpeg')&&raw.startsWith('\xff\xd8\xff')||prefix.includes('webp')&&raw.startsWith('RIFF')&&raw.slice(8,12)==='WEBP'))throw Error('A valid screenshot is required.');
 return value;
}
export function compareGuide(before,after){
 return ['title','quick','steps','note','status','source','playtested'].flatMap(field=>JSON.stringify(before?.[field]??null)===JSON.stringify(after?.[field]??null)?[]:[{field,before:before?.[field]??null,after:after?.[field]??null}]);
}
export async function handleV2(request,{db,user,admin,guides,read,now,fetcher=fetch}){
 const url=new URL(request.url),path=url.pathname.replace(/\/$/,''),method=request.method;
 if(!/^\/api\/(shares|share|contributions|helpful|history|admin\/(contributions|quality))(\/|$)/.test(path))return null;
 const needUser=()=>!user?json({error:'Sign in to save or submit this item.'},401):null;
 if(path.startsWith('/api/admin/')&&!admin)return json({error:'Editor access required.'},user?403:401);
 if(path==='/api/history'&&method==='GET'){
  const g=guides.find(g=>g.id===url.searchParams.get('guide'));if(!g)return json({error:'Guide not found.'},404);
  const rows=await db.prepare("SELECT id,payload,created_at FROM content_revisions WHERE guide_id=? AND action='publish' ORDER BY id ASC LIMIT 100").bind(g.id).all();
  const entries=[{id:'release',date:g.reviewed,title:'Release source review',value:{title:g.title,quick:g.quick,steps:g.steps,note:g.note,status:g.status,source:g.source,playtested:g.playtested||null}},...rows.results.map(r=>({id:String(r.id),date:r.created_at,title:'Published revision '+r.id,value:JSON.parse(r.payload)}))];
  return json({guideId:g.id,entries:entries.map((r,i)=>({...r,changes:i?compareGuide(entries[i-1].value,r.value):[]}))});
 }
 if(path==='/api/share'&&method==='GET'){
  const row=await db.prepare('SELECT id,payload,created_at FROM shared_playbooks WHERE id=? AND active=1').bind(text(url.searchParams.get('id'),100)).first();
  return row?json({id:row.id,...JSON.parse(row.payload),createdAt:row.created_at}):json({error:'This shared list is unavailable or has been revoked.'},404);
 }
 if(path==='/api/shares'){
  const denied=needUser();if(denied)return denied;
  if(method==='GET'){const rows=await db.prepare('SELECT id,payload,active,created_at FROM shared_playbooks WHERE user_id=? ORDER BY created_at DESC LIMIT 100').bind(user.userId).all();return json({shares:rows.results.map(r=>({id:r.id,...JSON.parse(r.payload),active:!!r.active,createdAt:r.created_at}))});}
  if(method==='POST'){
   const b=sharePayload(await read(),[...new Set(guides.map(g=>g.game))]);
   const count=await db.prepare('SELECT COUNT(*) AS n FROM shared_playbooks WHERE user_id=? AND active=1').bind(user.userId).first();if(count.n>=50)return json({error:'You can have 50 active lists. Revoke an old link first.'},429);
   const id=crypto.randomUUID();await db.prepare('INSERT INTO shared_playbooks(id,user_id,payload,active,created_at) VALUES(?,?,?,1,?)').bind(id,user.userId,JSON.stringify(b),now).run();return json({id,...b},201);
  }
  if(method==='PATCH'){const b=await read();const row=await db.prepare('UPDATE shared_playbooks SET active=0 WHERE id=? AND user_id=? RETURNING id').bind(text(b.id,100),user.userId).first();return row?json({ok:true}):json({error:'List not found.'},404);}
 }
 if(path==='/api/helpful'){
  const guideId=method==='GET'?url.searchParams.get('guide'):(await read()).guideId;if(!guides.some(g=>g.id===guideId))return json({error:'Guide not found.'},404);
  if(method==='POST'){
   const denied=needUser();if(denied)return denied;const b=await read();if(typeof b.helpful!=='boolean')return json({error:'Choose a feedback value.'},400);
   await db.prepare('INSERT INTO guide_votes(user_id,guide_id,helpful,updated_at) VALUES(?,?,?,?) ON CONFLICT(user_id,guide_id) DO UPDATE SET helpful=excluded.helpful,updated_at=excluded.updated_at').bind(user.userId,guideId,b.helpful?1:0,now).run();
  }
  if(['GET','POST'].includes(method)){const counts=await db.prepare('SELECT COALESCE(SUM(helpful),0) AS helpful,COUNT(*) AS total FROM guide_votes WHERE guide_id=?').bind(guideId).first();const mine=user?await db.prepare('SELECT helpful FROM guide_votes WHERE user_id=? AND guide_id=?').bind(user.userId,guideId).first():null;return json({...counts,mine:mine?!!mine.helpful:null});}
 }
 if(path==='/api/contributions'&&method==='GET'){
  if(url.searchParams.get('mine')==='1'){const denied=needUser();if(denied)return denied;const rows=await db.prepare('SELECT id,guide_id,kind,author_alias,platform,game_build,details,status,response,created_at FROM guide_contributions WHERE user_id=? ORDER BY created_at DESC LIMIT 100').bind(user.userId).all();return json({contributions:rows.results});}
  const rows=await db.prepare("SELECT id,guide_id,kind,author_alias,platform,game_build,details,evidence,screenshot,response,created_at FROM guide_contributions WHERE status='approved' AND guide_id=? ORDER BY created_at DESC LIMIT 30").bind(text(url.searchParams.get('guide'),200)).all();return json({contributions:rows.results});
 }
 if(path==='/api/contributions'&&method==='POST'){
  const denied=needUser();if(denied)return denied;const b=await read(),g=guides.find(g=>g.id===b.guideId);
  if(!g||!['tip','playtest','question'].includes(b.kind)||!g.platforms.includes(b.platform)||!text(b.build,80)||text(b.details).length<20)return json({error:'A guide, platform, build and at least 20 characters are required.'},400);
  const evidence=https(b.evidence),screenshot=screenshotData(b.screenshot);if(b.evidence&&!evidence||b.kind==='playtest'&&!evidence&&!screenshot)return json({error:'A playtest needs a screenshot or HTTPS evidence link.'},400);
  const count=await db.prepare('SELECT COUNT(*) AS n FROM guide_contributions WHERE user_id=? AND created_at>?').bind(user.userId,new Date(Date.now()-86400000).toISOString()).first();if(count.n>=5)return json({error:'You can submit five contributions per day.'},429);
  const id=crypto.randomUUID();await db.prepare('INSERT INTO guide_contributions(id,user_id,guide_id,kind,author_alias,platform,game_build,details,evidence,screenshot,status,response,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(id,user.userId,g.id,b.kind,text(b.alias,40)||'Player',b.platform,text(b.build,80),text(b.details),evidence,screenshot,'pending','',now,now).run();return json({id,status:'pending'},201);
 }
 if(path==='/api/admin/contributions'&&method==='GET'){const rows=await db.prepare('SELECT id,guide_id,kind,author_alias,platform,game_build,details,evidence,screenshot,status,response,created_at FROM guide_contributions ORDER BY created_at DESC LIMIT 100').all();return json({contributions:rows.results});}
 if(path==='/api/admin/contributions'&&method==='PATCH'){
  const b=await read();if(!['pending','reviewing','approved','declined'].includes(b.status))return json({error:'Invalid review status.'},400);
  const row=await db.prepare('UPDATE guide_contributions SET status=?,response=?,updated_at=? WHERE id=? RETURNING id').bind(b.status,text(b.response,1200),now,text(b.id,100)).first();return row?json({ok:true}):json({error:'Contribution not found.'},404);
 }
 if(path==='/api/admin/quality'&&method==='GET'){
  const checks=await db.prepare('SELECT url,status,http_status,checked_at FROM source_checks ORDER BY checked_at DESC LIMIT 500').all();
  const reports=await db.prepare("SELECT COUNT(*) AS n FROM guide_reports WHERE status IN ('pending','reviewing')").first();
  const submissions=await db.prepare("SELECT COUNT(*) AS n FROM guide_contributions WHERE status IN ('pending','reviewing')").first();return json({checks:checks.results,pendingReports:reports.n,pendingContributions:submissions.n});
 }
 if(path==='/api/admin/quality/check'&&method==='POST'){
  const b=await read();if(!Array.isArray(b.guideIds)||b.guideIds.length>5)return json({error:'Choose up to five guides per check.'},400);
  const sources=[...new Set(b.guideIds.map(id=>guides.find(g=>g.id===id)?.source).filter(Boolean))];
  const results=await Promise.all(sources.map(async source=>{
   // Only fixed editorial sources are accepted. Do not follow untrusted redirects.
   let status='unreachable',http=0;try{const r=await fetcher(source,{method:'HEAD',redirect:'manual',signal:AbortSignal.timeout(6500)});http=r.status;status=r.ok?'reachable':r.status>=300&&r.status<400?'redirect':r.status===404||r.status===410?'broken':'blocked';}catch{}
   await db.prepare('INSERT INTO source_checks(url,status,http_status,checked_at) VALUES(?,?,?,?) ON CONFLICT(url) DO UPDATE SET status=excluded.status,http_status=excluded.http_status,checked_at=excluded.checked_at').bind(source,status,http,now).run();return {url:source,status,http_status:http,checked_at:now};
  }));return json({checks:results});
 }
 return json({error:'Not found.'},404);
}
