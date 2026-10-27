import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {gameName,setLocale} from '../public/locale.js';
import {GAMES,GUIDES,findGame} from '../public/data.js';

const root=new URL('../public/',import.meta.url);
const template=await readFile(new URL('index.html',root),'utf8');
const origin='https://gamebreak-brayden.yenhui.chatgpt.site';
const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const gameLink=g=>`<li><a href="/games/${g.id}/">${esc(g.name)}</a> — ${esc(g.scope)}</li>`;
const guideLink=g=>`<li><a href="/guides/${g.id}/">${esc(g.title)}</a> — ${esc(findGame(g.game).name)} · ${esc(g.edition)}</li>`;
const pages=[
 ...['privacy','me','sources','fieldnotes','showcase','studio','playroom','playbook','offline','updates','reports','editor','explore','maps','help','history','share','contribute','quality','settings'].map(id=>[id+'/',id[0].toUpperCase()+id.slice(1),'GameBreak player workspace','<p>Enable JavaScript to open this workspace.</p>']),
 ['games/','Game library','Explore all ten game hubs.',`<ul>${GAMES.map(gameLink).join('')}</ul>`],
 ['guides/','All guides','Sourced short guides, with sources and clear game scopes.',`<ul>${GUIDES.map(guideLink).join('')}</ul>`],
 ['wiki/','Game encyclopedia','Browse characters, weapons, items, maps and beginner articles.',`<ul>${GAMES.map(g=>`<li><a href="/wiki/${g.id}/">${esc(g.name)} encyclopedia</a></li>`).join('')}</ul>`],
 ['search/','Search GameBreak','Search guides, handbook articles and game data.','<p>Enable JavaScript for unified search.</p>'],
 ['resources/','Sources and downloads','Official updates, data providers and downloadable guide packs.','<a href="/downloads/gamebreak-guide-library.md">Download the guide library</a>'],
 ...GAMES.map(g=>[`wiki/${g.id}/`,g.name+' encyclopedia','Browse game reference data and beginner articles.','<p>Enable JavaScript to browse the searchable reference library.</p>']),
 ['tools/','Player tools','Ten game tools with saved plans, calculators and reference comparisons.','<p>Enable JavaScript to build a command or record a personal test.</p><a href="/guides/minecraft-useful-commands/">Read the Minecraft command guide</a>'],
 ['saved/','Saved guides','Your personal reading list on this device.','<p>Enable JavaScript to see the guides saved in this browser.</p><a href="/guides/">Browse guides</a>'],
 ['testing/','Usability testing','Record actual peer feedback and revision decisions.','<p>Enable JavaScript to use the timer and record feedback.</p>'],
 ['about/','About GameBreak','A guide library by Brayden Yang.','<p>Public guides include a source and are marked Unverified until an in-game test is recorded. Source review is not a gameplay test.</p>'],
 ...GAMES.map(g=>[`games/${g.id}/`,g.name,g.scope,`<img src="/assets/${g.id}.webp" alt="${esc(g.name)}" width="320"><h2>Guides</h2><ul>${GUIDES.filter(x=>x.game===g.id).map(guideLink).join('')}</ul>`]),
 ...GUIDES.map(g=>[`guides/${g.id}/`,g.title,g.description,`<p><a href="/games/${g.game}/">${esc(findGame(g.game).name)}</a> · ${esc(g.edition)} · ${esc(g.platforms.join(', '))}</p><p>Unverified · ${esc(g.version)}</p><h2>Quick answer</h2><p>${esc(g.quick)}</p><h2>Before you start</h2><p>${esc(g.needs)}</p><h2>Steps</h2><ol>${g.steps.map(s=>`<li>${esc(s)}</li>`).join('')}</ol><h2>What success looks like</h2><p>${esc(g.success)}</p><h2>If it does not work</h2><p>${esc(g.trouble)}</p><p>${esc(g.note)}</p><p>Source: <a href="${esc(g.source)}">${esc(g.sourceName)}</a>${(g.sourceLinks||[]).filter(x=>x.url!==g.source).map(x=>` · <a href="${esc(x.url)}">${esc(x.label)}</a>`).join('')} · Source reviewed ${g.reviewed}. Not playtested.</p>`])
];
const locales=['en','zh-Hant','ja'],allPaths=[];
const dictionaries={en:{},'zh-Hant':JSON.parse(await readFile(new URL('catalog/ui-zh.json',root))),ja:JSON.parse(await readFile(new URL('catalog/ui-ja.json',root)))};
const guideTranslations={en:{},'zh-Hant':JSON.parse(await readFile(new URL('catalog/guide-zh.json',root))),ja:JSON.parse(await readFile(new URL('catalog/guide-ja.json',root)))};
const t=(value,locale)=>dictionaries[locale][value]||value;
for(const locale of locales){setLocale(locale);for(const [path,originalTitle,originalDescription,originalBody] of [['','GameBreak','Find your next answer.',''],...pages]){
 const guide=path.startsWith('guides/')?GUIDES.find(g=>path==='guides/'+g.id+'/'):null;
 const translated=guide?{...guide,...guideTranslations[locale][guide.id]}:null;
 let title=translated?.title||t(originalTitle,locale),description=translated?.description||t(originalDescription,locale),body=originalBody;
 if(translated){const g=translated;body=`<p>${esc(gameName(g.game))} · ${esc(g.edition)}</p><p>${esc(t('Unverified',locale))} · ${esc(g.version)}</p><h2>${esc(t('Quick answer',locale))}</h2><p>${esc(g.quick)}</p><h2>${esc(t('Before you start',locale))}</h2><p>${esc(g.needs)}</p><h2>${esc(t('Steps',locale))}</h2><ol>${g.steps.map(x=>`<li>${esc(x)}</li>`).join('')}</ol><p>${esc(g.success)}</p><p>${esc(g.trouble)}</p><p>${esc(g.note)}</p><a href="${esc(g.source)}">${esc(g.sourceName)}</a>`;}
 const fullTitle=esc(title+' — GameBreak'),canonical=origin+'/'+locale+'/'+path;
 let html=template.replace('<html lang="en"','<html lang="'+locale+'"').replace(/<title>.*?<\/title>/,`<title>${fullTitle}</title>`)
 .replace(/(<meta name="description" content=")[^"]*/,`$1${esc(description)}`).replace(/(<meta property="og:title" content=")[^"]*/,`$1${fullTitle}`).replace(/(<meta property="og:description" content=")[^"]*/,`$1${esc(description)}`).replace(/(<meta property="og:url" content=")[^"]*/,`$1${canonical}`).replace(/(<link rel="canonical" href=")[^"]*/,`$1${canonical}`);
 if(!path)html=html.replace(/(<main id="main" tabindex="-1">)[\s\S]*?<\/main>/,`$1<article class="static-content"><h1>GameBreak</h1><p>${locale==='ja'?'10のゲームワールドから、次の一歩を見つけよう。':locale==='zh-Hant'?'從十個遊戲世界，找到你的下一步。':'Find your next step across ten game worlds.'}</p><ul>${GAMES.map(g=>`<li><a href="/games/${g.id}/">${esc(gameName(g.id))}</a></li>`).join('')}</ul></article></main>`);
 if(path)html=html.replace(/(<main id="main" tabindex="-1">)[\s\S]*?<\/main>/,`$1<article class="static-content"><h1>${esc(title)}</h1><p>${esc(description)}</p>${body}</article></main>`);
 html=html.replace(/>([^<>]+)</g,(all,text)=>{const key=text.trim(),value=t(key,locale);return '>'+(value===key?text:text.replace(key,esc(value)))+'<';});
 html=html.replace(/(<a\b[^>]*href=")\/(?!assets|release|catalog|downloads|manifest|api)([^"#]*)"/g,(_,prefix,path)=>`${prefix}/${locale}/${path}"`);
 html=html.replace('href="/manifest.webmanifest"','href="/manifest-'+locale+'.webmanifest"');
 html=html.replace('</head>',locales.map(l=>`<link rel="alternate" hreflang="${l}" href="${origin}/${l}/${path}">`).join('')+'</head>');
 if(/^(me|playbook|saved|share|fieldnotes|testing|reports|editor|quality|history|contribute|settings)\//.test(path))html=html.replace('</head>','<meta name="robots" content="noindex, nofollow"></head>');
 const destinations=locale==='en'&&path?[locale+'/'+path,path]:[locale+'/'+path];for(const destination of destinations){await mkdir(new URL(destination,root),{recursive:true});await writeFile(new URL(destination+'index.html',root),html);}allPaths.push(locale+'/'+path);
}}
await writeFile(new URL('sitemap.xml',root),'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+allPaths.filter(p=>! /\/(me|playbook|saved|share|fieldnotes|testing|reports|editor|quality|history|contribute|settings|search)\//.test(p)).map(path=>`<url><loc>${origin}/${path}</loc></url>`).join('')+'</urlset>');
console.log(`Built ${allPaths.length} localized pages and sitemap.`);

const manifest=JSON.parse(await readFile(new URL('manifest.webmanifest',root)));for(const locale of locales)await writeFile(new URL('manifest-'+locale+'.webmanifest',root),JSON.stringify({...manifest,id:'/',scope:'/',lang:locale,start_url:'/'+locale+'/',description:locale==='ja'?'ゲーム攻略、図鑑、ツール、保存したプレイ計画。':locale==='zh-Hant'?'遊戲攻略、百科、工具與你的遊玩計畫。':manifest.description}));
