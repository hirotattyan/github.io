/* Original code-drawn miniature town. Art never changes simulation state. */
(function(root){
'use strict';
const E=root.KE;
const SEASONS={
 '春':{sky:['#fae9e5','#e3edcf'],grass:['#c4d99a','#d4e4b1'],park:'#b5d28c',trees:['#eaa7be','#f4c4d0','#ffdce0'],road:'#eadcc5',edge:['#b4c48e','#99ad7a']},
 '夏':{sky:['#d4eced','#dce9c2'],grass:['#8fbd76','#a5ce85'],park:'#78ab63',trees:['#3f845b','#579a61','#78b46b'],road:'#e6d8b1',edge:['#8fa973','#74935f']},
 '秋':{sky:['#f8e3c6','#eddbba'],grass:['#d7bb7e','#e0c893'],park:'#c8ab68',trees:['#b9573f','#d8813c','#edb64f'],road:'#e5cfac',edge:['#b59b66','#a78b5e']},
 '冬':{sky:['#e1e8ed','#cbd6d9'],grass:['#c5c6b3','#d1cfbf'],park:'#b5bba7',trees:['#678a7b','#7e9c89','#9cb3a0'],road:'#d9d5c9',edge:['#a5afa5','#8c9c95']}
};
const PALETTES={
 sushi:{roof:'#526c67',wall:'#efe3c8',side:'#c4b89b',trim:'#6c4b40',shape:'gable'},
 morunShop:{roof:'#4776aa',wall:'#f4e5c7',side:'#c6c1b1',trim:'#3a69a1',shape:'gable'},
 tenant_diner:{roof:'#a55f45',wall:'#efe0c3',side:'#c4ad8c',trim:'#90513e',shape:'gable'},
 tenant_sweets:{roof:'#b9818c',wall:'#f6e4d7',side:'#d3b8ad',trim:'#9e6678',shape:'glass'},
 tenant_tea:{roof:'#6c8054',wall:'#e8e1c1',side:'#beb599',trim:'#536a43',shape:'gable'},
 tenant_character:{roof:'#d0ac58',wall:'#f5e8c8',side:'#cbb888',trim:'#659b94',shape:'flat'},
 kotsumaru:{roof:'#55764f',wall:'#f1dfbc',side:'#c4b796',trim:'#4b6948',shape:'gable'},
 bathhouse:{roof:'#537d82',wall:'#f0dfbf',side:'#c6b89b',trim:'#476c73',shape:'gable'},
 bakery:{roof:'#bf7650',wall:'#f4dfb6',side:'#d3b889',trim:'#865333',shape:'gable'},
 cafe:{roof:'#4e8177',wall:'#f0e2c6',side:'#cbbd98',trim:'#38685e',shape:'gable'},
 diner:{roof:'#657e8a',wall:'#f0e3cd',side:'#c7b99c',trim:'#a85545',shape:'gable'},
 toy:{roof:'#d8ac58',wall:'#f6e8bf',side:'#d4bf87',trim:'#bd776c',shape:'flat'},
 flower:{roof:'#80a298',wall:'#f1e7d3',side:'#c8c7a6',trim:'#64826b',shape:'glass'},
 clothes:{roof:'#8d7c9f',wall:'#efe5db',side:'#c4b7bd',trim:'#705b80',shape:'gable'},
 goods:{roof:'#7a9da8',wall:'#eee2c8',side:'#c6b99d',trim:'#5d7883',shape:'gable'},
 salon:{roof:'#668999',wall:'#f0e9d6',side:'#bcc2b4',trim:'#637c8b',shape:'tall'},
 sports:{roof:'#758d58',wall:'#e6e8ca',side:'#bbc0a0',trim:'#596d44',shape:'flat'},
 market:{roof:'#619185',wall:'#efe9d0',side:'#c1c4a5',trim:'#42746a',shape:'flat'},
 fishmonger:{roof:'#648ca1',wall:'#eee9d7',side:'#b8c7c4',trim:'#3e6f8b',shape:'gable'},
 greengrocer:{roof:'#7b9b59',wall:'#f1e4bf',side:'#c6c29a',trim:'#58773e',shape:'flat'},
 convenience:{roof:'#63a69e',wall:'#f5eedc',side:'#cbcebd',trim:'#417c75',shape:'flat'},
 diy:{roof:'#9e805b',wall:'#eadfc4',side:'#c6b594',trim:'#786444',shape:'gable'},
 hobby:{roof:'#668b9d',wall:'#ece7d5',side:'#bfcbc3',trim:'#4d7183',shape:'gable'},
 sportcenter:{roof:'#6d9c95',wall:'#eee9ce',side:'#b8c7b3',trim:'#4a7c73',shape:'flat'},
 gamecenter:{roof:'#9c80a1',wall:'#efe2d1',side:'#c5b7bc',trim:'#776082',shape:'flat'},
 karaoke:{roof:'#b67e69',wall:'#f2e3d3',side:'#d0bca7',trim:'#955f52',shape:'tall'},
 police:{roof:'#586f80',wall:'#e5e6d9',side:'#b6c1b7',trim:'#4e6e80',shape:'gable'},
 toilet:{roof:'#87a293',wall:'#eeeade',side:'#c3c9b7',trim:'#688c7b',shape:'gable'},
 vacant:{roof:'#96958a',wall:'#d5ccba',side:'#b5ac99',trim:'#8c8b7d',shape:'flat'}
};
class TownArt{
 constructor(town){this.t=town;this.c=town.ctx;}
 seasonPalette(){return SEASONS[E.season(this.t.state)];}
 snowy(){return (root.KEvents?.climate(this.t.state).type||this.t.state.events?.weather?.type)==='snow';}
 get u(){return this.t.tw/100;}
 p(x,y,z=0){return this.t.project(x,y,z);}
 poly(points,fill,stroke=null,width=1){const c=this.c;c.beginPath();points.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=width*this.u;c.stroke();}}
 line(points,color,width=1){const c=this.c;c.beginPath();points.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.strokeStyle=color;c.lineWidth=width*this.u;c.lineJoin='round';c.lineCap='round';c.stroke();c.lineCap='butt';}
 ellipse(x,y,rx,ry,fill){const c=this.c;c.fillStyle=fill;c.beginPath();c.ellipse(x,y,rx*this.u,ry*this.u,0,0,Math.PI*2);c.fill();}
 dot(x,y,r,color){this.ellipse(x,y,r,r,color);}
 label(text,x,y,size,color='#475e50'){const c=this.c;c.font=`600 ${size*this.u}px sans-serif`;c.fillStyle=color;c.textAlign='center';c.fillText(text,x,y);}
 entrance(){
  const s=this.t.state,id=s.entrance||'normal',profile=E.entranceProfile(s),u=this.u,c=this.c,luxury=id==='luxury',memorial=id==='memorial',top=luxury?106:memorial?98:88;
  const p=(x,y,z=0)=>this.p(x,y,z*u),block=(x,y,w,h,z0,z1,front,side,roof)=>{
   this.poly([p(x,y+h,z1),p(x+w,y+h,z1),p(x+w,y+h,z0),p(x,y+h,z0)],front);
   this.poly([p(x+w,y,z1),p(x+w,y+h,z1),p(x+w,y+h,z0),p(x+w,y,z0)],side);
   this.poly([p(x,y,z1),p(x+w,y,z1),p(x+w,y+h,z1),p(x,y+h,z1)],roof);
  };
  const line=(points,color,width=1)=>this.line(points,color,width),oval=(q,rx,ry,color)=>this.ellipse(q.x,q.y,rx,ry,color);
  const lantern=(y,z,color)=>{const q=p(-.38,y,z);line([p(-.38,y,z+17),p(-.38,y,z+7)],'#594d3d',1.5);oval(q,6,9,color);for(const dx of [-3,0,3])line([{x:q.x+dx*u,y:q.y-7*u},{x:q.x+dx*u,y:q.y+7*u}],'#f9e2b955',.8);line([{x:q.x-4*u,y:q.y-8*u},{x:q.x+4*u,y:q.y-8*u}],'#64513c',2);line([{x:q.x-4*u,y:q.y+8*u},{x:q.x+4*u,y:q.y+8*u}],'#64513c',2);};
  const planter=(y,flowers=false)=>{block(-.45,y,.32,.27,0,12,'#987053','#70533f','#c09a73');for(let j=0;j<5;j++){const q=p(-.32,y+.04+j*.04,14+j%2*3);oval(q,5,4,j%2?'#799d62':'#587e59');if(flowers)oval({x:q.x,y:q.y-3*u},2.6,2.2,j%2?'#e6b180':'#d48c9b');}};
  // Ground shadows and stone plinths give every entrance a physical footprint.
  this.poly([p(-.6,3.7),p(.22,3.7),p(.22,5.5),p(-.6,5.5)],'#52624a20');
  if(id==='normal'){
   for(const y of [3.89,4.35]){block(-.22,y,.11,.11,0,47,'#af9065','#806b4d','#dac5a0');block(-.28,y-.05,.23,.23,0,5,'#a9ad99','#818d7c','#d3d2be');}
   block(-.27,3.85,.17,.68,29,52,'#d8c39a','#957958','#ede0bd');
   for(const z of [32,48])line([p(-.28,3.88,z),p(-.28,4.49,z)],'#af9265',.6);
   const q=p(-.29,4.18,36);this.label('入口',q.x,q.y,12,'#4f6550');planter(5.05,true);return;
  }
  const stone=luxury||memorial,front=stone?'#e0d8bf':'#b58b5d',side=stone?'#aca78f':'#806141',cap=luxury?'#d8b86b':memorial?'#c7b47b':'#dcc69b';
  for(const y of [3.7,5.15]){
   block(-.22,y,.3,.3,0,7,'#b0b4a0','#87917e','#dedbc7');
   block(-.17,y+.05,.2,.2,7,top-12,front,side,cap);
   for(const z of [12,top-20])block(-.23,y-.01,.32,.32,z,z+4,cap,luxury?'#937947':'#8e7b56','#f0dfb5');
   if(stone){for(const dz of [23,42,61])line([p(-.171,y+.251,dz),p(.03,y+.251,dz)],'#a4a48d',.7);for(const dx of [-.11,-.04])line([p(dx,y+.252,20),p(dx,y+.252,top-22)],'#f7f0d7',1);}
   else for(const dx of [-.12,-.04])line([p(dx,y+.252,17),p(dx,y+.252,top-26)],'#e0bb7c66',.7);
   const nail=p(-.06,y+.255,top-25);oval(nail,1.4,1.4,luxury?'#e9ce87':'#62563f');
  }
  block(-.23,3.66,.34,1.84,top-18,top-3,profile.color,'#4e6156',cap);
  for(const z of [top-16,top-5])line([p(-.24,3.69,z),p(-.24,5.46,z)],cap,1.5);
  const center=p(-.26,4.58,top-10);
  // Each profile has a distinct roof or arch silhouette, not just a paint color.
  if(id==='dining'){
   this.poly([p(-.42,3.5,top),p(-.05,3.5,top+14),p(.3,3.5,top),p(.3,5.62,top),p(-.05,5.62,top+14),p(-.42,5.62,top)],'#a86749','#71503c',1);
   for(let y=3.54;y<5.64;y+=.14)line([p(-.42,y,top),p(-.05,y,top+14),p(.3,y,top)],'#dcac78',.7);
   line([p(-.05,3.48,top+14),p(-.05,5.65,top+14)],'#744b36',3);
   for(const y of [3.95,5.02])lantern(y,top-34,'#d38260');
   for(let i=0;i<7;i++)this.poly([p(-.24,3.96+i*.17,top-18),p(-.24,4.11+i*.17,top-18),p(-.24,4.11+i*.17,top-31),p(-.24,3.96+i*.17,top-31)],i%2?'#f1dab0':'#b3684e');
   planter(5.48);
  }else if(id==='daily'){
   block(-.32,3.57,.5,2.02,top-3,top+5,'#52785d','#375c4b','#8ca781');
   for(const y of [3.7,5.15]){for(let dz=19;dz<top-20;dz+=11)line([p(-.21,y-.01,dz),p(-.21,y+.31,dz)],'#6b8a61',1.5);}
   planter(3.37);planter(5.48);
   for(let i=0;i<6;i++){const q=p(-.33,4.05+i*.19,top+8);oval(q,5,3,i%2?'#8faa66':'#527f58');}
  }else if(id==='family'){
   const a=p(-.29,3.6,top-4),b=p(-.29,5.57,top-4);c.save();c.strokeStyle='#ddae63';c.lineWidth=10*u;c.lineCap='round';c.beginPath();c.moveTo(a.x,a.y);c.quadraticCurveTo((a.x+b.x)/2,(a.y+b.y)/2-30*u,b.x,b.y);c.stroke();c.strokeStyle='#f5d99d';c.lineWidth=3*u;c.stroke();c.restore();
   const colors=['#c87c78','#7faaa2','#dcb36d','#8c9eb7','#a0ad7d'];line([p(-.32,3.94,top-26),p(-.32,5.13,top-26)],'#847a5b',.8);
   for(let i=0;i<5;i++){const q=p(-.32,3.98+i*.23,top-26);this.poly([{x:q.x-4*u,y:q.y},{x:q.x+4*u,y:q.y},{x:q.x,y:q.y+10*u}],colors[i]);}
   planter(3.35,true);planter(5.49,true);
  }else if(id==='luxury'||memorial){
   const gold=luxury?'#d0a24d':'#d4be7f';
   this.poly([p(-.36,3.54,top),p(-.36,4.02,top+4),p(-.36,4.56,top+20),p(-.36,5.1,top+4),p(-.36,5.61,top)],gold,'#927f4e',1);
   line([p(-.37,3.6,top+1),p(-.37,4.56,top+16),p(-.37,5.55,top+1)],'#f8e9b4',1.2);
   for(const y of [3.38,5.65]){block(-.2,y,.12,.12,0,49,'#596b61','#3f5149',gold);const q=p(-.16,y+.06,57);oval(q,5,8,'#f4dda0');line([p(-.16,y+.06,49),p(-.16,y+.06,65)],'#b79b5a',1.4);oval(p(-.16,y+.06,66),4,2,gold);}
   if(luxury)for(const y of [3.75,5.19]){block(-.2,y,.25,.25,top-3,top+3,'#c6ae6f','#9a8148','#eed99e');oval(p(-.08,y+.12,top+8),4,5,'#d7bc75');}
   if(memorial){for(let i=0;i<9;i++){const q=p(-.37,3.97+i*.145,top+8+Math.sin(i/8*Math.PI)*8);oval(q,3,4,i%2?'#83a185':'#d7bc70');}planter(3.3,true);planter(5.6,true);}
  }else if(id==='mascot'){
   block(-.33,3.56,.49,2.04,top-3,top+5,'#567d62','#385b48','#a6bc8c');
   for(let i=0;i<9;i++)oval(p(-.34,3.65+i*.23,top-1),4,4,'#a3bb89');
   for(const y of [3.98,5.09]){const q=p(-.35,y,top-31);oval(q,5,5,'#c0a26b');oval({x:q.x-2*u,y:q.y-4*u},2,2,'#c0a26b');oval({x:q.x+2*u,y:q.y-4*u},2,2,'#c0a26b');}
   planter(3.37,true);planter(5.5,true);
  }
  // A layered enamel sign remains legible at the game's ordinary zoom.
  oval(center,luxury?23:21,13,cap);oval(center,luxury?20:18,10,luxury?'#3d6157':'#fff4d8');
  this.label(profile.mark,center.x,center.y+4*u,12,luxury?'#f0d391':profile.color);
  if((id==='mascot'&&E.mascotActive(s)||memorial)&&root.KMascot){
   const q=p(-.27,memorial?4.19:4.58,top+7);root.KMascot.draw(c,q.x,q.y,memorial?1.05*u:1.4*u,0,'wave',1);
   if(memorial){const z=p(-.27,4.93,top+7);root.KMascot.drawMorun(c,z.x,z.y,1.05*u,0,'wave',-1);}
  }
  if(this.snowy())line([p(-.3,3.58,top+6),p(-.3,5.57,top+6)],'#edf3ed',3);
 }
 bodyHeight(b){return (b.type==='salon'||b.type==='karaoke'?59:b.type==='sportcenter'?54:b.type==='convenience'?37:b.type==='market'?43:45)+(Math.max(1,b.level||1)-1)*4;}
height(b){if(b.type==='castleLantern')return 92;if(b.type==='castleKoiPond')return 23;if(b.type==='kotsumaruCastle'&&!b.build)return 340;if(['castleWall','castleStone'].includes(b.type))return b.type==='castleWall'?55:42;if(b.type==='castlePine')return 76;if(b.type==='castleAzumaya')return 98;if(b.type==='bridge')return 34;if(E.isRoad(b))return 0;if(b.build)return 65;if(b.type==='morunShop')return this.bodyHeight(b)+34;if(b.type==='circus')return 113;if(b.type==='bathhouse')return 110+(Math.max(1,b.level||1)-1)*4;if(b.type==='eventStage')return 85;if(b.type==='flowerbed')return 26;if(b.type==='paidParking'||b.type==='paidBicycle')return 38;if(b.type==='terrace')return 52;if(b.type==='stream')return 10;if(b.type==='bridge')return 34;if(b.type==='japaneseGarden')return 57;if(b.type==='shrine')return 60;if(b.type==='tower')return 260;if(['bench','parking','plaza','grandpark','bicycle'].includes(b.type))return 43;if(b.type==='arcade')return 55;const shape=PALETTES[b.type]?.shape;return this.bodyHeight(b)+(b.type==='sushi'?26:['bakery','kotsumaru'].includes(b.type)?22:shape==='gable'||shape==='tall'?17:shape==='glass'?13:shape==='flat'?8:6);}
 face(b,side,paint){const normals={front:[0,1],right:[1,0],back:[0,-1],left:[-1,0]},n=normals[side],o=E.toWorld(b,0,0),v=E.toWorld(b,...n);if(v[0]-o[0]+v[1]-o[1]<=0)return;const c=this.c,f=E.F(b.type),z=this.bodyHeight(b),x=b.x+.1,y=b.y+.1,w=f.w-.2,h=f.h-.2,edges={front:[[x,y+h],[x+w,y+h]],right:[[x+w,y],[x+w,y+h]],back:[[x,y],[x+w,y]],left:[[x,y],[x,y+h]]};let [a,d]=edges[side].map(([x,y])=>this.p(x,y,z*this.u));if(a.x>d.x)[a,d]=[d,a];c.save();c.transform((d.x-a.x)/100,(d.y-a.y)/100,0,this.u,a.x,a.y);paint(c,z);c.restore();}
 window(c,x,y,w,h,lit,frame='#7f8974'){
  c.fillStyle=frame;c.fillRect(x-1,y-1,w+2,h+2);c.fillStyle=lit?'#f7dfa0':'#88aaa3';c.fillRect(x,y,w,h);c.fillStyle=lit?'#fff0c1':'#c5ded0';c.beginPath();c.moveTo(x+2,y+2);c.lineTo(x+w*.7,y+2);c.lineTo(x+2,y+h*.7);c.fill();c.strokeStyle=frame;c.lineWidth=1.6;c.beginPath();c.moveTo(x+w/2,y);c.lineTo(x+w/2,y+h);c.stroke();
 }
 sign(c,text,color,y=3){c.fillStyle='#f9edce';c.fillRect(6,y,88,10);c.strokeStyle=color;c.lineWidth=1;c.strokeRect(6,y,88,10);c.fillStyle=color;c.font='bold 9px sans-serif';c.textAlign='center';c.fillText(text,50,y+7.5);}
 awning(b,color,cream='#f2e2b9'){
  const f=E.F(b.type),z=(this.bodyHeight(b)-13)*this.u,x=b.x+.07,y=b.y+f.h-.1;
  for(let i=0;i<8;i++){const a=i/8*(f.w-.14),w=(f.w-.14)/8;this.poly([this.p(x+a,y,z),this.p(x+a+w,y,z),this.p(x+a+w,y+.13,z-4*this.u),this.p(x+a,y+.13,z-4*this.u)],i%2?cream:color);this.poly([this.p(x+a,y+.13,z-4*this.u),this.p(x+a+w,y+.13,z-4*this.u),this.p(x+a+w,y+.13,z-8*this.u),this.p(x+a,y+.13,z-8*this.u)],i%2?cream:color);}
 }
 roof(b,palette){const f=E.F(b.type),z=this.bodyHeight(b)*this.u,x=b.x+.055,y=b.y+.055,w=f.w-.11,h=f.h-.11;
  if(b.type==='sushi'){
   const u=this.u,p=(dx,dy,dz)=>this.p(b.x+dx,b.y+dy,z+dz*u),a=p(.025,.035,0),d=p(f.w-.025,.035,0),frontA=p(.025,.965,1),frontB=p(f.w-.025,.965,1),ridgeA=p(.025,.44,20),ridgeB=p(f.w-.025,.44,20);
   this.poly([a,d,ridgeB,ridgeA],'#58655e','#424e49',1);this.poly([ridgeA,ridgeB,frontB,frontA],'#68756b','#46574f',1);
   this.poly([d,ridgeB,frontB],'#d5c5a4','#6a6551',1);this.line([p(f.w-.025,.08,1),p(f.w-.025,.44,17),p(f.w-.025,.92,1)],'#8d8061',1.5);
   for(let i=1;i<20;i++){const dx=.025+(f.w-.05)*i/20;this.line([p(dx,.035,0),p(dx,.44,20),p(dx,.965,1)],'#93a08e',1);}
   for(const q of [.25,.5,.75]){this.line([p(.025,.44+.525*q,20-19*q),p(f.w-.025,.44+.525*q,20-19*q)],'#4b5d52',1);this.line([p(.025,.035+.405*q,20*q),p(f.w-.025,.035+.405*q,20*q)],'#7b887b',.7);}
   this.line([frontA,p(f.w/2,.965,-1),frontB],'#47584d',4);this.line([ridgeA,ridgeB],'#3f5148',4);this.line([p(.025,.44,22),p(f.w-.025,.44,22)],'#a2aa94',1.3);
   for(const dx of [.025,f.w-.025]){const q=p(dx,.44,22);this.ellipse(q.x,q.y,3,2,'#64786a');}
   if(this.snowy())this.poly([p(.08,.87,5),p(f.w-.1,.87,5),p(f.w-.12,.46,21),p(.1,.46,21)],'#e7e9d9');
   return;
  }
  if(['gable','tall','glass'].includes(palette.shape)){
   const lift=(palette.shape==='glass'?13:17)*this.u,frontA=this.p(x,y+h,z),frontB=this.p(x+w,y+h,z),backA=this.p(x,y,z),backB=this.p(x+w,y,z),ridgeA=this.p(x,y+h*.47,z+lift),ridgeB=this.p(x+w,y+h*.47,z+lift);
   this.poly([backA,backB,ridgeB,ridgeA],palette.shape==='glass'?'#bed5c8':palette.roof,'#59715835');this.poly([ridgeA,ridgeB,frontB,frontA],palette.shape==='glass'?'#a7c7bb':palette.roof,'#53655045');
   this.poly([backB,ridgeB,frontB],palette.side,'#65735f35');this.line([ridgeA,ridgeB],'#efe3c15c',2.5);
   for(let i=1;i<Math.ceil(w*7);i++){const dx=w*i/Math.ceil(w*7);this.line([this.p(x+dx,y,z),this.p(x+dx,y+h*.47,z+lift),this.p(x+dx,y+h,z)],palette.shape==='glass'?'#6d9689':'#694f3f30',palette.shape==='glass'?1.6:.7);}
   for(const v of [.25,.55,.8]){const yy=y+h*(.47+.53*v),zz=z+lift*(1-v);this.line([this.p(x,yy,zz),this.p(x+w,yy,zz)],palette.shape==='glass'?'#e1eee1a0':'#e8ca9d35',1);}
  }else{const top=z+4*this.u;this.poly([this.p(x,y+h,top),this.p(x+w,y+h,top),this.p(x+w,y+h,z),this.p(x,y+h,z)],palette.trim);this.poly([this.p(x+w,y,top),this.p(x+w,y+h,top),this.p(x+w,y+h,z),this.p(x+w,y,z)],palette.trim);this.poly([this.p(x,y,top),this.p(x+w,y,top),this.p(x+w,y+h,top),this.p(x,y+h,top)],palette.roof);this.line([this.p(x,y+h,z+5*this.u),this.p(x+w,y+h,z+5*this.u),this.p(x+w,y,z+5*this.u)],'#eee3c07a',2.5);
   if(b.type==='market'||b.type==='sports'){this.poly([this.p(x+w*.25,y+h*.25,z+8*this.u),this.p(x+w*.53,y+h*.25,z+8*this.u),this.p(x+w*.53,y+h*.5,z+8*this.u),this.p(x+w*.25,y+h*.5,z+8*this.u)],'#b9d0c3','#e2e8d0',2);}
  }
  if(b.type==='sportcenter'){const zz=z+6*this.u;this.poly([this.p(x+.2,y+.2,zz),this.p(x+w-.2,y+.2,zz),this.p(x+w-.2,y+h-.2,zz),this.p(x+.2,y+h-.2,zz)],'#b5c7a1','#e9e8ca',1.3);this.line([this.p(x+w/2,y+.2,zz),this.p(x+w/2,y+h-.2,zz)],'#f3edcf',1.6);const p=this.p(x+w/2,y+h/2,zz);this.ellipse(p.x,p.y,12,6,'#d2d7b6');this.line([this.p(x+.3,y+.3,zz),this.p(x+.3,y+h-.3,zz)],'#f3edcf',1);}
  if(this.snowy()&&b.type!=='convenience'){const a=this.p(x+w*.1,y+h*.7,z+4*this.u);this.ellipse(a.x,a.y,13,3,'#fff9e1a0');}
 }
 pot(x,y,color,size=1){const p=this.p(x,y),u=this.u;this.poly([{x:p.x-4*u*size,y:p.y-6*u*size},{x:p.x+4*u*size,y:p.y-6*u*size},{x:p.x+3*u*size,y:p.y+1*u},{x:p.x-3*u*size,y:p.y+1*u}],'#b68560');this.line([{x:p.x,y:p.y-5*u},{x:p.x,y:p.y-17*u*size}],'#779262',1.5);for(let i=0;i<5;i++)this.dot(p.x+Math.cos(i*1.256)*4*u*size,p.y-16*u*size+Math.sin(i*1.256)*3*u*size,3*size,color);this.dot(p.x,p.y-16*u*size,1.7,'#edcc77');}
 loaf(c,x,y,scale=1){c.fillStyle='#c38a51';c.beginPath();c.ellipse(x,y,8*scale,4.5*scale,-.15,0,7);c.fill();c.strokeStyle='#fae0ad';c.lineWidth=1.3;for(let i=-1;i<=1;i++){c.beginPath();c.moveTo(x+i*4*scale,y-3*scale);c.lineTo(x+(i-1)*4*scale,y+1*scale);c.stroke();}}
 streetBoard(x,y,color,text){const p=this.p(x,y),u=this.u;this.line([{x:p.x-6*u,y:p.y},{x:p.x-4*u,y:p.y-21*u},{x:p.x+5*u,y:p.y-19*u},{x:p.x+7*u,y:p.y+2*u}],'#9a7a54',2);this.poly([{x:p.x-4*u,y:p.y-20*u},{x:p.x+5*u,y:p.y-18*u},{x:p.x+5*u,y:p.y-3*u},{x:p.x-4*u,y:p.y-5*u}],color);this.label(text,p.x,p.y-9*u,7,'#f7efd5');}
 table(x,y,parasol=false){const p=this.p(x,y),u=this.u;this.line([{x:p.x,y:p.y-12*u},{x:p.x,y:p.y}], '#9b8160',2);this.ellipse(p.x,p.y-13*u,11,5,'#bf9a70');for(const dx of [-16,16]){this.ellipse(p.x+dx*u,p.y-4*u,5,2.5,'#708e75');this.line([{x:p.x+dx*u,y:p.y-3*u},{x:p.x+dx*u,y:p.y+2*u}],'#8e8064',1.3);}this.dot(p.x,p.y-15*u,2,'#f6edcf');if(parasol){this.line([{x:p.x,y:p.y-13*u},{x:p.x,y:p.y-43*u}],'#b6a27f',1.5);this.poly([{x:p.x-20*u,y:p.y-38*u},{x:p.x,y:p.y-49*u},{x:p.x+20*u,y:p.y-38*u},{x:p.x,y:p.y-31*u}],'#d1bc84','#b4a473');}}
 crate(x,y,color){const p=this.p(x,y),u=this.u;this.t.box(x,y,.25,.21,6*u,'#c6a16c','#b68d5c','#9e7b53');for(let i=0;i<6;i++)this.dot(p.x+(i%3-1)*4*u,p.y-7*u+Math.floor(i/3)*3*u,2.8,color);}
 building(b,t,layer='all'){if(!b.build&&['castleWall','castleStone'].includes(b.type)){this.castleBoundary(b);return;}const original=this.t,r=E.rotation(b);if(!r){this.buildingLocal(b,t,layer);return;}const virtual=Object.create(original);virtual.project=(x,y,z=0)=>original.project(...E.toWorld(b,x-b.x,y-b.y),z);virtual.box=(x,y,w,h,z,top,left,right)=>{const points=[[x,y],[x+w,y],[x+w,y+h],[x,y+h]].map(([a,c])=>E.toWorld(b,a-b.x,c-b.y)),xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);original.box(Math.min(...xs),Math.min(...ys),Math.max(...xs)-Math.min(...xs),Math.max(...ys)-Math.min(...ys),z,top,left,right);};virtual.diamond=(x,y,w,h,fill,z=0)=>this.poly([[x,y],[x+w,y],[x+w,y+h],[x,y+h]].map(([a,c])=>virtual.project(a,c,z)),fill,'#4d654214');this.t=virtual;try{this.buildingLocal(b,t,layer);}finally{this.t=original;}}
 buildingLocal(b,t,layer='all'){const f=E.F(b.type),u=this.u,c=this.c,op=f.tenant?Boolean(root.KTenants?.active(this.t.state)):E.operational(this.t.state,b,this.t.net),palette={...(PALETTES[b.type]||PALETTES.vacant)};
  if(this.t.selection===b.id)this.t.diamond(b.x,b.y,f.w,f.h,'#e7cd7c');
  if(E.isRoad(b)&&b.type!=='bridge')return;
  const center=this.p(b.x+f.w*.55,b.y+f.h*.55);if(!['stream','bridge'].includes(b.type))this.ellipse(center.x+7*u,center.y+6*u,24*f.w,10*f.h,'#40593d1c');
  if(b.build){this.construction(b);return;}
  if(b.type==='circus'){this.circus(b,op);return;}
  if(!PALETTES[b.type]){this.publicBuilding(b,t,layer);return;}
  if(b.legacy){palette.roof='#aa8e70';palette.wall='#dfcdaa';palette.side='#baa88d';palette.trim='#967855';}
  const z=this.bodyHeight(b)*u;this.t.box(b.x+.1,b.y+.1,f.w-.2,f.h-.2,z,palette.roof,palette.wall,palette.side);
  this.face(b,'right',(c,h)=>{if(['kotsumaru','morunShop'].includes(b.type)&&!b.closed){this.sign(c,'オリジナルグッズ',palette.trim);this.goodsWindow(c,h,b,palette,op,true);return;}for(const x of [16,60])this.window(c,x,h*.45,22,h*.32,false,'#9ba08a');c.fillStyle='#b5ac9270';c.fillRect(0,h-5,100,5);});
  for(const side of ['back','left'])this.face(b,side,(c,h)=>{for(const x of [16,60])this.window(c,x,h*.45,22,h*.32,false,'#9ba08a');c.fillStyle=palette.trim;c.fillRect(0,h-4,100,4);});
  this.face(b,'front',(c,h)=>{
   c.fillStyle=palette.trim;c.fillRect(0,h-4,100,4);this.sign(c,b.type==='vacant'?'空き店舗':b.type==='bathhouse'?'まちの湯':f.name,palette.trim);
   if(b.type==='vacant'||b.closed){c.fillStyle='#a6a494';c.fillRect(9,16,82,h-20);c.strokeStyle='#858a7c';c.lineWidth=1;for(let yy=19;yy<h-3;yy+=4){c.beginPath();c.moveTo(10,yy);c.lineTo(90,yy);c.stroke();}if(b.type==='vacant'){c.fillStyle='#e7d9b9';c.fillRect(35,23,28,12);c.font='8px sans-serif';c.fillStyle='#8b7a65';c.fillText('募集中',49,32);}return;}
   if(b.type==='sushi'){
    c.fillStyle='#e8dcc0';c.fillRect(0,0,100,h);c.fillStyle='#725c45';c.fillRect(0,h-10,100,10);
    for(const xx of [3,47,94]){c.fillStyle='#8b7352';c.fillRect(xx,0,2,h);}
    c.fillStyle='#b99968';c.fillRect(9,2,80,9);c.strokeStyle='#866b45';c.lineWidth=.8;c.strokeRect(9,2,80,9);c.fillStyle='#514b3b';c.font='bold 8px serif';c.textAlign='center';c.fillText('寿 司',49,9);
    c.fillStyle=op?'#dec999':'#9aa38c';c.fillRect(8,16,35,h-27);c.fillStyle='#785e43';
    for(let xx=8;xx<=43;xx+=5)c.fillRect(xx,15,1,h-25);for(const yy of [16,h-14])c.fillRect(8,yy,35,1.4);
    c.fillStyle='#6c5b45';c.fillRect(53,14,37,h-17);c.fillStyle=op?'#ead6ac':'#adb4a0';c.fillRect(56,17,31,h-23);c.fillStyle='#8c7859';for(const xx of [57,65,73,81,87])c.fillRect(xx,17,1,h-23);c.fillRect(56,h-13,31,1);
    for(let i=0;i<4;i++){c.fillStyle=i%2?'#3e625c':'#466d64';c.fillRect(52+i*9.5,14,9,13);c.fillStyle='#759184';c.fillRect(53+i*9.5,15,1,10);}c.fillStyle='#f0e6cb';c.font='bold 9px serif';c.fillText('鮨',71,24);
    c.fillStyle='#c5aa78';c.fillRect(12,h-20,26,2);for(let i=0;i<3;i++){c.fillStyle='#f3e9cf';c.fillRect(14+i*8,h-24,6,3);c.fillStyle=['#bc7763','#cead62','#81926d'][i];c.fillRect(13+i*8,h-25,7,2);}
    return;
   }
   if(['kotsumaru','morunShop'].includes(b.type)){this.goodsWindow(c,h,b,palette,op);return;}
   this.window(c,8,17,48,h-23,op&&b.type==='convenience',palette.trim);this.window(c,65,17,25,h-20,op&&b.type==='convenience',palette.trim);
   c.fillStyle='#f5e4b7';c.fillRect(84,h*.65,2,3);
   if(b.type==='bakery'){for(let i=0;i<3;i++)this.loaf(c,17+i*15,h-13,.78);c.fillStyle='#bc925e';c.fillRect(8,h-8,48,3);}
   if(b.type==='fishmonger'){c.fillStyle='#a8c4cb';c.fillRect(8,h-20,48,14);c.fillStyle='#e1eff0';c.fillRect(10,h-18,44,9);for(const x of [19,40]){c.fillStyle='#6b91a4';c.beginPath();c.ellipse(x,h-13,8,3,0,0,Math.PI*2);c.fill();c.beginPath();c.moveTo(x+5,h-13);c.lineTo(x+12,h-17);c.lineTo(x+12,h-9);c.closePath();c.fill();c.fillStyle='#354e60';c.fillRect(x-5,h-14,1.5,1.5);}}
   if(b.type==='greengrocer'){c.fillStyle='#b29665';c.fillRect(8,h-20,48,14);for(let i=0;i<8;i++){c.fillStyle=['#80a453','#cc7852','#dfb54e','#adc276'][i%4];c.beginPath();c.ellipse(15+i%4*11,h-15+Math.floor(i/4)*6,4.5,3.5,0,0,Math.PI*2);c.fill();}}
   if(b.type==='toy'){for(let i=0;i<6;i++){c.fillStyle=['#d08b77','#dfbd61','#8caaa2'][i%3];c.fillRect(11+i%3*14,22+Math.floor(i/3)*8,10,6);}}
   if(b.type==='clothes'){for(const x of [21,42]){c.fillStyle=x===21?'#b18eab':'#ddbd91';c.beginPath();c.moveTo(x-4,22);c.lineTo(x-9,h-9);c.lineTo(x+8,h-9);c.lineTo(x+4,22);c.fill();c.strokeStyle='#987d72';c.lineWidth=1;c.beginPath();c.moveTo(x,18);c.lineTo(x,22);c.stroke();}}
   if(b.type==='goods'){c.fillStyle='#b89d77';for(const yy of [27,h-10]){c.fillRect(9,yy,45,2);for(let i=0;i<4;i++){c.fillStyle=['#bd976b','#9fb1a1','#d1b394'][i%3];c.beginPath();c.ellipse(15+i*10,yy-4,3.2,4,0,0,7);c.fill();}}}
   if(b.type==='salon'){this.window(c,8,16,47,h-24,false,'#c9c6ae');c.fillStyle='#d9e6d7';c.beginPath();c.ellipse(32,29,13,11,0,0,7);c.fill();c.strokeStyle='#b9ae8c';c.lineWidth=2;c.stroke();c.fillStyle='#997d68';c.fillRect(23,h-15,20,7);}
   if(b.type==='sports'){for(const x of [20,42]){c.fillStyle=x===20?'#bf835d':'#e1d6a4';c.beginPath();c.arc(x,h-16,7,0,7);c.fill();c.strokeStyle='#6d785a';c.lineWidth=1;c.stroke();}c.fillStyle='#b9c5a5';c.fillRect(64,18,26,4);}
   if(b.type==='diy'){c.fillStyle='#b79b70';c.fillRect(9,19,45,h-25);c.strokeStyle='#6c796e';c.lineWidth=2.5;for(const xx of [17,31,45]){c.beginPath();c.moveTo(xx,23);c.lineTo(xx,h-10);c.stroke();c.fillStyle='#d9c5a0';c.fillRect(xx-4,22,8,4);}c.fillStyle='#a88557';c.fillRect(8,h-8,48,3);}
   if(b.type==='hobby'){for(const yy of [29,h-9]){c.fillStyle='#c5aa7d';c.fillRect(9,yy,46,2);c.fillStyle=yy===29?'#ba8465':'#839e91';c.fillRect(13,yy-7,35,5);for(const xx of [18,29,40]){c.fillStyle='#e9d7b2';c.fillRect(xx,yy-6,5,3);}c.fillStyle='#637a76';for(const xx of [19,39]){c.beginPath();c.arc(xx,yy,2.5,0,7);c.fill();}}}
   if(b.type==='sportcenter'){this.window(c,8,17,48,h-23,false,palette.trim);c.strokeStyle='#e9e3c7';c.lineWidth=2;for(const xx of [19,31,43]){c.beginPath();c.moveTo(xx,18);c.lineTo(xx,h-7);c.stroke();}c.fillStyle='#b98459';c.beginPath();c.arc(78,29,6,0,7);c.fill();}
   if(b.type==='gamecenter'){for(const xx of [12,27,42]){c.fillStyle='#776c88';c.fillRect(xx,21,11,h-27);c.fillStyle='#b5d4c3';c.fillRect(xx+2,23,7,7);c.fillStyle='#e0b76b';c.fillRect(xx+2,32,7,3);c.fillStyle='#c195a9';c.fillRect(xx+2,36,7,h-41);}}
   if(b.type==='karaoke'){for(const xx of [18,37]){c.fillStyle='#b6938c';c.fillRect(xx,21,13,h-29);c.fillStyle='#f4dca9';c.fillRect(xx+3,26,7,13);}c.strokeStyle='#edd6b3';c.lineWidth=2;for(const xx of [66,83]){c.beginPath();c.moveTo(xx,24);c.lineTo(xx,h-9);c.stroke();}c.fillStyle='#e1c398';c.fillRect(64,21,24,3);}
   if(b.type==='market'||b.type==='convenience'){c.strokeStyle='#f0e5bd';c.lineWidth=2;for(let x=13;x<54;x+=10){c.beginPath();c.moveTo(x,18);c.lineTo(x,h-6);c.stroke();}}
   if(b.type==='bathhouse'){c.fillStyle='#d7bf92';c.fillRect(6,h-10,88,6);for(const x of [65,73,81]){c.fillStyle=palette.trim;c.fillRect(x,17,7,16);}c.fillStyle='#f5ecd5';c.font='bold 11px sans-serif';c.fillText('湯',77,29);c.strokeStyle='#b5d2cc';c.lineWidth=2;for(const y of [24,29]){c.beginPath();c.moveTo(13,y);c.bezierCurveTo(22,y-5,35,y+5,49,y);c.stroke();}}
   if(b.type==='diner'){for(let i=0;i<4;i++){c.fillStyle='#b96550';c.fillRect(61+i*8,15,7,12);}c.fillStyle='#f7dbab';c.font='bold 9px sans-serif';c.fillText('食',77,24);}
   if(b.type==='police'){c.fillStyle='#c8ad60';c.beginPath();for(let i=0;i<5;i++){const a=i*Math.PI*2/5-Math.PI/2;c.lineTo(49+Math.cos(a)*5,8+Math.sin(a)*5);}c.fill();}
   if(b.type==='toilet'){c.fillStyle='#87a7a5';c.fillRect(12,17,30,h-21);c.fillStyle='#b59588';c.fillRect(57,17,30,h-21);}
  });
  if(b.type==='sushi')for(const side of ['right','back','left'])this.face(b,side,(c,h)=>{c.fillStyle='#e4d7b8';c.fillRect(0,0,100,h);c.fillStyle='#7c684c';c.fillRect(0,h-14,100,14);for(const xx of [3,48,94])c.fillRect(xx,0,2,h);c.fillStyle='#a8b4a0';c.fillRect(17,12,65,h-29);c.fillStyle='#79684f';for(let xx=17;xx<83;xx+=8)c.fillRect(xx,11,1.5,h-27);for(const yy of [12,h-18])c.fillRect(17,yy,65,1.5);});
  this.roof(b,palette);
  if(b.type==='bathhouse'){
   this.t.box(b.x+.3,b.y+.25,.16,.16,z+35*u,'#bcaa8a','#ab9779','#927f66');
   if(op)for(let i=0;i<3;i++){const p=this.p(b.x+.38+i*.08,b.y+.33,z+(37+i*5)*u),drift=Math.sin(t/1300+i)*2*u;
    this.line([{x:p.x,y:p.y},{x:p.x+drift-3*u,y:p.y-8*u},{x:p.x+drift+2*u,y:p.y-16*u}],'#f7f3e5bb',2.5);}
  }
  if(!b.closed&&b.type!=='vacant'&&[0,3].includes(E.rotation(b)))this.shopProps(b,palette,op,t);
  if(b.legacy){for(let i=0;i<3;i++){const p=this.p(b.x+.15+i*.2,b.y+f.h-.1,8*u);this.line([{x:p.x,y:p.y-10*u},{x:p.x-2*u,y:p.y-5*u},{x:p.x+2*u,y:p.y}], '#9a8c6b70',.8);}}
  if(b.level>=2){const p=this.p(b.x+f.w-.04,b.y+f.h-.06,18*u);this.pot(b.x+f.w-.13,b.y+f.h-.05,'#cb9b83',.7);for(let i=0;i<b.level-1;i++)this.dot(p.x+i*5*u,p.y,2.2,'#d8b15c');}
  if(b.reputation>=6){const p=this.p(b.x+.12,b.y+.12,this.height(b)*u);this.line([p,{x:p.x,y:p.y-12*u}],'#a38a55',1);this.poly([{x:p.x,y:p.y-12*u},{x:p.x+12*u,y:p.y-10*u},{x:p.x,y:p.y-4*u}],'#d8b765');}
 }
 goodsMascot(c,x,y,k,morun){
  c.save();c.translate(x,y);c.scale(k,k);c.fillStyle=morun?'#eaaa53':'#b88a5d';c.beginPath();c.ellipse(0,4,5,6,0,0,7);c.fill();c.fillStyle=morun?'#4b7fb2':'#587d52';c.fillRect(-4,3,8,5);
  c.fillStyle=morun?'#eaaa53':'#b88a5d';c.beginPath();if(morun){c.moveTo(-7,-4);c.lineTo(-7,-13);c.lineTo(-1,-8);c.lineTo(7,-13);c.lineTo(7,-4);}else{c.arc(-5,-8,3,0,7);c.arc(5,-8,3,0,7);}c.fill();c.beginPath();c.ellipse(0,-4,8,6,0,0,7);c.fill();
  if(!morun){c.fillStyle='#71523c';for(const a of [-3,3]){c.beginPath();c.ellipse(a,-4,2.8,3,0,0,7);c.fill();}c.fillStyle='#f2e2be';c.fillRect(-6,-8,12,1.5);}
  c.fillStyle='#f7e6c6';c.beginPath();c.ellipse(0,-.5,4.5,2.5,0,0,7);c.fill();c.fillStyle='#3e4438';for(const a of [-3,3]){c.beginPath();c.arc(a,-4,1,0,7);c.fill();}c.beginPath();c.arc(0,-1.2,1.2,0,7);c.fill();c.restore();
 }
 goodsWindow(c,h,b,palette,op,side=false){
  const morun=b.type==='morunShop',trim=palette.trim;
  c.fillStyle=trim;c.fillRect(5,16,57,h-20);c.fillStyle=op?'#f2dfb3':'#c1c7b3';c.fillRect(7,18,53,h-24);
  c.fillStyle='#a78b65';for(const yy of [h-17,h-6])c.fillRect(7,yy,53,2);
  for(const [xx,k]of [[16,.57],[33,.68],[50,.57]])this.goodsMascot(c,xx,h-23,k,morun);
  for(let i=0;i<3;i++){const xx=11+i*17;c.fillStyle=['#e3bc85',trim,'#d5a8a0'][i];c.fillRect(xx,h-14,11,7);c.fillStyle='#fff0cc';c.fillRect(xx+4,h-14,2,7);c.fillRect(xx,h-11,11,1);}
  c.strokeStyle='#fff7de';c.lineWidth=.65;c.beginPath();c.moveTo(9,19);c.lineTo(9,h-7);c.moveTo(11,19);c.lineTo(23,19);c.stroke();
  c.fillStyle=trim;c.fillRect(67,16,26,h-18);c.fillStyle=op?'#b9d2c5':'#99aca0';c.fillRect(69,18,22,h-22);c.fillStyle='#fff0ce';c.fillRect(72,22,16,10);c.fillStyle=trim;c.font='bold 5px sans-serif';c.textAlign='center';c.fillText(side?'GOODS':'OPEN',80,29);c.fillStyle='#e4c187';c.fillRect(88,h-12,2,4);
 }
 shopProps(b,palette,op,t){const f=E.F(b.type),u=this.u,c=this.c,z=this.bodyHeight(b)*u;
  if(['bakery','cafe','flower','clothes','goods','kotsumaru','morunShop','fishmonger','greengrocer'].includes(b.type))this.awning(b,palette.trim);
  if(b.type==='kotsumaru'){
   const p=this.p(b.x+.5,b.y+.5,z+8*u);for(const side of [-1,1]){this.ellipse(p.x+side*9*u,p.y-12*u,5,5,'#9b714b');this.ellipse(p.x+side*9*u,p.y-12*u,2.5,2.5,'#ddc59a');}
   this.ellipse(p.x,p.y,15,12,'#b78a59');for(const side of [-1,1]){this.ellipse(p.x+side*6*u,p.y,4.5,5,'#71533b');this.dot(p.x+side*6*u,p.y,1.4,'#263a2c');}
   this.ellipse(p.x,p.y+6*u,7,4.5,'#f0ddb2');this.dot(p.x,p.y+4*u,1.7,'#4e4032');this.line([{x:p.x-12*u,y:p.y-7*u},{x:p.x,y:p.y-9*u},{x:p.x+12*u,y:p.y-7*u}],'#f4e6c8',3);this.streetBoard(b.x+.1,b.y+f.h-.05,palette.trim,'こつ');
  }
  if(b.type==='morunShop'){const p=this.p(b.x+.68,b.y+.53,z+15*u);this.poly([{x:p.x-11*u,y:p.y-3*u},{x:p.x-11*u,y:p.y-17*u},{x:p.x-2*u,y:p.y-8*u}],'#e69b44');this.poly([{x:p.x+11*u,y:p.y-3*u},{x:p.x+11*u,y:p.y-17*u},{x:p.x+2*u,y:p.y-8*u}],'#e69b44');this.ellipse(p.x,p.y,13,10,'#eea84d');this.poly([{x:p.x-13*u,y:p.y},{x:p.x,y:p.y+3*u},{x:p.x+13*u,y:p.y},{x:p.x+7*u,y:p.y+9*u},{x:p.x-7*u,y:p.y+9*u}],'#fff0d2');for(const dx of [-4,4])this.dot(p.x+dx*u,p.y-1*u,1.4,'#594334');this.dot(p.x,p.y+4*u,1.8,'#594334');this.streetBoard(b.x+.12,b.y+f.h-.05,'#4776aa','モル');this.pot(b.x+f.w-.14,b.y+f.h-.08,'#eea84d',.85);}
  if(['kotsumaru','morunShop'].includes(b.type)){
   this.t.box(b.x+.35,b.y+f.h-.18,.53,.14,8*u,'#e5c89b',palette.trim,'#987e59');
   for(let i=0;i<3;i++){const q=this.p(b.x+.43+i*.17,b.y+f.h-.12,12*u);this.goodsMascot(c,q.x,q.y,.40*u,b.type==='morunShop');}
   const q=this.p(b.x+f.w-.22,b.y+f.h-.07,4*u);this.line([{x:q.x,y:q.y},{x:q.x,y:q.y-31*u}],palette.trim,1.4);this.poly([{x:q.x,y:q.y-30*u},{x:q.x+9*u,y:q.y-27*u},{x:q.x+9*u,y:q.y-12*u},{x:q.x,y:q.y-15*u}],palette.trim);this.label('グッズ',q.x+4*u,q.y-20*u,4.5,'#fff2ce');
  }
  if(b.type==='bakery'){this.t.box(b.x+.15,b.y+.16,.14,.14,z+22*u,'#bd8968','#a57253','#8c654b');const p=this.p(b.x+.68,b.y+f.h-.04,z-11*u);this.ellipse(p.x,p.y,12,7,'#efc181');for(let i=-1;i<=1;i++)this.line([{x:p.x+i*5*u,y:p.y-4*u},{x:p.x+(i-1)*5*u,y:p.y+2*u}],'#bc8b53',1.2);this.streetBoard(b.x+.12,b.y+f.h-.04,'#59755b','焼');}
  if(b.type==='fishmonger'){this.streetBoard(b.x+.12,b.y+f.h-.05,palette.trim,'鮮');this.t.box(b.x+.42,b.y+f.h-.22,.38,.16,9*u,'#d9e7e4','#93b2bc','#799ba7');}
  if(b.type==='greengrocer'){for(let i=0;i<3;i++)this.crate(b.x+.2+i*.27,b.y+f.h-.13,['#82a459','#cf8655','#dfb653'][i]);this.streetBoard(b.x+.08,b.y+f.h-.05,palette.trim,'旬');}
  if(b.type==='sushi'){
   this.t.diamond(b.x+.98,b.y+.91,.69,.08,'#c7bea2',2*u);
   const p=this.p(b.x+1.79,b.y+.94,(this.bodyHeight(b)-17)*u);
   this.line([this.p(b.x+1.79,b.y+.91,(this.bodyHeight(b)-4)*u),{x:p.x,y:p.y-10*u}],'#796346',1.5);
   this.ellipse(p.x,p.y,5.2,9,'#bd6d50');for(const dy of [-5,0,5])this.line([{x:p.x-4*u,y:p.y+dy*u},{x:p.x+4*u,y:p.y+dy*u}],'#d89872',.7);
   this.line([{x:p.x-3*u,y:p.y-9*u},{x:p.x+3*u,y:p.y-9*u}],'#675d44',2);this.line([{x:p.x-3*u,y:p.y+9*u},{x:p.x+3*u,y:p.y+9*u}],'#675d44',2);this.label('鮨',p.x,p.y+3*u,7,'#f3e2be');
   this.streetBoard(b.x+.14,b.y+f.h-.03,'#8d7650','鮨');
   const base=this.p(b.x+.37,b.y+.92);this.ellipse(base.x,base.y,5,2.7,'#8d8d78');for(const [dx,dy,h]of [[-.025,0,23],[.015,.02,30],[.055,0,26]]){this.line([this.p(b.x+.37+dx,b.y+.92+dy,3*u),this.p(b.x+.37+dx,b.y+.92+dy,h*u)],'#7f945f',2);const leaf=this.p(b.x+.37+dx,b.y+.92+dy,(h-4)*u);this.poly([{x:leaf.x,y:leaf.y},{x:leaf.x-6*u,y:leaf.y-4*u},{x:leaf.x-3*u,y:leaf.y+1*u}],'#6f8959');}
  }
  if(b.type==='bathhouse'){const p=this.p(b.x+.25,b.y+f.h-.06,z-7*u);this.ellipse(p.x,p.y,11,11,'#ebdbb8');this.label('湯',p.x,p.y+4*u,15,palette.trim);this.t.box(b.x+.65,b.y+f.h-.2,.5,.14,7*u,'#c09d70','#a98861','#947654');this.pot(b.x+f.w-.16,b.y+f.h-.09,'#8fa580',1);}
  if(b.type==='cafe'){this.table(b.x+.28,b.y+f.h-.1,true);const p=this.p(b.x+.73,b.y+.6,z+18*u);this.ellipse(p.x,p.y,9,4,'#eee6ce');this.line([{x:p.x+7*u,y:p.y},{x:p.x+12*u,y:p.y-4*u},{x:p.x+10*u,y:p.y-8*u}],'#eee6ce',2);this.streetBoard(b.x+.82,b.y+f.h-.06,palette.trim,'珈');}
  if(b.type==='diner'){const p=this.p(b.x+.2,b.y+f.h-.03,25*u);this.ellipse(p.x,p.y,5,10,'#ce8061');this.line([{x:p.x,y:p.y-10*u},{x:p.x,y:p.y-16*u}],'#8b7860',1.2);this.streetBoard(b.x+f.w-.18,b.y+f.h-.04,'#667c6b','定食');}
  if(b.type==='toy'){const p=this.p(b.x+.18,b.y+f.h-.1);for(let i=0;i<3;i++){const x=p.x+(i-1)*9*u,y=p.y-32*u-(i%2)*8*u;this.line([{x,y},{x:p.x,y:p.y-5*u}],'#a08e72',.6);this.ellipse(x,y,5.5,7,['#d5927e','#ddbb66','#7fa7a5'][i]);}this.t.box(b.x+.5,b.y+f.h-.19,.32,.14,9*u,'#dec491','#b49970','#a58e67');}
  if(b.type==='flower'){for(let i=0;i<5;i++)this.pot(b.x+.1+i*.17,b.y+f.h-.06,['#c88696','#e5c271','#b8a1c0','#cc9a7a','#d7b7c5'][i],.85);this.pot(b.x+.84,b.y+.2,'#b3c18e',.65);}
  if(b.type==='clothes'){this.streetBoard(b.x+.15,b.y+f.h-.04,'#8c7397','服');this.pot(b.x+f.w-.16,b.y+f.h-.06,'#c4a8b9',.8);}
  if(b.type==='goods'){const p=this.p(b.x+.22,b.y+f.h-.08);this.t.box(b.x+.08,b.y+f.h-.2,.4,.13,10*u,'#b99a72','#a58b66','#937f5b');for(let i=0;i<3;i++)this.ellipse(p.x+i*6*u,p.y-13*u,3.5,5,['#d8bb8c','#90aba1','#c69774'][i]);}
  if(b.type==='salon'){const p=this.p(b.x+.16,b.y+f.h-.05,23*u);c.fillStyle='#f4e9cc';c.fillRect(p.x-3*u,p.y-15*u,6*u,25*u);for(let i=0;i<4;i++){this.line([{x:p.x-2*u,y:p.y-13*u+i*6*u},{x:p.x+2*u,y:p.y-9*u+i*6*u}],i%2?'#779eaf':'#bf7d6d',3);}this.ellipse(p.x,p.y-16*u,4,2,'#d8d9c5');}
  if(b.type==='sports'){this.streetBoard(b.x+.15,b.y+f.h-.05,'#698159','SPORT');const p=this.p(b.x+f.w-.3,b.y+f.h-.08);for(const dx of [-8,8]){this.line([{x:p.x+dx*u,y:p.y-19*u},{x:p.x+dx*u+4*u,y:p.y-33*u}],'#9d7958',2);}this.ellipse(p.x,p.y-7*u,8,5,'#ba8b5e');}
  if(b.type==='diy'){this.streetBoard(b.x+.15,b.y+f.h-.04,palette.trim,'DIY');const p=this.p(b.x+.78,b.y+f.h-.08,23*u);this.line([{x:p.x-7*u,y:p.y-8*u},{x:p.x+7*u,y:p.y+8*u}],'#c5b999',4);this.line([{x:p.x+5*u,y:p.y-6*u},{x:p.x-6*u,y:p.y+7*u}],'#916c4c',3);this.line([{x:p.x+2*u,y:p.y-10*u},{x:p.x+10*u,y:p.y-3*u}],'#75867d',5);}
  if(b.type==='hobby'){this.awning(b,palette.trim);const p=this.p(b.x+.68,b.y+f.h-.05,z-8*u);this.line([{x:p.x-12*u,y:p.y},{x:p.x+12*u,y:p.y}],'#dbc392',3);this.poly([{x:p.x,y:p.y-10*u},{x:p.x+5*u,y:p.y+8*u},{x:p.x-5*u,y:p.y+8*u}],'#f0dfb7');this.streetBoard(b.x+.15,b.y+f.h-.04,palette.trim,'HOBBY');}
  if(b.type==='sportcenter'){this.streetBoard(b.x+.15,b.y+f.h-.05,palette.trim,'SPORT');const p=this.p(b.x+f.w-.25,b.y+f.h-.1,25*u);this.line([{x:p.x,y:p.y+22*u},{x:p.x,y:p.y-10*u}],'#7a8d7b',2);this.poly([{x:p.x-10*u,y:p.y-24*u},{x:p.x+10*u,y:p.y-24*u},{x:p.x+10*u,y:p.y-10*u},{x:p.x-10*u,y:p.y-10*u}],'#eee7c8','#7c9b86');this.ellipse(p.x,p.y-10*u,7,2,'#bb8b62');}
  if(b.type==='gamecenter'){const p=this.p(b.x+f.w/2,b.y+f.h-.04,z-11*u);this.poly([{x:p.x-16*u,y:p.y-5*u},{x:p.x+16*u,y:p.y-5*u},{x:p.x+20*u,y:p.y+8*u},{x:p.x-20*u,y:p.y+8*u}],'#e4c7a6','#947794');this.line([{x:p.x-11*u,y:p.y+1*u},{x:p.x-3*u,y:p.y+1*u}],'#887286',2);this.line([{x:p.x-7*u,y:p.y-3*u},{x:p.x-7*u,y:p.y+5*u}],'#887286',2);this.dot(p.x+8*u,p.y,2,'#c58f90');this.dot(p.x+13*u,p.y+4*u,2,'#9fb5a1');}
  if(b.type==='karaoke'){const p=this.p(b.x+.2,b.y+f.h-.06,z+3*u);this.line([{x:p.x-4*u,y:p.y+12*u},{x:p.x+6*u,y:p.y-6*u}],'#786c79',5);this.ellipse(p.x+8*u,p.y-10*u,7,8,'#ddc99f');this.line([{x:p.x+19*u,y:p.y-6*u},{x:p.x+19*u,y:p.y-19*u},{x:p.x+28*u,y:p.y-22*u}],'#f1d8ac',2);this.ellipse(p.x+16*u,p.y-5*u,4,2.5,'#efd5a7');this.streetBoard(b.x+f.w-.18,b.y+f.h-.05,palette.trim,'SING');}
  if(b.type==='market'){for(let i=0;i<5;i++)this.crate(b.x+.15+i*.31,b.y+f.h-.25,['#b76f5a','#a8b56e','#d9b85d','#c88961','#95a573'][i]);this.awning(b,palette.trim);}
  if(b.type==='convenience'){const p=this.p(b.x+.5,b.y+f.h-.06,z-7*u);if(op){c.save();c.globalAlpha*=.25;this.ellipse(p.x,p.y+35*u,27,12,'#edcd73');c.restore();}this.poly([{x:p.x-24*u,y:p.y-6*u},{x:p.x+24*u,y:p.y-6*u},{x:p.x+24*u,y:p.y+8*u},{x:p.x-24*u,y:p.y+8*u}],op?'#fff3c8':'#d2d3bd','#80aaa0');this.label('24h',p.x,p.y+5*u,12,'#4c8b80');}
  if(b.type==='police'){const p=this.p(b.x+.83,b.y+f.h-.05,30*u);this.ellipse(p.x,p.y,3,6,'#ba8170');this.label('交',p.x,p.y-25*u,12,'#486b78');}
  if(b.type==='toilet')this.label('WC',this.p(b.x+.5,b.y+.5,z+16*u).x,this.p(b.x+.5,b.y+.5,z+16*u).y,13,'#f5f0d7');
 }
 construction(b){const f=E.F(b.type),u=this.u;this.t.box(b.x+.1,b.y+.1,f.w-.2,f.h-.2,28*u,'#cfbea0','#c2ad8b','#a9977c');for(let i=0;i<=f.w*3;i++){const a=this.p(b.x+.1+i*(f.w-.2)/(f.w*3),b.y+f.h-.08);this.line([a,{x:a.x,y:a.y-57*u}], '#8e8a72',1.8);}for(const z of [15,35,55])this.line([this.p(b.x+.1,b.y+f.h-.08,z*u),this.p(b.x+f.w-.1,b.y+f.h-.08,z*u)],'#ac9c75',2);for(let i=0;i<Math.ceil(f.w*8);i++){const x=b.x+i*f.w/Math.ceil(f.w*8);this.poly([this.p(x,b.y+f.h,4*u),this.p(x+.1,b.y+f.h,4*u),this.p(x+.1,b.y+f.h,14*u),this.p(x,b.y+f.h,14*u)],i%2?'#e6cb87':'#897e62');}const p=this.p(b.x+f.w*.5,b.y+f.h*.5,51*u);this.label('工事中',p.x,p.y,13,'#74664d');}
 waterConnections(b){
  if(b.type==='bridge')return [0,2];
  return [[.5,-.5],[1.5,.5],[.5,1.5],[-.5,.5]].flatMap(([dx,dy],direction)=>{const [wx,wy]=E.toWorld(b,dx,dy),a=E.at(this.t.state,Math.floor(wx),Math.floor(wy));if(!a||a.build)return [];if(a.type==='stream')return [direction];if(a.type==='bridge'){const vertical=E.rotation(a)%2===0;return (vertical?Math.floor(wx)===b.x:Math.floor(wy)===b.y)?[direction]:[];}return [];});
 }
 waterway(b,t){
  const c=this.c,u=this.u,x=b.x,y=b.y,ports=this.waterConnections(b),ends=[[.5,-.012],[1.012,.5],[.5,1.012],[-.012,.5]],paths=[];
  if(!ports.length)paths.push({a:[.5,.17],d:[.5,.83]});
  else if(ports.length===2)paths.push({a:ends[ports[0]],d:ends[ports[1]],curve:(ports[1]-ports[0]+4)%2===1});
  else for(const side of ports)paths.push({a:ends[side],d:[.5,.5]});
  const trace=()=>{c.beginPath();for(const path of paths){c.moveTo(...path.a);if(path.curve)c.quadraticCurveTo(.5,.5,...path.d);else c.lineTo(...path.d);}};
  const samples=paths.flatMap(path=>Array.from({length:21},(_,i)=>{const q=i/20,v=1-q;return path.curve?[v*v*path.a[0]+v*q+q*q*path.d[0],v*v*path.a[1]+v*q+q*q*path.d[1]]:[path.a[0]*(1-q)+path.d[0]*q,path.a[1]*(1-q)+path.d[1]*q];}));
  const dry=(dx,dy)=>samples.every(([a,d])=>Math.hypot(a-dx,d-dy)>.4),winter=E.season(this.t.state)==='冬';
  this.poly([[0,0],[1,0],[1,1],[0,1]].map(([dx,dy])=>this.p(x+dx,y+dy)),this.seasonPalette().grass[(b.x+b.y)%2]);
  const origin=this.p(x,y,1*u),ax=this.p(x+1,y,1*u),ay=this.p(x,y+1,1*u);c.save();c.transform(ax.x-origin.x,ax.y-origin.y,ay.x-origin.x,ay.y-origin.y,origin.x,origin.y);
  c.beginPath();c.rect(-.012,-.012,1.024,1.024);c.clip();c.lineCap='round';c.lineJoin='round';
  for(const [width,color]of [[.69,winter?'#b4b8aa':'#b3b797'],[.60,'#d0c8ac'],[.52,'#a3c9b7'],[.43,winter?'#8fb7b7':'#83bcb9'],[.27,winter?'#85aaaa':'#74adac']]){trace();c.lineWidth=width;c.strokeStyle=color;c.stroke();}
  const pointAt=(path,q)=>{const v=1-q;return path.curve?[v*v*path.a[0]+v*q+q*q*path.d[0],v*v*path.a[1]+v*q+q*q*path.d[1]]:[path.a[0]*v+path.d[0]*q,path.a[1]*v+path.d[1]*q];};
  c.lineWidth=.012;c.strokeStyle='#dfefe0aa';for(const path of paths)for(let i=0;i<2;i++){const q=.15+((i*.47+(this.t.motion?(t||0)/28000:0))%1)*.7,p=pointAt(path,q),a=pointAt(path,q-.04),d=pointAt(path,q+.04),length=Math.hypot(d[0]-a[0],d[1]-a[1])||1,tx=(d[0]-a[0])/length,ty=(d[1]-a[1])/length,offset=i%2?.075:-.06,px=p[0]-ty*offset,py=p[1]+tx*offset;c.beginPath();c.moveTo(px-tx*.055,py-ty*.055);c.quadraticCurveTo(px-ty*.025,py+tx*.025,px+tx*.055,py+ty*.055);c.stroke();}
  for(const [dx,dy]of [[.12,.13],[.87,.12],[.13,.87],[.87,.87]])if(dry(dx,dy)){c.fillStyle='#8c9a85';c.beginPath();c.ellipse(dx,dy,.075,.045,.35,0,Math.PI*2);c.fill();c.fillStyle='#bac0a6';c.beginPath();c.ellipse(dx-.012,dy-.012,.055,.028,.35,0,Math.PI*2);c.fill();}
  c.restore();
  for(const [dx,dy]of [[.08,.26],[.91,.73]])if(dry(dx,dy)){const p=this.p(x+dx,y+dy,2*u);for(const [a,h]of [[-2,7],[1,11],[3,6]])this.line([{x:p.x+a*u,y:p.y},{x:p.x+(a-1)*u,y:p.y-h*u}],winter?'#9b9c75':'#71945d',1.1);}
  if(this.snowy())for(const [dx,dy]of [[.12,.13],[.87,.87]])if(dry(dx,dy)){const p=this.p(x+dx,y+dy,3*u);this.ellipse(p.x,p.y,6,2.2,'#f4f3e8');}
 }
 lordHat(x,y,scale){const c=this.c;c.save();c.translate(x,y);c.scale(scale,scale);c.fillStyle='#314c68';c.beginPath();c.roundRect(-8,-24,16,4,2);c.fill();c.fillRect(-4,-30,8,8);c.fillStyle='#d9b65c';c.fillRect(-1,-28,2,5);c.fillStyle='#55798a';c.fillRect(-6,-15,12,4);c.restore();}
 castleDecorations(b,t){
  const c=this.c,u=this.u,s=this.t.state,record=s.castle?.buildingId===b.id?s.castle:null,sites=[[.3,5.6],[1.4,5.6],[4.5,5.6],[5.6,5.6],[5.6,4.4],[5.6,3.3]];
  // Exactly six small static gift ornaments. No sprites, agents or per-gift timers.
  for(let i=0;i<(record?.gifts.length||0);i++){const g=record.gifts[i],q=this.p(b.x+sites[i][0],b.y+sites[i][1],10*u);c.save();c.translate(q.x,q.y);c.scale(u,u);c.fillStyle='#957555';c.fillRect(-4,-5,8,5);c.strokeStyle='#7c8754';c.lineWidth=2;c.beginPath();c.moveTo(0,-5);c.lineTo(0,-23);c.stroke();if(g.kind==='flowers'||g.kind==='garland'){for(let j=0;j<4;j++){c.fillStyle=['#d98b9f','#ebc66c','#f1d7d4','#9fc19b'][j];c.beginPath();c.arc((j-1.5)*4,-17-(j%2)*5,4,0,7);c.fill();}}else if(g.kind==='lantern'){c.fillStyle='#d48b70';c.beginPath();c.ellipse(0,-18,6,8,0,0,7);c.fill();c.fillStyle='#f3d58d';c.fillRect(-4,-20,8,2);}else if(g.kind==='pinwheel'){for(let j=0;j<4;j++){c.rotate(Math.PI/2);c.fillStyle=['#d9a578','#98bcb0','#cf99a5','#e4c883'][j];c.beginPath();c.moveTo(0,-18);c.lineTo(0,-28);c.lineTo(8,-23);c.closePath();c.fill();}}else{c.fillStyle=g.kind==='banner'?'#a9809d':'#d9bb86';c.fillRect(1,-25,11,15);c.fillStyle='#fff2d6';c.font='9px sans-serif';c.fillText(g.kind==='banner'?'祝':'謝',2,-14);}c.restore();}
  if(E.availableTitles(s).includes('castleKeeper')){for(const dx of [.25,5.75]){const q=this.p(b.x+dx,b.y+5.2,8*u);c.save();c.translate(q.x,q.y);c.scale(u,u);c.fillStyle='#73563e';c.fillRect(-1,-64,2,64);c.fillStyle='#b83e35';c.fillRect(1,-61,17,43);c.strokeStyle='#e9c97b';c.lineWidth=2;c.strokeRect(3,-59,13,39);c.fillStyle='#fff1ca';c.font='bold 12px serif';c.fillText('祝',4,-36);c.restore();}}
  if(E.castleEffects(s,this.t.net).festival){for(const [i,dx]of [.6,1.7,4.3,5.4].entries()){const q=this.p(b.x+dx,b.y+5.3,12*u);c.save();c.translate(q.x,q.y);c.scale(u,u);c.fillStyle='#b89970';c.fillRect(-12,-17,24,17);c.fillStyle=i%2?'#708f83':'#c88c82';c.beginPath();c.moveTo(-16,-18);c.lineTo(0,-30);c.lineTo(16,-18);c.closePath();c.fill();c.fillStyle='#f7dfb7';c.fillRect(-7,-12,14,5);c.restore();}const a=this.p(b.x+.2,b.y+5.6,45*u),z=this.p(b.x+5.8,b.y+5.6,45*u);this.line([a,z],'#8a7156',1);for(let j=0;j<9;j++){const f=j/8,x=a.x+(z.x-a.x)*f,y=a.y+(z.y-a.y)*f;this.ellipse(x,y+5*u,5,7,j%2?'#f3d397':'#d88d7d');}}
 }
 castle(b,t=0){const u=this.u,c=this.c,s=this.t.state,w=6*this.t.tw,p=this.p(b.x+3,b.y+3),bottom=this.p(b.x+6,b.y+6),motion=this.t.motion&&!this.t.photograph,clock=motion?t:0,mood=s.month%3;
 if(!this.castleSprite&&root.Image){this.castleSprite=new root.Image();this.castleSprite.onload=()=>this.t.draw(0);this.castleSprite.src='assets/castle-sprite.webp';}const image=this.castleSprite;
 if(image?.complete&&image.naturalWidth){const h=w*image.naturalHeight/image.naturalWidth,left=p.x-w/2,top=bottom.y-h;
  // Preserve the original painted mascot. Only its raised forearm is articulated;
  // the face, body, feet and every roof pixel stay in the original image coordinates.
  const arm=[[557,72],[580,66],[599,72],[611,87],[611,112],[604,133],[591,136],[573,122],[557,103]],outline=()=>{c.moveTo(...arm[0]);for(const q of arm.slice(1))c.lineTo(...q);c.closePath();};
  c.save();c.translate(left,top);c.scale(w/1200,h/952);
  if(!motion){c.drawImage(image,0,0,1200,952);}else{
   c.save();c.beginPath();c.rect(0,0,1200,952);outline();c.clip('evenodd');c.drawImage(image,0,0,1200,952);c.restore();
   c.save();c.translate(603,129);c.rotate(Math.sin(clock/500)*.24);c.translate(-603,-129);c.beginPath();outline();c.clip();c.drawImage(image,0,0,1200,952);c.restore();
  }c.restore();
 }else{this.t.diamond(b.x,b.y,6,6,'#87bcb3');this.t.box(b.x+.45,b.y+.45,5.1,5.1,30*u,'#b6b5a5','#8b9385','#798476');for(let i=0;i<5;i++){const size=3.6-i*.5,z=(60+i*27)*u;this.t.box(b.x+3-size/2,b.y+3-size/2,size,size,z,'#526a73','#f1e5cb','#c3baa5');}const q=this.p(b.x+3,b.y+3,193*u);root.KMascot?.draw(c,q.x,q.y,2*u,clock,mood===1?'rest':'wave',1);}
 this.castleDecorations(b,t);
 }
 // Boundary arms are in world coordinates, independent of the individual
 // tiles' rotations. Endpoints share the same cross-section at tile seams.
 castleLinks(b){
  const dirs=[[0,-1],[1,0],[0,1],[-1,0]],links=dirs.map(([dx,dy])=>{const a=E.at(this.t.state,b.x+dx,b.y+dy);return !!a&&a.type===b.type&&!a.build;});
  const count=links.filter(Boolean).length;
  if(!count){links[E.rotation(b)%2?0:1]=true;links[E.rotation(b)%2?2:3]=true;}
  else if(count===1){const i=links.indexOf(true);links[(i+2)%4]=true;}
  return links;
 }
 boundaryMesh(links,width){
  const q=[0,.5-width/2,.5+width/2,1],cells=[[1,1]],edges=[];
  if(links[0])cells.push([1,0]);if(links[1])cells.push([2,1]);if(links[2])cells.push([1,2]);if(links[3])cells.push([0,1]);
  const has=(x,y)=>cells.some(c=>c[0]===x&&c[1]===y);
  for(const [x,y]of cells){const a=[q[x],q[y]],b=[q[x+1],q[y]],c=[q[x+1],q[y+1]],d=[q[x],q[y+1]];
   for(const [dx,dy,p,r,side]of [[0,-1,a,b,0],[1,0,b,c,1],[0,1,c,d,2],[-1,0,d,a,3]])if(!has(x+dx,y+dy))edges.push({a:p,b:r,side,seam:side===0&&y===0||side===1&&x===2||side===2&&y===2||side===3&&x===0});
  }
  return {q,cells,edges};
 }
 castleBoundary(b){
  const links=this.castleLinks(b),adjacent=[[0,-1],[1,0],[0,1],[-1,0]].map(([dx,dy])=>{const a=E.at(this.t.state,b.x+dx,b.y+dy);return a?.type===b.type&&!a.build;}),u=this.u,wall=b.type==='castleWall',p=(a,z)=>this.p(b.x+a[0],b.y+a[1],z*u);
  const layer=(bottomWidth,topWidth,z0,z1,stone=false,fill='#f7f1df')=>{
   const bottom=this.boundaryMesh(links,bottomWidth),top=this.boundaryMesh(links,topWidth);
   const faces=top.edges.map((e,i)=>({...e,low:bottom.edges[i]})).filter(e=>!(e.seam&&adjacent[e.side])&&(e.side===1||e.side===2)).sort((a,b)=>a.a[0]+a.a[1]+a.b[0]+a.b[1]-b.a[0]-b.a[1]-b.b[0]-b.b[1]);
   for(const e of faces){const A=p(e.a,z1),B=p(e.b,z1),D=p(e.low.a,z0),F=p(e.low.b,z0);this.poly([A,B,F,D],stone?'#60685f':e.side===1?'#d6d6c5':fill,'#61685b',.45);
    const at=(t,v)=>({x:(A.x*(1-t)+B.x*t)*(1-v)+(D.x*(1-t)+F.x*t)*v,y:(A.y*(1-t)+B.y*t)*(1-v)+(D.y*(1-t)+F.y*t)*v});
    if(stone){const rows=Math.max(1,Math.round((z1-z0)/7)),length=Math.hypot(e.a[0]-e.b[0],e.a[1]-e.b[1]),cols=Math.max(1,Math.ceil(length*5));
     for(let row=0;row<rows;row++)for(let col=-1;col<cols;col++){const offset=row%2?.5:0,t0=Math.max(.007,(col+offset)/cols+.012),t1=Math.min(.993,(col+1+offset)/cols-.012);if(t1<=t0)continue;const v0=row/rows+.015,v1=(row+1)/rows-.015,k=(row*7+col*3+b.x*5+b.y*11+e.side+99)%5;this.poly([at(t0+.018,v0+.015*(col%2)),at(t1-.025,v0),at(t1,v0+.04),at(t1-.01,v1-.035),at(t1-.04,v1),at(t0+.025,v1),at(t0,v1-.05),at(t0,v0+.035)],['#8e928a','#a8a99d','#777e76','#b9b6a7','#989d90'][k],'#535e52',.55);this.line([at(t0+.02,v0+.025),at(t1-.02,v0+.025)],'#d4cdb066',.6);}
    }else if(z1>30){const count=Math.max(1,Math.floor(Math.hypot(e.a[0]-e.b[0],e.a[1]-e.b[1])*4));for(let i=0;i<count;i++){const t=(i+.5)/count,dt=Math.min(.055,.075/count);this.poly([at(t-dt,.32),at(t+dt,.32),at(t+dt,.49),at(t-dt,.49)],'#636d62');}}
   }
   for(const [x,y]of top.cells){const q=top.q;this.poly([[q[x],q[y]],[q[x+1],q[y]],[q[x+1],q[y+1]],[q[x],q[y+1]]].map(a=>p(a,z1)),stone?'#a5a58e':fill);}
  };
  // Sloping, staggered masonry, rather than a rectangular concrete block.
  layer(wall?.46:.66,wall?.35:.46,0,wall?9:40,true);
  if(!wall){const mesh=this.boundaryMesh(links,.46);for(const e of mesh.edges)if(!e.seam)this.line([p(e.a,40),p(e.b,40)],'#d1cbb1',1.1);return;}
  layer(.28,.28,9,15,false,'#6e7165');layer(.28,.28,15,40,false,'#fff8e6');
  const dirs=[[0,-1],[1,0],[0,1],[-1,0]],roof=(a,z)=>p(a,z);
  // Two sloped tile planes with cylindrical tile seams and a capped ridge.
  for(let i=0;i<4;i++)if(links[i]){const [dx,dy]=dirs[i],nx=-dy,ny=dx,a=[.5,.5],d=[.5+dx*.5,.5+dy*.5],width=.235;
   for(const side of [-1,1]){const edge=q=>[q[0]+nx*width*side,q[1]+ny*width*side],A=roof(a,51),B=roof(d,51),D=roof(edge(a),42),F=roof(edge(d),42);this.poly([A,B,F,D],side===1?'#536673':'#354c59','#2e434b',.7);
    this.line([D,F],'#8b9896',2.1);for(let n=0;n<=5;n++){const t=n/5,q=[a[0]+dx*.5*t,a[1]+dy*.5*t];this.line([roof(q,51),roof(edge(q),42)],'#9aa9a5',.75);}
    for(const v of [.37,.7])this.line([{x:A.x+(D.x-A.x)*v,y:A.y+(D.y-A.y)*v},{x:B.x+(F.x-B.x)*v,y:B.y+(F.y-B.y)*v}],'#253d47',.65);
   }
   if(!adjacent[i]&&(i===1||i===2))this.poly([roof([d[0]-nx*width,d[1]-ny*width],42),roof(d,51),roof([d[0]+nx*width,d[1]+ny*width],42)],'#d7d4bd','#354d58',.7);
   this.line([roof(a,52),roof(d,52)],'#273e48',3.8);this.line([roof(a,53.2),roof(d,53.2)],'#a1aca5',.8);
  }
  if(this.snowy()){for(let i=0;i<4;i++)if(links[i]){const [dx,dy]=dirs[i];this.line([p([.5,.5],54),p([.5+dx*.5,.5+dy*.5],54)],'#f2f4e9',2.5);}}
 }
 castlePine(b){
  const p=this.p(b.x+.5,b.y+.5),u=this.u;
  const pt=(x,y)=>({x:p.x+x*u,y:p.y+y*u});
  this.ellipse(p.x,p.y+u,21,8,'#87986a');this.line([pt(-3,0),pt(-1,-16),pt(7,-29),pt(4,-45),pt(10,-61)],'#66513e',6);this.line([pt(-1,-1),pt(2,-16),pt(10,-29),pt(7,-46)],'#a18154',1.8);
  for(const [x,y,ex,ey]of [[4,-23,-20,-31],[7,-32,25,-43],[5,-43,-11,-50],[8,-52,15,-62]]){this.line([pt(x,y),pt(ex,ey)],'#6e573e',3);this.line([pt(x+1,y-1),pt(ex,ey-1)],'#b29a68',.7);}
  for(const [x,y,r]of [[-19,-32,16],[23,-44,16],[-10,-50,15],[14,-63,14]]){for(let i=0;i<5;i++){const dx=(i-2)*r*.35,dy=(i%2)*2;this.ellipse(p.x+(x+dx)*u,p.y+(y+dy)*u,r*.55,6.4,'#254e40');this.ellipse(p.x+(x+dx-1)*u,p.y+(y+dy-3)*u,r*.48,4.5,i%2?'#618260':'#426c50');}for(let i=0;i<6;i++)this.line([pt(x-r+i*r*.36,y-4),pt(x-r+i*r*.36-2,y-8)],'#8b9b6b',.7);if(this.snowy())this.ellipse(p.x+x*u,p.y+(y-6)*u,r*.8,2.4,'#edf1e3');}
 }
 castleAzumaya(b){
  const u=this.u,p=(x,y,z=0)=>this.p(b.x+x,b.y+y,z*u),c=this.c;
  this.t.box(b.x+.12,b.y+.12,1.76,1.76,5*u,'#c7c3aa','#999c89','#808c80');
  this.t.box(b.x+.24,b.y+.24,1.52,1.52,11*u,'#c79c6c','#9c6040','#864a35');
  for(let i=1;i<9;i++)this.line([p(.25+i*.165,.25,11),p(.25+i*.165,1.75,11)],'#815437',.7);
  const pillar=(x,y)=>{this.t.box(b.x+x-.045,b.y+y-.045,.09,.09,64*u,'#d35b3e','#b4442d','#8d3328');this.t.box(b.x+x-.065,b.y+y-.065,.13,.13,15*u,'#dd9e6a','#915039','#783e30');};
  pillar(.36,.36);pillar(1.64,.36);
  for(const [a,d]of [[[.36,.36],[1.64,.36]],[[.36,.36],[.36,1.64]],[[1.64,.36],[1.64,1.64]]]){this.line([p(...a,28),p(...d,28)],'#8b332a',4);this.line([p(...a,43),p(...d,43)],'#c45436',3);for(let i=1;i<5;i++){const t=i/5,x=a[0]+(d[0]-a[0])*t,y=a[1]+(d[1]-a[1])*t;this.line([p(x,y,29),p(x,y,42)],'#ae402d',1.5);}}
  // Raised benches and an open front, with vermilion cross-bracing.
  this.t.box(b.x+.43,b.y+.4,1.14,.17,24*u,'#d89b69','#a45537','#8f4431');
  pillar(.36,1.64);pillar(1.64,1.64);
  for(const [a,d]of [[[.31,.31],[1.69,.31]],[[.31,1.69],[1.69,1.69]],[[.31,.31],[.31,1.69]],[[1.69,.31],[1.69,1.69]]]){this.line([p(...a,65),p(...d,65)],'#c75032',5);for(const t of [.12,.88]){const x=a[0]+(d[0]-a[0])*t,y=a[1]+(d[1]-a[1])*t;this.line([p(x,y,64),p(x+(t<.5?.1:-.1)*(d[0]-a[0]),y+(t<.5?.1:-.1)*(d[1]-a[1]),55)],'#9b3428',2);}}
  const A=p(.02,.02,69),B=p(1.98,.02,69),D=p(.02,1.98,69),F=p(1.98,1.98,69),R=p(1,.53,93),T=p(1,1.47,93);
  const panels=[[A,B,R],[A,R,T,D],[B,F,T,R],[D,T,F]],colors=['#677a7c','#536a70','#344d58','#465c64'];
  for(let j=0;j<panels.length;j++){this.poly(panels[j],colors[j],'#263e49',1);}
  // Fine radiating kawara courses, bounded to each roof plane.
  for(const [e1,e2,r1,r2]of [[A,D,R,T],[B,F,R,T]])for(let i=0;i<=12;i++){const t=i/12,a={x:e1.x+(e2.x-e1.x)*t,y:e1.y+(e2.y-e1.y)*t},d={x:r1.x+(r2.x-r1.x)*t,y:r1.y+(r2.y-r1.y)*t};this.line([a,d],'#94a19b',.7);}
  for(const [a,d]of [[A,B],[D,F]])for(let i=1;i<10;i++){const t=i/10,r=a===A?R:T;this.line([{x:a.x+(d.x-a.x)*t,y:a.y+(d.y-a.y)*t},r],'#859690',.7);}
  for(const [a,d]of [[A,B],[B,F],[F,D],[D,A]]){this.line([a,d],'#233c48',3.5);this.line([{x:a.x,y:a.y+2*u},{x:d.x,y:d.y+2*u}],'#bd5537',1.5);}
  this.line([R,T],'#253f49',5);this.line([{x:R.x,y:R.y-2*u},{x:T.x,y:T.y-2*u}],'#a3ada4',1);for(const q of [R,T]){this.ellipse(q.x,q.y-2*u,3.1,4.3,'#425a61');this.dot(q.x,q.y-2*u,1.2,'#b1b9a8');}
  if(this.snowy())this.line([R,T],'#edf1e8',3);
 }
 castleLantern(b){
  const u=this.u,p=(x,y,z=0)=>this.p(b.x+x,b.y+y,z*u),c=this.c;
  const octagon=(radius,z)=>Array.from({length:8},(_,i)=>{const a=i*Math.PI/4+Math.PI/8;return p(.5+Math.cos(a)*radius,.5+Math.sin(a)*radius,z);});
  const stone=(radius,z0,z1)=>{const low=octagon(radius,z0),top=octagon(radius,z1);for(let i=0;i<8;i++){const j=(i+1)%8;this.poly([low[i],low[j],top[j],top[i]],i<4?'#7f887a':'#a3a797','#647364',.45);}this.poly(top,'#b8bbab','#8b9383',.5);};
  const root=p(.5,.5);this.ellipse(root.x,root.y,23,9,'#75866044');
  stone(.29,0,4);stone(.23,4,9);stone(.15,9,13);stone(.073,13,43);stone(.17,43,47);
  this.poly([p(.34,.66,47),p(.66,.66,47),p(.66,.66,64),p(.34,.66,64)],'#8b9383','#647364',.6);
  this.poly([p(.66,.34,47),p(.66,.66,47),p(.66,.66,64),p(.66,.34,64)],'#727f73','#647364',.6);
  this.poly([p(.34,.34,64),p(.66,.34,64),p(.66,.66,64),p(.34,.66,64)],'#adb3a3');
  // Recessed fire-box openings in the two visible stone faces.
  for(const face of [[[.39,.665],[.61,.665]],[[.665,.39],[.665,.61]]]){const [a,d]=face;this.poly([p(...a,60),p(...d,60),p(...d,50),p(...a,50)],'#394b43','#c7c8b4',1);
   const q=p((a[0]+d[0])/2,(a[1]+d[1])/2,55);this.ellipse(q.x,q.y,4.4,5.3,'#e4aa52');this.ellipse(q.x,q.y+u,2,3.8,'#fff0a5');
   this.line([p(...a,61),p(...d,61)],'#d6d5bd',.7);
  }
  stone(.2,64,68);
  const roof=[[.08,.08],[.5,.13],[.92,.08],[.87,.5],[.92,.92],[.5,.87],[.08,.92],[.13,.5]],cap=roof.map(([x,y],i)=>p(x,y,i%2?70:72)),tip=p(.5,.5,80);
  for(let i=0;i<8;i++)this.poly([cap[i],cap[(i+1)%8],tip],i<4?'#b0b5a4':'#8f9c8b','#728170',.55);
  this.line([...cap,cap[0]],'#586e61',2);this.line([cap[4],cap[5],cap[6]],'#d1d1b8',1);
  stone(.07,80,83);const top=p(.5,.5,87);this.ellipse(top.x,top.y,3.3,4.4,'#b8bdab');this.dot(top.x-u,top.y-u,1.2,'#d9d9bf');
  for(const [x,y]of [[.23,.3],[.72,.6],[.4,.74]]){const q=p(x,y,3);this.ellipse(q.x,q.y,4,1.8,'#708554');}
  if(this.snowy())this.line([cap[0],tip,cap[2]],'#f3f4e8',2.2);
 }
 castleKoiPond(b,t){
  const u=this.u,c=this.c,p=(x,y,z=0)=>this.p(b.x+x,b.y+y,z*u),clock=this.t.motion&&!this.t.photograph?(t||0):0;
  const rim=Array.from({length:20},(_,i)=>{const a=i*Math.PI/10;return [1+Math.cos(a)*(.76+.045*Math.sin(a*3)),.98+Math.sin(a)*(.68+.035*Math.cos(a*2))];});
  const outline=()=>{c.beginPath();const last=rim[rim.length-1];c.moveTo((last[0]+rim[0][0])/2,(last[1]+rim[0][1])/2);for(let i=0;i<rim.length;i++){const a=rim[i],d=rim[(i+1)%rim.length];c.quadraticCurveTo(a[0],a[1],(a[0]+d[0])/2,(a[1]+d[1])/2);}c.closePath();};
  this.t.diamond(b.x+.04,b.y+.04,1.92,1.92,this.seasonPalette().park);
  const O=p(0,0,2),X=p(1,0,2),Y=p(0,1,2);c.save();
  try{
   c.transform(X.x-O.x,X.y-O.y,Y.x-O.x,Y.y-O.y,O.x,O.y);
   outline();c.strokeStyle='#809075';c.lineWidth=.23;c.stroke();
   const water=c.createRadialGradient(.8,.8,.05,1,1,.92);water.addColorStop(0,'#477e82');water.addColorStop(.7,'#70aaa0');water.addColorStop(1,'#acc6aa');c.fillStyle=water;c.fill();c.strokeStyle='#466e68';c.lineWidth=.025;c.stroke();
   c.save();outline();c.clip();
   for(let i=0;i<5;i++){const x=.45+(i*.29)%1.2,y=.6+(i*.21)%1.0;c.fillStyle='#3a746e33';c.beginPath();c.ellipse(x,y,.09,.04,0,0,Math.PI*2);c.fill();}
   // Fixed population and analytic paths: swimming never consumes game RNG or grows save data.
   for(let i=0;i<3;i++){
    const a=clock*.00013+i*Math.PI*2/3,x=1+Math.cos(a)*(.36+i*.025),y=.98+Math.sin(a)*(.30+i*.012),heading=Math.atan2(Math.cos(a)*(.30+i*.012),-Math.sin(a)*(.36+i*.025)),tail=Math.sin(clock*.004+i)*.025;
    c.save();c.translate(x,y);c.rotate(heading);c.fillStyle='#255a5e33';c.beginPath();c.ellipse(.015,.025,.17,.063,0,0,Math.PI*2);c.fill();
    c.fillStyle=i===2?'#c29642':'#f0eee0';c.beginPath();c.moveTo(-.13,0);c.lineTo(-.23,-.065+tail);c.lineTo(-.2,tail);c.lineTo(-.23,.065+tail);c.closePath();c.fill();
    c.beginPath();c.ellipse(0,0,.16,.056,0,0,Math.PI*2);c.fill();
    c.fillStyle=i===2?'#e7c66c':'#bd5034';for(const [xx,yy,rx,ry]of [[.065,0,.045,.043],[-.05,-.012,.035,.04]]){c.beginPath();c.ellipse(xx,yy,rx,ry,0,0,Math.PI*2);c.fill();}
    if(i===1){c.fillStyle='#354b43';for(const [xx,yy]of [[-.09,.012],[.018,-.019]]){c.beginPath();c.ellipse(xx,yy,.023,.025,0,0,Math.PI*2);c.fill();}}
    c.fillStyle=i===2?'#dfc77d':'#e3dfc6';for(const side of [-1,1]){c.beginPath();c.moveTo(.02,side*.04);c.lineTo(-.055,side*.105);c.lineTo(-.06,side*.035);c.closePath();c.fill();}
    c.fillStyle='#283e37';for(const side of [-1,1]){c.beginPath();c.arc(.105,side*.027,.009,0,Math.PI*2);c.fill();}c.restore();
   }
   c.strokeStyle='#d4e6cd88';c.lineWidth=.012;for(let i=0;i<3;i++){const x=.62+i*.35,y=.65+i*.29;c.beginPath();c.ellipse(x,y,.11,.045,clock*.00005,Math.PI*.1,Math.PI*1.2);c.stroke();}
   c.restore();
  }finally{c.restore();}
  const ordered=rim.map(([x,y],i)=>({x,y,i})).sort((a,b)=>a.x+a.y-b.x-b.y);
  for(const {x,y,i}of ordered){const r=.1+(i%3)*.012,z=4+i%3,shape=Array.from({length:6},(_,j)=>{const a=j*Math.PI/3+i*.2;return [x+Math.cos(a)*r,y+Math.sin(a)*r*.85];});
   this.poly(shape.map(([x,y])=>p(x+.015,y+.025,0)),'#526e5c66');this.poly(shape.map(([x,y])=>p(x,y,z)),['#a9ad9a','#969f8e','#bac0a8','#818f82'][i%4],'#657a68',.6);this.line(shape.slice(1,4).map(([x,y])=>p(x,y,z+.6)),this.snowy()?'#f1f3e7':'#d4d2b6',1);
   if(i%3===0){const q=p(x-.04,y+.03,4);this.ellipse(q.x,q.y,3.8,2,'#638652');}
  }
  for(const [x,y]of [[.18,.4],[1.68,1.65]]){const q=p(x,y,3);for(const [dx,dy]of [[-5,-13],[0,-19],[6,-14]])this.line([q,{x:q.x+dx*u,y:q.y+dy*u}],'#658755',1.3);}
 }
 steppingPath(x,y,connected){
  const palette=this.seasonPalette(),snow=this.snowy(),dirs=[[0,-1],[1,0],[0,1],[-1,0]],links=dirs.map(([dx,dy])=>{const a=E.at(this.t.state,x+dx,y+dy);return E.isRoad(a)&&!a.build;});if(!links.some(Boolean)){links[1]=links[3]=true;}
  this.t.diamond(x,y,1,1,snow?'#e5e8df':palette.grass[(x+y)%2]);
  const stones=[[.5,.5,0]];for(let i=0;i<4;i++)if(links[i]){const [dx,dy]=dirs[i];stones.push([.5+dx*.34,.5+dy*.34,i+1]);}
  for(const [sx,sy,k]of stones){const ax=(k===1||k===3)?.18:.14,ay=(k===2||k===4)?.18:.14,shape=[[-.9,-.55],[-.25,-1],[.55,-.83],[1,-.1],[.7,.72],[-.1,1],[-.88,.47]],p=(a,z=0)=>this.p(x+sx+a[0]*ax,y+sy+a[1]*ay,z*this.u),hash=(x*13+y*7+k*3)%4;
   this.poly(shape.map(a=>p([a[0]+.02,a[1]+.03])),'#6c805b55');this.poly(shape.map(a=>p(a,1.8)),connected?['#a6a797','#b8b6a2','#989f92','#c1bca7'][hash]:'#a5aa9d','#68756a',.7);
   this.line(shape.slice(0,4).map(a=>p([a[0]*.85,a[1]*.85],2.1)),'#ddd7bd',.9);this.line([p([-.35,.1],2),p([-.1,-.08],2),p([.22,.13],2)],'#7e897b',.5);
   const q=this.p(x+sx-.11,y+sy+.14);this.ellipse(q.x,q.y,3.4,1.7,snow?'#f2f4e8':'#6f8b56');
  }
 }

 publicBuilding(b,t,layer='all'){const f=E.F(b.type),u=this.u,c=this.c,x=b.x,y=b.y;
  if(b.type==='kotsumaruCastle'){this.castle(b,t);return;}
  if(b.type==='castleWall'||b.type==='castleStone'){this.castleBoundary(b);return;}
  if(b.type==='castlePine'){this.castlePine(b);return;}
  if(b.type==='castleAzumaya'){this.castleAzumaya(b);return;}
  if(b.type==='castleLantern'){this.castleLantern(b);return;}
  if(b.type==='castleKoiPond'){this.castleKoiPond(b,t);return;}

  if(b.type==='stream'||b.type==='bridge'){
   if(layer!=='deck')this.waterway(b,t);
   if(b.type==='bridge'&&layer!=='water'){
    const arch=q=>6+10*Math.sin(q*Math.PI);
    for(let i=0;i<10;i++){const a=.08+i*.084,d=a+.078,z=arch((i+.5)/10)*u;this.poly([[a,.29],[d,.29],[d,.71],[a,.71]].map(([dx,dy])=>this.p(x+dx,y+dy,z)),i%2?'#c19a6d':'#b68c60','#927451',.5);}
    for(const dy of [.27,.73]){const rail=[];for(let i=0;i<=8;i++){const q=i/8,dx=.08+.84*q,z=arch(q);rail.push(this.p(x+dx,y+dy,(z+13)*u));if(i%2===0)this.line([this.p(x+dx,y+dy,z*u),this.p(x+dx,y+dy,(z+15)*u)],'#8a694e',2);}this.line(rail,'#9a7350',2.4);}
   }
   return;
  }
  if(b.type==='japaneseGarden'){
   const season=E.season(this.t.state),snow=this.snowy(),maple=season==='秋'?['#b85b3e','#d48a47','#dfaa63']:season==='春'?['#d5a0ac','#e8b9bf','#efd1c7']:season==='冬'?['#788d72','#8f9d7b','#a7ae8a']:['#628153','#7d965d','#99ac75'],p=(dx,dy,z=0)=>this.p(x+dx,y+dy,z*u);
   this.t.box(x+.04,y+.04,1.92,1.92,2*u,'#c9c3a5','#b3af93','#aaa78d');this.t.diamond(x+.13,y+.13,1.74,1.74,season==='秋'?'#a7ab78':season==='冬'?'#a3ad8e':'#94a77b',2*u);
   // Low bamboo boundaries leave all four street entrances open.
   for(const [a,d]of [[[.13,.13],[.83,.13]],[[1.16,.13],[1.87,.13]],[[.13,.13],[.13,.83]],[[.13,1.16],[.13,1.87]]]){
    this.line([p(...a,9),p(...d,9)],'#8f9970',2);this.line([p(...a,5),p(...d,5)],'#a9ad7d',1.4);
    for(const q of [0,.5,1]){const dx=a[0]+(d[0]-a[0])*q,dy=a[1]+(d[1]-a[1])*q;this.line([p(dx,dy),p(dx,dy,12)],'#76845c',1.8);}
   }
   // Raked white gravel and broken-edged moss islands, rather than a uniform lawn.
   this.poly([[.14,.68],[.43,.66],[.52,.98],[.36,1.48],[.15,1.62]].map(([a,d])=>p(a,d,2.5)),'#ddd7bf');
   for(let i=0;i<5;i++)this.line([p(.17+i*.045,.76,3),p(.22+i*.045,1.02,3),p(.17+i*.035,1.28,3)],'#bdb9a1',.65);
   for(const [a,d]of [[.49,.65],[1.68,.96],[1.52,1.77]]){this.poly([[a-.15,d],[a-.08,d-.11],[a+.13,d-.06],[a+.17,d+.07],[a-.05,d+.12]].map(([a,d])=>p(a,d,3)),'#6f8052');this.poly([[a-.08,d+.02],[a-.09,d-.04],[a-.01,d-.12],[a+.08,d-.04],[a+.07,d+.06]].map(([a,d])=>p(a,d,7)),'#8e9588','#6d786d',.6);this.line([p(a-.08,d-.04,7),p(a-.01,d-.12,7),p(a+.08,d-.04,7)],'#c0c1ac',1);}
   // Rounded, asymmetric shoreline in the garden's own coordinates.
   const shore=[[.49,.79],[.7,.56],[1.12,.61],[1.3,.84],[1.53,1.03],[1.7,1.37],[1.49,1.62],[1.05,1.7],[.72,1.51],[.43,1.21]],pond=(scale,color,z)=>{
    const pts=shore.map(([a,d])=>p(1.04+(a-1.04)*scale,1.16+(d-1.16)*scale,z));c.beginPath();const last=pts.at(-1);c.moveTo((last.x+pts[0].x)/2,(last.y+pts[0].y)/2);for(let i=0;i<pts.length;i++){const a=pts[i],d=pts[(i+1)%pts.length];c.quadraticCurveTo(a.x,a.y,(a.x+d.x)/2,(a.y+d.y)/2);}c.closePath();c.fillStyle=color;c.fill();
   };
   pond(1.09,'#b9b79c',3);pond(1,'#648f8b',3);pond(.9,'#86b6aa',3.2);
   for(const [a,d]of [[.72,.88],[1.38,1.4],[.92,1.53]])this.line([p(a-.08,d,3.5),p(a+.08,d,3.5)],'#b3d0bd',1);
   for(const [a,d,color]of [[.84,1.45,'#e6ce9f'],[1.42,1.2,'#c67b54']]){const q=p(a,d,4);this.ellipse(q.x,q.y,4,1.8,color);this.poly([p(a-.08,d,4),p(a-.15,d-.04,4),p(a-.15,d+.04,4)],color);this.dot(q.x+2*u,q.y,.6,'#606855');}
   for(const [a,d]of [[1.35,.29],[1.53,.71],[1.76,1.02],[1.8,1.55],[1.57,1.79],[1.24,1.85],[.63,1.74],[.38,1.52],[.31,1.09],[.44,.67]]){
    const q=p(a,d,4);this.ellipse(q.x,q.y,5,3,'#7d8c78');this.ellipse(q.x-1*u,q.y-1.5*u,3.8,2.2,snow?'#f1eee2':'#b4b7a0');
   }
   // Stone path joins the entrances, pond bridge and pavilion.
   for(const [a,d]of [[.25,1.85],[.42,1.72],[.48,1.56],[1.52,1.4],[1.7,1.22],[1.81,1.02],[1.8,.82]]){const q=p(a,d,4);this.ellipse(q.x,q.y,5,3,snow?'#e6e7dc':'#d2ceb6');}
   // Vermilion arched bridge, with individually drawn boards and two railings.
   const arch=q=>5+6*Math.sin(q*Math.PI),bridgePoint=(q,dy,z=0)=>p(.48+1.03*q,1.42+dy,arch(q)+z);
   const rail=dy=>{const points=[];for(let i=0;i<=12;i++)points.push(bridgePoint(i/12,dy,11));this.line(points,'#a44835',2.8);for(let i=0;i<=4;i++)this.line([bridgePoint(i/4,dy),bridgePoint(i/4,dy,13)],'#b9543c',2);};
   rail(-.12);
   for(let i=0;i<14;i++){const a=i/14,d=(i+1)/14;this.poly([bridgePoint(a,-.12),bridgePoint(d,-.12),bridgePoint(d,.12),bridgePoint(a,.12)],snow?'#dfb7a0':i%2?'#c46b48':'#ce7c55','#a75a3c',.4);}
   rail(.12);for(const q of [0,1])for(const dy of [-.12,.12]){const a=bridgePoint(q,dy,14);this.dot(a.x,a.y,1.8,'#dfb878');}
   // Open-sided Japanese pavilion: red timber, cream floor and hipped tile roof.
   this.t.box(x+1.12,y+.14,.63,.46,6*u,'#d0b28d','#ad8e6c','#967d60');
   for(const a of [1.17,1.69])for(const d of [.20,.55])this.line([p(a,d,6),p(a,d,30)],'#b7503d',3.5);
   for(const d of [.20,.55]){this.line([p(1.15,d,28),p(1.71,d,28)],'#ca7251',4);this.line([p(1.17,d,13),p(1.68,d,13)],'#ab4b39',2.6);}
   this.line([p(1.69,.20,28),p(1.69,.55,28)],'#b4553f',3);
   const roof=[p(1.03,.04,31),p(1.89,.04,31),p(1.89,.68,31),p(1.03,.68,31)],ridge=[p(1.31,.36,46),p(1.61,.36,46)];
   this.poly([roof[0],roof[1],ridge[1],ridge[0]],'#66776b','#4f665d',1.2);this.poly([roof[1],roof[2],ridge[1]],'#4d655c','#425a52',1.2);this.poly([roof[2],roof[3],ridge[0],ridge[1]],'#7d8d7b','#4f665d',1.2);this.poly([roof[3],roof[0],ridge[0]],'#6b8071','#4f665d',1.2);
   for(let i=1;i<7;i++){const q=i/7;this.line([p(1.03+.86*q,.68,31),p(1.31+.30*q,.36,46)],'#91a08a',.65);}
   this.line([ridge[0],ridge[1]],'#b4bca2',2.3);this.line([roof[2],roof[3]],'#a94d39',2.3);
   if(snow)this.poly([p(1.07,.65,32),p(1.85,.65,32),p(1.6,.36,47),p(1.32,.36,47)],'#edeedf');
   // Stone lantern and seasonal maple balance the two red structures.
   const lantern=p(.25,1.29);this.t.box(x+.21,y+1.25,.08,.08,18*u,'#c6c6ad','#a9ae99','#8e9988');this.ellipse(lantern.x,lantern.y-20*u,6,3,'#cccab1');this.ellipse(lantern.x,lantern.y-27*u,4,4,'#acb19b');this.dot(lantern.x,lantern.y-27*u,1.5,'#e6d39a');this.poly([{x:lantern.x-9*u,y:lantern.y-30*u},{x:lantern.x,y:lantern.y-38*u},{x:lantern.x+9*u,y:lantern.y-30*u}],snow?'#e7e9dc':'#889783');
   this.line([p(.43,.38),p(.40,.38,16),p(.46,.37,29)],'#78684c',3.2);this.line([p(.40,.38,16),p(.25,.36,26)],'#78684c',1.7);this.line([p(.43,.38,22),p(.62,.42,27)],'#78684c',1.4);for(const [a,d,r,z]of [[.26,.36,12,27],[.48,.23,15,34],[.63,.42,11,28]]){const q=p(a,d,z);for(const [dx,dy,k]of [[-.45,0,.65],[.12,-.2,.82],[.55,.15,.48]])this.ellipse(q.x+dx*r*u,q.y+dy*r*u,r*k,r*k*.60,maple[(Math.round(a*10)+(dx>0?1:0))%3]);if(snow)this.ellipse(q.x,q.y-3*u,r*.8,r*.23,'#eeeee1');}
   for(const [a,d]of [[.21,.77],[1.74,1.73]]){const q=p(a,d,5);this.ellipse(q.x,q.y,7,4,maple[0]);this.ellipse(q.x-2*u,q.y-2*u,4,3,maple[2]);}
   // A low, trained pine in the opposite corner has dark layered needle pads.
   this.line([p(1.77,1.75,3),p(1.72,1.72,16),p(1.78,1.71,26)],'#756c50',2.4);
   for(const [a,d,z,w]of [[1.66,1.70,16,9],[1.84,1.71,21,10],[1.76,1.69,29,11]]){const q=p(a,d,z);this.ellipse(q.x,q.y,w,3.6,'#405d49');this.ellipse(q.x-1*u,q.y-2*u,w*.85,3,snow?'#eaece0':'#6f8656');}
   this.streetBoard(x+.2,y+1.94,'#657b5a','庭');return;
  }
  if(b.type==='eventStage'){
   const p=(a,d,z=0)=>this.p(x+a,y+d,z*u),snow=this.snowy(),lit=!b.closed&&E.operational(this.t.state,b,this.t.net);
   // Raised timber deck, brass-edged apron and a broad central stair.
   this.t.diamond(x+.04,y+.04,2.92,1.92,'#cfc5ad');this.t.box(x+.16,y+.15,2.68,1.03,18*u,'#c8a575','#a18059','#80684e');
   for(let i=0;i<8;i++){const d=.18+i*.13;this.line([p(.19,d,18.3),p(2.81,d,18.3)],'#aa875f',.7);for(const a of [.72+(i%2)*.35,1.75+(i%2)*.25])this.line([p(a,d,18.3),p(a,d+.12,18.3)],'#ad8b63',.6);}
   this.line([p(.18,1.18,18),p(2.82,1.18,18)],'#e1c18a',2);
   // Deep backdrop with actual curtain folds, valance and tied side drapes.
   const backdrop=()=>{
   this.poly([p(.22,.2,18),p(2.78,.2,18),p(2.78,.2,67),p(.22,.2,67)],'#614d59','#514551',1);
   for(let i=0;i<18;i++){const a=.24+i*.14;this.poly([p(a,.205,19),p(a+.07,.205,19),p(a+.07,.205,66),p(a,.205,66)],i%2?'#866573':'#a57a83');}
   for(const [a,d]of [[.23,.62],[2.38,2.77]]){this.poly([p(a,.22,66),p(d,.22,66),p(d-.07,.22,45),p(d-.04,.22,19),p(a,.22,19)],'#915c69','#714b58',.6);this.line([p(a+.02,.23,42),p(d-.06,.23,42)],'#dfb56f',2);}
   for(let i=0;i<8;i++){const a=.23+i*.32;this.poly([p(a,.23,67),p(a+.32,.23,67),p(a+.28,.23,58),p(a+.16,.23,55),p(a+.03,.23,59)],'#a76d79','#80535f',.5);}
   };if([0,3].includes(E.rotation(b)))backdrop();
   // Open-front roof and braced lighting rig leave the stage visible.
   for(const a of [.22,2.78])for(const d of [.18,1.12]){this.line([p(a,d,18),p(a,d,75)],'#5e7873',3);for(let i=0;i<4;i++)this.line([p(a-.035,d,23+i*12),p(a+.035,d,35+i*12)],'#91a39a',.7);}
   this.poly([[.08,.08],[2.92,.08],[2.92,.70],[.08,.70]].map(([a,d])=>p(a,d,77)),snow?'#e4e8da':'#648b80','#476e66',1.5);
   for(let i=0;i<9;i++)this.line([p(.12+i*.34,.1,77.3),p(.12+i*.34,.68,77.3)],snow?'#cbd4c7':'#85a295',.7);
   for(const d of [.72,1.12]){this.line([p(.22,d,72),p(2.78,d,72)],'#6b827c',3);this.line([p(.22,d,67),p(2.78,d,67)],'#8f9e91',1.2);for(let i=0;i<10;i++){const a=.22+i*.256;this.line([p(a,d,67),p(a+.256,d,72)],'#a4b1a0',.7);}}
   for(const a of [.52,1.17,1.83,2.48]){this.line([p(a,.74,68),p(a,.74,63)],'#53655f',1.8);const q=p(a,.74,61);this.ellipse(q.x,q.y,4,3,'#4d5c57');this.ellipse(q.x,q.y+1*u,2.7,1.7,lit?'#f5db96':'#a9b6a5');}
   // Paired speaker stacks, wedge monitors and microphone with tripod base.
   for(const a of [.31,2.43]){this.t.box(x+a,y+.83,.25,.22,37*u,'#596965','#3f504c','#34443f');for(const z of [23,32]){const q=p(a+.125,1.05,z);this.ellipse(q.x,q.y,4.2,4.5,'#263d38');this.ellipse(q.x,q.y,2.3,2.5,'#74877a');}}
   for(const a of [.78,2.0])this.poly([p(a,1.04,19),p(a+.24,1.04,19),p(a+.24,.92,25),p(a,.92,25)],'#50615b','#354b43',.8);
   this.line([p(1.5,.84,18),p(1.5,.84,46)],'#455a52',1.6);const mic=p(1.5,.84,47);this.ellipse(mic.x,mic.y,3.2,2.1,'#dfd7bc');for(const a of [-.10,0,.10])this.line([p(1.5,.84,21),p(1.5+a,.84+Math.abs(a),18)],'#455a52',.9);
   for(const [d,z]of [[1.18,12],[1.35,6]]){this.t.box(x+1.02,y+d,.96,.16,z*u,'#d4b687','#a98a60','#8d7455');this.line([p(1.03,d+.16,z),p(1.97,d+.16,z)],'#eed7a5',1);}
   if([0,3].includes(E.rotation(b)))for(const a of [.48,2.03])for(const d of [1.57,1.83]){for(const leg of [.04,.34])this.line([p(a+leg,d,0),p(a+leg,d,7)],'#64776a',1.3);this.t.box(x+a,y+d,.42,.09,8*u,'#bd9c6d','#9e825d','#897454');}
   if([1,2].includes(E.rotation(b)))backdrop();
   const sign=p(1.5,1.13,75);this.poly([p(1.05,1.13,68),p(1.95,1.13,68),p(1.95,1.13,82),p(1.05,1.13,82)],'#e9d3a0','#887959',.8);this.label('まちのステージ',sign.x,sign.y+3*u,8,'#536958');
   if(this.t.state.project==='summer')for(let i=0;i<7;i++){const q=p(.35+i*.38,1.15,58);this.ellipse(q.x,q.y,3.5,5,i%2?'#e4c073':'#c98571');}
   return;
  }
  if(b.type==='flowerbed'){
   const season=E.season(this.t.state),summer=season==='夏',winter=season==='冬',colors=season==='春'?['#ed9db3','#f1cf61','#f5e9cf']:summer?['#f4cd49','#edb83c','#f6db69']:season==='秋'?['#c77b9a','#db9b62','#e7b4bf']:['#a89bc1','#e5dcb6','#c1acc5'];
   this.t.box(x+.07,y+.07,.86,.86,5*u,'#c8a482','#b28d72','#9d7e64');this.poly([[.14,.14],[.86,.14],[.86,.86],[.14,.86]].map(([dx,dy])=>this.p(x+dx,y+dy,6*u)),'#847956');
   for(let row=0;row<3;row++)for(let col=0;col<3;col++){
    const dx=.23+col*.27,dy=.23+row*.27,base=this.p(x+dx,y+dy,6*u),top=this.p(x+dx,y+dy,(summer?21: winter?11:16)*u),color=colors[(row+col)%3];
    this.line([base,top],'#69854d',1.4);this.ellipse(base.x-2*u,base.y-2*u,3,1.5,'#8da562');
    if(winter){this.ellipse(top.x,top.y,5,3.5,'#8d9e72');this.ellipse(top.x,top.y-1*u,3.8,2.8,color);this.dot(top.x,top.y-1*u,1.5,'#e9dfbc');}
    else {for(let i=0;i<(summer?8:5);i++){const angle=i*Math.PI*2/(summer?8:5),radius=summer?3.5:2.8;this.ellipse(top.x+Math.cos(angle)*radius*u,top.y+Math.sin(angle)*radius*u,summer?2.6:2.5,summer?2:2.2,color);}this.dot(top.x,top.y,summer?2.6:1.4,summer?'#8d6c42':'#e7c666');}
   }
   if(this.snowy()){for(const [dx,dy]of [[.14,.12],[.5,.12],[.85,.12],[.88,.5],[.88,.86]]){const p=this.p(x+dx,y+dy,7*u);this.ellipse(p.x,p.y,5,2,'#f7f4e7');}}
   return;
  }
  if(b.type==='shrine'){
   this.t.diamond(x+.05,y+.05,.9,.9,'#c4c8ac');this.t.diamond(x+.41,y+.4,.18,.6,'#dcd2b9');
   // Use ground-plane depth: an entrance on the far side must sit behind the roof.
   const front=this.p(x+.5,y+.86).y>this.p(x+.5,y+.33).y;
   const gate=()=>{for(const dx of [.18,.82])this.line([this.p(x+dx,y+.86),this.p(x+dx,y+.86,40*u)],'#aa5f45',4);this.line([this.p(x+.08,y+.86,43*u),this.p(x+.5,y+.86,40*u),this.p(x+.92,y+.86,43*u)],'#a35640',5);this.line([this.p(x+.14,y+.86,32*u),this.p(x+.86,y+.86,32*u)],'#b87955',3);const plaque=this.p(x+.5,y+.86,33*u);this.label('神',plaque.x,plaque.y,9,'#f4dfb3');};
   if(!front)gate();
   this.t.box(x+.19,y+.13,.62,.42,31*u,'#6e8175','#b78e69','#947355');
   const z=32*u;this.poly([this.p(x+.1,y+.08,z),this.p(x+.9,y+.08,z),this.p(x+.9,y+.59,z),this.p(x+.1,y+.59,z)],'#6a8175','#556f63');this.poly([this.p(x+.08,y+.58,z),this.p(x+.5,y+.33,52*u),this.p(x+.92,y+.58,z)],'#82978a','#526e61');this.poly([this.p(x+.08,y+.07,z),this.p(x+.5,y+.33,52*u),this.p(x+.92,y+.07,z)],'#6c8579','#526e61');
   
   if(front){const door=this.p(x+.5,y+.57,24*u);this.line([door,this.p(x+.5,y+.57,8*u)],'#584e3c',6);gate();}
   return;
  }
  if(b.type==='tower'){
   const center=[x+1,y+1],m=this.p(...center);this.t.diamond(x+.04,y+.04,1.92,1.92,'#c5ceb1');this.t.diamond(x+.65,y+.2,.7,1.7,'#e9ddbc');
   this.t.box(x+.35,y+.35,1.3,1.3,18*u,'#dcc898','#b7a779','#8b9878');
   for(const [dx,dy] of [[.5,.5],[1.5,.5],[1.5,1.5],[.5,1.5]])this.line([this.p(x+dx,y+dy,18*u),this.p(...center,196*u)],'#648779',7);
   for(const z of [55,90,125,160])this.line([this.p(x+.65,y+.65,z*u),this.p(x+1.35,y+1.35,z*u)],'#d6b46b',3);
   this.t.box(x+.9,y+.9,.2,.2,235*u,'#e2c578','#a2b79e','#6a8a7d');
   const a=this.p(x+.45,y+1.55,190*u),d=this.p(x+1.55,y+1.55,190*u),e=this.p(x+1.55,y+.45,190*u);
   this.poly([{x:a.x,y:a.y-25*u},{x:d.x,y:d.y-25*u},d,a],'#d7e9df','#a98c49');this.poly([{x:d.x,y:d.y-25*u},{x:e.x,y:e.y-25*u},e,d],'#88b3a4','#a98c49');
   for(const q of [.25,.5,.75])this.line([{x:a.x+(d.x-a.x)*q,y:a.y-23*u},{x:a.x+(d.x-a.x)*q,y:a.y-2*u}],'#aa965c',1.4);
   this.poly([this.p(x+.4,y+.4,218*u),this.p(x+1.6,y+1.6,218*u),this.p(...center,245*u)],'#b7c9a4','#8c7845');
   this.line([this.p(...center,236*u),this.p(...center,257*u)],'#b69a52',3);const star=this.p(...center,260*u);this.dot(star.x,star.y,4,'#f5d87a');
   // A monumental Kotsumaru sculpture hugs the tower; it is architecture, not a pedestrian.
   if(root.KMascot){root.KMascot.draw(c,m.x-26*u,m.y-65*u,4.8*u,0,'cling',1);this.ellipse(m.x+17*u,m.y-130*u,10,7,'#b48a5c');this.line([{x:m.x+12*u,y:m.y-131*u},{x:m.x+21*u,y:m.y-128*u}],'#8b6845',1);}
   this.bench(x+.12,y+1.72);this.pot(x+1.78,y+1.65,'#d3b35d',.9);const label=this.p(x+1,y+1.72,8*u);this.label('商店街の頂点',label.x,label.y,10,'#8e753e');return;
  }
  if(b.type==='grandpark'){
   const p=(a,d,z=0)=>this.p(x+a,y+d,z*u),snow=this.snowy(),props=[],add=(a,d,draw)=>{const w=E.toWorld(b,a,d);props.push({depth:w[0]+w[1],draw});};
   this.t.diamond(x+.04,y+.04,3.92,3.92,this.seasonPalette().park);this.t.diamond(x+1.78,y,.44,4,'#e1d4b1');this.t.diamond(x,y+1.78,4,.44,'#e1d4b1');
   for(let i=0;i<12;i++){const q=.1+i*.33;this.line([p(1.8,q),p(2.2,q)],'#cbbf9f',.5);this.line([p(q,1.8),p(q,2.2)],'#cbbf9f',.5);}
   // Distinct play surfaces leave the cross-shaped walking route clear.
   this.t.diamond(x+.29,y+.49,1.17,1.10,snow?'#e3e4d5':'#c7ad93');this.t.diamond(x+2.49,y+.38,1.13,1.09,snow?'#e3e4d5':'#b0bc94');
   const pond=p(2,2);this.ellipse(pond.x,pond.y,25,14,'#b7bca5');this.ellipse(pond.x,pond.y-3*u,21,11,'#86b8b1');
   add(2,2,()=>{this.line([p(2,2,4),p(2,2,25)],'#dcebdd',2.3);for(const a of [-.1,.1])this.line([p(2,2,20),p(2+a,2,13),p(2+a*1.6,2,4)],'#c3dfd4',1);});
   // Roofed play tower, ladder and blue slide with raised edges.
   add(.88,1.06,()=>{
    for(const a of [.46,.82])for(const d of [.64,.97])this.line([p(a,d,0),p(a,d,25)],'#ad8958',2.2);
    this.t.box(x+.43,y+.61,.43,.40,25*u,'#dec18a','#b89762','#977c53');
    for(const d of [.63,.97]){this.line([p(.45,d,34),p(.82,d,34)],'#c97455',2);for(const a of [.46,.64,.81])this.line([p(a,d,25),p(a,d,34)],'#d28b5d',1.3);}
    this.poly([p(.35,.54,36),p(.65,.78,46),p(.94,.54,36)],snow?'#e6dfca':'#bd7059','#985b48',.7);this.poly([p(.35,1.07,36),p(.65,.78,46),p(.94,1.07,36)],snow?'#eee8d9':'#dc9573','#985b48',.7);
    this.poly([p(.84,.68,25),p(1.39,.68,4),p(1.43,.93,3),p(.84,.93,25)],'#87b6bd','#497e8a',.8);
    for(const d of [.67,.94])this.line([p(.84,d,29),p(1.38,d,8),p(1.46,d,6)],'#518e9e',2.2);
    for(const a of [.49,.78])this.line([p(a,1.01,25),p(a,1.48,2)],'#977b55',1.8);for(let i=0;i<5;i++){const q=i/4;this.line([p(.49,1.01+.47*q,25-23*q),p(.78,1.01+.47*q,25-23*q)],'#d6bb84',1.6);}
   });
   // Two-seat swing: A-frame supports and straight, static chains.
   add(3.04,.94,()=>{
    for(const a of [2.58,3.51])for(const d of [.55,1.30])this.line([p(a,d,0),p(a,.92,35)],'#698b80',2.8);
    this.line([p(2.50,.92,36),p(3.59,.92,36)],'#c58b5f',3.7);
    for(const a of [2.86,3.22]){for(const dx of [-.10,.10])this.line([p(a+dx,.92,34),p(a+dx,.92,9)],'#718079',.8);this.poly([p(a-.13,.82,9),p(a+.13,.82,9),p(a+.13,1.02,9),p(a-.13,1.02,9)],'#cb9571','#a87854',.6);}
   });
   // Timber-edged sandbox with a bucket, spade and small sand mound.
   add(.96,3.05,()=>{
    this.t.box(x+.42,y+2.62,1.04,.79,4*u,'#c39c6b','#a6875d','#8f7655');this.t.diamond(x+.50,y+2.70,.88,.63,snow?'#eee6d1':'#ecd5a4',4*u);
    const q=p(.88,3.03,5);this.ellipse(q.x,q.y,7,3,'#d9be87');this.ellipse(q.x,q.y-2*u,4,2,'#e9d09a');this.t.box(x+1.13,y+2.82,.12,.12,9*u,'#a4c9ca','#6f9fa8','#5e8691');this.line([p(.68,3.10,5),p(.78,3.23,6)],'#b67958',1.1);this.poly([p(.65,3.06,5),p(.73,3.06,5),p(.73,3.12,5),p(.65,3.12,5)],'#8aa7a0');
   });
   for(const [a,d]of [[.28,.30],[1.40,.28],[3.72,.27],[.27,3.72],[3.70,3.70]])add(a,d,()=>this.tree(x+a,y+d,t));
   for(const [a,d]of [[2.62,2.72],[2.62,3.30]])add(a,d,()=>this.bench(x+a,y+d));
   for(const [a,d]of [[1.45,2.65],[2.65,1.48]])add(a,d,()=>this.pot(x+a,y+d,'#d4a17f',.85));
   for(const [gx,gy,dx,dy]of [[2,.08,1,0],[2,3.92,1,0],[.08,2,0,1],[3.92,2,0,1]])add(gx,gy,()=>{for(const side of [-1,1])this.line([p(gx+side*.38*dx,gy+side*.38*dy),p(gx+side*.38*dx,gy+side*.38*dy,12)],'#778f70',3);});
   props.sort((a,b)=>a.depth-b.depth);for(const item of props)item.draw();
   const sign=p(2.5,3.75,12);this.line([p(2.5,3.75),sign],'#967c58',1.6);this.ellipse(sign.x,sign.y,15,5,'#e5d4aa');this.label('大公園',sign.x,sign.y+2*u,8,'#466d50');return;
  }
  if(b.type==='plaza'){this.t.diamond(x+.04,y+.04,f.w-.08,f.h-.08,this.seasonPalette().park);this.t.diamond(x+.75,y,.3,2,'#ddd1b2');this.t.diamond(x,y+.82,2,.3,'#ddd1b2');const p=this.p(x+1,y+1);this.ellipse(p.x,p.y,18,10,'#c3c4aa');this.ellipse(p.x,p.y-4*u,14,7,'#9cc5bd');this.line([{x:p.x,y:p.y-4*u},{x:p.x,y:p.y-16*u}],'#b8d5c9',2);this.tree(x+.38,y+.4,t);this.tree(x+1.62,y+1.55,t);this.bench(x+.6,y+1.6);return;}
  if(b.type==='bench'){this.bench(x+.12,y+.38);this.lamp(x+.83,y+.2);this.pot(x+.8,y+.82,'#bf9f91',.7);return;}
  if(b.type==='paidBicycle'){
   this.t.diamond(x+.04,y+.04,1.92,.92,'#b7c4b4');
   for(const dx of [.2,.62,1.04,1.46]){this.line([this.p(x+dx,y+.23),this.p(x+dx,y+.76)],'#e7e4cd',1.5);this.bike(x+dx,y+.53);}
   this.t.box(x+1.78,y+.12,.13,.17,22*u,'#e4d6aa','#b8b896','#8f9f88');
   const p=this.p(x+1.85,y+.2,28*u);this.label('輪',p.x,p.y,10,'#50776a');
   this.line([this.p(x+1.74,y+.77,8*u),this.p(x+1.94,y+.77,8*u)],'#c9ac6c',2.5);
   return;
  }
  if(b.type==='paidParking'){
   this.t.diamond(x+.04,y+.04,.92,.92,'#a9b5ae');
   this.line([this.p(x+.12,y+.15),this.p(x+.12,y+.83),this.p(x+.62,y+.83)],'#f3eedc',1.7);
   this.car(x+.18,y+.2,'#acc0ba');
   this.t.box(x+.77,y+.15,.12,.15,23*u,'#e1d9b9','#b8b79f','#8c9f94');
   const p=this.p(x+.83,y+.22,30*u);this.label('P',p.x,p.y,13,'#456c64');
   this.line([this.p(x+.7,y+.73,9*u),this.p(x+.94,y+.73,9*u)],'#e0b47a',3);
   return;
  }
  if(b.type==='terrace'){
   this.t.diamond(x+.04,y+.04,.92,.92,'#bdab8b');
   for(let i=1;i<6;i++)this.line([this.p(x+.07,y+i*.15),this.p(x+.93,y+i*.15)],'#a89578',.8);
   for(const [a,d]of [[[.08,.08],[.92,.08]],[[.08,.08],[.08,.92]],[[.92,.08],[.92,.92]],[[.08,.92],[.33,.92]],[[.67,.92],[.92,.92]]]){
    this.line([this.p(x+a[0],y+a[1],9*u),this.p(x+d[0],y+d[1],9*u)],'#927f61',2);
    for(const q of [a,d])this.line([this.p(x+q[0],y+q[1]),this.p(x+q[0],y+q[1],11*u)],'#927f61',1.5);
   }
   this.t.diamond(x+.37,y+.68,.26,.3,'#ded0ad',1*u);
   this.table(x+.49,y+.35,true);
   this.pot(x+.14,y+.17,'#9aaf75');this.pot(x+.84,y+.17,'#c69a93');
   return;
  }
  if(b.type==='parking'){this.t.diamond(x+.05,y+.05,f.w-.1,f.h-.1,'#bdc3b5');for(let i=0;i<3;i++){const xx=x+.15+i*.54;this.line([this.p(xx,y+.15),this.p(xx,y+1.15)],'#eee9d3',1.6);this.car(xx+.06,y+.25,['#f0dfb9','#94afb0','#bf8b76'][i]);}const p=this.p(x+1,y+1.65);this.label('P',p.x,p.y,20,'#f5f0d9');return;}
  if(b.type==='bicycle'){for(let i=0;i<4;i++)this.bike(x+.18+i*.42,y+.48);return;}
  if(b.type==='arcade'){for(const dx of [.13,f.w-.13])for(const dy of [.13,.87])this.line([this.p(x+dx,y+dy),this.p(x+dx,y+dy,48*u)],'#75998a',2.7);this.poly([this.p(x+.04,y+.04,49*u),this.p(x+f.w-.04,y+.04,49*u),this.p(x+f.w-.04,y+.96,49*u),this.p(x+.04,y+.96,49*u)],'#afd1c2dc','#7c9e92',2);for(let i=0;i<=f.w*4;i++)this.line([this.p(x+i*.25,y+.04,50*u),this.p(x+i*.25,y+.96,50*u)],'#e5eddaaa',1.5);this.line([this.p(x+.04,y+.96,48*u),this.p(x+f.w-.04,y+.96,48*u)],'#73988a',3);return;}
  if(b.type==='disaster'){this.t.box(x+.16,y+.16,.46,.48,29*u,'#c7d0bb','#aebfa8','#8fa595');this.t.box(x+.6,y+.42,.22,.3,17*u,'#cba67a','#b38b60','#9f7a50');const p=this.p(x+.4,y+.4,30*u);this.label('防',p.x,p.y,12,'#f7edd4');this.line([this.p(x+.66,y+.18),this.p(x+.66,y+.18,33*u)],'#b38067',4);}
 }
 circus(b,op){
  const x=b.x,y=b.y,u=this.u,c=this.c,p=(a,d,z=0)=>this.p(x+a,y+d,z*u),red=op?'#b74f50':'#99857b',cream=op?'#f5e2b7':'#d7cdb5',gold=op?'#d6ae58':'#b8a78a',ink='#584336',points=[];
  const star=(q,r,color)=>{const a=[];for(let i=0;i<10;i++){const t=-Math.PI/2+i*Math.PI/5,rr=(i%2?r*.43:r)*u;a.push({x:q.x+Math.cos(t)*rr,y:q.y+Math.sin(t)*rr});}this.poly(a,color);};
  this.t.diamond(x+.06,y+.06,2.88,2.88,'#d4c39e');
  // Double-sided animal medallions are small physical signboards, not live animals.
  const animal=(xx,yy,kind)=>{
   this.line([p(xx,yy,2),p(xx,yy,43)],ink,3.5);
   const q=p(xx,yy,45);c.save();c.translate(q.x,q.y);c.scale(u,u);
   const oval=(a,d,rx,ry,col)=>{c.fillStyle=col;c.beginPath();c.ellipse(a,d,rx,ry,0,0,Math.PI*2);c.fill();};
   oval(1.5,1.5,24,26,'#74533c');oval(0,0,24,26,gold);oval(0,-.5,21,23,cream);oval(0,0,19,21,kind==='lion'?'#527b80':'#536d59');
   for(let i=0;i<10;i++){const t=i*Math.PI/5;oval(Math.cos(t)*21,Math.sin(t)*23,1.2,1.2,'#fff0be');}
   if(kind==='lion'){
    for(let i=0;i<12;i++){const t=i*Math.PI/6;oval(Math.cos(t)*11,Math.sin(t)*12,6,7,i%2?'#a86632':'#bd7e37');}
    oval(-9,-9,4,4,'#e4b35b');oval(9,-9,4,4,'#e4b35b');oval(0,0,12,13,'#ecc16c');oval(0,6,9,7,'#f4dfaf');
   }else{
    oval(-10,-10,5,5,ink);oval(10,-10,5,5,ink);oval(-10,-10,3,3,'#edb279');oval(10,-10,3,3,'#edb279');oval(0,0,14,14,'#df9141');oval(0,7,11,8,'#f9e8c5');
    const stripe=(pts)=>{c.fillStyle=ink;c.beginPath();pts.forEach(([a,d],i)=>i?c.lineTo(a,d):c.moveTo(a,d));c.closePath();c.fill();};
    stripe([[-2,-14],[0,-5],[2,-14]]);c.strokeStyle=ink;c.lineWidth=1.7;for(const yy of [-11,-8]){c.beginPath();c.moveTo(-5,yy);c.lineTo(5,yy);c.stroke();}for(const sign of [-1,1]){stripe([[sign*13,-7],[sign*5,-4],[sign*13,-1]]);stripe([[sign*14,1],[sign*7,4],[sign*13,6]]);}
   }
   oval(-5,-1,1.7,2.2,ink);oval(5,-1,1.7,2.2,ink);oval(-5.3,-1.7,.5,.7,'#fff6db');oval(4.7,-1.7,.5,.7,'#fff6db');
   oval(-3.5,6,4,3.2,'#fff0cf');oval(3.5,6,4,3.2,'#fff0cf');c.fillStyle=ink;c.beginPath();c.moveTo(-3,3);c.lineTo(3,3);c.lineTo(0,6);c.closePath();c.fill();c.strokeStyle=ink;c.lineWidth=1;c.beginPath();c.moveTo(0,6);c.lineTo(0,9);c.moveTo(-4,9);c.quadraticCurveTo(0,12,4,9);c.stroke();c.restore();
   this.t.box(x+xx-.15,y+yy-.1,.3,.2,4*u,gold,'#a9834e','#8b6c45');
  };
  const decorations=[{a:.48,d:2.73,paint:()=>animal(.48,2.73,'tiger')},{a:2.52,d:2.73,paint:()=>animal(2.52,2.73,'lion')}];
  const center=p(1.5,1.45),front=p(1.5,2.73),frontVisible=front.y>center.y;
  for(const d of decorations)if(p(d.a,d.d).y<center.y)d.paint();
  for(let i=0;i<24;i++){const a=i*Math.PI/12;points.push([1.5+1.27*Math.cos(a),1.45+1.19*Math.sin(a)]);}
  const peak=p(1.5,1.45,99),panels=points.map((a,i)=>({a,d:points[(i+1)%24],i})).sort((a,b)=>p(...a.a).y+p(...a.d).y-p(...b.a).y-p(...b.d).y);
  // Sort using the rotated world projection so rear fabric stays behind the roof.
  for(const {a,d,i}of panels){const shade=Math.floor(i/2)%2?cream:red;this.poly([p(...a,4),p(...d,4),p(...d,39),p(...a,39)],shade,'#75544355',.7);}
  for(const {a,d,i}of panels){const fill=Math.floor(i/2)%2?cream:red,hiA=p(...a,39),hiD=p(...d,39),g=c.createLinearGradient(peak.x,peak.y,hiD.x,hiD.y);g.addColorStop(0,Math.floor(i/2)%2?'#fff0d1':'#d47768');g.addColorStop(1,fill);this.poly([hiA,hiD,peak],g,'#7a514f33',.65);if(i%2===0)this.line([peak,hiA],'#f4ddb357',.7);}
  for(const {a,d,i}of panels){if(p((a[0]+d[0])/2,(a[1]+d[1])/2).y<center.y)continue;const q=p((a[0]+d[0])/2,(a[1]+d[1])/2,37);this.ellipse(q.x,q.y,6,3.6,i%4<2?cream:red);}
  this.line([peak,p(1.5,1.45,113)],ink,2);
  this.poly([p(1.5,1.45,113),p(2.01,1.45,109),p(1.5,1.45,103)],'#4e7c7d',ink,.5);star(p(1.66,1.45,108),2.3,gold);
  if(frontVisible){
   // The opening and curtains follow the front plane, instead of floating over the roof.
   this.poly([p(1.13,2.66,3),p(1.87,2.66,3),p(1.87,2.66,28),p(1.5,2.66,40),p(1.13,2.66,28)],'#3e3840');
   for(const sign of [-1,1]){const a=1.5+sign*.37;this.poly([p(a,2.68,3),p(a-sign*.04,2.68,30),p(1.5,2.68,40),p(a-sign*.15,2.68,17)],'#943f49');this.line([p(a,2.69,28),p(a-sign*.15,2.69,17),p(a,2.69,13)],gold,1.4);}
   this.poly([p(1.12,2.69,43),p(1.88,2.69,43),p(1.88,2.69,54),p(1.12,2.69,54)],'#456d73',gold,1.8);
   const q=p(1.5,2.7,49);this.label('CIRCUS',q.x,q.y+3*u,9,'#ffedbf');
   this.poly([p(1.12,2.66,2),p(1.88,2.66,2),p(1.88,2.98,2),p(1.12,2.98,2)],red,gold,1);
   const booth=()=>{this.t.box(x+2.49,y+2.26,.4,.36,24*u,cream,red,'#94484a');this.poly([p(2.46,2.23,26),p(2.92,2.23,26),p(2.92,2.66,26),p(2.46,2.66,26)],'#45777b',gold,1);const a=p(2.68,2.64,18);this.ellipse(a.x,a.y,7,5,'#493f3d');};booth();
  }
  for(const d of decorations)if(p(d.a,d.d).y>=center.y)d.paint();
  // Thin bunting and guy ropes add detail while staying inside the three-tile plot.
  for(const [a,d]of [[.22,.35],[2.78,.35]]){this.line([p(a,d,2),p(a,d,42)],'#846443',1.7);this.line([p(a,d,42),p(1.5,1.45,99)],'#a78c65aa',.65);this.poly([p(a,d,42),p(a+.2,d,38),p(a,d,34)],'#507d80',gold,.5);}
 }
 bench(x,y){const u=this.u;for(let i=0;i<3;i++)this.t.box(x,y+i*.06,.62,.045,11*u,'#bc9164','#a98259','#92734e');for(const dx of [.08,.52])this.line([this.p(x+dx,y+.05,11*u),this.p(x+dx,y+.05)],'#817b61',2);this.t.box(x,y-.01,.62,.04,22*u,'#b68a60','#a47d55','#92734e');}
 lamp(x,y){const p=this.p(x,y),u=this.u;this.line([p,{x:p.x,y:p.y-43*u},{x:p.x+10*u,y:p.y-43*u}],'#668575',2.1);this.ellipse(p.x+10*u,p.y-41*u,5,3,'#f5e4ae');this.ellipse(p.x,p.y,3,1.5,'#7a876b');}
 car(x,y,color){const u=this.u;this.t.box(x,y,.38,.65,10*u,color,color,'#89998f');this.t.box(x+.04,y+.16,.3,.3,19*u,'#a4bcb7',color,'#859e98');for(const dy of [.1,.53]){const p=this.p(x+.38,y+dy);this.ellipse(p.x,p.y-2*u,3,4,'#62726a');}}
 bike(x,y){const p=this.p(x,y),u=this.u;const a={x:p.x-8*u,y:p.y-2*u},b={x:p.x+8*u,y:p.y+5*u};for(const q of [a,b]){this.c.strokeStyle='#6d857c';this.c.lineWidth=1.3*u;this.c.beginPath();this.c.ellipse(q.x,q.y,5*u,6*u,0,0,7);this.c.stroke();}this.line([a,{x:p.x+1*u,y:p.y-10*u},b,a],'#a88568',1.4);}
 tree(x,y,t){const p=this.p(x,y),u=this.u,season=E.season(this.t.state),colors=this.seasonPalette().trees;
  this.ellipse(p.x+3*u,p.y+3*u,17,6,'#53684724');this.line([p,{x:p.x,y:p.y-37*u}],'#876d53',4);
  if(season==='冬'&&Math.abs(Math.round(x*13+y*17))%3!==0){
   for(const [dx,z]of [[-15,28],[14,34],[-10,42],[8,47]]){const branch={x:p.x+dx*u,y:p.y-z*u};this.line([{x:p.x,y:p.y-(z-13)*u},branch],'#8d7866',2);this.line([branch,{x:branch.x+dx*.35*u,y:branch.y-8*u}],'#9b8875',1);}
   if(this.snowy())this.line([{x:p.x-13*u,y:p.y-30*u},{x:p.x,y:p.y-22*u},{x:p.x+12*u,y:p.y-34*u}],'#f7faf7',3);return;
  }
  if(season==='冬'){for(let i=0;i<3;i++){const z=46-i*11,w=11+i*5;this.poly([{x:p.x,y:p.y-(z+13)*u},{x:p.x+w*u,y:p.y-(z-7)*u},{x:p.x-w*u,y:p.y-(z-7)*u}],colors[i]);if(this.snowy())this.line([{x:p.x-w*.6*u,y:p.y-z*u},{x:p.x,y:p.y-(z+10)*u},{x:p.x+w*.6*u,y:p.y-z*u}],'#f7faf7',3);}return;}
  for(let i=0;i<9;i++){const a=i*2.4,rr=(i%3)*5;this.ellipse(p.x+Math.cos(a)*rr*u,p.y-(30+Math.sin(a)*8+(i%2)*6)*u,12+(i%2)*3,12+(i%3),colors[i%3]);}
  if(season==='春')for(let i=0;i<6;i++)this.dot(p.x+Math.cos(i*2)*12*u,p.y-(31+Math.sin(i*2)*13)*u,1.8,'#fff0e8');
 }
 backdrop(){const c=this.c,n=this.t.state.size,palette=this.seasonPalette();const g=c.createLinearGradient(0,0,0,760);g.addColorStop(0,palette.sky[0]);g.addColorStop(1,palette.sky[1]);c.fillStyle=g;c.fillRect(0,0,1100,760);const mid=this.p(n/2,n/2);this.ellipse(mid.x+8,mid.y+45,420,205,'#60734b0c');const a=this.p(0,n),b=this.p(n,n),d=this.p(n,0);this.poly([a,b,{x:b.x,y:b.y+16},{x:a.x,y:a.y+16}],palette.edge[0]);this.poly([b,d,{x:d.x,y:d.y+16},{x:b.x,y:b.y+16}],palette.edge[1]);}
 tile(x,y,road,connected){if(road==='castleRoad'){this.steppingPath(x,y,connected);return;}const season=E.season(this.t.state),palette=this.seasonPalette(),snow=this.snowy(),color=typeof road==='string'?E.F(road)?.roadColor:null;this.t.diamond(x,y,1,1,road?(color||(connected?palette.road:'#bfc2b6')):snow?'#eaf0e9':palette.grass[(x+y)%2]);if(road&&color&&!connected)this.t.diamond(x,y,1,1,'#d7d9cc66');
  if(road){for(let i=1;i<4;i++){this.line([this.p(x+i*.25,y),this.p(x+i*.25,y+1)],'#a9957648',.7);this.line([this.p(x,y+i*.25),this.p(x+1,y+i*.25)],'#a9957648',.7);}}
  const empty=!E.at(this.t.state,x,y),hash=(x*73+y*29)%11,p=this.p(x+.2+hash*.04,y+.4);
  if(empty&&season==='春'){for(let i=0;i<3;i++){const xx=p.x+(i-1)*7*this.u,yy=p.y+(i%2)*4*this.u;this.dot(xx,yy,2.1,['#ed9bb8','#f9e4ba','#fff5df'][i]);}}
  else if((empty||road)&&season==='秋'){for(let i=0;i<3;i++)this.ellipse(p.x+(i-1)*9*this.u,p.y+(i%2)*4*this.u,2.8,1.4,['#bb6840','#da9c45','#a96b3d'][i]);}
  else if(empty){this.dot(p.x,p.y,1.3,season==='冬'?'#9b9e86':'#568a4d');this.dot(p.x+5*this.u,p.y+2*this.u,1,season==='冬'?'#e2dfcf':'#d9eaa6');}
  if(snow&&(empty||road))this.ellipse(p.x+8*this.u,p.y,road?6:14,road?2:5,'#f8faf4dd');
 }
 seasonAir(t){const season=E.season(this.t.state),snow=this.snowy();if(!snow&&!['春','秋'].includes(season))return;const c=this.c,n=this.t.state.size,time=this.t.motion?t/18000:0,count=Math.min(22,Math.max(12,n));c.save();c.globalAlpha=.65;
  for(let i=0;i<count;i++){const x=((i*.618+time*.24)%1)*n,y=((i*.383+time*.35)%1)*n,p=this.p(x,y);p.y-=18+(i%5)*14;const r=this.u*(snow?2:3.2);c.fillStyle=snow?'#fffdf7':season==='春'?['#f4a9c0','#ffe1e8'][i%2]:['#b96739','#e6a849'][i%2];c.beginPath();c.ellipse(p.x+Math.sin(i+time*8)*7,p.y,r,r*(snow?1:.5),i+time*3,0,Math.PI*2);c.fill();}c.restore();
 }
 person(x,y,seg,t,bag,pose){const p=this.p(x+.5,y+.5),u=this.u,small=seg===3?.78:1,still=pose==='rest'||pose==='wait',bounce=this.t.motion&&!still?Math.sin(t/130)*1.0:0,colors=['#6b8a9e','#b58a83','#a1936b','#779d8a'],c=this.c;this.ellipse(p.x,p.y,5,2,'#667e5326');if(pose==='rest')p.y-=5*u;const step=this.t.motion&&!still?Math.sin(t/140)*2:0;
  this.line([{x:p.x-2*u,y:p.y-5*u},{x:p.x+(-2+step)*u,y:p.y}], '#6a7568',2);this.line([{x:p.x+2*u,y:p.y-5*u},{x:p.x+(2-step)*u,y:p.y}], '#6a7568',2);
  const head=p.y-(19*small+bounce)*u;c.fillStyle=colors[seg];c.beginPath();c.roundRect(p.x-4*u,head+5*u,8*u,10*u*small,3*u);c.fill();this.dot(p.x,head,4*small,'#e6c9a1');this.ellipse(p.x,head-2*u,4.2*small,2.5,seg===2?'#c1b58d':'#766b54');
  if(pose==='wave')this.line([{x:p.x+3*u,y:head+8*u},{x:p.x+8*u,y:head-2*u+Math.sin(t/180)*u}],colors[seg],2);
  if(seg===2)this.line([{x:p.x+6*u,y:p.y-9*u},{x:p.x+8*u,y:p.y}], '#9c8564',1);if(bag){c.fillStyle='#cfb37c';c.fillRect(p.x+4*u,p.y-8*u,5*u,6*u);this.line([{x:p.x+5*u,y:p.y-8*u},{x:p.x+5*u,y:p.y-11*u},{x:p.x+8*u,y:p.y-10*u}], '#ad9368',.7);}
 }
}
root.KTownArt=TownArt;
})(globalThis);
