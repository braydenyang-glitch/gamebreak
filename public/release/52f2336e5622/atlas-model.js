// Pure helpers shared by the portal, source directory and their tests.
export const SOURCE_TYPES={
 official:['Official','官方','公式'],wiki:['Wiki','百科','Wiki'],community:['Community','玩家社群','コミュニティ'],tool:['Tools & databases','工具與資料庫','ツール・データ'],legacy:['Older reference','舊版參考','旧資料']
};
export const INTENTS={
 start:{label:['First steps','從零開始','はじめの一歩'],topics:['progression','exploration']},
 prepare:{label:['Build & battle','配裝與戰鬥','編成・戦闘'],topics:['teams','combat']},
 collect:{label:['Find resources','收集與探索','収集・探索'],topics:['resources','exploration','gacha','commands']}
};
export function cleanPins(value,sites){return [...new Set(Array.isArray(value)?value:[])].filter(id=>sites.some(s=>s.id===id)).slice(0,60);}
export function filterSites(sites,{game='',type='',q='',pinned=false,pins=[]}={}){
 const terms=String(q).normalize('NFKC').toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
 return sites.filter(s=>(!game||s.game===game)&&(!type||s.type===type)&&(!pinned||pins.includes(s.id))&&terms.every(t=>[s.name,s.game,s.url,...Object.values(s.note),...s.features].join(' ').normalize('NFKC').toLocaleLowerCase().includes(t)));
}
export function chooseSession(entries,game,intent='start'){
 const topics=(INTENTS[intent]||INTENTS.start).topics;
 const candidates=entries.filter(x=>x.game===game&&x.kind==='manual');
 const selected=candidates.filter(x=>topics.includes(x.topic));
 // A small learning route, not a generated build recommendation.
 return [...selected,...candidates.filter(x=>!selected.includes(x))].slice(0,3);
}
export function cleanSessionProgress(value,entries){return [...new Set(Array.isArray(value)?value:[])].filter(id=>entries.some(x=>x.id===id));}
