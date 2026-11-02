/* Representative pedestrians. This planner never advances or mutates the economy. */
(function(root){
'use strict';const E=root.KE;
const point=k=>k.split(',').map(Number),same=(a,b)=>a[0]===b[0]&&a[1]===b[1];
class Traffic{
 constructor(state,forecast,network){this.state=state;this.f=forecast;this.net=network;this.cache=new Map();this.destinations=[];this.agents=[];this.coverage=[];this.prepare();}
 neighbours(k){const [x,y]=point(k);return [[x+1,y],[x,y+1],[x-1,y],[x,y-1]].map(p=>E.key(...p)).filter(k=>this.net.roads.has(k)&&E.roadLinked(E.at(this.state,x,y),E.at(this.state,...point(k))));}
 roadPath(from,to){const id=from+'>'+to;if(this.cache.has(id))return this.cache.get(id);const parents=new Map([[from,null]]),queue=[from];for(let i=0;i<queue.length&&!parents.has(to);i++)for(const next of this.neighbours(queue[i]))if(!parents.has(next)){parents.set(next,queue[i]);queue.push(next);}const path=[];if(parents.has(to))for(let k=to;k;k=parents.get(k))path.unshift(point(k));this.cache.set(id,path);return path;}
 approach(b){if(b.rotation!==undefined&&E.rotatable(b))return E.entranceCells(b).filter(p=>this.net.access(b,...p)).map(p=>E.key(...p))[0];const options=[];for(const [x,y]of E.cells(b))for(const [a,c]of [[x,y+1],[x+1,y],[x-1,y],[x,y-1]]){const key=E.key(a,c);if(!this.net.access(b,a,c))continue;const f=E.footprint(b);if(a>=b.x&&a<b.x+f.w&&c>=b.y&&c<b.y+f.h)continue;options.push({key,score:c>=b.y+f.h?0:a>=b.x+f.w?1:a<b.x?2:3});}options.sort((a,b)=>a.score-b.score||a.key.localeCompare(b.key));return options[0]?.key;}
 gate(b,key){const [x,y]=point(key),f=E.footprint(b);return [E.clamp(x+.5,b.x+.1,b.x+f.w-.1),E.clamp(y+.5,b.y+.1,b.y+f.h-.1)];}
 interior(b,gate){const local=E.fromWorld(b,...gate),path=this.localInterior(b,[b.x+local[0],b.y+local[1]]);return path.map(p=>E.toWorld(b,p[0]-b.x,p[1]-b.y));}
localInterior(b,gate){const f=E.F(b.type),target=b.type==='eventStage'?[b.x+1.5,b.y+1.65]:b.type==='plaza'?[b.x+.9,b.y+1.68]:b.type==='bench'?[b.x+.43,b.y+.51]:b.type==='parking'?[b.x+.55,b.y+f.h-.25]:[b.x+.45,b.y+f.h-.2],width=f.w*4,height=f.h*4;
  const world=(x,y)=>[b.x+.125+x*.25,b.y+.125+y*.25];
  const clear=(x,y)=>{if(x<0||y<0||x>=width||y>=height)return false;const [a,c]=world(x,y),dx=a-b.x,dy=c-b.y;
   if(b.type==='plaza')return Math.hypot(dx-1,dy-1)>.38&&Math.hypot(dx-.38,dy-.4)>.23&&Math.hypot(dx-1.62,dy-1.55)>.23;
   if(b.type==='parking')return ![.15,.69,1.23].some(left=>dx>left-.04&&dx<left+.42&&dy>.2&&dy<1.0);
   return true;
  };
  const nearest=p=>{let best=null,d=Infinity;for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(clear(x,y)){const q=world(x,y),n=Math.hypot(q[0]-p[0],q[1]-p[1]);if(n<d){best=E.key(x,y);d=n;}}return best;};
  const start=nearest(gate),end=nearest(target);if(!start||!end)return [gate];const parents=new Map([[start,null]]),q=[start];for(let i=0;i<q.length&&!parents.has(end);i++){const [x,y]=point(q[i]);for(const [a,c]of [[x+1,y],[x,y+1],[x-1,y],[x,y-1]]){const k=E.key(a,c);if(clear(a,c)&&!parents.has(k)){parents.set(k,q[i]);q.push(k);}}}
  const route=[];if(parents.has(end))for(let k=end;k;k=parents.get(k))route.unshift(world(...point(k)));return route.length?[gate,...route,target]:[gate];
 }
 prepare(){const s=this.state,net=this.net;if(!net.roads.size)return;
  // A closed spanning-tree walk covers every connected road, including quiet side streets.
  const seen=new Set(),walk=k=>{seen.add(k);this.coverage.push(point(k));for(const next of this.neighbours(k))if(!seen.has(next)){walk(next);this.coverage.push(point(k));}};walk('0,4');
this.castle=E.castleBuilding(s,net);if(this.castle){const b=this.castle,road=E.castleWalkEntrance(s,b,net).road;if(road){this.castleRoad=point(road);const toGate=this.roadPath(road,'0,4').map(([x,y])=>[x+.5,y+.5]),gate=[b.x+2.5,b.y+5.9],raw=[gate,[b.x+2.5,b.y+6.5],...toGate,...this.coverage.map(([x,y])=>[x+.5,y+.5]),...toGate.slice().reverse(),[b.x+2.5,b.y+6.5],gate];this.lordPath=raw.filter((p,i)=>!i||!same(p,raw[i-1]));this.lordRoute=this.routeAgent(this.lordPath,[],0,0);}}
const publicTypes=['plaza','bench','toilet','parking','bicycle','shrine','tower','eventStage'];
for(const b of s.buildings){const f=E.F(b.type);if(!E.operational(s,b,net)||(!f.shop&&!f.tenant&&!publicTypes.includes(b.type))||f.tenant&&!root.KTenants?.active(s))continue;const road=this.approach(b);if(!road)continue;const row=this.f.shops.find(r=>r.id===b.id),gate=this.gate(b,road),outdoor=['plaza','bench','parking','bicycle','eventStage'].includes(b.type);this.destinations.push({b,road,gate,outdoor,inside:outdoor?this.interior(b,gate):[gate],path:this.roadPath('0,4',road),weight:row?Math.sqrt(Math.max(1,row.served))*(s.events.boom?.type===b.type?1.3:1):0});}
  const mean=this.destinations.filter(d=>E.F(d.b.type).shop).reduce((a,d)=>a+d.weight,0)/Math.max(1,this.destinations.filter(d=>E.F(d.b.type).shop).length);
  for(const d of this.destinations)if(!E.F(d.b.type).shop)d.weight=Math.max(2,mean*(d.b.type==='tower'?.95:d.b.type==='shrine'?.7:d.b.type==='plaza'?.8:d.b.type==='bench'?.55:.35))*(s.projectSite?.id===d.b.id?1.5:1);
  const count=this.f.total>0?Math.min(72,Math.max(1,Math.ceil(this.f.total/90))):0;if(!count)return;
  const exact=this.f.visitors.map(n=>n/Math.max(1,this.f.total)*count),quota=exact.map(Math.floor);let remainder=count-quota.reduce((a,b)=>a+b,0);for(const i of exact.map((n,i)=>({i,f:n-quota[i]})).sort((a,b)=>b.f-a.f).map(v=>v.i))if(remainder-->0)quota[i]++;
  const cohorts=[];while(cohorts.length<count)for(let seg=0;seg<4;seg++)if(quota[seg]>0){cohorts.push(seg);quota[seg]--;}
  const walking=this.destinations.length?Math.min(count-1,Math.max(1,Math.round(count*.32))):count,diners=count-walking;
  for(let i=0;i<walking;i++){const path=this.coverage.map(([x,y])=>[x+.5,y+.5]),agent=this.routeAgent(path,[],cohorts[i],i);agent.offset=agent.period*(i+.35)/Math.max(1,walking);this.agents.push(agent);}
  if(!diners||!this.destinations.length)return;
  // Allocate real demand weights without modular strides that can select just one shop.
  const visits=Math.max(diners*2,this.destinations.length),alloc=this.destinations.map(()=>1),totalWeight=this.destinations.reduce((a,d)=>a+d.weight,0),remaining=visits-alloc.length,extra=this.destinations.map(d=>remaining*d.weight/totalWeight);
  for(let i=0;i<alloc.length;i++)alloc[i]+=Math.floor(extra[i]);let left=visits-alloc.reduce((a,b)=>a+b,0);for(const i of extra.map((n,i)=>({i,f:n-Math.floor(n)})).sort((a,b)=>b.f-a.f).map(v=>v.i))if(left-->0)alloc[i]++;
  const stops=[];while(stops.length<visits)for(let i=0;i<alloc.length;i++)if(alloc[i]>0){stops.push(this.destinations[i]);alloc[i]--;}
  const itineraries=Array.from({length:diners},()=>[]),shrineVisits=Array(diners).fill(0);for(let j=0;j<stops.length;j++){const d=stops[j];let index=j%diners;if(d.b.type==='shrine'){let best=Infinity;for(let k=0;k<diners;k++){const i=(k+j)%diners,score=(shrineVisits[i]+1)/E.F('shrine').pop[cohorts[walking+i]];if(score<best){best=score;index=i;}}shrineVisits[index]++;}itineraries[index].push(d);}
  const roadKeys=[...net.roads];for(let i=0;i<diners;i++){const start=roadKeys[Math.floor((i+.5)*roadKeys.length/diners)%roadKeys.length];this.agents.push(this.routeAgent(null,itineraries[i],cohorts[walking+i],walking+i,start));}
 }
 routeAgent(coverage,stops,seg,index,start){const parts=[];let elapsed=0,bag=false;
  const add=(a,b,duration,options={})=>{parts.push({a,b,start:elapsed,end:elapsed+duration,...options});elapsed+=duration;};
  const walk=points=>{for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],distance=Math.hypot(b[0]-a[0],b[1]-a[1]);if(distance>.001)add(a,b,distance*(1200+(index%5)*65),{bag});}};
  if(coverage){walk(coverage);if(!elapsed)add(coverage[0],coverage[0],4000);}
  else{let current=start;for(const d of stops){const roads=this.roadPath(current,d.road).map(([x,y])=>[x+.5,y+.5]);walk(roads);const inside=[roads.at(-1),...d.inside];walk(inside);const target=inside.at(-1),rest=d.b.type==='plaza'||d.b.type==='bench';add(target,target,d.outdoor?rest?4500:2000:2800,{hidden:!d.outdoor,pose:rest?'rest':'wait',facility:d.b.id,bag});if(E.F(d.b.type).shop||E.F(d.b.type).tenant)bag=true;walk([...inside].reverse());current=d.road;}walk(this.roadPath(current,start).map(([x,y])=>[x+.5,y+.5]));}
  return {parts,period:Math.max(1,elapsed),offset:elapsed*((index*.61803398875+.17)%1),seg,index,stops:stops.map(d=>d.b.id)};
 }
 sampleLord(time){if(!E.castleEffects(this.state,this.net).walk||!this.lordRoute?.parts.length)return null;const r=this.lordRoute,now=((time%r.period)+r.period)%r.period,p=r.parts.find(p=>now<p.end)||r.parts.at(-1),f=(now-p.start)/(p.end-p.start),a=p.a,b=p.b;return {x:a[0]+(b[0]-a[0])*f,y:a[1]+(b[1]-a[1])*f,time,pose:'walk',facing:(b[0]-a[0])-(b[1]-a[1])<0?-1:1,lord:true};}
 sampleMascot(time){
  if(!E.mascotActive(this.state)||['typhoon','flood','rain','snow','heat'].includes(root.KEvents?.climate(this.state).type)||!this.coverage.length)return null;
  const path=this.coverage,period=Math.max(1,path.length-1)*2400,now=((time%period)+period)%period,index=Math.floor(now/2400),a=path[Math.min(index,path.length-1)],b=path[Math.min(index+1,path.length-1)],pause=index%6===0,phase=now%2400,f=pause?Math.min(1,phase/1600):phase/2400;
  return {x:a[0]+.5+(b[0]-a[0])*f,y:a[1]+.5+(b[1]-a[1])*f,pose:pause&&phase>=1600?'wave':'walk',facing:(b[0]-a[0])-(b[1]-a[1])<0?-1:1,time};
 }
 sampleMorun(time){
  const duet=this.state.events.mascotMoment?.type==='duet'&&this.state.events.mascotMoment.at===this.state.month;
  if(!E.mascotActive(this.state)||!(['morun','morunBreak'].includes(this.state.events.active?.type)||duet)||!this.coverage.length)return null;
  const path=this.coverage,period=Math.max(1,path.length-1)*2600,now=((time+period*.43)%period+period)%period,index=Math.floor(now/2600),a=path[Math.min(index,path.length-1)],b=path[Math.min(index+1,path.length-1)],phase=now%2600,pause=index%5===0,f=pause?Math.min(1,phase/1750):phase/2600;
  return {x:a[0]+.56+(b[0]-a[0])*f,y:a[1]+.44+(b[1]-a[1])*f,pose:pause&&phase>=1750?'wave':'walk',facing:(b[0]-a[0])-(b[1]-a[1])<0?-1:1,time};
 }
 // Presentation-only encounter state: the two walkers pause together, then resume
 // their original road routes. No game state or simulation RNG is touched.
 sampleMascots(time){
  if(this.castleRoad&&E.castleEffects(this.state,this.net).festival){const [x,y]=this.castleRoad;return {mascot:{x:x+.35,y:y+.35,time,pose:'wave',facing:1,lord:true},morun:{x:x+.7,y:y+.7,time,pose:'wave',facing:-1}};}
  const lord=this.sampleLord(time);if(lord)return {mascot:lord,morun:null};
  if(this.mascotFrameTime!==undefined&&time<this.mascotFrameTime){this.mascotPause=0;this.greeting=null;this.nextGreeting=0;}
  this.mascotFrameTime=time;
  if(this.greeting&&time>=this.greeting.start+1800){this.mascotPause=(this.mascotPause||0)+1800;this.greeting=null;this.nextGreeting=time+12000;}
  const walkTime=time-(this.mascotPause||0),mascot=this.sampleMascot(walkTime),morun=this.sampleMorun(walkTime);
  if(!mascot||!morun){if(this.greeting){this.mascotPause=(this.mascotPause||0)+Math.max(0,time-this.greeting.start);this.greeting=null;}return {mascot,morun};}
  if(!this.greeting&&time>=(this.nextGreeting||0)){
   const dx=morun.x-mascot.x,dy=morun.y-mascot.y,screen=dx-dy;
   if(Math.hypot(dx,dy)<=.72&&Math.abs(screen)>=.32&&Math.floor(mascot.x)===Math.floor(morun.x)&&Math.floor(mascot.y)===Math.floor(morun.y)){
    this.greeting={start:time,mascot:{...mascot,facing:screen<0?-1:1},morun:{...morun,facing:screen<0?1:-1}};
   }
  }
  if(this.greeting){const g=this.greeting,elapsed=time-g.start;return {mascot:{...g.mascot,pose:'highfive',time:elapsed},morun:{...g.morun,pose:'highfive',time:elapsed}};}
  return {mascot,morun};
 }
 sample(time){const people=[];for(const a of this.agents){const now=((time+a.offset)%a.period+a.period)%a.period;let lo=0,hi=a.parts.length-1;while(lo<hi){const m=(lo+hi)>>1;if(a.parts[m].end<=now)lo=m+1;else hi=m;}const p=a.parts[lo];if(!p||p.hidden)continue;const f=(now-p.start)/(p.end-p.start),x=p.a[0]+(p.b[0]-p.a[0])*f,y=p.a[1]+(p.b[1]-p.a[1])*f,dx=p.b[0]-p.a[0],dy=p.b[1]-p.a[1],distance=Math.hypot(dx,dy),lane=((a.index%3)-1)*.07;
   const xx=x+(distance?-dy/distance*lane:0),yy=y+(distance?dx/distance*lane:0);people.push({x:xx,y:yy,seg:a.seg,bag:p.bag,pose:p.pose,facility:p.facility,time:time+a.index*177});}
  const lord=this.sampleLord(time);if(lord&&this.net.roads.has(E.key(Math.floor(lord.x),Math.floor(lord.y))))for(let i=0;i<Math.min(4,people.length);i++){people[i]={...people[i],x:Math.floor(lord.x)+[.18,.82,.18,.82][i],y:Math.floor(lord.y)+[.18,.18,.82,.82][i],pose:'wave'};}
  return people;}
}
root.KTownTraffic=Traffic;if(typeof module!=='undefined')module.exports=Traffic;
})(globalThis);
