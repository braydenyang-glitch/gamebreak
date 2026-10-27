import {readdir,readFile,writeFile,mkdir,rm,copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=new URL('../public/',import.meta.url);
let html=await readFile(new URL('index.html',root),'utf8');
const sourceFile=new URL('../scripts/style-sources.json',import.meta.url);
let styles;try{styles=JSON.parse(await readFile(sourceFile));}catch{styles=[...html.matchAll(/<link rel="stylesheet" href="[^"]*\/([\w-]+\.css)[^"]*"[^>]*>/g)].map(m=>m[1]);await writeFile(sourceFile,JSON.stringify(styles));}
const css=(await Promise.all(styles.map(name=>readFile(new URL(name,root),'utf8')))).join('\n');await writeFile(new URL('site-bundle.css',root),css);
html=html.replace(/<link rel="stylesheet"[^>]*>/g,'').replace('</head>','<link rel="stylesheet" href="/site-bundle.css">\n</head>');
const names=(await readdir(root)).filter(n=>/\.(js|css)$/.test(n)&&!['sw.js','image-manifest.js'].includes(n)&&(!n.endsWith('.css')||n==='site-bundle.css')).sort();
const hash=createHash('sha256');
for(const name of names)hash.update(name).update(await readFile(new URL(name,root)));
const version=hash.digest('hex').slice(0,12);
// A new path prevents an older service worker or HTTP cache from mixing module versions.
await rm(new URL('release/',root),{recursive:true,force:true});
await mkdir(new URL(`release/${version}/`,root),{recursive:true});
for(const name of names)await copyFile(new URL(name,root),new URL(`release/${version}/${name}`,root));
html=html.replace(/((?:href|src)=")\/(?:release\/[a-f0-9]+\/)?([\w-]+\.(?:js|css))(?:\?[^"\s]*)?"/g,(_,prefix,name)=>`${prefix}/release/${version}/${name}"`);
html=html.replace(/<link rel="modulepreload"[^>]*>\n?/g,'');
await writeFile(new URL('index.html',root),html);
let sw=await readFile(new URL('sw.js',root),'utf8');
sw=sw.replace(/^const CACHE=.*?;\n/,'').replace(/^const RELEASE_FILES=.*?;\n/m,'');
if(!sw.includes('...RELEASE_FILES'))sw=sw.replace('const FILES=[','const FILES=[...RELEASE_FILES,');
sw=`const CACHE='gamebreak-shell-${version}';\nconst RELEASE_FILES=${JSON.stringify(names.map(n=>`./release/${version}/${n}`))};\n${sw}`;
await writeFile(new URL('sw.js',root),sw);
console.log(`Release ${version}: ${names.length} immutable browser assets`);
