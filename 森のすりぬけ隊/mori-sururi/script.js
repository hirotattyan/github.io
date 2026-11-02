'use strict';
const {ForestGame,CHARACTERS}=Forest;
const music=new ForestMusic();
const effects=new ForestEffects(music);
const game=new ForestGame(),$=id=>document.getElementById(id),canvas=$('game'),ctx=canvas.getContext('2d');
let selected='boar',screen='select',pointer=null,lastTime=0,sessionBest=0,lastSavedSecond=0,runId=null,runNumber=0;
const keys={up:false,down:false,left:false,right:false},bests={boar:0,tiger:0};
try{const stored=JSON.parse(localStorage.getItem('mori-sururi-records-v1')||'{}');for(const type of ['boar','tiger'])if(Number.isFinite(stored[type])&&stored[type]>0)bests[type]=stored[type];}catch{$('saveNote').textContent='この環境では最高記録を保存できません。';}
let recordStorage=null;try{recordStorage=localStorage;}catch{}
const recordBook=new ForestRecords(recordStorage);
for(const type of ['boar','tiger'])bests[type]=Math.max(bests[type],recordBook.bestTime(type));
function renderRankings(){for(const type of ['boar','tiger']){const entries=recordBook.list(type);$(type==='boar'?'boarRanks':'tigerRanks').innerHTML=Array.from({length:5},(_,i)=>{const entry=entries[i];return `<tr><th scope="row">${i+1}</th><td>${entry?`${entry.score}点`:'—'}</td><td>${entry?`${entry.time.toFixed(1)}秒`:'—'}</td></tr>`;}).join('');}if(!recordBook.persistent)$('saveNote').textContent='記録は今回の画面内のみ保持しています。';}
renderRankings();
const images={};for(const type of ['boar','tiger']){images[type]=new Image();images[type].src=`assets/${type}.svg`;}
function clearInput(){const id=pointer?.id;pointer=null;game.endDrag();for(const key of Object.keys(keys))keys[key]=false;canvas.classList.remove('dragging');if(id!==undefined){try{canvas.releasePointerCapture(id);}catch{}}}
function recordBest(){if(!runId||game.elapsed<.1)return;if(game.elapsed>bests[game.character]){bests[game.character]=game.elapsed;try{localStorage.setItem('mori-sururi-records-v1',JSON.stringify(bests));}catch{$('saveNote').textContent='記録は今回の画面内のみ保持しています。';}}if(recordBook.record(game.character,runId,game.elapsed))renderRankings();}
function panels(){ $('overlay').hidden=screen==='playing';$('selectPanel').hidden=screen!=='select';$('pausePanel').hidden=screen!=='paused';$('overPanel').hidden=screen!=='over';$('pause').disabled=screen==='select'||screen==='over';$('pause').textContent=screen==='paused'?'再開':'一時停止'; }
function choose(type){selected=type;for(const key of ['boar','tiger']){const button=$(key==='boar'?'chooseBoar':'chooseTiger');button.classList.toggle('selected',key===type);button.setAttribute('aria-pressed',String(key===type));}if(screen==='select'){game.reset(type);update();draw();}}
function begin(){recordBest();effects.stop();effects.resumeContext();music.restart();music.resumeContext();clearInput();game.reset(selected);runId=`run-${Date.now().toString(36)}-${++runNumber}-${Math.random().toString(36).slice(2,9)}`;game.running=true;sessionBest=bests[selected];lastSavedSecond=0;screen='playing';lastTime=performance.now();panels();update();}
function pause(){effects.stop();if(screen!=='playing')return;game.pause();clearInput();recordBest();screen='paused';panels();update();}
function resume(){if(screen!=='paused')return;effects.resumeContext();music.resumeContext();clearInput();game.running=true;screen='playing';lastTime=performance.now();panels();update();}
function selection(){recordBest();game.pause();clearInput();screen='select';game.reset(selected);runId=null;panels();update();}
function gameOver(){recordBest();clearInput();screen='over';$('result').innerHTML=`${game.elapsed.toFixed(1)} <small>秒</small><br><small>${game.score}点 ／ ${CHARACTERS[selected].name}</small>`;$('recordMessage').textContent=game.elapsed>sessionBest?'自己ベスト更新！ 次は、あと1秒。':'次の木の実まで、もうひと避け。';panels();}
function update(){effects.setActive((screen==='playing'||screen==='over')&&!document.hidden);music.sync(screen==='playing'&&game.running&&!document.hidden);const p=game.player;$('animal').textContent=CHARACTERS[game.character].name;$('hp').textContent='●'.repeat(p.hp)+'○'.repeat(p.maxHp-p.hp);$('hp').setAttribute('aria-label',`体力${p.hp}/${p.maxHp}`);$('time').textContent=game.elapsed.toFixed(1);$('score').textContent=game.score;$('level').textContent=`LV ${game.level}`;
 for(const type of ['boar','tiger'])$(type==='boar'?'boarBest':'tigerBest').textContent=`${Math.floor(Math.max(bests[type],game.character===type?game.elapsed:0)*10)}点`;
 let message='指を離すと停止。盤面のどこからでもドラッグ。';if(screen==='select')message='相棒を選んで、森へ出発。';else if(screen==='paused')message='一時停止中。再開は手動です。';else if(screen==='over')message='冒険終了。もう一度、森へ。';else if(game.warnings.length)message=game.warnings.length>1?'2方向から予告！ 点線の外へ逃げよう。':'銃弾の予告！ 点線から離れよう。';else if(game.invincible>0)message='いまは無敵。安全な場所へ！';else if(game.effects.some(e=>e.text==='+1'))message='木の実で回復 ＋1';else if(game.elapsed<6)message='指を置いても飛びません。動かして移動。';if($('message').textContent!==message)$('message').textContent=message;
}
function roundRect(x,y,w,h,r,fill,stroke){ctx.fillStyle=fill;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1.5;ctx.stroke();}}
function background(){ctx.fillStyle='#e2e9ca';ctx.fillRect(0,0,360,540);ctx.fillStyle='#eaf0d9';ctx.beginPath();ctx.moveTo(85,540);ctx.bezierCurveTo(40,320,240,240,165,0);ctx.lineTo(260,0);ctx.bezierCurveTo(315,230,140,320,275,540);ctx.fill();
 for(let i=0;i<30;i++){const x=(i*83+17)%360,y=(i*97+18+game.elapsed*5)%560-10;ctx.strokeStyle='#b7c79b';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x-3,y+3);ctx.lineTo(x,y-2);ctx.lineTo(x+3,y+3);ctx.stroke();}
 for(let i=0;i<7;i++){const y=i*95-25;for(const x of [-12,372]){ctx.fillStyle=i%2?'#b9c9a0':'#afc294';ctx.beginPath();ctx.ellipse(x,y,30,45,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#c4d3ad';ctx.beginPath();ctx.ellipse(x+(x<0?10:-10),y-10,17,25,.3,0,Math.PI*2);ctx.fill();}}
}
function rock(e){ctx.save();ctx.translate(e.x,e.y);ctx.rotate(e.angle);ctx.fillStyle='#788795';ctx.strokeStyle='#455965';ctx.lineWidth=2;ctx.beginPath();for(let i=0;i<8;i++){const a=i*Math.PI/4,r=e.r*(i%2?.9:1.02);const x=Math.cos(a)*r,y=Math.sin(a)*r;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#9aa6ac';ctx.beginPath();ctx.moveTo(-e.r*.6,-e.r*.3);ctx.lineTo(0,-e.r*.76);ctx.lineTo(e.r*.55,-e.r*.2);ctx.lineTo(-e.r*.14,-e.r*.05);ctx.fill();ctx.strokeStyle='#596b77';ctx.beginPath();ctx.moveTo(2,3);ctx.lineTo(9,10);ctx.lineTo(4,15);ctx.stroke();ctx.restore();}
function fruit(e){ctx.save();ctx.translate(e.x,e.y);ctx.strokeStyle='#fff7d0';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,1,13,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#dc8740';ctx.strokeStyle='#95592a';ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(0,2,9,10,0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle='#eab44f';ctx.beginPath();ctx.ellipse(-2,-1,3,4,.5,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#755534';ctx.beginPath();ctx.moveTo(0,-7);ctx.lineTo(1,-14);ctx.stroke();ctx.fillStyle='#4c8a58';ctx.beginPath();ctx.ellipse(6,-10,6,3,-.4,0,Math.PI*2);ctx.fill();ctx.restore();}
function warning(w){ctx.save();ctx.strokeStyle='#b75e3d';ctx.lineWidth=1.4;ctx.globalAlpha=.45;ctx.setLineDash([5,6]);ctx.beginPath();ctx.moveTo(w.x,w.y);ctx.lineTo(w.targetX,w.targetY);ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=1;ctx.fillStyle='#fff1ce';ctx.beginPath();ctx.arc(w.x,w.y,10,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(w.x-14,w.y);ctx.lineTo(w.x+14,w.y);ctx.moveTo(w.x,w.y-14);ctx.lineTo(w.x,w.y+14);ctx.stroke();ctx.globalAlpha=.65;ctx.beginPath();ctx.arc(w.targetX,w.targetY,9,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.moveTo(w.targetX-5,w.targetY);ctx.lineTo(w.targetX+5,w.targetY);ctx.moveTo(w.targetX,w.targetY-5);ctx.lineTo(w.targetX,w.targetY+5);ctx.stroke();ctx.restore();}
function bullet(e){ctx.save();ctx.translate(e.x,e.y);ctx.rotate(Math.atan2(e.vy,e.vx));ctx.fillStyle='#e4a273';ctx.globalAlpha=.6;ctx.beginPath();ctx.moveTo(-23,-3);ctx.lineTo(0,-4);ctx.lineTo(0,4);ctx.lineTo(-23,3);ctx.fill();ctx.globalAlpha=1;roundRect(-8,-4,17,8,4,'#aa493a','#fff3da');ctx.restore();}
function player(){const p=game.player;ctx.save();ctx.translate(p.x,p.y);ctx.fillStyle='#586c4830';ctx.beginPath();ctx.ellipse(0,22,19,6,0,0,Math.PI*2);ctx.fill();if(game.invincible>0){ctx.strokeStyle='#fffbdf';ctx.lineWidth=4;ctx.beginPath();ctx.arc(0,1,27,0,Math.PI*2);ctx.stroke();ctx.strokeStyle='#d8a759';ctx.lineWidth=1;ctx.stroke();ctx.globalAlpha=.72;}const image=images[game.character];if(image.complete&&image.naturalWidth)ctx.drawImage(image,-28,-28,56,56);else{ctx.fillStyle=game.character==='boar'?'#aa8160':'#ecaf50';ctx.beginPath();ctx.arc(0,0,22,0,Math.PI*2);ctx.fill();}ctx.restore();}
function draw(){ctx.setTransform(2,0,0,2,0,0);background();for(const w of game.warnings)warning(w);for(const e of game.fruits)fruit(e);for(const e of game.rocks)rock(e);for(const e of game.bullets)bullet(e);player();for(const e of game.effects){ctx.save();ctx.globalAlpha=Math.min(1,e.left*2);ctx.font='bold 18px system-ui';ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='#3b5546';ctx.strokeText(e.text,e.x,e.y);ctx.fillStyle=e.color;ctx.fillText(e.text,e.x,e.y);ctx.restore();}}
canvas.addEventListener('pointerdown',e=>{if(screen!=='playing'||e.button!==0||e.isPrimary===false||pointer)return;e.preventDefault();const selection=window.getSelection?.();if(selection?.rangeCount)selection.removeAllRanges();pointer={id:e.pointerId,x:e.clientX,y:e.clientY};game.beginDrag();try{canvas.setPointerCapture(e.pointerId);}catch{}canvas.classList.add('dragging');});
canvas.addEventListener('pointermove',e=>{if(!pointer||pointer.id!==e.pointerId)return;e.preventDefault();const rect=canvas.getBoundingClientRect();game.dragBy((e.clientX-pointer.x)*360/rect.width,(e.clientY-pointer.y)*540/rect.height);pointer.x=e.clientX;pointer.y=e.clientY;});
for(const type of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(type,e=>{if(pointer?.id===e.pointerId)clearInput();});
// Suppress native long-press actions only on the play surface. Outside-page
// selection and pinch zoom keep their normal browser behavior.
for(const type of ['contextmenu','selectstart','dragstart'])canvas.addEventListener(type,e=>e.preventDefault());
for(const type of ['touchstart','touchmove'])canvas.addEventListener(type,e=>{
 if(screen==='playing'&&e.touches.length===1&&e.cancelable!==false)e.preventDefault();
},{passive:false});
document.addEventListener('selectstart',e=>{if(pointer&&screen==='playing')e.preventDefault();});
const keyMap={arrowup:'up',w:'up',arrowdown:'down',s:'down',arrowleft:'left',a:'left',arrowright:'right',d:'right'};
window.addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey)return;const key=e.key.toLowerCase();if(key==='escape'&&screen==='playing'){pause();return;}if(keyMap[key]&&screen==='playing'){e.preventDefault();keys[keyMap[key]]=true;}});window.addEventListener('keyup',e=>{const mapped=keyMap[e.key.toLowerCase()];if(mapped)keys[mapped]=false;});
$('chooseBoar').addEventListener('click',()=>choose('boar'));$('chooseTiger').addEventListener('click',()=>choose('tiger'));$('start').addEventListener('click',begin);$('resume').addEventListener('click',resume);$('pause').addEventListener('click',()=>screen==='paused'?resume():pause());$('retry').addEventListener('click',begin);for(const id of ['menu','pauseSelect','back'])$(id).addEventListener('click',selection);
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});window.addEventListener('pagehide',pause);window.addEventListener('blur',pause);
// The logical arena stays 360x540 at every screen size. Reflow never changes positions.
window.addEventListener('resize',()=>{clearInput();game.resize(360,540);draw();});
// One loop per page lifetime. Starting or retrying never adds another timer.
function frame(time){const dt=lastTime?Math.min(.033,Math.max(0,(time-lastTime)/1000)):0;lastTime=time;game.step(dt,keys);dispatchEffects();if(game.over&&screen==='playing')gameOver();if(screen==='playing'&&Math.floor(game.elapsed/5)>lastSavedSecond){lastSavedSecond=Math.floor(game.elapsed/5);recordBest();}update();draw();requestAnimationFrame(frame);}
panels();update();draw();requestAnimationFrame(frame);

$('music').addEventListener('click',async()=>{
 const button=$('music');button.disabled=true;
 try{await music.enable(!music.enabled);music.sync(screen==='playing'&&game.running&&!document.hidden);$('musicNote').textContent=music.enabled?'BGMオン：木琴と笛の、小さな森の冒険。':'BGMはオフです。';}
 catch{$('musicNote').textContent='再生できませんでした。ブラウザの音声設定を確認して再度お試しください。';}
 finally{button.disabled=false;button.textContent=music.enabled?'BGM：オン':'BGM：オフ';button.setAttribute('aria-pressed',String(music.enabled));}
});
$('musicVolume').addEventListener('input',e=>music.setVolume(Number(e.target.value)/100));

function dispatchEffects(){const events=game.takeEvents();if(screen!=='playing'||document.hidden)return;effects.setActive(true);for(const event of events)effects.play(event.type,event.count||1);}
$('effects').addEventListener('click',async()=>{
 const button=$('effects');button.disabled=true;
 try{await effects.enable(!effects.enabled);$('effectsNote').textContent=effects.enabled?'効果音オン：被弾・回復・銃弾の発射を音でお知らせ。':'効果音はオフです。';}
 catch{$('effectsNote').textContent='効果音を再生できませんでした。ブラウザの音声設定を確認して再度お試しください。';}
 finally{button.disabled=false;button.textContent=effects.enabled?'効果音：オン':'効果音：オフ';button.setAttribute('aria-pressed',String(effects.enabled));}
});
$('effectsVolume').addEventListener('input',e=>effects.setVolume(Number(e.target.value)/100));
