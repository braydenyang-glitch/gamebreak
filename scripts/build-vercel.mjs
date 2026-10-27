import {cp,readFile,writeFile,mkdir,rm,readdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve,join,relative} from 'node:path';
const root=resolve(import.meta.dirname,'..');process.chdir(root);
execFileSync('npm',['run','build:content'],{stdio:'inherit'});
const output=join(root,'.vercel/output'),statics=join(output,'static'),func=join(output,'functions/__runtime.func');
await rm(output,{recursive:true,force:true});await mkdir(func,{recursive:true});await cp('public',statics,{recursive:true});
const oldOrigin='https://gamebreak-brayden.yenhui.chatgpt.site';
const origin=process.env.GAMEBREAK_PUBLIC_ORIGIN||'https://'+(process.env.VERCEL_PROJECT_PRODUCTION_URL||process.env.VERCEL_URL||'gamebreak-brayden.vercel.app');
if(new URL(origin).protocol!=='https:')throw Error('Production origin must use HTTPS');
const pages=[];
async function walk(dir){for(const item of await readdir(dir,{withFileTypes:true})){const file=join(dir,item.name);if(item.isDirectory())await walk(file);else{const path=relative(statics,file).replaceAll('\\','/');if(/\.(html|xml)$/.test(file)||item.name==='robots.txt'){await writeFile(file,(await readFile(file,'utf8')).replaceAll(oldOrigin,origin));}if(path.endsWith('index.html'))pages.push(path);}}}
await walk(statics);
await cp('deployment/vercel/runtime.mjs',join(func,'runtime.mjs'));await cp('server/entry-pages.json',join(func,'entry-pages.json'));await cp(join(statics,'index.html'),join(func,'index.html'));
await writeFile(join(func,'site.json'),JSON.stringify({origin}));
await writeFile(join(func,'.vc-config.json'),JSON.stringify({runtime:'nodejs22.x',handler:'runtime.mjs',launcherType:'Nodejs',maxDuration:30}));
const routes=[{src:'/(.*)',headers:{'X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin'},continue:true},{src:'/sw.js',headers:{'Cache-Control':'no-cache','Service-Worker-Allowed':'/'},continue:true}];
for(const path of pages){const url='/'+path.slice(0,-10);routes.push({src:url==='/'?'/':url.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'?',dest:'/'+path});}
routes.push({handle:'filesystem'},{src:'/(.*)',dest:'/__runtime'});
await writeFile(join(output,'config.json'),JSON.stringify({version:3,routes},null,2));
console.log(`Vercel output ready: ${pages.length} static pages, localized deep-wiki renderer, public API gateway. Origin: ${origin}`);
