import {recursiveCraft,teamCoverage} from './advanced-math.js';
// Compare recorded data, never infer damage, rankings or game inventory.
export function compareTeams(a,b){return {a:teamCoverage(a),b:teamCoverage(b)};}
export function compareCrafts(recipes,a,b,owned={}){return {a:recursiveCraft(recipes,a.item,a.quantity,owned),b:recursiveCraft(recipes,b.item,b.quantity,owned)};}
export function orderedRoute(markers,ids){const byId=new Map(markers.map(m=>[m.id,m]));return [...new Set(ids)].map(id=>byId.get(id)).filter(Boolean);}
export function moveRoute(ids,index,delta){const out=[...ids],target=index+delta;if(index<0||index>=out.length||target<0||target>=out.length)return out;[out[index],out[target]]=[out[target],out[index]];return out;}
export function unreadUpdates(revisions,watched,seen){const newest=new Map();for(const r of revisions){if(!watched.includes(r.guideId))continue;const old=newest.get(r.guideId);if(!old||String(r.date)>String(old.date))newest.set(r.guideId,r);}return [...newest.values()].map(r=>({...r,unread:seen[r.guideId]!==r.id})).sort((a,b)=>String(b.date).localeCompare(String(a.date)));}
export function scenarioSteps(guide){return guide.steps.slice(0,4).map((text,index)=>({index,text}));}
export const WORLD_SIGNS={genshin:'✧',starrail:'✦',minecraft:'▦',gta:'↗',delta:'⌖',fortnite:'ϟ',roblox:'◫',pubg:'◎',brawl:'★',wuwa:'≋'};
