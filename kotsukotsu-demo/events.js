(function(root){
'use strict';const C=root.KConfig||(typeof require==='function'?require('./config.js'):null),R=C.monthlyEvents;
function rivalAnnouncement(type,upcoming=false){
 if(type==='morunBreak')return upcoming?'近隣の大型商業施設で、マスコット「モールン」の人気が急上昇しています。':'近隣の大型商業施設が、大人気の「モールン」で多くのお客さんを集めています。';
 if(type==='morun')return upcoming?'近隣の大型商業施設が、マスコット「モールン」のお披露目イベントを開催します。':'近隣の大型商業施設が、マスコット「モールン」で集客しています。';
 const actions={sale:['大規模な値引きセールを実施します。','大規模な値引きセールを実施しています。'],specialist:['人気の専門店を誘致します。','誘致した人気の専門店で集客しています。'],family:['「大型ファミリーイベント」を開催します。','「大型ファミリーイベント」を開催しています。'],bus:['無料送迎バスの運行を開始します。','無料送迎バスを運行しています。'],renewal:['大規模なリニューアルを行い、集客を強化します。','リニューアルにより集客を強化しています。']};
 return '近隣の大型商業施設が'+actions[type][upcoming?0:1];
}
function disasterType(e){return e?.kind==='disaster'?(e.type||(/台風/.test(e.name)?'typhoon':'flood')):null;}
function isTyphoon(s){return disasterType(s.events.active)==='typhoon';}
function stage(month){return R.rivalStages.filter(r=>month>=r.from).at(-1);}
function climate(s){
 if(isTyphoon(s))return {weather:'台風・全店舗休業',type:'typhoon',factor:0,cover:0};
 if(disasterType(s.events.active)==='flood')return {weather:'大雨・浸水',type:'flood',factor:s.prepared?.86:.65,cover:.35};
 const type=s.events.weather?.month===s.month?s.events.weather.type:'clear';
 return {weather:{rain:'長雨',heat:'猛暑',snow:'大雪',sunny:'晴天',clear:'穏やかな天候'}[type]||'穏やかな天候',type,factor:R.weatherFactor[type]??1,cover:R.arcadeProtection[type]||0};
}
// Legacy saves reconstruct paid royalties since the most recent break began.
// Forecasts never change this counter; only settled months contribute.
function morunRoyaltyTotal(s){
 if(s.events.morunRoyaltyTotal!==undefined)return s.events.morunRoyaltyTotal;
 let since=-Infinity,previous=null;
 for(const h of s.history){
  const c=h.competition;
  if(c?.type==='morunBreak'&&(previous?.type!=='morunBreak'||c.left>=previous.left))since=h.month;
  previous=c;
 }
 if(s.events.active?.type==='morunBreak'&&Number.isInteger(s.events.active.at))since=Math.max(since,s.events.active.at);
 return s.history.filter(h=>h.month>=since&&h.competition?.type!=='morunBreak').reduce((sum,h)=>sum+(h.royalty||0),0);
}
function kotsumaruSalesTotal(s){
 if(s.events.kotsumaruSalesTotal!==undefined)return s.events.kotsumaruSalesTotal;
 const since=s.events.lastMascotBreakMonth===undefined?-Infinity:s.events.lastMascotBreakMonth+C.mascotBreakRules.duration;
 return s.history.filter(h=>h.month>=since&&!h.kotsumaruBreak).reduce((sum,h)=>sum+(h.shops||[]).filter(b=>b.type==='kotsumaru'&&!b.notes?.some(n=>n.includes('こつまるブレイク'))).reduce((n,b)=>n+(b.sales||0),0),0);
}
function beginMascotMoment(s){
 const e=s.events,E=root.KE;e.mascotMoment=null;
 if(!E.mascotActive(s)||s.month<=s.mascot.debutMonth||s.month>=E.turnLimit(s)||e.active||e.boom||e.mascotBreak||!['clear','sunny'].includes(climate(s).type)||s.month-(e.lastMascotMomentMonth??-100)<C.mascotMomentRules.gap)return;
 const draw=()=>{e.mascotMomentSeed=(Math.imul(e.mascotMomentSeed??((s.seed^0x4b4f5453)>>>0),1664525)+1013904223)>>>0;return e.mascotMomentSeed/4294967296;};
 const roll=draw();let boundary=0,type=null;
 for(const [id,rule]of Object.entries(C.mascotMoments)){boundary+=rule.chance;if(roll<boundary){type=id;break;}}
 if(!type)return;
 const rule=C.mascotMoments[type];if(s.month-(e.mascotMomentHistory?.[type]??-100)<rule.cooldown||type==='duet'&&!E.morunKnown(s))return;
 const moment={type,at:s.month};
 if(type==='help'){
  const shops=s.buildings.filter(b=>C.facilities[b.type].shop&&E.operational(s,b)).sort((a,b)=>a.id-b.id);if(!shops.length)return;
  const start=Math.floor(draw()*shops.length),count=Math.min(C.mascotMomentRules.maxHelpShops,Math.ceil(shops.length/4));moment.shopIds=Array.from({length:count},(_,i)=>shops[(start+i)%shops.length].id);
 }
 e.mascotMoment=moment;e.lastMascotMomentMonth=s.month;e.mascotMomentHistory={...e.mascotMomentHistory,[type]:s.month};s.milestones.push(rule.art);s.notices.push(rule.name+'。今月のうれしい知らせです。');
}
function beginSecurityIncident(s){
 const e=s.events,E=root.KE,r=C.securityIncidentRules,old=e.securityIncident;
 e.securityIncident=old&&s.month<old.at+r.duration?{...old,left:old.at+r.duration-s.month}:null;
 if(e.securityIncident||s.month<r.firstMonth||s.month>=E.turnLimit(s)||e.active?.kind==='disaster'||s.month-(e.lastSecurityIncidentMonth??-100)<r.cooldown)return;
 const net=E.network(s),shops=s.buildings.filter(b=>C.facilities[b.type].shop&&E.operational(s,b,net));if(!shops.length)return;
 if(E.townStateLabels(E.forecast(s)).security!=='bad')return;
 e.securityIncidentSeed=(Math.imul(e.securityIncidentSeed??((s.seed^0x53414645)>>>0),1664525)+1013904223)>>>0;
 if(e.securityIncidentSeed/4294967296>=r.chance)return;
 e.securityIncident={at:s.month,left:r.duration};e.lastSecurityIncidentMonth=s.month;s.milestones.push('security');s.notices.push('治安悪化！不審な出来事が続き、街に不安が広がっています。');
}
function begin(s,{rng}){
 const e=s.events;if(e.generatedMonth===s.month)return;e.generatedMonth=s.month;
 const morunWasKnown=root.KE.morunKnown(s);
 const debutNow=!morunWasKnown&&root.KE.mascotActive(s)&&s.storyVersion===2&&(s.storyDone||[]).includes('campaign-4')&&!s.storyFailed&&s.status!=='bankrupt';
 e.morunRoyaltyTotal=morunRoyaltyTotal(s);
 e.kotsumaruSalesTotal=kotsumaruSalesTotal(s);
 const previous=e.active,scheduled=e.next;e.active=previous?.kind==='rival'&&previous.left>1?{...previous,left:previous.left-1}:scheduled?.at===s.month?scheduled:null;e.next=null;
 if(root.KE.mascotActive(s)&&e.morunSeen===undefined)e.morunSeen=s.history.some(h=>['morun','morunBreak'].includes(h.competition?.type));
 if(morunWasKnown)e.morunSeen=true;
 // First appearance belongs to chapter five, independently of the mascot's age.
 if(debutNow){e.active={kind:'rival',type:'morun',at:s.month,id:'morun-'+s.month,left:C.morunRules.duration,intensity:C.morunRules.intensity};e.morunSeen=true;}
 else if(!morunWasKnown&&['morun','morunBreak'].includes(e.active?.type))e.active=null;
 if(['morun','morunBreak'].includes(previous?.type)||['morun','morunBreak'].includes(e.active?.type))e.morunSeen=true;
 // Monthly mascot draw is independent of the mall's ordinary event rotation and cooldown.
 if(!e.active&&e.morunSeen&&root.KE.mascotActive(s)&&s.month<root.KE.turnLimit(s)){
  e.morunSeed=(Math.imul(e.morunSeed??((s.seed^0x4d4f5255)>>>0),1664525)+1013904223)>>>0;
  const roll=e.morunSeed/4294967296,rare=e.morunSeen?C.morunRules.breakChance:0,type=e.morunSeen&&e.morunRoyaltyTotal>=C.morunRules.royaltyTrigger?'morunBreak':roll<rare?'morunBreak':roll<rare+C.morunRules.chance?'morun':null;
  if(type){e.active={kind:'rival',type,at:s.month,id:type+'-'+s.month,left:type==='morunBreak'?C.morunRules.breakDuration:C.morunRules.duration,intensity:C.morunRules.intensity};e.morunSeen=true;}
 }
 if(e.active?.type==='morunBreak'&&e.active.at===s.month)e.morunRoyaltyTotal=0;
 if(['morun','morunBreak'].includes(e.active?.type)&&!morunWasKnown)e.active.shopUnlocked=true;
 if(e.active?.kind==='rival'){const level=stage(s.month);e.active.left=e.active.left||level.duration;e.active.intensity=e.active.intensity||level.intensity;s.notices.push(rivalAnnouncement(e.active.type)+'あと'+e.active.left+'か月。対応を選べます。');}
 else if(e.active)s.notices.push(isTyphoon(s)?'台風のため今月は全店舗休業。維持費と返済は発生します。':'大雨・浸水の予報。防災設備や臨時対策を検討してください。');
 let draw=rng(s),type='clear';const sunnyChance=R.sunny.chance[s.month%12];if(draw<sunnyChance)type='sunny';else{draw=(draw-sunnyChance)/(1-sunnyChance);for(const name of ['rain','heat','snow']){const chance=R.chances[name][s.month%12];if(draw<chance){type=name;break;}draw-=chance;}}
 if(s.month===0)type='clear';
 e.weather={month:s.month,type:e.active?.kind==='disaster'?'clear':type};
 if(type==='sunny'&&e.active?.kind!=='disaster')s.notices.push('晴天に恵まれています。今月は来店率＋8％・各客層の満足度＋2。');
 if(!['clear','sunny'].includes(type)&&e.active?.kind!=='disaster')s.notices.push(climate(s).weather+'。今月の来店率が下がります。');
 const next=s.month+1,lastDisaster=e.lastDisasterMonth??-100,lastRival=e.lastRivalMonth??-100;
 if(!e.next&&!e.active&&next>=R.disasterFirst&&next-lastDisaster>=R.disasterGap&&s.month-lastRival>=2){
  const chances=R.disasterChance,storm=next-(e.lastTyphoonMonth??-100)>=R.typhoonGap?chances.typhoon[next%12]:0,roll=rng(s),kind=roll<storm?'typhoon':roll<storm+chances.flood[next%12]?'flood':null;
  if(kind)e.next={kind:'disaster',type:kind,name:kind==='typhoon'?'台風接近':'大雨・浸水',at:next,id:kind+'-'+next};
 }
 const level=stage(next);
 if(!e.next&&!e.active&&next>=C.eventRules.rivalFirst&&next-lastRival>=level.gap&&next-lastDisaster>=3&&(rng(s)<R.rivalChance||next-lastRival>=level.gap+3)){
  const types=Object.keys(C.rivals).filter(type=>!['morun','morunBreak'].includes(type)),type=types[Math.floor(rng(s)*types.length)];e.next={kind:'rival',type,at:next,id:'rival-'+next,left:level.duration,intensity:level.intensity};
 }
 if(!e.mascotBreak&&!e.boom&&!e.active&&root.KE.mascotActive(s)&&s.month>s.mascot.debutMonth&&s.month-(e.lastMascotBreakMonth??-100)>=C.mascotBreakRules.cooldown&&(e.kotsumaruSalesTotal>=C.mascotBreakRules.salesTrigger||rng(s)<C.mascotBreakRules.chance)){
  e.kotsumaruSalesTotal=0;e.mascotBreak={left:C.mascotBreakRules.duration};e.lastMascotBreakMonth=s.month;s.milestones.push('mascot-break');s.notices.push('こつまるブレイク↗︎！写真や口コミで人気が広がっています。3か月間、来店率＋10％・こつまる屋の商品需要＋30％。');
 }
 if(!e.boom&&!e.mascotBreak&&s.month>=4&&!e.active&&rng(s)<C.eventRules.boomChance){
  const shops=s.buildings.filter(b=>C.facilities[b.type].shop&&root.KE.operational(s,b)),candidates=Object.entries(C.booms).filter(([,r])=>shops.some(b=>r.types===null||r.types.includes(b.type)));
  if(candidates.length){let pick=rng(s)*candidates.reduce((n,[,r])=>n+r.weight,0);const [type,rule]=candidates.find(([,r])=>(pick-=r.weight)<0)||candidates.at(-1);e.boom={type,left:C.eventRules.boomDuration,lift:rule.lift};s.milestones.push('boom');s.notices.push(rule.name+'到来。3か月限定の追い風です。');}
 }
 beginSecurityIncident(s);
 beginMascotMoment(s);
 if(e.next)s.notices.push('来月予告：'+(e.next.kind==='rival'?rivalAnnouncement(e.next.type,true):e.next.name)+(disasterType(e.next)==='typhoon'?'。雑貨・日用品などの備えの買い物が増えますが、来月は全店舗休業です。':''));
}
function respond(s,id){const E=root.KE,r=C.responses[id];if(!E.canAct(s)||s.events.active?.kind!=='rival'||!r)return {error:'今月の対抗策ではありません。'};if(s.responseChosen)return {error:'今月の対応は決定済みです。'};if(!E.charge(s,r.cost,'other','競争対策：'+r.name))return {error:'資金が足りません。'};s.response=id;s.responseChosen=true;return {};}
function canPrepare(s){return [s.events.active,s.events.next].some(e=>disasterType(e)==='flood');}
function prepare(s){const E=root.KE;if(!E.canAct(s)||s.prepared||!canPrepare(s))return {error:'対策済み、または大雨・浸水の予告がありません。台風の全店休業は臨時対策で解除できません。'};if(!E.charge(s,C.eventRules.prepareCost,'other','臨時防災対策'))return {error:'資金が足りません。'};s.prepared=true;s.preparedFor=disasterType(s.events.active)==='flood'?s.events.active.id:s.events.next.id;return {};}
function canAid(s){return !!s.lastDisaster&&!s.lastDisaster.aidUsed&&s.lastDisaster.aidEligible!==false;}
function aid(s){const e=s.lastDisaster;if(!canAid(s)||!['playing','rescue'].includes(s.status))return {error:'申請できる復旧支援がありません。'};e.aidUsed=true;const amount=e.aidAmount??C.eventRules.aid;s.cash+=amount;s.ledger.push({month:s.month,label:'災害復旧支援',amount});for(const b of s.buildings)if(b.closed)b.closed=Math.max(1,b.closed-1);s.notices.push('復旧支援'+Math.round(amount/10000)+'万円。休業期間を1か月短縮しました。');root.KE.finishRescue(s);return {};}
function donationAmount(s){return Math.min(C.donationRules.maxAmount,C.donationRules.baseAmount+Math.floor(s.month/12)*C.donationRules.annualIncrease);}
function resolve(s,result,{rng,services,operational}){
 const e=s.events.active,u=services(s),stores=s.buildings.filter(b=>C.facilities[b.type].shop&&operational(s,b)),E=root.KE;let expense=0;result.incidents=[];


 if(e?.kind==='rival'){s.events.lastRivalMonth=s.month;result.competition={type:e.type,intensity:e.intensity||1,left:e.left||1};}
 if(e?.kind==='disaster'){
  const kind=disasterType(e);s.events.lastBad=s.month;s.events.lastDisasterMonth=s.month;s.milestones.push('disaster');
  if(kind==='typhoon'){s.events.lastTyphoonMonth=s.month;result.incidents.push({kind:'typhoon',name:'台風による全店舗休業',cost:0,affected:s.buildings.filter(b=>C.facilities[b.type].shop&&!b.build).length});s.notices.push('台風：全店舗が休業しました。売上はゼロですが維持費・返済は発生しています。');return expense;}
  const rule=R.flood,affected=stores.slice().sort((a,b)=>a.id-b.id).filter(b=>{const protectedSite=u.near(b,'disaster',4);return rng(s)<(s.prepared?(protectedSite?rule.bothChance:rule.preparedChance):(protectedSite?rule.protectedChance:rule.chance));}).slice(0,Math.min(rule.maxAffected,Math.max(3,Math.ceil(stores.length*.45))));
  const floodStart=expense;for(const b of affected){const protectedSite=u.near(b,'disaster',4),severity=(s.prepared?rule.preparedSeverity:rule.severity)*(protectedSite?rule.protectedFactor:1);b.damage=severity;b.closed=protectedSite?1:s.prepared?2:3;b.justDamaged=true;expense+=Math.round(C.facilities[b.type].cost*severity*rule.lossFactor*E.titleEffects(s).disasterCost);}
  const floodExpense=expense-floodStart;s.lastDisaster={id:e.id,aidUsed:false,aidEligible:floodExpense>0,aidAmount:Math.min(C.eventRules.aid,floodExpense)};
  result.incidents.push({kind:'flood',name:'大雨・浸水',cost:floodExpense,affected:affected.length,prepared:!!s.prepared});s.notices.push(affected.length?'大雨・浸水：'+affected.length+'店が休業。修理・復旧支援・自然復旧を選べます。':'防災対策が実り、休業被害はありませんでした。');
 }else if(s.events.securityIncident?.at===s.month&&s.events.securityIncident.left>0){
  const rule=C.securityIncidentRules,cost=Math.min(rule.maxCost,rule.baseCost+Math.round(Math.max(0,result.sales)*rule.salesCost));expense+=cost;s.events.lastBad=s.month;result.securityIncidentCost=cost;result.incidents.push({kind:'security',name:'治安悪化！',cost,affected:stores.length});s.notices.push('治安悪化！盗難・迷惑行為による損失として'+cost.toLocaleString('ja-JP')+'円がかかりました。');
 }else if(s.month-(s.events.lastTheftMonth??-100)>=R.theftCooldown){
  const risk=stores.length?Math.max(R.theftFloor,stores.reduce((sum,b)=>sum+1-u.security(b),0)/stores.length):0;
  if(rng(s)<R.theftChance*risk){const theftCost=Math.round((30000+Math.min(250000,result.sales*.02))*risk);expense+=theftCost;s.notices.push('盗難が発生。損失 '+Math.round(theftCost/10000)+'万円。治安施設でリスクを抑えられます。');s.events.lastBad=s.month;s.events.lastTheftMonth=s.month;result.incidents.push({kind:'theft',name:'盗難',cost:theftCost,affected:1});}
 }
 const gift=C.shrineGiftRules;
 if(e?.kind!=='disaster'&&s.month-(s.events.lastShrineGiftMonth??-100)>=gift.cooldown&&s.buildings.filter(b=>b.type==='shrine'&&operational(s,b)).length>=gift.minShrines){
  s.events.shrineGiftSeed=(Math.imul(s.events.shrineGiftSeed??((s.seed^0x71687963)>>>0),1664525)+1013904223)>>>0;
  if(s.events.shrineGiftSeed/4294967296<gift.chance*E.titleEffects(s).shrineGiftChance){
   result.shrineGift=gift.amount;s.events.lastShrineGiftMonth=s.month;s.milestones.push('shrine-gift');
   s.notices.push('神様からの贈り物。神社で見つかった不思議な宝箱から、商店街の運営資金に100万円が届きました。');
  }
 }
 return expense;
}
function alerts(s){
 const out=[],e=s.events.active,next=s.events.next,c=climate(s),crowd=root.KE.congestionStatus(s),forecast=root.KE.forecast(s);
 if(s.events.securityIncident?.at===s.month&&s.events.securityIncident.left>0)out.push({title:'治安悪化！',text:'盗難・迷惑行為が相次いでいます。今月は来店率が8％低下し、決算時に盗難・迷惑行為による損失が発生します。交番などを整え、街の安心を取り戻しましょう。',art:'security'});
 if(!forecast.allClosed&&forecast.total>0&&root.KE.townStateLabels(forecast).activity==='quiet')out.push({title:'ガラガラ',text:'人通りがまばらで、街に静かな時間が流れています。'+(forecast.stockLoss>0?'売れ残りによる仕入れロスが発生しています。':''),art:'quiet'});
 if(crowd.active)out.push({title:'大混雑',text:'お客さんが集中し、待ち時間への不満が広がっています。満足度−6・来店率−5％。不足：'+crowd.causes.map(c=>c.name).join('・')+'。'+crowd.causes.map(c=>c.hint).join(' ')+'施設整備や客足の変化に応じて緩和・解消します。',art:'congestion'});
 else if(crowd.value>=C.townMetricRules.warning)out.push({title:'混雑の兆し',text:'お客さんを受け入れる余裕が少なくなっています。不足：'+crowd.causes.map(c=>c.name).join('・')+'。'+crowd.causes.map(c=>c.hint).join(' ')});
 const morunUnlock=e?.shopUnlocked&&e.at===s.month?' モールン屋の開設ができるようになりました。':'';
 if(e?.kind==='disaster')out.push({title:isTyphoon(s)?'今月：台風による全店舗休業':'今月：大雨・浸水',text:isTyphoon(s)?'売上・入店・主催企画は停止します。店舗と公共施設の維持費、借入返済は発生します。来月は台風による休業が解除されます。':'防災設備と18万円の臨時対策で、被災確率・損失・休業期間を軽減できます。',art:'disaster'});
 else if(['rain','heat','snow'].includes(c.type))out.push({title:'今月：'+c.weather,text:'天候により来店率が低下します。アーケードで長雨・猛暑の影響を軽減できます。大雪への効果は控えめです。'});
 if(e?.kind==='rival')out.push(e.type==='morunBreak'?{title:'モールンブレイク↗︎',text:'モールンの写真やグッズが大人気！あと'+(e.left||1)+'か月、近隣の大型商業施設へ向かうお客さんが増え、商店街の客足が大きく落ち込みます。'+morunUnlock,art:'morun-break'}:e.type==='morun'?{title:'モールンだよ！',text:'大型商業施設のマスコット、モールンが街へごあいさつ。あと'+(e.left||1)+'か月、女性客や親子連れを中心に客足が相手施設へ向かいます。'+morunUnlock,art:'morun'}:{title:'今月：'+rivalAnnouncement(e.type),text:'あと'+(e.left||1)+'か月、来店率と買上額が下がります。対抗策を検討しましょう。'});
 if(next)out.push({title:'来月予告：'+(next.kind==='rival'?['morun','morunBreak'].includes(next.type)?C.rivals[next.type].name:rivalAnnouncement(next.type,true):next.name),text:disasterType(next)==='typhoon'?'今月は雑貨・日用品などの需要＋12%（受入上限内）。来月は全店舗休業になるため、維持費と返済分の資金を残しましょう。':['morun','morunBreak'].includes(next.type)?rivalAnnouncement(next.type,true):next.kind==='rival'?'期間'+(next.left||1)+'か月。企画の時期や資金配分を検討しましょう。':'防災設備・臨時対策を事前に検討してください。',art:next.type==='morunBreak'?'morun-break':next.type==='morun'?'morun':next.kind==='disaster'?'disaster':null});
 for(const incident of s.last?.incidents||[])out.push({title:'前月の結果：'+incident.name,text:incident.kind==='donation'?'地域の福祉団体が行う生活支援活動への寄付として、商店街の運営資金から'+incident.cost.toLocaleString('ja-JP')+'円を自動徴収しました。前月の決算に計上済みです。':incident.kind==='typhoon'?'全店舗休業。売上0円。維持費・返済は前月の決算に計上されています。':(incident.kind==='flood'?incident.affected+'店が被災休業。':'')+'直接損失 '+incident.cost.toLocaleString('ja-JP')+'円。前月の決算に計上済みです。',art:incident.kind==='donation'?'donation':incident.kind==='flood'?'disaster':incident.kind==='security'?'security':null});
 return out;
}
function goodNews(s,forecast){
 const out=[],boom=s.events.boom,E=root.KE,last=s.last;
 const support=E.communitySupportStatus(s);
 for(const item of support.items)if(item.receivedMonth===s.month||item.receivedMonth===s.month-1)out.push({kind:'souvenir',itemId:item.id,announce:true,title:'「'+item.name+'」を入手しました',text:'効果：'+item.effect+'。'+(item.permanent?'期限なし。':'有効期間12か月。')});
if(support.open&&!support.decided)out.push({kind:'communitySupport',art:'donation',announce:true,title:'11月は地域応援月間',text:'支援は任意・年1回30万円。記念品を装備すると12か月間、対象店舗の受入能力が上がり、街の飾りが変わります。'});
 if(s.milestones.includes('congestion-resolved'))out.push({kind:'congestionResolved',announce:true,title:'大混雑が解消しました',text:'店舗や受け入れ施設が整い、落ち着いて買い物を楽しめる街に戻りました。大混雑による満足度と来店率の低下はなくなりました。'});
 if(last?.project&&C.projects[last.project]?.art&&!last.allClosed){const p=C.projects[last.project],net=last.projectNet||0;out.push({kind:'stageShow',art:p.art,announce:true,title:'前月：'+p.name+'を開催',text:'追加売上 '+Math.round(last.projectExtra||0).toLocaleString('ja-JP')+'円 ／ 開催費 '+Math.round(last.projectCost||0).toLocaleString('ja-JP')+'円 ／ 開催費を含む企画収支 '+(net>=0?'＋':'−')+Math.round(Math.abs(net)).toLocaleString('ja-JP')+'円。前月の決算に計上済みです。'});}
 const moment=s.events.mascotMoment,rule=E.mascotActive(s)&&moment?.at===s.month?C.mascotMoments[moment.type]:null;
 if(rule){
  const names=moment.type==='help'?moment.shopIds.map(id=>s.buildings.find(b=>b.id===id)).filter(b=>b&&C.facilities[b.type].shop&&E.operational(s,b)).map(b=>C.facilities[b.type].name):[];
  const text=moment.type==='help'?'こつまるが、お店の呼び込みをお手伝い。今月は'+(names.length?names.join('・')+'の買上額＋5％。':'お手伝い先のお店は営業をお休みしています。'):moment.type==='letter'?'こつまるに、子どもから応援のお手紙が届きました。今月は子どもの来店率＋4％・満足度＋2、成人男女の来店率＋2％。':'こつまると、大型商業施設のモールンが商店街で共演！今月は街全体の来店率＋5％、こつまる屋・モールン屋の商品需要＋12％。';
  out.push({kind:'mascotMoment',art:rule.art,announce:true,title:rule.name,text});
 }
 if(last?.shrineGift)out.push({kind:'shrineGift',art:'shrine-gift',announce:true,title:'神様からの贈り物',text:'大切に守ってきた神社で、不思議な贈り物が見つかりました。運営資金＋'+last.shrineGift.toLocaleString('ja-JP')+'円。ありがたく、街づくりに役立てましょう。'});
 if(s.tenantOffer){const d=root.KTenants.definitions[s.tenantOffer.type];out.push({kind:'tenantOffer',art:d.art,announce:s.milestones.includes('tenant-offer'),title:d.name+'から出店要請',text:'道路に面した空き地への出店を希望しています。整備費・固定の場所代・近隣同業店への競合を、企画・予定表で確認して承諾か見送りを選べます。回答期限まであと'+(s.tenantOffer.expiresMonth-s.month)+'か月。'});}
 if(E.mascotActive(s)&&s.month===s.mascot.debutMonth)out.push({kind:'mascot',announce:s.milestones.includes('mascot'),title:'マスコットの愛称は「こつまる」に決まりました！',text:'こつまるが街を歩き始めます。これからずっと、来店率＋3％・全客層の満足度＋1。'});
 if(climate(s).type==='sunny')out.push({kind:'sunny',announce:true,title:'晴天。商店街へ出かけよう。',text:'晴天に恵まれ、お出かけ日和です。当月の来店率＋8％、各客層の満足度＋2。'});
 if(s.events.mascotBreak?.left>0&&E.mascotActive(s)){
  const current=forecast||E.forecast(s),normal=E.forecast({...s,events:{...s.events,mascotBreak:null}}),visitors=current.total-normal.total,sales=current.sales-normal.sales;
  out.push({kind:'mascotBreak',art:'mascot-break',announce:s.milestones.includes('mascot-break'),title:'こつまるブレイク↗︎',text:'こつまるの写真や口コミが話題に！あと'+s.events.mascotBreak.left+'か月、商店街全体の来店率＋10％・こつまる屋の商品需要＋30％。'+(isTyphoon(s)?'今月は台風により全店舗休業中です。':'現在の配置での見込効果：来街＋'+visitors.toLocaleString('ja-JP')+'人、売上＋'+sales.toLocaleString('ja-JP')+'円。')});
 }
 if(boom&&boom.left>0&&C.booms[boom.type]){
  const rule=C.booms[boom.type],title=rule.name,current=forecast||E.forecast(s),normal=E.forecast({...s,events:{...s.events,boom:null}});
  const visitors=current.total-normal.total,sales=current.sales-normal.sales;
  out.push({kind:'boom',art:'boom',announce:s.milestones.includes('boom'),title:(s.milestones.includes('boom')?'到来：':'開催中：')+title,text:'あと'+boom.left+'か月。'+(rule.types===null?'商店街全体の来店率に追い風です。':rule.types.map(t=>C.facilities[t].name).join('・')+'の需要が'+Math.round((rule.demand-1)*100)+'%上がり、対象店が営業している商店街の来店率も伸びます。')+(isTyphoon(s)?'今月は台風により全店舗休業中です。':'現在の配置での見込効果：来街＋'+visitors.toLocaleString('ja-JP')+'人、売上＋'+sales.toLocaleString('ja-JP')+'円。')});
 }
if(last?.project&&C.projects[last.project]&&!C.projects[last.project].art&&Number.isFinite(last.projectNet)&&last.projectNet>0){const summer=last.project==='summer';out.push({kind:'fair',art:summer?'summer':'fair',announce:true,title:'前月：'+C.projects[last.project].name+'が成功',text:'追加売上 '+Math.round(last.projectExtra||0).toLocaleString('ja-JP')+'円 ／ 開催費 '+Math.round(last.projectCost||0).toLocaleString('ja-JP')+'円 ／ 開催費を含む企画収支 ＋'+Math.round(last.projectNet).toLocaleString('ja-JP')+'円。前月の決算に計上済みです。'});}
 if(s.milestones.includes('recovery')){const names=s.notices.filter(n=>String(n).endsWith('が復旧しました。'));out.push({kind:'recovery',art:'recovery',announce:true,title:'おかえり、いつもの灯り。',text:(names.length?names.join(' '):'休業していたお店の復旧作業が完了しました。')+(isTyphoon(s)?'台風が過ぎたら、またお客さんを迎えましょう。':'いつもの街のにぎわいが戻ります。')});}
 return out;
}
const V={kotsumaruSalesTotal,morunRoyaltyTotal,donationAmount,rivalAnnouncement,climate,begin,respond,prepare,aid,resolve,disasterType,isTyphoon,stage,canPrepare,canAid,alerts,goodNews};root.KEvents=V;if(typeof module!=='undefined')module.exports=V;
})(typeof globalThis!=='undefined'?globalThis:this);
