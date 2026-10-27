// Four task-specific interfaces paired with the Apply Figma mobile designs.
import {L} from './preferences.js';
import {GUIDES} from './data.js';
import {uiIcon} from './ui-pages.js';
import {e} from './playbook.js';
import {localizedHref} from './locale.js';
let observer;
const a=(path,label)=>`<a href="${e(localizedHref(path))}">${label}</a>`;
const mascot=(id,alt)=>`<img class="au-mascot" src="/assets/worlds/${id}.png" alt="${alt}" width="160" height="160">`;
const banner=(kind,kicker,title,sub,art)=>`<header class="au-banner au-${kind}"><div class="au-banner-copy"><p class="au-eyebrow">${kicker}</p><${kind==='guide'?'h2':'h1'}>${title}</${kind==='guide'?'h2':'h1'}><p class="au-subtitle">${sub}</p></div>${art}<span class="au-ornament" aria-hidden="true">✧</span></header>`;
export function cleanupAssignmentUI(){observer?.disconnect();delete document.body.dataset.assignment;}
export function enhanceAssignmentUI(route){
 const main=document.querySelector('#main');
 const guide=route.page==='guide'&&GUIDES.find(g=>g.id===route.id);
 const reader=guide?.game==='genshin',wiki=route.page==='wiki'&&route.id==='minecraft'&&route.query.has('entry'),tools=route.page==='tools'&&route.query.get('game')==='minecraft',journal=route.page==='me';
 if(!reader&&!wiki&&!tools&&!journal)return;
 document.body.dataset.assignment=reader?'guide':wiki?'wiki':tools?'tools':'journal';
 main.querySelectorAll('.gw-context').forEach(n=>n.remove());
 if(reader){
  const hero=main.querySelector('.detail-hero');
  hero?.insertAdjacentHTML('beforebegin',banner('guide','GENSHIN IMPACT / FIELD NOTES',L('Traveler’s field guide.','旅行者探索手冊。','旅人の探索ノート。'),L('A little guidance. A world to discover.','帶著線索，探索更大的世界。','手がかりを胸に、世界を探そう。'),mascot('ayaka',L('Kamisato Ayaka, official chibi illustration','神里綾華官方 Q 版插畫','神里綾華の公式ミニキャライラスト'))));
  const bar=main.querySelector('.k-reader-bar');if(bar)main.querySelector('.au-banner').before(bar);
  main.querySelector('.au-banner')?.insertAdjacentHTML('afterend',`<nav class="au-tabs" aria-label="${L('Guide sections','攻略章節','攻略の項目')}">${a('#knowledge-guide-0',L('Quick answer','快速解答','答え'))}${a('#knowledge-guide-1',L('Steps','步驟','手順'))}${a('#knowledge-guide-4',L('Sources','來源','出典'))}</nav>`);
  const quick=main.querySelector('.quick-answer');if(quick){quick.classList.add('au-answer');quick.querySelector('h2').textContent=L('Your next move','你的下一步','次の一手');}
 }
 if(wiki){
  const old=main.querySelector('.gw-hero');
  if(old)old.outerHTML=banner('wiki','MINECRAFT / FIELD ARCHIVE','BLOCKPEDIA',L('Know your world. Build your next.','認識世界，打造下一步。','世界を知り、次をつくる。'),'<img class="au-landscape" src="/assets/worlds/voxel-landscape.svg" alt="" width="350" height="160">');
  const decorate=()=>{const entry=main.querySelector('.k-entry,.d-entry');if(!entry||entry.dataset.assignmentReady)return;entry.dataset.assignmentReady='true';if(route.query.get('entry')==='333'&&route.query.get('collection')==='minecraft-pc-items'){const art=entry.querySelector('.d-hero-art');if(art)art.innerHTML='<img class="au-table-art" src="/assets/ui/crafting-table.svg" alt="'+L('Crafting table · original GameBreak illustration','工作台 · GameBreak 原創插畫','作業台 · GameBreakオリジナルイラスト')+'" width="110" height="110"><span class="d-object-code">'+L('Original illustration','原創插畫','オリジナルイラスト')+'</span>'; }const heading=entry.querySelector('.k-entry-heading');if(heading){heading.insertAdjacentHTML('afterbegin',`<p class="au-entry-number">BLOCK FILE / ${route.query.get('collection')?.includes('bedrock')?'BEDROCK':'JAVA'}</p>`);}const tabs=entry.querySelector('.k-entry-tabs');if(tabs)tabs.classList.add('au-pixel-tabs');};
  decorate();observer=new MutationObserver(decorate);observer.observe(main,{childList:true,subtree:true});
 }
 if(tools){
  const title=main.querySelector('.ui-workbench-title');if(title)title.outerHTML=banner('tools','MINECRAFT / CRAFTING LAB',L('WORKBENCH','合成工作台','作業台'),L('Count less. Build more.','精準計算，放手建造。','計算は少なく、建築はもっと。'),'<img class="au-block" src="/assets/ui/crafting-table.svg" width="110" height="110" alt="">');
  main.querySelector('.ui-converter')?.insertAdjacentHTML('afterbegin',`<p class="au-work-order">${L('WORK ORDER 01 · OAK PLANKS','製作計畫 01 · 橡木材','作業計画 01 · オークの板材')}</p>`);
  const output=main.querySelector('.ui-calculator-output');output?.insertAdjacentHTML('beforeend','<div class="au-material-strip" aria-hidden="true"><img src="/assets/worlds/trunk_top.png" alt=""><span>→</span>'+Array(4).fill('<img src="/assets/worlds/wood.png" alt="">').join('')+'</div>');
 }
 if(journal){
  main.querySelector('.gw-journal-mascot')?.remove();const title=main.querySelector('.ui-personal-title');
  if(title)title.outerHTML=banner('journal','GAMEBREAK / YOUR ADVENTURE',L('Adventurer’s journal.','冒險家的旅程日誌。','冒険者の旅日記。'),L('Every small step deserves a bookmark.','每一小步，都值得留下記錄。','小さな一歩も、しおりに残そう。'),mascot('sayu',L('Sayu, official chibi illustration','早柚官方 Q 版插畫','早柚の公式ミニキャライラスト')));
  main.querySelector('.ui-personal')?.insertAdjacentHTML('beforeend',`<section class="au-journal-links"><p class="au-eyebrow">${L('CHOOSE YOUR NEXT CHAPTER','選擇下一個章節','次の章を選ぼう')}</p><div>${a('/wiki/genshin/',L('Explore Teyvat','探索提瓦特','テイワット探索'))}${a('/tools/?game=minecraft',L('Plan a build','規劃建造','建築を計画'))}${a('/resources/',L('Community atlas','社群地圖','コミュニティ'))}</div></section>`);
 }
 main.insertAdjacentHTML('beforeend',`<details class="au-design-notes"><summary>${L('Design & illustration credits','設計與插畫來源','デザインとイラストの出典')}</summary><p>${L('Original GameBreak layout. Reference patterns: clear article sections from Minecraft Wiki, task-first guides from KQM, and illustrated adventure styling from HoYoverse.','GameBreak 原創版面。參考 Minecraft Wiki 的文章分類、KQM 的攻略結構，以及 HoYoverse 的冒險插畫風格。','GameBreak独自のレイアウト。Minecraft Wikiの分類、KQMの攻略構成、HoYoverseのイラスト表現を参考にしています。')}</p><p>${a('/assets/worlds/CREDITS.txt',L('Artwork, textures & font licenses ↗','美術、材質與字體授權 ↗','素材とフォントのライセンス ↗'))} · ${a('/resources/',L('Reference websites ↗','參考網站 ↗','参考サイト ↗'))}</p></details>`);
}
