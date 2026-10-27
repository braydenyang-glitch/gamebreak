// Original GameBreak concepts. No extracted game geometry or textures.
import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';
import {mkdir,writeFile} from 'node:fs/promises';
class Reader {readAsArrayBuffer(blob){blob.arrayBuffer().then(v=>{this.result=v;this.onloadend?.();});} readAsDataURL(blob){blob.arrayBuffer().then(v=>{this.result='data:application/octet-stream;base64,'+Buffer.from(v).toString('base64');this.onloadend?.();});}}
globalThis.FileReader=Reader;
const out=new URL('../public/models/v1/',import.meta.url);await mkdir(out,{recursive:true});
const mat=(color,metalness=.15,roughness=.4,emission=0)=>new T.MeshStandardMaterial({color,metalness,roughness,emissive:color,emissiveIntensity:emission});
const M={gold:mat('#d8ae62',.78,.27),dark:mat('#172838',.65,.3),silver:mat('#d6e4e6',.8,.25),cyan:mat('#53dddc',.25,.2,.35),blue:mat('#3477bf',.4,.35),cream:mat('#f6e9cf',.1,.45),wood:mat('#9e643d',.05,.8),red:mat('#d65b49',.2,.55),purple:mat('#9f75f5',.35,.23,.18)};
let group;
function mesh(geo,m,x=0,y=0,z=0,name='Detail'){const o=new T.Mesh(geo,m);o.position.set(x,y,z);o.name=name;group.add(o);return o;}
function box(w,h,d,m,x=0,y=0,z=0,r=.04,name='Panel'){return mesh(r?new RoundedBoxGeometry(w,h,d,2,Math.min(r,w/3,h/3,d/3)):new T.BoxGeometry(w,h,d),m,x,y,z,name);}
function sphere(r,m,x=0,y=0,z=0,name='Core'){return mesh(new T.SphereGeometry(r,32,20),m,x,y,z,name);}
function cyl(rt,rb,h,m,x=0,y=0,z=0,n=40,name='Ring housing'){return mesh(new T.CylinderGeometry(rt,rb,h,n),m,x,y,z,name);}
function ring(r,t,m,x=0,y=0,z=0,name='Orbit'){return mesh(new T.TorusGeometry(r,t,10,80),m,x,y,z,name);}
function line(a,b,r,m,name='Support'){const p=new T.Vector3(...a),q=new T.Vector3(...b),d=q.clone().sub(p);const o=cyl(r,r,d.length(),m,...p.clone().add(q).multiplyScalar(.5).toArray(),12,name);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());return o;}
function point(name,x,y,z){const o=new T.Object3D();o.name=name;o.position.set(x,y,z);group.add(o);}
function gem(r,h,m,x=0,y=0,z=0){const o=mesh(new T.OctahedronGeometry(1),m,x,y,z,'Faceted crystal');o.scale.set(r,h,r);o.rotation.y=Math.PI/4;return o;}
function bolts(radius,y,m,count=12){for(let i=0;i<count;i++){const a=i/count*Math.PI*2;cyl(.028,.028,.035,m,Math.cos(a)*radius,y,Math.sin(a)*radius,6,'Hex fastener');}}
const makers={
 genshin(){
  cyl(.65,.88,.25,M.cream,0,-1.12,0,8,'Carved stone foot');cyl(.77,.65,.08,M.gold,0,-.95,0,8);cyl(.48,.62,.18,M.cream,0,-.82,0,8);bolts(.49,-.71,M.gold,8);
  gem(.4,.86,M.cyan,0,.2,0);gem(.13,.23,M.gold,0,1.28,0);
  for(let i=0;i<3;i++){const r=ring(.98,.035,M.gold,0,.12,0);r.rotation.set(.42+i*.78,i*1.02,.3);}
  for(let i=0;i<4;i++){const a=i*Math.PI/2;line([Math.cos(a)*.49,-.72,Math.sin(a)*.49],[Math.cos(a)*.7,-.15,Math.sin(a)*.7],.03,M.gold);const shard=gem(.11,.25,M.cyan,Math.cos(a)*.84,.12,Math.sin(a)*.84);shard.rotation.z=.3;}
  point('detail1',0,.75,0);point('detail2',.96,.1,0);point('detail3',.5,-.9,.25);
 },
 starrail(){
  cyl(.7,.82,.15,M.dark,0,-1.05,0);cyl(.71,.71,.045,M.gold,0,-.95,0);cyl(.35,.5,.25,M.silver,0,-.8,0);line([0,-.7,0],[0,.1,0],.09,M.gold);
  sphere(.48,M.blue,0,.18,0,'Navigation globe');const lat=ring(.49,.012,M.gold,0,.18,0);lat.rotation.x=Math.PI/2;const longitude=ring(.49,.012,M.gold,0,.18,0);longitude.rotation.y=.6;
  for(let i=0;i<3;i++){const o=ring(.8+i*.13,.024,M.gold,0,.18,0);o.rotation.set(i*.8+.3,i*.7,.5);}
  for(let i=0;i<9;i++){const a=i*.7;sphere(.035+i%2*.015,M.cyan,Math.cos(a)*1.02,.18+Math.sin(a)*.9,Math.sin(a*.7)*.4,'Star marker');}
  gem(.12,.22,M.purple,0,1.22,0);bolts(.61,-.93,M.gold);
  point('detail1',.28,.42,.3);point('detail2',.94,.45,0);point('detail3',.5,-.92,.3);
 },
 minecraft(){
  const grass=[mat('#68a849',0,.9),mat('#7bbb51',0,.9),mat('#468947',0,.9)],dirt=mat('#76513c',0,1),rock=mat('#65747e',.1,.9),leaf=mat('#3b8b52',0,.8);
  for(let x=-2;x<=2;x++)for(let z=-2;z<=2;z++){if(Math.abs(x)+Math.abs(z)>3)continue;box(.43,.36,.43,dirt,x*.42,-.61,z*.42,0,'Earth voxel');box(.43,.12,.43,grass[(x+z+8)%3],x*.42,-.37,z*.42,0,'Grass voxel');if(Math.abs(x)+Math.abs(z)<3)box(.43,.3,.43,rock,x*.38,-.91,z*.38,0,'Stone voxel');}
  for(let i=0;i<3;i++)box(.28,.35,.28,M.wood,-.4,-.13+i*.34,-.3,0,'Tree trunk');
  for(const [x,y,z,w] of [[-.4,.9,-.3,1],[-.4,1.28,-.3,.62],[-.72,.78,-.3,.65],[-.1,.83,-.3,.65]])box(w,.42,w*.8,leaf,x,y,z,0,'Leaf canopy');
  box(.48,.42,.48,M.wood,.47,-.1,.39,0,'Crafting bench');box(.5,.07,.5,M.cream,.47,.15,.39,0,'Workbench grid');for(let i=-1;i<=1;i++){box(.48,.01,.018,M.wood,.47,.19,.39+i*.14,0);box(.018,.01,.48,M.wood,.47+i*.14,.19,.39,0);}
  for(let i=0;i<5;i++)box(.11,.1,.025,M.cyan,.5+(i%3)*.12,-.79-Math.floor(i/3)*.13,.805,0,'Embedded ore');
  point('detail1',-.4,.93,.1);point('detail2',.47,.2,.55);point('detail3',.58,-.78,.85);
 },
 gta(){
  const paint=mat('#529a9c',.7,.24),rubber=mat('#1b2028',.05,.85),glass=mat('#243c4c',.65,.13);
  box(2.5,.38,1.05,paint,0,-.18,0,.18,'Coupe body');box(1.1,.43,.9,glass,-.13,.2,0,.18,'Panoramic cabin');box(.85,.065,.85,paint,-.15,.42,0,.05,'Roof');box(.67,.07,1.02,paint,.86,.04,0,.04,'Hood');
  for(const x of [-.8,.78])for(const z of [-.54,.54]){const tire=cyl(.27,.27,.17,rubber,x,-.32,z,40,'Tire');tire.rotation.x=Math.PI/2;const hub=cyl(.17,.17,.18,M.silver,x,-.32,z,32,'Alloy wheel');hub.rotation.x=Math.PI/2;for(let i=0;i<5;i++){const a=i*Math.PI*2/5;line([x,-.32,z+Math.sign(z)*.1],[x+Math.cos(a)*.14,-.32+Math.sin(a)*.14,z+Math.sign(z)*.1],.018,M.dark,'Wheel spoke');}}
  for(const z of [-.35,.35]){box(.035,.09,.24,M.cyan,1.255,-.08,z,.01,'Headlamp');box(.035,.09,.25,M.red,-1.255,-.1,z,.01,'Tail lamp');box(.13,.07,.14,paint,.1,.18,z*1.52,.02,'Mirror');}
  box(.05,.1,.4,M.dark,1.27,-.26,0,.01,'Intake');box(.07,.08,1.03,M.dark,-1.2,-.4,0,.02,'Rear diffuser');
  point('detail1',.6,.1,.4);point('detail2',-.8,-.3,.65);point('detail3',-.1,.44,.3);
 },
 delta(){
  const shell=mat('#6a7b6b',.55,.5);
  box(.8,.25,.67,shell,0,.1,0,.1,'Drone airframe');box(.42,.06,.4,M.dark,0,.26,0,.04,'Battery hatch');
  for(const x of [-1,1])for(const z of [-1,1]){line([x*.25,.08,z*.2],[x*.76,.06,z*.64],.055,M.dark,'Carbon arm');const duct=ring(.33,.045,shell,x*.77,.08,z*.64,'Propeller guard');duct.rotation.x=Math.PI/2;cyl(.055,.055,.15,M.gold,x*.77,.08,z*.64);for(const angle of [0,Math.PI/2]){const blade=box(.51,.022,.065,M.dark,x*.77,.1,z*.64,.02,'Rotor blade');blade.rotation.y=angle+.3;}line([x*.55,.01,z*.3],[x*.7,-.4,z*.44],.025,M.silver);}
  sphere(.15,M.dark,0,-.13,.27,'Gimbal camera');const lens=cyl(.085,.085,.06,M.cyan,0,-.14,.4);lens.rotation.x=Math.PI/2;
  line([.15,.25,-.1],[.18,.65,-.15],.018,M.dark,'Antenna');sphere(.045,M.red,.18,.65,-.15);
  point('detail1',0,-.14,.46);point('detail2',.78,.15,.64);point('detail3',.18,.58,-.15);
 },
 fortnite(){
  const yellow=mat('#f2c852',.1,.6),blue=mat('#427ecc',.2,.5);
  const b=sphere(.68,yellow,0,.65,0,'Lift balloon');b.scale.set(1,1.18,1);for(let i=0;i<6;i++){const a=i*Math.PI/3;const r=ring(.683,.014,blue,0,.65,0,'Balloon seam');r.rotation.y=a;r.scale.y=1.18;}
  cyl(.09,.16,.13,blue,0,-.18,0);box(.65,.55,.65,blue,0,-1,0,.04,'Supply container');for(const x of [-.25,.25]){box(.05,.57,.67,M.silver,x,-1,0,.01,'Crate brace');for(const z of [-.25,.25])line([x,-.72,z],[x*.7,-.15,z*.7],.014,M.cream,'Suspension cord');}
  box(.69,.06,.69,yellow,0,-.7,0,.02,'Container lid');box(.12,.13,.03,M.gold,0,-.9,.34,.01,'Latch');
  point('detail1',.25,1.05,.4);point('detail2',.27,-.38,.25);point('detail3',0,-.9,.4);
 },
 roblox(){
  const wood=mat('#6d4032',.03,.7),trim=mat('#a5764d',.2,.65),glow=mat('#82d8ce',.1,.4,.5);
  box(1.55,.12,.7,M.dark,0,-1.1,0,.03,'Doorstep');box(.18,2.13,.3,trim,-.67,0,0,.02,'Left jamb');box(.18,2.13,.3,trim,.67,0,0,.02,'Right jamb');box(1.5,.18,.3,trim,0,1.04,0,.02,'Lintel');box(1.13,1.9,.08,glow,0,0,-.1,.01,'Threshold light');
  const door=new T.Group();group.add(door);const original=group;group=door;box(1.12,1.92,.13,wood,.56,0,0,.02,'Door leaf');for(const y of [-.49,.49]){box(.84,.72,.04,trim,.56,y,.08,.02,'Raised door panel');box(.7,.58,.05,wood,.56,y,.11,.01,'Inset');}sphere(.055,M.gold,.95,-.1,.14,'Handle');group=original;door.position.set(-.56,0,.04);door.rotation.y=-.6;
  const key=ring(.13,.035,M.gold,1.05,.25,.2,'Key bow');key.rotation.z=.4;line([1.04,.12,.2],[1.04,-.3,.2],.035,M.gold,'Key shaft');box(.15,.06,.06,M.gold,1.1,-.22,.2,.01,'Key teeth');
  point('detail1',.95,.2,.3);point('detail2',.35,.6,.1);point('detail3',0,-1,.4);
 },
 pubg(){
  const blue=mat('#37648a',.35,.6),cloth=mat('#b94e42',0,.95),strap=mat('#454537',.1,.8);
  box(1.5,1.05,1.2,blue,0,-.1,0,.05,'Supply crate');box(1.55,.2,1.26,cloth,0,.52,0,.08,'Canvas cover');
  for(const x of [-.53,.53]){box(.12,1.12,1.24,strap,x,-.07,0,.015,'Cargo strap');box(.14,.22,.06,M.gold,x,.1,.64,.015,'Strap buckle');}
  for(const z of [-.4,.4])box(1.57,.08,.08,M.silver,0,-.65,z,.01,'Base rail');
  for(const x of [-.74,.74])for(const z of [-.59,.59]){box(.08,1.05,.08,M.silver,x,-.1,z,.01,'Edge protector');line([x,.56,z],[x*.4,1.22,z*.4],.014,M.cream,'Rigging');}ring(.12,.025,M.gold,0,1.29,0,'Lift eye');
  for(let i=0;i<6;i++)box(.06,.26,.018,M.cream,-.23+i*.09,-.2,.611,0,'Cargo stencil');
  point('detail1',.1,.64,.4);point('detail2',.53,.1,.7);point('detail3',-.7,-.5,.55);
 },
 brawl(){
  const violet=mat('#9258d5',.45,.22,.12),pink=mat('#dc6ccb',.25,.3,.12);
  cyl(.7,.82,.18,M.dark,0,-.85,0,10,'Vault base');cyl(.76,.76,.06,M.gold,0,-.73,0,10);cyl(.59,.67,.16,violet,0,-.62,0,10,'Crystal mount');
  gem(.38,.86,violet,0,.2,0);const a=gem(.24,.51,pink,-.53,-.13,.1);a.rotation.z=.5;const b=gem(.26,.56,M.cyan,.5,-.07,.03);b.rotation.z=-.45;gem(.18,.35,M.purple,0,-.2,.53);
  for(let i=0;i<10;i++){const a=i*Math.PI/5;box(.07,.18,.1,M.gold,Math.cos(a)*.64,-.54,Math.sin(a)*.64,.02);}
  ring(.14,.035,M.gold,0,-.82,.78,'Vault seal');
  point('detail1',0,.75,.05);point('detail2',.55,.14,.08);point('detail3',0,-.73,.8);
 },
 wuwa(){
  const shell=mat('#334550',.65,.26),pearl=mat('#d0d8d1',.6,.3);
  const body=cyl(.5,.57,.26,shell,0,0,0,64,'Resonance sensor');body.rotation.x=Math.PI/2;const rim=ring(.54,.05,M.gold);const inner=ring(.38,.025,pearl,0,0,.17);sphere(.19,M.cyan,0,0,.12,'Resonance core');
  for(let i=0;i<12;i++){const a=i*Math.PI/6;const o=box(.04,.13,.06,M.gold,Math.cos(a)*.45,Math.sin(a)*.45,.16,.01,'Frequency scale');o.rotation.z=a-Math.PI/2;}
  for(let i=0;i<3;i++){const r=ring(.23+i*.055,.012,M.cyan,0,0,.2+i*.015,'Wave ring');}
  box(.29,.92,.24,shell,0,-.94,0,.08,'Hand grip');for(let i=0;i<5;i++)box(.31,.035,.26,pearl,0,-.63-i*.13,0,.01,'Grip rib');box(.23,.17,.1,M.cyan,0,-.61,.16,.03,'Display');
  line([.52,.05,0],[.86,.55,0],.035,M.gold,'Antenna');gem(.08,.17,M.cyan,.9,.65,0);box(.42,.09,.31,M.gold,0,-1.4,0,.03,'Heel');
  point('detail1',0,.05,.35);point('detail2',.5,.3,.16);point('detail3',0,-.65,.2);
 }
};
const manifest=[];
for(const [id,make] of Object.entries(makers)){
 group=new T.Group();group.name='GameBreak original concept — '+id;make();group.userData={author:'GameBreak / Brayden Yang',license:'CC BY 4.0',notice:'Original illustrative concept; not an official game asset or an item statistics reference.'};
 const buffer=await new GLTFExporter().parseAsync(group,{binary:true});await writeFile(new URL(id+'.glb',out),Buffer.from(buffer));
 let meshes=0,triangles=0;group.traverse(o=>{if(o.isMesh){meshes++;triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;}});manifest.push({id,path:'/models/v1/'+id+'.glb',bytes:buffer.byteLength,meshes,triangles});
}
await writeFile(new URL('manifest.json',out),JSON.stringify({version:1,author:'GameBreak / Brayden Yang',license:'CC BY 4.0',models:manifest},null,2));
await writeFile(new URL('LICENSE.txt',out),'GameBreak original 3D concept collection\nAuthor: GameBreak / Brayden Yang\nLicensed under Creative Commons Attribution 4.0 International.\nhttps://creativecommons.org/licenses/by/4.0/\n\nThese models are original illustrative concepts, not official game assets. Game names are used only to identify the related guide collection. Model dimensions, shapes and parts do not represent game item statistics or verified gameplay.\n');
console.log(manifest.map(x=>`${x.id}: ${x.meshes} meshes, ${Math.round(x.bytes/1024)} KB`).join('\n'));
