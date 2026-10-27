import {handlePrivacy} from './privacy.mjs';
import {handleReferenceRefresh} from './reference-refresh.mjs';
import {RELEASE_NOTES} from '../public/release-notes.js';
import {handleSourceMonitor} from './source-monitor.mjs';
import {handleV2} from './v2.mjs';
import {validRecord} from '../public/state-schema.js';
const keys=new Set(['gamebreak-saved','gamebreak-progress','gamebreak-playbook','gamebreak-tool-plans','gamebreak-favorites','gamebreak-recent','gamebreak-map-progress','gamebreak-watched']);
const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'private, no-store','Vary':'Cookie','X-Content-Type-Options':'nosniff'}});
const txt=(v,n=2000)=>typeof v==='string'?v.trim().slice(0,n):'';
export function validLink(value){try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password?u.href:'';}catch{return '';}}
export function isAdmin(user,emails=''){return !!user?.email&&emails.split(',').map(s=>s.trim().toLowerCase()).filter(Boolean).includes(user.email.toLowerCase());}
export function validateGuideEdit(input,guide){
 if(!input||typeof input!=='object')throw Error('Enter a guide update.');
 const title=txt(input.title,150),quick=txt(input.quick,600),steps=Array.isArray(input.steps)?input.steps.map(s=>txt(s,700)).filter(Boolean):[],source=validLink(input.source),note=txt(input.note,1200),sourceName=txt(input.sourceName,180);
 if(!title||!quick||steps.length<2||steps.length>16||!source||!sourceName)throw Error('Title, answer, 2–16 steps and an HTTPS source are required.');
 const status=['Unverified','Working','Patched'].includes(input.status)?input.status:'Unverified';let playtested=null;
 if(status!=='Unverified'){
  const p=input.playtested||{},date=txt(p.date,10),build=txt(p.build,80),platform=txt(p.platform,20),evidence=validLink(p.evidence);
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||(!Number.isFinite(Date.parse(date))||new Date(date).toISOString().slice(0,10)!==date)||date>new Date().toISOString().slice(0,10)||!build||!guide.platforms.includes(platform)||!evidence)throw Error('Working or Patched needs a supported platform, named build, valid test date and evidence URL.');
  playtested={date,build,platform,evidence};
 }
 return {title,quick,steps,source,sourceName,note,status,playtested,reviewed:new Date().toISOString().slice(0,10)};
}
export async function handleApi(request,{db,user,adminEmails='',guides=[]}){
 const url=new URL(request.url),path=url.pathname.replace(/\/$/,''),method=request.method,admin=isAdmin(user,adminEmails),now=new Date().toISOString();
 if(method==='OPTIONS')return new Response(null,{status:405});
 if(!['GET','HEAD'].includes(method)){
  if(request.headers.get('Origin')!==url.origin)return json({error:'Please submit from GameBreak.'},403);
  if(!request.headers.get('content-type')?.startsWith('application/json'))return json({error:'JSON required.'},415);
  if(Number(request.headers.get('content-length'))>300000)return json({error:'Request is too large.'},413);
 }
 if(path==='/api/account')return json({user:user?{id:user.userId,name:user.displayName,email:user.email}:null,admin,cloudAvailable:!!db});
 if(!db)return json({error:'Cloud storage is temporarily unavailable. Your device copy is still available.'},503);
 let body;
 const read=async()=>{if(body!==undefined)return body;const raw=await request.text();if(raw.length>300000)throw Error('Request is too large.');body=JSON.parse(raw);return body;};
 try{
  const refresh=await handleReferenceRefresh(request,{db,read,now});if(refresh)return refresh;
  const privacy=await handlePrivacy(request,{db,user,read,now});if(privacy)return privacy;
  const monitor=await handleSourceMonitor(request,{db,user,admin,read,now});if(monitor)return monitor;
  const v2=await handleV2(request,{db,user,admin,guides,read,now});if(v2)return v2;
  if(path==='/api/content'&&method==='GET'){
   const rows=await db.prepare('SELECT guide_id,published,updated_at FROM guide_edits WHERE published IS NOT NULL').all();
   return json({guides:rows.results.map(r=>({id:r.guide_id,...JSON.parse(r.published),updatedAt:r.updated_at}))});
  }
  if(path==='/api/updates'&&method==='GET'){
   const rows=await db.prepare("SELECT id,guide_id,payload,created_at FROM content_revisions WHERE action='publish' ORDER BY id DESC LIMIT 50").all();
   return json({releases:RELEASE_NOTES,revisions:rows.results.map(r=>({id:String(r.id),guideId:r.guide_id,title:JSON.parse(r.payload).title,date:r.created_at}))});
  }
  if(!user)return json({error:'Sign in to sync or submit a report.'},401);
  if(path==='/api/sync'&&method==='GET'){
   const rows=await db.prepare('SELECT record_key,payload,revision,updated_at FROM player_records WHERE user_id=?').bind(user.userId).all();
   return json({records:rows.results.map(r=>({key:r.record_key,value:JSON.parse(r.payload),revision:r.revision,updatedAt:r.updated_at}))});
  }
  if(path==='/api/sync'&&method==='PUT'){
   const b=await read();if(!keys.has(b.key)||!validRecord(b.key,b.value)||!Number.isSafeInteger(b.baseRevision)||b.baseRevision<0)return json({error:'Invalid record.'},400);
   const payload=JSON.stringify(b.value);if(!payload||payload.length>200000)return json({error:'Record is too large.'},413);
   const row=await db.prepare('INSERT INTO player_records(user_id,record_key,payload,revision,updated_at) VALUES(?,?,?,1,?) ON CONFLICT(user_id,record_key) DO UPDATE SET payload=excluded.payload,revision=player_records.revision+1,updated_at=excluded.updated_at WHERE player_records.revision=? RETURNING revision,updated_at').bind(user.userId,b.key,payload,now,b.baseRevision).first();
   if(!row){const cloud=await db.prepare('SELECT payload,revision,updated_at FROM player_records WHERE user_id=? AND record_key=?').bind(user.userId,b.key).first();return json({error:'This record changed on another device.',conflict:{key:b.key,value:JSON.parse(cloud.payload),revision:cloud.revision,updatedAt:cloud.updated_at}},409);}
   return json({key:b.key,revision:row.revision,updatedAt:row.updated_at});
  }
  if(path==='/api/reports'&&method==='GET'){
   const rows=await db.prepare('SELECT id,guide_id,kind,game_build,status,response,created_at FROM guide_reports WHERE user_id=? ORDER BY created_at DESC LIMIT 100').bind(user.userId).all();return json({reports:rows.results});
  }
  if(path==='/api/reports'&&method==='POST'){
   const b=await read(),g=guides.find(g=>g.id===b.guideId),kinds=['Incorrect steps','Outdated version','Missing image','Suggestion'];
   if(!g||!kinds.includes(b.kind)||!g.platforms.includes(b.platform)||txt(b.details).length<12||!txt(b.build,80))return json({error:'Select a guide and platform; add a game version and a useful description.'},400);
   if(b.evidence&&!validLink(b.evidence))return json({error:'Evidence must be an HTTPS link.'},400);
   const count=await db.prepare('SELECT COUNT(*) AS n FROM guide_reports WHERE user_id=? AND created_at>?').bind(user.userId,new Date(Date.now()-86400000).toISOString()).first();
   if(count.n>=10)return json({error:'You can submit up to 10 reports per day.'},429);
   const id=crypto.randomUUID();await db.prepare('INSERT INTO guide_reports(id,user_id,guide_id,kind,platform,game_build,details,evidence,status,response,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)').bind(id,user.userId,g.id,b.kind,b.platform,txt(b.build,80),txt(b.details),validLink(b.evidence),'pending','',now,now).run();return json({id,status:'pending'},201);
  }
  if(path.startsWith('/api/admin/')&&!admin)return json({error:'This area is for the GameBreak editor.'},403);
  if(path==='/api/admin/reports'&&method==='GET'){const rows=await db.prepare('SELECT id,guide_id,kind,platform,game_build,details,evidence,status,response,created_at FROM guide_reports ORDER BY created_at DESC LIMIT 200').all();return json({reports:rows.results});}
  if(path==='/api/admin/reports'&&method==='PATCH'){
   const b=await read();if(!['pending','reviewing','resolved','declined'].includes(b.status))return json({error:'Invalid status.'},400);
   await db.prepare('UPDATE guide_reports SET status=?,response=?,updated_at=? WHERE id=?').bind(b.status,txt(b.response,1500),now,txt(b.id,50)).run();return json({ok:true});
  }
  if(path==='/api/admin/content'&&method==='GET'){
   const rows=await db.prepare('SELECT guide_id,draft,published,revision,updated_at FROM guide_edits').all();const history=await db.prepare('SELECT id,guide_id,payload,action,created_at FROM content_revisions ORDER BY id DESC LIMIT 100').all();return json({history:history.results.map(r=>({...r,payload:JSON.parse(r.payload)})),edits:rows.results.map(r=>({...r,draft:JSON.parse(r.draft),published:r.published?JSON.parse(r.published):null}))});
  }
  if(path==='/api/admin/content'&&method==='PUT'){
   const b=await read(),g=guides.find(g=>g.id===b.guideId);if(!g||!['draft','publish'].includes(b.action)||!Number.isSafeInteger(b.baseRevision)||b.baseRevision<0)return json({error:'Invalid guide or revision.'},400);
   const value=validateGuideEdit(b.value,g),payload=JSON.stringify(value),pub=b.action==='publish'?payload:null;
   const row=await db.prepare('INSERT INTO guide_edits(guide_id,draft,published,revision,updated_by,updated_at) VALUES(?,?,?,1,?,?) ON CONFLICT(guide_id) DO UPDATE SET draft=excluded.draft,published=CASE WHEN ?=\'publish\' THEN excluded.published ELSE guide_edits.published END,revision=guide_edits.revision+1,updated_by=excluded.updated_by,updated_at=excluded.updated_at WHERE guide_edits.revision=? RETURNING revision').bind(g.id,payload,pub,user.userId,now,b.action,b.baseRevision).first();
   if(!row)return json({error:'Another edit was saved. Reload before changing this guide.'},409);
   await db.prepare('INSERT INTO content_revisions(guide_id,payload,editor,action,created_at) VALUES(?,?,?,?,?)').bind(g.id,payload,user.userId,b.action,now).run();return json({ok:true,revision:row.revision,action:b.action,value});
  }
  return json({error:'Not found.'},404);
 }catch(error){if(error instanceof SyntaxError)return json({error:'Invalid JSON.'},400);if(/required|Enter|needs|large/.test(error.message))return json({error:error.message},400);return json({error:'Could not complete this request. Please retry; device data is preserved.'},500);}
}
