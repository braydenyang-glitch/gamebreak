// Original GameBreak visual directions. Artwork remains attributed to its publisher.
export const WORLDS = {
 genshin:{accent:'#79ead1',secondary:'#f5d18a',ink:'#173b42',word:'Wander further.',zh:'探索，再遠一點。',tag:'OPEN WORLD / 01',scene:'console'},
 starrail:{accent:'#c2a3ff',secondary:'#83d7ff',ink:'#32274d',word:'Find your orbit.',zh:'找到你的星軌。',tag:'COSMIC STRATEGY / 02',scene:'console'},
 minecraft:{accent:'#c4f276',secondary:'#72d8e8',ink:'#233d2a',word:'Make something yours.',zh:'打造屬於你的世界。',tag:'BUILD & DISCOVER / 03',scene:'island'},
 gta:{accent:'#ffb892',secondary:'#f195c6',ink:'#4e3347',word:'Take the scenic route.',zh:'探索城市的另一面。',tag:'STORY MODE / 04',scene:'crate'},
 delta:{accent:'#81e3b4',secondary:'#d6ef87',ink:'#173b33',word:'Plan your way out.',zh:'規劃你的撤離路線。',tag:'TACTICAL OPERATIONS / 05',scene:'crate'},
 fortnite:{accent:'#bcb1ff',secondary:'#ffb8db',ink:'#353069',word:'Drop into possibility.',zh:'降落，開啟新可能。',tag:'BATTLE ROYALE / 06',scene:'console'},
 roblox:{accent:'#ffd77e',secondary:'#fd9398',ink:'#57372a',word:'Open the next door.',zh:'打開下一扇門。',tag:'DOORS / THE HOTEL / 07',scene:'console'},
 pubg:{accent:'#ffd16f',secondary:'#a8d7b2',ink:'#48402a',word:'Think one move ahead.',zh:'先想好下一步。',tag:'BATTLEGROUNDS / PC / 08',scene:'crate'},
 brawl:{accent:'#ffb4de',secondary:'#ffe580',ink:'#522b60',word:'Small arena. Big plays.',zh:'小競技場，大展身手。',tag:'TEAM PLAY / 09',scene:'console'},
 wuwa:{accent:'#8be1e5',secondary:'#d3d29c',ink:'#203e4a',word:'Find your rhythm.',zh:'找到你的戰鬥節奏。',tag:'COMBAT & EXPLORATION / 10',scene:'console'}
};
export const CHALLENGES = [
 {game:'genshin',guide:'genshin-seelie',q:['An empty Seelie court. What could reveal a direction clue?','遇到空的仙靈座，什麼可以提供方向線索？'],a:[['Elemental Sight','元素視野'],['Change the time','調整時間'],['Use food','使用食物']],correct:0},
 {game:'starrail',guide:'starrail-skill-points',q:['Your team is low on Skill Points. What generally restores one?','隊伍戰技點不足，一般可以用什麼恢復一點？'],a:[['Open the inventory','打開背包'],['A normal Basic Attack','一般的普通攻擊'],['Use every Skill','使用所有戰技']],correct:1},
 {game:'minecraft',guide:'minecraft-useful-commands',q:['Which command sets daytime when you have permission?','擁有指令權限時，哪個指令能設定白天？'],a:[['/weather day','/weather day'],['/day true','/day true'],['/time set day','/time set day']],correct:2},
 {game:'gta',guide:'gta-mission-disrupted',q:['For “Mission Disrupted”, which workaround does this guide describe?','遇到「任務中斷」，這篇攻略建議哪個處理方式？'],a:[['Leave, then take a taxi and skip the ride','離開區域，再搭計程車並跳過車程'],['Delete every save','刪除所有存檔'],['Buy a new car','購買新車']],correct:0},
 {game:'delta',guide:'delta-extraction',q:['Before collecting more loot, what should you check?','收集更多戰利品之前，應該先確認什麼？'],a:[['Only your outfit','只有服裝'],['Exit location and extraction requirements','撤離地點及條件'],['Your profile picture','個人頭像']],correct:1},
 {game:'fortnite',guide:'fortnite-pickup',q:['You cannot pick up items. What control conflict should you check?','無法拾取物品，這篇攻略建議檢查哪組按鍵衝突？'],a:[['Volume and brightness','音量與亮度'],['Map and emotes','地圖與表情'],['Sprint and Use bindings','衝刺與使用按鍵']],correct:2},
 {game:'roblox',guide:'doors-seek',q:['During The Hotel Seek chase, what helps identify the route?','DOORS 飯店的 Seek 追逐中，什麼能提示路線？'],a:[['Guiding Light’s blue cues','指引之光的藍色提示'],['Standing still','站在原地'],['Opening the shop','開啟商店']],correct:0},
 {game:'pubg',guide:'pubg-blue-zone',q:['On the PUBG PC map, what marks the next safe area?','PUBG 電腦版地圖上，什麼標示下一個安全區？'],a:[['Any red building','任何紅色建築'],['The white circle','白色圓圈'],['Your teammate’s name','隊友名稱']],correct:1},
 {game:'brawl',guide:'brawl-gem-grab',q:['In standard 3v3 Gem Grab, what gem total starts the winning countdown?','標準 3 對 3 寶石爭奪戰中，隊伍持有幾顆寶石會開始勝利倒數？'],a:[['3','3'],['20','20'],['10','10']],correct:2},
 {game:'wuwa',guide:'wuwa-dodge-counter',q:['After a successful dodge, what follows for a Dodge Counter?','成功閃避後，接什麼操作能進行閃避反擊？'],a:[['A Basic Attack','普通攻擊'],['Open the map','打開地圖'],['Change the language','更換語言']],correct:0}
];
export const CRAFT_IDS=['crafting_table','stick','ladder','oak_boat'];
export function trimmedGrid(grid){
 if(!Array.isArray(grid)||grid.length!==9)return [];
 const occupied=grid.map((v,i)=>v?i:-1).filter(i=>i>=0);if(!occupied.length)return [];
 const left=Math.min(...occupied.map(i=>i%3)),right=Math.max(...occupied.map(i=>i%3));
 const top=Math.floor(Math.min(...occupied)/3),bottom=Math.floor(Math.max(...occupied)/3);
 return Array.from({length:bottom-top+1},(_,y)=>grid.slice((top+y)*3+left,(top+y)*3+right+1).map(v=>v||null));
}
export function matchCraft(grid,recipes){
 const actual=JSON.stringify(trimmedGrid(grid));if(actual==='[]')return null;
 for(const item of recipes.filter(r=>CRAFT_IDS.includes(r.id))){for(const variant of item.recipes||[]){if(!variant.shape)continue;
  if(actual===JSON.stringify(variant.shape)||actual===JSON.stringify(variant.shape.map(row=>[...row].reverse())))return {id:item.id,name:item.name,count:variant.outputCount};
 }}return null;
}
