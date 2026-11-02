(function(root){
'use strict';
const C=root.KConfig||(typeof require==='function'?require('./config.js'):null),E=()=>root.KE;
const rules={firstMonth:6,chance:.12,gap:6,offerMonths:3,contractMonths:36,renewalMonths:3,radius:3};
const definitions={
 diner:{name:'人気の定食チェーン',cost:1800000,rent:75000,w:2,h:1,color:'#a9674f',mark:'定食',pop:[1.5,1,.9,.8],competition:['diner'],loss:.18,art:'tenant-diner'},
 sweets:{name:'話題のスイーツ専門店',cost:1800000,rent:65000,w:2,h:1,color:'#bb8690',mark:'菓子',pop:[.8,1.6,.8,1.1],competition:['bakery','cafe'],loss:.12,art:'tenant-sweets'},
 tea:{name:'老舗のお茶・和菓子店',cost:900000,rent:35000,w:1,h:1,color:'#73865c',mark:'茶',pop:[.9,1,1.5,.7],competition:['cafe'],loss:.08,art:'tenant-tea'},
 character:{name:'キャラクター雑貨店',cost:1400000,rent:55000,w:2,h:1,color:'#b7a158',mark:'雑貨',pop:[.8,1.1,.7,1.6],competition:['toy','kotsumaru'],loss:.16,art:'tenant-character'}
};
for(const [id,d] of Object.entries(definitions))C.facilities['tenant_'+id]={...d,tenant:true,allSideEntrance:true,shop:false,fixed:0,months:1,scope:'周辺3マスの同業店',effect:'誘致店が維持費・修理費を負担します。契約中は固定の場所代を受け取り、営業中は集客と近隣同業店への競合が発生します。契約中の撤去・改装はできません。'};
function tenantRng(s){s.tenantSeed=(Math.imul(s.tenantSeed??(s.seed^0x74656e74),1664525)+1013904223)>>>0;return s.tenantSeed/4294967296;}
function building(s){return s.tenantLease?s.buildings.find(b=>b.id===s.tenantLease.buildingId):null;}
function active(s){const b=building(s);return s.tenantLease?.remaining>0&&b&&!root.KEvents?.isTyphoon(s)&&E().operational(s,b)?b:null;}
function siteError(s,type,site,net){
 const d=definitions[type];if(!d||!site||![0,1,2,3].includes(site.rotation)||!Number.isInteger(site.x)||!Number.isInteger(site.y))return '出店予定地が不正です。';
 const b={type:'tenant_'+type,...site},shape=E().footprint(b);
 if(b.x<0||b.y<0||b.x+shape.w>s.size||b.y+shape.h>s.size)return '出店予定地が街の範囲外です。';
 for(const [x,y] of E().cells(b)){if(E().at(s,x,y))return '出店予定地が空いていません。';if(s.projectSite&&!s.projectSite.id&&s.projectSite.x===x&&s.projectSite.y===y)return '今月の企画会場に指定されています。';}
 if(!(net||E().network(s)).connected(b))return '出店予定地の入口につながる道路が必要です。';return null;
}
function sites(s,type){const d=definitions[type],out=[],net=E().network(s);if(!d)return out;for(const rotation of [0,1,2,3]){const shape=E().footprint({type:'tenant_'+type,rotation});for(let y=0;y<=s.size-shape.h;y++)for(let x=0;x<=s.size-shape.w;x++){const site={x,y,rotation};if(!siteError(s,type,site,net))out.push(site);}}return out;}
function begin(s,{rng}){
 const t=s.tenantLease;
 if(t&&t.remaining===0&&s.month>=t.renewalUntil){depart(s);s.notices.push('誘致店が契約を終えて退去しました。土地を再利用できます。');}
 if(s.tenantOffer&&(s.month>=E().turnLimit(s)||s.month>=s.tenantOffer.expiresMonth||siteError(s,s.tenantOffer.type,s.tenantOffer.site))){s.tenantOffer=null;s.notices.push('出店要請は期限または用地の条件により終了しました。');}
 if(s.tenantLease||s.tenantOffer||s.month<rules.firstMonth||s.month+rules.offerMonths>=E().turnLimit(s)||s.month-(s.lastTenantOfferMonth??-100)<rules.gap||s.events.active?.kind==='disaster')return;
 const candidates=Object.keys(definitions).map(type=>({type,sites:sites(s,type)})).filter(c=>c.sites.length);
 if(!candidates.length||rng(s)>=rules.chance)return;
 const c=candidates[Math.floor(rng(s)*candidates.length)],site=c.sites[Math.floor(rng(s)*c.sites.length)];
 s.tenantOffer={type:c.type,site,issuedMonth:s.month,expiresMonth:s.month+rules.offerMonths};s.lastTenantOfferMonth=s.month;
 s.notices.push(definitions[c.type].name+'から空き地への出店要請。企画・予定表で条件を確認できます。');s.milestones.push('tenant-offer');
}
function accept(s){const o=s.tenantOffer;if(!E().canAct(s)||!o||s.tenantLease||s.month>=o.expiresMonth)return {error:'受付中の出店要請がありません。'};const error=siteError(s,o.type,o.site);if(error)return {error};const d=definitions[o.type];if(!E().charge(s,d.cost,'construction',d.name+'の土地整備費'))return {error:'納税用の確保額を除いた整備資金が足りません。'};
 const b={id:s.nextId++,type:'tenant_'+o.type,...o.site,level:1,build:1,closed:0,damage:0,spec:0,fans:0,reputation:0,legacy:false,invested:0};s.buildings.push(b);s.tenantLease={type:o.type,buildingId:b.id,remaining:rules.contractMonths};s.tenantOffer=null;return {};}
function decline(s){if(!E().canAct(s)||!s.tenantOffer)return {error:'受付中の出店要請がありません。'};s.tenantOffer=null;return {};}
function depart(s){const id=s.tenantLease?.buildingId;s.buildings=s.buildings.filter(b=>b.id!==id);s.tenantLease=null;}
function renew(s){const t=s.tenantLease;if(!E().canAct(s)||!t||t.remaining!==0||s.month>=t.renewalUntil)return {error:'更新の受付期間ではありません。'};const d=definitions[t.type],fee=Math.round(d.cost*.4);if(!E().charge(s,fee,'construction',d.name+'の契約更新整備費'))return {error:'契約更新の整備資金が足りません。'};t.remaining=rules.contractMonths;delete t.renewalUntil;return {};}
function leave(s){if(!E().canAct(s)||!s.tenantLease||s.tenantLease.remaining!==0)return {error:'契約満了後に退去を選べます。'};depart(s);return {};}
function rent(s){const b=building(s);return b&&!b.build&&E().network(s).connected(b)&&s.tenantLease.remaining>0?definitions[s.tenantLease.type].rent:0;}
function lift(s,segment){return active(s)?definitions[s.tenantLease.type].pop[segment]*.025:0;}
function competition(s,b){const t=active(s);if(!t)return 0;const d=definitions[s.tenantLease.type];return d.competition.includes(b.type)&&E().distance(b,t)<=rules.radius?d.loss:0;}
function settle(s){const t=s.tenantLease,b=building(s);if(t&&b&&!b.build&&t.remaining>0){t.remaining--;if(t.remaining===0){t.renewalUntil=s.month+1+rules.renewalMonths;s.notices.push('誘致店の3年契約が満了しました。3か月以内に更新か退去を選んでください。回答まで場所代・集客・競合は停止します。');}}}
// Compare a normal operating month for the contract estimate: temporary shows,
// weather and mascot booms must not be counted as 36 months of recurring income.
function normalMonth(s){const copy=E().clone(s);copy.project=null;copy.projectSite=null;copy.response='save';copy.events={...copy.events,active:null,next:null,boom:null,mascotBreak:null,mascotMoment:null,securityIncident:null,weather:{month:copy.month,type:'clear'}};if(copy.castle){copy.castle.walkMonth=-1;copy.castle.festivalMonth=-1;}return copy;}
function proposal(s){
 const o=s.tenantOffer,t=s.tenantLease,renewal=!o&&t?.remaining===0;if(!o&&!renewal||o&&siteError(s,o.type,o.site))return null;
 const type=(o||t).type,fee=Math.round(definitions[type].cost*(renewal ? .4 : 1)),copy=E().clone(s);copy.cash=Math.max(copy.cash,fee+E().taxReserve(copy));const r=renewal?renew(copy):accept(copy);if(r.error)return null;building(copy).build=0;
 const before=E().forecast(s),after=E().forecast(copy),steadyBefore=E().forecast(normalMonth(s)),steadyAfter=E().forecast(normalMonth(copy)),monthly=steadyAfter.operating-steadyBefore.operating,months=rules.contractMonths,net=monthly*months-fee,payback=monthly>0?Math.ceil(fee/monthly):null;
 return {before,after,visitors:after.total-before.total,operating:after.operating-before.operating,projection:{fee,months,monthly,net,payback,recovers:payback!==null&&payback<=months,renewal,constructionMonths:renewal?0:1},affected:after.shops.filter(row=>competition(copy,copy.buildings.find(b=>b.id===row.id))>0).map(row=>({id:row.id,type:row.type,change:row.profit-before.shops.find(b=>b.id===row.id).profit}))};
}
function validate(s){if(s.tenantSeed!==undefined&&(!Number.isSafeInteger(s.tenantSeed)||s.tenantSeed<0||s.tenantSeed>4294967295))throw Error('誘致店の抽選記録が不正です。');const t=s.tenantLease,o=s.tenantOffer,bs=s.buildings.filter(b=>C.facilities[b.type]?.tenant);if(bs.length>1||bs.length!==(t?1:0))throw Error('誘致店の契約と施設の記録が一致しません。');if(t&&(!definitions[t.type]||!Number.isInteger(t.remaining)||t.remaining<0||t.remaining>rules.contractMonths||!building(s)||building(s).type!=='tenant_'+t.type||(t.remaining===0&&(!Number.isSafeInteger(t.renewalUntil)||t.renewalUntil<s.month||t.renewalUntil>s.month+rules.renewalMonths))))throw Error('誘致店の契約データが不正です。');if(o&&(t||!definitions[o.type]||!Number.isSafeInteger(o.issuedMonth)||o.issuedMonth<rules.firstMonth||o.issuedMonth>s.month||o.expiresMonth!==o.issuedMonth+rules.offerMonths||!o.site||!Number.isInteger(o.site.x)||!Number.isInteger(o.site.y)||![0,1,2,3].includes(o.site.rotation)))throw Error('出店要請の記録が不正です。');if(o){if(s.month>=E().turnLimit(s))s.tenantOffer=null;else if(s.month>=o.expiresMonth)throw Error('出店要請の記録が不正です。');}if(s.lastTenantOfferMonth!==undefined&&(!Number.isSafeInteger(s.lastTenantOfferMonth)||s.lastTenantOfferMonth<rules.firstMonth||s.lastTenantOfferMonth>s.month))throw Error('出店要請の年月が不正です。');}
const T={rng:tenantRng,rules,definitions,building,active,siteError,sites,begin,accept,decline,depart,renew,leave,rent,lift,competition,settle,proposal,validate};root.KTenants=T;if(typeof module!=='undefined')module.exports=T;
})(typeof globalThis!=='undefined'?globalThis:this);
