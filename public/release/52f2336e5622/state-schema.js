const object=v=>!!v&&typeof v==='object'&&!Array.isArray(v);
const text=(v,n)=>typeof v==='string'&&v.length<=n;
const strings=(v,n=200)=>Array.isArray(v)&&v.length<=1000&&v.every(s=>text(s,n));
export function validRecord(key,value){
 if(value===null)return true;
 if(['gamebreak-saved','gamebreak-favorites','gamebreak-recent','gamebreak-map-progress','gamebreak-watched'].includes(key))return strings(value);
 if(key==='gamebreak-progress')return object(value)&&Object.entries(value).every(([k,v])=>text(k,200)&&Array.isArray(v)&&v.length<=100&&v.every(n=>Number.isInteger(n)&&n>=0&&n<100));
 if(key==='gamebreak-playbook')return object(value)&&strings(value.collections,40)&&Array.isArray(value.goals)&&value.goals.length<=500&&value.goals.every(g=>object(g)&&text(g.id,100)&&text(g.title,160)&&text(g.game,50)&&text(g.collection,40)&&typeof g.done==='boolean'&&Array.isArray(g.tasks)&&g.tasks.length<=100&&g.tasks.every(t=>object(t)&&text(t.text,700)&&typeof t.done==='boolean'))&&Array.isArray(value.notes)&&value.notes.length<=500&&value.notes.every(n=>object(n)&&text(n.id,100)&&text(n.game,50)&&text(n.text,2000)&&text(n.date,40));
 if(key==='gamebreak-tool-plans')return object(value)&&Object.keys(value).length<=10&&Object.values(value).every(v=>object(v)&&object(v.fields)&&Object.keys(v.fields).length<=100&&Object.values(v.fields).every(x=>text(x,3000)||typeof x==='number'||typeof x==='boolean'));
 return false;
}
