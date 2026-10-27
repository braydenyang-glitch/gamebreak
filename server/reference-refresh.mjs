import {COLLECTIONS,normalizeCollection} from '../public/catalog-api.js';
import {boundedJSON,providerFingerprint} from './source-monitor.mjs';
const json=(value,status=200)=>Response.json(value,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
// Public reference data only. URLs and normalizers are fixed in code; callers cannot
// submit data, credentials, destinations, or arbitrary fetch URLs.
export async function handleReferenceRefresh(request,{db,read,now,fetcher=fetch}){
 const url=new URL(request.url),path=url.pathname.replace(/\/$/,'');
 if(path.startsWith('/api/reference/')&&request.method==='GET'){
  const id=path.split('/').pop();if(!COLLECTIONS.some(c=>c.id===id&&c.endpoint))return json({error:'Unknown reference collection.'},404);
  const row=await db.prepare('SELECT payload,retrieved_at FROM provider_snapshots WHERE collection_id=?').bind(id).first();
  return row?json({...JSON.parse(row.payload),retrievedAt:row.retrieved_at,mode:'shared'}):json({error:'No shared snapshot yet.'},404);
 }
 if(path!=='/api/reference-refresh')return null;
 if(request.method!=='POST')return json({error:'Use POST.'},405);
 const b=await read(),cfg=COLLECTIONS.find(c=>c.id===b.collection&&c.endpoint);
 if(!cfg)return json({error:'Choose a supported reference collection.'},400);
 const cutoff=new Date(Date.parse(now)-6*60*60*1000).toISOString();
 const retryCutoff=new Date(Date.parse(now)-5*60*1000).toISOString();
 // One atomic claim per collection per six hours also bounds concurrent requests. Failed checks may retry after five minutes.
 const lock=await db.prepare(`INSERT INTO provider_refresh_locks(collection_id,attempted_at) VALUES(?,?) ON CONFLICT(collection_id) DO UPDATE SET attempted_at=excluded.attempted_at WHERE provider_refresh_locks.attempted_at<=? OR (provider_refresh_locks.attempted_at<=? AND EXISTS(SELECT 1 FROM provider_checks WHERE provider_checks.collection_id=excluded.collection_id AND status='unavailable')) RETURNING collection_id`).bind(cfg.id,now,cutoff,retryCutoff).first();
 if(!lock)return json({ok:true,status:'cached',message:'A shared check is recent or in progress. Successful checks refresh after six hours; failed checks can retry after five minutes.'});
 let data;
 try{
  const response=await fetcher(cfg.endpoint,{signal:AbortSignal.timeout(12000),redirect:'manual',headers:{Accept:'application/json'}});
  data=normalizeCollection(cfg.id,await boundedJSON(response));
  if(new TextEncoder().encode(JSON.stringify(data)).length>1900000)throw Error('Normalized dataset exceeds storage limit');
 }catch(error){
  console.warn('Reference refresh failed',cfg.id,String(error?.message||error).slice(0,240));
  await db.prepare("INSERT INTO provider_checks(collection_id,status,checked_at) VALUES(?,'unavailable',?) ON CONFLICT(collection_id) DO UPDATE SET status='unavailable',checked_at=excluded.checked_at").bind(cfg.id,now).run();
  return json({ok:false,status:'unavailable',message:'Provider unavailable. The last successful snapshot is retained.'});
 }
 const fingerprint=await providerFingerprint(data.entries);
 await db.batch([
  db.prepare('INSERT INTO provider_snapshots(collection_id,payload,retrieved_at) VALUES(?,?,?) ON CONFLICT(collection_id) DO UPDATE SET payload=excluded.payload,retrieved_at=excluded.retrieved_at').bind(cfg.id,JSON.stringify({...data,version:cfg.version||null}),now),
  db.prepare("INSERT INTO provider_checks(collection_id,status,entry_count,checked_at,last_success,fingerprint,pending) VALUES(?,'live',?,?,?,?,0) ON CONFLICT(collection_id) DO UPDATE SET status='live',entry_count=excluded.entry_count,checked_at=excluded.checked_at,last_success=excluded.last_success,pending=CASE WHEN provider_checks.fingerprint<>'' AND provider_checks.fingerprint<>excluded.fingerprint THEN 1 ELSE provider_checks.pending END,review_note=CASE WHEN provider_checks.fingerprint<>'' AND provider_checks.fingerprint<>excluded.fingerprint THEN '' ELSE provider_checks.review_note END,fingerprint=excluded.fingerprint").bind(cfg.id,data.entries.length,now,now,fingerprint)
 ]);
 return json({ok:true,status:'live',collection:cfg.id,count:data.entries.length,retrievedAt:now});
}
