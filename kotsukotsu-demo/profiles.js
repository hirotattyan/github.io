(function(root){
'use strict';
const maxProfiles=5;
const key='kotsukotsu-demo-profiles-v1',idPattern=/^(main|fresh-[a-z0-9]+-[a-z0-9]+)$/;
function empty(){return {format:'kotsukotsu-demo-profiles',version:1,active:'main',entries:[{id:'main',name:'これまでの街'}]};}
function decode(text){const d=JSON.parse(text);if(d?.format!=='kotsukotsu-demo-profiles'||d.version!==1||!Array.isArray(d.entries)||!d.entries.length||d.entries.length>100||d.entries.some(p=>!p||!idPattern.test(p.id)||typeof p.name!=='string'||!p.name.trim()||p.name.length>60)||new Set(d.entries.map(p=>p.id)).size!==d.entries.length||!d.entries.some(p=>p.id==='main')||!d.entries.some(p=>p.id===d.active))throw Error('保存した街の一覧が不正です。');return {format:d.format,version:1,active:d.active,entries:d.entries.map(p=>({id:p.id,name:p.name}))};}
function keys(id){if(!idPattern.test(id))throw Error('街の保存先が不正です。');return {auto:id==='main'?'kotsukotsu-demo-save-v2':'kotsukotsu-demo-profile-'+id+'-auto',manual:id==='main'?'kotsukotsu-demo-save-v2-manual':'kotsukotsu-demo-profile-'+id+'-manual',meta:id==='main'?'kotsukotsu-demo-meta-v1':'kotsukotsu-demo-meta-v1-'+id};}
function fresh(registry){if(registry.entries.length>=maxProfiles)throw Error('街の保存枠は５枠までです。今ある街はそのまま残っています。');let id;do{id='fresh-'+Date.now().toString(36)+'-'+Math.floor(Math.random()*0x100000000).toString(36);}while(registry.entries.some(p=>p.id===id));return {id,name:'引き継ぎなしの街 '+registry.entries.length};}
const P={key,maxProfiles,empty,decode,keys,fresh};root.KGameProfiles=P;if(typeof module!=='undefined')module.exports=P;
})(globalThis);
