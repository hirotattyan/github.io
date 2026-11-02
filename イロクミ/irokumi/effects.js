/* Locally synthesized clear pops and original ascending chain chimes. */
class PuzzleEffects {
 constructor(music){this.music=music;this.enabled=false;this.active=false;this.volume=.5;this.sources=new Set();this.buffers=new Map();this.gain=null;this.countdownSource=null;}
 async enable(value){this.enabled=value;if(!value){this.stop();return;}try{this.music.init();if(!this.gain){this.gain=this.music.context.createGain();this.gain.gain.value=this.volume*.7;this.gain.connect(this.music.context.destination);}await this.music.context.resume();}catch(e){this.enabled=false;this.stop();throw e;}}
 setActive(value){this.active=value;if(!value)this.stop();}
 setVolume(value){this.volume=Math.max(0,Math.min(1,value));if(this.gain)this.gain.gain.setTargetAtTime(this.volume*.7,this.music.context.currentTime,.03);}
 stopCountdown(){if(this.countdownSource){const source=this.countdownSource;this.countdownSource=null;try{source.stop();}catch{}source.disconnect();this.sources.delete(source);}}
 stop(){this.stopCountdown();for(const source of this.sources){try{source.stop();}catch{}source.disconnect();}this.sources.clear();}
 makeBuffer(chain,count){const tier=Math.max(1,Math.min(8,chain)),n=Math.max(1,Math.min(8,count)),key=`${tier}:${n}`;if(this.buffers.has(key))return this.buffers.get(key);const context=this.music.context,sr=context.sampleRate,duration=tier>1?.65:.3,buffer=context.createBuffer(1,Math.ceil(duration*sr),sr),data=buffer.getChannelData(0);
 const tone=(midi,start,length,amp,pop)=>{const freq=440*Math.pow(2,(midi-69)/12);for(let i=0;i<length*sr;i++){const t=i/sr,index=Math.floor(start*sr)+i;if(index>=data.length)break;const env=Math.min(1,t/.003)*Math.min(1,(length-t)/.025)*Math.exp(-t*(pop?26:11));const phase=2*Math.PI*freq*(t+(pop?.0015*(1-Math.exp(-t*45)):0));data[index]+=amp*env*(Math.sin(phase)+(pop?.12:.28)*Math.sin(2*phase));}};
 // A small pop for every block in the first eight, closely spaced as one clear.
 for(let i=0;i<n;i++)tone(78+(i%3)*2,i*.014,.12,.12,true);
 // Chains add a brighter ascending chime over the usual pops.
 if(tier>1){const base=69+Math.min(12,(tier-2)*2);for(const [i,note] of [0,4,7,12].entries())tone(base+note,.05+i*.065,.3,.12,false);}
 this.buffers.set(key,buffer);return buffer;}
 countdown(seconds){const context=this.music.context;if(!this.enabled||!this.active||!this.gain||context?.state!=='running')return;this.stopCountdown();const frequency=seconds<=2?880:660,key=`countdown:${frequency}`;let buffer=this.buffers.get(key);
 if(!buffer){const sr=context.sampleRate;buffer=context.createBuffer(1,Math.ceil(sr*.14),sr);const data=buffer.getChannelData(0);for(let i=0;i<data.length;i++){const t=i/sr,envelope=Math.min(1,t/.006)*Math.min(1,(.14-t)/.035);data[i]=.22*envelope*(Math.sin(2*Math.PI*frequency*t)+.12*Math.sin(6*Math.PI*frequency*t));}this.buffers.set(key,buffer);}
 const source=context.createBufferSource();source.buffer=buffer;source.connect(this.gain);source.onended=()=>{source.disconnect();this.sources.delete(source);if(this.countdownSource===source)this.countdownSource=null;};this.countdownSource=source;this.sources.add(source);source.start();
 }

 play(chain,count){const context=this.music.context;if(!this.enabled||!this.active||!this.gain||context?.state!=='running')return;const source=context.createBufferSource();source.buffer=this.makeBuffer(chain,count);source.connect(this.gain);source.onended=()=>{source.disconnect();this.sources.delete(source);};this.sources.add(source);source.start();}
}
if(typeof module!=='undefined')module.exports=PuzzleEffects;
