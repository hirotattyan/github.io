/* Kotsumaru: original shopkeeper tanuki, drawn at 1.25 pedestrian height. */
(function(root){
'use strict';
function draw(c,x,y,scale=1,time=0,pose='walk',facing=1){
 const greet=pose==='highfive',wave=pose==='wave',cling=pose==='cling',still=pose==='rest'||pose==='idle',step=wave||cling||greet||still?0:Math.sin(time/180),bob=greet?Math.sin(Math.min(1,time/1800)*Math.PI)*1.8:wave||cling||still?0:Math.abs(step)*.5;
 c.save();c.translate(x,y);c.scale(scale,scale);
 const oval=(x,y,rx,ry,color)=>{c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();};
 if(!cling)oval(0,0,7,2,'#667e5333');if(cling)c.rotate(-.18);c.translate(0,-bob);c.scale(facing<0?-1:1,1);
 oval(-7,-7,4.5,5,'#9b714b');oval(-7,-7,2.7,3.5,'#af8357');
 oval(cling?3:-3,-1-step*.7,2.5,1.7,'#72563c');oval(cling?9:3,cling?-4:-1+step*.7,cling?3:2.5,1.7,'#72563c');
 oval(0,-9,7.2,8.3,'#b48a5c');oval(0,-8,5.2,6,'#eddbad');
 oval(cling?-4:-6.8,wave?-14-Math.sin(time/160)*1.3:-9+step,2.3,3.1,'#b48a5c');oval(greet?10.5:cling?9:6.8,greet?-12-Math.sin(Math.min(1,time/600)*Math.PI/2)*6:cling?-14:-9-step,cling?4.6:2.3,cling?2.8:3.1,'#b48a5c');
 c.fillStyle='#476748';c.beginPath();c.roundRect(-5.7,-14,11.4,11.4,1.5);c.fill();c.strokeStyle='#476748';c.lineWidth=1.4;c.beginPath();c.moveTo(-4,-16);c.lineTo(-4,-12);c.moveTo(4,-16);c.lineTo(4,-12);c.stroke();
 c.strokeStyle='#afbf78';c.lineWidth=.8;c.beginPath();c.moveTo(0,-6);c.lineTo(0,-10);c.stroke();oval(-1.5,-9.7,1.8,.9,'#afbf78');oval(1.5,-10.3,1.8,.9,'#afbf78');
 oval(-5.5,-22,3.1,3.3,'#9c754e');oval(5.5,-22,3.1,3.3,'#9c754e');oval(-5.5,-22,1.7,1.8,'#ddc59a');oval(5.5,-22,1.7,1.8,'#ddc59a');
 oval(0,-18.5,8.5,7,'#b78a59');oval(-3.7,-18.4,2.6,3,'#71533b');oval(3.7,-18.4,2.6,3,'#71533b');oval(0,-15.4,4.8,3.3,'#f0ddb2');
 oval(-3.5,-18.6,.85,1.1,'#263a2c');oval(3.5,-18.6,.85,1.1,'#263a2c');oval(0,-16.1,1.2,.8,'#4e4032');oval(-5.3,-15.7,1.4,.75,'#cf9774');oval(5.3,-15.7,1.4,.75,'#cf9774');
 c.strokeStyle='#72543b';c.lineWidth=.65;c.beginPath();c.arc(0,-14.7,1.5,0,Math.PI);c.stroke();
 c.strokeStyle='#f4e6c8';c.lineWidth=2;c.beginPath();c.moveTo(-7,-22.2);c.quadraticCurveTo(0,-24,7,-22.2);c.stroke();oval(7.3,-22.2,1.5,1.3,'#f4e6c8');c.fillStyle='#f4e6c8';c.beginPath();c.moveTo(7,-22);c.lineTo(10,-24);c.lineTo(9,-20);c.closePath();c.fill();
 if(greet)greetingSpark(c,time);c.restore();
}
function drawMorun(c,x,y,scale=1,time=0,pose='walk',facing=1){
 const greet=pose==='highfive',wave=pose==='wave',step=wave||greet?0:Math.sin(time/180);c.save();c.translate(x,y);c.scale(scale,scale);
 const oval=(x,y,rx,ry,color)=>{c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();},poly=(points,color)=>{c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();};
 oval(0,0,8,2,'#667e5333');c.translate(0,greet?-Math.sin(Math.min(1,time/1800)*Math.PI)*1.8:-Math.abs(step)*.5);c.scale(facing<0?-1:1,1);
 oval(-8,-10,6,8,'#e5943c');poly([[-12,-17],[-14,-12],[-12,-6],[-8,-8],[-8,-13]],'#fff0d2');
 oval(-3,-1-step*.7,2.5,1.7,'#77553d');oval(3,-1+step*.7,2.5,1.7,'#77553d');oval(0,-9,7,8,'#e99e43');oval(0,-9,4.8,6,'#fff0d2');
 oval(-6.6,-9+step,2.2,3,'#d88b37');oval(greet?10.5:6.6,greet?-12-Math.sin(Math.min(1,time/600)*Math.PI/2)*6:wave?-15-Math.sin(time/160):-9-step,2.2,3,'#d88b37');
 poly([[-5,-15],[-6,-5],[-1,-3],[0,-5],[2,-3],[6,-5],[5,-15]],'#3769ae');poly([[-3,-15],[0,-11],[3,-15]],'#fff3dc');oval(0,-9,1,.9,'#edc267');oval(0,-6,1,.9,'#edc267');
 poly([[-3,-14],[0,-13],[-3,-11]],'#ee9380');poly([[3,-14],[0,-13],[3,-11]],'#ee9380');oval(0,-12.5,.8,.8,'#d77767');poly([[3,-11],[3.7,-9.8],[5,-9.5],[3.7,-9],[3,-7.8],[2.3,-9],[1,-9.5],[2.3,-9.8]],'#edc267');
 poly([[-8,-19],[-8,-31],[-1,-24]],'#df9138');poly([[8,-19],[8,-31],[1,-24]],'#df9138');poly([[-6.6,-23],[-6.5,-28.5],[-3,-24]],'#fff0d2');poly([[6.6,-23],[6.5,-28.5],[3,-24]],'#fff0d2');
 oval(0,-19,8.5,6.6,'#efa54b');poly([[-9,-18],[-5,-19],[0,-17],[5,-19],[9,-18],[6,-14],[0,-12.7],[-6,-14]],'#fff0d2');
 oval(-3.3,-19,.95,1.3,'#4b382c');oval(3.3,-19,.95,1.3,'#4b382c');oval(-3.6,-19.4,.28,.35,'#fff8e5');oval(3,-19.4,.28,.35,'#fff8e5');oval(0,-16.8,1.2,.8,'#594334');
 c.strokeStyle='#87583b';c.lineWidth=.65;c.beginPath();c.arc(0,-15.3,1.5,0,Math.PI);c.stroke();
 c.fillStyle='#e88c70';c.fillRect(-10,-7,5,6);c.strokeStyle='#c4735d';c.lineWidth=.7;c.beginPath();c.arc(-7.5,-7,1.5,Math.PI,0);c.stroke();if(greet)greetingSpark(c,time);c.restore();
}
function greetingSpark(c,time){
 if(time<500||time>1150)return;
 const glow=Math.sin((time-500)/650*Math.PI);c.save();c.globalAlpha=glow;c.strokeStyle='#e7b649';c.lineWidth=1.2;c.lineCap='round';
 for(const [dx,dy]of [[1,-1],[0,-1],[-1,-1]]){c.beginPath();c.moveTo(10.5+dx*4,-20+dy*3);c.lineTo(10.5+dx*6,-20+dy*6);c.stroke();}c.restore();
}
function icon(){return '<svg viewBox="0 0 80 90" aria-hidden="true"><ellipse cx="19" cy="66" rx="12" ry="13" fill="#9b714b"/><ellipse cx="40" cy="62" rx="22" ry="25" fill="#b78a59"/><path d="M23 52h34v32H23z" fill="#476748"/><path d="M40 73v-12m0 6c-10 0-11-8-11-8 9-1 11 8 11 8m0-2s1-8 11-8c0 8-11 8-11 8" fill="#afbf78" stroke="#afbf78"/><circle cx="21" cy="20" r="10" fill="#9b714b"/><circle cx="59" cy="20" r="10" fill="#9b714b"/><ellipse cx="40" cy="35" rx="28" ry="23" fill="#b78a59"/><ellipse cx="29" cy="34" rx="8" ry="10" fill="#71533b"/><ellipse cx="51" cy="34" rx="8" ry="10" fill="#71533b"/><ellipse cx="40" cy="45" rx="15" ry="10" fill="#f0ddb2"/><circle cx="29" cy="34" r="2.5" fill="#263a2c"/><circle cx="51" cy="34" r="2.5" fill="#263a2c"/><ellipse cx="40" cy="41" rx="4" ry="2.5" fill="#4e4032"/><path d="M35 47q5 6 10 0" fill="none" stroke="#71533b" stroke-width="2"/><path d="M16 23q24-8 48 0" fill="none" stroke="#f4e6c8" stroke-width="6"/><path d="m64 23 12-8-3 14z" fill="#f4e6c8"/></svg>';}
root.KMascot={draw,drawMorun,icon};if(typeof module!=='undefined')module.exports=root.KMascot;
})(globalThis);
