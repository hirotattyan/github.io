/* Browser-local top five scores; one entry per run, including checkpoints. */
class ForestRecords{
 constructor(storage){this.storage=storage;this.key='mori-sururi-top5-v2';this.persistent=Boolean(storage);this.data={boar:[],tiger:[]};this.load();}
 normalise(rows){const byId=new Map();if(!Array.isArray(rows))return [];for(const entry of rows){if(!entry||typeof entry.id!=='string'||!entry.id||!Number.isFinite(entry.time)||entry.time<.1)continue;const clean={id:entry.id,time:entry.time,score:Math.floor(entry.time*10)};if(!byId.has(clean.id)||byId.get(clean.id).time<clean.time)byId.set(clean.id,clean);}return [...byId.values()].sort((a,b)=>b.score-a.score||b.time-a.time).slice(0,5);}
 load(){if(!this.storage)return;let raw;try{raw=this.storage.getItem(this.key);}catch{this.persistent=false;return;}if(raw){try{const saved=JSON.parse(raw);if(saved&&Array.isArray(saved.boar)&&Array.isArray(saved.tiger)){for(const type of ['boar','tiger'])this.data[type]=this.normalise(saved[type]);return;}}catch{}}
  try{const old=JSON.parse(this.storage.getItem('mori-sururi-records-v1')||'{}');for(const type of ['boar','tiger'])if(old&&Number.isFinite(old[type])&&old[type]>=.1)this.data[type]=[{id:`legacy-${type}`,time:old[type],score:Math.floor(old[type]*10)}];}catch{}
 }
 list(type){return (this.data[type]||[]).map(entry=>({...entry}));}
 bestTime(type){return this.data[type]?.[0]?.time||0;}
 record(type,id,time){if(!['boar','tiger'].includes(type)||typeof id!=='string'||!id||!Number.isFinite(time)||time<.1)return false;const before=JSON.stringify(this.data[type]),old=this.data[type].find(entry=>entry.id===id);if(old&&time<=old.time)return false;this.data[type]=this.normalise([...this.data[type].filter(entry=>entry.id!==id),{id,time}]);if(before===JSON.stringify(this.data[type]))return false;this.save();return true;}
 save(){if(!this.storage){this.persistent=false;return;}try{this.storage.setItem(this.key,JSON.stringify(this.data));}catch{this.persistent=false;}}
}
if(typeof module!=='undefined')module.exports=ForestRecords;
