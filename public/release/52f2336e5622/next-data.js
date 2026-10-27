import {GAMES,GUIDES} from './data.js';
import {COLLECTIONS} from './catalog-api.js';
import {CHALLENGES} from './visual-data.js';
export function cleanContext(input={}){const game=GAMES.find(g=>g.id===input.game)||GAMES[0],platform=game.platforms.includes(input.platform)?input.platform:game.platforms[0];return {game:game.id,platform,edition:game.id==='minecraft'?(input.edition==='Bedrock'||platform!=='PC'?'Bedrock':'Java'):game.scope,build:typeof input.build==='string'?input.build.trim().slice(0,80):''};}
export function contextHref(path,ctx,extra={}){const c=cleanContext(ctx),u=new URL(path,'https://gamebreak.local');for(const [k,v]of Object.entries({...c,...extra}))if(v){if(k==='edition'&&c.game!=='minecraft'){u.searchParams.set('mode',v);u.searchParams.delete('edition');}else u.searchParams.set(k,v);}return u.pathname+u.search;}
export function firstUnread(guide,checked=[]){const valid=new Set(Array.isArray(checked)?checked.filter(n=>Number.isInteger(n)&&n>=0&&n<guide.steps.length):[]);const step=guide.steps.findIndex((_,i)=>!valid.has(i));return {step:step<0?0:step,complete:step<0,done:valid.size};}
export const TEST_PRIORITY=GAMES.flatMap(game=>{const primary=CHALLENGES.find(c=>c.game===game.id)?.guide;const second=GUIDES.find(g=>g.game===game.id&&g.id!==primary);return [primary,second?.id].filter(Boolean);});
export function gameCoverage(game){const collections=COLLECTIONS.filter(c=>c.game===game);return {guides:GUIDES.filter(g=>g.game===game),collections,curated:collections.every(c=>c.kind==='curated'),tested:GUIDES.filter(g=>g.game===game&&g.playtested&&g.status!=='Unverified').length};}
export function entryDiff(previous,next){const map=new Map((previous||[]).map(x=>[x.id,x]));const stable=x=>JSON.stringify([x.name,x.summary,x.facts,x.tables,x.abilities,x.active]);let added=0,changed=0;for(const x of next||[]){const old=map.get(x.id);if(!old)added++;else if(stable(old)!==stable(x))changed++;map.delete(x.id);}return {added,changed,removed:map.size,total:(next||[]).length,needsReview:added+changed+map.size>0};}
export function validateFieldNote(note,guide,today=new Date().toISOString().slice(0,10)){
 if(!guide||!guide.platforms.includes(note.platform))throw Error('Select a supported platform.');
 if(!note.build?.trim()||!/^\d{4}-\d{2}-\d{2}$/.test(note.date)||!Number.isFinite(Date.parse(note.date))||new Date(note.date).toISOString().slice(0,10)!==note.date||note.date>today)throw Error('Add an exact build and a valid test date.');
 if(!['worked','failed','inconclusive'].includes(note.result)||note.details?.trim().length<20)throw Error('Describe what happened in at least 20 characters.');
 if(note.evidence){let u;try{u=new URL(note.evidence);}catch{}if(!u||u.protocol!=='https:'||u.username||u.password)throw Error('Use an HTTPS evidence link.');}
 return {guideId:guide.id,platform:note.platform,build:note.build.trim().slice(0,80),date:note.date,result:note.result,details:note.details.trim().slice(0,2000),evidence:note.evidence||'',status:'Personal evidence draft — not editorial verification'};
}
