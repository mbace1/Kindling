import { useEffect, useRef } from "react";
import { FULL_DAY, assetSrc, portraitSrc, spriteSrc, warningState, warmth, type KindlingSave, type SpeciesId } from "@/lib/kindling/model";
import { campKeepsakes, type CampKeepsake } from "@/lib/kindling/camp-find-effects";

type Props = { save: KindlingSave; tall?: boolean };

function load(src: string) {
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = src;
  return img;
}

const sheets = new Map<string, HTMLImageElement>();
let fireStates: HTMLImageElement | null = null;
function fireSheet() { if (!fireStates) fireStates = load(assetSrc("art/fire-states.png")); return fireStates; }
function sheet(id: SpeciesId) { const src = spriteSrc(id); let img = sheets.get(src); if (!img) { img = load(src); sheets.set(src, img); } return img; }

export function CampCanvas({ save }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0; let last = performance.now(); let t = 0;
    const sparks: { x:number; y:number; vx:number; vy:number; life:number }[] = [];
    const draw = (now:number) => {
      const dt = Math.min(.1,(now-last)/1000); last=now; if(!reduced)t+=dt;
      const dpr=Math.min(2,window.devicePixelRatio||1), w=canvas.clientWidth, h=canvas.clientHeight;
      if(canvas.width!==Math.floor(w*dpr)||canvas.height!==Math.floor(h*dpr)){canvas.width=Math.floor(w*dpr);canvas.height=Math.floor(h*dpr)}
      ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
      const heat=warmth(save),warn=warningState(save),fx=w*.37,fy=h*.81;
      if(warn){ctx.fillStyle="rgba(7, 10, 16, 0.34)";ctx.fillRect(0,0,w,h)}
      drawKeepsakes(ctx,campKeepsakes(save),w,h,t,reduced);
      drawFire(ctx,fireSheet(),fx,fy,heat,t,reduced);
      if(save.kindlingPending||save.awaitingHatch)drawAshMark(ctx,fx,fy+10,t);
      if(save.companion&&!save.walk&&!save.combat){const distance=warn?.11:.18;drawCompanion(ctx,save.companion.species,fx-w*distance,fy+h*.07,t,reduced,heat)}
      if(!reduced&&heat>.05){
        if(Math.random()<heat*.35)sparks.push({x:fx+(Math.random()-.5)*18,y:fy-8,vx:(Math.random()-.5)*12,vy:-20-Math.random()*30,life:.8+Math.random()*.6});
        for(let i=sparks.length-1;i>=0;i--){const s=sparks[i];s.x+=s.vx*dt;s.y+=s.vy*dt;s.life-=dt;if(s.life<=0)sparks.splice(i,1);else{ctx.fillStyle=`rgba(255, 122, 42, ${s.life})`;ctx.fillRect(s.x,s.y,2,2)}}
      }
      const vignette=ctx.createRadialGradient(w*.42,h*.5,h*.2,w*.5,h*.55,Math.max(w,h)*.72);vignette.addColorStop(0,"rgba(0,0,0,0)");vignette.addColorStop(1,"rgba(3,6,10,0.26)");ctx.fillStyle=vignette;ctx.fillRect(0,0,w,h);
      raf=requestAnimationFrame(draw);
    };
    raf=requestAnimationFrame(draw);return()=>cancelAnimationFrame(raf);
  },[save]);
  return <div data-camp-scene="native-16x9" className="relative w-full overflow-hidden bg-night" style={{aspectRatio:"16 / 9"}}><div data-camp-plate="clean-night" className="absolute inset-0 grid grid-cols-2 grid-rows-2">{["camp-q1.png","camp-q2.png","camp-q3.png","camp-q4.png"].map(name=><img key={name} src={assetSrc(`art/camp/${name}`)} alt="" aria-hidden="true" data-camp-tile={name} className="h-full w-full [image-rendering:pixelated]" />)}</div><canvas ref={ref} className="absolute inset-0 h-full w-full" aria-label={save.companion&&!save.walk&&!save.combat?`${save.companion.name} by the bonfire, with ${Math.min(save.found.length,4)} journey keepsakes`:"The bonfire"}/></div>;
}

function drawKeepsakes(ctx:CanvasRenderingContext2D,keepsakes:CampKeepsake[],w:number,h:number,t:number,reduced:boolean){const scale=Math.max(1,w/320);for(const keepsake of keepsakes){const x=keepsake.x*w,y=keepsake.y*h,glint=reduced?.65:.55+Math.sin(t*2.4+x)*.12;ctx.save();ctx.imageSmoothingEnabled=false;ctx.fillStyle="rgba(5, 8, 12, 0.38)";ctx.beginPath();ctx.ellipse(x,y+3*scale,8*scale,3*scale,0,0,Math.PI*2);ctx.fill();if(keepsake.shape==="sprig"){ctx.strokeStyle="rgba(145, 169, 112, 0.95)";ctx.lineWidth=2*scale;ctx.beginPath();ctx.moveTo(x,y+2*scale);ctx.lineTo(x+2*scale,y-10*scale);ctx.stroke();ctx.fillStyle="rgba(121, 151, 94, 0.95)";ctx.fillRect(x-4*scale,y-8*scale,5*scale,3*scale);ctx.fillRect(x+2*scale,y-6*scale,5*scale,3*scale)}else if(keepsake.shape==="charm"){ctx.strokeStyle=`rgba(232, 182, 93, ${glint})`;ctx.lineWidth=2*scale;ctx.beginPath();ctx.arc(x,y-4*scale,5*scale,0,Math.PI*2);ctx.stroke();ctx.fillStyle="rgba(222, 160, 72, 0.85)";ctx.fillRect(x-scale,y-5*scale,2*scale,7*scale)}else if(keepsake.shape==="shard"){ctx.fillStyle=`rgba(142, 198, 214, ${glint})`;ctx.beginPath();ctx.moveTo(x,y-13*scale);ctx.lineTo(x+6*scale,y-2*scale);ctx.lineTo(x+scale,y+2*scale);ctx.lineTo(x-5*scale,y-3*scale);ctx.closePath();ctx.fill()}else{ctx.fillStyle="rgba(139, 142, 145, 0.95)";ctx.beginPath();ctx.ellipse(x,y-2*scale,7*scale,5*scale,-.2,0,Math.PI*2);ctx.fill();ctx.fillStyle="rgba(190, 143, 79, 0.5)";ctx.fillRect(x-2*scale,y-4*scale,4*scale,2*scale)}ctx.restore()}}

function drawFire(ctx:CanvasRenderingContext2D,img:HTMLImageElement,x:number,y:number,heat:number,t:number,reduced:boolean){const care=Math.max(0,Math.min(FULL_DAY,Math.round(heat*FULL_DAY))),cell=img.complete&&img.naturalWidth?img.naturalWidth/5:0,cellH=img.complete&&img.naturalHeight?img.naturalHeight:0,state=care===0?0:care===1?1:care<=3?2:3,sceneScale=Math.max(1,ctx.canvas.clientWidth/320),drawW=66*sceneScale,drawH=70*sceneScale,top=y-drawH+14*sceneScale;if(cell&&cellH){ctx.save();ctx.imageSmoothingEnabled=false;ctx.drawImage(img,state*cell,0,cell,cellH,x-drawW/2,top,drawW,drawH);if(care>=FULL_DAY)ctx.drawImage(img,4*cell,0,cell,cellH,x-drawW/2,top,drawW,drawH);ctx.restore()}if(care>0){const flicker=reduced?1:.94+Math.sin(t*7)*.04+Math.sin(t*13)*.02,radius=(20+care*8)*sceneScale*flicker,glow=ctx.createRadialGradient(x,y-radius*.35,2,x,y-radius*.35,radius);glow.addColorStop(0,`rgba(255, 122, 42, ${.05+care*.025})`);glow.addColorStop(1,"rgba(255, 122, 42, 0)");ctx.fillStyle=glow;ctx.fillRect(x-radius,y-radius*1.2,radius*2,radius*1.5)}}
function drawAshMark(ctx:CanvasRenderingContext2D,x:number,y:number,t:number){ctx.fillStyle="#8ea0b8";ctx.beginPath();ctx.arc(x+Math.sin(t),y,3.5,0,Math.PI*2);ctx.fill();ctx.fillStyle="#ff7a2a";ctx.fillRect(x-1,y-1,2,2)}

function drawCompanion(ctx:CanvasRenderingContext2D,id:SpeciesId,x:number,y:number,t:number,reduced:boolean,heat:number){
  const img=sheet(id),frame=reduced?0:Math.floor(t*3)%4,col=frame%2,row=Math.floor(frame/2),baseSize=id==="mossknight"?58:id==="ashling"?44:52,glow=.18+heat*.28;
  const ember=id==="ember"&&!reduced;
  const breath=ember?1+Math.sin(t*2.1)*.035:1;
  const sway=ember?Math.sin(t*1.15)*.055:0;
  const listen=ember&&Math.sin(t*.43)>.78;
  const hop=ember&&Math.sin(t*.31)>.965?Math.max(0,Math.sin(t*9))*3:0;
  const bob=reduced?0:ember?Math.sin(t*2.1)*1.4-hop:Math.sin(t*2.2)*2;
  const sx=ember?(listen?1.08:1)*breath:1,sy=ember?(listen?.96:1)/breath:1;
  ctx.save();ctx.imageSmoothingEnabled=false;
  ctx.fillStyle="rgba(8, 10, 14, 0.45)";ctx.beginPath();ctx.ellipse(x,y+4,baseSize*.28*(1-hop*.035),7*(1-hop*.04),0,0,Math.PI*2);ctx.fill();
  ctx.translate(x,y);ctx.rotate(sway);ctx.scale(sx,sy);ctx.shadowColor=`rgba(255, 122, 42, ${glow})`;ctx.shadowBlur=ember?7:4;
  if(img.complete&&img.naturalWidth){const cw=img.naturalWidth/2,ch=img.naturalHeight/2;ctx.drawImage(img,col*cw,row*ch,cw,ch,-baseSize/2,-baseSize+bob,baseSize,baseSize)}else{const p=load(portraitSrc(id));if(p.complete&&p.naturalWidth)ctx.drawImage(p,-baseSize/2,-baseSize+bob,baseSize,baseSize)}
  if(ember&&heat>.6){const pulse=.35+Math.sin(t*5)*.12;ctx.fillStyle=`rgba(255, 168, 72, ${pulse})`;ctx.fillRect(-2,-baseSize*.38+bob,4,3)}
  ctx.restore();
}
