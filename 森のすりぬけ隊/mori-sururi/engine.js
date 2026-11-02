(function(root){
'use strict';
const CHARACTERS={boar:{name:'猪',maxHp:5,speed:165},tiger:{name:'虎',maxHp:3,speed:214.5}};
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function sweptHit(entity,player,oldPlayer){const ax=entity.px-oldPlayer.x,ay=entity.py-oldPlayer.y,bx=entity.x-player.x,by=entity.y-player.y,dx=bx-ax,dy=by-ay,t=clamp(-(ax*dx+ay*dy)/(dx*dx+dy*dy||1),0,1);return Math.hypot(ax+dx*t,ay+dy*t)<entity.r+player.r;}
class ForestGame{
 constructor(random=Math.random){this.random=random;this.width=360;this.height=540;this.reset('boar');}
 reset(character='boar'){this.character=CHARACTERS[character]?character:'boar';const spec=CHARACTERS[this.character];this.player={x:this.width/2,y:this.height*.76,r:11,hp:spec.maxHp,maxHp:spec.maxHp,speed:spec.speed};this.elapsed=0;this.score=0;this.level=1;this.invincible=0;this.rocks=[];this.bullets=[];this.fruits=[];this.warnings=[];this.effects=[];this.events=[];this.target=null;this.dragging=false;this.running=false;this.over=false;this.rockTimer=.8;this.fruitTimer=6;this.shotTimer=15;this.nextId=1;this.crossfireTurn=0;this.lastEvent='';}
 takeEvents(){const events=this.events;this.events=[];return events;}
 resize(w,h){this.width=Math.max(160,w);this.height=Math.max(240,h);this.player.x=clamp(this.player.x,25,this.width-25);this.player.y=clamp(this.player.y,25,this.height-25);if(this.target){this.target.x=clamp(this.target.x,25,this.width-25);this.target.y=clamp(this.target.y,25,this.height-25);}}
 beginDrag(){if(!this.running)return;this.dragging=true;this.target={x:this.player.x,y:this.player.y};}
 dragBy(dx,dy){if(!this.dragging||!this.target)return;this.target.x=clamp(this.target.x+dx,25,this.width-25);this.target.y=clamp(this.target.y+dy,25,this.height-25);}
 endDrag(){this.dragging=false;this.target=null;}
 pause(){this.running=false;this.endDrag();}
 randomBetween(a,b){return a+(b-a)*this.random();}
 rock(){if(this.rocks.length>=10)return;const radius=this.randomBetween(20,26),lane=Math.floor(this.random()*5),x=(lane+.5)*this.width/5;if(Math.hypot(x-this.player.x,-30-this.player.y)<100||this.rocks.some(r=>r.y<105&&Math.abs(r.x-x)<r.r+radius+18))return;this.rocks.push({id:this.nextId++,type:'rock',x,y:-30,px:x,py:-30,r:radius,vx:this.level===1?0:this.randomBetween(-12,12)*(this.level-1),vy:68+(this.level-1)*16,angle:this.random()*6.28,spin:this.randomBetween(-.35,.35)});}
 fruit(){if(this.fruits.length>=2)return;const x=this.randomBetween(26,this.width-26);this.fruits.push({id:this.nextId++,type:'fruit',x,y:-20,px:x,py:-20,baseX:x,r:10,vy:32,phase:this.random()*6.28,age:0});}
 warning(){
 if(this.warnings.length)return;
 const paired=this.elapsed>=60||(this.elapsed>=30&&this.crossfireTurn%2===0),count=paired?2:1,limit=this.elapsed>=30?4:2;
 if(this.bullets.length+count>limit)return;
 const target={x:this.player.x,y:this.player.y},candidates=[];
 const add=(side,t)=>{const p=side===0?{x:24+t*(this.width-48),y:12}:side===1?{x:12,y:30+t*(this.height-60)}:side===2?{x:this.width-12,y:30+t*(this.height-60)}:{x:24+t*(this.width-48),y:this.height-12};const distance=Math.hypot(target.x-p.x,target.y-p.y);if(distance<130)return;candidates.push({...p,side,distance,dx:(target.x-p.x)/distance,dy:(target.y-p.y)/distance});};
 for(let side=0;side<4;side++){add(side,this.random());for(const t of [.08,.5,.92])add(side,t);}
 let origins=[];
 if(paired){let bestScore=-Infinity;for(let i=0;i<candidates.length;i++)for(let j=i+1;j<candidates.length;j++){const a=candidates[i],b=candidates[j],dot=a.dx*b.dx+a.dy*b.dy;
 // Distinct edges, 55–140 degrees apart: crossfire without a head-on pincer.
 if(a.side===b.side||dot>Math.cos(55*Math.PI/180)||dot<Math.cos(140*Math.PI/180))continue;
 const score=a.distance+b.distance+this.random()*80;if(score>bestScore){bestScore=score;origins=[a,b];}}
 }else{let bestScore=-Infinity;for(const c of candidates){const score=c.distance+this.random()*120;if(score>bestScore){bestScore=score;origins=[c];}}}
 if(origins.length!==count)return;
 for(const origin of origins)this.warnings.push({id:this.nextId++,x:origin.x,y:origin.y,side:origin.side,targetX:target.x,targetY:target.y,dx:origin.dx,dy:origin.dy,left:.8,speed:270+(this.level-1)*20});
 if(this.elapsed>=30&&this.elapsed<60)this.crossfireTurn++;
 }

 hit(amount){if(this.invincible>0||this.over)return false;this.player.hp=Math.max(0,this.player.hp-amount);this.invincible=1;this.events.push({type:'damage',amount});this.lastEvent=`damage:${amount}`;this.effects.push({x:this.player.x,y:this.player.y-25,text:`−${amount}`,color:'#ffd2b6',left:.75});if(!this.player.hp){this.over=true;this.running=false;this.endDrag();}return true;}
 step(dt,keys={}){if(!this.running||this.over||dt<=0)return;this.elapsed+=dt;this.score=Math.floor(this.elapsed*10);this.level=Math.min(6,1+Math.floor(this.elapsed/20));this.invincible=Math.max(0,this.invincible-dt);const oldPlayer={x:this.player.x,y:this.player.y};let dx=(keys.right?1:0)-(keys.left?1:0),dy=(keys.down?1:0)-(keys.up?1:0);if(dx||dy){const len=Math.hypot(dx,dy);this.player.x+=dx/len*this.player.speed*dt;this.player.y+=dy/len*this.player.speed*dt;}else if(this.dragging&&this.target){dx=this.target.x-this.player.x;dy=this.target.y-this.player.y;const length=Math.hypot(dx,dy),travel=Math.min(length,this.player.speed*dt);if(length){this.player.x+=dx/length*travel;this.player.y+=dy/length*travel;}}
 this.player.x=clamp(this.player.x,25,this.width-25);this.player.y=clamp(this.player.y,25,this.height-25);
 this.rockTimer-=dt;if(this.rockTimer<=0){this.rock();this.rockTimer=Math.max(.36,.8-(this.level-1)*.085)+this.random()*.12;}
 this.fruitTimer-=dt;if(this.fruitTimer<=0){this.fruit();this.fruitTimer=12+this.random()*4;}
 // Existing warnings tick first so a newly created warning always lasts 0.8 seconds.
 let fired=0;for(const w of this.warnings){w.left-=dt;if(w.left<=0){this.bullets.push({id:w.id,type:'bullet',x:w.x,y:w.y,px:w.x,py:w.y,vx:w.dx*w.speed,vy:w.dy*w.speed,r:4.5});fired++;}}
 if(fired)this.events.push({type:'shot',count:fired});
 this.warnings=this.warnings.filter(w=>w.left>0);
 this.shotTimer-=dt;if(this.shotTimer<=0&&this.elapsed>=15){this.warning();this.shotTimer=Math.max(1.6,3.1-(this.level-1)*.3);}
 for(const list of [this.rocks,this.bullets,this.fruits])for(const e of list){e.px=e.x;e.py=e.y;if(e.type==='fruit'){e.age+=dt;e.y+=e.vy*dt;e.x=clamp(e.baseX+Math.sin(e.age*2+e.phase)*7,14,this.width-14);}else{e.x+=e.vx*dt;e.y+=e.vy*dt;if(e.type==='rock'){e.angle+=e.spin*dt;if(e.x<e.r+4){e.x=e.r+4;e.vx=Math.abs(e.vx);}else if(e.x>this.width-e.r-4){e.x=this.width-e.r-4;e.vx=-Math.abs(e.vx);}}}}
 for(const list of [this.rocks,this.bullets])for(const e of list){if(sweptHit(e,this.player,oldPlayer)&&this.hit(e.type==='rock'?1:2))e.remove=true;}
 if(!this.over)for(const e of this.fruits){if(this.player.hp<this.player.maxHp&&sweptHit(e,this.player,oldPlayer)){this.player.hp++;e.remove=true;this.events.push({type:'heal'});this.lastEvent='heal';this.effects.push({x:this.player.x,y:this.player.y-28,text:'+1',color:'#c0f5b1',left:.85});}}
 const inside=e=>!e.remove&&e.x>-55&&e.x<this.width+55&&e.y>-65&&e.y<this.height+55;
 this.rocks=this.rocks.filter(inside);this.bullets=this.bullets.filter(inside);this.fruits=this.fruits.filter(inside);for(const e of this.effects){e.left-=dt;e.y-=dt*22;}this.effects=this.effects.filter(e=>e.left>0);
 }
}
if(typeof module!=='undefined')module.exports={ForestGame,CHARACTERS,sweptHit};else root.Forest={ForestGame,CHARACTERS,sweptHit};
})(typeof window!=='undefined'?window:globalThis);
