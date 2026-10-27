import {GAMES,GUIDES} from './data.js';

const asset=(name,cls='')=>`<img class="${cls}" src="/assets/figma/${name}.svg" alt="" draggable="false">`;
const entries=[
 ['genshin','Genshin<br>Impact','','imgRectangle10','imgGame01GenshinImpact'],
 ['starrail','Honkai:<br>Star Rail','','imgRectangle9','imgGame02HonkaiStarRail'],
 ['minecraft','Minecraft','Java / Bedrock','imgRectangle8','imgGame03Minecraft'],
 ['gta','GTA V','Story mode','imgRectangle7','imgGame04GtaV'],
 ['delta','Delta Force','PC Operations','imgRectangle6','imgGame05DeltaForce'],
 ['fortnite','Fortnite','Battle Royale','imgRectangle5','imgGame06Fortnite'],
 ['roblox','Roblox','DOORS','imgRectangle4','imgGame07Roblox'],
 ['pubg','PUBG','Battlegrounds','imgRectangle3','imgGame08Pubg'],
 ['brawl','Brawl Stars','Brawlers','imgRectangle2','imgGame09BrawlStars'],
 ['wuwa','Wuthering<br>Waves','','imgRectangle1','imgGame10WutheringWaves']
];

function handheld(){
 const parts=[['imgVector22',13,16],['imgVector23',14.5,13.5],['imgVector24',32,24],['imgVector25',18,39.5],['imgVector26',109.6,38.6],['imgVector27',106.6,45.6],['imgVector27',112.6,48.6],['imgVector28',52,76],['imgVector29',76,76],['imgIconMonitor',14.9,101.8],['imgIconBolt',48.9,99],['imgIconCode',77.95,101.9],['imgVector30',115,-1],['imgVector31',0,99]];
 return `<div class="hp-handheld" aria-hidden="true">${parts.map(([name,x,y])=>`<span style="left:${x}px;top:${y}px">${asset(name)}</span>`).join('')}<img class="hp-handheld-screen" src="/assets/figma/imgRectangle12.png" alt="" width="65" height="38"></div>`;
}

export function mobileHomepage(){
 const time=new Intl.DateTimeFormat('en-GB',{hour:'numeric',minute:'2-digit',hour12:false}).format(new Date());
 return `<div class="hp-home">
 <header class="hp-top">
  <div class="hp-status" aria-hidden="true"><span>${time}</span><span class="hp-status-icons">${asset('imgVector11')}${asset('imgVector12')}<span class="hp-battery">${asset('imgVector14')}${asset('imgVector15')}${asset('imgVector16')}</span></span></div>
  <div class="hp-brand-row"><a href="/" class="hp-brand" aria-label="GameBreak home">${asset('imgVector17')}<span>gamebreak</span></a><button type="button" class="hp-menu" data-action="homeMenu" aria-label="Open GameBreak menu" aria-haspopup="dialog">${asset('imgMenuButton44Px')}</button></div>
  <form id="homeSearch" class="hp-search" role="search"><label for="heroQuery" class="sr-only">Search games and guides</label>${asset('imgIconSearch')}<input id="heroQuery" name="q" type="search" placeholder="Search games & guides" autocomplete="off"><button type="submit" aria-label="Search games and guides">${asset('imgIconArrow')}</button></form>
 </header>
 <div class="hp-content">
  <section class="hp-cover" aria-labelledby="hp-title"><div class="hp-cover-copy"><span class="hp-badge">PLAYER WIKI</span><h1 id="hp-title">Less stuck.<br>More play.</h1><p>Your next shortcut.</p></div>${handheld()}</section>
  <section class="hp-directory" aria-labelledby="hp-games"><div class="hp-heading"><h2 id="hp-games">Explore your games</h2><span aria-label="10 supported games">10</span></div><div class="hp-game-grid">${entries.map(([id,label,sub,picture,bg])=>`<a class="hp-game hp-game-${id}" href="/games/${id}/" aria-label="${GAMES.find(g=>g.id===id).name}${sub?' · '+sub:''}" style="--card-art:url('/assets/figma/${bg}.svg')"><img class="hp-game-image" src="/assets/figma/${picture}.png" alt="" width="40" height="40"><span><strong>${label}</strong>${sub?`<small>${sub}</small>`:''}</span></a>`).join('')}</div></section>
  <a href="/explore/" class="hp-quick"><span class="hp-quick-icon">${asset('imgIconBook')}</span><span><strong>Your next move</strong><small>Maps. Guides. Tools. Playbook.</small></span>${asset('imgIconArrow1','hp-quick-arrow')}</a>
 </div></div>`;
}

export function bottomNavigation(){
 return `<nav class="hp-bottom" aria-label="Quick navigation"><div class="hp-bottom-inner">${[['games','/games/','Games','imgIconMonitor1'],['guides','/guides/','Guides','imgIconBook1'],['wiki','/wiki/','Wiki','imgIconCompass'],['tools','/tools/','Tools','imgIconCode'],['me','/me/','My','imgIconBookmark']].map(([page,href,label,ico])=>`<a href="${href}" data-nav="${page}" class="hp-nav">${asset(ico)}<span>${label}</span></a>`).join('')}</div><div class="hp-home-indicator" aria-hidden="true"></div></nav>`;
}

export function homeMenu(){return `<div class="eyebrow">GAMEBREAK / 3.0</div><h2>Your next move</h2><nav class="n-compact-menu" aria-label="GameBreak menu"><section><h3>Home & Games</h3><a href="/explore/">World select →</a><a href="/games/">All ten games →</a><a href="/wiki/">Encyclopedia →</a></section><section><h3>Guides</h3><a href="/guides/">Browse ${GUIDES.length} guides →</a><a href="/help/">Help me get unstuck →</a><a href="/sources/">Data, sources & coverage →</a><a href="/fieldnotes/">Gameplay evidence notebook →</a></section><section><h3>Tools & discovery</h3><a href="/tools/">Ten game toolkits →</a><a href="/showcase/">3D collection →</a><a href="/studio/">A/B workbench →</a><a href="/playroom/">Practice challenges →</a><a href="/maps/">Maps & saved routes →</a></section><section><h3>My checkpoint</h3><a href="/me/">Resume, favourites & plans →</a><a href="/playbook/">Playbook, account & sync →</a><a href="/offline/">Offline packs →</a><a href="/settings/">Language & reading settings →</a><a href="/contribute/">Questions & contributions →</a></section></nav><button class="secondary-button" data-action="installHome">Install GameBreak</button>`;}
