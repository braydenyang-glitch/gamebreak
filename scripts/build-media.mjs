import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {IMAGE_MANIFEST,ENTITY_IMAGES,MISSING_IMAGES} from '../public/image-manifest.js';
import {COLLECTIONS} from '../public/catalog-api.js';
import {GAMES} from '../public/data.js';
const dir=new URL('../public/catalog/media/',import.meta.url);await mkdir(dir,{recursive:true});
for(const game of GAMES){const image={},entities={};for(const c of COLLECTIONS.filter(c=>c.game===game.id)){const data=JSON.parse(await readFile(new URL('../public/catalog/'+c.id+'.json',import.meta.url)));for(const entry of data.entries){const k=c.id+':'+entry.id;if(ENTITY_IMAGES[k])entities[k]=ENTITY_IMAGES[k];for(const url of [entry.image,entry.imageFallback,data.meta?.mapImage,data.meta?.mapBlank])if(IMAGE_MANIFEST[url])image[url]=IMAGE_MANIFEST[url];}}
await writeFile(new URL(game.id+'.json',dir),JSON.stringify({IMAGE_MANIFEST:image,ENTITY_IMAGES:entities,MISSING_IMAGES}));}
console.log('Split image lookup into 10 on-demand game indexes.');
