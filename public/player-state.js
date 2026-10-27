import {validRecord} from './state-schema.js';
const memory=new Map();let owner='';
export const SYNC_KEYS=['gamebreak-saved','gamebreak-progress','gamebreak-playbook','gamebreak-tool-plans','gamebreak-favorites','gamebreak-recent','gamebreak-map-progress','gamebreak-watched'];
const scoped=k=>owner?'gb-account:'+owner+':'+k:k;
export function setStorageOwner(id=''){owner=id;}
export function getStorageOwner(){return owner;}
export function guestValue(k,f){try{return JSON.parse(localStorage.getItem(k))??f;}catch{return f;}}
export const storage={
 get(k,f){const key=scoped(k);try{const v=JSON.parse(localStorage.getItem(key))??memory.get(key)??f;return SYNC_KEYS.includes(k)&&!validRecord(k,v)?f:v;}catch{return memory.get(key)??f;}},
 set(k,v,{silent=false}={}){const key=scoped(k);memory.set(key,v);let ok=true;try{localStorage.setItem(key,JSON.stringify(v));}catch{ok=false;}if(!silent&&typeof window!=='undefined')window.dispatchEvent(new CustomEvent('gb:storage',{detail:{key:k}}));return ok;}
};
