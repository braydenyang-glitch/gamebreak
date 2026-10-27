const tables=['player_records','guide_reports','guide_contributions','shared_playbooks','guide_votes'];
export async function handlePrivacy(request,{db,user,read,now}){
 if(new URL(request.url).pathname.replace(/\/$/,'')!=='/api/account-data')return null;
 const reply=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'private, no-store','Vary':'Cookie'}});
 if(!user)return reply({error:'Sign in to manage your account data.'},401);
 if(request.method==='GET'){
  const data={};for(const table of tables)data[table]=(await db.prepare(`SELECT * FROM ${table} WHERE user_id=?`).bind(user.userId).all()).results;
  return reply({exportedAt:now,account:{id:user.userId},data});
 }
 if(request.method==='POST'){
  const body=await read();if(body.action!=='delete-my-data'||body.confirmation!=='DELETE')return reply({error:'Type DELETE to confirm removal of your GameBreak data.'},400);
  await db.batch(tables.map(table=>db.prepare(`DELETE FROM ${table} WHERE user_id=?`).bind(user.userId)));
  return reply({ok:true,deletedAt:now});
 }
 return reply({error:'Method not supported.'},405);
}
