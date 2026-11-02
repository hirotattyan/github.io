(function(root){
'use strict';
const C=root.KConfig||(typeof require==='function'?require('./config.js'):null);
const clone=x=>JSON.parse(JSON.stringify(x));
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const F=t=>C.facilities[t];
const isRoad=value=>Boolean(F(typeof value==='string'?value:value?.type)?.road);
const facilityMatches=(actual,required)=>actual===required||(required==='road'&&isRoad(actual))||(required==='plaza'&&actual==='grandpark');
const modeInfo=s=>s.retrySupport?{...C.modes.standard,name:C.retrySupport.name}:C.modes[s.mode||'standard'];
const turnLimit=s=>s.storyVersion===2?C.futureEnding.months:modeInfo(s).months;
function futureComplete(s){return s.storyVersion===2&&s.futureEndingAt===C.futureEnding.months;}
function finishFuture(s){if(s.storyVersion!==2||s.month<C.futureEnding.months||s.storyCompleteAt===undefined||!s.ending||s.storyFailed||s.cash<0||['rescue','bankrupt'].includes(s.status))return false;s.futureEndingAt=C.futureEnding.months;s.evaluated=true;s.status='ending';return true;}
function postgameRewards(s){const basic=Boolean(s.storyVersion===2&&s.storyCompleteAt!==undefined&&s.storyFreeplay&&s.month>=120&&!s.storyFailed&&s.status!=='bankrupt');return {basic,great:basic&&!s.retrySupport&&s.ending?.grade==='great'};}
function castleBuilding(s,net){return postgameRewards(s).great?s.buildings.find(b=>b.type==='kotsumaruCastle'&&operational(s,b,net)):null;}
function restMaintenanceSaving(s,b,net){return s.storyVersion===2&&s.storyDone.includes('campaign-6')&&s.storyChoices.business==='rest'&&['bench','plaza','grandpark','japaneseGarden'].includes(b.type)&&operational(s,b,net)?Math.round(F(b.type).fixed*.25):0;}
function castleWalkEntrance(s,b,net=network(s)){const cells=[2,3].map(dx=>[b.x+dx,b.y+6]),road=cells.find(([x,y])=>net.roads.has(key(x,y))&&net.access(b,x,y));return {cells,road:road?key(...road):null};}
function castleEffects(s,net){const b=castleBuilding(s,net),c=s.castle;if(!b||!c||c.buildingId!==b.id)return {walk:false,festival:false,satisfaction:0};const fair=['clear','sunny'].includes(root.KEvents?.climate(s).type||'clear'),walk=fair&&c.walkMonth===s.month,festival=!['typhoon','flood'].includes(root.KEvents?.climate(s).type)&&c.festivalMonth===s.month;return {walk,festival,satisfaction:(walk?C.castleRules.walkSatisfaction:0)+(festival?C.castleRules.festivalSatisfaction:0)};}
function castleBegin(s){
 const b=castleBuilding(s);if(!b)return;
 let c=s.castle;if(!c||c.buildingId!==b.id)c=s.castle={version:1,buildingId:b.id,builtAt:s.month,processedMonth:-1,walkMonth:-1,lastWalk:-100,gifts:[],giftCursor:0,giftCount:0,lastGift:-100,festivalMonth:-1,festivalYear:c?.festivalYear??-1};
 if(c.processedMonth===s.month)return;c.processedMonth=s.month;
 let seed=(s.seed^Math.imul(b.id,2654435761)^Math.imul(s.month+1,2246822519))>>>0;const draw=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 if(['clear','sunny'].includes(root.KEvents?.climate(s).type||'clear')&&s.month-c.lastWalk>=C.castleRules.walkGap&&draw()<C.castleRules.walkChance){c.walkMonth=s.month;c.lastWalk=s.month;s.notices.push('こつまる殿様がお散歩へ！今月は全客層の満足度＋2。城門から商店街を巡ります。');}
 if(!c.giftCount||s.month-c.lastGift>=C.castleRules.giftGap&&draw()<C.castleRules.giftChance){const kinds=Object.keys(C.castleRules.gifts),kind=kinds[Math.floor(draw()*kinds.length)],gift={kind,at:s.month};if(c.gifts.length<C.castleRules.maxGifts)c.gifts.push(gift);else{c.gifts[c.giftCursor]=gift;c.giftCursor=(c.giftCursor+1)%C.castleRules.maxGifts;}c.lastGift=s.month;c.giftCount++;s.notices.push('街のみなさんから'+C.castleRules.gifts[kind]+'が届きました。天守こつまる城の周囲に飾りました（最大6か所・順番に入替）。');}
}
function castleFestivalError(s){if(!canAct(s))return '経営を再開してから開催してください。';if(!castleBuilding(s))return '最上位クリア後、11年目以降の完成した城を道路につないでください。';if(['typhoon','flood'].includes(root.KEvents?.climate(s).type))return '台風・浸水の月は開催できません。';if(s.castle?.festivalYear===Math.floor(s.month/12))return '今年の城下町まつりは開催済みです。';if(availableCash(s)<C.castleRules.festivalCost)return '開催資金30万円を用意してください（納税資金は別）。';return null;}
function castleFestival(s){const error=castleFestivalError(s);if(error)return {error};castleBegin(s);if(!charge(s,C.castleRules.festivalCost,'other','城下町まつり開催'))return {error:'開催資金が足りません。'};s.castle.festivalMonth=s.month;s.castle.festivalYear=Math.floor(s.month/12);s.notices.push('城下町まつりを開催！城の周囲に屋台と提灯が並び、こつまるとモールンも参加。今月は全客層の満足度＋5。');return {};}
function taxState(s){return s.tax||{version:1,startMonth:Math.max(12,s.month),year:Math.floor(s.month/12)+1,annualProfit:0,accrued:0,pending:[],paidTotal:0,lastPaymentMonth:null};}
function taxReserve(s){const t=taxState(s);return t.accrued+t.pending.reduce((n,p)=>n+p.amount,0);}
function availableCash(s){return s.cash-taxReserve(s);}
function communitySupportStatus(s){
 const record=s.communitySupport||{version:1,lastDecisionYear:-1,choice:null,equipped:null,items:[]},year=Math.floor(s.month/12),items=record.items.map(item=>({...item,...C.communitySupportItems[item.id],left:C.communitySupportItems[item.id]?.permanent?null:Math.max(0,item.expiresMonth-s.month)})),active=items.find(item=>item.id===record.equipped&&item.receivedMonth<=s.month&&(item.permanent||item.left>0))||null;
 return {open:s.month%12===C.communitySupportRules.month,decided:record.lastDecisionYear===year,choice:record.lastDecisionYear===year?record.choice:undefined,items,active};
}
function communitySupportError(s,id){if(!canAct(s))return '経営を再開してから選んでください。';const view=communitySupportStatus(s);if(!view.open)return '地域応援月間は11月です。';if(view.decided)return '今年の地域応援は選択済みです。';if(id!==null&&!C.communitySupportItems[id]?.group)return '支援先を選んでください。';if(id!==null&&availableCash(s)<C.communitySupportRules.cost)return '支援には30万円が必要です（納税資金は別）。';return null;}
function supportCommunity(s,id,equip=true){
 const error=communitySupportError(s,id);if(error)return {error};
 if(id!==null&&!charge(s,C.communitySupportRules.cost,'other','地域応援：'+C.communitySupportItems[id].group))return {error:'支援資金が足りません。'};
 const record=s.communitySupport||(s.communitySupport={version:1,lastDecisionYear:-1,choice:null,equipped:null,items:[]});record.lastDecisionYear=Math.floor(s.month/12);record.choice=id;
 if(id===null){s.notices.push('今年の地域応援は見送りました。');return {};}
 const item={id,receivedMonth:s.month,expiresMonth:s.month+C.communitySupportRules.duration};record.items=record.items.filter(i=>i.id!==id);record.items.push(item);if(equip)record.equipped=id;
 s.notices.push(C.communitySupportItems[id].group+'を支援し、「'+C.communitySupportItems[id].name+'」を受け取りました。'+(equip?'装備中・12か月有効。':''));
 return {item};
}
function awardRequestSouvenir(s){
 const claimed=new Set(s.claimed||[]),done=C.goals.filter(g=>claimed.has(g.id));
 if(done.length<C.goalSouvenirRules.total||done.filter(g=>g.advanced).length<C.goalSouvenirRules.advanced||s.communitySupport?.items.some(i=>i.id==='yosegaki'))return false;
 const r=s.communitySupport||(s.communitySupport={version:1,lastDecisionYear:-1,choice:null,equipped:null,items:[]});r.items.push({id:'yosegaki',receivedMonth:s.month+1,expiresMonth:null});s.notices.push('数多くの目標を達成したお礼に「みんなの寄せ書き」を受け取りました。');return true;
}
function equipCommunityItem(s,id){if(!canAct(s))return {error:'経営を再開してから装備してください。'};if(id!==null&&!communitySupportStatus(s).items.some(i=>i.id===id&&(i.permanent||i.left>0)))return {error:'有効期限内の記念品を選んでください。'};if(!s.communitySupport)return id===null?{}:{error:'記念品をまだ持っていません。'};s.communitySupport.equipped=id;return {};}
function taxNotice(s){
 if(s.month%12!==C.tax.collectionMonth)return null;
 const year=Math.floor(s.month/12)+1,t=taxState(s),due=t.pending.filter(p=>p.year<year).reduce((n,p)=>n+p.amount,0),yen=n=>n.toLocaleString('ja-JP')+'円';
 const text=year<=C.tax.exemptYears?'今年の支払いはありません。1年目の利益は全額免税です。':year===2?'今年の支払いはありません。最初の徴収は3年目5月です。':due>0?'前年利益に対する税金'+yen(due)+'を、今月末に確保済みの資金から納付します。':'前年の課税対象利益がないため、今年の支払いはありません。';
 return {art:'tax',kind:'tax',title:year===1?'5月の税金と、再建支援の免税':due?'5月の納税：'+yen(due):'5月の納税：今年の支払いはありません',text,amount:due};
}
function settleTax(s,result){
 const t=s.tax||(s.tax=taxState(s)),year=Math.floor(s.month/12)+1;
 if(t.year!==year){t.year=year;t.annualProfit=0;t.accrued=0;}
 result.preTaxProfit=result.profit;result.taxExpense=0;result.taxPaid=0;result.taxExempt=year<=C.tax.exemptYears;
 if(!result.taxExempt&&s.month>=t.startMonth){t.annualProfit+=result.preTaxProfit;const desired=Math.floor(Math.max(0,t.annualProfit)*C.tax.rate);result.taxExpense=desired-t.accrued;t.accrued=desired;}
 if(s.month%12===C.tax.collectionMonth){const due=t.pending.filter(p=>p.year<year);result.taxPaid=due.reduce((n,p)=>n+p.amount,0);t.pending=t.pending.filter(p=>p.year>=year);t.paidTotal+=result.taxPaid;t.lastPaymentMonth=s.month;s.cash-=result.taxPaid;if(result.taxPaid)s.notices.push('5月の納税：'+result.taxPaid.toLocaleString('ja-JP')+'円を納付しました。');}
 result.profit-=result.taxExpense;result.cashFlow-=result.taxPaid;
 if(s.month%12===11){if(t.accrued>0)t.pending.push({year,amount:t.accrued,profit:t.annualProfit});t.year=year+1;t.annualProfit=0;t.accrued=0;if(year===1)s.notices.push('再建支援の免税期間が終了。2年目の利益から課税対象となり、最初の納税は3年目5月です。');}
 result.taxReserve=taxReserve(s);
}
function boomMatches(boom,type){const rule=C.booms[boom?.type];return !!rule&&(rule.types===null||rule.types.includes(type));}
function availableTitles(s){return [...new Set([...(s.carryTitles||[]),...(s.titles||[]).map(t=>t.id)])].filter(id=>Object.keys(C.titles).includes(id));}
function activeTitles(s){const available=availableTitles(s);return [...new Set(Array.isArray(s.activeTitles)?s.activeTitles:available)].filter(id=>available.includes(id)&&!C.titles[id].commemorative).slice(0,C.titleRules.maxActive);}
function toggleTitle(s,id){if(C.titles[id]?.commemorative)return {error:'記念称号は有効枠を使いません。'};if(!availableTitles(s).includes(id))return {error:'この街で獲得・持越しした称号を選んでください。'};const current=activeTitles(s);if(current.includes(id))s.activeTitles=current.filter(v=>v!==id);else{if(current.length>=C.titleRules.maxActive)return {error:'有効にできる称号は3個までです。先にほかの称号を停止してください。'};s.activeTitles=[...current,id];}return {};}
function titleEffects(s){const ids=activeTitles(s),effect={ids,satisfaction:0,seniorSatisfaction:0,leisureNuisance:0,shrineGiftChance:1,shopCapacity:1,restCapacity:1,publicFixed:1,freshTicket:1,sportsTicket:1,rainLoss:1,projectSecurityLoss:1,upgradeCost:1,seasonalProjectCost:1,foodSales:1,foodCapacity:1,kotsumaruTicket:1,morunTicket:1,flowersCoffeeSales:1,leisureSales:1,disasterCost:1,visitRate:1,storeFixed:1,projectLift:1,projectCost:1,capMen:1,capWomen:1,capSenior:1,capChild:1};for(const id of ids)for(const [key,value]of Object.entries(C.titles[id].bonus))if(['satisfaction','seniorSatisfaction','leisureNuisance'].includes(key))effect[key]+=value;else effect[key]*=value;if(s.storyVersion===2&&s.storyDone.includes('campaign-6')){if(s.storyChoices.business==='rest')effect.satisfaction+=1;if(s.storyChoices.business==='stage')effect.projectLift*=1.05;}return effect;}
function segmentCaps(s){const e=titleEffects(s);return [e.capMen,e.capWomen,e.capSenior,e.capChild].map((v,i)=>Math.round(C.segmentCaps[i]*v));}
const mascotBreakActive=s=>Boolean(mascotActive(s)&&s.events.mascotBreak?.left>0);
function mascotMoment(s){const m=s.events.mascotMoment;return mascotActive(s)&&m?.at===s.month?C.mascotMoments[m.type]:null;}
const mascotActive=s=>Boolean(s.mascot&&s.month>=s.mascot.debutMonth);
function projectCost(s,id){const e=titleEffects(s);return Math.round(C.projects[id].cost*e.projectCost*(C.projects[id].season?e.seasonalProjectCost:1));}
const entranceProfile=s=>C.entrances[s.entrance||'normal']||C.entrances.normal;
function entranceConditions(s,id){
 const p=C.entrances[id];if(!p)return {ok:false,requirements:[{name:'存在しない入口です。',met:false}]};if(id==='normal')return {ok:true,requirements:[]};if(p.postgame){const met=postgameRewards(s)[p.postgame];return {ok:met,requirements:[{name:'本編クリア後、11年目1月以降も経営を続ける',met}]};}
 const net=network(s),shops=s.buildings.filter(b=>F(b.type).shop&&operational(s,b,net)),requirements=[{name:'第一章をクリア',met:s.storyVersion===2?(s.storyDone||[]).includes('campaign-1'):s.month>=12}];
 if(p.minTypes)requirements.push({name:'対象のお店を'+p.minTypes+'業種以上営業',met:new Set(shops.filter(b=>p.types.includes(b.type)).map(b=>b.type)).size>=p.minTypes});
 if(p.park)requirements.push({name:'小公園または大公園が利用可能',met:s.buildings.some(b=>['plaza','grandpark'].includes(b.type)&&operational(s,b,net))});
 if(p.mascot)requirements.push({name:'マスコット誕生・グッズ店が営業中',met:mascotActive(s)&&shops.some(b=>b.type==='kotsumaru')});
 if(p.minIndustries)requirements.push({name:'営業中'+p.minIndustries+'業種以上',met:new Set(shops.map(b=>b.type)).size>=p.minIndustries},{name:'来街'+p.minVisitors.toLocaleString('ja-JP')+'人以上の実績',met:s.peakVisitors>=p.minVisitors},{name:'治安が良い',met:forecast(s).securityValue>=C.townDisplayRules.securityGood});
 return {ok:requirements.every(r=>r.met),requirements};
}
function canChangeEntrance(s,id){if(!Object.hasOwn(C.entrances,id))return '存在しない入口です。';if(!(id==='normal'&&s.status==='rescue')&&!canAct(s))return '今は入口を変更できません。';if((s.entrance||'normal')===id)return '現在の入口です。';if(s.entranceChangedMonth===s.month)return '入口の変更は月に一度までです。';const conditions=entranceConditions(s,id);if(!conditions.ok)return conditions.requirements.filter(r=>!r.met).map(r=>r.name).join('／');if(id!=='normal'&&!network(s).roads.has('0,4'))return '街の入口の道路を復旧してください。';if(C.entrances[id].cost>0&&availableCash(s)<C.entrances[id].cost)return '納税資金を除いた整備費が足りません。';return null;}
function changeEntrance(s,id){const error=canChangeEntrance(s,id);if(error)return {error};const p=C.entrances[id];if(p.cost&&!charge(s,p.cost,'construction',p.name+'の整備'))return {error:'整備費が足りません。'};s.entrance=id;s.entranceChangedMonth=s.month;s.notices.push(p.name+'に変更しました。');return {};}
function repairCost(s,b){return Math.round(F(b.type).cost*b.damage*.65*titleEffects(s).disasterCost);}
const rotation=b=>b.rotation??0;
function footprint(b){const f=F(b.type);return rotation(b)%2?{w:f.h,h:f.w}:{w:f.w,h:f.h};}
function toWorld(b,x,y){const f=F(b.type),r=rotation(b);return r===1?[b.x+f.h-y,b.y+x]:r===2?[b.x+f.w-x,b.y+f.h-y]:r===3?[b.x+y,b.y+f.w-x]:[b.x+x,b.y+y];}
function fromWorld(b,x,y){const f=F(b.type),a=x-b.x,c=y-b.y,r=rotation(b);return r===1?[c,f.h-a]:r===2?[f.w-a,f.h-c]:r===3?[f.w-c,a]:[a,c];}
function entranceCells(b){const f=footprint(b),r=rotation(b),out=[];if(F(b.type).allSideEntrance||['grandpark','flowerbed'].includes(b.type)){for(let x=b.x;x<b.x+f.w;x++)out.push([x,b.y-1],[x,b.y+f.h]);for(let y=b.y;y<b.y+f.h;y++)out.push([b.x-1,y],[b.x+f.w,y]);return out;}if(r===0||r===2)for(let x=b.x;x<b.x+f.w;x++)out.push([x,r===0?b.y+f.h:b.y-1]);else for(let y=b.y;y<b.y+f.h;y++)out.push([r===1?b.x-1:b.x+f.w,y]);return out;}
const rotatable=b=>!F(b.type)?.fixedOrientation&&(!F(b.type)?.tenant||!b.build)&&(!isRoad(b)||b.type==='bridge')&&b.type!=='vacant';
const roadAccess=(b,x,y)=>Boolean(b&&isRoad(b)&&Math.abs(x-b.x)+Math.abs(y-b.y)===1&&(b.type!=='bridge'||(rotation(b)%2?x===b.x:y===b.y)));
const roadLinked=(a,b)=>Boolean(a&&b&&roadAccess(a,b.x,b.y)&&roadAccess(b,a.x,a.y));
function bridgeAligned(s,b){const ends=rotation(b)%2?[[b.x,b.y-1],[b.x,b.y+1]]:[[b.x-1,b.y],[b.x+1,b.y]];return ends.every(([x,y])=>{const road=at(s,x,y);return road&&!road.build&&!road.closed&&roadLinked(b,road);});}
function rng(s){s.seed=(Math.imul(s.seed,1664525)+1013904223)>>>0;return s.seed/4294967296;}
function building(s,type,x,y,extra={}){const b={id:s.nextId++,type,x,y,level:1,build:0,closed:0,damage:0,spec:0,fans:0,reputation:0,legacy:false,invested:F(type).cost,...extra};s.buildings.push(b);return b;}
function create(seed=1234567){
 const s={version:C.version,facilityLimitVersion:1,eventStageLimitVersion:1,seed:seed>>>0,month:0,size:8,cash:C.initialCash,nextId:1,buildings:[],history:[],ledger:[],catalogueUsage:{facilities:{},projects:{}},spent:{construction:0,projects:0,other:0},debts:[],grantUsed:false,claimed:[],unlocked:[],streak:0,maxStreak:0,requestsDone:[],request:null,project:null,lastProject:null,repeatProject:0,response:'save',prepared:false,events:{active:null,next:null,boom:null,cooldown:0,lastBad:-12},notices:[],milestones:[],seenArt:[],status:'playing',evaluated:false,ending:null,last:null,festivalWins:0,recoveries:0,peakVisitors:0};
 for(let x=0;x<8;x++)building(s,'road',x,4);
 for(let y=1;y<8;y++)if(y!==4)building(s,'road',3,y);
 building(s,'bakery',2,3,{legacy:true,invested:1500000});building(s,'cafe',4,3,{legacy:true,invested:1250000});building(s,'flower',5,5,{legacy:true,invested:1000000,rotation:0});
 building(s,'road',5,4); // duplicate normalized below
 s.buildings=s.buildings.filter((b,i,a)=>b.type!=='road'||a.findIndex(o=>o.type==='road'&&o.x===b.x&&o.y===b.y)===i);
 building(s,'vacant',1,5);building(s,'vacant',6,3);
 s.requestVersion=1;s.requestPaid=0;s.requestDeferred={};s.request={...C.requests[0],deadline:17,issuedMonth:0,streak:0};
 s.notices=['大型施設の開業で客足が減っています。まずは古い3店の改装と、道路のつながりを確認しましょう。'];
 s.tax=taxState(s);if(root.KStory)root.KStory.initialize(s);if(root.KEvents)root.KEvents.begin(s,{rng});s.startSnapshot=snapshot(s);return s;
}
function snapshot(s){const {startSnapshot,retrySnapshot,...current}=s;return clone(current);}
function at(s,x,y){return s.buildings.find(b=>{const f=footprint(b);return x>=b.x&&y>=b.y&&x<b.x+f.w&&y<b.y+f.h;});}
function cells(b){const f=footprint(b),a=[];for(let y=b.y;y<b.y+f.h;y++)for(let x=b.x;x<b.x+f.w;x++)a.push([x,y]);return a;}
const key=(x,y)=>x+','+y;
function network(s){
 const tiles=new Map(s.buildings.filter(b=>isRoad(b)&&!b.build&&!b.closed).map(b=>[key(b.x,b.y),b])),seen=new Set(),queue=[];
 if(tiles.has('0,4')){seen.add('0,4');queue.push([0,4]);}
 for(let i=0;i<queue.length;i++){const [x,y]=queue[i];for(const [a,b]of [[x+1,y],[x-1,y],[x,y+1],[x,y-1]])if(!seen.has(key(a,b))&&roadLinked(tiles.get(key(x,y)),tiles.get(key(a,b)))){seen.add(key(a,b));queue.push([a,b]);}}
 const access=(b,x,y)=>seen.has(key(x,y))&&cells(b).some(([a,c])=>roadAccess(tiles.get(key(x,y)),a,c));
 const adjacent=b=>cells(b).some(([x,y])=>[[x+1,y],[x-1,y],[x,y+1],[x,y-1]].some(([a,c])=>access(b,a,c)));
 // The original flower shop also needs front access in older saves without rotation.
 const entranceRequired=b=>b.rotation!==undefined||(b.type==='flower'&&b.id===17&&b.x===5&&b.y===5);
 const regularConnected=b=>F(b.type).decorative?true:isRoad(b)?seen.has(key(b.x,b.y)):entranceRequired(b)&&rotatable(b)?entranceCells(b).some(([x,y])=>access(b,x,y)):adjacent(b);
 const connected=b=>{if(!F(b.type).diningAccess)return regularConnected(b);const a=terraceTarget(s,b);return Boolean(a&&!a.build&&!a.closed&&!root.KEvents?.isTyphoon(s)&&regularConnected(a));};
 return {roads:seen,connected,access};
}
function operational(s,b,net=network(s)){return !b.build&&!b.closed&&b.type!=='vacant'&&net.connected(b)&&!(F(b.type).shop&&root.KEvents?.isTyphoon(s));}
function edgeAdjacent(a,b){const fa=footprint(a),fb=footprint(b);return ((a.x+fa.w===b.x||b.x+fb.w===a.x)&&Math.min(a.y+fa.h,b.y+fb.h)>Math.max(a.y,b.y))||((a.y+fa.h===b.y||b.y+fb.h===a.y)&&Math.min(a.x+fa.w,b.x+fb.w)>Math.max(a.x,b.x));}
function distance(a,b){const fa=footprint(a),fb=footprint(b);return Math.max(Math.abs(a.x+fa.w/2-b.x-fb.w/2),Math.abs(a.y+fa.h/2-b.y-fb.h/2));}
function services(s,net=network(s),crowd='auto'){
 const active=s.buildings.filter(b=>(!F(b.type).shop||F(b.type).security||F(b.type).nuisance||F(b.type).comfort)&&!isRoad(b)&&operational(s,b,net));
 const count=t=>Math.min(2,active.filter(b=>b.type===t).length);
 const near=(b,t,r)=>active.some(a=>a.type===t&&distance(a,b)<=r);
 const protection=b=>active.reduce((best,a)=>{const rule=F(a.type).security;return rule&&distance(a,b)<=rule.radius?Math.max(best,rule.strength):best;},0);
 const effects=titleEffects(s),titleNoise=effects.leisureNuisance;
 const nuisance=b=>Math.min(C.leisureRules.nuisanceCap,[...new Set(active.filter(a=>F(a.type).nuisance&&distance(a,b)<=F(a.type).nuisance.radius).map(a=>a.type))].reduce((sum,type)=>sum+F(type).nuisance.strength,0)+(titleNoise&&active.some(a=>['gamecenter','karaoke'].includes(a.type)&&distance(a,b)<=3)?titleNoise:0));
 const projectLoad=root.KEvents?.isTyphoon(s)?0:C.projectSecurityRules.loss[s.project]||0;
 const baseSecurity=b=>{const guard=protection(b),projectLoss=projectLoad*effects.projectSecurityLoss*(1-C.projectSecurityRules.guardMitigation*guard)/C.townMetricRules.securityScale;return clamp(guard-nuisance(b)*(1-guard)-projectLoss,-C.townMetricRules.securityBase/C.townMetricRules.securityScale,1);};
 let crowdState=crowd;
 const security=b=>{if(crowdState==='auto')crowdState=congestionStatus(s);const r=C.townMetricRules,loss=(r.securityLoss[crowdState?.level]||0)*(1-r.guardMitigation*protection(b));return clamp(baseSecurity(b)-loss/r.securityScale,-r.securityBase/r.securityScale,1);};
 const securityValue=b=>clamp(C.townMetricRules.securityBase+C.townMetricRules.securityScale*security(b),0,100);
 const attractions=b=>active.filter(a=>F(a.type).attraction&&distance(a,b)<=F(a.type).attraction.radius);
 const flowerbedLinked=b=>b.type==='flowerbed'&&active.some(a=>['plaza','grandpark'].includes(a.type)&&distance(a,b)<=C.flowerbedRules.parkRadius);
 const attractionStrength=a=>flowerbedLinked(a)?C.flowerbedRules.linkedStrength:F(a.type).attraction.strength;
 const attraction=(b,seg)=>{const nearby=attractions(b);return Math.min(C.landmarkRules.attractionCap,[...new Set(nearby.map(a=>a.type))].reduce((sum,type)=>sum+Math.max(...nearby.filter(a=>a.type===type).map(attractionStrength))*(F(type).pop?.[seg]||1),0));};
 return {active,count,near,protection,nuisance,baseSecurity,security,securityValue,attractions,attraction,flowerbedLinked,projectLoad,access:Math.min(.28,count('parking')*.1+count('bicycle')*.07),plaza:Math.min(count('grandpark')?.24:.16,count('plaza')*.08+count('grandpark')*.18)};
}
function season(s){return ['冬','冬','春','春','春','夏','夏','夏','秋','秋','秋','冬'][s.month%12];}
function date(s){if(s.storyVersion===2&&s.month>=C.futureEnding.months)return C.futureEnding.years+'年目 12月';return s.evaluated&&s.month>=turnLimit(s)?`${modeInfo(s).years}年目 12月`:`${Math.floor(s.month/12)+1}年目 ${s.month%12+1}月`;}
function charge(s,cost,category='other',label='支出'){
 if(!Number.isFinite(cost)||cost<0||availableCash(s)<cost)return false;
 s.cash-=cost;s.spent[category]+=cost;s.ledger.push({month:s.month,label,amount:-cost});return true;
}
function canAct(s){if(mascotActive(s))return false;return s.status==='playing'&&s.cash>=0&&(s.storyVersion!==2||s.month<turnLimit(s))&&(s.storyVersion!==2||s.storyCompleteAt!==undefined||s.month<120);}
function finishRescue(s){if(s.status==='rescue'&&s.cash>=0){if(s.storyVersion===2){s.status='playing';finishFuture(s);}else{s.status=s.evaluated&&s.month>=turnLimit(s)?'ending':'playing';if(s.status==='ending')s.ending=evaluate(s);}s.startSnapshot=snapshot(s);}}
function towerActive(s){return s.buildings.some(b=>b.type==='tower'&&operational(s,b));}
function towerConditions(s){
 if(s.storyVersion===2)return root.KStory.towerConditions(s);
 const r=C.towerRules,net=network(s),industries=new Set(s.buildings.filter(b=>F(b.type).shop&&operational(s,b,net)).map(b=>b.type)).size,history=Array.from({length:r.visitorMonths},(_,i)=>s.history.find(h=>h.month===s.month-r.visitorMonths+i)),complete=history.every(h=>h&&Number.isFinite(h.total)),sum=complete?history.reduce((a,h)=>a+h.total,0):0;
 const requirements=[{name:'第8章「'+C.chapters.find(c=>c.id==='story-8').name+'」を達成',met:(s.storyDone||[]).includes('story-8')||(s.storyUnlockedFacilities||[]).includes('tower')},{name:'商店街マスコットが誕生済み',met:mascotActive(s)},{name:'道路につながる営業中のお店が'+r.minIndustries+'業種以上（現在'+industries+'業種）',met:industries>=r.minIndustries},{name:'直近'+r.visitorMonths+'か月の平均来街人数が'+r.minVisitors.toLocaleString('ja-JP')+'人以上（'+(complete?'実績'+(Math.floor(sum/r.visitorMonths*10)/10).toLocaleString('ja-JP')+'人':r.visitorMonths+'か月分の決算が必要')+'）',met:complete&&sum>=r.minVisitors*r.visitorMonths}];
 return {ok:requirements.every(r=>r.met),requirements};
}
function morunKnown(s){return Boolean(s.events.morunSeen||['morun','morunBreak'].includes(s.events.active?.type)||s.history.some(h=>['morun','morunBreak'].includes(h.competition?.type)));}
function unlockHint(s,type){if(s.storyVersion===2)return root.KStory.unlockHint(s,type);if(F(type)?.retired)return 'この施設は廃止されました。';if(F(type)?.unlockMorun)return 'モールンの初登場後に解放';if(type==='tower')return towerConditions(s).requirements.filter(r=>!r.met).map(r=>r.name).join('／')||'最高位のランドマーク・1棟まで';if(F(type)?.unlockMascot)return '商店街マスコット企画を開催し、マスコット誕生後に解放';const rule=F(type)?.unlock;if(rule)return '目標'+rule.goals+'件達成、または'+date({month:rule.month})+'で解放';const chapter=C.chapters.find(c=>c.facilities.includes(type));return (s.storyVersion===1||F(type)?.unlockChapter)&&chapter?'第'+chapter.year+'章「'+chapter.name+'」達成で解放':'未解禁です。目標2つ達成、または2年目に解禁。';}
function isUnlocked(s,type){
 if(F(type)?.postgame&&!postgameRewards(s)[F(type).postgame])return false;
 if(s.storyVersion===2)return root.KStory.facilityUnlocked(s,type);
 if(F(type)?.retired)return false;
 if(type==='tower')return towerConditions(s).ok;
 if(F(type)?.tenant)return false;
 if(F(type)?.unlockMascot)return mascotActive(s);
 if(F(type)?.unlockMorun)return morunKnown(s);
 if(F(type)?.unlock){const rule=F(type).unlock;return s.month>=rule.month||s.claimed.length>=rule.goals;}
 if(F(type)?.unlockChapter)return (s.storyDone||[]).includes(F(type).unlockChapter)||(s.storyUnlockedFacilities||[]).includes(type);
 if(s.storyVersion===1){const chapter=C.chapters.find(c=>c.facilities.includes(type));return Boolean(F(type)&&type!=='vacant'&&(!chapter||(s.storyDone||[]).includes(chapter.id)||(s.storyUnlockedFacilities||[]).includes(type)));}
 if(['market','sports','arcade','sportcenter'].includes(type))return s.month>=C.balance.unlockMonth||s.claimed.length>=C.balance.unlockGoals;
 return !!F(type)&&type!=='vacant';
}
function canBuild(s,type,x,y,turn){
 const base=F(type);if(!base)return unlockHint(s,type);
 if(base.maxInstances&&s.buildings.filter(b=>b.type===type).length>=base.maxInstances)return base.name+'は工事・休業中も含め'+base.maxInstances+'棟までです。';
 if(!isUnlocked(s,type))return unlockHint(s,type);
 if(turn!==undefined&&(!Number.isInteger(turn)||turn<0||turn>3))return '向きが正しくありません。';
 const f={...base,...footprint({type,rotation:turn})};
 if(!canAct(s))return '先に資金ショートを解決してください。';
 if(!Number.isInteger(x)||!Number.isInteger(y)||x<0||y<0||x+f.w>s.size||y+f.h>s.size)return '利用可能な範囲に収まりません。';
 if(s.projectSite&&!s.projectSite.id&&s.projectSite.x>=x&&s.projectSite.x<x+f.w&&s.projectSite.y>=y&&s.projectSite.y<y+f.h)return '今月の企画会場として使う区画です。';
 if(base.requiresBase&&at(s,x,y)?.type!==base.requiresBase)return '橋は小川の上にだけ架けられます。先に小川を配置してください。';
 if(type==='bridge'&&!bridgeAligned(s,{type,x,y,rotation:turn??at(s,x,y)?.rotation??0}))return '橋の両端（出入口）を道路に合わせてください。回転するか、両端に道路を配置してください。';
 for(let yy=y;yy<y+f.h;yy++)for(let xx=x;xx<x+f.w;xx++){const b=at(s,xx,yy);if(b&&b.type!=='vacant'){if(base.requiresBase&&b.type===base.requiresBase){if(b.build||b.closed)return '小川が利用できる状態になるまで待ってください。';}else if(type!=='bridge'&&b.type!=='bridge'&&isRoad(type)&&isRoad(b)){if(b.type===type)return 'すでに同じ道路があります。';}else return '建物や道路と重なっています。';}}
 if(availableCash(s)<f.cost)return taxReserve(s)>0?'納税資金を除いた使用可能額が足りません。':'建設資金が足りません。';if(type==='tower'&&availableCash(s)-f.cost<f.fixed*C.towerRules.reserveMonths)return '建設後に維持費6か月分（600万円）を使用可能な資金として残してください。';return null;
}
function catalogueCounts(s,kind){
 const saved=s.catalogueUsage?.[kind];if(saved)return {...saved};const counts={};
 if(kind==='facilities')for(const b of s.buildings)if(b.type!=='vacant'&&!F(b.type).tenant)counts[b.type]=(counts[b.type]||0)+1;
 if(kind==='projects')for(const h of s.history)if(h.project&&!h.allClosed)counts[h.project]=(counts[h.project]||0)+1;
 return counts;
}
function recordCatalogueUse(s,kind,id){const counts=catalogueCounts(s,kind);counts[id]=(counts[id]||0)+1;s.catalogueUsage={...s.catalogueUsage,[kind]:counts};}
function construct(s,type,x,y,turn){const error=canBuild(s,type,x,y,turn);if(error)return {error};const f={...F(type),...footprint({type,rotation:turn})};if(!charge(s,f.cost,'construction',f.name+'建設'))return {error:'建設資金が足りません。'};
 recordCatalogueUse(s,'facilities',type);
 const existing=at(s,x,y);if(f.requiresBase){existing.type=type;existing.rotation=turn??existing.rotation??0;existing.invested+=f.cost;return {building:existing};}if(isRoad(type)&&isRoad(existing)){existing.type=type;existing.invested+=f.cost;return {building:existing};}
 const overlapped=new Set();for(let yy=y;yy<y+f.h;yy++)for(let xx=x;xx<x+f.w;xx++){const b=at(s,xx,yy);if(b)overlapped.add(b.id);}
 s.buildings=s.buildings.filter(b=>!overlapped.has(b.id));const b=building(s,type,x,y,{build:f.months,...(turn!==undefined&&rotatable({type})?{rotation:turn}:{})});return {building:b};
}
function canTurnBuilding(s,id,turn){const b=s.buildings.find(b=>b.id===id);if(!canAct(s)||!b||!rotatable(b)||b.build)return '今は向きを変えられません。';
 const next=turn===undefined?(rotation(b)+1)%4:turn;if(!Number.isInteger(next)||next<0||next>3)return '向きが正しくありません。';
 const proposal={...b,rotation:next},f=footprint(proposal),occupied=new Set(cells(proposal).map(([x,y])=>key(x,y)));
 if(b.x+f.w>s.size||b.y+f.h>s.size)return '回すと利用可能な範囲からはみ出します。';
 if(s.buildings.some(a=>a.id!==id&&cells(a).some(([x,y])=>occupied.has(key(x,y)))))return '回すと建物や道路と重なります。';
 if(b.type==='bridge'&&!bridgeAligned(s,proposal))return '橋の両端（出入口）を道路に合わせてください。回転するか、両端に道路を配置してください。';
 const after={...s,buildings:s.buildings.map(a=>a.id===id?proposal:a)};
 if(F(b.type).tenant&&network(s).connected(b)&&!network(after).connected(proposal))return '誘致店につながる道路を維持してください。';
 if(s.projectSite&&!s.projectSite.id&&occupied.has(key(s.projectSite.x,s.projectSite.y)))return '今月の企画会場として使う区画です。';
 if(s.project&&s.projectRules===1&&root.KProgress&&!root.KProgress.conditions(after,s.project).ok)return '今月の企画に必要な施設の接続を維持してください。';
 return null;
}
function turnBuilding(s,id,turn){const error=canTurnBuilding(s,id,turn);if(error)return {error};const b=s.buildings.find(a=>a.id===id);b.rotation=turn===undefined?(rotation(b)+1)%4:turn;return {};}
function upgradeCost(b,s){return Math.round(F(b.type).cost*C.upgradeRatio*(b.level===1?1:1.5)*(s?titleEffects(s).upgradeCost:1));}
function upgrade(s,id){const b=s.buildings.find(b=>b.id===id);if(!canAct(s)||!b||!F(b.type).shop||b.build||b.closed||b.level>=3)return {error:'改装できない状態です。'};
 if(s.project&&s.projectRules===1&&root.KProgress&&!root.KProgress.conditions({...s,buildings:s.buildings.map(a=>a.id===id?{...a,build:1}:a)},s.project).ok)return {error:'今月の企画に必要な設備です。開催後に改装してください。'};
 const cost=upgradeCost(b,s);if(!charge(s,cost,'construction',F(b.type).name+'改装'))return {error:'改装資金が足りません。'};
 b.invested+=cost;b.build=1;b.pendingLevel=b.level+1;b.legacy=false;return {};}
function specialize(s,id,index){const b=s.buildings.find(b=>b.id===id);if(!canAct(s)||!b||!F(b.type).shop||b.build||!Number.isInteger(index)||index<0||index>2)return {error:'変更できません。'};
 if(index===b.spec)return {error:'同じ品ぞろえです。'};if(!charge(s,C.specializeCost,'other','品ぞろえ変更'))return {error:'資金が足りません。'};b.spec=index;b.fans*=.75;return {};}
function saleValue(b){return F(b.type).shop&&!b.build?Math.floor(Math.min(b.invested,F(b.type).cost*1.8)*C.saleRatio):0;}
function isolatedByRemoval(s,id){const before=network(s);const next={...s,buildings:s.buildings.filter(b=>b.id!==id)};const after=network(next);return s.buildings.filter(b=>F(b.type).shop&&!b.build&&before.connected(b)&&!after.connected(b)).map(b=>F(b.type).name);}
function remove(s,id,confirmed=false){
 if(!['playing','rescue'].includes(s.status))return {error:'評価の確認または再挑戦後に操作してください。'};
 const b=s.buildings.find(b=>b.id===id);if(!b)return {error:'施設がありません。'};if(F(b.type).tenant)return {error:'誘致店は契約中に撤去できません。満了後に退去を選んでください。'};
 if(b.type==='kotsumaruCastle'&&s.castle?.festivalMonth===s.month)return {error:'城下町まつりの開催月は撤去できません。'};
 if(s.projectSite?.id===id)return {error:'今月の企画会場です。開催後に撤去できます。'};
 if(s.project&&s.projectRules===1&&root.KProgress&&!root.KProgress.conditions({...s,buildings:s.buildings.filter(a=>a.id!==id)},s.project).ok)return {error:'撤去すると今月の企画の開催条件を満たせなくなります。開催後に撤去してください。'};
 if(isRoad(b)&&b.x===0&&b.y===4)return {error:'入口の歩道は残してください。'};
 if(isRoad(b)&&!confirmed){const lost=isolatedByRemoval(s,id);if(lost.length)return {warning:`撤去すると ${lost.join('・')} が道路から孤立します。`,needsConfirm:true};}
 const value=saleValue(b);s.cash+=value;s.ledger.push({month:s.month,label:F(b.type).name+(b.build?'工事取消（返金なし）':value?'売却':'撤去'),amount:value});
 if(b.type==='eventStage'&&!b.build)s.stageShowsUnlocked=true;
 if(b.type==='bridge'){b.type='stream';b.invested=F('stream').cost;b.build=0;b.closed=0;b.damage=0;}else{s.buildings=s.buildings.filter(a=>a.id!==id);if(F(b.type).shop&&!b.build)building(s,'vacant',b.x,b.y);}
 finishRescue(s);return {value};
}
function expansionInfo(s){
 const index=(s.size-C.baseSize)/2,normalCount=C.balance.expansionCosts.length,postgame=index>=normalCount,unlocked=postgameRewards(s).great,costs=[...C.balance.expansionCosts,...C.postgameExpansion.costs],limit=unlocked?C.postgameExpansion.maxSize:C.maxSize,maxed=s.size>=limit||!Number.isInteger(index)||index<0||index>=costs.length,locked=postgame&&!unlocked&&s.size<C.postgameExpansion.maxSize;
 return {index,maxed,postgame,postgameUnlocked:unlocked,locked,target:maxed?s.size:s.size+2,cost:maxed?0:costs[index],goals:maxed||postgame?0:C.balance.expansionGoals[index],month:postgame?120:maxed?0:C.balance.expansionMonths[index],ready:!maxed&&(postgame?unlocked:s.claimed.length>=C.balance.expansionGoals[index]||s.month>=C.balance.expansionMonths[index])};
}
function expand(s){const info=expansionInfo(s);if(info.maxed)return {error:info.locked?'追加区画は本編を最上評価でクリアし、11年目1月以降も経営を続けると解放できます。':'すべての区画を解放しました。'};if(!canAct(s))return {error:'先に資金ショートを解決してください。'};
 if(!info.ready)return {error:'目標'+info.goals+'件達成、または'+date({month:info.month})+'から区画を解放できます。'};
 if(!charge(s,info.cost,'construction','隣接区画の解放'))return {error:'区画解放の資金が足りません。'};s.size=info.target;return {};}

function borrow(s,amount){
 const principal=s.debts.reduce((a,d)=>a+d.balance,0);
 if(!Number.isSafeInteger(amount)||amount<100000||amount%100000||principal+amount>C.loanCap)return {error:'借入は10万円単位、残高合計800万円までです。'};
 if(!['playing','rescue'].includes(s.status))return {error:'今は借入できません。'};
 s.debts.push({balance:amount,installment:Math.ceil(amount/C.loanMonths),left:C.loanMonths});s.cash+=amount;s.ledger.push({month:s.month,label:'借入',amount});
 finishRescue(s);return {};
}
function repayAll(s){
 const amount=s.debts.reduce((n,d)=>n+d.balance,0);
 if(!canAct(s))return {error:'資金ショートを解決してから返済してください。'};
 if(amount<=0)return {error:'返済する借入はありません。'};
 if(availableCash(s)<amount)return {error:'納税資金を除いた使用可能な資金が足りません。'};
 s.cash-=amount;s.debts=[];s.totalRepaid=(s.totalRepaid??s.history.reduce((n,h)=>n+(h.repayment||0),0))+amount;
 s.ledger.push({month:s.month,label:'借入の一括繰上返済',kind:'loanPrepayment',amount:-amount});return {amount};
}
function grant(s){if(s.grantUsed)return {error:'再生支援金は利用済みです。'};if(s.status!=='rescue'||s.cash>=0)return {error:'再生支援金は資金ショート時だけ申請できます。'};s.grantUsed=true;s.cash+=C.grant;s.ledger.push({month:s.month,label:'再生支援金',amount:C.grant});finishRescue(s);return {};}

function repair(s,id){const b=s.buildings.find(b=>b.id===id);if(!canAct(s)||!b||!b.damage)return {error:'修理の必要がありません。'};const cost=repairCost(s,b);if(!charge(s,cost,'other','復旧修理'))return {error:'修理資金が足りません。'};b.damage=0;b.closed=0;s.recoveries++;s.milestones.push('recovery');return {};}
function specStats(b){const f=F(b.type),spec=f.specs[b.spec||0],level=b.level,v=C.balance;return {ticket:f.ticket*spec[1]*(1+(level-1)*(f.growth?.levelTicket??v.levelTicket)),capacity:f.capacity*(1+(level-1)*(f.growth?.levelCapacity??v.levelCapacity)),volume:spec[2]*(b.legacy?v.legacySales:1),loyalty:spec[3],pop:f.pop.map((p,i)=>p*spec[4][i]),appeal:(b.legacy?v.legacyAppeal:1)*(1+(level-1)*v.levelAppeal)};}
function terraceTarget(s,b){if(b.type!=='terrace')return null;const [x,y]=entranceCells(b)[0],a=at(s,x,y);return a&&C.terraceRules.types.includes(a.type)?a:null;}
function terraceBonus(s,b,net){if(!C.terraceRules.types.includes(b.type)||!s.buildings.some(a=>{if(a.type!=='terrace'||a.build||a.closed)return false;const target=terraceTarget(s,a);return target&&target.id===b.id;}))return 0;if(!operational(s,b,net||network(s)))return 0;const weather=root.KEvents?.climate(s).type;return C.terraceRules.badWeather.includes(weather)?C.terraceRules.badWeatherBonus:C.terraceRules.bonus;}
function shopStats(s,b,hasTower=towerActive(s)){const stats=specStats(b),effect=titleEffects(s);stats.capacity*=effect.shopCapacity;const item=communitySupportStatus(s).active;if(item&&(!item.types||item.types.includes(b.type)))stats.capacity*=item.capacity;if(['fishmonger','greengrocer','sushi'].includes(b.type))stats.ticket*=effect.freshTicket;if(['sports','sportcenter'].includes(b.type))stats.ticket*=effect.sportsTicket;if(s.storyVersion===2&&s.storyDone.includes('campaign-6')&&s.storyChoices.business==='food'&&C.terraceRules.types.includes(b.type))stats.ticket*=1.02;if(['bakery','cafe','diner'].includes(b.type)){stats.ticket*=effect.foodSales;stats.capacity*=effect.foodCapacity;}if(b.type==='kotsumaru')stats.ticket*=effect.kotsumaruTicket;if(b.type==='morunShop')stats.ticket*=effect.morunTicket;if(hasTower){stats.capacity*=C.towerRules.capacity;stats.ticket*=C.towerRules.ticket;}const terrace=terraceBonus(s,b);if(terrace){stats.capacity*=1+terrace;stats.terraceBonus=terrace;}return stats;}
function consecutiveProjects(s,id=s.project){if(!id)return 0;let n=0;for(let i=s.history.length-1;i>=0;i--){const h=s.history[i];if(h.month!==s.month-n-1||h.project!==id||h.allClosed)break;n++;}return n;}
function projectStrength(s,shops){
 if(!s.project)return 0;const p=C.projects[s.project];const relevant=shops.filter(b=>p.types.includes(b.type));
 if(p.space&&!root.KProgress?.hasSpace(s,s.project))return 0;
 const capacity=relevant.reduce((a,b)=>a+shopStats(s,b).capacity,0),fatigue=Math.max(.3,1-consecutiveProjects(s)*.23);
 const seasonal=p.season===season(s)?1.2:1;
 const net=network(s),stageFactor=s.buildings.some(b=>b.type==='eventStage'&&operational(s,b,net))?(C.eventStageRules.projectFactors[s.project]||1):1;
 return p.lift*Math.min(1,relevant.length/3)*Math.min(1,capacity/2500)*fatigue*seasonal*titleEffects(s).projectLift*stageFactor;
}
function showMerchandise(s,type,strength){const rule=C.showMerchandise[s.project],p=C.projects[s.project];if(!rule||!p?.types.includes(type)||!strength)return {ticket:1,capacity:1,demand:1,active:false};const power=Math.min(1,strength/p.lift),main=rule.main.includes(type),scale=n=>1+(n-1)*power;return {ticket:scale(main?rule.ticket:rule.partnerTicket),capacity:scale(main?rule.capacity:rule.partnerCapacity),demand:scale(main?rule.demand:rule.partnerDemand),active:true,main};}
function fairMerchandise(s,b,strength){const rule=C.fairMerchandise[s.project],p=C.projects[s.project];if(!rule||!p.types.includes(b.type)||!strength||(rule.minReputation&&(b.reputation||0)<rule.minReputation))return {ticket:1,capacity:1,active:false};const power=Math.min(1,strength/p.lift);return {ticket:1+(rule.ticket-1)*power,capacity:1+(rule.capacity-1)*power,active:true};}
function projectPreview(s,id){const beforeState={...s,project:null,projectSite:null,projectRules:null},before=forecast(beforeState),after=forecast({...beforeState,project:id}),reserved=s.project===id,cost=reserved&&s.spent.projects>0?s.spent.projects:projectCost(s,id);return {before,after,cost,reserved,extra:after.sales-before.sales,net:after.operating-before.operating-cost};}
function localCompetition(s,b,shops){
 const rule=C.localCompetition;
 if(!F(b.type).shop)return {neighbors:0,loss:0};
 const neighbors=shops.filter(a=>a.id!==b.id&&a.type===b.type&&distance(a,b)<=rule.radius).length;
 return {neighbors,loss:Math.min(rule.maxLoss,neighbors*rule.lossPerNeighbor)};
}
function congestionStatus(s){
 const baseline={...s,project:null,response:'save',events:{...s.events,active:null,securityIncident:null,weather:{month:s.month,type:'clear'},boom:null,mascotBreak:null,mascotMoment:null,congestion:{retention:s.events.congestion?.retention??1}}},f=forecast(baseline,true,true),u=services(baseline,network(baseline),null),r=C.congestionRules,shops=f.shops.filter(b=>b.op),lost=shops.reduce((n,b)=>n+b.lost,0),demand=shops.reduce((n,b)=>n+b.served+b.lost,0),weight=b=>{const row=f.shops.find(a=>a.id===b.id);return row?Math.max(1,row.served+row.lost):0;},totalWeight=f.shops.reduce((n,row)=>n+Math.max(1,row.served+row.lost),0)||1,visitors=f.total;
 const restNear=b=>u.active.some(a=>(a.type==='bench'||a.type==='plaza'||a.type==='grandpark'||a.type==='japaneseGarden')&&distance(a,b)<=(a.type==='grandpark'?5:a.type==='japaneseGarden'?2:3)),coverage=near=>s.buildings.filter(b=>F(b.type).shop).reduce((n,b)=>n+(near(b)?weight(b):0),0)/totalWeight;
 const capacity=(base,types)=>base+u.active.reduce((n,b)=>n+(types[b.type]||0),0),rest=r.restBase+(capacity(0,r.rest)*titleEffects(s).restCapacity),toilet=capacity(r.toiletBase,r.toilets),parking=capacity(r.parkingBase,r.parking),restCoverage=coverage(restNear),toiletCoverage=coverage(b=>u.near(b,'toilet',4)),storeCapacity=shops.reduce((n,row)=>{const b=s.buildings.find(b=>b.id===row.id);return n+Math.min(shopStats(baseline,b).capacity,row.served+row.lost);},0),requiredVisits=visitors*r.visitsPerVisitor,causes=[];
 if(visitors>=r.minVisitors){if(Math.max(lost,requiredVisits-storeCapacity)>=r.minLost&&storeCapacity<requiredVisits*r.capacityRatio)causes.push({id:'shops',name:'店舗の受入能力',hint:'混んでいる店舗を改装・増設し、飲食店には隣接するテラス席も検討してください。'});if(rest<visitors||restCoverage<r.minCoverage)causes.push({id:'rest',name:'休憩場所の数・配置',hint:'ベンチ・休憩所や公園、日本庭園を、混んでいるお店の近くに整備してください。'});if(toilet<visitors||toiletCoverage<r.minCoverage)causes.push({id:'toilet',name:'トイレの数・配置',hint:'公衆トイレを増やし、お店に届くよう配置してください。'});if(parking<visitors*r.carShare)causes.push({id:'parking',name:'駐車・駐輪スペース',hint:'道路につながる駐車場・駐輪場を増設してください。'});}
 const m=C.townMetricRules,ratio=(demand,capacity)=>demand/Math.max(1,capacity),pressures={shops:Math.max(lost,requiredVisits-storeCapacity)>=r.minLost?ratio(requiredVisits*r.capacityRatio,storeCapacity):0,rest:Math.max(ratio(visitors,rest),r.minCoverage/Math.max(.001,restCoverage)),toilet:Math.max(ratio(visitors,toilet),r.minCoverage/Math.max(.001,toiletCoverage)),parking:ratio(visitors*r.carShare,parking)},pressure=Math.max(...Object.values(pressures)),rawValue=visitors>=r.minVisitors?clamp(Math.floor((pressure-m.pressureOffset)*m.pressureScale+1e-8),0,100):0,value=causes.length?rawValue:Math.min(m.warning-1,rawValue),level=value>=m.severe?'severe':value>=m.crowded?'crowded':value>=m.warning?'warning':'normal';
 return {value,level,pressure,pressures,active:level==='severe',shortage:causes.length>0,causes,visitors,storeCapacity,requiredVisits,lost,lostRatio:lost/Math.max(1,demand),rest,toilet,parking,restCoverage,toiletCoverage};
}
function refreshCongestion(s){
 const check=congestionStatus(s),previous=s.events.congestion;
 if(!previous&&check.level==='normal')return false;
 const oldLevel=previous?.level||(previous?.active?'severe':'normal'),c=previous||{active:false,streak:0,lastMonth:-1};
 c.active=check.active;c.level=check.level;c.value=check.value;c.streak=0;s.events.congestion=c;
 delete c.visitorFloor;
 if(check.active&&oldLevel!=='severe'){c.startedMonth=s.month;s.milestones.push('congestion');if(!s.seenArt.includes('congestion'))s.seenArt.push('congestion');s.notices.push('大混雑が発生しました。お客さんを受け入れる店舗や施設の整備が必要です。');}
 if(['crowded','severe'].includes(oldLevel)&&check.value<C.townMetricRules.crowded){c.resolvedMonth=s.month;s.milestones.push('congestion-resolved');s.notices.push('混雑が解消しました。街の受け入れ態勢が整いました。');}
 else if(oldLevel==='severe'&&check.level==='crowded')s.notices.push('大混雑が緩和しました。引き続き受け入れ施設を整備してください。');
 return oldLevel!==check.level;
}
function settleCongestion(s,check,paused,securityLoss=0){
 if(paused||s.events.congestion?.lastMonth===s.month)return;
 if(!s.events.congestion&&check.level==='normal')return;
 const c=s.events.congestion||(s.events.congestion={active:false,streak:0,lastMonth:-1}),r=C.townMetricRules.demandRetention,previous=c.retention??1;
 c.retention=securityLoss>0?Math.max(r.minimum,previous*(1-securityLoss*r.lossPerPoint)):Math.min(1,previous+r.recovery);
 c.lastMonth=s.month;refreshCongestion(s);
}
function townMetrics(s){const congestion=congestionStatus(s),net=network(s),u=services(s,net,congestion),shops=s.buildings.filter(b=>F(b.type).shop&&operational(s,b,net)),security=shops.length?shops.reduce((n,b)=>n+u.securityValue(b),0)/shops.length:C.townMetricRules.securityBase;return {congestion:congestion.value,level:congestion.level,security:Math.round(security*10)/10};}
function townStateLabels(f){
 const r=C.townDisplayRules,ratio=f.receptionCapacity>0?f.total/f.receptionCapacity:0;
 const activity=f.total<=0?'quiet':f.congestionLevel==='severe'?'severe':f.congestionLevel==='crowded'?'crowded':ratio<r.quietRatio?'quiet':ratio<r.busyRatio?'normal':'busy';
 const security=f.securityValue<r.securityBad?'bad':f.securityValue>=r.securityGood?'good':'normal';
 return {activity,activityLabel:{quiet:'ガラガラ',normal:'標準',busy:'繁盛',crowded:'混雑',severe:'大混雑'}[activity],security,securityLabel:{bad:'悪い',normal:'標準',good:'良い'}[security]};
}
function forecast(s,withoutProject=false,withoutCongestion=false){
 const crowd=withoutCongestion?null:congestionStatus(s),net=network(s),u=services(withoutProject&&s.project?{...s,project:null}:s,net,crowd),shops=s.buildings.filter(b=>F(b.type).shop&&operational(s,b,net)),effects=titleEffects(s),entrance=entranceProfile(s),entryEffect=net.roads.has('0,4')?entrance:C.entrances.normal;
 const climate=(root.KEvents?.climate(s))||{weather:'晴れ',type:'clear',factor:1,cover:0};
 const hasTower=towerActive(s),hasStage=u.active.some(b=>b.type==='eventStage'),crowded=Boolean(crowd?.active);
 const strength=withoutProject?0:projectStrength(s,shops),p=strength?C.projects[s.project]:null;
 const visitors=[],satisfaction=[],unmet=[],rates=[],reasons=[];
 const specialty=shops.reduce((a,b)=>a+Math.min(2,Math.floor(b.reputation/6)),0);
 const industryCounts={};for(const b of shops)industryCounts[b.type]=(industryCounts[b.type]||0)+1;
 for(let seg=0;seg<4;seg++){
   // Repeated industries share their drawing power; renovation and earned loyalty still matter.
   const appeal=shops.reduce((a,b)=>{const count=industryCounts[b.type],share=Math.min(C.visitorGrowth.sameIndustryMax,1+C.visitorGrowth.sameIndustryExtra*Math.log2(count))/count;return a+C.balance.appealPerShop*share*specStats(b).pop[seg]*specStats(b).appeal*(1+b.fans*.25+Math.min(.28,b.reputation*.012));},0);
   const diverse=new Set(shops.map(b=>b.type)).size;
   const local=shops.length?shops.reduce((a,b)=>a+(u.near(b,'bench',3)?6:0)+(u.near(b,'toilet',4)?7:0)+u.security(b)*9,0)/shops.length:0;
   const safety=shops.length?shops.reduce((a,b)=>a+u.security(b),0)/shops.length:0;
   const toiletCoverage=shops.length?shops.filter(b=>u.near(b,'toilet',4)).length/shops.length:0;
   const bathCoverage=shops.length?shops.filter(b=>u.near(b,'bathhouse',C.bathRules.radius)).length/shops.length:0;
   let sat=clamp(43+(hasTower?C.towerRules.satisfaction:0)+(mascotActive(s)?C.mascotRules.satisfaction:0)+(climate.type==='sunny'?C.monthlyEvents.sunny.satisfaction:0)+diverse*2+local+u.plaza*60+specialty*1.5+(seg>=2?toiletCoverage*4:0)+effects.satisfaction+(seg===2?effects.seniorSatisfaction+bathCoverage*C.bathRules.seniorSatisfaction:0),20,95);
   sat=clamp(sat+castleEffects(s,net).satisfaction,20,95);
   if(crowded)sat=clamp(sat-C.congestionRules.satisfaction,20,95);
   const moment=mascotMoment(s);if(seg===3&&moment?.childSatisfaction)sat=clamp(sat+moment.childSatisfaction,20,95);
   const boom=s.events.boom;
   const boomRule=C.booms[boom?.type],boomLift=boomRule&&(boomRule.types===null||shops.some(b=>boomMatches(boom,b.type)))?(boom.lift??boomRule.lift):0;
   const localAttraction=shops.length?shops.reduce((sum,b)=>sum+u.attraction(b,seg),0)/shops.length:0;
   let rate=C.balance.baseVisitRate+appeal+u.access+u.plaza+Math.min(.08,diverse*.008)+boomLift+localAttraction;
   if(p)rate+=strength*p.target[seg];
   rate+=root.KTenants?.lift(s,seg)||0;
   const rainCover=shops.length?shops.filter(b=>u.near(b,'arcade',4)).length/shops.length:0;
   const weather=1-(1-climate.factor)*(1-rainCover*(climate.cover??.8))*(climate.type==='rain'?effects.rainLoss:1);
   let competition=1;const event=s.events.active;
   if(event?.kind==='rival'){
     const r=C.rivals[event.type],loyal=shops.length?shops.reduce((a,b)=>a+b.fans,0)/shops.length:0;
     let impact=Math.min(C.monthlyEvents.rivalMaxImpact,r.impact[seg]*(event.intensity||1))*(1-Math.min(C.monthlyEvents.rivalLoyaltyLimit,loyal*.32+specialty*.045));
     if(s.response==='price')impact*=.35;
     if(s.response==='pr')impact*=Math.max(.25,.8-specialty*.065);
     if(s.response==='access')impact*=.68-u.access*.7;
     if(s.response==='different'&&r.impact[seg]<.23)rate+=.12;
     competition=1-impact;
   }
   const security=.86+safety*.14;
rate=Math.max(0,rate*(s.events.congestion?.retention??1)*weather*competition*security*(.8+sat/150)*effects.visitRate*(hasTower?C.towerRules.visitRate:1)*(hasStage?C.eventStageRules.visitFactor:1)*(mascotBreakActive(s)?C.mascotBreakRules.visitFactor:1)*(mascotActive(s)?C.mascotRules.visitFactor:1)*C.visitorGrowth.rateScale);
   if(crowded)rate*=C.congestionRules.visitFactor;
   if(s.events.securityIncident?.at===s.month&&s.events.securityIncident.left>0)rate*=C.securityIncidentRules.visitFactor;
   if(s.storyVersion===2)rate*=root.KStory.openingVisitFactor(s);
   rate*=entryEffect.visit||1;
   rate*=moment?.visitFactors?.[seg]??moment?.visitFactor??1;
   const cap=segmentCaps(s)[seg],count=climate.type==='typhoon'?0:Math.min(cap,Math.round(cap*(1-Math.exp(-rate))));
   visitors.push(count);satisfaction.push(Math.round(sat));unmet.push(Math.round((1-count/cap)*100));rates.push(rate);
 }
 const total=visitors.reduce((a,b)=>a+b,0),revenues=[];let totalVisits=0;
 const capacityRules=C.congestionRules,publicCapacity=(base,types)=>base+u.active.reduce((n,b)=>n+(types[b.type]||0),0),receptionCapacity=Math.min(shops.reduce((n,b)=>n+shopStats(s,b,hasTower).capacity*showMerchandise(s,b.type,strength).capacity*fairMerchandise(s,b,strength).capacity,0)/(capacityRules.visitsPerVisitor*capacityRules.capacityRatio),capacityRules.restBase+publicCapacity(0,capacityRules.rest)*effects.restCapacity,publicCapacity(capacityRules.toiletBase,capacityRules.toilets),publicCapacity(capacityRules.parkingBase,capacityRules.parking)/capacityRules.carShare);
 const quiet=townStateLabels({total,receptionCapacity,congestionLevel:crowd?.level||'normal',securityValue:C.townMetricRules.securityBase}).activity==='quiet';
 const kinds=new Set(shops.map(b=>b.type));
 for(const b of s.buildings.filter(b=>F(b.type).shop)){
   const f=F(b.type),op=operational(s,b,net),st=shopStats(s,b,hasTower),same=shops.filter(a=>a.type===b.type),notes=[],show=showMerchandise(s,b.type,strength),fair=fairMerchandise(s,b,strength);
   if(op&&show.active){st.capacity*=show.capacity;notes.push(C.projects[s.project].name+'：限定商品で客単価＋'+Math.round((show.ticket-1)*100)+'％・臨時販売で受入能力＋'+Math.round((show.capacity-1)*100)+'％（当月限定）');}
   if(op&&fair.active){st.capacity*=fair.capacity;notes.push(C.projects[s.project].name+'：特集商品で客単価＋'+Math.round((fair.ticket-1)*1000)/10+'％・臨時販売で受入能力＋'+Math.round((fair.capacity-1)*100)+'％（当月限定）');}
   if(st.terraceBonus)notes.push('隣接するテラス席：受入能力＋'+Math.round(st.terraceBonus*100)+'％（重複なし）');
   if(crowded)notes.push('大混雑：満足度−6・来店率−5％。不足している受入施設を整備してください。');
   if(op&&u.projectLoad)notes.push('企画開催で見守りの負担が増えています。交番などで治安への影響を軽減できます。');
   if(hasStage)notes.push('イベントステージ：街全体の来店率＋3％'+(s.project==='summer'?'・夏祭りの企画集客効果＋15％':''));
   if(hasTower)notes.push('シンボルタワー：受入能力＋30％・客単価＋5％・街全体の来店率＋15％・満足度＋5（上限95）');
   if(effects.ids.includes('food')&&['bakery','cafe','diner'].includes(b.type))notes.push('称号「食べ歩きの街」：客単価＋3%');
   if(effects.ids.includes('steady'))notes.push('称号「こつこつ黒字経営」：固定維持費−3%');
   if(b.build)notes.push(`工事中（あと${b.build}か月）`);else if(b.closed)notes.push(`被災休業（あと${b.closed}か月）`);else if(!net.connected(b))notes.push(b.rotation!==undefined?'道路未接続：入口側に道路をつなぐか、向きを変更してください':'道路未接続');
   if(climate.type==='typhoon')notes.push('台風：今月は全店舗休業。維持費は発生します');
   if(b.legacy)notes.push('老朽化：魅力が低い');
   const landmarks=[...new Set(u.attractions(b).map(a=>a.type))];if(landmarks.length)notes.push('周辺施設の集客：'+landmarks.map(type=>F(type).name).join('・')+'（同種の重複加算なし）');
   if(op&&u.attractions(b).some(a=>u.flowerbedLinked(a)))notes.push('公園と花壇の連携：花壇の集客効果が向上');
   if(same.length>1)notes.push(`同業${same.length}店で需要を分配`);
   const guard=u.protection(b),noise=u.nuisance(b);if(guard===0)notes.push('治安面の不安で一部の客が来店を控えています');else{const names=[...new Set(u.active.filter(a=>F(a.type).security&&distance(a,b)<=F(a.type).security.radius&&F(a.type).security.strength===guard).map(a=>a.type==='convenience'?'コンビニの24時間の明かり':F(a.type).name+'の見守り'))];notes.push(names.join('・')+'で治安を改善');}
   if(noise>0)notes.push(guard===1?'交番が周辺の娯楽施設の混雑・騒音による治安低下を抑えています':guard>0?'周辺の娯楽施設の混雑・騒音で治安が少し低下（見守りで軽減）':'周辺の娯楽施設の混雑・騒音で治安が少し低下：交番・コンビニを検討');
   let demand=0;
   if(op)for(let seg=0;seg<4;seg++){
     const own=st.pop[seg]*st.appeal*(1+b.fans*.3),all=same.reduce((a,t)=>a+specStats(t).pop[seg]*specStats(t).appeal*(1+t.fans*.3),0);
     demand+=visitors[seg]*C.propensity[b.type]*Math.min(1.25,st.pop[seg])*(own/(all||1))*st.volume*(1+u.attraction(b,seg));
   }
   if(op&&show.active)demand*=show.demand;
   const synergyPartner={flower:'cafe',cafe:'flower',diner:'market',market:'diner',toy:'sports'}[b.type],synergy=Boolean(op&&synergyPartner&&kinds.has(synergyPartner));
   if(synergy){demand*=C.balance.synergy;notes.push('店舗連携：'+F(synergyPartner).name+'と連携し、この店の入店需要＋8％（受入上限内・距離不問・重複なし）');}
   let ticket=st.ticket*(s.response==='price'?.9:1)*(op?show.ticket*fair.ticket:1);
   if(op&&entryEffect.types){const target=entryEffect.types.includes(b.type),factor=target?entryEffect.demand:1;demand*=factor;ticket*=target?entryEffect.targetTicket:entryEffect.otherTicket;notes.push(entryEffect.name+'：'+(target?'入店需要＋'+Math.round((factor-1)*100)+'％（受入上限あり）・客単価＋'+Math.round((entryEffect.targetTicket-1)*100)+'％':'客単価−1％'));}
   if(op&&entryEffect.ticket){ticket*=entryEffect.ticket;notes.push(entryEffect.name+'：客単価＋3％・街全体の来店率−3％');}
   const freshPartners=op?Object.entries(C.freshFoodRules.partners).filter(([type,bonuses])=>bonuses[b.type]&&shops.some(a=>a.type===type&&distance(a,b)<=C.freshFoodRules.radius)):[],freshBonus=freshPartners.reduce((sum,[,bonuses])=>sum+bonuses[b.type],0);
   if(freshBonus){ticket*=1+freshBonus;notes.push('地元の仕入れ連携：'+freshPartners.map(([type])=>F(type).name).join('・')+'で客単価＋'+Math.round(freshBonus*100)+'％（周辺3マス・同種の重複なし）');}
   const sushiPartners=op&&b.type==='sushi'?Object.entries(C.sushiRules.partners).filter(([type])=>s.buildings.some(a=>a.type===type&&operational(s,a,net)&&distance(a,b)<=C.sushiRules.radius)):[],sushiBonus=sushiPartners.reduce((sum,[,bonus])=>sum+bonus,0);
   if(sushiBonus){ticket*=1+sushiBonus;notes.push('寿司屋の連携：'+sushiPartners.map(([type])=>F(type).name).join('・')+'で客単価＋'+Math.round(sushiBonus*100)+'％（周辺3マス・同種の重複なし）');}
   if(b.type==='kotsumaru'&&effects.ids.includes('kotsumaruFan'))notes.push('称号「こつまる大好き」：客単価＋5%');
   if(b.type==='morunShop'&&effects.ids.includes('morunFan'))notes.push('称号「モールンLOVE」：客単価＋5%');
   const moment=mascotMoment(s);
   if(op&&moment?.shopTicket&&s.events.mascotMoment.shopIds.includes(b.id)){ticket*=moment.shopTicket;notes.push('こつまるのお手伝い：買上額＋5％');}
   if(op&&moment?.goodsDemand&&['kotsumaru','morunShop'].includes(b.type)){demand*=moment.goodsDemand;notes.push('こつまるとモールンの共演：商品需要＋12％（受入上限あり）');}
   if(['flower','cafe'].includes(b.type)){ticket*=effects.flowersCoffeeSales;if(effects.ids.includes('flowersCoffee'))notes.push('称号「花と珈琲の街」：売上＋2%');}
   if(['gamecenter','karaoke'].includes(b.type)){ticket*=effects.leisureSales;if(effects.ids.includes('nightlife'))notes.push('称号「夜までにぎわう街」：売上＋3%・周辺治安が少し低下');}
   if(effects.ids.includes('prudent'))notes.push('称号「堅実な街づくり」：道路・公共施設の維持費−5%');
   const sportsPartner=b.type==='sports'?'sportcenter':b.type==='sportcenter'?'sports':null;
   const nearbySynergy=op&&sportsPartner&&shops.some(a=>a.type===sportsPartner&&distance(a,b)<=C.leisureRules.synergyRadius);
   if(nearbySynergy){ticket*=C.leisureRules.synergySales;notes.push('近隣連携：'+F(sportsPartner).name+'と連携し、この店の客単価＋12％（周辺3マス・重複なし）');}
   const bathNearby=op&&u.near(b,'bathhouse',C.bathRules.radius),bathSynergy=bathNearby&&C.bathRules.partners.includes(b.type);
   if(bathNearby)notes.push('近隣の湯処：高齢者の満足度を支える（周辺3マス・重複なし）');
   if(bathSynergy){ticket*=C.bathRules.partnerSales;notes.push('湯上がりの立ち寄り：日帰り温泉・銭湯で、この店の客単価＋5％（周辺3マス・重複なし）');}
   if(mascotBreakActive(s)&&b.type==='kotsumaru'){demand*=C.mascotBreakRules.goodsDemand;notes.push('こつまるブレイク↗︎：商品需要＋30％（受入上限あり）');}
   const morunPromotion=op&&b.type==='morunShop'&&['morun','morunBreak'].includes(s.events.active?.type);
   if(morunPromotion){const hit=s.events.active.type==='morunBreak',rule=C.morunShopRules;demand*=hit?rule.breakDemand:rule.demand;ticket*=hit?rule.breakTicket:rule.ticket;notes.push(C.rivals[s.events.active.type].name+'：グッズが人気です');}
   if(boomMatches(s.events.boom,b.type))demand*=C.booms[s.events.boom.type].demand;
   if(op&&root.KEvents?.disasterType(s.events.next)==='typhoon'&&C.monthlyEvents.supplies.types.includes(b.type)){demand*=C.monthlyEvents.supplies.volume;ticket*=C.monthlyEvents.supplies.basket;notes.push('台風への備え：需要＋12%・まとめ買いの買上額＋4%（受入上限内）');}
   if(s.events.active?.kind==='rival'&&!morunPromotion){const loss=C.monthlyEvents.rivalBasketLoss*(s.events.active.intensity||1);ticket*=1-loss;notes.push('競争による買い控え：買上額−'+Math.round(loss*100)+'%');}
   const rivalry=s.events.active?.kind==='rival'?s.events.active:null,loyaltyGuard=Math.min(C.monthlyEvents.rivalLoyaltyLimit,b.fans*.25+Math.min(.2,b.reputation*.008));
   const diverted=rivalry&&!morunPromotion?Math.min(.35,C.monthlyEvents.rivalDiversion*(rivalry.intensity||1))*(1-loyaltyGuard)*(s.response==='price'?.6:s.response==='pr'?.75:1):0;
   const crowding=op?localCompetition(s,b,shops):{neighbors:0,loss:0};
   if(crowding.loss)notes.push('近隣同業の競合：周辺'+C.localCompetition.radius+'マスに営業中の同業店'+crowding.neighbors+'店。客の奪い合いにより売上−'+Math.round(crowding.loss*100)+'%（最大'+Math.round(C.localCompetition.maxLoss*100)+'%・維持費は変わりません）');
   const tenantLoss=op?(root.KTenants?.competition(s,b)||0):0;if(tenantLoss)notes.push('誘致店との競合：周辺3マスの同業店への来店需要−'+Math.round(tenantLoss*100)+'%（維持費は変わりません）');
   const tenantDemand=demand*(1-tenantLoss),served=Math.floor(Math.min(tenantDemand,st.capacity)*(1-diverted)*(1-crowding.loss)),lost=Math.max(0,Math.round(tenantDemand-st.capacity));
   if(diverted>0)notes.push('大型施設への買い回り流出：入店機会−'+Math.round(diverted*100)+'%（固定客・名物・対抗策で軽減）');
   if(lost>0)notes.push(`受入上限：${lost}回の入店を取りこぼし`);
   if(op&&demand<st.capacity*.35)notes.push('需要不足：客層の開拓・企画・改装を検討');
   const sales=op?Math.round(served*ticket):0,baseStock=Math.round(sales*f.stock),lossRule=C.stockLossRules,lossRate=quiet&&op&&!lossRule.exemptTypes.includes(b.type)?(lossRule.freshTypes.includes(b.type)?lossRule.freshRate:lossRule.rate):0,stockLoss=Math.round(baseStock*lossRate),stock=baseStock+stockLoss,fixed=b.build?0:Math.round(f.fixed*(1+(b.level-1)*C.balance.levelFixed)*effects.storeFixed),royalty=b.type==='morunShop'?Math.round(sales*C.morunShopRules.royalty):0,profit=sales-stock-fixed-royalty;
   if(stockLoss>0)notes.push('ガラガラ：売れ残りによる仕入れロスが増えています。');
   revenues.push({id:b.id,type:b.type,localCompetition:crowding,sales,stock,stockLoss,fixed,royalty,profit,capacity:st.capacity,showPromotion:show.active&&op,fairPromotion:fair.active&&op,served:op?served:0,lost,notes,synergy:Boolean(synergy||nearbySynergy||bathSynergy||freshBonus||sushiBonus),freshBonus,sushiBonus,terraceBonus:st.terraceBonus||0,bathSynergy:Boolean(bathSynergy),nearbySynergy:Boolean(nearbySynergy),connected:net.connected(b),op});totalVisits+=op?served:0;
 }
 const restBusinessSaving=s.buildings.reduce((n,b)=>n+restMaintenanceSaving(s,b,net),0);
 const entranceMaintenance=entrance.fixed,publicBase=s.buildings.filter(b=>!F(b.type).shop&&b.type!=='vacant'&&!b.build).reduce((a,b)=>a+F(b.type).fixed,0)-restBusinessSaving,publicTitleSaving=Math.round(publicBase*(1-effects.publicFixed)),publicCost=publicBase-publicTitleSaving+entranceMaintenance;
 const sales=revenues.reduce((a,b)=>a+b.sales,0),stock=revenues.reduce((a,b)=>a+b.stock,0),fixed=revenues.reduce((a,b)=>a+b.fixed,0);
 const stallSales=p?.stall?Math.round(total*strength*170):0,stallStock=Math.round(stallSales*.6);
 const tenantRent=root.KTenants?.rent(s)||0;
 const royalty=revenues.reduce((sum,b)=>sum+b.royalty,0);
 const operating=sales+stallSales+tenantRent-stock-stallStock-fixed-publicCost-C.administration-royalty;
 return {entrance: s.entrance||'normal',entranceMaintenance,restBusinessSaving,publicTitleSaving,stockLoss:revenues.reduce((n,b)=>n+b.stockLoss,0),receptionCapacity,securityLoss:shops.length?shops.reduce((n,b)=>n+Math.max(0,u.baseSecurity(b)-u.security(b))*C.townMetricRules.securityScale,0)/shops.length:0,securityValue:Math.round((shops.length?shops.reduce((n,b)=>n+u.securityValue(b),0)/shops.length:C.townMetricRules.securityBase)*10)/10,congestionValue:crowd?.value||0,congestionLevel:crowd?.level||'normal',congested:crowded,tenantRent,royalty,segmentCaps:segmentCaps(s),visitors,total,satisfaction,unmet,rates,shops:revenues,sales:sales+stallSales,stock:stock+stallStock,fixed,publicCost,administration:C.administration,operating,totalVisits,projectStrength:strength,weather:climate.weather,weatherType:climate.type,allClosed:climate.type==='typhoon',stallSales};
}
function advance(s){
 if(mascotActive(s))return {error:"体験版はここまでです。続きは製品版でお楽しみください。"};
 if(root.KStory?.enforceDeadline(s))return {};
 if(s.month>=turnLimit(s))return {error:(s.storyVersion===2?C.futureEnding.years:modeInfo(s).years)+'年間の経営は終了しました。結果を確認して、次の街を始めてください。'};
 if(s.status!=='playing'||s.cash<0)return {error:s.status==='ending'?'最終結果を確認して、次の街を始めてください。':'先に資金ショートを解決してください。'};
 if(s.project&&s.projectRules===1&&root.KProgress&&!root.KEvents?.isTyphoon(s)&&!root.KProgress.conditions(s,s.project).ok)return {error:'今月の企画の開催条件を満たしていません。必要設備を確認してください。'};
 const monthStart=clone(s.startSnapshot||snapshot(s)),earnedBefore=profitHistory(s);
 s.notices=[];s.milestones=[];refreshCongestion(s);const crowdCheck=congestionStatus(s);
 const base=s.project?forecast(s,true):null,result=forecast(s),before=s.cash;
 s.cash+=result.operating;
 result.kotsumaruBreak=mascotBreakActive(s);
 if(mascotMoment(s))result.mascotMoment=clone(s.events.mascotMoment);
 if(root.KEvents)s.events.kotsumaruSalesTotal=result.kotsumaruBreak?0:root.KEvents.kotsumaruSalesTotal(s)+result.shops.filter(b=>b.type==='kotsumaru').reduce((sum,b)=>sum+b.sales,0);
 if(root.KEvents)s.events.morunRoyaltyTotal=s.events.active?.type==='morunBreak'?0:root.KEvents.morunRoyaltyTotal(s)+(result.royalty||0);
 let repayment=0,interest=0;
 for(const d of s.debts){const paid=Math.min(d.balance,d.installment),fee=Math.round(d.balance*C.loanRate);d.balance-=paid;d.left--;repayment+=paid;interest+=fee;}
 s.debts=s.debts.filter(d=>d.balance>0);s.cash-=repayment+interest;
 s.totalRepaid=(s.totalRepaid??s.history.reduce((a,h)=>a+(h.repayment||0),0))+repayment;
 let incident=0;if(root.KEvents)incident=root.KEvents.resolve(s,result,{rng,services,network,operational});
 s.cash+= (result.shrineGift||0)-incident;
 const paidProjectCost=s.project?(s.spent.projects>0?s.spent.projects:projectCost(s,s.project)):0;
 result.communitySupportCost=s.ledger.filter(l=>l.label?.startsWith('地域応援：')).reduce((n,l)=>n-l.amount,0);result.communitySupportItem=communitySupportStatus(s).active?.id||null;
 result.castleFestival=!!(s.castle?.festivalMonth===s.month);result.project=s.project;result.projectCost=paidProjectCost;result.projectExtra=base?result.sales-base.sales:0;result.projectNet=base?result.operating-base.operating-paidProjectCost:0;
 const projectArt=C.projects[s.project]?.art;if(projectArt&&!result.allClosed&&!s.seenArt.includes(projectArt))s.seenArt.push(projectArt);
 const prepaid=s.ledger.filter(l=>l.kind==='loanPrepayment').reduce((n,l)=>n-l.amount,0);
 result.repayment=repayment+prepaid;result.interest=interest;result.incident=incident;
 result.profit=result.operating+(result.shrineGift||0)-interest-incident-s.spent.projects-s.spent.other;
 result.cashFlow=result.operating+(result.shrineGift||0)-repayment-prepaid-interest-incident-s.spent.construction-s.spent.projects-s.spent.other;
 result.spent=clone(s.spent);result.month=s.month;result.rewards=0;
 settleTax(s,result);
 s.streak=result.profit>0?s.streak+1:0;s.maxStreak=Math.max(s.maxStreak,s.streak);s.peakVisitors=Math.max(s.peakVisitors,result.total);
 for(const b of s.buildings){const row=result.shops.find(r=>r.id===b.id);if(row?.op){b.fans=clamp(b.fans+C.balance.fanGrowth+F(b.type).specs[b.spec][3]-(row.lost>100?C.balance.fanCapacityPenalty:0),0,1);if(row.profit>0&&row.served>100)b.reputation+=1;}}
 if(s.project){s.repeatProject=consecutiveProjects(s);s.lastProject=s.project;if(s.project==='summer')s.milestones.push('summer');if(result.projectNet>0){s.milestones.push('fair');if(['summer','harvest'].includes(s.project))s.festivalWins++;}}
 if(s.project==='mascot'&&!s.mascot){s.mascot={debutMonth:s.month+1};s.milestones.push('mascot');s.notices.push('商店街マスコットが完成！愛称は「こつまる」に決まりました。来月から街を歩き、来店率＋3％・全客層の満足度＋1が継続します。');}
 if(result.project&&!result.allClosed)recordCatalogueUse(s,'projects',result.project);
 s.profitRecord={total:earnedBefore.total+result.profit,firstMonth:earnedBefore.firstMonth,throughMonth:s.month+1,complete:earnedBefore.complete};
 s.last=result;s.history.push(result);if(s.history.length>360)s.history.shift();
 if(root.KProgress)root.KProgress.resolve(s,result);
 result.financing=s.ledger.filter(l=>l.amount>0).reduce((a,l)=>a+l.amount,0);
 result.cashFlow+=result.rewards+result.financing;
 if(root.KTenants)root.KTenants.settle(s);
 // Construction and closures are updated AFTER this month's operations.
 for(const b of s.buildings){
   if(b.build>0){b.build--;if(!b.build){if(b.pendingLevel){b.level=b.pendingLevel;delete b.pendingLevel;}s.notices.push(F(b.type).name+'が完成。来月から営業します。');}}
   if(b.closed>0&&!b.justDamaged){b.closed--;if(!b.closed){b.damage=0;s.recoveries++;s.milestones.push('recovery');s.notices.push(F(b.type).name+'が復旧しました。');}}
   delete b.justDamaged;
 }
 settleCongestion(s,crowdCheck,result.allClosed,result.securityLoss);
 if(!s.stageShowsUnlocked&&s.buildings.some(b=>b.type==='eventStage'&&!b.build)){s.stageShowsUnlocked=true;s.notices.push('イベントステージの企画が選べるようになりました。');}
 if(s.events.mascotBreak){s.events.mascotBreak.left--;if(s.events.mascotBreak.left<=0)s.events.mascotBreak=null;}
 if(s.events.boom){s.events.boom.left--;if(s.events.boom.left<=0)s.events.boom=null;}
 s.project=null;s.projectSite=null;s.projectRules=null;s.response='save';s.responseChosen=false;s.prepared=Boolean(s.preparedFor&&s.events.next?.id===s.preparedFor);s.month++;s.spent={construction:0,projects:0,other:0};s.ledger=[];
 if(s.month<turnLimit(s)){
  if(root.KEvents)root.KEvents.begin(s,{rng});
  if(root.KTenants)root.KTenants.begin(s,{rng:root.KTenants.rng});
  if(s.storyVersion===2)root.KStory.beginMonth(s);
  castleBegin(s);
 }
 if(s.cash<0&&s.status!=='bankrupt'){s.status='rescue';s.retrySnapshot=monthStart;s.notices.unshift('資金ショート。売却・借入・再生支援金で立て直してください。');}
 if(s.storyVersion!==2&&s.month===turnLimit(s)&&!s.evaluated){s.evaluated=true;s.ending=evaluate(s);s.milestones.push('ending-'+s.ending.grade);if(s.status!=='rescue')s.status='ending';}
 if(s.storyVersion===2&&s.storyFailed)s.retrySnapshot=monthStart;
 if(s.storyVersion===2&&s.storyCompleteAt!==undefined&&!s.evaluated&&s.status!=='rescue'){s.evaluated=true;s.ending=root.KStory.evaluation(s);s.status='ending';}
 finishFuture(s);
 s.startSnapshot=snapshot(s);return {result};
}
function gradeForScore(score){return Object.keys(C.endings).find(grade=>score>=C.endingRules[grade])||'poor';}
function earlyClearBonus(month){return Math.max(0,C.earlyClearRules.months-month)*C.earlyClearRules.pointsPerMonth;}
// A running total survives the 360-month display-history limit. It includes losses and tax expense,
// but not initial cash, loans, grants, chapter rewards, sales of assets, or construction cash outlays.
function profitHistory(s,throughMonth=s.month){
 const p=s.profitRecord;if(p&&p.throughMonth===throughMonth)return {...p,complete:p.complete??p.firstMonth===0};
 const rows=s.history.filter(h=>h.month<throughMonth),firstMonth=rows[0]?.month??throughMonth;
 return {total:rows.reduce((n,h)=>n+h.profit,0),firstMonth,throughMonth,complete:rows.length===throughMonth&&rows.every((h,i)=>h.month===i)};
}
function scoreEvaluation(metrics,clearMonth){
 const rules=C.evaluationRules,mean=metrics.satisfaction.reduce((n,v)=>n+v,0)/C.segments.length;
 const points={profit:Math.round(metrics.cumulativeProfit/rules.profitYenPerPoint),visitors:Math.round(metrics.avgVisitors*rules.visitorPoints),satisfaction:Math.round(clamp(mean,0,100)*rules.satisfactionPoints),breadth:metrics.breadth*rules.breadthPoints,vacancy:-Math.round(metrics.vacancy*rules.vacancyPenalty)||0,debt:-Math.round(metrics.debt/rules.debtYenPerPoint)||0,grant:metrics.grantUsed?-rules.grantPenalty:0};
 const baseScore=Math.max(0,Object.values(points).reduce((n,v)=>n+v,0)),earlyBonus=clearMonth===undefined?0:earlyClearBonus(clearMonth),score=baseScore+earlyBonus,rawGrade=gradeForScore(score),grade=metrics.retrySupport&&rawGrade==='great'?'good':rawGrade;
 return {points,baseScore,earlyBonus,score,grade,title:C.endings[grade].title,evaluationVersion:rules.version,...(metrics.retrySupport?{retrySupport:true}:{})};
}
function evaluationBreadth(h){return C.segments.filter((_,i)=>h.length&&h.reduce((n,row)=>n+row.visitors[i]/(row.segmentCaps||C.segmentCaps)[i],0)/h.length>=C.evaluationRules.breadthShare).length;}
function normalizeEvaluation(r,clearMonth,s){
 if(!r||!Number.isSafeInteger(r.score)||r.score<0)return r;
 if(s?.retrySupport)r={...r,retrySupport:true};
 if(r.evaluationVersion===C.evaluationRules.version){const rawGrade=gradeForScore(r.score),grade=r.retrySupport&&rawGrade==='great'?'good':rawGrade;return {...r,grade,title:C.endings[grade].title};}
 const cutoff=r.clearMonth??clearMonth??(s?modeInfo(s).months:undefined),record=s&&profitHistory(s,cutoff);
 if(record?.complete&&Array.isArray(r.satisfaction)&&r.satisfaction.length===4){
  const h=s.history.filter(h=>h.month<cutoff).slice(-12),metrics={...r,cumulativeProfit:record.total,breadth:evaluationBreadth(h)};
  return {...metrics,cumulativeComplete:true,cumulativeSince:0,...scoreEvaluation(metrics,r.clearMonth??clearMonth)};
 }
 // A completed town with deleted old accounts retains its recorded result; never substitute
 // post-clear profits or invent lifetime earnings. The result screen explains the old rules.
 const oldBonus=r.earlyBonus??Math.min(r.score,Math.max(0,180-(r.clearMonth??clearMonth??180))*20);
 return {...r,baseScore:r.baseScore??r.score-oldBonus,earlyBonus:oldBonus,legacyEvaluation:true};
}
function evaluate(s){
 const h=s.history.slice(-12),avg=k=>Math.round(h.reduce((n,row)=>n+row[k],0)/(h.length||1)),debt=s.debts.reduce((n,d)=>n+d.balance,0),record=profitHistory(s);
 const occupied=s.buildings.filter(b=>F(b.type).shop).length,vacant=s.buildings.filter(b=>b.type==='vacant').length,vacancy=Math.round(vacant/Math.max(1,occupied+vacant)*100);
 const breadth=evaluationBreadth(h),annual=h.reduce((n,row)=>n+row.profit,0),avgVisitors=avg('total'),satisfaction=C.segments.map((_,i)=>Math.round(h.reduce((n,row)=>n+(row.satisfaction?.[i]||0),0)/(h.length||1)));
 const storyComplete=s.storyVersion===2?s.storyCompleteAt!==undefined:s.storyVersion!==1||C.chapters.every(c=>(s.storyDone||[]).includes(c.id));
 const metrics={cumulativeProfit:record.total,avgVisitors,satisfaction,breadth,vacancy,debt,grantUsed:s.grantUsed,...(s.retrySupport?{retrySupport:true}:{})};
 return {mode:s.mode||'standard',years:modeInfo(s).years,...metrics,...scoreEvaluation(metrics),annual,cumulativeComplete:record.complete,cumulativeSince:record.firstMonth,storyComplete,chapters:(s.storyDone||[]).length,goals:s.claimed.length,map:clone(s.buildings)};
}
function reassess(s){if(s.storyVersion===2){if(s.storyCompleteAt===undefined)return {error:'最終章を達成するとクリア評価を確認できます。'};return {};}if(s.month<turnLimit(s)||s.cash<0||s.status==='bankrupt')return {error:modeInfo(s).years+'年目の最終決算で評価します。'};s.evaluated=true;s.ending=s.ending||evaluate(s);s.status='ending';return {};}
function continueGame(s){if(s.storyVersion===2&&s.month>=C.futureEnding.months)return {error:'100年間の経営は終了しました。'};if(s.storyVersion===2&&s.storyCompleteAt!==undefined&&s.status==='ending'){s.status='playing';s.storyFreeplay=true;s.startSnapshot=snapshot(s);return {};}return {error:'この街の経営は終了しました。次の街を始めるときにモードを選んでください。'};}
function abandon(s){if(s.status!=='rescue')return {error:'資金ショート時のみ断念できます。'};s.status='bankrupt';return {};}
function retryMonth(s){if(!s.retrySnapshot)return {error:'再挑戦できる月初がありません。'};const restored=clone(s.retrySnapshot);restored.status='playing';restored.startSnapshot=snapshot(restored);return {state:restored};}
function validate(s,depth=0){
 if(depth>2)throw Error('保存データの入れ子が深すぎます。');
 if(!s||typeof s!=='object'||Array.isArray(s))throw Error('保存データの形式が違います。');
 if(s.tenYearReview!==undefined){const r=s.tenYearReview;if(!r||!Number.isSafeInteger(r.at)||r.at!==120||r.at>s.month||!Object.hasOwn(C.endings,r.grade)||!Number.isFinite(r.annual)||!Number.isSafeInteger(r.avgVisitors)||r.avgVisitors<0||!Number.isSafeInteger(r.score)||r.score<0)throw Error('10年目の評価記録が不正です。');}
 if(s.entrance!==undefined&&(typeof s.entrance!=='string'||!Object.hasOwn(C.entrances,s.entrance))||s.entranceChangedMonth!==undefined&&(!Number.isSafeInteger(s.entranceChangedMonth)||s.entranceChangedMonth<0||s.entranceChangedMonth>s.month))throw Error('入口の保存データが不正です。');
 if(s.catalogueUsage!==undefined){const usage=s.catalogueUsage;if(!usage||typeof usage!=='object'||Array.isArray(usage)||Object.keys(usage).some(k=>!['facilities','projects'].includes(k)))throw Error('使用回数の記録が不正です。');for(const[k,counts]of Object.entries(usage)){const definitions=k==='facilities'?C.facilities:C.projects;if(!counts||typeof counts!=='object'||Array.isArray(counts)||Object.entries(counts).some(([id,n])=>!Object.hasOwn(definitions,id)||!Number.isSafeInteger(n)||n<0))throw Error('使用回数の記録が不正です。');}}
 if(![1,2].includes(s.version))throw Error('対応していない保存バージョンです。');
 if(s.mode!==undefined&&!Object.hasOwn(C.modes,s.mode))throw Error('ゲームモードが不正です。');
 if(s.retrySupport!==undefined&&typeof s.retrySupport!=='boolean')throw Error('再挑戦支援の記録が不正です。');
 if(s.retrySupport&&(!s.legacy?.art?.includes('story-failure')||s.mode==='century'))throw Error('再挑戦支援スタートは未解放です。');
 if(s.mode==='century'&&(!Array.isArray(s.legacy?.clears)||s.legacy.clears.length===0))throw Error('100年商店街は街の再生達成以上で解放されます。');
 if(!Number.isSafeInteger(s.month)||s.month<0||s.month>12000||!Number.isFinite(s.cash)||Math.abs(s.cash)>1e13||(!Number.isInteger(s.size)||s.size<C.baseSize||s.size>C.postgameExpansion.maxSize||(s.size-C.baseSize)%2!==0)||!Array.isArray(s.buildings)||s.buildings.length>s.size*s.size)throw Error('年月・資金・土地データが不正です。');
 if(s.size>C.maxSize&&!(s.storyVersion===2&&s.storyCompleteAt!==undefined&&s.storyFreeplay&&s.month>=120&&!s.storyFailed&&s.ending?.grade==='great'))throw Error('追加区画の土地データが不正です。');
 for(const b of s.buildings)if(b&&b.rotation!==undefined&&(!Number.isInteger(b.rotation)||b.rotation<0||b.rotation>3))throw Error('施設の向きが不正です。');
 if(s.stageShowsUnlocked!==undefined&&typeof s.stageShowsUnlocked!=='boolean')throw Error('ステージ企画の記録が不正です。');
 delete s.expansionPatrolDemand;
 if(s.facilityLimitVersion===undefined)s.facilityLimitVersion=1;
 if(s.legacyFacilityLimits){delete s.legacyFacilityLimits.parking;delete s.legacyFacilityLimits.bicycle;}
 if(s.eventStageLimitVersion===undefined){s.eventStageLimitVersion=1;const count=s.buildings.filter(b=>b?.type==='eventStage').length;if(count>1){s.legacyFacilityLimits=s.legacyFacilityLimits||{};s.legacyFacilityLimits.eventStage=count;}}
 if(s.eventStageLimitVersion!==1||s.facilityLimitVersion!==1||s.legacyFacilityLimits!==undefined&&(!s.legacyFacilityLimits||Array.isArray(s.legacyFacilityLimits)||typeof s.legacyFacilityLimits!=='object'||Object.entries(s.legacyFacilityLimits).some(([type,count])=>!['parking','bicycle','eventStage'].includes(type)||!Number.isSafeInteger(count)||count<=C.facilities[type].maxInstances||count>s.size*s.size)))throw Error('施設上限の引き継ぎ記録が不正です。');
 for(const [type,f]of Object.entries(C.facilities))if(f.maxInstances&&s.buildings.filter(b=>b?.type===type).length>Math.max(f.maxInstances,s.legacyFacilityLimits?.[type]||0))throw Error(f.name+'の棟数制限を超えています。');
 if(s.mascot!==undefined&&(!s.mascot||!Number.isSafeInteger(s.mascot.debutMonth)||s.mascot.debutMonth<1||s.mascot.debutMonth>s.month))throw Error('マスコットの記録が不正です。');
 const used=new Set(),ids=new Set();for(const b of s.buildings){if(!b||!F(b.type)||!Number.isSafeInteger(b.id)||ids.has(b.id)||!Number.isInteger(b.x)||!Number.isInteger(b.y)||!Number.isInteger(b.level)||b.level<1||b.level>3||!Number.isInteger(b.build)||b.build<0||b.build>12||!Number.isInteger(b.closed)||b.closed<0||b.closed>12||!Number.isFinite(b.invested)||b.invested<0||!Number.isFinite(b.fans)||b.fans<0||b.fans>1||!Number.isFinite(b.reputation)||b.reputation<0)throw Error('施設データが不正です。');ids.add(b.id);for(const [x,y]of cells(b)){if(x<0||y<0||x>=s.size||y>=s.size||used.has(key(x,y)))throw Error('施設の重複や範囲外があります。');used.add(key(x,y));}if(F(b.type).shop&&(!Number.isInteger(b.spec)||b.spec<0||b.spec>2))throw Error('品ぞろえが不正です。');}
 if(!Array.isArray(s.debts)||s.debts.length>80||s.debts.some(d=>!Number.isFinite(d.balance)||d.balance<0||!Number.isFinite(d.installment)||d.installment<=0)||s.debts.reduce((a,d)=>a+d.balance,0)>C.loanCap+1)throw Error('借入データが不正です。');
 if(s.castle!==undefined){const c=s.castle,integer=(n,min=-100)=>Number.isSafeInteger(n)&&n>=min&&n<=s.month;if(!c||c.version!==1||!Number.isSafeInteger(c.buildingId)||c.buildingId<1||c.buildingId>=s.nextId||!integer(c.builtAt,0)||!integer(c.processedMonth,-1)||!integer(c.walkMonth,-1)||!integer(c.lastWalk)||!integer(c.lastGift)||!integer(c.festivalMonth,-1)||!Number.isSafeInteger(c.festivalYear)||c.festivalYear< -1||c.festivalYear>Math.floor(s.month/12)||!Number.isSafeInteger(c.giftCount)||c.giftCount<0||!Number.isInteger(c.giftCursor)||c.giftCursor<0||c.giftCursor>=C.castleRules.maxGifts||!Array.isArray(c.gifts)||c.gifts.length>C.castleRules.maxGifts||c.gifts.some(g=>!g||!Object.hasOwn(C.castleRules.gifts,g.kind)||!integer(g.at,0)))throw Error('天守こつまる城の記録が不正です。');}
 if(s.profitRecord!==undefined){const p=s.profitRecord;if(!p||!Number.isFinite(p.total)||Math.abs(p.total)>1e15||!Number.isSafeInteger(p.firstMonth)||p.firstMonth<0||!Number.isSafeInteger(p.throughMonth)||p.throughMonth<p.firstMonth||p.throughMonth>s.month||p.complete!==undefined&&typeof p.complete!=='boolean')throw Error('累計利益の記録が不正です。');}
 if(s.totalRepaid!==undefined&&(!Number.isFinite(s.totalRepaid)||s.totalRepaid<0))throw Error('返済実績が不正です。');
 if(s.communitySupport?.items&&Array.isArray(s.communitySupport.items))for(const i of s.communitySupport.items)if(i?.id==='yosegaki'&&Number.isSafeInteger(i.receivedMonth)&&i.expiresMonth===i.receivedMonth+12)i.expiresMonth=null;
 if(s.communitySupport!==undefined){const r=s.communitySupport,known=id=>typeof id==='string'&&Object.hasOwn(C.communitySupportItems,id);if(!r||r.version!==1||!Number.isSafeInteger(r.lastDecisionYear)||r.lastDecisionYear< -1||r.lastDecisionYear>Math.floor(s.month/12)||(r.choice!==null&&(!known(r.choice)||!C.communitySupportItems[r.choice].group))||!Array.isArray(r.items)||r.items.length>Object.keys(C.communitySupportItems).length||new Set(r.items.map(i=>i?.id)).size!==r.items.length||r.items.some(i=>!i||!known(i.id)||!Number.isSafeInteger(i.receivedMonth)||i.receivedMonth<0||i.receivedMonth>s.month||(!C.communitySupportItems[i.id].requestReward&&(i.receivedMonth%12!==C.communitySupportRules.month||Math.floor(i.receivedMonth/12)>r.lastDecisionYear))||(C.communitySupportItems[i.id].permanent?i.expiresMonth!==null:i.expiresMonth!==i.receivedMonth+C.communitySupportRules.duration))||(r.equipped!==null&&!r.items.some(i=>i.id===r.equipped)))throw Error('地域応援の記念品の保存が不正です。');}
 if(s.titleProgress!==undefined){const p=s.titleProgress,number=n=>Number.isFinite(n)&&n>=0&&n<=1e15,count=n=>Number.isSafeInteger(n)&&n>=0&&n<=12001;if(!p||p.version!==1||!Number.isSafeInteger(p.lastMonth)||p.lastMonth< -1||p.lastMonth>s.month||!p.sales||!['kotsumaru','morunShop'].every(id=>number(p.sales[id]))||!p.shows||!['kotsumaruShow','morunShow'].every(id=>count(p.shows[id]))||!Array.isArray(p.seasons)||p.seasons.length>4||new Set(p.seasons).size!==p.seasons.length||p.seasons.some(v=>!['春','夏','秋','冬'].includes(v))||!Array.isArray(p.castleYears)||p.castleYears.length>1001||new Set(p.castleYears).size!==p.castleYears.length||p.castleYears.some(y=>!Number.isSafeInteger(y)||y<0||y>Math.floor(s.month/12)))throw Error('称号実績の保存が不正です。');}
 if(s.tax){const t=s.tax;if(t.version!==1||!Number.isSafeInteger(t.startMonth)||t.startMonth<12||t.startMonth>12012||!Number.isSafeInteger(t.year)||t.year<1||t.year>1002||!Number.isFinite(t.annualProfit)||Math.abs(t.annualProfit)>1e13||!Number.isSafeInteger(t.accrued)||t.accrued<0||t.accrued>1e13||!Number.isSafeInteger(t.paidTotal)||t.paidTotal<0||t.paidTotal>1e13||!Array.isArray(t.pending)||t.pending.length>1001||new Set(t.pending.map(p=>p.year)).size!==t.pending.length||t.pending.some(p=>!Number.isSafeInteger(p.year)||p.year<2||p.year>=t.year||!Number.isSafeInteger(p.amount)||p.amount<=0||!Number.isFinite(p.profit)||p.amount!==Math.floor(Math.max(0,p.profit)*C.tax.rate))||(t.lastPaymentMonth!==null&&(!Number.isSafeInteger(t.lastPaymentMonth)||t.lastPaymentMonth<0||t.lastPaymentMonth>s.month||t.lastPaymentMonth%12!==C.tax.collectionMonth)))throw Error('納税データが不正です。');}
 if(!Array.isArray(s.claimed)||!Array.isArray(s.history)||s.history.length>360||!Number.isFinite(s.seed))throw Error('記録データが不正です。');
 if(s.focusQuest!==undefined&&s.focusQuest!==null&&(typeof s.focusQuest!=='string'||s.focusQuest.length>100))throw Error('注目する目標の保存が不正です。');
 if(s.carryTitles!==undefined&&(!Array.isArray(s.carryTitles)||s.carryTitles.length>Math.min(Object.keys(C.titles).length,(s.cycle||1)-1)||new Set(s.carryTitles).size!==s.carryTitles.length||s.carryTitles.some(id=>!Object.keys(C.titles).includes(id))))throw Error('持越し称号が不正です。');
 if(s.cycle!==undefined&&(!Number.isInteger(s.cycle)||s.cycle<1||s.cycle>1001||(s.carryTitles||[]).length>s.cycle-1))throw Error('周回データが不正です。');
 if(s.activeTitles!==undefined&&(!Array.isArray(s.activeTitles)||s.activeTitles.length>C.titleRules.maxActive||new Set(s.activeTitles).size!==s.activeTitles.length||s.activeTitles.some(id=>!availableTitles(s).includes(id))))throw Error('有効な称号の設定が不正です。');
 if(s.runId!==undefined&&(typeof s.runId!=='string'||s.runId.length>150||!s.runId))throw Error('街の記録IDが不正です。');
 if(s.legacy!==undefined&&(!s.legacy||typeof s.legacy!=='object'||!Array.isArray(s.legacy.clears)||s.legacy.clears.length>1000||s.legacy.clears.some(id=>typeof id!=='string'||!id||id.length>150)))throw Error('周回の保存が不正です。');
 if(s.restorationDone!==undefined&&(!Array.isArray(s.restorationDone)||s.restorationDone.length>4||s.restorationDone.some(id=>!C.legacyChapterIds.includes(id))||new Set(s.restorationDone).size!==s.restorationDone.length))throw Error('復興の節目の保存が不正です。');
 if(s.storyVersion!==undefined&&![1,2].includes(s.storyVersion))throw Error('物語の保存形式が不正です。');
 if(s.storyDone!==undefined&&(!Array.isArray(s.storyDone)||s.storyDone.length>(s.storyVersion===2?root.KStory.definitions:C.chapters).length||s.storyDone.some((id,i)=>id!==(s.storyVersion===2?root.KStory.definitions:C.chapters)[i].id)))throw Error('章の達成記録が不正です。');
 if(s.storyChapterSince!==undefined&&(!Number.isSafeInteger(s.storyChapterSince)||s.storyChapterSince<0||s.storyChapterSince>s.month+1))throw Error('章の開始年月が不正です。');
 if(s.storyUnlockedFacilities!==undefined&&(!Array.isArray(s.storyUnlockedFacilities)||s.storyUnlockedFacilities.length>Object.keys(C.facilities).length||s.storyUnlockedFacilities.some(id=>!F(id))))throw Error('施設の解放記録が不正です。');
 if(s.storyUnlockedProjects!==undefined&&(!Array.isArray(s.storyUnlockedProjects)||s.storyUnlockedProjects.length>Object.keys(C.projects).length||s.storyUnlockedProjects.some(id=>!C.projects[id])))throw Error('企画の解放記録が不正です。');
 if(s.requestVersion!==undefined&&(s.requestVersion!==1||!Number.isSafeInteger(s.requestPaid)||s.requestPaid<0||s.requestPaid>C.requestRules.totalRewardCap))throw Error('要望の協力金記録が不正です。');
 if(s.requestDeferred!==undefined&&(!s.requestDeferred||Array.isArray(s.requestDeferred)||typeof s.requestDeferred!=='object'||Object.entries(s.requestDeferred).some(([id,m])=>!C.requests.some(d=>d.id===id)||!Number.isSafeInteger(m)||m<0||m>12100)))throw Error('要望の再受付時期が不正です。');
 if(Array.isArray(s.requestsDone)&&(s.requestsDone.length>C.requests.length||new Set(s.requestsDone).size!==s.requestsDone.length||s.requestsDone.some(n=>typeof n!=='string'||n.length>150)))throw Error('要望の達成記録が不正です。');
 if(s.request){const r=s.request;if(typeof r.name!=='string'||!Number.isSafeInteger(r.reward)||r.reward<0||r.reward>250000||!Number.isSafeInteger(r.deadline)||r.deadline<0||r.deadline>12100||(r.id!==undefined&&!C.requests.some(d=>d.id===r.id))||(r.streak!==undefined&&(!Number.isInteger(r.streak)||r.streak<0||r.streak>12))||(r.issuedMonth!==undefined&&(!Number.isSafeInteger(r.issuedMonth)||r.issuedMonth<0||r.issuedMonth>s.month+1))||(r.lastCheckedMonth!==undefined&&(!Number.isSafeInteger(r.lastCheckedMonth)||r.lastCheckedMonth<0||r.lastCheckedMonth>s.month)))throw Error('受付中の要望が不正です。');}
 if(!s.events||typeof s.events!=='object'||!s.spent||!['construction','projects','other'].every(k=>Number.isFinite(s.spent[k])&&s.spent[k]>=0)||!Array.isArray(s.ledger)||!Array.isArray(s.notices)||!Array.isArray(s.seenArt)||!Array.isArray(s.milestones)||!Array.isArray(s.requestsDone)||!Number.isSafeInteger(s.nextId)||s.nextId<=Math.max(0,...ids))throw Error('経営データが不足しています。');
 if(s.events.shrineGiftSeed!==undefined&&(!Number.isSafeInteger(s.events.shrineGiftSeed)||s.events.shrineGiftSeed<0||s.events.shrineGiftSeed>4294967295)||s.events.lastShrineGiftMonth!==undefined&&(!Number.isSafeInteger(s.events.lastShrineGiftMonth)||s.events.lastShrineGiftMonth<0||s.events.lastShrineGiftMonth>s.month))throw Error('神様からの贈り物の記録が不正です。');
 const securityIncident=s.events.securityIncident;if(securityIncident!==undefined&&securityIncident!==null&&(!Number.isSafeInteger(securityIncident.at)||securityIncident.at<0||securityIncident.at>s.month||!Number.isInteger(securityIncident.left)||securityIncident.left<1||securityIncident.left>C.securityIncidentRules.duration||securityIncident.at+C.securityIncidentRules.duration-s.month!==securityIncident.left))throw Error('治安悪化イベントの記録が不正です。');
 if(s.events.securityIncidentSeed!==undefined&&(!Number.isSafeInteger(s.events.securityIncidentSeed)||s.events.securityIncidentSeed<0||s.events.securityIncidentSeed>4294967295)||s.events.lastSecurityIncidentMonth!==undefined&&(!Number.isSafeInteger(s.events.lastSecurityIncidentMonth)||s.events.lastSecurityIncidentMonth<0||s.events.lastSecurityIncidentMonth>s.month))throw Error('治安悪化イベントの抽選記録が不正です。');
 if(s.paidParkingUnlocked!==undefined&&typeof s.paidParkingUnlocked!=='boolean')throw Error('有料駐車場の解放記録が不正です。');
 if(s.paidBicycleUnlocked!==undefined&&typeof s.paidBicycleUnlocked!=='boolean')throw Error('有料駐輪場の解放記録が不正です。');
 const congestion=s.events.congestion;if(congestion!==undefined&&(!congestion||typeof congestion.active!=='boolean'||!Number.isInteger(congestion.streak)||congestion.streak<0||congestion.streak>C.congestionRules.months||!Number.isSafeInteger(congestion.lastMonth)||congestion.lastMonth< -1||congestion.lastMonth>s.month||(congestion.visitorFloor!==undefined&&(!Number.isSafeInteger(congestion.visitorFloor)||congestion.visitorFloor<0||congestion.visitorFloor>1000000))||['startedMonth','resolvedMonth'].some(k=>congestion[k]!==undefined&&(!Number.isSafeInteger(congestion[k])||congestion[k]<0||congestion[k]>s.month+1))))throw Error('大混雑の保存データが不正です。');
 if(congestion?.retention!==undefined&&(!Number.isFinite(congestion.retention)||congestion.retention<C.townMetricRules.demandRetention.minimum||congestion.retention>1))throw Error('客足の保存データが不正です。');
 if(congestion?.level!==undefined&&!['normal','warning','crowded','severe'].includes(congestion.level)||congestion?.value!==undefined&&(!Number.isInteger(congestion.value)||congestion.value<0||congestion.value>100))throw Error('混雑値の保存データが不正です。');
 if(s.events.lastDonationMonth!==undefined&&(!Number.isSafeInteger(s.events.lastDonationMonth)||s.events.lastDonationMonth<0||s.events.lastDonationMonth>s.month||s.events.lastDonationMonth%12!==C.donationRules.month))throw Error('寄付イベントの記録が不正です。');
 if(s.project&&!C.projects[s.project]||!C.responses[s.response])throw Error('企画データが不正です。');
 if(s.events.mascotBreak&&(!s.mascot||!Number.isInteger(s.events.mascotBreak.left)||s.events.mascotBreak.left<1||s.events.mascotBreak.left>C.mascotBreakRules.duration))throw Error('マスコット人気イベントの記録が不正です。');
 if(s.events.lastMascotBreakMonth!==undefined&&(!Number.isSafeInteger(s.events.lastMascotBreakMonth)||s.events.lastMascotBreakMonth<0||s.events.lastMascotBreakMonth>s.month))throw Error('マスコット人気イベントの年月が不正です。');
 const moment=s.events.mascotMoment;
 if(moment&&(!C.mascotMoments[moment.type]||!mascotActive(s)||moment.at!==s.month||(moment.type==='duet'&&!morunKnown(s))||(moment.type==='help'&&(!Array.isArray(moment.shopIds)||moment.shopIds.length<1||moment.shopIds.length>C.mascotMomentRules.maxHelpShops||new Set(moment.shopIds).size!==moment.shopIds.length||moment.shopIds.some(id=>!Number.isSafeInteger(id)||id<1||id>=s.nextId)))))throw Error('マスコットのお知らせが不正です。');
 if(s.events.mascotMomentSeed!==undefined&&(!Number.isSafeInteger(s.events.mascotMomentSeed)||s.events.mascotMomentSeed<0||s.events.mascotMomentSeed>4294967295))throw Error('マスコットのお知らせの抽選記録が不正です。');
 if(s.events.lastMascotMomentMonth!==undefined&&(!Number.isSafeInteger(s.events.lastMascotMomentMonth)||s.events.lastMascotMomentMonth<0||s.events.lastMascotMomentMonth>s.month))throw Error('マスコットのお知らせの年月が不正です。');
 if(s.events.mascotMomentHistory!==undefined&&(!s.events.mascotMomentHistory||Array.isArray(s.events.mascotMomentHistory)||typeof s.events.mascotMomentHistory!=='object'||Object.entries(s.events.mascotMomentHistory).some(([type,month])=>!C.mascotMoments[type]||!Number.isSafeInteger(month)||month<0||month>s.month)))throw Error('マスコットのお知らせの履歴が不正です。');
 if(s.events.boom&&(!C.booms[s.events.boom.type]||!Number.isInteger(s.events.boom.left)||s.events.boom.left<1||s.events.boom.left>12||(s.events.boom.lift!==undefined&&(!Number.isFinite(s.events.boom.lift)||s.events.boom.lift<0||s.events.boom.lift>.2))))throw Error('ブームデータが不正です。');
 for(const event of [s.events.active,s.events.next])if(event&&(!['rival','disaster'].includes(event.kind)||(event.kind==='rival'&&!C.rivals[event.type])))throw Error('イベントデータが不正です。');
 for(const event of [s.events.active,s.events.next])if(event&&((event.kind==='disaster'&&event.type!==undefined&&!['typhoon','flood'].includes(event.type))||(event.left!==undefined&&(!Number.isInteger(event.left)||event.left<1||event.left>(event.type==='morunBreak'?C.morunRules.breakDuration:2)))||(event.intensity!==undefined&&(!Number.isFinite(event.intensity)||event.intensity<.5||event.intensity>3))))throw Error('イベントの期間・強さが不正です。');
 for(const event of [s.events.active,s.events.next])if(['morun','morunBreak'].includes(event?.type)&&(!mascotActive(s)||event.left>(event.type==='morunBreak'?C.morunRules.breakDuration:C.morunRules.duration)||event.intensity!==C.morunRules.intensity))throw Error('モールンのイベント記録が不正です。');
 if(s.events.kotsumaruSalesTotal!==undefined&&(!Number.isSafeInteger(s.events.kotsumaruSalesTotal)||s.events.kotsumaruSalesTotal<0))throw Error('こつまる屋の売上記録が不正です。');
 if(s.events.morunRoyaltyTotal!==undefined&&(!Number.isSafeInteger(s.events.morunRoyaltyTotal)||s.events.morunRoyaltyTotal<0))throw Error('モールン屋の支払記録が不正です。');
 if(s.events.morunSeen!==undefined&&typeof s.events.morunSeen!=='boolean'||s.events.morunSeed!==undefined&&(!Number.isSafeInteger(s.events.morunSeed)||s.events.morunSeed<0||s.events.morunSeed>4294967295))throw Error('モールンの抽選記録が不正です。');
 if(s.events.weather&&(!['clear','rain','heat','snow','sunny'].includes(s.events.weather.type)||!Number.isSafeInteger(s.events.weather.month)||s.events.weather.month<0||s.events.weather.month>s.month))throw Error('天候の保存が不正です。');
 if(s.lastDisaster?.aidAmount!==undefined&&(!Number.isSafeInteger(s.lastDisaster.aidAmount)||s.lastDisaster.aidAmount<0||s.lastDisaster.aidAmount>C.eventRules.aid))throw Error('復旧支援の金額が不正です。');
 if(s.history.some(h=>!h||(h.segmentCaps!==undefined&&(!Array.isArray(h.segmentCaps)||h.segmentCaps.length!==4||h.segmentCaps.some((n,i)=>![C.segmentCaps,...C.historicalSegmentCaps].some(caps=>n===caps[i]||n===Math.round(caps[i]*C.titleRules.populationBoost)))))||!Array.isArray(h.visitors)||h.visitors.length!==4||h.visitors.some((n,i)=>!Number.isFinite(n)||n<0||n>(h.segmentCaps||C.segmentCaps)[i])||!Number.isFinite(h.profit)||!Number.isFinite(h.total)||!h.spent||!Array.isArray(h.shops)||h.shops.some(b=>!F(b.type))))throw Error('決算履歴が不正です。');
 if(!['playing','rescue','ending','bankrupt'].includes(s.status))throw Error('進行状態が不正です。');
 if(s.status==='ending'&&(!s.ending||!Object.hasOwn(C.endings,s.ending.grade)))throw Error('評価データが不正です。');
 if(s.storyVersion!==2&&s.month>=turnLimit(s)&&s.status==='playing'&&s.cash>=0){s.evaluated=true;s.ending=s.ending||evaluate(s);s.status='ending';}
 if(root.KTenants)root.KTenants.validate(s);
 const retired=s.buildings.filter(b=>F(b.type).retired);
 if(retired.length){const refund=retired.reduce((sum,b)=>sum+b.invested,0);s.buildings=s.buildings.filter(b=>!F(b.type).retired);s.cash+=refund;s.ledger.push({month:s.month,label:'有料駐車・駐輪場の廃止返金',amount:refund});s.notices.push('有料駐車場・有料駐輪場を廃止し、建設費'+refund.toLocaleString('ja-JP')+'円を返金しました。駐車場・駐輪場を増設できます。');finishRescue(s);}
 delete s.paidParkingUnlocked;delete s.paidBicycleUnlocked;
 if(root.KStory)root.KStory.validateOrMigrate(s);
 if(s.ending)s.ending=normalizeEvaluation(s.ending,s.storyCompleteAt,s);
 if(s.futureEndingAt!==undefined&&(s.futureEndingAt!==C.futureEnding.months||s.storyVersion!==2||s.month<C.futureEnding.months||s.storyCompleteAt===undefined||s.storyFailed||s.cash<0||s.status!=='ending'))throw Error('100年達成の記録が不正です。');
 finishFuture(s);
 if(s.startSnapshot)validate(s.startSnapshot,depth+1);if(s.retrySnapshot)validate(s.retrySnapshot,depth+1);
 s.version=C.version;return s;
}
// Lossless save encoding: monthly reports shared by month-start/retry snapshots are
// stored once. Shop rows share field names and repeated object values (notes etc.).
// Runtime state and the 360-month history remain unchanged; legacy JSON still loads.
function encodeHistory(state){
 const reports=[],schemas=[],values=[],reportIds=new Map(),schemaIds=new Map(),valueIds=new Map();
 const intern=(value,list,ids)=>{const text=JSON.stringify(value);if(ids.has(text))return ids.get(text);const id=list.length;ids.set(text,id);list.push(value);return id;};
 const reportId=report=>{const text=JSON.stringify(report);if(reportIds.has(text))return reportIds.get(text);const {shops,...rest}=JSON.parse(text);
  const rows=shops.map(row=>{const keys=Object.keys(row),schema=intern(keys,schemas,schemaIds);return [schema,keys.map(k=>{const v=row[k];return v!==null&&typeof v==='object'?[intern(v,values,valueIds)]:v;})];});
  const id=reports.length;reports.push({...rest,shops:rows});reportIds.set(text,id);return id;
 };
 const pack=(s,depth=0)=>{if(depth>2)throw Error('保存データの入れ子が深すぎます。');const out={...s,history:s.history.map(reportId)};if(s.startSnapshot)out.startSnapshot=pack(s.startSnapshot,depth+1);if(s.retrySnapshot)out.retrySnapshot=pack(s.retrySnapshot,depth+1);return out;};
 return {state:pack(state),historyEncoding:1,reports,schemas,values};
}
function decodeHistory(data){
 const bad=()=>{throw Error('決算履歴の保存データが不正です。');};
 const {reports,schemas,values}=data;
 if(data.historyEncoding!==1||!Array.isArray(reports)||reports.length>2520||!Array.isArray(schemas)||schemas.length>512||!Array.isArray(values)||values.length>2000000)bad();
 for(const keys of schemas)if(!Array.isArray(keys)||keys.length>256||new Set(keys).size!==keys.length||keys.some(k=>typeof k!=='string'||k.length>150))bad();
 const decodedSizes=[];let expandedBytes=0,valueBytes=0;const valueSizes=values.map(v=>JSON.stringify(v).length);
 const decoded=reports.map(report=>{if(!report||!Array.isArray(report.shops)||report.shops.length>C.postgameExpansion.maxSize**2)bad();return {...report,shops:report.shops.map(row=>{
  if(!Array.isArray(row)||row.length!==2||!Number.isSafeInteger(row[0])||!schemas[row[0]]||!Array.isArray(row[1])||row[1].length!==schemas[row[0]].length)bad();
  return Object.fromEntries(schemas[row[0]].map((k,i)=>{let v=row[1][i];if(Array.isArray(v)){if(v.length!==1||!Number.isSafeInteger(v[0])||v[0]<0||v[0]>=values.length)bad();valueBytes+=valueSizes[v[0]];if(valueBytes>128*1024*1024)bad();v=values[v[0]];}else if(v!==null&&typeof v==='object')bad();return [k,v];}));
 })};});
 for(const report of decoded)decodedSizes.push(JSON.stringify(report).length);
 const unpack=(s,depth=0)=>{if(depth>2||!s||!Array.isArray(s.history)||s.history.length>360)bad();const out={...s,history:s.history.map(id=>{if(!Number.isSafeInteger(id)||id<0||id>=decoded.length)bad();expandedBytes+=decodedSizes[id];if(expandedBytes>128*1024*1024)bad();return clone(decoded[id]);})};if(s.startSnapshot)out.startSnapshot=unpack(s.startSnapshot,depth+1);if(s.retrySnapshot)out.retrySnapshot=unpack(s.retrySnapshot,depth+1);return out;};
 return unpack(data.state);
}
function serialize(s){const base={format:'kotsukotsu-shotengai',version:C.version};return JSON.stringify(s.history.length>36?{...base,...encodeHistory(s)}:{...base,state:s});}
function readSave(text){const x=JSON.parse(text);if(!x||x.format!=='kotsukotsu-shotengai')throw Error('こつこつ商店街の保存ファイルではありません。');if(![1,2].includes(x.version))throw Error('対応していない保存形式です。');const state=x.historyEncoding===undefined?x.state:decodeHistory(x);return {state:validate(state),meta:x.meta};}
function deserialize(text){return readSave(text).state;}
const E={C,futureComplete,awardRequestSouvenir,communitySupportStatus,communitySupportError,supportCommunity,equipCommunityItem,restMaintenanceSaving,castleBuilding,castleWalkEntrance,castleEffects,castleBegin,castleFestivalError,castleFestival,postgameRewards,entranceProfile,entranceConditions,canChangeEntrance,changeEntrance,townStateLabels,townMetrics,catalogueCounts,edgeAdjacent,terraceTarget,terraceBonus,congestionStatus,refreshCongestion,isRoad,roadAccess,roadLinked,morunKnown,towerActive,towerConditions,mascotBreakActive,mascotActive,facilityMatches,finishRescue,modeInfo,turnLimit,taxState,taxReserve,availableCash,taxNotice,boomMatches,create,clone,clamp,rng,F,availableTitles,activeTitles,toggleTitle,titleEffects,segmentCaps,projectCost,showMerchandise,repairCost,shopStats,consecutiveProjects,fairMerchandise,projectPreview,rotation,footprint,toWorld,fromWorld,entranceCells,rotatable,canTurnBuilding,turnBuilding,at,cells,key,network,operational,services,distance,season,date,charge,construct,canBuild,isUnlocked,unlockHint,upgradeCost,upgrade,specialize,saleValue,isolatedByRemoval,remove,expansionInfo,expand,borrow,repayAll,grant,repair,specStats,projectStrength,localCompetition,forecast,advance,gradeForScore,earlyClearBonus,profitHistory,scoreEvaluation,normalizeEvaluation,evaluate,reassess,continueGame,abandon,retryMonth,serialize,deserialize,readSave,validate,snapshot,canAct};
root.KE=E;if(typeof module!=='undefined'&&typeof require==='function')require('./tenants.js');if(typeof module!=='undefined')module.exports=E;
})(typeof globalThis!=='undefined'?globalThis:this);
