/* Original stylized damage, healing and launch sounds synthesized on this device. */
class ForestEffects{
 constructor(music){this.music=music;this.enabled=false;this.active=false;this.volume=.45;this.gain=null;this.sources=new Set();this.buffers=new Map();}
 async enable(value){this.enabled=value;if(!value){this.stop();return;}try{this.music.init();if(!this.gain){this.gain=this.music.context.createGain();this.gain.gain.value=this.volume*.7;this.gain.connect(this.music.context.destination);}await this.music.context.resume();}catch(error){this.enabled=false;this.stop();throw error;}}
 resumeContext(){if(this.enabled&&this.music.context?.state==='suspended')this.music.context.resume().catch(()=>{});}
 setActive(value){this.active=value;if(!value)this.stop();}
 setVolume(value){this.volume=Math.max(0,Math.min(1,value));if(this.gain)this.gain.gain.setTargetAtTime(this.volume*.7,this.music.context.currentTime,.03);}
 stop(){for(const s of this.sources){try{s.stop();}catch{}s.disconnect();}this.sources.clear();}
 buffer(type,count=1){const key=type==='shot'?`${type}:${Math.min(2,count)}`:type;if(this.buffers.has(key))return this.buffers.get(key);const context=this.music.context,sr=context.sampleRate,duration=type==='heal'?.5:type==='damage'?.28:.16,buffer=context.createBuffer(2,Math.ceil(duration*sr),sr),channels=[buffer.getChannelData(0),buffer.getChannelData(1)];let seed=19521;
 const noise=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2147483648-1;};
 for(let i=0;i<buffer.length;i++){const t=i/sr,release=Math.min(1,(duration-t)/.025);let left=0,right=0;
 if(type==='damage'){const envelope=Math.min(1,t/.004)*Math.exp(-t*17)*release,phase=2*Math.PI*(185*t-150*t*t);const sample=.33*envelope*(Math.sin(phase)+.22*noise());left=right=sample;}
 else if(type==='heal'){for(let j=0;j<3;j++){const age=t-j*.075;if(age<0)continue;const freq=[659.25,830.61,987.77][j],envelope=Math.min(1,age/.004)*Math.exp(-age*11)*release;const sample=.16*envelope*(Math.sin(2*Math.PI*freq*age)+.16*Math.sin(4*Math.PI*freq*age));left+=sample*(j===0?1.1:.9);right+=sample*(j===2?1.1:.9);}}
 else if(type==='shot'){const envelope=Math.min(1,t/.0015)*Math.exp(-t*40)*release,phase=2*Math.PI*(1080*t-1900*t*t),sample=.3*envelope*(.65*noise()+.35*Math.sin(phase));left=sample;right=sample;if(count>1){const extra=.2*envelope*noise();left+=extra;right-=extra;}}
 channels[0][i]=left;channels[1][i]=right;
 }this.buffers.set(key,buffer);return buffer;}
 play(type,count=1){if(!this.enabled||!this.active||!this.gain||this.music.context?.state!=='running')return;if(!['damage','heal','shot'].includes(type))return;const source=this.music.context.createBufferSource();source.buffer=this.buffer(type,count);source.connect(this.gain);source.onended=()=>{source.disconnect();this.sources.delete(source);};this.sources.add(source);source.start();}
}
if(typeof module!=='undefined')module.exports=ForestEffects;
