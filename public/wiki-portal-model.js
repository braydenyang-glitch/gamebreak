import {correctedQuery,distanceOne} from './search.js';

export const PORTAL_TOPICS={
 progression:{icon:'↗',name:['Getting started','新手與進度','入門・育成']},
 combat:{icon:'⚔',name:['Combat & survival','戰鬥與生存','戦闘・生存']},
 teams:{icon:'◇',name:['Teams & builds','隊伍與配裝','編成・装備']},
 resources:{icon:'▧',name:['Resources & currency','資源與貨幣','素材・通貨']},
 exploration:{icon:'⌖',name:['World & quests','世界與任務','探索・クエスト']},
 gacha:{icon:'✦',name:['Wishes & banners','抽卡與卡池','ガチャ・開催情報']},
 commands:{icon:'>_',name:['Commands & controls','指令與操作','コマンド・操作']}
};
export const pickText=(value,locale='en')=>Array.isArray(value)?value[locale==='zh-Hant'?1:locale==='ja'?2:0]||value[0]:String(value??'');
export const portalHref=(game,params={})=>`/wiki/${encodeURIComponent(game)}/${Object.keys(params).length?'?'+new URLSearchParams(params):''}`;
export function textLeaves(value){if(value==null)return '';if(Array.isArray(value))return value.map(textLeaves).join(' ');if(typeof value==='object')return Object.values(value).map(textLeaves).join(' ');return String(value);}
export function textMatches(query,text){const words=correctedQuery(query).split(/\s+/).filter(Boolean),hay=correctedQuery(text),tokens=hay.split(' '),compact=hay.replaceAll(' ','');return words.every(w=>hay.includes(w)||compact.includes(w)||w.length>=5&&/^[a-z]+$/.test(w)&&tokens.some(t=>distanceOne(w,t)));}
const TOPIC_OVERRIDES=Object.fromEntries(Object.entries({
 combat:['genshin-elemental-reactions','starrail-toughness','starrail-skill-points','minecraft-health-hunger','gta-wanted-level','gta-special-abilities','delta-ammo-armour','fortnite-ammunition','fortnite-healing','doors-rush-signals','doors-hide','pubg-assault-rifles','brawl-gadgets','wuwa-concerto','wuwa-forte-circuit'],
 teams:['genshin-artifacts','starrail-relics','brawl-star-powers','wuwa-echoes'],
 resources:['genshin-original-resin','starrail-trailblaze-power','minecraft-crafting','fortnite-building-materials','brawl-currencies','wuwa-waveplates','genshin-encounter-point-claims','genshin-weapon-material-route'],
 exploration:['minecraft-coordinates','gta-story-missions','delta-extraction-points','fortnite-storm','doors-guiding-light','pubg-blue-zone','pubg-vehicles','genshin-seelie','genshin-nine-pillars-stones','genshin-forge-treasure-compass'],
 progression:['genshin-adventure-rank','minecraft-respawn','gta-phone-quick-save','delta-operations','delta-stash-black-site','doors-hotel','pubg-training-mode','brawl-game-objectives']
}).flatMap(([topic,ids])=>ids.map(id=>[id,topic])));
export function guideTopic(g){if(TOPIC_OVERRIDES[g.id])return TOPIC_OVERRIDES[g.id];const s=correctedQuery([g.id?.replaceAll('-',' '),g.originalTitle,g.title,g.keywords,g.category,g.type].join(' '));
 if(g.type==='Command'||/command|settings|sensitivity|control|audio/.test(s))return 'commands';
 if(/wish|warp|convene|gacha|banner/.test(s))return 'gacha';
 if(/team|build|equipment|loadout|artifact|relic|echo|gear|weapon|upgrade/.test(s))return 'teams';
 if(/resource|material|currency|resin|waveplate|ore|diamond|gold|coin|credit|farm|loot|craft/.test(s))return 'resources';
 if(/combat|attack|dodge|parry|healing|weakness|aim|recoil|enemy|shield|rush|ambush|hide|ammo|surviv/.test(s))return 'combat';
 if(/quest|map|explor|travel|waypoint|mission|storm|circle|landing|route|extract|vehicle/.test(s))return 'exploration';
 return 'progression';
}
export function portalDirectory(game,{portals,guides,handbook,locale='en'}){
 const prefix=portals.find(p=>p.game===game);
 return [
 ...(prefix?.articles||[]).map(a=>({id:a.id,game,topic:a.topic,kind:'manual',title:pickText(a.title,locale),summary:pickText(a.summary,locale),scope:pickText(a.scope,locale),href:portalHref(game,{manual:a.id}),text:textLeaves([game,a.topic,PORTAL_TOPICS[a.topic]?.name,a.title,a.summary,a.scope,a.steps,a.keywords]),reviewed:a.reviewedAt})),
 ...guides.filter(g=>g.game===game).map(g=>({id:g.id,game,topic:guideTopic(g),kind:'guide',title:g.title,summary:g.description,scope:g.edition,href:`/guides/${g.id}/`,text:textLeaves([g.title,g.originalTitle,g.description,g.quick,g.steps,g.needs,g.trouble,g.keywords,g.searchAliases]),reviewed:g.reviewed})),
 ...handbook.filter(h=>h.game===game).map(h=>({id:h.id,game,topic:guideTopic(h),kind:'handbook',title:h.title,summary:h.summary,scope:h.scope,href:portalHref(game,{article:h.id}),text:textLeaves([h.title,h.summary,h.body,h.facts]),reviewed:h.asOf}))
 ];
}
export function filterDirectory(entries,{q='',topic='',kind=''}={}){return entries.filter(x=>(!topic||x.topic===topic)&&(!kind||x.kind===kind)&&textMatches(q,x.text));}
export function checklistProgress(values,total){const safe=Array.from({length:total},(_,i)=>values?.[i]===true);return {values:safe,done:safe.filter(Boolean).length,total};}
