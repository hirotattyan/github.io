(function(root){
'use strict';
const E=root.KE,C=E.C;
class Town{
 constructor(canvas,onSelect,onPlacement=()=>{}){this.canvas=canvas;this.ctx=canvas.getContext('2d');this.art=new root.KTownArt(this);this.onSelect=onSelect;this.onPlacement=onPlacement;this.state=null;this.selection=null;this.placement=null;this.ghost=null;this.drag=null;this.paths=[];this.hover=null;this.motion=!root.matchMedia?.('(prefers-reduced-motion: reduce)').matches;this.last=0;
   canvas.addEventListener('pointerdown',e=>this.pointerDown(e));canvas.addEventListener('pointermove',e=>this.pointerMove(e));canvas.addEventListener('pointerup',e=>this.pointerUp(e));canvas.addEventListener('pointercancel',e=>this.cancelDrag(e));canvas.addEventListener('lostpointercapture',e=>this.cancelDrag(e));canvas.addEventListener('pointerleave',()=>this.hover=null);canvas.addEventListener('contextmenu',e=>e.preventDefault());this.frame=this.frame.bind(this);requestAnimationFrame(this.frame);}
 set(s,selected=null,placement=null){const changed=this.placement!==placement;if(changed)this.turn=0;this.state=s;this.selection=selected;this.placement=placement;this.f=E.forecast(s);this.net=E.network(s);this.preparePaths();this.geometry();this.canvas.style.touchAction=placement?'none':'manipulation';
   if(changed){this.drag=null;this.ghost=null;if(placement){let spot=null;for(const r of placement==='bridge'?[0,1]:[0]){for(let y=0;y<s.size&&!spot;y++)for(let x=0;x<s.size;x++)if(!E.canBuild(s,placement,x,y,r)){spot={x,y,rotation:r};break;}if(spot)break;}this.turn=spot?.rotation||0;this.ghost=spot?{x:spot.x,y:spot.y}:{x:Math.floor(s.size/2),y:Math.floor(s.size/2)};this.emitPlacement('preview');}}
 }
 geometry(){this.tw=1000/(this.state.size+2);this.th=this.tw*.53;const towerTop=this.state.buildings.filter(b=>['tower','kotsumaruCastle'].includes(b.type)&&!b.build).map(b=>this.art.height(b)*this.tw/100-(b.x+b.y+(E.F(b.type).w+E.F(b.type).h)/2)*this.th/2+20);this.oy=Math.max(115,(760-this.state.size*this.th)/2-25,...towerTop);}
 repeatPlacement(anchor){if(!this.placement)return;const f=E.footprint({type:this.placement,rotation:this.turn}),spots=[];
   for(let y=0;y<=this.state.size-f.h;y++)for(let x=0;x<=this.state.size-f.w;x++)if(!E.canBuild(this.state,this.placement,x,y,this.turn))spots.push({x,y,d:Math.abs(x-anchor.x)+Math.abs(y-anchor.y),direction:x>anchor.x?0:y>anchor.y?1:x<anchor.x?2:3});
   spots.sort((a,b)=>a.d-b.d||a.direction-b.direction||a.y-b.y||a.x-b.x);
   this.ghost=spots.length?{x:spots[0].x,y:spots[0].y}:{x:E.clamp(anchor.x+f.w,0,this.state.size-f.w),y:E.clamp(anchor.y,0,this.state.size-f.h)};this.drag=null;this.emitPlacement('preview');
 }
 screen(e){const r=this.canvas.getBoundingClientRect();return {x:(e.clientX-r.left)*1100/r.width,y:(e.clientY-r.top)*760/r.height,scaleY:760/r.height};}
 world(p){const x=p.x-550,y=p.y-this.oy;return {x:y/this.th+x/this.tw,y:y/this.th-x/this.tw};}
 ghostHit(p){if(!this.ghost)return false;const f=E.footprint({type:this.placement,rotation:this.turn}),g=this.ghost,z=this.art.height({type:this.placement,level:1})*this.tw/100,points=[this.project(g.x,g.y,z),this.project(g.x+f.w,g.y,z),this.project(g.x+f.w,g.y),this.project(g.x+f.w,g.y+f.h),this.project(g.x,g.y+f.h),this.project(g.x,g.y+f.h,z)];let inside=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const a=points[i],b=points[j];if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)inside=!inside;}return inside;}
 placementError(){return this.reorientId?E.canTurnBuilding(this.state,this.reorientId,this.turn):E.canBuild(this.state,this.placement,this.ghost.x,this.ghost.y,this.turn);}
 emitPlacement(phase){if(!this.placement||!this.ghost)return;this.phase=phase;const {x,y}=this.ghost;this.draw(0);this.onPlacement({type:this.placement,x,y,rotation:this.turn||0,phase,error:this.placementError()});}
 rotatePlacement(){if(!this.placement||!E.rotatable({type:this.placement})||this.drag)return;this.turn=((this.turn||0)+1)%4;this.emitPlacement(this.phase==='dropped'?'dropped':'preview');}
 pointerDown(e){if(e.button>0||e.isPrimary===false||this.drag||this.reorientId)return;this.down={x:e.clientX,y:e.clientY,id:e.pointerId??1,moved:false};if(!this.placement)return;
   e.preventDefault();const p=this.screen(e),f=E.F(this.placement),g=this.ghost,hit=this.ghostHit(p);this.drag={id:e.pointerId??1,start:p,origin:{...g},lift:hit?0:(e.pointerType==='touch'?28*p.scaleY:0),relative:hit};
   this.canvas.setPointerCapture?.(this.drag.id);this.updateGhost(e);this.emitPlacement('moving');
 }
 updateGhost(e){const d=this.drag;if(!d)return;const p=this.screen(e),f=E.footprint({type:this.placement,rotation:this.turn});let x,y;
   if(d.relative){const a=this.world(d.start),b=this.world(p);x=Math.round(d.origin.x+b.x-a.x);y=Math.round(d.origin.y+b.y-a.y);}
   else{const a=this.world({x:p.x,y:p.y-d.lift});x=Math.round(a.x-f.w/2);y=Math.round(a.y-f.h/2);}
   this.ghost={x:E.clamp(x,-f.w,this.state.size),y:E.clamp(y,-f.h,this.state.size)};
 }
 pointerMove(e){if(this.drag){if((e.pointerId??1)!==this.drag.id)return;e.preventDefault();this.drag.lastPointer={clientX:e.clientX,clientY:e.clientY};const old=this.ghost;this.panAtEdge(e);this.updateGhost(e);if(old.x!==this.ghost.x||old.y!==this.ghost.y)this.emitPlacement('moving');}else if(!this.placement){if(this.down?.id===(e.pointerId??1)&&Math.hypot(e.clientX-this.down.x,e.clientY-this.down.y)>12)this.down.moved=true;if(e.pointerType==='mouse')this.hover=this.cell(e);}}
 panAtEdge(e){const parent=this.canvas.parentElement,r=parent?.getBoundingClientRect?.();if(!r)return false;let dx=0,dy=0;const edge=32;
   if(parent.scrollWidth>parent.clientWidth+1){if(e.clientX<r.left+edge)dx=-10;else if(e.clientX>r.right-edge)dx=10;}
   if(parent.scrollHeight>parent.clientHeight+1){if(e.clientY<r.top+edge)dy=-10;else if(e.clientY>r.bottom-edge)dy=10;}
   const x=parent.scrollLeft,y=parent.scrollTop;if(dx)parent.scrollLeft=E.clamp(x+dx,0,parent.scrollWidth-parent.clientWidth);if(dy)parent.scrollTop=E.clamp(y+dy,0,parent.scrollHeight-parent.clientHeight);return x!==parent.scrollLeft||y!==parent.scrollTop;
 }
 pointerUp(e){if(e.button>0||e.isPrimary===false)return;if(this.placement){if(!this.drag||(e.pointerId??1)!==this.drag.id)return;e.preventDefault();this.updateGhost(e);const id=this.drag.id;this.drag=null;this.down=null;if(this.canvas.hasPointerCapture?.(id))this.canvas.releasePointerCapture(id);this.emitPlacement('dropped');return;}
   const d=this.down;if(!d||d.id!==(e.pointerId??1))return;this.down=null;if(d.moved||Math.hypot(e.clientX-d.x,e.clientY-d.y)>12)return;this.pick(e);
 }
 cancelDrag(e){const id=e.pointerId??1;if(this.down?.id===id)this.down=null;if(!this.drag||id!==this.drag.id)return;this.drag=null;if(this.canvas.hasPointerCapture?.(id))this.canvas.releasePointerCapture(id);this.emitPlacement('cancelled');}
 project(x,y,z=0){return {x:550+(x-y)*this.tw/2,y:this.oy+(x+y)*this.th/2-z};}
 cell(e){const r=this.canvas.getBoundingClientRect(),x=(e.clientX-r.left)*1100/r.width-550,y=(e.clientY-r.top)*760/r.height-this.oy;return {x:Math.floor(y/this.th+x/this.tw),y:Math.floor(y/this.th-x/this.tw)};}
 pick(e){if(!this.state||e.button>0)return;
   if(!this.placement){const p=this.screen(e),entry=this.project(-.3,4.5);if(Math.abs(p.x-entry.x)<this.tw*.65&&p.y>entry.y-this.tw*1.15&&p.y<entry.y+this.th*.5){this.onSelect(-1,4);return;}}
   if(!this.placement){const rect=this.canvas.getBoundingClientRect(),px=(e.clientX-rect.left)*1100/rect.width,py=(e.clientY-rect.top)*760/rect.height;
     const inside=poly=>{let hit=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a.y>py)!==(b.y>py)&&px<(b.x-a.x)*(py-a.y)/(b.y-a.y)+a.x)hit=!hit;}return hit;};
     const ordered=this.state.buildings.filter(b=>!E.isRoad(b)||b.type==='bridge').sort((a,b)=>(b.x+b.y+E.footprint(b).w+E.footprint(b).h)-(a.x+a.y+E.footprint(a).w+E.footprint(a).h));
     for(const b of ordered){const f=E.footprint(b),z=this.art.height(b)*this.tw/100;
       if(b.type==='tower'&&!b.build){const u=this.tw/100,m=this.project(b.x+f.w/2,b.y+f.h/2),base=[this.project(b.x,b.y,16*u),this.project(b.x+f.w,b.y,16*u),this.project(b.x+f.w,b.y+f.h),this.project(b.x,b.y+f.h)],outline=[{x:m.x,y:m.y-260*u},{x:m.x+43*u,y:m.y-215*u},{x:m.x+32*u,y:m.y-12*u},{x:m.x-32*u,y:m.y-12*u},{x:m.x-78*u,y:m.y-60*u},{x:m.x-80*u,y:m.y-190*u},{x:m.x-38*u,y:m.y-220*u}];if(inside(base)||inside(outline)){this.onSelect(b.x,b.y);return;}continue;}
       if(['bench','plaza','grandpark','parking','bicycle','disaster','arcade'].includes(b.type)&&!b.build)continue;
       const poly=[this.project(b.x,b.y,z),this.project(b.x+f.w,b.y,z),this.project(b.x+f.w,b.y),this.project(b.x+f.w,b.y+f.h),this.project(b.x,b.y+f.h),this.project(b.x,b.y+f.h,z)];
       if(inside(poly)){this.onSelect(b.x,b.y);return;}
     }
   }
   const p=this.cell(e);if(p.x>=0&&p.y>=0&&p.x<this.state.size&&p.y<this.state.size)this.onSelect(p.x,p.y);
 }
 poly(points,fill,stroke){const c=this.ctx;c.beginPath();points.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=1.3;c.stroke();}}
 diamond(x,y,w=1,h=1,fill='#eee',z=0){this.poly([this.project(x,y,z),this.project(x+w,y,z),this.project(x+w,y+h,z),this.project(x,y+h,z)],fill,'#4d654214');}
 box(x,y,w,h,z,top,left,right){const a=this.project(x,y),b=this.project(x+w,y),d=this.project(x,y+h),c=this.project(x+w,y+h);this.poly([{x:d.x,y:d.y-z},{x:c.x,y:c.y-z},c,d],left);this.poly([{x:c.x,y:c.y-z},{x:b.x,y:b.y-z},b,c],right);this.diamond(x,y,w,h,top,z);}
 text(t,x,y,size=18,color='#415343',font='sans-serif'){const c=this.ctx;c.fillStyle=color;c.font=`${size}px ${font}`;c.textAlign='center';c.fillText(t,x,y);}
 tree(x,y,variant,t){this.art.tree(x,y,t);}
 preparePaths(){this.traffic=new root.KTownTraffic(this.state,this.f,this.net);this.paths=this.traffic.destinations;}
 drawBuilding(b,t,layer='all'){
  if(b.type==='bridge'){this.art.building(b,t,layer);return;}
  if(E.isRoad(b)){this.art.tile(b.x,b.y,b.type,true);return;}
  this.art.building(b,t);
  this.drawSupportDecoration(b);
  if(this.photograph)return;
  const f=E.footprint(b),u=this.tw/100,p=this.project(b.x+f.w/2,b.y+f.h/2);
  if(!b.build&&b.type!=='vacant'&&!E.isRoad(b)&&(!this.net.connected(b)||b.closed))this.text(b.closed?'休業':E.F(b.type).diningAccess?'効果停止中':'未接続',p.x,p.y+26*u,13*u,'#a75d48');
  if(this.state.project&&E.operational(this.state,b,this.net)&&C.projects[this.state.project].types.includes(b.type)){
   const q=this.project(b.x+.05,b.y+f.h);this.art.line([q,{x:q.x,y:q.y-35*u}],'#9e8260',2);this.ctx.fillStyle='#d29366';this.ctx.fillRect(q.x,q.y-35*u,8*u,19*u);
  }
  if(E.rotatable(b)&&!E.F(b.type).decorative&&(b.id===this.selection||b.id===-1))this.drawEntrance(b);
 }
 drawSupportDecoration(b){
  const item=this.supportItem;if(!item||!item.group||!this.supportFeatured.has(b.id))return;
  const c=this.ctx,u=this.tw/100,f=E.F(b.type),world=E.toWorld(b,f.w*.5,f.h+.04),p=this.project(...world,5*u);c.save();c.translate(p.x,p.y);c.scale(u,u);c.strokeStyle='#87765c';c.lineWidth=2;
  if(item.id==='children'){
   c.fillStyle='#95785b';c.fillRect(-21,-30,42,30);c.fillStyle='#fff7df';c.fillRect(-18,-27,36,24);c.fillStyle='#e7ba60';c.beginPath();c.arc(11,-20,4,0,7);c.fill();c.fillStyle='#9eb79b';c.beginPath();c.moveTo(-16,-6);c.lineTo(-5,-19);c.lineTo(7,-6);c.fill();c.fillStyle='#be7866';c.fillRect(-12,-12,9,8);c.fillStyle='#5d8790';c.fillRect(-9,-10,3,6);
   c.beginPath();c.moveTo(-31,-39);c.quadraticCurveTo(0,-29,31,-39);c.stroke();for(let j=0;j<5;j++){const x=-26+j*13,y=-38+Math.sin(j/4*Math.PI)*5;c.fillStyle=['#cb8576','#e1bd69','#8cb6a4','#8eabca','#b39aba'][j];c.beginPath();c.moveTo(x-5,y);c.lineTo(x+5,y);c.lineTo(x,y+11);c.fill();}
  }else if(item.id==='music'){
   c.fillStyle='#527e91';c.fillRect(-19,-34,38,28);c.fillStyle='#f7e6b7';c.fillRect(-17,-32,34,2);c.fillRect(-17,-10,34,2);c.strokeStyle='#f9edc7';c.lineWidth=2.5;c.beginPath();c.moveTo(-4,-17);c.lineTo(-4,-28);c.lineTo(9,-31);c.lineTo(9,-20);c.stroke();for(const [x,y]of [[-8,-16],[5,-19]]){c.beginPath();c.ellipse(x,y,4,3,-.3,0,7);c.fill();}
   c.strokeStyle='#527e91';c.beginPath();c.moveTo(25,-40);c.lineTo(25,-26);c.lineTo(31,-43);c.stroke();c.fillStyle='#527e91';c.beginPath();c.ellipse(21,-25,4,3,0,0,7);c.fill();
  }else{
   c.fillStyle='#95739b';c.fillRect(-22,-48,3,48);c.fillRect(-19,-47,13,34);c.fillStyle='#f4e3b1';c.fillRect(-16,-43,7,3);c.fillRect(-16,-36,7,3);c.fillRect(-16,-29,7,3);
   c.fillStyle='#bda171';c.fillRect(9,-4,14,4);c.fillRect(14,-15,4,12);const glow=c.createRadialGradient(16,-24,1,16,-24,19);glow.addColorStop(0,'#ffdf9d70');glow.addColorStop(1,'#ffdf9d00');c.fillStyle=glow;c.fillRect(-3,-43,38,38);c.fillStyle='#f4d3a1';c.beginPath();c.ellipse(16,-24,9,13,0,0,7);c.fill();c.strokeStyle='#99709b';c.lineWidth=1.5;c.beginPath();c.moveTo(9,-24);c.lineTo(16,-32);c.lineTo(23,-24);c.lineTo(16,-16);c.closePath();c.stroke();c.fillStyle='#665b68';c.fillRect(9,-39,14,3);c.fillRect(10,-12,12,3);
  }
  c.restore();
 }
 drawEntrance(b,oneSide=false){if((b.type==='grandpark'||E.F(b.type).allSideEntrance)&&!oneSide){for(let r=0;r<4;r++)this.drawEntrance({...b,rotation:r},true);return;}const f=E.F(b.type),u=this.tw/100,project=(x,y)=>this.project(...E.toWorld(b,x,y),3*u),a=project(f.w*.5,f.h-.18),p=project(f.w*.5,f.h+.12),c=this.ctx;this.art.line([a,p],'#346c91',4);const l=project(f.w*.5-.12,f.h+.02),r=project(f.w*.5+.12,f.h+.02);this.poly([p,l,r],'#346c91');const label=project(f.w*.5,f.h+.35);c.fillStyle='#fff9e9';c.beginPath();c.roundRect(label.x-19*u,label.y-6*u,38*u,16*u,5*u);c.fill();this.text('入口',label.x,label.y+6*u,11*u,'#346c91');}
 walkHeight(x,y){const b=E.at(this.state,Math.floor(x),Math.floor(y));if(b?.type!=='bridge')return 0;const [a,c]=E.fromWorld(b,x,y),q=E.clamp((a-.08)/.84,0,1);return (6+10*Math.sin(q*Math.PI))*this.tw/100;}
 person(x,y,seg,t,bag=false,pose){this.ctx.save();this.ctx.translate(0,-this.walkHeight(x+.5,y+.5));this.art.person(x,y,seg,t,bag,pose);this.ctx.restore();}
 drawBoom(b,t){
  const c=this.ctx,f=E.footprint(b),u=this.tw/100,scale=Math.max(.72,u),bob=this.motion?Math.sin(t/400+b.id*.7)*3:0;
  const p=this.project(b.x+f.w/2,b.y+f.h/2,this.art.height(b)*u+19*scale+bob);
  c.save();c.translate(p.x,p.y);c.scale(scale,scale);
  // A steady, high-contrast label floats gently; no flashing or economic updates.
  c.shadowColor='#71513433';c.shadowBlur=5;c.shadowOffsetY=2;
  c.fillStyle='#fff2be';c.strokeStyle='#aa633d';c.lineWidth=1.6;
  c.beginPath();c.roundRect(-31,-13,62,25,9);c.fill();c.stroke();c.shadowColor='transparent';
  this.poly([{x:-4,y:12},{x:0,y:17},{x:4,y:12}],'#aa633d');
  c.font='bold 15px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillStyle='#844522';c.fillText('BOOM',0,0);
  c.strokeStyle='#be8251';c.lineWidth=2;c.lineCap='round';
  for(const side of [-1,1]){c.beginPath();c.moveTo(side*35,-5);c.lineTo(side*39,-9);c.stroke();}
  c.restore();
 }
 frame(t){if(this.state&&t-this.last>(this.drag?16:this.motion?34:300)){if(this.drag?.lastPointer&&this.panAtEdge(this.drag.lastPointer)){this.updateGhost(this.drag.lastPointer);this.emitPlacement('moving');}this.draw(t);this.last=t;}requestAnimationFrame(this.frame);}
 draw(t){const c=this.ctx,s=this.state;if(!s)return;const n=s.size;this.geometry();c.clearRect(0,0,1100,760);
   this.supportItem=E.communitySupportStatus(s).active;this.supportFeatured=new Set(this.f.shops.filter(b=>b.op).sort((a,b)=>a.id-b.id).slice(0,8).map(b=>b.id));
   // A paper miniature island, with connected paths highlighted.
   this.art.backdrop();
   for(let y=0;y<n;y++)for(let x=0;x<n;x++){
     const b=E.at(s,x,y),k=E.key(x,y);this.art.tile(x,y,E.isRoad(b)&&b.type!=='bridge'?b.type:false,this.net.roads.has(k));
   }
   // Water and riverbanks are ground surfaces: never paint them over bridge rails.
   for(const b of s.buildings.filter(b=>['stream','bridge'].includes(b.type)&&!b.build&&b.id!==this.reorientId))this.art.building(b,t,'water');
   this.art.entrance();
   for(const a of [[-1,1.5],[n+.6,2],[1,n+.7],[n+.6,n-1]])this.tree(...a,0,t);
   const items=s.buildings.filter(b=>(!E.isRoad(b)||b.type==='bridge')&&(b.type!=='stream'||b.build)&&b.id!==this.reorientId).map(b=>({depth:b.x+b.y+(['bridge','plaza','grandpark','bench','parking','bicycle'].includes(b.type)&&!b.build ? .2 : E.footprint(b).w+E.footprint(b).h-.2),b}));
   const parade=this.traffic.sampleLord(this.motion?t:0);
   for(const p of this.traffic.sample(this.motion?t:0))items.push({depth:p.x+p.y,person:[p.x-.5,p.y-.5,p.seg,p.time,p.bag,parade&&Math.hypot(p.x-parade.x,p.y-parade.y)<1.4?'wave':p.pose]});
   const {mascot,morun}=this.traffic.sampleMascots(this.motion?t:0);if(mascot)items.push({depth:mascot.x+mascot.y,mascot});
   if(morun)items.push({depth:morun.x+morun.y,morun});
   if(this.f.total>2500&&this.paths.length){for(const route of this.paths){const row=this.f.shops.find(b=>b.id===route.b.id);if(!row||row.served<(row.capacity??E.shopStats(s,route.b).capacity)*.75)continue;const p=route.path[route.path.length-1];for(let i=0;i<Math.min(3,Math.ceil(row.lost/150)+1);i++)items.push({depth:p[0]+p[1]+1,person:[p[0]-.2+i*.18,p[1]+.18,i%4,0,true]});}}
   items.sort((a,b)=>a.depth-b.depth);for(const it of items)if(it.b)this.drawBuilding(it.b,t,it.b.type==='bridge'&&!it.b.build?'deck':'all');else if(it.mascot){const m=it.mascot,p=this.project(m.x,m.y,this.walkHeight(m.x,m.y));root.KMascot.draw(c,p.x,p.y,this.tw/100*1.25,m.time,m.pose,m.facing);if(m.lord)this.art.lordHat(p.x,p.y,this.tw/100*1.25);}else if(it.morun){const m=it.morun,p=this.project(m.x,m.y,this.walkHeight(m.x,m.y));root.KMascot.drawMorun(c,p.x,p.y,this.tw/100*1.25,m.time,m.pose,m.facing);}else this.person(...it.person);
   this.art.seasonAir(t);
   const boom=s.events.boom;
   if(boom&&boom.left>0)for(const b of s.buildings){
    if(b.id!==this.reorientId&&E.F(b.type).shop&&E.boomMatches(boom,b.type)&&E.operational(s,b,this.net))this.drawBoom(b,t);
   }
   if(E.mascotBreakActive(s))for(const b of s.buildings)if(b.type==='kotsumaru'&&b.id!==this.reorientId&&E.operational(s,b,this.net))this.drawBoom(b,t);
   if(s.tenantOffer&&!this.placement){const site={type:'tenant_'+s.tenantOffer.type,...s.tenantOffer.site},shape=E.footprint(site);if(!root.KTenants.siteError(s,s.tenantOffer.type,site)){this.diamond(site.x,site.y,shape.w,shape.h,'#d6b25399');const p=this.project(site.x+shape.w/2,site.y+shape.h/2);c.fillStyle='#68511e';c.font='bold '+Math.max(10,this.tw*.15)+'px sans-serif';c.textAlign='center';c.fillText('出店要請',p.x,p.y);}}
   if(this.placement&&this.ghost){const f=E.footprint({type:this.placement,rotation:this.turn}),g=this.ghost,err=this.placementError(),color=err?'#ad5947':'#477e60';
     // The full-size building and its complete footprint stay above neighbouring artwork.
     for(let y=g.y;y<g.y+f.h;y++)for(let x=g.x;x<g.x+f.w;x++)this.diamond(x,y,1,1,err?'#d7948299':'#8fb58eaa');
     const original=s.buildings.find(b=>b.id===this.reorientId);c.save();c.globalAlpha=.82;this.drawBuilding({type:this.placement,level:1,build:0,closed:0,damage:0,spec:0,fans:0,reputation:0,legacy:false,...original,id:-1,x:g.x,y:g.y,rotation:this.turn||0},t);c.restore();
     const corners=[this.project(g.x,g.y),this.project(g.x+f.w,g.y),this.project(g.x+f.w,g.y+f.h),this.project(g.x,g.y+f.h)];c.strokeStyle=color;c.lineWidth=4;c.beginPath();corners.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();c.stroke();
     for(const p of corners){c.fillStyle=color;c.beginPath();c.arc(p.x,p.y,4.5,0,7);c.fill();}
   }
   if(s.project){const a=this.project(0,4),b=this.project(n,4);c.strokeStyle='#a58d66';c.lineWidth=1.6;c.beginPath();c.moveTo(a.x,a.y-50);c.quadraticCurveTo((a.x+b.x)/2,(a.y+b.y)/2-25,b.x,b.y-50);c.stroke();for(let i=0;i<10;i++){const f=i/9;c.fillStyle=i%2?'#e1bb78':'#c98767';c.beginPath();c.ellipse(a.x+(b.x-a.x)*f,a.y+(b.y-a.y)*f-45+Math.sin(f*Math.PI)*12,5,7,0,0,7);c.fill();}
     if(C.projects[s.project].stall&&s.projectSite){const p=s.projectSite;this.box(p.x+.12,p.y+.12,.75,.65,25*this.tw/100,'#dcaa77','#c39971','#aa896b');this.box(p.x+.08,p.y+.08,.85,.7,44*this.tw/100,'#c87e60','#e3bb91','#bb8863');const q=this.project(p.x+.55,p.y+.55,45*this.tw/100);this.text('市',q.x,q.y+3,14,'#fff8e1');}
   }

 }
}
root.KTown=Town;
})(globalThis);
