/* Three original instrumental loops, synthesized locally. No audio requests. */
class PuzzleMusic {
 constructor(){this.enabled=false;this.active=false;this.context=null;this.source=null;this.offset=0;this.volume=.35;this.track=0;this.tracks=[];}
 init(){if(this.context)return;const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)throw new Error('Audio unavailable');this.context=new Audio();this.gain=this.context.createGain();this.gain.gain.value=this.volume*.65;this.gain.connect(this.context.destination);this.tracks=[this.compose(0),this.compose(1),this.compose(2)];this.buffer=this.tracks[this.track];}
 compose(variant=0){const sr=this.context.sampleRate,beat=60/([96,116,108][variant]),duration=32*beat,buffer=this.context.createBuffer(2,Math.ceil(sr*duration),sr);const channels=[buffer.getChannelData(0),buffer.getChannelData(1)];
 const note=(midi,time,length,amp,pan=0,bass=false)=>{const f=440*Math.pow(2,(midi-69)/12);for(let i=0,n=Math.floor(length*sr);i<n;i++){const t=i/sr,attack=Math.min(1,t/.012),release=Math.min(1,(length-t)/.08);const env=attack*release*Math.exp(-t*(bass?3:5));const wave=Math.sin(2*Math.PI*f*t)+(bass?0:(variant===2?.08:.18)*Math.sin(4*Math.PI*f*t));const sample=wave*env*amp;const at=(Math.floor(time*sr)+i)%buffer.length;channels[0][at]+=sample*(1-pan*.3);channels[1][at]+=sample*(1+pan*.3);}};
 const chords=variant===2?[[62,65,69],[58,62,65],[60,65,69],[60,64,67]]:variant===1?[[60,64,67],[53,57,60],[57,60,64],[55,59,62]]:[[57,60,64],[53,57,60],[55,60,64],[55,59,62]];
 const melody=variant===2?[[81,0,77,76,74,77,0,72],[77,74,0,70,74,77,0,74],[77,0,81,79,77,72,74,0],[76,0,79,76,72,74,76,0]]:variant===1?[[72,76,79,0,76,79,84,79],[77,76,72,0,69,72,77,0],[76,72,69,72,76,81,79,76],[74,79,0,74,71,74,79,0]]:[[76,0,72,74,76,72,69,0],[72,0,69,72,77,76,72,0],[76,79,0,76,72,74,76,0],[74,0,71,74,79,74,71,0]];
 for(let bar=0;bar<8;bar++){const chord=chords[bar%4],start=bar*4*beat;note(chord[0]-12,start,beat*1.7,.11,0,true);note(chord[0]-12,start+2*beat,beat*1.7,.09,0,true);for(let i=0;i<8;i++){note(chord[variant===2?[2,1,0,1,2,1,0,1][i]:i%3]+12,start+i*beat/2,beat*.8,variant===2?.038:.045,(i%2?1:-1));const m=melody[bar%4][i];if(m)note(m+(bar>=4?-12:0),start+i*beat/2+(variant===2?.08*beat:0),beat*(variant===2?1.05:variant===1?.65:.85),variant===1?.075:.065,variant===2?-.15:.15);}}
 return buffer;
 }
 // Called only when a new game starts. Repeat picks are deliberately allowed.
 chooseTrack(random=Math.random){this.sync(false);this.track=Math.min(2,Math.floor(random()*3));this.offset=0;if(this.context)this.buffer=this.tracks[this.track];return this.track;}
 async enable(value){this.enabled=value;if(!value){this.sync(false);return;}try{this.init();await this.context.resume();this.sync(this.active);}catch(error){this.enabled=false;this.sync(false);throw error;}}
 sync(active){this.active=active;const shouldPlay=this.enabled&&active&&this.context?.state==='running';if(shouldPlay&&!this.source){const source=this.context.createBufferSource();source.buffer=this.buffer;source.loop=true;source.connect(this.gain);this.startedAt=this.context.currentTime;source.start(0,this.offset%this.buffer.duration);this.source=source;}else if(!shouldPlay&&this.source){this.offset=(this.offset+this.context.currentTime-this.startedAt)%this.buffer.duration;this.source.stop();this.source.disconnect();this.source=null;}}
 rewind(){const active=this.active;this.sync(false);this.offset=0;this.sync(active);}
 setVolume(value){this.volume=Math.max(0,Math.min(1,value));if(this.gain)this.gain.gain.setTargetAtTime(this.volume*.65,this.context.currentTime,.04);}
}
if(typeof module!=='undefined')module.exports=PuzzleMusic;
