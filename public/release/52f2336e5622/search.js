export const normalize=s=>String(s).normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
const aliases={'抽卡':'gacha','祈願':'wish','祈愿':'wish','躍遷':'warp','召喚':'convene','ガチャ':'gacha','資源':'resource','资源':'resource','素材':'material','資金':'currency','攻擊':'attack','攻击':'attack','攻撃':'attack','初心者':'beginner','新手':'beginner','報酬':'reward','獎勵':'reward','奖励':'reward','收集':'collect','収集':'collect','貨幣':'currency','通貨':'currency','育成':'upgrade','養成':'upgrade','養成':'upgrade','マインクラフト':'minecraft','フォートナイト':'fortnite','ブロスタ':'brawl stars','崩壊 スターレイル':'star rail','崩壊スターレイル':'star rail','鳴潮':'wuthering waves','三角洲行動':'delta force','デルタフォース':'delta force','俠盜獵車手':'gta','キャラクター':'character','武器':'weapon','コマンド':'command','ダイヤモンド':'diamond','任務':'quest','クエスト':'quest','回復':'healing','チーム':'team','編成':'team','超綻放':'hyperbloom','超绽放':'hyperbloom','配隊':'team','配队':'team','隊伍':'team','队伍':'team','鑽石':'diamond','钻石':'diamond','麥塊':'minecraft','我的世界':'minecraft','創世神':'minecraft','创世神':'minecraft','原神':'genshin','崩壞 星穹鐵道':'star rail','崩壞星穹鐵道':'star rail','角色':'character','武器':'weapon','治療':'healing','治疗':'healing','瞄準':'aim','瞄准':'aim','攻略':'guide',mincraft:'minecraft',minecarft:'minecraft',fortntie:'fortnite',fortnig:'fortnite',gensin:'genshin',robloxx:'roblox',pubgm:'pubg mobile','wuther waves':'wuthering waves','starrail':'star rail','崩坏':'崩壞','星穹铁道':'星穹鐵道','创世神':'minecraft','荒野乱斗':'荒野亂鬥','任务':'任務','指令':'command','任務':'quest','傳送':'travel','传送':'travel','闪避':'dodge','閃避':'dodge','寶石':'gem','宝石':'gem','終結技':'ultimate','终结技':'ultimate','弱點':'weakness','弱点':'weakness','撤離':'extraction','撤离':'extraction'};
export function correctedQuery(value){let q=normalize(value);for(const [a,b] of Object.entries(aliases).sort((a,b)=>b[0].length-a[0].length))q=q.replaceAll(a,' '+b+' ');return q.replace(/\s+/g,' ').trim().replace(/([\p{Script=Han}])([a-z])|([a-z])([\p{Script=Han}])/gu,(_,a,b,c,d)=>a?`${a} ${b}`:`${c} ${d}`);}
export function distanceOne(a,b){
 if(a===b)return true;
 if(Math.abs(a.length-b.length)>1)return false;
 if(a.length===b.length){const diff=[];for(let i=0;i<a.length;i++)if(a[i]!==b[i])diff.push(i);return diff.length===1||diff.length===2&&diff[1]===diff[0]+1&&a[diff[0]]===b[diff[1]]&&a[diff[1]]===b[diff[0]];}
 if(a.length>b.length)[a,b]=[b,a];let i=0,j=0;while(i<a.length&&j<b.length){if(a[i]===b[j])i++;j++;if(j-i>1)return false;}return true;
}
export function searchMatches(query,g,parent){
 const words=correctedQuery(query).split(/\s+/).filter(Boolean);
 const hay=correctedQuery([g.title,g.description,g.quick,g.steps?.join(' '),g.needs,g.trouble,g.success,g.keywords,g.searchAliases,g.edition,g.type,...g.platforms,parent.name,parent.originalName,parent.originalShort,parent.searchNames,parent.short,parent.zh].join(' '));
 const tokens=hay.split(' '),compact=hay.replaceAll(' ','');
 return words.every(w=>hay.includes(w)||compact.includes(w)||w.length>=5&&/^[a-z]+$/.test(w)&&tokens.some(t=>distanceOne(w,t)));
}
