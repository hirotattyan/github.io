/* Original seasonal/mascot loops and chapter one-shots, synthesized locally. */
(function(root){
'use strict';
const PREFERENCE_KEY='kotsukotsu-demo-audio-v1';
function savedEnabled(){try{const value=JSON.parse(root.localStorage?.getItem(PREFERENCE_KEY)||'null');return value?.enabled===true;}catch(e){return false;}}
function rememberEnabled(enabled){try{root.localStorage?.setItem(PREFERENCE_KEY,JSON.stringify({version:1,enabled}));}catch(e){}}
const SONGS={
 '春':{title:'花ひらく通り',bpm:96,key:62,lead:'flute',arp:'piano',bass:'round',swing:.025,
  chords:[[0,4,7,11],[9,12,16,19],[5,9,12,16],[7,11,14,17],[4,7,11,14],[9,12,16,19],[2,5,9,12],[7,11,14,17]],
  melody:[[16,19,21,0,19,16,14,12],[16,0,12,14,16,19,16,0],[17,21,24,21,0,19,17,16],[14,0,11,14,19,16,14,0],[16,19,23,0,21,19,16,14],[12,16,21,19,16,0,14,12],[14,17,21,0,19,17,14,12],[11,14,19,0,17,14,12,0]]},
 '夏':{title:'陽だまりの回遊',bpm:112,key:55,lead:'wood',arp:'pluck',bass:'round',swing:.045,
  chords:[[0,4,7,9],[5,9,12,16],[9,12,16,19],[7,11,14,17],[0,4,7,11],[4,7,11,14],[5,9,12,16],[7,11,14,19]],
  melody:[[19,0,16,19,21,19,16,14],[17,21,0,24,21,17,16,0],[16,19,24,0,21,19,16,12],[14,19,0,23,21,19,14,0],[24,0,21,19,16,19,21,0],[23,19,16,0,14,16,19,0],[21,24,21,17,0,16,14,17],[19,14,11,14,0,19,12,0]]},
 '秋':{title:'木の葉と珈琲',bpm:88,key:53,lead:'piano',arp:'felt',bass:'upright',swing:.12,
  chords:[[0,4,7,11],[4,7,11,14],[9,12,16,19],[2,5,9,12],[5,9,12,16],[0,4,7,11],[2,5,9,12],[7,11,14,17]],
  melody:[[19,16,0,14,12,0,11,12],[14,16,19,0,16,14,0,11],[12,0,16,19,21,19,16,0],[17,14,0,12,14,17,16,14],[17,21,0,19,17,16,14,0],[16,12,0,11,12,16,19,0],[17,14,12,0,9,12,14,17],[14,11,0,14,19,14,12,0]]},
 '冬':{title:'窓辺の灯り',bpm:76,key:60,lead:'bell',arp:'felt',bass:'soft',swing:0,
  chords:[[0,4,7,11],[9,12,16,19],[5,9,12,16],[7,11,14,19],[4,7,11,14],[9,12,16,19],[5,9,12,16],[7,11,14,17]],
  melody:[[19,0,16,0,14,16,12,0],[16,0,21,19,0,16,12,0],[17,0,21,0,19,17,16,0],[14,0,19,0,23,19,14,0],[16,0,19,23,0,21,19,16],[21,0,19,16,0,12,16,0],[17,0,21,19,0,17,14,0],[19,0,14,11,0,14,12,0]]}
};
Object.assign(SONGS,{
 'こつまる':{title:'こつまるのごきげん散歩道',bpm:108,key:60,bars:32,lead:'clarinet',arp:'piano',bass:'upright',swing:.065,
  chords:[[0,4,7,9],[0,4,7,12],[5,9,12,16],[7,11,14,17],[9,12,16,19],[2,5,9,12],[7,11,14,17],[0,4,7,12],[5,9,12,16],[4,7,11,14],[9,12,16,19],[2,5,9,12],[5,9,12,16],[0,4,7,12],[7,11,14,17],[0,4,7,12]],
  melody:[[12,16,19,0,19,16,14,12],[16,0,19,21,19,0,16,0],[17,21,24,0,21,19,17,16],[14,0,19,17,16,14,11,0],[12,16,21,0,24,21,19,16],[14,17,21,0,19,17,14,0],[19,17,16,14,11,0,14,19],[16,14,12,0,0,0,7,11],[17,19,21,0,24,21,19,17],[16,0,19,23,21,19,16,14],[16,19,24,0,28,24,21,19],[17,0,21,24,21,19,17,14],[17,21,24,21,19,17,16,14],[16,19,24,0,19,16,14,12],[14,17,19,23,24,23,19,14],[16,14,12,0,7,0,11,0]]},
 'モールン':{title:'モールンのきらめきパレード',bpm:126,key:63,bars:32,lead:'brass',arp:'pluck',bass:'round',swing:.025,
  chords:[[0,4,7,12],[7,11,14,17],[9,12,16,19],[5,9,12,16],[0,4,7,12],[2,5,9,12],[5,9,12,16],[7,11,14,17],[9,12,16,19],[4,7,11,14],[5,9,12,16],[0,4,7,12],[2,5,9,12],[5,9,12,16],[7,11,14,17],[0,4,7,12]],
  melody:[[19,0,19,16,12,0,16,19],[23,19,14,0,19,0,23,0],[24,21,19,16,21,0,24,0],[21,17,0,21,24,21,19,17],[19,0,24,19,16,0,19,24],[21,17,14,17,21,0,24,21],[24,21,17,0,19,21,24,0],[23,0,19,14,19,23,26,0],[24,0,28,24,21,0,19,16],[23,19,16,0,19,23,26,23],[24,21,17,21,24,0,28,24],[19,16,12,0,16,19,24,0],[21,0,24,21,17,14,17,21],[24,21,17,0,21,24,29,28],[26,23,19,14,19,23,26,23],[24,19,16,12,0,0,14,16]]}
});
SONGS['エンディング']={title:'この街の灯りは、これからも',bpm:84,key:60,bars:32,lead:'flute',arp:'felt',bass:'soft',swing:0,
 chords:[[0,4,7,11],[7,11,14,19],[9,12,16,19],[4,7,11,14],[5,9,12,16],[0,4,7,12],[2,5,9,12],[7,11,14,17],[0,4,7,11],[4,7,11,14],[9,12,16,19],[5,9,12,16],[2,5,9,12],[5,9,12,16],[7,11,14,17],[0,4,7,12]],
 melody:[[12,0,16,19,0,16,14,0],[11,14,19,0,21,19,0,14],[12,16,21,0,24,21,19,0],[11,14,16,0,19,16,14,0],[12,17,21,0,24,21,19,17],[16,0,19,24,0,19,16,12],[14,17,21,0,19,17,14,0],[11,14,19,0,17,14,12,0],[24,0,28,31,0,28,26,24],[23,0,26,28,0,26,23,19],[21,24,28,0,31,28,24,21],[17,21,24,0,28,24,21,17],[14,0,17,21,0,19,17,14],[17,0,21,24,0,21,19,17],[19,0,23,26,0,23,19,14],[24,0,19,16,12,0,0,0]]};
SONGS['バッドエンド']={title:'消えた灯り、残るぬくもり',bpm:60,key:57,bars:16,lead:'felt',arp:'felt',bass:'soft',swing:0,
 chords:[[0,3,7,10],[5,8,12,15],[10,14,17,21],[7,11,14,17],[0,3,7,12],[8,12,15,19],[5,8,12,15],[7,11,14,19],[0,3,7,10],[3,7,10,14],[8,12,15,19],[5,8,12,15],[0,3,7,12],[5,8,12,15],[7,11,14,19],[0,3,7,12]],
 melody:[[19,0,15,0,12,0,0,0],[17,0,15,12,0,0,8,0],[14,0,17,0,21,0,17,0],[19,0,14,0,11,0,0,0],[12,0,15,0,19,0,15,0],[20,0,19,15,0,0,12,0],[17,0,15,0,12,0,8,0],[11,0,14,0,19,0,0,0],[24,0,19,0,15,0,12,0],[22,0,19,0,15,0,0,0],[20,0,19,15,0,0,12,0],[17,0,15,0,12,0,0,0],[15,0,19,0,24,0,19,0],[20,0,17,0,15,0,12,0],[14,0,11,0,19,0,14,0],[15,0,12,0,0,0,0,0]]};
function themeForState(s){
 if(s?.storyFailed||s?.status==='bankrupt')return 'バッドエンド';
 if(!s?.mascot||s.month<s.mascot.debutMonth)return null;
 if(['morun','morunBreak'].includes(s.events?.active?.type))return 'モールン';
 return s.events?.mascotBreak?.left>0?'こつまる':null;
}
function compose(context,season,sampleRate=22050){
 const song=SONGS[season];if(!song)throw Error('Unknown season');
 const sr=sampleRate,beat=60/song.bpm,bars=song.bars||16,length=Math.ceil(bars*4*beat*sr),buffer=context.createBuffer(2,length,sr),left=buffer.getChannelData(0),right=buffer.getChannelData(1);let noise=345678;
 const tone=(midi,start,duration,amp,kind,pan=0)=>{
  const f=440*2**((midi-69)/12),n=Math.ceil(duration*sr),at=Math.round(start*sr),l=Math.sqrt((1-pan)/2),r=Math.sqrt((1+pan)/2),twopi=Math.PI*2;
  for(let i=0;i<n;i++){const t=i/sr,tail=Math.min(1,Math.max(0,(duration-t)/.09)),p=twopi*f*t;let v=0;
   if(kind==='clarinet'){const env=Math.min(1,t/.025)*Math.exp(-t*2.1)*tail;v=(Math.sin(p+.014*Math.sin(t*twopi*5))+.20*Math.sin(3*p)+.055*Math.sin(5*p))*env;}
   else if(kind==='brass'){const env=Math.min(1,t/.022)*Math.exp(-t*2.7)*tail;v=(Math.sin(p+.009*Math.sin(t*twopi*5.4))+.25*Math.sin(2*p)+.11*Math.sin(3*p)+.035*Math.sin(4*p))*env;}
   else if(kind==='flute'){const env=Math.min(1,t/.055)*Math.exp(-t*1.45)*tail;v=(Math.sin(p+.013*Math.sin(t*twopi*4.8))+.08*Math.sin(2*p))*env;}
   else if(kind==='bell'){const env=Math.min(1,t/.005)*Math.exp(-t*2.9)*tail;v=(Math.sin(p)+.2*Math.exp(-t*3)*Math.sin(2.756*p)+.06*Math.sin(5.4*p))*env;}
   else if(kind==='wood'){const env=Math.min(1,t/.004)*Math.exp(-t*7.5)*tail;v=(Math.sin(p)+.19*Math.exp(-t*8)*Math.sin(3.99*p))*env;}
   else if(kind==='pluck'){const env=Math.min(1,t/.006)*Math.exp(-t*6)*tail;v=(Math.sin(p)+.28*Math.sin(2*p)+.1*Math.sin(3*p))*env;}
   else if(kind==='piano'||kind==='felt'){const env=Math.min(1,t/.009)*Math.exp(-t*(kind==='felt'?2.3:3.2))*tail;v=(Math.sin(p)+.22*Math.exp(-t*3)*Math.sin(2*p)+.07*Math.sin(3.005*p))*env;}
   else if(kind==='pad'){const env=Math.min(1,t/.22)*Math.min(1,(duration-t)/.35);v=(Math.sin(p)+.15*Math.sin(p*1.002)+.08*Math.sin(2*p))*Math.max(0,env);}
   else{const env=Math.min(1,t/.015)*Math.exp(-t*(kind==='upright'?3.2:2.5))*tail;v=(Math.sin(p)+.12*Math.sin(2*p))*env;}
   const k=(at+i)%length;left[k]+=v*amp*l;right[k]+=v*amp*r;
  }
 };
 const shaker=(at,amp,pan)=>{const n=Math.round(sr*.075);let prev=0;for(let i=0;i<n;i++){noise=(Math.imul(noise,1664525)+1013904223)>>>0;const a=noise/2147483648-1,v=(a-prev)*Math.exp(-i/(sr*.018))*amp;prev=a;const k=(Math.round(at*sr)+i)%length;left[k]+=v*(1-pan)*.5;right[k]+=v*(1+pan)*.5;}};
 const kick=at=>{for(let i=0;i<sr*.16;i++){const t=i/sr,k=(Math.round(at*sr)+i)%length,v=Math.sin(2*Math.PI*(48*t+1.8*(1-Math.exp(-t*28))))*Math.exp(-t*30)*Math.min(1,t/.003)*.055;left[k]+=v;right[k]+=v;}};
 for(let bar=0;bar<bars;bar++){
  const phrase=bar%song.chords.length,chord=song.chords[phrase],base=bar*4*beat,second=bar>=bars/2;
  tone(song.key+chord[0]-12,base,beat*1.8,.15,song.bass,-.12);
  tone(song.key+chord[0]-5,base+beat*2,beat*1.65,.10,song.bass,.12);
  // Distinct accompaniment: rolling piano, summer offbeats, autumn voicings, winter warm pads.
  if(season==='こつまる'){
   for(const off of [1,3])for(let j=1;j<4;j++)tone(song.key+chord[j],base+(off+j*.025)*beat,beat*.57,.044,'piano',(j-2)*.3);
   for(const off of [.5,2.5])tone(song.key+chord[2]+12,base+off*beat,beat*.55,.029,'wood',-.35);
   if(second)for(const off of [1.5,3.5])tone(song.key+chord[1]+12,base+off*beat,beat*.65,.024,'flute',-.35);
   shaker(base+beat, .012,-.3);shaker(base+3*beat,.012,.3);
  }
  else if(season==='モールン'){
   for(const off of [.5,1.5,2.5,3.5])for(let j=0;j<3;j++)tone(song.key+chord[j]+12,base+(off+j*.018)*beat,beat*.48,.031,'pluck',(j-1)*.4);
   for(const off of [0,2])kick(base+off*beat);
   for(const off of [1,3]){shaker(base+off*beat,.027,0);tone(song.key+chord[2]+12,base+off*beat,beat*.7,.027,'bell',-.35);}
   if(second)for(const off of [0,2.5])tone(song.key+chord[3]+12,base+off*beat,beat*1.2,.026,'bell',-.5);
  }
  else if(season==='バッドエンド'){for(let j=1;j<4;j++)tone(song.key+chord[j],base+j*.06,beat*3.5,.021,'pad',(j-2)*.3);for(const i of [0,2,5])tone(song.key+chord[[0,1,2,3][i%4]],base+i*.5*beat,beat*1.6,.036,'felt',-.22);}
  else if(season==='エンディング'){for(let j=0;j<4;j++)tone(song.key+chord[j],base+j*.025,beat*3.8,.035,'pad',(j-1.5)*.3);for(let i=0;i<8;i++)tone(song.key+chord[[0,1,2,3,2,1,2,1][i]],base+i*.5*beat,beat*1.2,.043,'felt',(i%3-1)*.3);if(second)tone(song.key+chord[2]+12,base+3*beat,beat*1.7,.025,'bell',-.4);}
  else if(season==='秋')for(const off of [0,2.5])for(let j=0;j<4;j++)tone(song.key+chord[j],base+(off+j*.035)*beat,beat*1.15,.042,'felt',(j-1.5)*.25);
  else if(season==='冬')for(let j=0;j<4;j++)tone(song.key+chord[j],base,beat*3.8,.032,'pad',(j-1.5)*.3);
  else if(season==='夏')for(const off of [.5,1.5,2.5,3.5])for(let j=0;j<3;j++)tone(song.key+chord[j]+(j===0?0:12),base+(off+j*.035)*beat,beat*.72,.046,'pluck',(j-1)*.35);
  else for(let i=0;i<8;i++)tone(song.key+chord[[0,1,2,3,2,1,3,2][i]]+(i%2?12:0),base+(i*.5+(i%2?song.swing:0))*beat,beat*.85,.052,'piano',(i%3-1)*.4);
  for(let i=0;i<8;i++){
   const m=song.melody[bar%song.melody.length][i];if(m){const mascot=season==='こつまる'||season==='モールン',variation=!mascot&&season!=='バッドエンド'&&second&&bar%4===2?-12:0;const kind=second&&season==='春'?'piano':song.lead;const duration=beat*(season==='冬'?1.55:season==='秋'?.95:season==='こつまる'?.76:.8);tone(song.key+m+variation,base+(i*.5+(i%2?song.swing:0))*beat,duration,season==='冬'?.11:.12,kind,.18);if(mascot&&second&&i%2===0)tone(song.key+m,base+i*.5*beat,beat*.8,.023,season==='モールン'?'bell':'wood',-.28);}
   if(season==='夏')shaker(base+i*.5*beat,i%2?.022:.012,i%2?.6:-.6);
   if(season==='秋'&&i%2===1)shaker(base+(i*.5+song.swing)*beat,.008,-.35);
   if(season==='冬'&&second&&i===6)tone(song.key+chord[2]+24,base+3*beat,beat*1.5,.038,'bell',-.45);
  }
 }
 // Gentle opposite-channel room echoes; wrapped tails keep the exact-length loop seamless.
 const delay=Math.round(beat*.75*sr),a=left.slice(),b=right.slice();let peak=0,sum=0;
 for(let i=0;i<length;i++){left[i]=a[i]+b[(i-delay+length)%length]*.14;right[i]=b[i]+a[(i-delay+length)%length]*.14;peak=Math.max(peak,Math.abs(left[i]),Math.abs(right[i]));sum+=left[i]*left[i]+right[i]*right[i];}
 const rms=Math.sqrt(sum/(2*length)),gain=Math.min(.11/Math.max(.001,rms),.78/Math.max(.001,peak));
 for(let i=0;i<length;i++){left[i]*=gain;right[i]*=gain;}
 return buffer;
}
// Original short chapter themes. Unlike seasonal tracks, tails never wrap and
// each buffer finishes in silence. Chapters share a motif with distinct voicings.
const CUES={start:{title:'新しい一歩',beats:8,bpm:100},clear:{title:'灯りがつながる',beats:12,bpm:108}};
function composeCue(context,kind,chapter=0,sr=22050){
 const spec=CUES[kind];if(!spec)throw Error('Unknown chapter cue');
 chapter=Math.min(8,Math.max(0,Math.floor(Number(chapter)||0)));
 const final=kind==='clear'&&chapter===8,beat=60/spec.bpm,beats=spec.beats+(final?4:0),length=Math.ceil((beats*beat+1.6)*sr),buffer=context.createBuffer(2,length,sr),channels=[buffer.getChannelData(0),buffer.getChannelData(1)],key=[60,62,65,64,67,62,65,67,60][chapter];
 const note=(midi,at,duration,amp,voice='piano',pan=0)=>{
  const start=Math.round(at*sr),f=440*2**((midi-69)/12),pans=[Math.sqrt((1-pan)/2),Math.sqrt((1+pan)/2)];
  for(let i=0;i<Math.ceil(duration*sr)&&start+i<length;i++){
   const t=i/sr,p=2*Math.PI*f*t,tail=Math.min(1,(duration-t)/.16);let v;
   if(voice==='flute')v=(Math.sin(p+.012*Math.sin(t*29))+.07*Math.sin(2*p))*Math.min(1,t/.055)*Math.exp(-t*1.8);
   else if(voice==='bell')v=(Math.sin(p)+.16*Math.sin(2.756*p)*Math.exp(-t*4))*Math.min(1,t/.005)*Math.exp(-t*3);
   else if(voice==='strings')v=(Math.sin(p)+.12*Math.sin(p*1.003))*Math.min(1,t/.18)*Math.min(1,(duration-t)/.4)*.7;
   else v=(Math.sin(p)+.2*Math.sin(2*p)*Math.exp(-t*3)+.06*Math.sin(3.005*p))*Math.min(1,t/.008)*Math.exp(-t*2.7);
   for(let c=0;c<2;c++)channels[c][start+i]+=v*Math.max(0,tail)*amp*pans[c];
  }
 };
 const chords=kind==='start'?[[0,4,7,14],[7,11,14,19]]:[[0,4,7,12],[5,9,12,16],[7,11,14,17],[0,4,7,12]];
 for(let bar=0;bar<beats/4;bar++){
  const chord=chords[bar%chords.length],at=bar*4*beat;
  note(key+chord[0]-12,at,beat*3.4,.12,'piano',-.12);
  chord.forEach((p,j)=>note(key+p+(j===0&&chapter%2===1?12:0),at+j*.035,beat*3.5,.042,chapter>=3?'strings':'piano',(j-1.5)*.3));
  for(let i=0;i<8;i++)note(key+chord[[0,1,2,3,2,1,2,3][i]]+12,at+i*.5*beat,beat*.8,.038,'piano',(i%3-1)*.45);
 }
 const melody=kind==='start'?[[0,12],[1,16],[2,19],[3.5,21],[4,19],[5,14],[6,19]]:[[0,19],[.5,16],[1,19],[2,24],[3,23],[4,21],[5,17],[6,21],[7,24],[8,23],[9,19],[10,24]];
 for(const [at,p]of melody)note(key+p,at*beat,beat*(at===melody.at(-1)[0]?2.5:.95),.13,kind==='start'?(chapter%2?'piano':'flute'):'bell',.15);
 if(chapter>=2)for(const at of [1.5,5.5])note(key+24,at*beat,beat*1.5,.025,'bell',-.45);
 // A resolved chord and bell mark achievement, including a longer final cadence.
 if(kind==='clear'){
  const at=(final?12:10)*beat;for(const p of [0,4,7,12])note(key+p,at,beat*3,.065,'piano',-.1);
  if(final)for(const [i,p]of [24,28,31,36].entries())note(key+p,(12+i*.5)*beat,beat*2,.07,'bell',i%2?.4:-.4);
 }
 const delay=Math.round(.16*sr),a=channels.map(x=>x.slice());let peak=0,sum=0;
 for(let i=0;i<length;i++)for(let c=0;c<2;c++){const fade=Math.min(1,i/(sr*.015),(length-1-i)/(sr*.3));channels[c][i]=(a[c][i]+(i>=delay?a[1-c][i-delay]*.13:0))*Math.max(0,fade);peak=Math.max(peak,Math.abs(channels[c][i]));sum+=channels[c][i]**2;}
 const gain=Math.min(.105/Math.max(.001,Math.sqrt(sum/(2*length))),.72/Math.max(.001,peak));for(const channel of channels)for(let i=0;i<length;i++)channel[i]*=gain;
 return buffer;
}
class SeasonMusic{
 constructor(){this.context=null;this.enabled=savedEnabled();this.active=false;this.season='冬';this.theme=null;this.volume=.3;this.offset=0;this.voice=null;this.voices=new Set();this.buffers=new Map();this.ticket=0;this.fade=.9;this.cue=null;this.cueTicket=0;this.cueBuffers=new Map();this.lastCueKey=null;this.cueHold=false;}
 init(){if(this.context)return;const Audio=root.AudioContext||root.webkitAudioContext;if(!Audio)throw Error('このブラウザでは音を再生できません。');this.context=new Audio();this.master=this.context.createGain();this.master.gain.value=this.volume*.72;this.master.connect(this.context.destination);}
 get title(){return SONGS[this.theme||this.season].title;}
 getBuffer(season){if(!this.buffers.has(season))this.buffers.set(season,compose(this.context,season));return this.buffers.get(season);}
 async enable(value){const ticket=++this.ticket;this.enabled=Boolean(value);rememberEnabled(this.enabled);if(!value){this.stop(true);return;}try{this.init();await this.context.resume();if(ticket===this.ticket&&this.enabled)this.sync(this.season,this.active,this.theme);}catch(e){if(ticket===this.ticket)this.stop(true);throw e;}}
 ramp(param,value,seconds){const now=this.context.currentTime;if(param.cancelAndHoldAtTime)param.cancelAndHoldAtTime(now);else{const held=param.value;param.cancelScheduledValues?.(now);param.setValueAtTime?.(held,now);}param.linearRampToValueAtTime(value,now+seconds);}
 dispose(v){if(!v||v.disposed)return;v.disposed=true;try{v.source.stop();}catch(e){}v.source.disconnect();v.gain.disconnect();this.voices.delete(v);if(this.voice===v)this.voice=null;}
 retire(v,seconds){if(!v||v.disposed)return;this.ramp(v.gain.gain,0,seconds);v.source.stop(this.context.currentTime+seconds+.02);}
 stopCue(release=true){++this.cueTicket;const cue=this.cue;this.cue=null;if(cue){cue.source.onended=null;this.dispose(cue);}if(release){this.cueHold=false;if(this.enabled&&this.active&&this.context?.state==='running')this.sync(this.season,this.active,this.theme);}}
 pauseSeason(remember=true){if(this.voice&&remember)this.offset=(this.voice.offset+Math.max(0,this.context.currentTime-this.voice.start))%this.voice.buffer.duration;for(const v of [...this.voices])this.dispose(v);this.voice=null;}
 async playCue(kind,chapter,eventKey){
  if(!CUES[kind]||eventKey===this.lastCueKey)return false;
  this.stopCue(false);this.cueHold=true;this.pauseSeason();
  if(!this.enabled||!this.active||root.document?.hidden)return false;
  this.lastCueKey=eventKey;const ticket=this.cueTicket;
  try{
   this.init();await this.context.resume();if(ticket!==this.cueTicket||!this.enabled||!this.active||this.context.state!=='running')return false;
   const key=kind+':'+chapter;if(!this.cueBuffers.has(key)){this.cueBuffers.set(key,composeCue(this.context,kind,chapter));if(this.cueBuffers.size>4)this.cueBuffers.delete(this.cueBuffers.keys().next().value);}
   const source=this.context.createBufferSource(),gain=this.context.createGain(),buffer=this.cueBuffers.get(key);source.buffer=buffer;source.loop=false;gain.gain.value=1;source.connect(gain);gain.connect(this.master);
   const cue={source,gain,buffer,kind,chapter,disposed:false};this.cue=cue;
   source.onended=()=>{if(this.cue!==cue)return;this.cue=null;this.dispose(cue);};source.start(0);return true;
  }catch(e){if(ticket===this.cueTicket)this.stopCue(false);return false;}
 }
 stop(remember=true){this.stopCue(false);this.pauseSeason(remember);}
 sync(season,active=true,theme=null){
  if(!SONGS[season])season='冬';if(!['こつまる','モールン','エンディング','バッドエンド'].includes(theme))theme=null;const track=theme||season,changed=(this.theme||this.season)!==track;this.season=season;this.theme=theme;this.active=Boolean(active);if(changed)this.offset=0;
  if(!this.enabled||!active||this.context?.state!=='running'){this.stop(!changed);return;}
  if(this.cueHold){this.pauseSeason();return;}
  if(this.voice?.season===track)return;
  const old=this.voice;for(const v of [...this.voices])if(v!==old)this.dispose(v);
  const buffer=this.getBuffer(track),source=this.context.createBufferSource(),gain=this.context.createGain();gain.gain.value=0;source.buffer=buffer;source.loop=true;source.connect(gain);gain.connect(this.master);
  const offset=changed?0:this.offset%buffer.duration,v={source,gain,season:track,buffer,offset,start:this.context.currentTime,disposed:false};this.voice=v;this.voices.add(v);source.onended=()=>{if(!v.disposed){v.disposed=true;source.disconnect();gain.disconnect();this.voices.delete(v);if(this.voice===v)this.voice=null;}};
  source.start(0,offset);this.ramp(gain.gain,1,old?this.fade:.2);if(old)this.retire(old,this.fade);
 }
 setVolume(value){this.volume=Math.min(1,Math.max(0,Number(value)||0));if(this.master)this.ramp(this.master.gain,this.volume*.72,.08);}
 resumeFromGesture(){if(!this.enabled||!this.active)return;const ticket=this.ticket;try{this.init();if(this.context.state==='running'){this.sync(this.season,this.active,this.theme);return;}return this.context.resume().then(()=>{if(ticket===this.ticket&&this.enabled)this.sync(this.season,this.active,this.theme);}).catch(()=>{});}catch(e){}}
}
root.KSeasonMusic=SeasonMusic;SeasonMusic.songs=SONGS;SeasonMusic.compose=compose;SeasonMusic.themeForState=themeForState;SeasonMusic.cues=CUES;SeasonMusic.composeCue=composeCue;if(typeof module!=='undefined')module.exports=SeasonMusic;
})(typeof globalThis!=='undefined'?globalThis:this);
