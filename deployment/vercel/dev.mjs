import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import handler from '../../.vercel/output/functions/__runtime.func/runtime.mjs';
const root=resolve('.vercel/output/static'),types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css','.json':'application/json','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.glb':'model/gltf-binary','.xml':'application/xml','.txt':'text/plain','.woff2':'font/woff2'};
createServer(async(req,res)=>{try{let file=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(!file.startsWith(root+'/')&&file!==root)throw Error();if((await stat(file)).isDirectory())file=resolve(file,'index.html');const data=await readFile(file);res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream'});res.end(req.method==='HEAD'?undefined:data);}catch{await handler(req,res);}}).listen(Number(process.env.PORT||4175),'127.0.0.1',()=>console.log('GameBreak Vercel preview: http://127.0.0.1:'+ (process.env.PORT||4175)));
