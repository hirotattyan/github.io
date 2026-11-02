(function(root){
'use strict';const C=root.KConfig||(typeof require==='function'?require('./config.js'):null);
function activeShops(s){const E=root.KE,net=E.network(s);return s.buildings.filter(b=>C.facilities[b.type].shop&&E.operational(s,b,net));}
function run(s,test,skip=()=>false){let n=0,next=null;for(let i=s.history.length-1;i>=0;i--){const h=s.history[i];if(next!==null&&h.month!==next-1)break;next=h.month;if(skip(h))continue;if(!test(h))break;n++;}return n;}
function storyFairs(s,g){return s.history.filter(h=>h.project&&h.total>=(g.minVisitors??3000)&&(!g.positiveProfit||h.profit>0)&&(!g.seasonalOnly||C.projects[h.project]?.season));}
function chapterSince(s,index){
 if(index===0)return 0;
 const first=C.chapters.findIndex(c=>!(s.storyDone||[]).includes(c.id));
 if(index===first&&Number.isSafeInteger(s.storyChapterSince))return s.storyChapterSince;
 const previous=C.chapters[index-1]?.id,record=[...s.history].reverse().find(h=>h.storyRewards?.some(r=>r.id===previous));
 return record?record.month+1:index===first?s.month:Infinity;
}
function finalYearSince(s){return s.mode==='century'?Math.max(108,Math.floor((s.last?.month??s.month)/12)*12):108;}
function successfulFairs(s){return s.history.filter(h=>h.project&&h.projectNet>0);}
function titleRecord(s){
 const r=s.titleProgress||(s.titleProgress={version:1,lastMonth:-1,sales:{kotsumaru:0,morunShop:0},shows:{kotsumaruShow:0,morunShow:0},seasons:[],castleYears:[]});
 for(const h of s.history){if(h.month<=r.lastMonth)continue;
  for(const type of Object.keys(r.sales))r.sales[type]+=(h.shops||[]).filter(b=>b.type===type).reduce((n,b)=>n+(b.sales||0),0);
  if(h.projectNet>0&&!h.allClosed){if(Object.hasOwn(r.shows,h.project))r.shows[h.project]++;const season=C.projects[h.project]?.season;if(season&&season===root.KE.season({month:h.month})&&!r.seasons.includes(season))r.seasons.push(season);}
  const year=Math.floor(h.month/12);if(h.castleFestival&&!r.castleYears.includes(year))r.castleYears.push(year);r.lastMonth=h.month;
 }
 // Older saves recorded only the most recent castle festival.
 const c=s.castle;if(c?.festivalYear>=0&&c.festivalMonth<s.month&&!r.castleYears.includes(c.festivalYear))r.castleYears.push(c.festivalYear);
 return r;
}
function comfortStatus(s,result){
 const E=root.KE,net=E.network(s),u=E.services(s,net),rows=result?.shops;
 const shops=s.buildings.filter(b=>C.facilities[b.type].shop&&(rows?rows.some(r=>r.id===b.id&&r.op):!b.build&&!b.closed&&net.connected(b)));
 const coverage=shops.map(b=>({id:b.id,type:b.type,bench:u.near(b,'bench',3)||u.near(b,'plaza',3)||u.near(b,'grandpark',5)||u.near(b,'japaneseGarden',2),toilet:u.near(b,'toilet',4)}));
 const total=shops.length,covered=coverage.filter(b=>b.bench&&b.toilet).length,ratio=total?covered/total:0;
 return {total,covered,ratio,bench:coverage.filter(b=>b.bench).length,toilet:coverage.filter(b=>b.toilet).length,met:total>0&&ratio>=C.questRules.comfortCoverage,missing:coverage.filter(b=>!b.bench||!b.toilet),paused:!!root.KEvents?.isTyphoon(s)};
}
function comfortMonths(s){let months=0,previous=null;for(let i=s.history.length-1;i>=0;i--){const h=s.history[i];if(previous!==null&&h.month!==previous-1)break;previous=h.month;if(h.allClosed===true&&h.weatherType==='typhoon')continue;const q=h.questStats,qualified=q?.comfortFacilities!==undefined?q.comfortFacilities:q?.comfort===true;if(!qualified)break;months++;}return months;}
function stats(s,result){const E=root.KE,shops=activeShops(s),u=E.services(s),rules=C.questRules,rows=result.shops||[],row=b=>rows.find(r=>r.id===b.id),black=b=>row(b)?.op&&row(b).profit>0,coverage=test=>shops.length?shops.filter(test).length/shops.length:0,pair=(a,b,test=()=>true)=>shops.some(x=>x.type===a&&black(x)&&shops.some(y=>y.type===b&&black(y)&&E.distance(x,y)<=rules.pairRadius&&test(x,y))),busy=result.total>=rules.serviceVisitors;
 const comfort=comfortStatus(s,result);
 const careCoverage=coverage(b=>(u.near(b,'bench',3)||u.near(b,'plaza',3)||u.near(b,'grandpark',5)||u.near(b,'japaneseGarden',2))&&u.near(b,'toilet',4)&&u.security(b)>=rules.safetyMinimum);
 const titleStats={freshFood:['fishmonger','greengrocer','sushi'].every(type=>shops.some(b=>b.type===type&&black(b))),rainCovered:shops.length>0&&coverage(b=>u.near(b,'arcade',4))>=.7,guardCovered:shops.length>0&&coverage(b=>u.protection(b)>0)>=.8};
 return {...titleStats,careCoverage,sports:pair('sports','sportcenter',(a,b)=>row(a).nearbySynergy&&row(b).nearbySynergy),flowerCafe:pair('flower','cafe'),comfort:busy&&comfort.met,comfortFacilities:comfort.met,comfortCoverage:comfort.ratio,comfortCovered:comfort.covered,comfortStores:comfort.total,safety:busy&&coverage(b=>u.security(b)>=rules.safetyMinimum)>=rules.safetyCoverage,disaster:busy&&coverage(b=>u.near(b,'disaster',4))>=rules.disasterCoverage,leisure:['gamecenter','karaoke'].every(type=>shops.some(b=>b.type===type&&black(b)&&u.security(b)>=0)),restful:result.satisfaction[2]>=75&&['plaza','bench'].every(type=>u.active.some(b=>root.KE.facilityMatches(b.type,type))),debtFree:(s.totalRepaid??s.history.reduce((a,h)=>a+(h.repayment||0),0))>0&&s.debts.every(d=>d.balance===0)&&result.profit>0};
}
function recentMonths(s,count){const h=s.history.slice(-count);return h.length===count&&h.every((r,i)=>r.month===h[0].month+i)?h:null;}
function metric(s,g){const shops=s.buildings.filter(b=>C.facilities[b.type].shop),active=activeShops(s),last=s.last;
 switch(g.metric){
 case'renovated':return shops.filter(b=>b.level>=2).length;
 case'profitable':return last?last.shops.filter(b=>b.profit>0).length:0;
 case'streak':return s.streak;
 case'vacancy':return s.buildings.some(b=>b.type==='vacant')?0:last?.total||0;
 case'specialty':return active.filter(b=>b.reputation>=6).length;
 case'signatureShops':return active.filter(b=>b.reputation>=g.minimum).length;
 case'operatingIndustries':return new Set(active.map(b=>b.type)).size;
 case'generations':return last?last.visitors.filter((n,i)=>n>=500&&last.satisfaction[i]>=65).length:0;
 case'festival':return s.festivalWins;
 case'stable':return s.streak>=6?new Set(active.map(b=>b.type)).size:0;
 case'maxLevel':return active.filter(b=>b.level>=C.maxLevel).length;
 case'profit':return Math.max(0,last?.profit||0);
 case'annualProfit':return s.history.length>=12?Math.max(0,s.history.slice(-12).reduce((n,h)=>n+h.profit,0)):0;
 case'visitors':return last?.total||0;
 case'visitorShare':return last?100*last.total/(last.segmentCaps||C.segmentCaps).reduce((n,v)=>n+v,0):0;
 case'audienceWindow':{const h=recentMonths(s,g.months);return h?h.filter(r=>!r.allClosed&&r.visitors.every((n,i)=>n>=(r.segmentCaps||C.segmentCaps)[i]*g.share&&r.satisfaction[i]>=g.satisfaction)).length:0;}
 case'careRun':return run(s,h=>h.total>=g.minVisitors&&h.questStats?.careCoverage>=g.coverage,h=>h.allClosed&&h.weatherType==='typhoon');
 case'careWindow':{const h=recentMonths(s,g.months);return h?h.filter(r=>!r.allClosed&&r.total>=g.minVisitors&&r.questStats?.careCoverage>=g.coverage).length:0;}
 case'repeatFairVariety':{const counts={};for(const h of successfulFairs(s))if(!h.allClosed&&C.projects[h.project])counts[h.project]=(counts[h.project]||0)+1;return Object.values(counts).filter(n=>n>=g.minimum).length;}
 case'audienceRun':return run(s,h=>h.visitors[g.segment]>=g.minimum&&h.satisfaction[g.segment]>=65);
 case'allGenerations':return last?last.visitors.filter((n,i)=>n>=(last.segmentCaps||C.segmentCaps)[i]*.5&&last.satisfaction[i]>=75).length:0;
 case'reputation':return Math.max(0,...active.map(b=>b.reputation));
 case'fans':return active.filter(b=>b.fans>=C.questRules.fanMinimum).length;
 case'foodRoute':case'hobbyRoute':{const types=g.metric==='foodRoute'?['bakery','cafe','diner']:['diy','hobby'];return types.filter(t=>active.some(b=>b.type===t&&b.reputation>=C.questRules.signatureMonths&&last?.shops.some(r=>r.id===b.id&&r.op&&r.profit>0))).length;}
 case'statRun':return run(s,h=>h.questStats?.[g.stat]===true);
 case'storyComfortMonths':return comfortMonths(s);
 case'recoveries':return s.recoveries;
 case'fairVariety':return new Set(successfulFairs(s).map(h=>h.project)).size;
 case'fairWins':return successfulFairs(s).length;
 case'fairSeasons':return new Set(successfulFairs(s).map(h=>root.KE.season({month:h.month}))).size;
 case'requests':return s.requestsDone.length;
 case'meanVisitors':{const h=recentMonths(s,g.months||6);return h?Math.round(h.reduce((n,r)=>n+r.total,0)/h.length):0;}
 case'accessFacility':return activeShops(s).length&&s.buildings.some(b=>['bicycle','parking'].includes(b.type)&&root.KE.operational(s,b))?1:0;
 case'accessKinds':return ['bicycle','parking'].filter(type=>s.buildings.some(b=>b.type===type&&root.KE.operational(s,b))).length;
 case'profitableMonths':{const h=s.history.slice(-(g.months||12));return h.length===(g.months||12)?h.filter(r=>r.profit>0).length:0;}
 case'storyComfort':return run(s,h=>h.total>=(g.minVisitors??3000)&&h.satisfaction.filter(n=>n>=(g.minSatisfaction??65)).length>=3,h=>g.pauseTyphoon&&h.allClosed&&h.weatherType==='typhoon');
 case'storyBreadth':case'storyLasting':{const test=h=>h.visitors.every((n,i)=>n>=(h.segmentCaps||C.segmentCaps)[i]*(g.populationShare??(g.metric==='storyBreadth'?.3:.25))&&h.satisfaction[i]>=(g.minSatisfaction??70));return g.totalMonths?s.history.filter(test).length:run(s,test);}
 case'storyFairCount':return s.history.filter(h=>h.project&&h.total>=2000).length;
 case'storyFairVariety':return new Set(storyFairs(s,g).map(h=>h.project)).size;
 case'storyFairSeasons':return new Set(storyFairs(s,g).map(h=>root.KE.season({month:h.month}))).size;
 case'storyFestivals':{const fairs=s.history.filter(h=>h.project&&h.total>=4000);return Math.max(fairs.filter(h=>['summer','harvest','anniversary'].includes(h.project)).length/2,fairs.length/6);}
 case'debtHealthy':return s.debts.reduce((n,d)=>n+d.balance,0)<(g.maximum??C.eventRules.evaluation.maxDebt)?1:0;
 case'vacancyHealthy':{const vacancies=s.buildings.filter(b=>b.type==='vacant').length;return vacancies/Math.max(1,shops.length+vacancies)<=(g.maximum??C.eventRules.evaluation.maxVacancy/100)?1:0;}
 }return 0;
}
function goal(s){const available=C.goals.filter(g=>!s.claimed.includes(g.id)),pinned=available.find(g=>g.id===s.focusQuest);if(pinned)return pinned;return available.map((g,i)=>({g,i,progress:Math.min(1,metric(s,g)/g.target)})).sort((a,b)=>b.progress-a.progress||a.i-b.i)[0]?.g||null;}
function focus(s,id){if(id===null){s.focusQuest=null;return {};}if(!C.goals.some(g=>g.id===id)||s.claimed.includes(id))return {error:'注目できる未達成目標ではありません。'};s.focusQuest=id;return {};}
function chapters(s){
 if(s.storyVersion===2)return root.KStory.chapters(s);
 const elapsed=Math.max(s.month,(s.last?.month??-1)+1),recorded=s.storyDone||[],first=C.chapters.findIndex(c=>!recorded.includes(c.id));
 return C.chapters.map((c,i)=>{
  const done=recorded.includes(c.id),checks=c.checks.map(g=>{
   const since=g.scope==='chapter'?chapterSince(s,i):g.scope==='finalYear'?finalYearSince(s):null,history=since===null?s.history:s.history.filter(h=>h.month>=since),view=since===null?s:{...s,history,last:history.at(-1)};
   return {...g,label:g.scope==='finalYear'&&s.mode==='century'&&s.month>=120?g.label.replace('10年目','10年目以降の当年'):g.label,value:metric(view,g)};
  }),yearReady=elapsed>=c.minMonth,ready=i===first&&yearReady&&checks.every(g=>g.value>=g.target);
  return {...c,number:i+1,done,recorded:done,ready,current:i===first,yearReady,checks};
 });
}
function projectVisible(s,id){return !C.projects[id]?.hiddenUntilStage||s.stageShowsUnlocked===true||s.buildings.some(b=>b.type==='eventStage'&&!b.build)||s.project===id||s.history.some(h=>C.projects[h.project]?.hiddenUntilStage);}
function projectUnlocked(s,id){if(s.storyVersion===2)return root.KStory.projectUnlocked(s,id);if(s.storyVersion!==1)return true;if((s.storyUnlockedProjects||[]).includes(id)||s.project===id)return true;const c=C.chapters.find(c=>c.projects.includes(id));return !c||(s.storyDone||[]).includes(c.id);}
function projectUnlockHint(id){if(root.KStory)return root.KStory.projectHint(id);const c=C.chapters.find(c=>c.projects.includes(id));return c?'第'+c.year+'章「'+c.name+'」達成で解放':'';}
function migrateStory(s){if(root.KStory){root.KStory.migrate(s);return;}if(s.storyVersion===1)return;const facilities=Object.keys(C.facilities).filter(id=>root.KE.isUnlocked(s,id));s.storyVersion=1;s.storyDone=s.storyDone||[];s.storyUnlockedFacilities=facilities;s.storyUnlockedProjects=C.legacyProjectIds.slice();}
function findSpace(s,id){const E=root.KE,net=E.network(s),rule=C.projectRequirements[id]||{};if(rule.facilities?.includes('eventStage')){const stage=s.buildings.find(b=>b.type==='eventStage'&&E.operational(s,b,net));return stage?{id:stage.id,x:stage.x,y:stage.y}:null;}const u=rule.safeVenue?E.services({...s,project:null},net):null,plaza=s.buildings.find(b=>E.facilityMatches(b.type,'plaza')&&E.operational(s,b,net)&&(!rule.safeVenue||u.security(b)>0));if(plaza)return {id:plaza.id,x:plaza.x,y:plaza.y};
 if(rule.facilities?.includes('plaza')||rule.parkVenue)return null;
 for(let y=0;y<s.size;y++)for(let x=0;x<s.size;x++)if(!root.KE.at(s,x,y)&&[[x+1,y],[x-1,y],[x,y+1],[x,y-1]].some(([a,b])=>net.roads.has(a+','+b)))return {x,y};return null;}
function hasSpace(s,id){return Boolean(findSpace(s,id));}
function projectQuota(s,id){if(C.projects[id]?.once){const used=s.mascot||s.history.some(h=>h.project===id)?1:0;return {limit:1,used,remaining:Math.max(0,1-used-(s.project===id?1:0)),once:true};}const limit=C.projectAnnualLimits?.[id]||1,year=Math.floor(s.month/12),used=s.history.filter(h=>h.project===id&&Math.floor(h.month/12)===year&&h.month<s.month).length;return {limit,used,remaining:Math.max(0,limit-used-(s.project===id?1:0))};}
function conditions(s,id){const E=root.KE,p=C.projects[id],rule=C.projectRequirements[id]||{},net=E.network(s),requirements=[];
 if(root.KEvents?.isTyphoon(s))requirements.push({name:'台風による全店舗休業の月は主催企画を開催できません',met:false});
 if(!p)return {ok:false,requirements,missing:['企画がありません。']};
const quota=projectQuota(s,id);requirements.push({name:quota.once?(quota.used?'この街で一度のみ（開催済み）':'この街で一度のみ'):'年間'+quota.limit+'回まで（今年'+quota.used+'回開催済み）',met:quota.used<quota.limit||s.project===id});
 if(!projectUnlocked(s,id))requirements.push({name:projectUnlockHint(id),met:false});
 if(rule.minMonth!==undefined&&!(s.storyVersion===2&&id==='thanks'))requirements.push({name:E.date({month:rule.minMonth})+'から開催可能',met:s.month>=rule.minMonth||s.project===id});
 for(const type of rule.facilities||[])requirements.push({name:(type==='plaza'?'小公園・広場または大公園':E.F(type).name)+'（道路接続済み・工事や休業なし）',met:s.buildings.some(b=>E.facilityMatches(b.type,type)&&E.operational(s,b,net))});
 if(rule.mascots){requirements.push({name:'こつまるが初登場済み',met:E.mascotActive(s)});requirements.push({name:'モールンが初登場済み',met:E.morunKnown(s)});}
 if(rule.parkVenue){const parks=s.buildings.filter(b=>E.operational(s,b,net));requirements.push({name:'小公園・広場3か所以上、または大公園1か所以上（道路接続済み・工事や休業なし）',met:parks.filter(b=>b.type==='plaza').length>=3||parks.some(b=>b.type==='grandpark')});}
 // Honor mascot reservations already paid for before the new eligibility rules.
 const legacyMascotReservation=id==='mascot'&&s.project===id&&!s.projectSite?.mascotRequirements;
 if(rule.minOperatingIndustries&&!legacyMascotReservation){
  const count=new Set(s.buildings.filter(b=>E.F(b.type).shop&&E.operational(s,b,net)).map(b=>b.type)).size;
  requirements.push({name:'道路につながった営業中のお店が'+rule.minOperatingIndustries+'業種以上（現在'+count+'業種・工事や休業中は除く）',met:count>=rule.minOperatingIndustries});
 }
 if(rule.visitorAverage&&!legacyMascotReservation){
  const {months,minimum}=rule.visitorAverage,records=Array.from({length:months},(_,i)=>s.history.find(h=>h.month===s.month-months+i)),complete=records.every(h=>h&&Number.isFinite(h.total)&&h.total>=0),total=complete?records.reduce((sum,h)=>sum+h.total,0):0;
  requirements.push({name:'直近'+months+'か月の平均来街人数が'+minimum.toLocaleString('ja-JP')+'人以上（'+(complete?'実績平均'+(Math.floor(total/months*10)/10).toLocaleString('ja-JP')+'人':'実績'+records.filter(Boolean).length+'／'+months+'か月・'+months+'か月分の決算が必要')+'）',met:complete&&total>=minimum*months});
 }
 if(rule.safeVenue)requirements.push({name:'会場の広場に治安改善効果が届いている',met:Boolean(findSpace(s,id))});
 if(p.space&&!rule.facilities?.includes('plaza')&&!rule.facilities?.includes('eventStage')&&!rule.parkVenue)requirements.push({name:'道路につながる広場、または空き区画',met:hasSpace(s,id)});
 const missing=requirements.filter(r=>!r.met).map(r=>r.name);return {ok:missing.length===0,requirements,missing};
}
function plan(s,id){const E=root.KE,p=C.projects[id];if(!E.canAct(s)||!p)return {error:'企画を選べません。'};if(s.project)return {error:'主催企画は月に1つです。'};if(p.season&&p.season!==E.season(s))return {error:p.season+'の恒例企画です。'};const check=conditions(s,id);if(!check.ok)return {error:'開催条件が不足しています：'+check.missing.join('／')};
if(!E.charge(s,E.projectCost(s,id),'projects',p.name+'開催費'))return {error:'開催資金が足りません。'};s.project=id;s.projectRules=1;s.projectSite=p.space?findSpace(s,id):null;if(id==='mascot'&&s.projectSite)s.projectSite.mascotRequirements=1;return {};
}
function requestDefinition(r){
 const d=C.requests.find(d=>d.id===r?.id)||C.requests.find(d=>d.name===r?.name);if(!d||!r?.legacy)return d;
 if(C.facilities[r.kind])return {...d,months:1,kind:'facility',types:[r.kind],hint:'道路につながった'+C.facilities[r.kind].name+'を1か所。'};
 if(r.kind==='diverse')return {...d,months:1,kind:'diversity',minimum:6,hint:'6業種のお店を営業。'};
 if(r.kind==='specialty')return {...d,months:1,kind:'signature',minimum:1,reputation:6,hint:'評判6以上の名物店を1軒営業。'};
 return d;
}
function requestInit(s){
 if(s.requestVersion!==1){s.requestPaid=0;s.requestVersion=1;if(s.request&&!s.request.id)s.request.legacy=true;}
 s.requestDeferred=s.requestDeferred||{};
 if(s.request){const d=requestDefinition(s.request);if(d){s.request.id=d.id;s.request.issuedMonth=s.request.issuedMonth??s.month;s.request.streak=s.request.streak||0;}}
}
function prepareRequests(s,month=s.month){
 if(s.storyVersion===2&&month>=C.futureEnding.months)return;
 requestInit(s);if(s.request)return;
 const d=C.requests.find(d=>d.minMonth<=month&&!(d.types||[]).some(t=>!root.KE.isUnlocked(s,t))&&!s.requestsDone.includes(d.name)&&(s.requestDeferred[d.id]||0)<=month);
 if(d)s.request={id:d.id,kind:d.kind,name:d.name,reward:d.reward,deadline:month+d.duration-1,issuedMonth:month,streak:0};
}
function requestCheck(s,result,d,r){
 const E=root.KE,net=E.network(s),shops=activeShops(s).filter(b=>result.shops.some(row=>row.id===b.id&&row.op)),u=E.services(s,net),active=t=>s.buildings.some(b=>E.facilityMatches(b.type,t)&&E.operational(s,b,net)),black=b=>result.shops.some(row=>row.id===b.id&&row.op&&row.profit>0),hasBlack=t=>shops.some(b=>b.type===t&&black(b));
 const coverage=test=>shops.length?shops.filter(test).length/shops.length:0;
 const protectedShop=b=>u.security(b)>=.4&&u.near(b,'disaster',4);
 switch(d.kind){
 case'facility':return d.types.every(active);
 case'diversity':return new Set(shops.map(b=>b.type)).size>=d.minimum;
 case'renovated':return shops.filter(b=>b.level>=2).length>=d.minimum;
 case'signature':return shops.filter(b=>b.reputation>=d.reputation).length>=d.minimum;
 case'loyalty':return shops.filter(b=>b.fans>=(d.fans||.75)).length>=d.minimum;
 case'shops':return d.types.every(hasBlack);
 case'pair':return shops.some(a=>a.type===d.types[0]&&black(a)&&shops.some(b=>b.type===d.types[1]&&black(b)&&E.distance(a,b)<=C.questRules.pairRadius));
 case'coverage':return result.total>=(d.visitors||0)&&coverage(b=>d.service==='security'?u.security(b)>=d.strength:d.service==='comfort'?u.near(b,'bench',3)&&u.near(b,'toilet',4):u.near(b,d.service,4))>=d.minimum;
 case'audience':return result.visitors[d.segment]>=d.minimum&&result.satisfaction[d.segment]>=d.satisfaction;
 case'generations':return result.visitors.every((n,i)=>n>=d.minimum&&result.satisfaction[i]>=d.satisfaction);
 case'family':return active('plaza')&&hasBlack('toy')&&result.satisfaction[3]>=65;
 case'shrine':return active('shrine')&&active('bench')&&result.satisfaction[2]>=75;
 case'leisure':return ['gamecenter','karaoke'].every(t=>shops.some(b=>b.type===t&&black(b)&&u.security(b)>=.3));
 case'variety':return new Set(shops.map(b=>b.type)).size>=d.minimum&&result.total>=d.visitors;
 case'stability':return shops.length>=d.minimum&&result.profit>0;
 case'resilience':return result.total>=10000&&coverage(protectedShop)>=.8;
 case'lasting':return result.total>=10000&&result.satisfaction.every(n=>n>=75)&&result.profit>0;
 case'fairs':case'seasons':{const h=s.history.filter(h=>h.month>=r.issuedMonth&&h.project&&h.projectNet>0);return new Set(h.map(h=>d.kind==='seasons'?E.season({month:h.month}):h.project)).size>=d.minimum;}
 }return false;
}
function resolveRequests(s,result){
 if(result.requestResolved)return;result.requestResolved=true;prepareRequests(s);
 const r=s.request,d=requestDefinition(r);if(!r||!d||r.lastCheckedMonth===s.month)return;
 if(r.lastCheckedMonth!==undefined&&r.lastCheckedMonth!==s.month-1)r.streak=0;
 r.lastCheckedMonth=s.month;r.streak=requestCheck(s,result,d,r)?r.streak+1:0;
 if(r.streak>=d.months&&!s.requestsDone.includes(d.name)){
  const amount=Math.min(r.reward,Math.max(0,C.requestRules.totalRewardCap-s.requestPaid));s.cash+=amount;result.rewards+=amount;result.requestReward=amount;s.requestPaid+=amount;s.requestsDone.push(d.name);s.notices.push('お客さんの要望に対応：'+d.name+(amount?'。地域協力金 '+(amount/10000)+'万円。':'。'));s.request=null;
 }else if(s.month>=r.deadline){s.notices.push('お客さんの声は、また時期を改めて伺います。');s.requestDeferred[d.id]=s.month+C.requestRules.deferMonths;s.request=null;}
 prepareRequests(s,s.month+1);
}
function deferRequest(s){if(!root.KE.canAct(s)||!s.request)return {error:'今は要望を変更できません。'};requestInit(s);const d=requestDefinition(s.request);if(!d)return {error:'要望が見つかりません。'};s.requestDeferred[d.id]=s.month+C.requestRules.deferMonths;s.request=null;prepareRequests(s);return {};}
function requestView(s){
 const r=s.request,d=requestDefinition(r);if(r&&d)return {name:r.name,hint:d.hint,progress:['seasons','fairs'].includes(d.kind)?new Set(s.history.filter(h=>h.month>=r.issuedMonth&&h.project&&h.projectNet>0).map(h=>d.kind==='seasons'?root.KE.season({month:h.month}):h.project)).size+' / '+d.minimum+(d.kind==='seasons'?'季節':'種類'):d.months>1?'連続 '+(r.streak||0)+' / '+d.months+'か月':'条件を満たした月の決算で対応',reward:Math.min(r.reward,Math.max(0,C.requestRules.totalRewardCap-(s.requestPaid||0))),left:Math.max(0,r.deadline-s.month+1)};
 const next=C.requests.filter(d=>!(d.types||[]).some(t=>!root.KE.isUnlocked(s,t))&&!s.requestsDone.includes(d.name)).map(d=>Math.max(d.minMonth,s.requestDeferred?.[d.id]||0)).sort((a,b)=>a-b)[0];return {waiting:next!==undefined?'次のお客さんの声：'+root.KE.date({month:Math.max(s.month,next)}):s.requestsDone.length<C.requests.length?'街の発展に合わせて、新しい声が届きます。':'これからも、みなさんの暮らしを支えていきましょう。'};
}
function resolve(s,result){
 if(!Array.isArray(s.activeTitles))s.activeTitles=root.KE.activeTitles(s);
 if(s.storyChapterSince===undefined){const index=C.chapters.findIndex(c=>!(s.storyDone||[]).includes(c.id));if(index>=0)s.storyChapterSince=chapterSince(s,index);}
 // All quests progress independently. Only settlement awards money, once per stable ID.
 if(!result.questStats)result.questStats=stats(s,result);
 const completed=[];result.questRewards=result.questRewards||[];
 for(const g of C.goals)if(!s.claimed.includes(g.id)&&metric(s,g)>=g.target){s.claimed.push(g.id);s.cash+=g.reward;result.rewards+=g.reward;result.questRewards.push({id:g.id,amount:g.reward});completed.push(g);}
 if(completed.length){const cashReward=completed.reduce((n,g)=>n+g.reward,0);s.milestones.push('goal');s.notices.push('目標達成：'+completed.slice(0,3).map(g=>g.name).join('／')+(completed.length>3?' ほか'+(completed.length-3)+'件':'')+(cashReward?'。資金報酬 '+Math.round(cashReward/10000)+'万円':'。報酬は称号です。'));if(s.claimed.includes(s.focusQuest))s.focusQuest=null;}
 resolveRequests(s,result);
 root.KE.awardRequestSouvenir(s);
 s.storyDone=s.storyDone||[];if(s.storyVersion!==2&&!result.storyRewards?.length)for(const chapter of chapters(s))if(chapter.ready&&!s.storyDone.includes(chapter.id)){s.storyDone.push(chapter.id);s.storyChapterSince=(result.month??s.month)+1;const reward=chapter.cashReward||0;s.cash+=reward;result.rewards+=reward;result.storyRewards=result.storyRewards||[];result.storyRewards.push({id:chapter.id,amount:reward});const unlocks=[...chapter.facilities.map(id=>C.facilities[id].name),...chapter.projects.map(id=>C.projects[id].name+(C.projectRequirements[id]?.minMonth!==undefined?'（'+root.KE.date({month:C.projectRequirements[id].minMonth})+'から開催）':''))];s.notices.push('第'+chapter.number+'章「'+chapter.name+'」達成。'+(unlocks.length?'解放：'+unlocks.join('・')+'。':'')+(reward?'再生支援 '+Math.round(reward/10000)+'万円。':''));}
 s.titles=s.titles||[];const add=(id,name,ok)=>{if(ok&&!s.titles.some(t=>t.id===id)){s.titles.push({id,name});s.notices.push('称号獲得：'+name+(C.titles[id].commemorative?'':'（称号画面で有効にできます）'));}};
 add('faith',C.titles.faith.name,s.buildings.filter(b=>b.type==='shrine'&&!b.build).length>=5);
 add('kotsumaruFan',C.titles.kotsumaruFan.name,s.buildings.filter(b=>b.type==='kotsumaru'&&!b.build).length>=3);
 add('morunFan',C.titles.morunFan.name,s.buildings.filter(b=>b.type==='morunShop'&&!b.build).length>=3);
 const E=root.KE,operating=activeShops(s),record=titleRecord(s),wins=id=>record.shows[id]||0;
 for(const [id,type,show]of [['kotsumaruFan','kotsumaru','kotsumaruShow'],['morunFan','morunShop','morunShow']]){
  const sales=record.sales[type];
  add(id,C.titles[id].name,operating.some(b=>b.type===type)&&(sales>=10000000||wins(show)>=2));
 }
 for(const [id,stat]of [['seasonalFood','freshFood'],['sportsTown','sports'],['rainWalk','rainCovered'],['watchful','guardCovered']])add(id,C.titles[id].name,run(s,h=>h.questStats?.[stat]===true)>=6);
 add('signatureCraft',C.titles.signatureCraft.name,operating.filter(b=>b.reputation>=12).length>=5);
 add('mascotDuo',C.titles.mascotDuo.name,['kotsumaru','morunShop'].every(type=>operating.some(b=>b.type===type))&&wins('kotsumaruShow')>=1&&wins('morunShow')>=1);
 add('fourSeasons',C.titles.fourSeasons.name,record.seasons.length===4);
 add('castleKeeper',C.titles.castleKeeper.name,!!E.castleBuilding(s)&&record.castleYears.length>=3);
 add('generations','全世代に愛される街',result.visitors.every((n,i)=>n>=(result.segmentCaps||C.segmentCaps)[i]*.3)&&result.satisfaction.every(n=>n>=65));
 add('food','食べ歩きの街',s.buildings.filter(b=>['bakery','cafe','diner'].includes(b.type)&&b.reputation>=6).length>=3);
 add('safe','災害に強い街',s.recoveries>=3&&s.buildings.filter(b=>b.type==='disaster').length>=2);
 add('all','彩り豊かな商店街',new Set(result.shops.filter(b=>b.op).map(b=>b.type)).size>=C.industries.length);
 add('steady','こつこつ黒字経営',s.maxStreak>=12);add('festival','祭りの名人',s.festivalWins>=3);
 for(const g of C.goals)if(g.rewardTitle&&s.claimed.includes(g.id))add(g.rewardTitle,C.titles[g.rewardTitle].name,true);
 if(s.storyVersion===2)root.KStory.settle(s,result);
}
const P={comfortStatus,comfortMonths,prepareRequests,requestView,deferRequest,requestCheck,resolveRequests,metric,goal,focus,chapters,projectVisible,projectUnlocked,projectUnlockHint,migrateStory,stats,hasSpace,findSpace,projectQuota,conditions,plan,resolve};root.KProgress=P;if(typeof module!=='undefined')module.exports=P;
})(typeof globalThis!=='undefined'?globalThis:this);
