/* Browser-only saves: verified local copy + independent IndexedDB mirror. */
(function(root){
'use strict';
class SaveStorage{
 constructor(key,decode){this.key=key;this.decode=decode;this.blocked=false;this.problem='';this.raw=null;this.database=null;this.queue=Promise.resolve();this.lastTime=0;this.hosted=false;}
 localCandidates(){const records=[];for(const key of [this.key,this.key+'-backup']){try{const text=root.localStorage.getItem(key);if(text)records.push({text,updatedAt:Number(root.localStorage.getItem(key+'-time'))||0,source:key===this.key?'browser':'backup'});}catch(e){this.problem='ブラウザ内の保存領域を利用できません。';}}return records;}
 db(){if(this.database)return this.database;this.database=new Promise(resolve=>{if(!root.indexedDB){resolve(null);return;}let settled=false;const finish=db=>{if(settled){db?.close();return;}settled=true;resolve(db);};const timer=root.setTimeout(()=>finish(null),4000);try{const request=root.indexedDB.open('kotsukotsu-demo-saves',1);request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains('saves'))request.result.createObjectStore('saves');};request.onsuccess=()=>{root.clearTimeout(timer);finish(request.result);};request.onerror=()=>{root.clearTimeout(timer);finish(null);};request.onblocked=()=>{root.clearTimeout(timer);finish(null);};}catch(e){root.clearTimeout(timer);finish(null);}});return this.database;}
 async readMirror(){const db=await this.db();if(!db)return null;return new Promise(resolve=>{try{const tx=db.transaction('saves','readonly'),request=tx.objectStore('saves').get(this.key);request.onsuccess=()=>resolve(request.result||null);request.onerror=()=>resolve(null);tx.onabort=()=>resolve(null);}catch(e){resolve(null);}});}
 select(records){let invalid=false;const ordered=[...records].sort((a,b)=>b.updatedAt-a.updatedAt),seen=new Set();for(const r of ordered){if(seen.has(r.text))continue;seen.add(r.text);this.raw=this.raw||r.text;try{const state=this.decode(r.text);this.blocked=false;this.lastTime=r.updatedAt;return {...r,state,blocked:false};}catch(e){invalid=true;this.problem=e.message;}}this.blocked=invalid;return {state:null,blocked:this.blocked,error:this.problem,raw:this.raw};}
 async remote(method='GET',record){if(!this.hosted)return {disabled:true};const controller=new AbortController(),timer=root.setTimeout(()=>controller.abort(),10000);try{const response=await root.fetch('/api/progress/'+encodeURIComponent(this.key),{method,credentials:'same-origin',cache:'no-store',signal:controller.signal,headers:record?{'Content-Type':'application/json'}:{},body:record?JSON.stringify(record):undefined});if(!response.ok)throw Error('オンライン保存に接続できません（'+response.status+'）');const value=await response.json();return {value};}catch(e){return {error:e.message||'オンライン保存に接続できません。'};}finally{root.clearTimeout(timer);}}
 load(done){const records=this.localCandidates(),finish=(cloud={disabled:true})=>{const info=this.select(records);if(info.state&&info.source!=='browser'){try{root.localStorage.setItem(this.key,info.text);root.localStorage.setItem(this.key+'-time',String(info.updatedAt));}catch(e){}}
  if(cloud.error&&!info.state){info.blocked=true;info.error=cloud.error+'。保存を保護するため自動的に新しい街を作りません。';this.blocked=true;}done(info);
 };
 if(!root.indexedDB&&!this.hosted){finish();return;}
 Promise.all([this.readMirror(),this.remote()]).then(async([mirror,cloud])=>{if(mirror?.text)records.push({...mirror,source:'database'});if(cloud.value?.text)records.push({...cloud.value,source:'online'});
  if(this.hosted&&!cloud.error&&!cloud.value){const local=this.select(records);if(local.state)await this.remote('PUT',{text:local.text,updatedAt:local.updatedAt||Date.now()});}
  finish(cloud);
 }).catch(()=>finish({error:'保存を読み込めませんでした。'}));
 }
 allowReplace(){this.blocked=false;this.problem='';}
 write(text){if(this.blocked)return {local:false,done:Promise.resolve({ok:false,error:'読み込めなかった保存を保護中です。'})};this.decode(text);const updatedAt=Math.max(Date.now(),this.lastTime+1);this.lastTime=updatedAt;let local=false,localError='';
  try{const previous=root.localStorage.getItem(this.key);if(previous){try{this.decode(previous);root.localStorage.setItem(this.key+'-backup',previous);root.localStorage.setItem(this.key+'-backup-time',root.localStorage.getItem(this.key+'-time')||'0');}catch(e){/* Never replace a good backup with an unreadable save. */}}
   root.localStorage.setItem(this.key,text);local=root.localStorage.getItem(this.key)===text;if(local)root.localStorage.setItem(this.key+'-time',String(updatedAt));
  }catch(e){localError=(e.name?e.name+'：':'')+(e.message||'ブラウザ内へ保存できません。');}
  const done=this.queue=this.queue.catch(()=>{}).then(async()=>{
   const db=await this.db();let mirror=false;
   if(db)mirror=await new Promise(resolve=>{try{const tx=db.transaction('saves','readwrite');tx.objectStore('saves').put({text,updatedAt},this.key);tx.oncomplete=()=>resolve(true);tx.onerror=()=>resolve(false);tx.onabort=()=>resolve(false);}catch(e){resolve(false);}});
   if(mirror){const check=await this.readMirror();mirror=check?.text===text;}
   const online=await this.remote('PUT',{text,updatedAt}),cloud=!!online.value?.ok;
   return {ok:local||mirror||cloud,local,mirror,cloud,hosted:this.hosted,error:local||mirror||cloud?online.error:(online.error||localError||'保存先への書き込みを確認できません。')};
  });return {local,done};

 }
}
root.KSaveStorage=SaveStorage;
if(typeof module!=='undefined')module.exports=SaveStorage;
})(globalThis);
