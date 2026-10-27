import fs from 'node:fs';import vm from 'node:vm';import {CORE} from '../public/ui-core.js';
const pairPattern=/\bL\(\s*('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*")\s*,\s*('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*")/g;
const pairs=[];for(const file of fs.readdirSync('public').filter(f=>f.endsWith('.js'))){for(const m of fs.readFileSync('public/'+file,'utf8').matchAll(pairPattern)){try{pairs.push([vm.runInNewContext(m[1]),vm.runInNewContext(m[2])]);}catch{}}}
const prefs=fs.readFileSync('public/preferences.js','utf8');const dict=vm.runInNewContext('('+prefs.match(/const dictionary=(\{.*?\});\n/s)[1]+')');
fs.writeFileSync('public/catalog/ui-zh.json',JSON.stringify({...Object.fromEntries(pairs),...dict,...Object.fromEntries(CORE.map(([en,zh])=>[en,zh]))}));
const source=process.argv[2];if(!source){console.log('UI dictionary updated. Optional source directory argument rebuilds checked-in provider name packs.');process.exit(0);}
fs.mkdirSync('public/catalog/locales',{recursive:true});
const read=f=>JSON.parse(fs.readFileSync(source+f+'.json'));
const clean=v=>String(v||'').replace(/<[^>]*>/g,'').replace(/\{[^}]*}/g,'');
const idx={zh:'ChineseTraditional',ja:'Japanese',en:'English'},out={};
for(const kind of ['characters','weapons']){
 const by={};for(const [lang,name]of Object.entries(idx))for(const x of read('genshin-'+kind+'-'+name)){by[x.id]||={};by[x.id][lang]={name:x.name,group:kind==='characters'?x.elementText:x.weaponText,summary:[x.rarity+'★',kind==='characters'?x.elementText:'',x.weaponText].filter(Boolean).join(' · '),facts:[['Rarity',x.rarity+'★'],['Element',kind==='characters'?x.elementText:null],['Weapon',x.weaponText],['Region',x.region],['Affiliation',x.affiliation],['Constellation',x.constellation],['Introduced in',x.version],['Base ATK at level 1',x.baseAtkValue],['Secondary attribute',x.mainStatText]].filter(a=>a[1]),tables:Object.entries(x.costs||{}).map(([stage,rows])=>({title:(lang==='ja'?'突破 ':lang==='zh'?'突破階段 ':'Ascension ')+stage.replace('ascend',''),rows:rows.map(r=>[r.name,String(r.count)])}))};}
 out['genshin-'+kind]=by;
}
// Names and skill categories are factual metadata; long game dialogue/descriptions are not copied.
for(const [lang,name] of Object.entries(idx)){const talents=read('genshin-talents-'+name);for(const entry of Object.values(out['genshin-characters'])){const t=talents.find(t=>t.name===entry[lang]?.name);if(!t)continue;entry[lang].tables.push({title:lang==='ja'?'天賦一覧':lang==='zh'?'天賦一覽':'Talent index',rows:Object.entries(t).filter(([key,v])=>/^(combat|passive)\d$/.test(key)&&v?.name).map(([key,v])=>[(key.startsWith('passive')?{ja:'固有天賦',zh:'固有天賦',en:'Passive'}:{ja:'戦闘天賦',zh:'戰鬥天賦',en:'Combat talent'})[lang],clean(v.name)])});}}
fs.writeFileSync('public/catalog/locales/genshin.json',JSON.stringify({source:'https://github.com/theBowja/genshin-db',retrievedAt:'2026-10-26',collections:out}));
const minecraft={};for(const lang of ['zh','ja']){const raw=read('mc-'+lang);minecraft[lang]=Object.fromEntries(Object.entries(raw).filter(([key])=>/^(item|block)\.minecraft\./.test(key)));}
fs.writeFileSync('public/catalog/locales/minecraft.json',JSON.stringify({source:'https://github.com/InventivetalentDev/minecraft-assets/tree/26.1',retrievedAt:'2026-10-26',names:minecraft}));
const hsr={};for(const lang of ['zh','ja']){const raw=read('hsr-'+lang);for(const [id,x]of Object.entries(raw)){hsr[id]||={};hsr[id][lang]={name:x.name};}}
fs.writeFileSync('public/catalog/locales/starrail.json',JSON.stringify({source:'https://github.com/Mar-7th/StarRailRes',retrievedAt:'2026-10-26',collections:{'hsr-character-forms':hsr}}));
console.log('Built localized names, material tables and UI Chinese pack.');
