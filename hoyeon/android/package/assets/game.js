const D={chap,bg,players,battle};
const $=s=>document.getElementById(s),P=D.players,key='hoyeon-landscape-2';let g={},zoom=150;
const layouts={'128':{0:[35,78],21:[48,68],22:[61,76],23:[22,65]},'129':{474:[13,80],475:[24,64],478:[75,63],479:[88,80],146:[16,60],147:[83,58],0:[37,77],21:[47,85],22:[62,77],23:[53,65]},'134':{0:[41,78],23:[57,71]},west:{0:[41,74],22:[55,76]},inn:{0:[42,75],22:[57,70]},reed:{0:[43,77],21:[54,80],24:[65,69]},'135':{0:[31,81],146:[59,66],474:[46,76],475:[69,78]},'131':{32:[56,70],146:[41,77]},'136':{0:[39,79],32:[58,70]},'132':{0:[28,81],5:[39,69],6:[47,72],7:[55,70],8:[64,73],9:[44,88],10:[56,88],11:[67,87]},'133':{0:[34,77],1:[51,80],35:[62,76]}};
function btn(label,fn,off=false){let b=document.createElement('button');b.textContent=label;b.disabled=off;b.onclick=fn;return b}
function controls(id,items){$(id).replaceChildren(...items.map(a=>btn(...a)))}
function popup(msg,items){let p=document.createElement('p');p.textContent=msg;let a=document.createElement('div');a.append(...items.map(([s,f])=>btn(s,()=>{$('modal').hidden=true;f()})));$('modal').replaceChildren(p,a);$('modal').hidden=false}
function panel(w,t){$('who').textContent=w;$('line').textContent=t;let v=Object.values(P).find(p=>p[0]===w);$('face').hidden=!v;if(v)$('face').src=v[1]}
function save(){try{localStorage.setItem(key,JSON.stringify(g));return true}catch{return false}}
function tools(extra=[]){controls('tools',[...extra,['저장',()=>popup(save()?'현재 진행을 저장했어.':'이 브라우저에서는 저장 공간을 사용할 수 없어.',[['닫기',()=>{}]])],['메뉴',()=>popup('절강의 인연',[['계속하기',()=>{}],['제목으로',titleScreen]])]])}
const hosted=typeof location!=='undefined'&&location.protocol==='https:';
let offer;
if(hosted){
 const manifest=document.createElement('link');manifest.rel='manifest';manifest.href='./manifest.webmanifest';document.head.append(manifest);
 window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();offer=e});
 window.addEventListener('appinstalled',()=>{offer=null});
 if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js').then(reg=>{
 const ready=()=>{if(reg.waiting&&!$('title').hidden)titleScreen()};
 reg.addEventListener('updatefound',()=>{const worker=reg.installing;worker?.addEventListener('statechange',ready)});
 window.hoyeonRegistration=reg;ready()
 }).catch(()=>{});
}
async function installGame(){
 if(!hosted){location.href='https://hoyeon-wugachon.basicvale13.chatgpt.site/';return}
 if(window.matchMedia('(display-mode: standalone)').matches||navigator.standalone){popup('설치된 호연전을 실행 중입니다.',[['닫기',()=>{}]]);return}
 if(offer){const e=offer;offer=null;await e.prompt();await e.userChoice;return}
 popup(/iPhone|iPad|Macintosh/.test(navigator.userAgent)?'Safari의 공유 메뉴에서 「홈 화면에 추가」를 선택하세요.':'브라우저 메뉴에서 「앱 설치」 또는 「홈 화면에 추가」를 선택하세요. 항목이 보이지 않으면 Chrome에서 이 주소를 열어 주세요.',[['닫기',()=>{}]])
}
function face(u,dx,dy){if(dx||dy)u.dir=Math.abs(dx)>=Math.abs(dy)?(dx>0?'e':'w'):(dy<0?'n':'s')}
function paint(im,u,pose='idle',step=0){
 const dir=u.dir||(u.side==='foe'?'w':'e'),rear=dir==='n',flip=dir==='e'?-1:1,f=P[u.id][6];
 im.src=f?(pose==='attack'?f[rear?5:4]:f[(rear?2:0)+(pose==='walk'?step%2:0)]):P[u.id][3];
 im.style.transform='scaleX('+flip+')';return flip
}
function nearest(u,t){
 const cells=[...paths(u,80)].map(([k,c])=>[...k.split(',').map(Number),c]);
 return cells.sort((a,b)=>dist({x:a[0],y:a[1]},t)-dist({x:b[0],y:b[1]},t)||a[2]-b[2])[0].slice(0,2)
}
async function raid(){
 const unit=id=>g.u.find(u=>u.id===id),boss=unit(146),master=unit(32),hero=unit(0);
 g.u.filter(a=>a.hidden&&a.side==='guest').forEach(reveal);battleUI();
 await say(unit(5),'구처기 도인께 들었네. 우리가 돕겠네!',1900);
 await say(unit(6),'뒤채에서 누가 나온다!',1250);
 boss.x=Math.min(22,boardWidth()-2);boss.y=6;g.u.filter(a=>a.hidden).forEach(reveal);
 const [x,y]=nearest(boss,{x:Math.min(21,boardWidth()-3),y:5});g.captive={id:24,x,y};battleUI();
 await walkTo(boss,...nearest(boss,master),80);face(boss,master.x-boss.x,master.y-boss.y);face(master,boss.x-master.x,boss.y-master.y);battleUI();
 paint(tile(boss).querySelector('img'),boss,'attack');await say(master,'단 장군…… 자네가 어찌!',1300);
 master.hp=0;battleUI();await say(boss,'이걸로 신세는 갚았소. 흐흐.',1850);
 await walkTo(boss,...nearest(boss,g.captive),80);await say(g.captive,'이 손 놓으시오!',1150);
 g.captive.taken=true;battleUI();const exit=nearest(boss,{x:boardWidth()-1,y:5});await walkTo(boss,...exit,80);
 boss.hidden=true;delete g.captive;battleUI();await say(hero,'이평 아주머니! 단천덕, 거기 서라!',1650);
 const steps=route(hero,...nearest(hero,{x:exit[0],y:exit[1]}),80).slice(0,3);
 if(steps.length)await walkTo(hero,...steps.at(-1),3);
 g.log='단천덕이 이평을 데리고 달아났다. 길을 막은 송군을 돌파하라.'
}

function titleScreen(){closeOrders();$('frame').classList.remove('battle');$('title').hidden=false;$('title').style.backgroundImage='linear-gradient(90deg,#17251ddd,transparent),url('+D.bg.title+')';let saved;try{saved=JSON.parse(localStorage.getItem(key))}catch{}controls('start',[['새 이야기',()=>{if(saved)popup('기존 저장을 새 이야기로 바꿀까?',[['새로 시작',()=>story(0)],['취소',()=>{}]]);else story(0)}],['이어하기',()=>{g=saved;draw()},!saved],['리소스 업데이트',()=>checkResources(true)],...(typeof window!=='undefined'&&window.hoyeonRegistration?.waiting?[['새 패치 적용',()=>{navigator.serviceWorker.addEventListener('controllerchange',()=>location.reload(),{once:true});window.hoyeonRegistration.waiting.postMessage('activate')}]]:[])]);checkResources()}
function story(ch,i=0){g={mode:'story',ch,i,revision19:true,revision20:true,powerLost:ch<=1?false:ch===10?true:!!g.powerLost,recovery:ch<=1?0:(g.recovery||0),learned:ch===0?false:!!g.learned};save();draw()}
function draw(){if(!g.revision20){if(g.mode==='battle'&&g.n===9){let mei=g.u.find(u=>u.id===34);if(mei?.hidden){mei.hidden=false;mei.hp=Math.floor(mei.max*.3)}}if(g.mode==='story'&&g.ch===10){g.i=0;g.powerLost=true;g.recovery=0}g.revision20=true}if(!g.revision19){if(g.mode==='story'&&g.ch===7)g.i=Math.max(0,g.i-8);if(g.mode==='battle'&&g.n===6){for(const u of g.u.filter(u=>[33,34].includes(u.id))){if(u.hidden||!u.hp)u.hp=Math.ceil(u.max*.2);u.hidden=false}}g.revision19=true}closeOrders();$('frame').classList.remove('battle');inspectedUnit=null;$('title').hidden=true;$('scene').hidden=g.mode==='battle';$('field').hidden=g.mode!=='battle';if(g.mode==='battle'){battleUI();return}let [bg,place,cast,w,t]=D.chap[g.ch][g.i];if(g.ch===2)bg=place.includes('객잔')?'inn':'west';if(g.ch===3&&bg===129)bg='reed';$('place').textContent=place;$('scene').style.backgroundImage='url('+D.bg[bg]+')';$('scene').replaceChildren();if(place.includes('전금발의 묘')){let grave=document.createElement('div');grave.textContent='전금발의 묘';grave.setAttribute('aria-label','전금발의 묘');grave.style.cssText='position:absolute;left:75%;top:49%;width:8%;height:25%;border-radius:40% 40% 3% 3%;background:linear-gradient(100deg,#77786e,#434840);border:2px solid #959587;color:#ded9bf;writing-mode:vertical-rl;display:flex;align-items:center;justify-content:center;box-shadow:0 12px 14px #151b15;font-size:clamp(12px,2vw,24px)';$('scene').append(grave)}let lay=layouts[bg]||{};for(let [id,x,y,d,pose] of [...cast].sort((a,b)=>(lay[a[0]]?.[1]||0)-(lay[b[0]]?.[1]||0))){let [u,v]=lay[id]||[18+(cast.findIndex(a=>a[0]===id)%6)*12,65+Math.floor(cast.findIndex(a=>a[0]===id)/6)*17],im=new Image();let speaker=cast.find(a=>P[a[0]][0]===w),others=cast.filter(a=>a[0]!==id),target=others.find(a=>a===speaker)||others.sort((a,b)=>Math.abs((lay[a[0]]||[50])[0]-u)-Math.abs((lay[b[0]]||[50])[0]-u))[0],lookRight=target?(lay[target[0]]||[50])[0]>u:false;im.className='actor';im.alt=P[id][0];im.src=P[id][2][pose===99?6:(pose===1?1:pose===11?2:0)];im.style.cssText='left:'+u+'%;top:'+v+'%;height:23%;transform:translate(-50%,-100%) scaleX('+(lookRight?-1:1)+')';if(w===P[id][0])im.classList.add('speaking');if(bg===131&&id===146&&t.includes('뒤채로 들었다'))im.classList.add('exitBack');$('scene').append(im)}tools();panel(w||'이야기',t);controls('actions',[['다음 ›',next]]);if(g.mode==='lesson')lessonUI()}
function next(){if(g.i+1<D.chap[g.ch].length)return story(g.ch,g.i+1);if(g.ch===1)return popup('누구를 구하러 갈까?',[['곽소천',()=>teach(3)],['양철심',()=>teach(2)]]);if([0,3,4,6,9].includes(g.ch))return fight(g.ch);if([5,7,8].includes(g.ch))return story(g.ch+1);popup(g.ch===10?'백호연과 곽정의 동행이 시작됩니다. 공력 회복과 성장 이야기는 다음 장으로 이어집니다.':'이번 분기의 이야기를 마쳤어.',[['갈림길로',()=>story(1)],['제목으로',titleScreen]])}
const dist=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y),near=(a,b)=>Math.max(Math.abs(a.x-b.x),Math.abs(a.y-b.y)),live=()=>g.u.filter(u=>u.hp>0&&!u.hidden),at=(x,y)=>live().find(a=>a.x===x&&a.y===y),sel=()=>g.u.find(a=>a.id===g.id),enemy=(a,b)=>(a.side==='foe')!==(b.side==='foe');
function fight(n){radialSelection=null;g={mode:'battle',n,mapFormat:2,powerLost:!!g.powerLost,recovery:g.recovery||0,learned:!!g.learned,turn:1,u:T[n].cast.map(([id,x,y,side,hidden])=>({id,x,y,side,hidden,hp:(T[n].stats?.[id]||stats[id])[5],max:(T[n].stats?.[id]||stats[id])[5],mp:(T[n].stats?.[id]||stats[id])[6],done:false})),id:0,step:'move',log:n===0?'백호연을 남쪽 중앙 출구로 보내거나 적을 전멸시키세요.':n===3?'단천덕의 퇴로를 지키는 송군 8명을 돌파하라.':n===6?'백호연과 강남칠괴가 흑풍쌍살을 저지한다.':n===9?'백호연을 조작해 동료들과 매초풍을 물리쳐라.':'초목대사가 산문을 막아섰다.'};if(g.powerLost)g.u.find(u=>u.id===0).mp=0;save();draw();sequence(async()=>{if(n===6||n===9){await chapterBattleIntro(n);return}let h=sel(),v=g.u.find(a=>a.id===(n===0?146:n===4?32:474));await say(v,n===0?'왕명이다! 반역자를 잡아라!':n===4?'산문을 넘으려거든 나를 먼저 넘으시오.':'역참을 막아라!',1600);await say(h,n===0?'남쪽 길을 엽시다!':n===4?'저는 피를 보러 온 것이 아닙니다!':'단천덕, 각오해라!',1400);})}
function paths(u,limit){let q=[[u.x,u.y,0]],s=new Map([[u.x+','+u.y,0]]);for(let j=0;j<q.length;j++){let [x,y,c]=q[j];for(let [a,b] of [[x-1,y],[x+1,y],[x,y-1],[x,y+1]]){let i=b*boardWidth()+a,k=a+','+b;if(a<0||a>=boardWidth()||b<0||b>=boardHeight()||currentMap().tiles[i]===6||s.has(k)||at(a,b))continue;let n=c+1;if(n<=limit){s.set(k,n);q.push([a,b,n])}}}return s}
// Jiangnan arts use explicit tactical ranges; Quan's whip follows this adaptation.
const arts={0:['백운검법 · 운룡일섬',12],5:['암기술',6],6:['분근착골수',5],7:['금룡편법',7],8:['남산장법',6],9:['도우권법',7],10:['철편연타',7],11:['월녀검법',6],21:['찌르기',4],22:['양가창법',12],23:['전진검법',8]};
const heroArts={baek:['백운검법 · 운룡일섬',12,'백씨세가 독문검법 · 직선 3칸 관통',30],sky:['삼재검법 · 천',4,'찌르기 · 인접한 적 1명',12],earth:['삼재검법 · 지',7,'베기 · 선택한 적 중심 가로 3칸',16],human:['삼재검법 · 인',7,'자신 선택 · 바라보는 앞 3칸 휘두르기',16]};
function availableArts(u){return u.id===0?(g.powerLost?[]:['baek',...(g.learned?['sky','earth','human']:[])]):arts[u.id]?['default']:[]}
function artFor(u){return u.id===0?heroArts[g.heroArt||'baek']:arts[u.id]}
function skillCells(u,v=u){
 if(u.id!==0)return [];const key=g.heroArt||'baek';let cells=[];
 if(key==='human'){const [dx,dy]=({e:[1,0],w:[-1,0],n:[0,-1],s:[0,1]})[u.dir||'e'];for(let i=-1;i<=1;i++)cells.push([u.x+dx-dy*i,u.y+dy+dx*i])}
 else if(key==='earth')for(let i=-1;i<=1;i++)cells.push([v.x+i,v.y]);
 else if(key==='baek'){const dx=Math.sign(v.x-u.x),dy=Math.sign(v.y-u.y);if((dx===0)!==(dy===0))for(let i=1;i<=3;i++){let x=u.x+dx*i,y=u.y+dy*i;if(x<0||y<0||x>=boardWidth()||y>=boardHeight()||currentMap().tiles[y*boardWidth()+x]===6)break;cells.push([x,y])}}
 else cells=[[v.x,v.y]];
 return cells.filter(([x,y])=>x>=0&&y>=0&&x<boardWidth()&&y<boardHeight()&&currentMap().tiles[y*boardWidth()+x]!==6)
}
function chooseArt(u){if(u.id!==0){g.step='skill';battleUI();return}
 popup('백씨세가 · 백호연의 무공'+(g.powerLost?' — 공력 상실로 사용할 수 없습니다.':''),[...availableArts(u).map(key=>[heroArts[key][0]+' · 내공 '+heroArts[key][1]+' / '+heroArts[key][2],()=>{
 if(u.mp<heroArts[key][1]){popup('내공이 부족합니다.',[['돌아가기',()=>chooseArt(u)]]);return}g.heroArt=key;g.step='skill';
 if(key==='human')popup('방향을 선택한 뒤 자신의 칸을 누르세요.',[['위','n'],['오른쪽','e'],['아래','s'],['왼쪽','w']].map(([label,dir])=>[label,()=>{u.dir=dir;battleUI()}]));else battleUI()
 }]),['취소',()=>{g.step=g.origin?'act':'move';battleUI();openOrders(u)}]])}
async function innerInjuryEvent(){
 if(g.mode!=='battle'||g.n!==9||g.innerInjury)return false;
 const mei=g.u.find(u=>u.id===34),hero=g.u.find(u=>u.id===0),guo=g.u.find(u=>u.id===36),ma=g.u.find(u=>u.id===26);
 if(!mei||mei.hp>mei.max*.3)return false;g.innerInjury=true;mei.hidden=false;
 await say(mei,'비켜라! 막는 자부터 죽이겠다!',1900);await walkTo(hero,...nearest(hero,mei),80);
 await say(hero,'정아, 사부님들을 모시고 물러서라! 내가 막겠다!',2300);
 face(hero,mei.x-hero.x,mei.y-hero.y);face(mei,hero.x-mei.x,hero.y-mei.y);let im=tile(mei).querySelector('img');if(im)paint(im,mei,'attack');await sleep(500);
 hero.hp=Math.max(1,Math.floor(hero.max*.15));hero.mp=0;g.powerLost=true;g.recovery=0;battleUI();
 await say(hero,'큭…… 단전의 기운이…… 흩어진다……',2300);await say(guo,'백 아저씨! 제가 지키겠습니다!',1900);await say(ma,'더 다가오지 마시오!',1700);
 mei.hidden=true;battleUI();await say(ma,'상처가 깊소. 먼저 진기를 안정시키겠소.',2100);story(10);return true;
}
function inReach(u,v,spell=false){let d=dist(u,v);if(u.id===5)return d>=1&&d<=4;if([7,10].includes(u.id))return d>=1&&d<=2&&(u.x===v.x||u.y===v.y);if(spell&&[11,23].includes(u.id))return near(u,v)===1;return d===1}
function broken(u){return g.n===6&&[33,34].includes(u.id)&&u.hp<=Math.ceil(u.max*.2)}
function valid(u,v,spell){if(spell&&u.id===0){if(!availableArts(u).includes(g.heroArt||'baek')||!v)return false;if(g.heroArt==='human')return v===u&&artTargets(u,u).length>0;return enemy(u,v)&&!broken(v)&&((g.heroArt||'baek')==='baek'?dist(u,v)<=3&&(u.x===v.x||u.y===v.y)&&skillCells(u,v).some(([x,y])=>x===v.x&&y===v.y):dist(u,v)===1)}if(spell&&u.id===22)return v===u&&live().some(a=>enemy(u,a)&&near(u,a)===1);return v&&!broken(v)&&enemy(u,v)&&inReach(u,v,spell)}
function artTargets(u,v){if(u.id===0){const cells=skillCells(u,v);return live().filter(a=>enemy(u,a)&&!broken(a)&&cells.some(([x,y])=>a.x===x&&a.y===y))}return [7,10].includes(u.id)?live().filter(a=>enemy(u,a)&&!broken(a)&&inReach(u,a,true)&&Math.sign(a.x-u.x)===Math.sign(v.x-u.x)&&Math.sign(a.y-u.y)===Math.sign(v.y-u.y)):u.id===22?live().filter(a=>enemy(u,a)&&near(u,a)===1):[v]}
function damage(u,v,boost){if(g.n===4&&g.turn===1&&v.id===32)return 0;let hit=Math.max(8,Math.round(combatStats(u)[0]*.70-combatStats(v)[1]*.24+boost-(u.weakened?10:0)));u.weakened=false;const before=v.hp;v.hp=Math.max(0,v.hp-hit);if(g.n===6&&[33,34].includes(v.id))v.hp=Math.max(Math.ceil(v.max*.2),v.hp);if(g.n===6&&[1,10].includes(v.id))v.hp=Math.max(1,v.hp);if(g.n===9&&v.id===34)v.hp=Math.max(Math.floor(v.max*.3),v.hp);return before-v.hp}
async function forestEvent(){
 if(g.mode!=='battle'||g.n!==6||g.forestEvent)return false;
 const unit=id=>g.u.find(u=>u.id===id),chen=unit(33),mei=unit(34),guo=unit(1),quan=unit(10);
 if(!broken(chen)||!broken(mei))return false;
 g.forestEvent=true;chen.hidden=false;mei.hidden=false;
 await say(chen,'이 꼬마부터 잡겠다!',1600);await walkTo(chen,...nearest(chen,guo),80);
 await say(guo,'오지 마!',1300);face(guo,chen.x-guo.x,chen.y-guo.y);let im=tile(guo).querySelector('img');if(im)paint(im,guo,'attack');await sleep(450);chen.hp=0;battleUI();
 await say(unit(0),'정아의 단검이 급소를 찔렀다……!',1900);
 await say(mei,'현풍! 네놈을 죽여 원수를 갚겠다!',2000);
 await walkTo(quan,...nearest(quan,guo),80);await say(quan,'정아, 내 뒤로 피해라!',1700);
 await walkTo(mei,...nearest(mei,quan),80);face(mei,quan.x-mei.x,quan.y-mei.y);im=tile(mei).querySelector('img');if(im)paint(im,mei,'attack');await sleep(450);
 await say(quan,'정아…… 살아야 한다……',2100);quan.hp=0;battleUI();await say(unit(0),'전 형님! 정아를 감싸다가……!',1900);
 await say(mei,'오늘의 원한을 잊지 않겠다!',1600);mei.hidden=true;battleUI();await say(unit(5),'아이를 지켜라! 지금은 뒤쫓을 수 없다.',2000);
 story(7);return true;
}
function finish(){if(g.mode!=='battle')return;let u=sel();u.done=true;g.origin=null;g.step='move';if(!win()){let v=live().find(v=>v.side==='ally'&&!v.done);if(v)g.id=v.id;save();battleUI();if(!v)completedTurn()}}
function win(){let h=g.u.find(x=>x.id===0);if(h.hp===0||([6,9].includes(g.n)&&!g.u.find(u=>u.id===(g.n===6?1:36))?.hp)||g.turn>(g.n===0?12:18)){popup('백호연 일행이 돌파하지 못했다.',[['재도전',()=>fight(g.n)],['제목으로',titleScreen]]);return true}if((g.n===0&&h.x>=11&&h.x<=14&&h.y>=18)||(!live().some(v=>v.side==='foe')&&(g.n!==4||g.turn>=2))){popup(g.n===0?'남쪽 길이 열렸다. 연기 속에서 일행이 흩어졌다.':g.n===3?'단천덕의 말이 사라졌다. 발굽 자국이 산사로 이어진다.':g.n===6?'진현풍이 무너졌다. 그러나 숲의 혈투는 비극을 남겼다.':g.n===9?'매초풍이 물러났다. 마옥이 오해를 풀기 위해 앞으로 나섰다.':'송군이 물러섰다. 백호연은 이평을 구하러 동문을 나섰다.',[['이야기 계속',()=>story(g.n===0?1:g.n+1)]]);return true}return false}
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
let animating=false, ticker=0;
function cancelTimer(){clearTimeout(ticker);ticker=0}
function completedTurn(){popup('아군이 모두 행동했습니다. 턴을 끝내겠습니까?',[['턴 종료',()=>{cancelTimer();endTurn()}],['자동 종료 취소',cancelTimer]]);const yes=$('modal').querySelector('button');let left=4;function tick(){yes.textContent='턴 종료 ('+left+'초)';if(left--===0){$('modal').hidden=true;endTurn();return}ticker=setTimeout(tick,1000)}tick()}
function tile(u){return $('map').children[u.y*boardWidth()+u.x]}
async function say(u,text,ms=1350){if(!u)return;if(ms>=1000)centerSelectedUnit(u);let cell=tile(u);let b=document.createElement('span');b.className='bubble'+(u.x<4?' left':u.x>21?' right':'');b.textContent=text;cell.append(b);panel(P[u.id][0],text);await sleep(ms);b.remove()}
function route(u,x,y,lim){let costs=paths(u,lim),out=[],c=costs.get(x+','+y);if(c===undefined)return [];while(c>0){out.unshift([x,y]);let prev=[[x-1,y],[x+1,y],[x,y-1],[x,y+1]].find(([a,b])=>costs.get(a+','+b)===c-1);[x,y]=prev;c--}return out}
async function walkTo(u,x,y,lim){let steps=route(u,x,y,lim);for(let i=0;i<steps.length;i++){let [a,b]=steps[i],dx=a-u.x,dy=b-u.y;face(u,dx,dy);let img=tile(u).querySelector('img');if(img){let flip=paint(img,u,'walk',i);img.style.transition='none';img.style.zIndex='4';img.style.transition='transform 175ms linear';img.getBoundingClientRect();let shift='translate('+dx*tile(u).clientWidth+'px,'+dy*tile(u).clientHeight+'px)';img.style.transform=shift+' scaleX('+flip+')';if(u.id===146&&g.captive?.taken){let c=tile(u).children[1];c.style.transition=img.style.transition;c.style.transform=shift}}await sleep(185);u.x=a;u.y=b;battleUI();}}
async function blow(u,v,power,label){face(u,v.x-u.x,v.y-u.y);face(v,u.x-v.x,u.y-v.y);battleUI();let im=tile(u).querySelector('img');if(im)paint(im,u,'attack');await say(u,label,330);let amt=damage(u,v,power);await say(v,amt?'−'+amt:'막아냈다',350);battleUI();return amt}
async function clash(u,v,power,magic=false){let n=await blow(u,v,power,magic?artFor(u)[0]:'공격');let result=P[u.id][0]+' → '+P[v.id][0]+'  −'+n;if(!magic&&v.hp>0&&u.hp>0&&!broken(v)&&!(g.n===9&&v.id===34&&v.hp<=v.max*.3)&&inReach(v,u)){let ret=await blow(v,u,-5,'반격!');result+=' · 반격 −'+ret}if(magic&&u.id===6)v.weakened=true;g.log=result;if(!await forestEvent())await innerInjuryEvent()}
async function sequence(fn){if(animating)return;animating=true;$('frame').classList.add('busy');if(g.mode==='battle')battleUI();try{await fn()}finally{animating=false;$('frame').classList.remove('busy')}}
let inspectedUnit=null;
function inspectRange(unit){
 const reach=new Set();
 const limit=g.n===4&&g.turn===1&&unit.id===32?0:3;
 for(const cell of paths(unit,limit).keys()){
  const [x,y]=cell.split(',').map(Number);
  for(let b=Math.max(0,y-4);b<=Math.min(boardHeight()-1,y+4);b++)for(let a=Math.max(0,x-4);a<=Math.min(boardWidth()-1,x+4);a++){if(!inReach({...unit,x,y},{x:a,y:b}))continue;
   if(a>=0&&a<boardWidth()&&b>=0&&b<boardHeight()&&currentMap().tiles[b*boardWidth()+a]!==6)reach.add(a+','+b);
  }
 }
 return reach
}
function unitCard(unit,command=false){
 if(command){openOrders(unit);return}
 const ally=unit.side==='ally',side=ally?'아군':unit.side==='foe'?'적군':'우군 · 자동 행동';
 const box=document.createElement('section');box.className='unitCard';box.setAttribute('role','dialog');box.setAttribute('aria-label',P[unit.id][0]+' 부대 정보');
 const portrait=new Image();portrait.src=P[unit.id][1];portrait.alt='';
 const head=document.createElement('h2');head.textContent=P[unit.id][0]+' · Lv.'+(currentMap().levels?.[unit.id]||12);
 const faction=document.createElement('small');faction.textContent=(unit.id===0?'백씨세가 · '+(g.powerLost?'공력 상실 · 회복 0단계 · ':''):'')+side+(ally?(unit.done?' · 행동 완료':' · 행동 가능'):'');
 const detail=document.createElement('p');detail.textContent='체력 '+unit.hp+' / '+unit.max+'　 내공 '+unit.mp+' / '+combatStats(unit)[6]+'\n공격력 '+combatStats(unit)[0]+'　 방어력 '+combatStats(unit)[1]+'\n이동 '+(ally?4:g.n===4&&g.turn===1&&unit.id===32?0:3)+'칸　 일반 공격 '+(unit.id===5?'거리 1~4칸':[7,10].includes(unit.id)?'직선 1~2칸':'상하좌우 1칸')+(arts[unit.id]?'\n무공: '+arts[unit.id][0]+' · 내공 '+arts[unit.id][1]+(unit.id===6?' · 다음 공격 약화':[7,10].includes(unit.id)?' · 직선 관통':unit.id===11?' · 대각선 포함':unit.id===9?' · 강타':unit.id===8?' · 강한 장력':''):'');
 const body=document.createElement('div');body.append(faction,head,detail);
 const list=document.createElement('div');list.className='orders';
 const close=()=>{$('modal').hidden=true};
 function order(label,fn,off=false){list.append(btn(label,()=>{close();fn()},off))}
 if(command){
  order('이동',()=>{g.step='move';g.log='이동할 칸을 선택하세요.';battleUI()},!!g.origin);
  order('공격',()=>{g.step='attack';g.log='공격할 적을 선택하세요.';battleUI()},!live().some(v=>valid(unit,v,false)));
  const art=artFor(unit),learned=availableArts(unit).length>0;
  order('무공',()=>chooseArt(unit),!learned);
  order('대기',()=>{g.log=P[unit.id][0]+' 대기.';finish()});
  if(g.origin)order('이동 취소',()=>{[unit.x,unit.y]=g.origin;g.origin=null;g.step='move';battleUI();});
 }else if(unit.side==='foe'){
  order('공격 범위',()=>{inspectedUnit=unit;battleUI();})
 }
 order('닫기',()=>{});box.append(portrait,body,list);$('modal').replaceChildren(box);$('modal').hidden=false
}
function centerSelectedUnit(unit){
 const field=$('field'),map=$('map');
 // Selection is the only action that recenters the viewport.
 field.scrollLeft=Math.max(0,Math.min(map.clientWidth-field.clientWidth,(unit.x+.5)*map.clientWidth/boardWidth()-field.clientWidth/2));
 field.scrollTop=Math.max(0,Math.min(map.clientHeight-field.clientHeight,(unit.y+.5)*map.clientHeight/boardHeight()-field.clientHeight/2));
}
function clickTile(x,y){if(animating)return;closeOrders();let u=sel(),v=at(x,y);if(inspectedUnit){inspectedUnit=null;battleUI();if(v){centerSelectedUnit(v);unitCard(v)}return}
 const targeting=['attack','skill'].includes(g.step);
 if(v&&!(targeting&&valid(u,v,g.step==='skill'))){
  const command=v.side==='ally'&&!v.done&&((g.step==='move')||(g.step==='act'&&u===v));
  if(command){
   const repeated=radialSelection===v.id&&g.id===v.id;
   g.id=v.id;radialSelection=v.id;battleUI();centerSelectedUnit(v);
   if(g.origin||repeated)openOrders(v);
  }else {centerSelectedUnit(v);unitCard(v);}
  return
 }else if(g.step==='move'&&!u.done&&!v&&paths(u,4).has(x+','+y)){sequence(async()=>{g.origin=[u.x,u.y];g.step='act';await walkTo(u,x,y,4);g.step='act';g.log='공격·무공·대기를 선택하세요.';battleUI();unitCard(u,true)})}else if(['attack','skill'].includes(g.step)&&valid(u,v,g.step==='skill')){sequence(async()=>{let magic=g.step==='skill';if(magic&&u.mp<artFor(u)[1])return;if(magic)u.mp-=artFor(u)[1];for(let a of magic?artTargets(u,v):[v]){await clash(u,a,magic?(u.id===9?30:u.id===8?25:u.id===0?artFor(u)[3]:19):6,magic);if(g.mode!=='battle')return}finish()})}}
async function ai(u){
 if(g.n===6&&u.id===1)return;
 if(g.n===9&&u.id===36&&u.hp>0&&u.hp<u.max*.55){
  const foes=live().filter(v=>v.side==='foe');
  if(foes.length){
   const choices=[...paths(u,3)].map(([key,cost])=>{const [x,y]=key.split(',').map(Number);return {x,y,cost,score:Math.min(...foes.map(v=>dist({x,y},v)))}}).sort((a,b)=>b.score-a.score||a.cost-b.cost);
   await walkTo(u,choices[0].x,choices[0].y,3);return
  }
 }
 if(g.n===9&&u.id===26&&u.hp>0&&u.mp>=6){
  const hurt=live().filter(v=>v.side!=='foe'&&v.hp<v.max*.7&&dist(u,v)<=5).sort((a,b)=>a.hp/a.max-b.hp/b.max)[0];
  if(hurt){u.mp-=6;hurt.hp=Math.min(hurt.max,hurt.hp+90);await say(u,'내공으로 상처를 다스리겠소.',600);await say(hurt,'+90',400);battleUI();return}
 }
 if(u.hp<=0||u.hidden||broken(u)||(g.n===4&&g.turn===1&&u.id===32))return;
 let targets=live().filter(v=>enemy(u,v)&&!broken(v));if(!targets.length)return;
 const magic=availableArts(u).length>0&&u.mp>=artFor(u)[1];
 let best=[u.x,u.y],score=Infinity;
 for(let [k,c] of paths(u,3)){let [x,y]=k.split(',').map(Number),pos={...u,x,y};let value=Math.min(...targets.map(v=>inReach(pos,v,magic)?(u.id===5?-dist(pos,v):0):20+dist(pos,v)))*10+c;if(value<score){score=value;best=[x,y]}}
 await walkTo(u,...best,3);let v=targets.filter(a=>valid(u,a,magic)).sort((a,b)=>a.hp-b.hp)[0];
 if(v){if(magic)u.mp-=artFor(u)[1];for(const target of magic?artTargets(u,v):[v]){await clash(u,target,magic?(u.id===9?30:u.id===8?25:19):0,magic);if(g.mode!=='battle')return}}
}
function reveal(v){let old=at(v.x,v.y);if(old){let pos=[...paths(old,8).keys()].find(k=>k!==old.x+','+old.y&&!g.u.some(a=>a.hidden&&a.x+','+a.y===k));if(pos)[old.x,old.y]=pos.split(',').map(Number)}v.hidden=false}
async function endTurn(){inspectedUnit=null;cancelTimer();return sequence(async()=>{if(await forestEvent()||await innerInjuryEvent())return;for(let u of [...live().filter(v=>v.side==='guest'),...live().filter(v=>v.side==='foe')]){await ai(u);if(g.mode!=='battle')return;if(!g.u.find(a=>a.id===0).hp||!live().some(a=>a.side==='foe'))break}g.turn++;g.u.forEach(v=>v.done=false);g.origin=null;g.id=0;g.step='move';g.log='아군의 차례입니다.';if(g.n===4&&g.turn===2&&sel().hp){await raid()}if(!win()){save();battleUI();}})}
function teach(dest){let row=D.chap[1].at(-1);g={mode:'lesson',dest,lesson:0,ch:1,i:D.chap[1].length-1};save();draw()}
function lessonUI(){let lines=[['구처기','떠나기 전에 검 한 수를 주겠소. 삼재검법이라 하오.'],['구처기','천은 찌르고, 지는 가로로 베며, 인은 앞을 휘두르시오. 세 초식이 삼재검법의 기초요.'],['백호연','천, 지, 인…… 발을 디디고 검을 거둔다. 기억하겠습니다.'],['무공 습득','백호연이 삼재검법의 기초를 익혔다. 천(찌르기), 지(가로 세 칸 베기), 인(앞 세 칸 휘두르기)을 무공 메뉴에서 선택한다.']];panel(...lines[g.lesson]);controls('actions',[[g.lesson===3?'추격 시작':'다음 ›',()=>{if(g.lesson<3){g.lesson++;save();lessonUI()}else{g.learned=true;story(g.dest)}}]])}

function battleRender(){let u=sel(),m=$('map'),range=!animating&&!u.done&&radialSelection===u.id&&g.step==='move'?paths(u,4):new Map;const threat=!animating&&inspectedUnit?inspectRange(inspectedUnit):null;m.replaceChildren();m.style.width=(zoom*boardWidth()/26)+'%';m.style.aspectRatio=boardWidth()+'/'+boardHeight();m.style.gridTemplate='repeat('+boardHeight()+',1fr)/repeat('+boardWidth()+',1fr)';m.style.backgroundImage='url('+D.battle[g.n]+')';$('place').textContent=({0:'우가촌 탈출전',3:'역참 추격전',4:'산사의 혈투',6:'숲속 흑풍쌍살전',9:'절벽의 오해'}[g.n])+' · '+g.turn+'턴';for(let y=0;y<boardHeight();y++)for(let x=0;x<boardWidth();x++){let v=at(x,y),b=btn('',()=>clickTile(x,y));b.className='tile'+(!animating&&u===v?' sel':'')+(v?.done?' spent':'')+(v?.side==='foe'?' enemy':v?.side==='guest'?' guest':'')+(!v&&range.has(x+','+y)?' reach':'')+(!animating&&['attack','skill'].includes(g.step)&&valid(u,v,g.step==='skill')?' hit':'');if(!animating&&g.step==='skill'&&u.id===0){const previews=g.heroArt==='human'?skillCells(u):live().filter(v=>valid(u,v,true)).flatMap(v=>skillCells(u,v));if(previews.some(([a,c])=>a===x&&c===y))b.className+=' hit'}if(threat)b.className='tile'+(threat.has(x+','+y)?' danger':'')+(v===inspectedUnit?' source':'')+(v?.side==='foe'?' enemy':'');if(g.n===0&&x>=11&&x<=14&&y>=18)b.style.borderBottom='2px solid #ffdb7c';b.setAttribute('aria-label',v?P[v.id][0]+' 체력 '+v.hp:(x+1)+','+(y+1));if(v){let im=new Image;paint(im,v);b.append(im);if(v.id===146&&g.captive?.taken){let c=new Image;c.src=P[24][2][0];c.style.left='-35%';b.append(c)}let i=document.createElement('i');i.style.width=72*v.hp/v.max+'%';b.append(i)}if(g.captive&&!g.captive.taken&&g.captive.x===x&&g.captive.y===y){let c=new Image;c.src=P[24][2][0];b.append(c)}m.append(b)}panel(P[u.id][0],'체력 '+u.hp+'/'+u.max+'　내공 '+u.mp+'\n'+g.log);tools([['배율 '+zoom+'%',()=>{zoom=zoom===150?100:150;battleUI();}],['턴 종료',()=>popup('남은 행동을 마치고 턴을 종료할까?',[['턴 종료',endTurn],['취소',()=>{}]])]]);if(inspectedUnit){panel(P[inspectedUnit.id][0],'붉은 칸은 이동 후 일반 공격이 닿을 수 있는 위치입니다.');controls('tools',[]);controls('actions',[['범위 닫기',()=>{inspectedUnit=null;battleUI();}]]);return}let act=[];if(!u.done){if(g.step==='move'||g.step==='act'){act.push(['공격',()=>{g.step='attack';g.log='인접한 붉은 칸의 적을 선택하세요.';battleUI()},!live().some(v=>valid(u,v,false))]);if(availableArts(u).length)act.push(['무공',()=>chooseArt(u)]);act.push(['대기',()=>{g.log=P[u.id][0]+' 대기.';finish()}])}if(g.step!=='move')act.push(['취소',()=>{if(g.step==='act'&&g.origin){[u.x,u.y]=g.origin;g.origin=null;g.step='move'}else g.step=g.origin?'act':'move';g.log='행동을 선택하세요.';battleUI()}])}controls('actions',act)}
let radialSelection=null;
function closeOrders(){
 $('radialOrders').hidden=true;
}
function openOrders(unit){
 if(unit.done||unit.side!=='ally')return;
 const menu=$('radialOrders');
 menu.replaceChildren();
 const art=artFor(unit),learned=availableArts(unit).length>0;
 const command=(label,position,fn,disabled=false)=>{
  const button=btn(label,()=>{if(animating)return;closeOrders();fn()},disabled);
  button.className='radialOrder '+position;menu.append(button)
 };
 command('공격','north',()=>{g.step='attack';battleUI()},!live().some(v=>valid(unit,v,false)));
 command('무공','east',()=>chooseArt(unit),!learned||(unit.id!==0&&(unit.mp<art[1]||!live().some(v=>valid(unit,v,true)))));
 command('대기','south',()=>{g.log=P[unit.id][0]+' 대기.';finish()});
 command(g.origin?'이동 취소':'닫기','west',()=>{
  if(g.origin){[unit.x,unit.y]=g.origin;g.origin=null;g.step='move';battleUI();}
 });
 menu.setAttribute('aria-label',P[unit.id][0]+' 행동 명령');
 
 menu.hidden=false;
 const field=$('field'),map=$('map');
 const radius=field.clientWidth*.13;
 const centerX=(unit.x+.5)*map.clientWidth/boardWidth()-field.scrollLeft;
 const centerY=(unit.y+.5)*map.clientHeight/boardHeight()-field.scrollTop;
 menu.style.left=Math.max(radius,Math.min(field.clientWidth-radius,centerX))+'px';
 menu.style.top=(field.offsetTop+Math.max(radius,Math.min(field.clientHeight-radius,centerY)))+'px';
}
function battleUI(){
 closeOrders();$('frame').classList.add('battle');
 battleRender();
 const actions=$('tools');
 if(inspectedUnit){
  controls('tools',[['범위 닫기',()=>{inspectedUnit=null;battleUI();}]]);
 }else if(['attack','skill'].includes(g.step)){
  actions.append(btn(g.step==='skill'&&artFor(sel())?artFor(sel())[0]+' 취소':'공격 취소',()=>{
   g.step=g.origin?'act':'move';battleUI();openOrders(sel())
  }));
 }else if(!sel().done){
  actions.append(btn('명령',()=>openOrders(sel())));
 }
}


function currentMap(){return [3,4].includes(g.n)&&g.mapFormat!==2?T['legacy'+g.n]:T[g.n]}
function boardWidth(){return currentMap().width||26}
function boardHeight(){return currentMap().height||22}
function combatStats(unit){const values=currentMap().stats?.[unit.id]||stats[unit.id];if(unit.id===0&&g.powerLost){const v=[...values];v[0]=Math.max(10,Math.round(v[0]*.45));v[6]=0;return v}return values}
async function chapterBattleIntro(n){
 const unit=id=>g.u.find(u=>u.id===id);
 if(n===6){
  await say(unit(5),'흑풍쌍살! 악행을 끝낼 때다. 각오해라!',2200);
  await say(unit(0),'저도 돕겠습니다. 정아를 지켜 주십시오!',1800);
  await say(unit(33),'감히 우리를 막겠다고?',1500);
 }else{
  await say(unit(0),'매초풍! 여기서 또 무슨 짓이냐!',1900);
  await say(unit(5),'정아! 더 이상 너를 제자라 할 수 없다. 죽은 사부가 통탄할 것이다!',2800);
  await say(unit(36),'사부님, 오해입니다! 저는 이 사람에게 배운 적이 없어요!',2300);
  await say(unit(26),'멈추시오. 이 아이에게 내공을 가르친 사람은 빈도, 마옥이오.',2400);
  await say(unit(34),'전진교 도사까지 왔구나. 모두 덤벼라!',1800);
  await say(unit(0),'먼저 매초풍을 막읍시다. 자세한 이야기는 그 뒤에!',2000);
 }
}
layouts.forest={0:[30,77],1:[36,88],5:[18,66],6:[29,62],7:[40,62],8:[51,62],9:[18,85],10:[49,84],11:[60,80],33:[74,64],34:[85,76]};
layouts.cliff={0:[32,78],36:[52,72],26:[65,65],34:[79,78],5:[17,68],6:[20,85],7:[34,62],8:[46,88],9:[60,88],11:[73,90]};
layouts['133']={0:[30,78],1:[49,80],36:[49,80],24:[65,68],35:[60,80],5:[15,63],6:[25,60],7:[35,60],8:[45,60],9:[17,88],10:[64,87],11:[76,80]};

bootResources();document.addEventListener('keydown',e=>{if(g.mode==='lesson'&&e.key==='ArrowRight'&&$('modal').hidden&&$('title').hidden){$('actions').querySelector('button').click();return}if(g.mode==='story'&&$('modal').hidden&&$('title').hidden&&e.key==='ArrowRight')next()});

$('field').addEventListener('touchmove',closeOrders,{passive:true});
