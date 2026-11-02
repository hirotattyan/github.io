'use strict';
const {Game,W,H}=Irokumi;
const music=new PuzzleMusic();
const effects=new PuzzleEffects(music);
const game=new Game(),$=id=>document.getElementById(id);
const canvas=$('board'),ctx=canvas.getContext('2d');
const colors=['#dd857c','#81b7b0','#7d9ccf','#d6b65f','#af96c8'];
const symbols=['●','◆','▲','✚','≋'];
const names=['まる','ひし形','三角','十字','波'];
let best=0,paused=false,last=0,previousScore=0,drag=null,lastDangerSecond=null;
try{best=Number(localStorage.getItem('irokumi-best-v1'))||0;}catch{$('saveNote').textContent='この環境では最高記録を保存できません。';}
function begin(){lastDangerSecond=null;effects.stop();cancelDrag();music.chooseTrack();if(music.enabled)$('audioNote').textContent=`今回の曲：BGM${music.track+1}（プレイごとにランダム）`;game.reset();game.running=true;paused=false;previousScore=0;last=performance.now();$('overlay').hidden=true;update();}
function pause(){if(game.over||(!game.running&&!paused))return;cancelDrag();game.running=false;paused=true;show('PAUSED','ひと休み。','盤面はそのまま。自分のペースでどうぞ。','再開する →');update();}
function resume(){game.running=true;paused=false;last=performance.now();$('overlay').hidden=true;update();}
function show(label,title,text,button){$('overlay').hidden=false;$('overlayLabel').textContent=label;$('overlayTitle').textContent=title;$('overlayText').textContent=text;$('start').textContent=button;}
function syncCountdown(){
 if(game.danger<=0){lastDangerSecond=null;effects.stopCountdown();return;}
 if(!game.running||game.over||document.hidden||game.phase!=='idle'){effects.stopCountdown();return;}
 const second=Math.ceil(Math.max(0,5-game.danger));
 if(second>0&&second!==lastDangerSecond){lastDangerSecond=second;effects.countdown(second);}
}
function update(){syncCountdown();music.sync(game.running&&!document.hidden);effects.setActive(game.running&&!document.hidden);if(game.score>previousScore){effects.play(game.chain,Math.round((game.score-previousScore)/(10*Math.max(1,game.chain))));}previousScore=game.score;if(game.score>best){best=game.score;try{localStorage.setItem('irokumi-best-v1',String(best));}catch{$('saveNote').textContent='最高記録は今回の画面内のみ保持しています。';}}
 $('score').textContent=game.score.toLocaleString();$('chain').textContent=game.chain;$('maxChain').textContent=game.maxChain;$('best').textContent=best.toLocaleString();$('speed').textContent=`LV ${1+Math.floor(game.elapsed/45)}`;
 const busy=game.phase!=='idle';$('pause').disabled=!game.running&&!paused;$('pause').textContent=paused?'再開':'一時停止';$('raise').disabled=!game.running||busy||game.board[0].some(c=>c!==null);document.body.classList.toggle('danger',game.danger>0);
 let text='ブロックを押したまま、左右にスライド';if(game.phase==='flash')text=game.chain>1?`${game.chain}連鎖！ ×${game.chain} 得点`:'そろった！';else if(game.phase==='fall')text='落下中… 次につながる？';else if(game.danger>0)text=`天井に注意！ あと${Math.max(0,5-game.danger).toFixed(1)}秒`;else if(paused)text='一時停止中';else if(game.selected)text=`${names[game.board[game.selected.y][game.selected.x]]}を選択中：そのまま左右にスライド`;else if(game.score>0&&game.chain>1)text=`${game.chain}連鎖達成！ 次の連鎖を作ろう。`;
 // Live-region updates are limited to meaningful status changes, not every frame.
 if(game.danger>0)text=`天井に注意！ あと${Math.ceil(Math.max(0,5-game.danger))}秒`;
 if($('state').textContent!==text)$('state').textContent=text;
 if(game.over){$('state').textContent='ゲームオーバー';show('GAME OVER','もう一度、組んでみる？',`スコア ${game.score.toLocaleString()} ／ 最大 ${game.maxChain}連鎖`,'もう一度遊ぶ ↻');}
}
function tile(c,x,y,size=100,scale=1,selected=false){const pad=5,side=size-2*pad,cx=x+size/2,cy=y+size/2;ctx.save();ctx.translate(cx,cy);ctx.scale(scale,scale);ctx.fillStyle=colors[c];ctx.beginPath();ctx.roundRect(-side/2,-side/2,side,side,12);ctx.fill();ctx.fillStyle='#14232b';ctx.globalAlpha=.83;ctx.font=`700 ${size*.42}px system-ui`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(symbols[c],0,2);if(selected){ctx.globalAlpha=1;ctx.strokeStyle='white';ctx.lineWidth=5;ctx.strokeRect(-side/2+4,-side/2+4,side-8,side-8);}ctx.restore();}
function draw(){ctx.clearRect(0,0,600,1250);ctx.fillStyle='#121e28';ctx.fillRect(0,0,600,1250);ctx.strokeStyle='#20323f';ctx.lineWidth=1;for(let y=0;y<=H;y++){ctx.beginPath();ctx.moveTo(0,y*100);ctx.lineTo(600,y*100);ctx.stroke();}for(let x=0;x<=W;x++){ctx.beginPath();ctx.moveTo(x*100,0);ctx.lineTo(x*100,1200);ctx.stroke();}
 ctx.save();ctx.beginPath();ctx.rect(0,0,600,1200);ctx.clip();for(let y=0;y<H;y++)for(let x=0;x<W;x++){const c=game.board[y][x];if(c===null)continue;let dy=y*100-game.rise*100;const motion=game.phase==='fall'?game.falls.find(p=>p.x===x&&p.y===y):null;if(motion)dy-=(Math.max(0,game.delay)/.07)*100;let scale=1;const matching=game.phase==='flash'&&game.matches.includes(y*W+x);if(matching)scale=.82+.18*Math.max(0,game.delay/.32);tile(c,x*100,dy,100,scale,game.selected?.x===x&&game.selected?.y===y);if(matching){ctx.strokeStyle='#fff7d5';ctx.lineWidth=5;ctx.strokeRect(x*100+12,dy+12,76,76);}}
 // The upcoming row is solid support while rising and cannot be selected yet.
 for(let x=0;x<W;x++)tile(game.next[x],x*100,1200-game.rise*100);
 ctx.restore();ctx.fillStyle='#0c151e';ctx.fillRect(0,1200,600,50);for(let x=0;x<W;x++)tile(game.next[x],x*100+25,1200,50);ctx.fillStyle='#92acbb';ctx.font='18px system-ui';ctx.textAlign='right';ctx.fillText('NEXT',592,1233);
 if(game.danger>0){ctx.fillStyle='#f3a785';ctx.fillRect(0,0,600*(1-game.danger/5),6);}
}
// Pointer capture keeps a gesture attached to the board even at its edge.
function cancelDrag(){const held=drag;drag=null;game.selected=null;canvas.classList.remove('dragging');if(held){try{canvas.releasePointerCapture(held.id);}catch{}}}
function moveDrag(e){
 if(!drag||e.pointerId!==drag.id||drag.done)return;
 if(!game.running||game.over||game.phase!=='idle'||game.board[drag.y]!==drag.row){cancelDrag();return;}
 const dx=e.clientX-drag.startX,dy=e.clientY-drag.startY;
 if(Math.abs(dy)>drag.threshold&&Math.abs(dy)>Math.abs(dx)*1.3){cancelDrag();return;}
 if(Math.abs(dx)<drag.threshold||Math.abs(dx)<Math.abs(dy)*1.15)return;
 const nextX=drag.x+(dx>0?1:-1);if(nextX<0||nextX>=W)return;
 drag.done=game.swap({x:drag.x,y:drag.y},{x:nextX,y:drag.y});
 if(drag.done)canvas.classList.remove('dragging');update();draw();
}
canvas.addEventListener('pointerdown',e=>{
 if(e.button!==0||e.isPrimary===false||drag||!game.running||game.over||game.phase!=='idle')return;
 e.preventDefault();const r=canvas.getBoundingClientRect();
 const x=Math.floor((e.clientX-r.left)/r.width*W),y=Math.floor(((e.clientY-r.top)/r.height*1250+game.rise*100)/100);
 if(x<0||x>=W||y<0||y>=H||game.board[y][x]===null)return;
 game.selected={x,y};drag={id:e.pointerId,x,y,row:game.board[y],startX:e.clientX,startY:e.clientY,threshold:Math.max(12,Math.min(26,r.width/W*.3)),done:false};
 try{canvas.setPointerCapture(e.pointerId);}catch{}canvas.classList.add('dragging');update();draw();
});
canvas.addEventListener('pointermove',e=>{if(drag&&e.pointerId===drag.id){e.preventDefault();moveDrag(e);}});
canvas.addEventListener('pointerup',e=>{if(!drag||e.pointerId!==drag.id)return;moveDrag(e);cancelDrag();update();draw();});
canvas.addEventListener('pointercancel',e=>{if(drag?.id===e.pointerId){cancelDrag();update();draw();}});
canvas.addEventListener('lostpointercapture',e=>{if(drag?.id===e.pointerId){cancelDrag();update();draw();}});
$('start').addEventListener('click',()=>paused?resume():begin());$('pause').addEventListener('click',()=>paused?resume():pause());$('raise').addEventListener('click',()=>{game.raise();update();});$('retry').addEventListener('click',begin);document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});window.addEventListener('pagehide',pause);
// One animation loop for the entire page lifetime; restart never creates a timer.
function frame(t){const dt=last?Math.min(.05,Math.max(0,(t-last)/1000)):0;last=t;game.step(dt);update();draw();requestAnimationFrame(frame);}
update();draw();requestAnimationFrame(frame);

$('music').addEventListener('click',async()=>{
 const button=$('music');button.disabled=true;
 try{await music.enable(!music.enabled);music.sync(game.running&&!document.hidden);$('audioNote').textContent=music.enabled?`今回の曲：BGM${music.track+1}（プレイごとにランダム）`:'BGMはオフです。';}
 catch{$('audioNote').textContent='BGMを再生できませんでした。ブラウザの音声設定を確認して再度お試しください。';}
 finally{button.disabled=false;button.textContent=music.enabled?'BGM：オン':'BGM：オフ';button.setAttribute('aria-pressed',String(music.enabled));}
});
$('volume').addEventListener('input',e=>music.setVolume(Number(e.target.value)/100));

$('effects').addEventListener('click',async()=>{
 const button=$('effects');button.disabled=true;
 try{await effects.enable(!effects.enabled);$('effectsNote').textContent=effects.enabled?'効果音オン：消去・連鎖と、天井で毎秒のカウント音。':'効果音はオフです。';}
 catch{$('effectsNote').textContent='効果音を再生できませんでした。ブラウザの音声設定を確認して再度お試しください。';}
 finally{button.disabled=false;button.textContent=effects.enabled?'効果音：オン':'効果音：オフ';button.setAttribute('aria-pressed',String(effects.enabled));}
});
$('effectsVolume').addEventListener('input',e=>effects.setVolume(Number(e.target.value)/100));
