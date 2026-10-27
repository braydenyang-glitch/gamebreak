import {storage,SYNC_KEYS,setStorageOwner,guestValue} from './player-state.js';
export const cloudState={user:null,admin:false,status:'Checking account…',ready:false,busy:false,conflicts:[],available:false};
let timer,meta={},initialised=false,syncPaused=false;
export async function pauseSync(){syncPaused=true;clearTimeout(timer);while(cloudState.busy)await new Promise(resolve=>setTimeout(resolve,50));}
export function resumeSync(){syncPaused=false;syncCloud();}
const signal=()=>window.dispatchEvent(new CustomEvent('gb:cloud'));
export async function api(path,options={}){
 const res=await fetch('/api/'+path,{cache:'no-store',credentials:'same-origin',...options,headers:{...(options.body?{'Content-Type':'application/json'}:{}),...options.headers}});
 let data;try{data=await res.json();}catch{throw Error('Cloud service did not return data. Your device copy is safe.');}
 if(!res.ok){const error=Error(data.error||'Request failed.');error.status=res.status;error.data=data;throw error;}return data;
}
function saveMeta(){storage.set('gamebreak-sync-meta',meta,{silent:true});}
export async function initialiseCloud(){
 if(initialised)return;initialised=true;
 try{const result=await api('account');cloudState.user=result.user;cloudState.admin=result.admin;cloudState.available=result.cloudAvailable;setStorageOwner(result.user?.id||'');meta=storage.get('gamebreak-sync-meta',{});if(!meta||typeof meta!=='object')meta={};cloudState.status=result.user?'Account ready':'Guest · saved on this device';cloudState.ready=true;window.dispatchEvent(new CustomEvent('gb:owner'));if(result.user)await syncCloud();else signal();}
 catch{cloudState.ready=true;cloudState.status='Offline / cloud unavailable · using this device';signal();}
}
export async function syncCloud(){
 if(syncPaused||!cloudState.user||cloudState.busy)return;cloudState.busy=true;cloudState.status='Syncing…';signal();
 try{
  let changed=false;const {records}=await api('sync');const byKey=new Map(records.map(r=>[r.key,r]));cloudState.conflicts=[];
  for(const key of SYNC_KEYS){
   const remote=byKey.get(key),m=meta[key]||{revision:0,dirty:false};
   if(m.dirty){
    if((remote?.revision||0)!==m.revision){cloudState.conflicts.push({key,remote});continue;}
    const localValue=storage.get(key,null),sent=JSON.stringify(localValue);
    try{const saved=await api('sync',{method:'PUT',body:JSON.stringify({key,value:localValue,baseRevision:m.revision})});meta[key]={revision:saved.revision,dirty:JSON.stringify(storage.get(key,null))!==sent};}
    catch(error){if(error.status===409)cloudState.conflicts.push({key,remote:error.data.conflict});else throw error;}
   }else if(remote){if(JSON.stringify(storage.get(key,null))!==JSON.stringify(remote.value))changed=true;storage.set(key,remote.value,{silent:true});meta[key]={revision:remote.revision,dirty:false};}
  }
  saveMeta();cloudState.status=cloudState.conflicts.length?'Choose which changes to keep':Object.values(meta).some(m=>m.dirty)?'More changes waiting':'Synced · '+new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});if(changed)window.dispatchEvent(new CustomEvent('gb:owner'));
 }catch(error){cloudState.status=error.status===401?'Sign in again to sync':'Sync paused · device changes are kept';}
 finally{cloudState.busy=false;signal();if(cloudState.status==='More changes waiting'&&!cloudState.conflicts.length){clearTimeout(timer);timer=setTimeout(syncCloud,1000);}}
}
export async function resolveConflict(key,choice){const conflict=cloudState.conflicts.find(c=>c.key===key);if(!conflict)return;if(choice==='cloud')storage.set(key,conflict.remote?.value??null,{silent:true});meta[key]={revision:conflict.remote?.revision||0,dirty:choice==='device'};saveMeta();cloudState.conflicts=cloudState.conflicts.filter(c=>c.key!==key);await syncCloud();}
export function importGuest(){
 for(const key of SYNC_KEYS){const guest=guestValue(key,null);if(!guest)continue;const local=storage.get(key,null);let merged=guest;
  if(Array.isArray(guest))merged=[...new Set([...(Array.isArray(local)?local:[]),...guest])];
  else if(key==='gamebreak-playbook'){merged={...guest,...local,goals:[...(local?.goals||[]),...(guest.goals||[]).filter(g=>!(local?.goals||[]).some(x=>x.id===g.id))],notes:[...(local?.notes||[]),...(guest.notes||[]).filter(g=>!(local?.notes||[]).some(x=>x.id===g.id))],collections:[...new Set([...(local?.collections||[]),...(guest.collections||[])])]};}
  else if(guest&&typeof guest==='object')merged={...guest,...local};
  storage.set(key,merged);}
 return syncCloud();
}
window.addEventListener('gb:storage',event=>{if(!cloudState.user||!SYNC_KEYS.includes(event.detail.key))return;const key=event.detail.key;meta[key]={revision:meta[key]?.revision||0,dirty:true};saveMeta();clearTimeout(timer);timer=setTimeout(syncCloud,1400);});
window.addEventListener('online',()=>{if(cloudState.user)syncCloud();});
