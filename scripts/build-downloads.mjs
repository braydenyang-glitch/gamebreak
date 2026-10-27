import {writeFile,mkdir,readFile} from 'node:fs/promises';
import {GUIDES,GAMES,findGame} from '../public/data.js';
import {HANDBOOK} from '../public/handbook.js';
import {setLocale,gameName} from '../public/locale.js';
const root=new URL('../public/downloads/',import.meta.url),origin='https://gamebreak-brayden.yenhui.chatgpt.site';
const terms={en:['Player guide library','Source checked','Not playtested; source review does not prove latest-patch accuracy.','Before you start','Success check','Troubleshooting','Sources','Open in GameBreak','Beginner handbook'], 'zh-Hant':['玩家攻略資料庫','來源核對','尚未實測；來源核對不代表最新版本已驗證。','開始之前','成功判斷','疑難排解','來源','在 GameBreak 開啟','新手指南'],ja:['プレイヤーガイド集','出典確認','ゲーム内未検証。出典の確認日は最新パッチの動作保証ではありません。','始める前に','成功の確認','トラブル対処','出典','GameBreak で開く','初心者ハンドブック']};
for(const locale of ['en','zh-Hant','ja']){
 setLocale(locale);const t=terms[locale],code=locale==='zh-Hant'?'zh':locale;
 const translations=locale==='en'?{}:JSON.parse(await readFile(new URL('../public/catalog/guide-'+code+'.json',import.meta.url))),handbook=locale==='en'?{}:JSON.parse(await readFile(new URL('../public/catalog/handbook-'+code+'.json',import.meta.url)));
 const list=GUIDES.map(g=>({...g,...translations[g.id]})),articles=HANDBOOK.map(h=>({...h,...handbook[h.id]}));
 const guide=g=>`## ${g.title}\n\n${gameName(g.game)} · ${g.edition} · ${g.platforms.join(' / ')}\n\n${t[1]}: ${g.reviewed}. ${locale==='en'?g.status:terms[locale][2]} · ${t[2]}\n${g.version}\n\n${g.quick}\n\n${t[3]}: ${g.needs}\n\n${g.steps.map((s,i)=>`${i+1}. ${s}`).join('\n')}\n\n${t[4]}: ${g.success}\n\n${t[5]}: ${g.trouble}\n\n${g.note}\n\n${t[6]}: [${g.sourceName}](${g.source})${(g.sourceLinks||[]).filter(x=>x.url!==g.source).map(x=>`\n- [${x.label}](${x.url})`).join('')}\n\n[${t[7]}](${origin}/${locale}/guides/${g.id}/)\n`;
 const intro=`# GameBreak — ${t[0]}\n\nBrayden Yang · 2026-10-26\n\n${t[2]}\n\n`;
 const dirs=locale==='en'?[root,new URL('en/',root)]:[new URL(locale+'/',root)];
 for(const dir of dirs){await mkdir(new URL('guides/',dir),{recursive:true});await writeFile(new URL('gamebreak-guide-library.md',dir),intro+list.map(guide).join('\n---\n\n'));for(const g of GAMES)await writeFile(new URL(g.id+'-guides.md',dir),intro+list.filter(x=>x.game===g.id).map(guide).join('\n---\n\n'));for(const g of list)await writeFile(new URL('guides/'+g.id+'.md',dir),intro+guide(g));await writeFile(new URL('gamebreak-handbook.md',dir),`# GameBreak — ${t[8]}\n\n${t[2]}\n\n`+articles.map(h=>`## ${h.title}\n\n${gameName(h.game)} · ${h.category}\n\n${h.summary}\n\n${h.body.join('\n\n')}\n\n${h.facts.map(([k,v])=>`- ${k}: ${v}`).join('\n')}\n\n${t[1]} ${h.asOf}\n\n[${h.sourceName}](${h.source})\n${(h.additionalSources||[]).map(s=>`- [${s.name||s.label}](${s.url})`).join('\n')}\n`).join('\n---\n\n'));}
}
const cell=v=>'"'+String(v??'').replace(/^[=+@\-]/,m=>"'"+m).replaceAll('"','""')+'"';
await writeFile(new URL('gamebreak-guide-index.csv',root),[['Game','Title','Edition','Platform','Source checked','Gameplay status','Source','URL'],...GUIDES.map(g=>[findGame(g.game).name,g.title,g.edition,g.platforms.join(' / '),g.reviewed,g.status,g.source,origin+'/en/guides/'+g.id+'/'])].map(row=>row.map(cell).join(',')).join('\n'));
console.log('Created 160 guides, 10 game packs and handbook downloads in 3 languages.');
