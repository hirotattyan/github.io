(function(root){
'use strict';
const E=root.KE,C=E.C,P=root.KProgress;
const make=(number,name,description,duration,cashReward,facilities=[],projects=[])=>({id:'campaign-'+number,number,name,description,duration,cashReward,facilities,projects});
const definitions=[
 make(0,'もう一度、店に灯りを','古い店を改装し、店舗詳細と月の決算を確かめましょう。',6,300000),
 make(1,'シャッターの向こうへ','古い三店舗を整え、空き店舗に灯りを戻します。',16,1000000,['goods','clothes','salon','diy','hobby','sports','market','gamecenter','karaoke']),
 make(2,'この街らしさを探して','街の特色を選び、店同士の連携と企画で利益を育てます。',18,1500000,['plaza','grandpark','japaneseGarden','arcade','disaster']),
 make(3,'また来たくなる通り','休憩・トイレ・見守りを整え、にぎわいを支えます。',20,2000000,['kotsumaru'],['mascot']),
 make(4,'この街の顔になって','商店街のマスコットを生み出し、新しい街の魅力を育てます。',20,2000000,['eventStage'],C.stageProjects.slice()),
 make(5,'ライバルのいる街','大型商業施設との競争を乗り越え、舞台の催しを成功させます。',22,2500000,['sportcenter','circus','bathhouse']),
 make(6,'次の一歩に賭ける','大型事業を選び、投資と日々の資金繰りを両立させます。',24,3000000,['tower']),
 make(7,'この街が目的地になる','街の象徴を完成させ、四世代が訪れる目的地をつくります。',26,4000000,[],['anniversary','signatureWeek','thanks']),
 make(8,'こつこつ、その先へ','借入を清算し、再生記念祭で商店街の未来を祝います。',28,0)
];
const routes={
 food:{name:'食の街',types:['bakery','cafe','diner','fishmonger','greengrocer','sushi'],projects:['food','autumn','family','senior']},
 life:{name:'暮らしの街',types:['flower','cafe','goods','clothes','salon','diy','hobby','market'],projects:['women','men','newlife','senior','family']},
 family:{name:'親子の街',types:['bakery','diner','toy','gamecenter','hobby','sports'],projects:['family','food','summer','night']}
};
const businesses={food:{name:'食の名所づくり',effect:'飲食店の客単価＋2％',text:'飲食３業種・地元の仕入れ連携・テラス席を整える。'},rest:{name:'憩いの名所づくり',effect:'各客層の満足度＋1・ベンチ／小公園／大公園／日本庭園の維持費−25％（営業中・道路接続済みのみ）',text:'大公園または日本庭園を核に、休憩環境を整える。'},stage:{name:'催しの名所づくり',effect:'企画の集客効果＋5％',text:'イベントステージを使い、来街4,000人以上・月間黒字で舞台企画３種類を開催。'}};
C.facilities.tower.months=10;
const stageProjects=C.stageProjects.slice(),title=c=>c.number===0?'序章':c.number===8?'最終章':'第'+c.number+'章';
C.titles.reborn={name:'商店街の再建者',condition:'メインストーリーをすべて達成。',effect:'商店街の再生を成し遂げた証。',commemorative:true,bonus:{}};
C.titleRevealRules.reborn={projects:['anniversary']};
function progress(){return {lastMonth:-1,settlements:0,black:0,profit50:0,comfortable:0,mascotBlack:0,rivalBlack:0,destination:0,breadth:0,investment:0,fairs:[],stageFairs:[]};}
function initialize(s){s.storyVersion=2;s.storyOpening=s.month===0&&s.history.length===0;s.storyDone=[];s.storyChapterSince=s.month;s.storyProgress=progress();s.storyChoices={};s.storyEvents=[{kind:'start',id:definitions[0].id,at:s.month}];s.storyUnlockedFacilities=[];s.storyUnlockedProjects=[];delete s.storyCompleteAt;delete s.storyFailed;delete s.storyFreeplay;delete s.storyReviewed;delete s.postgameGiftsReceived;delete s.postgameExpansionNotified;delete s.postgameGardenNotified;delete s.storyBusinessPaid;}
// Only a fresh town starts with the mall's lost foot traffic. Renovation restores
// a first wave of customers; the following month uses ordinary demand again.
function openingVisitFactor(s){if(!s.storyOpening)return 1;if(!s.storyDone.includes('campaign-0'))return .5;return s.storyDone.length===1&&s.month===s.storyChapterSince ? .6 : 1;}
function migrate(s){
 if(s.storyVersion===2)return;
 const built=[...new Set(s.buildings.map(b=>b.type))],oldEnding=s.ending;s.previousStory={version:s.storyVersion||0,done:(s.storyDone||[]).slice()};
 initialize(s);s.storyUnlockedFacilities=built.filter(t=>!E.F(t).retired);s.mode='standard';
 if(oldEnding){s.previousEnding=oldEnding;s.ending=null;s.evaluated=false;if(s.status==='ending')s.status='playing';}
 s.notices.push('メインストーリーを更新しました。街と資金はそのままに、今月から序章を始めます。');
}
const index=s=>(s.storyDone||[]).length,current=s=>definitions[index(s)]||null;
const finalMonth=119;
function chapterDeadline(c,since){return c.number===8?finalMonth:Math.min(finalMonth,since+c.duration-1);}
function deadline(s){const c=current(s);return c?chapterDeadline(c,s.storyChapterSince):null;}
function fail(s,at){const c=current(s);s.storyFailed={id:c.id,at};s.status='bankrupt';s.storyEvents.push({kind:'failure',id:c.id,at});s.notices.push(at>=finalMonth?'10年目12月の再建期限を迎えました。':'再建計画の期限を迎え、商店街の存続が認められませんでした。');}
function enforceDeadline(s){if(s.storyVersion!==2||s.storyCompleteAt!==undefined||s.storyFailed||!current(s)||s.month<=finalMonth)return false;fail(s,s.month-1);return true;}
function counts(s){return E.forecast(s).shops.filter(r=>r.op);}
function operational(s,t){return s.buildings.filter(b=>b.type===t&&E.operational(s,b));}
function environment(s){const shops=s.buildings.filter(b=>E.F(b.type).shop&&E.operational(s,b)),u=E.services(s),rest=b=>u.near(b,'bench',3)||u.near(b,'plaza',3)||u.near(b,'grandpark',5)||u.near(b,'japaneseGarden',2);return {total:shops.length,rest:shops.filter(rest).length,toilet:shops.filter(b=>u.near(b,'toilet',4)).length,safe:shops.filter(b=>u.protection(b)>=.4).length};}
const row=(metric,target,label,value)=>({metric,target,label,value});
function checks(s,c){
 const p=s.storyProgress,shops=s.buildings.filter(b=>E.F(b.type).shop&&E.operational(s,b)),f=E.forecast(s),rows=f.shops.filter(r=>r.op),empty=s.buildings.filter(b=>b.type==='vacant').length,env=environment(s),cash=Math.max(0,E.availableCash(s)),debt=s.debts.reduce((n,d)=>n+d.balance,0),route=routes[s.storyChoices.route],business=s.storyChoices.business;
 switch(c.number){
 case 0:return [row('renovated',1,'店舗を１軒改装して完成させる',shops.filter(b=>b.level>=2).length),row('review',1,'店舗詳細で品ぞろえ・道路接続を確認する',s.storyReviewed?1:0),row('settle',1,'月の決算を確認する',p.settlements)];
 case 1:return [row('original',3,'最初のパン屋・喫茶店・花屋を改装して営業', ['bakery','cafe','flower'].filter(t=>shops.some(b=>b.type===t&&b.level>=2)).length),row('shops',5,'空き店舗ゼロ・営業中５店舗以上',empty===0?shops.length:0),row('black',3,'章開始後、月間黒字を計３回',p.black)];
 case 2:return [row('route',1,'街の特色を選ぶ',route?1:0),row('types',3,(route?route.name+'：':'選んだ特色の')+'営業中３業種以上',route?new Set(shops.filter(b=>route.types.includes(b.type)).map(b=>b.type)).size:0),row('link',1,'特色に合う店舗連携を成立させる',route&&rows.some(r=>route.types.includes(r.type)&&r.synergy)?1:0),row('fair',1,'特色の企画で来街2,000人以上・月間黒字',route?p.fairs.filter(id=>route.projects.includes(id)).length:0),row('profit',3,'章開始後、営業利益50万円以上を計３回',p.profit50)];
 case 3:return [row('visits',3,'来街3,000人以上・混雑や大混雑でない月を計３回',p.comfortable),row('rest',70,'営業店の70％以上に休憩環境',env.total?Math.floor(env.rest/env.total*100):0),row('toilet',70,'営業店の70％以上にトイレ',env.total?Math.floor(env.toilet/env.total*100):0),row('safe',70,'営業店の70％以上に交番・コンビニの見守り',env.total?Math.floor(env.safe/env.total*100):0),row('vacant',1,'空き店舗ゼロ',empty===0?1:0)];
 case 4:return [row('mascot',1,'商店街マスコット制作企画を開催し、完成を迎える',E.mascotActive(s)?1:0),row('shop',1,E.mascotActive(s)?'こつまる屋を開設して営業':'完成したマスコットのグッズ店を開設',operational(s,'kotsumaru').length),row('visits',3,'誕生後、来街4,000人以上・月間黒字を計３回',p.mascotBlack)];
 case 5:return [row('rival',2,'ライバルイベント中の月間黒字を計２回',p.rivalBlack),row('stage',2,'来街4,000人以上・月間黒字でステージ企画２種類',p.stageFairs.length),row('reserve',1000000,'納税資金と次回返済を除いて100万円を残す',Math.max(0,cash-s.debts.reduce((n,d)=>n+Math.min(d.balance,d.installment)+Math.round(d.balance*C.loanRate),0)))];
 case 6:{let value=0,label='大型事業を選び、必要な施設を整える';if(business==='food'){const food=['bakery','cafe','diner','sushi'];value=new Set(shops.filter(b=>food.includes(b.type)).map(b=>b.type)).size>=3&&rows.some(r=>r.freshBonus>0)&&rows.some(r=>r.terraceBonus>0)?1:0;label=businesses.food.text;}if(business==='rest'){value=(operational(s,'grandpark').length||operational(s,'japaneseGarden').length)&&env.total&&env.rest/env.total>=.8?1:0;label=businesses.rest.text;}if(business==='stage'){value=operational(s,'eventStage').length&&p.stageFairs.length>=3?1:0;label=businesses.stage.text;}return [row('choice',1,'取り組む大型事業を選ぶ',business?1:0),row('investment',12000000,'事業整備費1,200万円を支払って着手',s.storyBusinessPaid||0),row('business',1,label,value),row('visitors',5500,'月間来街5,500人以上',s.last?.total||0),row('reserve',3000000,'納税資金を除く運転資金300万円を確保',cash)];}
 case 7:return [row('tower',1,'シンボルタワー（工期10か月）を完成させて営業',operational(s,'tower').length),row('visits',3,'来街7,000人以上・月間黒字を計３回',p.destination),row('breadth',3,'４客層すべて人口上限25％以上の来街を計３回',p.breadth),row('environment',1,'混雑・大混雑を解消し、治安を標準以上にする',!['crowded','severe'].includes(f.congestionLevel)&&f.securityValue>=60?1:0)];
 case 8:{const fairs=s.history.filter(h=>h.month>=s.storyChapterSince&&h.project==='anniversary'&&!h.allClosed&&h.total>=8000),profit=Math.max(0,...fairs.map(h=>h.profit));return [row('debt',1,'借入を完済する',debt===0?1:0),row('profit',6000000,'再生記念祭で月間利益600万円以上（開催費・税引後）',profit),row('environment',1,'来街7,000人以上・混雑と大混雑なし・治安標準以上',f.total>=7000&&!['crowded','severe'].includes(f.congestionLevel)&&f.securityValue>=60?1:0),row('festival',1,'再生記念祭で来街8,000人以上',fairs.length?1:0)];}
 }return [];
}
function chapters(s){return definitions.map((c,i)=>{const done=i<index(s),active=i===index(s),g=active?checks(s,c):[];return {...c,done,current:active,hidden:!done&&!active,checks:g,ready:active&&g.every(r=>r.value>=r.target),yearReady:true,deadline:active?deadline(s):null,left:active?Math.max(0,deadline(s)-s.month+1):0};});}
function choose(s,kind,value){const number=current(s)?.number;if(!E.canAct(s)||kind==='route'&&number!==2||kind==='business'&&number!==6||!['route','business'].includes(kind))return {error:'この章では選べません。'};const options=kind==='route'?routes:businesses;if(!options[value])return {error:'選択肢が不正です。'};if(s.storyChoices[kind])return {error:'この章の方針は決定済みです。'};if(kind==='business'){if(!E.charge(s,12000000,'construction',options[value].name+' 事業整備費'))return {error:'事業整備費1,200万円を用意してください。'};s.storyBusinessPaid=12000000;}s.storyChoices[kind]=value;return {};}
function inspect(s,id){if(current(s)?.number!==0||!E.F(s.buildings.find(b=>b.id===id)?.type)?.shop)return {error:'確認できる店舗を選んでください。'};s.storyReviewed=true;return {};}
function facilityUnlocked(s,type){const f=E.F(type);if(f?.postgame&&!E.postgameRewards(s)[f.postgame])return false;if(!f||f.retired||f.tenant||type==='vacant')return false;const gate=definitions.find(c=>c.facilities.includes(type));if(gate&&!s.storyDone.includes(gate.id)&&!s.storyUnlockedFacilities.includes(type))return false;if(type==='tower')return towerConditions(s).ok;if(f.unlockMascot&&!E.mascotActive(s))return false;if(f.unlockMorun&&!E.morunKnown(s))return false;if(f.unlock&&s.month<f.unlock.month&&s.claimed.length<f.unlock.goals)return false;return true;}
function unlockHint(s,type){const f=E.F(type),gate=definitions.find(c=>c.facilities.includes(type));if(f?.retired)return 'この施設は廃止されました。';if(gate&&!s.storyDone.includes(gate.id)&&!s.storyUnlockedFacilities.includes(type))return 'メインストーリーを進めると解放';if(type==='tower')return towerConditions(s).requirements.filter(r=>!r.met).map(r=>r.name).join('／');if(f?.unlockMascot&&!E.mascotActive(s))return 'マスコットの完成後に解放';if(f?.unlockMorun&&!E.morunKnown(s))return 'モールンの初登場後に解放';return '目標達成または街の経営年月に応じて解放';}
function projectUnlocked(s,id){const gate=definitions.find(c=>c.projects.includes(id));return !gate||s.storyDone.includes(gate.id)||s.storyUnlockedProjects.includes(id)||s.project===id;}
function projectHint(id){return definitions.some(c=>c.projects.includes(id))?'メインストーリーを進めると解放':'';}
function towerConditions(s){const unlocked=s.storyDone.includes('campaign-6')||s.storyUnlockedFacilities.includes('tower'),r=C.towerRules,h=s.history.slice(-r.visitorMonths),types=new Set(s.buildings.filter(b=>E.F(b.type).shop&&E.operational(s,b)).map(b=>b.type));const requirements=[{name:'第六章の大型事業を達成',met:unlocked},{name:'商店街マスコットが誕生済み',met:E.mascotActive(s)},{name:'営業中10業種以上',met:types.size>=r.minIndustries},{name:'直近３か月の平均来街8,000人以上',met:h.length===r.visitorMonths&&h.reduce((n,h)=>n+h.total,0)>=r.minVisitors*r.visitorMonths}];return {ok:requirements.every(r=>r.met),requirements};}
function settle(s,r){
 if(s.storyCompleteAt!==undefined||s.storyFailed)return;const c=current(s),p=s.storyProgress;if(!c||r.month<s.storyChapterSince||p.lastMonth===r.month)return;
 if(r.month>finalMonth){fail(s,r.month);return;}
 p.lastMonth=r.month;p.settlements++;if(r.profit>0)p.black++;if(r.operating>=500000)p.profit50++;if(r.total>=3000&&!['crowded','severe'].includes(r.congestionLevel))p.comfortable++;if(E.mascotActive(s)&&r.total>=4000&&r.profit>0)p.mascotBlack++;if(r.competition&&r.profit>0)p.rivalBlack++;if(r.total>=7000&&r.profit>0)p.destination++;if(r.visitors.every((n,i)=>n>=(r.segmentCaps||C.segmentCaps)[i]*.25))p.breadth++;p.investment+=r.spent.construction;
 if(r.project&&!r.allClosed&&r.profit>0){
  if(r.project!=='anniversary'&&r.total>=2000&&!p.fairs.includes(r.project))p.fairs.push(r.project);
  if(r.total>=4000&&stageProjects.includes(r.project)&&!p.stageFairs.includes(r.project))p.stageFairs.push(r.project);
  if(r.project==='anniversary'&&r.total>=8000&&!p.fairs.includes('anniversary'))p.fairs.push('anniversary');
 }
 // Evaluate exactly one chapter, after its last allowed settlement and before expiry.
 if(checks(s,c).every(g=>g.value>=g.target)&&s.cash+c.cashReward>=0){
  s.storyDone.push(c.id);s.cash+=c.cashReward;r.rewards+=c.cashReward;r.storyRewards=[{id:c.id,amount:c.cashReward}];s.storyEvents.push({kind:'clear',id:c.id,at:r.month,reward:c.cashReward});s.notices.push(title(c)+'「'+c.name+'」クリア。');
  if(c.number===8){s.storyCompleteAt=r.month+1;s.titles=s.titles||[];if(!s.titles.some(t=>t.id==='reborn'))s.titles.push({id:'reborn',name:C.titles.reborn.name});return;}
  s.storyChapterSince=r.month+1;s.storyProgress=progress();if(r.month>=finalMonth){fail(s,r.month);return;}s.storyEvents.push({kind:'start',id:current(s).id,at:r.month+1});
 }else if(r.month>=deadline(s)){fail(s,r.month);}
}
function beginMonth(s){const c=current(s);if(!c||c.number!==5||s.storyFailed)return;const completed=s.storyProgress.rivalBlack,elapsed=s.month-s.storyChapterSince;if(completed<2&&elapsed>=3&&elapsed%4===3&&E.morunKnown(s)&&s.events.active?.kind!=='disaster'){s.events.active={kind:'rival',type:'morun',at:s.month,id:'story-morun-'+s.month,left:2,intensity:C.morunRules.intensity};s.notices.push('大型商業施設が、モールンと一緒に催しを開催します。');}}
function evaluation(s){const r=E.evaluate(s);return {...r,...E.scoreEvaluation(r,s.storyCompleteAt),years:Math.ceil(s.storyCompleteAt/12),storyComplete:true,chapters:9,clearMonth:s.storyCompleteAt};}
function validateOrMigrate(s){
 if(s.storyVersion!==2){migrate(s);return;}
 const fail=()=>{throw Error('メインストーリーの進行記録が不正です。');};
 if(s.storyOpening===undefined)s.storyOpening=s.month===0&&s.history.length===0&&s.storyDone.length===0;
 if(typeof s.storyOpening!=='boolean')fail();
 if(!Number.isSafeInteger(s.storyChapterSince)||s.storyChapterSince<0||s.storyChapterSince>s.month+1||!s.storyProgress||!s.storyChoices||Array.isArray(s.storyChoices)||!Array.isArray(s.storyEvents)||s.storyEvents.length>40)fail();
 for(const k of Object.keys(progress())){const v=s.storyProgress[k];if(['fairs','stageFairs'].includes(k)){if(!Array.isArray(v)||v.length>Object.keys(C.projects).length||new Set(v).size!==v.length||v.some(id=>!C.projects[id]||k==='stageFairs'&&!stageProjects.includes(id)))fail();}else if(!Number.isSafeInteger(v)||v<(k==='lastMonth'?-1:0)||v>1e13)fail();}
 if(s.storyProgress.lastMonth>=s.month&&s.storyProgress.lastMonth!==-1)fail();
 if(Object.keys(s.storyChoices).some(k=>!['route','business'].includes(k))||s.storyChoices.route&&!routes[s.storyChoices.route]||s.storyChoices.business&&!businesses[s.storyChoices.business])fail();
 if(s.storyBusinessPaid!==undefined&&(s.storyBusinessPaid!==12000000||!businesses[s.storyChoices.business]))fail();
 if(s.storyChoices.business&&s.storyBusinessPaid!==12000000)fail();
 if(s.postgameExpansionNotified!==undefined&&typeof s.postgameExpansionNotified!=='boolean')fail();
 if(s.postgameGardenNotified!==undefined&&typeof s.postgameGardenNotified!=='boolean')fail();
 if(s.postgameGiftsReceived!==undefined&&typeof s.postgameGiftsReceived!=='boolean')fail();
 if(s.storyReviewed!==undefined&&typeof s.storyReviewed!=='boolean'||s.storyFreeplay!==undefined&&typeof s.storyFreeplay!=='boolean')fail();
 for(const e of s.storyEvents)if(!e||!['start','clear','failure'].includes(e.kind)||!definitions.some(c=>c.id===e.id)||!Number.isSafeInteger(e.at)||e.at<0||e.at>s.month+1)fail();
 if(s.storyCompleteAt!==undefined&&(!Number.isSafeInteger(s.storyCompleteAt)||s.storyCompleteAt<1||s.storyCompleteAt>s.month||s.storyDone.length!==9))fail();
 if(s.storyDone.length===9&&s.storyCompleteAt===undefined||s.storyFreeplay&&s.storyCompleteAt===undefined)fail();
 if(s.storyFailed&&(!current(s)||s.storyFailed.id!==current(s).id||!Number.isSafeInteger(s.storyFailed.at)||s.storyFailed.at<Math.min(deadline(s),s.storyChapterSince+current(s).duration-1)||s.storyFailed.at>=s.month||s.status!=='bankrupt'))fail();
}
const S={finalMonth,chapterDeadline,enforceDeadline,definitions,routes,businesses,title,current,deadline,initialize,migrate,openingVisitFactor,chapters,choose,inspect,facilityUnlocked,unlockHint,projectUnlocked,projectHint,towerConditions,settle,beginMonth,evaluation,validateOrMigrate};root.KStory=S;
if(typeof module!=='undefined')module.exports=S;
})(globalThis);
