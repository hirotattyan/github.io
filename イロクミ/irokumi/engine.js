/* Standalone, dependency-free puzzle engine. */
(function(root){
'use strict';
const W=6,H=12,COLORS=5;
class Game{
 constructor(random=Math.random){this.random=random;this.reset();}
 reset(){this.board=Array.from({length:H},()=>Array(W).fill(null));this.score=0;this.chain=0;this.maxChain=0;this.elapsed=0;this.rise=0;this.danger=0;this.phase='idle';this.delay=0;this.matches=[];this.falls=[];this.selected=null;this.running=false;this.over=false;this.lastGain=0;for(let y=H-5;y<H;y++)this.board[y]=this.makeRow(y);this.next=this.makeRow(H);}
 makeRow(y){const row=[];for(let x=0;x<W;x++){const choices=[];for(let c=0;c<COLORS;c++){if(x>1&&row[x-1]===c&&row[x-2]===c)continue;if(y>1&&this.board[y-1]?.[x]===c&&this.board[y-2]?.[x]===c)continue;choices.push(c);}row.push(choices[Math.floor(this.random()*choices.length)]);}return row;}
 find(){const set=new Set();for(let y=0;y<H;y++)for(let x=0;x<W;x++){const c=this.board[y][x];if(c===null)continue;if(x<=W-3&&this.board[y][x+1]===c&&this.board[y][x+2]===c){let z=x;while(z<W&&this.board[y][z]===c)set.add(y*W+z++);}if(y<=H-3&&this.board[y+1][x]===c&&this.board[y+2][x]===c){let z=y;while(z<H&&this.board[z][x]===c)set.add(z++*W+x);}}return [...set];}
 swap(a,b){if(!this.running||this.over||this.phase!=='idle'||a.y!==b.y||Math.abs(a.x-b.x)!==1)return false;const row=this.board[a.y];[row[a.x],row[b.x]]=[row[b.x],row[a.x]];this.selected=null;this.chain=0;this.falls=[];this.phase='check';return true;}
 tap(x,y){if(!this.running||this.over||this.phase!=='idle'||x<0||x>=W||y<0||y>=H)return;const a=this.selected;if(a&&a.x===x&&a.y===y){this.selected=null;return;}if(a&&this.swap(a,{x,y}))return;this.selected=this.board[y][x]===null?null:{x,y};}
 fall(){this.falls=[];let moved=false;for(let y=H-2;y>=0;y--)for(let x=0;x<W;x++)if(this.board[y][x]!==null&&this.board[y+1][x]===null){this.board[y+1][x]=this.board[y][x];this.board[y][x]=null;this.falls.push({x,y:y+1,from:y});moved=true;}return moved;}
 check(){this.matches=this.find();if(this.matches.length){this.chain++;this.maxChain=Math.max(this.chain,this.maxChain);this.phase='flash';this.delay=.32;}else{this.phase='fall';this.delay=.07;}}
 raise(amount=.2){if(!this.running||this.phase!=='idle'||this.over||this.board[0].some(c=>c!==null))return;this.rise=Math.min(1,this.rise+amount);}
 step(dt){if(!this.running||this.over)return;this.elapsed+=dt;if(this.phase==='check'){this.check();return;}if(this.phase==='flash'){this.delay-=dt;if(this.delay<=0){for(const n of this.matches)this.board[Math.floor(n/W)][n%W]=null;this.lastGain=this.matches.length*10*this.chain;this.score+=this.lastGain;this.matches=[];this.phase='fall';this.delay=.07;}return;}if(this.phase==='fall'){this.delay-=dt;if(this.delay<=0){if(this.fall())this.delay=.07;else{const m=this.find();if(m.length){this.matches=m;this.chain++;this.maxChain=Math.max(this.maxChain,this.chain);this.phase='flash';this.delay=.32;}else this.phase='idle';}}return;}
 const ceiling=this.board[0].some(c=>c!==null);if(ceiling){this.danger+=dt;if(this.danger>=5){this.over=true;this.running=false;}return;}this.danger=0;this.rise+=dt/Math.max(4,12-this.elapsed/35);if(this.rise>=1){this.board.shift();this.board.push(this.next);this.next=this.makeRow(H);this.rise=0;this.selected=null;this.chain=0;this.phase='check';}}
}
if(typeof module!=='undefined')module.exports={Game,W,H};else root.Irokumi={Game,W,H};
})(typeof window!=='undefined'?window:globalThis);
