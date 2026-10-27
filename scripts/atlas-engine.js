import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';

export function createViewer(host,{onStatus,onFrame,onLost,quality='low'}={}){
 const scene=new T.Scene(),camera=new T.PerspectiveCamera(38,1,.01,100);
 const renderer=new T.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power',preserveDrawingBuffer:true});
 renderer.setPixelRatio(quality==='low'?1:Math.min(devicePixelRatio,2));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.95;
 renderer.domElement.setAttribute('aria-label','Interactive 3D model. Drag to rotate; pinch or use the zoom buttons. Arrow keys rotate, plus and minus zoom, R resets.');renderer.domElement.tabIndex=0;renderer.domElement.setAttribute('role','img');host.prepend(renderer.domElement);
 const controls=new OrbitControls(camera,renderer.domElement);controls.enablePan=false;controls.enableDamping=false;controls.minDistance=2;controls.maxDistance=9;controls.minPolarAngle=.05;controls.maxPolarAngle=Math.PI-.05;controls.autoRotateSpeed=1;controls.cursorStyle='grab';
 const pmrem=new T.PMREMGenerator(renderer),room=new RoomEnvironment(),env=pmrem.fromScene(room,.04);scene.environment=env.texture;room.dispose();pmrem.dispose();
 scene.environmentIntensity=.75;const ambient=new T.HemisphereLight(0xdcedff,0x7b7481,.9);scene.add(ambient);const key=new T.DirectionalLight(0xfff4dd,2);key.position.set(3,6,5);scene.add(key);const rim=new T.DirectionalLight(0x83c7ff,1);rim.position.set(-4,2,-2);scene.add(rim);
 let model,disposed=false,loadSerial=0,frame=0,auto=false,visible=true,wire=false,points=[],onStage=true,baseDistance=5.2,lastFrame=0,parts=[],explodeAmount=0,assemblyStage=3;
 const loader=new GLTFLoader();
 function arrange(){for(const [index,o]of parts.entries()){const base=o.userData.assemblyBase;const direction=base.clone();if(direction.length()<.1)direction.set((index%3)-1,.5,index%2?1:-1);direction.normalize();o.position.copy(base).addScaledVector(direction,explodeAmount*.6);o.visible=assemblyStage===3||index<Math.ceil(parts.length*assemblyStage/3);}render();}

 function render(){if(disposed)return;renderer.render(scene,camera);const p=points.map(point=>{const v=point.getWorldPosition(new T.Vector3()).project(camera);return {x:(v.x*.5+.5)*host.clientWidth,y:(-.5*v.y+.5)*host.clientHeight,visible:assemblyStage===3&&v.z<1&&v.x>-1&&v.x<1&&v.y>-1&&v.y<1};});onFrame?.(p,Math.round(baseDistance/camera.position.distanceTo(controls.target)*100));}
 function loop(now){frame=0;if(disposed||!auto||!visible||!onStage)return;controls.update(Math.min((now-lastFrame)/1000,.05));lastFrame=now;render();frame=requestAnimationFrame(loop);}
 function schedule(){if(auto&&visible&&onStage&&!frame)frame=requestAnimationFrame(loop);}
 function reset(){controls.target.set(0,0,0);camera.position.set(3,1.8,4.2).normalize().multiplyScalar(baseDistance);controls.update();render();}
 function disposeModel(m){m?.traverse(o=>{o.geometry?.dispose();if(o.material){for(const mat of Array.isArray(o.material)?o.material:[o.material])mat.dispose();}});}
 function resize(){if(disposed)return;const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;const prior=baseDistance;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();baseDistance=5.2/Math.min(1,w/h);controls.maxDistance=Math.max(12,baseDistance*2);if(!model)reset();else{const offset=camera.position.clone().sub(controls.target);offset.multiplyScalar(baseDistance/prior);camera.position.copy(controls.target).add(offset);controls.update();}render();}
 const observer=new ResizeObserver(resize);observer.observe(host);
 const intersection=new IntersectionObserver(entries=>{onStage=entries[0].isIntersecting;if(!onStage){cancelAnimationFrame(frame);frame=0;}else schedule();});intersection.observe(host);
 const abort=new AbortController();const on=(node,type,fn)=>node.addEventListener(type,fn,{signal:abort.signal});
 on(document,'visibilitychange',()=>{visible=!document.hidden;if(!visible){cancelAnimationFrame(frame);frame=0;}else schedule();});
 on(renderer.domElement,'webglcontextlost',e=>{e.preventDefault();onLost?.();});
 on(renderer.domElement,'keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-','r','R'].includes(e.key))return;e.preventDefault();e.stopPropagation();if(e.key==='r'||e.key==='R')reset();else if(['+','=','-'].includes(e.key))zoom(e.key==='-'?1.18:1/1.18);else{const offset=camera.position.clone().sub(controls.target),s=new T.Spherical().setFromVector3(offset);s.theta+=e.key==='ArrowLeft'?.15:e.key==='ArrowRight'?-.15:0;s.phi=T.MathUtils.clamp(s.phi+(e.key==='ArrowUp'?-.12:e.key==='ArrowDown'?.12:0),.05,Math.PI-.05);camera.position.copy(controls.target).add(new T.Vector3().setFromSpherical(s));controls.update();render();}});
 controls.addEventListener('change',render);
 function zoom(factor){const off=camera.position.clone().sub(controls.target);off.setLength(T.MathUtils.clamp(off.length()*factor,controls.minDistance,controls.maxDistance));camera.position.copy(controls.target).add(off);controls.update();render();}
 resize();reset();
 return {
  async load(url){const serial=++loadSerial;onStatus?.('loading');points=[];if(model){scene.remove(model);disposeModel(model);model=null;}render();try{const gltf=await loader.loadAsync(url);if(disposed||serial!==loadSerial){disposeModel(gltf.scene);return;}model=gltf.scene;const bounds=new T.Box3().setFromObject(model),size=bounds.getSize(new T.Vector3()),center=bounds.getCenter(new T.Vector3());const scale=2.6/Math.max(size.x,size.y,size.z);model.scale.multiplyScalar(scale);model.position.copy(center).multiplyScalar(-scale);scene.add(model);parts=[];model.traverse(o=>{if(o.isMesh){o.userData.assemblyBase=o.position.clone();parts.push(o);}});parts.sort((a,b)=>a.getWorldPosition(new T.Vector3()).y-b.getWorldPosition(new T.Vector3()).y);explodeAmount=0;assemblyStage=3;points=['detail1','detail2','detail3'].map(name=>model.getObjectByName(name)).filter(Boolean);model.traverse(o=>{if(o.isMesh)o.material.wireframe=wire;});reset();onStatus?.('ready');render();}catch(err){if(!disposed&&serial===loadSerial)onStatus?.('error',err);}},
  explode(value){const prior=1+explodeAmount*.4;explodeAmount=T.MathUtils.clamp(value,0,1);const offset=camera.position.clone().sub(controls.target).multiplyScalar((1+explodeAmount*.4)/prior);camera.position.copy(controls.target).add(offset);controls.update();arrange();},
  assemble(stage){assemblyStage=T.MathUtils.clamp(stage,1,3);arrange();},
  quality(value){renderer.setPixelRatio(value==='low'?1:Math.min(devicePixelRatio,2));resize();},
  zoomIn:()=>zoom(1/1.18),zoomOut:()=>zoom(1.18),reset,
  spin(value){auto=value;controls.autoRotate=value;if(!value){cancelAnimationFrame(frame);frame=0;}else schedule();},
  wireframe(value){wire=value;model?.traverse(o=>{if(o.isMesh)o.material.wireframe=value;});render();},
  focus(index){const p=points[index];if(!p)return;const target=p.getWorldPosition(new T.Vector3());const direction=camera.position.clone().sub(controls.target).normalize();controls.target.copy(target);camera.position.copy(target).add(direction.multiplyScalar(2.4));controls.update();render();},
  theme(dark){ambient.intensity=dark?.65:.9;renderer.toneMappingExposure=dark?1:.95;render();},
  snapshot(){render();return renderer.domElement.toDataURL('image/png');},
  dispose(){disposed=true;loadSerial++;cancelAnimationFrame(frame);observer.disconnect();intersection.disconnect();abort.abort();controls.dispose();disposeModel(model);env.dispose();renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();}
 };
}
