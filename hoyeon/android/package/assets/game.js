const D={chap,bg,players,battle};
const $=s=>document.getElementById(s),P=D.players,key='hoyeon-landscape-2';let g={},zoom=175;
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
 boss.x=22;boss.y=6;g.u.filter(a=>a.hidden).forEach(reveal);
 const [x,y]=nearest(boss,{x:21,y:5});g.captive={id:24,x,y};battleUI();
 await walkTo(boss,...nearest(boss,master),80);face(boss,master.x-boss.x,master.y-boss.y);face(master,boss.x-master.x,boss.y-master.y);battleUI();
 paint(tile(boss).querySelector('img'),boss,'attack');await say(master,'단 장군…… 자네가 어찌!',1300);
 master.hp=0;battleUI();await say(boss,'이걸로 신세는 갚았소. 흐흐.',1850);
 await walkTo(boss,...nearest(boss,g.captive),80);await say(g.captive,'이 손 놓으시오!',1150);
 g.captive.taken=true;battleUI();const exit=nearest(boss,{x:25,y:5});await walkTo(boss,...exit,80);
 boss.hidden=true;delete g.captive;battleUI();await say(hero,'이평 아주머니! 단천덕, 거기 서라!',1650);
 const steps=route(hero,...nearest(hero,{x:exit[0],y:exit[1]}),80).slice(0,3);
 if(steps.length)await walkTo(hero,...steps.at(-1),3);
 g.log='단천덕이 이평을 데리고 달아났다. 길을 막은 송군을 돌파하라.'
}

function titleScreen(){closeOrders();$('frame').classList.remove('battle');$('title').hidden=false;$('title').style.backgroundImage='linear-gradient(90deg,#17251ddd,transparent),url('+D.bg.title+')';let saved;try{saved=JSON.parse(localStorage.getItem(key))}catch{}controls('start',[['새 이야기',()=>{if(saved)popup('기존 저장을 새 이야기로 바꿀까?',[['새로 시작',()=>story(0)],['취소',()=>{}]]);else story(0)}],['이어하기',()=>{g=saved;draw()},!saved],['리소스 업데이트',()=>checkResources(true)],...(typeof window!=='undefined'&&window.hoyeonRegistration?.waiting?[['새 패치 적용',()=>{navigator.serviceWorker.addEventListener('controllerchange',()=>location.reload(),{once:true});window.hoyeonRegistration.waiting.postMessage('activate')}]]:[])]);checkResources()}
function story(ch,i=0){g={mode:'story',ch,i,learned:ch===0?false:!!g.learned};save();draw()}
function draw(){closeOrders();$('frame').classList.remove('battle');inspectedUnit=null;$('title').hidden=true;$('scene').hidden=g.mode==='battle';$('field').hidden=g.mode!=='battle';if(g.mode==='battle'){battleUI();focusUnit();return}let [bg,place,cast,w,t]=D.chap[g.ch][g.i];if(g.ch===2)bg=place.includes('객잔')?'inn':'west';if(g.ch===3&&bg===129)bg='reed';$('place').textContent=place;$('scene').style.backgroundImage='url('+D.bg[bg]+')';$('scene').replaceChildren();let lay=layouts[bg];for(let [id,x,y,d,pose] of [...cast].sort((a,b)=>(lay[a[0]]?.[1]||0)-(lay[b[0]]?.[1]||0))){let [u,v]=lay[id]||[50,70],im=new Image();let speaker=cast.find(a=>P[a[0]][0]===w),others=cast.filter(a=>a[0]!==id),target=others.find(a=>a===speaker)||others.sort((a,b)=>Math.abs((lay[a[0]]||[50])[0]-u)-Math.abs((lay[b[0]]||[50])[0]-u))[0],lookRight=target?(lay[target[0]]||[50])[0]>u:false;im.className='actor';im.alt=P[id][0];im.src=P[id][2][pose===99?6:(pose===1?1:pose===11?2:0)];im.style.cssText='left:'+u+'%;top:'+v+'%;height:23%;transform:translate(-50%,-100%) scaleX('+(lookRight?-1:1)+')';if(w===P[id][0])im.classList.add('speaking');if(bg===131&&id===146&&t.includes('뒤채로 들었다'))im.classList.add('exitBack');$('scene').append(im)}tools();panel(w||'이야기',t);controls('actions',[['다음 ›',next]]);if(g.mode==='lesson')lessonUI()}
function next(){if(g.i+1<D.chap[g.ch].length)return story(g.ch,g.i+1);if(g.ch===1)return popup('누구를 구하러 갈까?',[['곽소천',()=>teach(3)],['양철심',()=>teach(2)]]);if([0,3,4].includes(g.ch))return fight(g.ch);popup('이번 분기의 이야기를 마쳤어.',[['갈림길로',()=>story(1)],['제목으로',titleScreen]])}
const dist=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y),near=(a,b)=>Math.max(Math.abs(a.x-b.x),Math.abs(a.y-b.y)),live=()=>g.u.filter(u=>u.hp>0&&!u.hidden),at=(x,y)=>live().find(a=>a.x===x&&a.y===y),sel=()=>g.u.find(a=>a.id===g.id),enemy=(a,b)=>(a.side==='foe')!==(b.side==='foe');
function fight(n){radialSelection=null;g={mode:'battle',n,learned:!!g.learned,turn:1,u:T[n].cast.map(([id,x,y,side,hidden])=>({id,x,y,side,hidden,hp:stats[id][5],max:stats[id][5],mp:stats[id][6],done:false})),id:0,step:'move',log:n===0?'호연을 남쪽 중앙 출구로 보내거나 적을 전멸시키세요.':n===3?'단천덕이 남겨 둔 병사를 모두 격퇴하세요.':'초목대사가 산문을 막아섰다.'};save();draw();sequence(async()=>{let h=sel(),v=g.u.find(a=>a.id===(n===0?146:n===4?32:474));await say(v,n===0?'왕명이다! 반역자를 잡아라!':n===4?'산문을 넘으려거든 나를 먼저 넘으시오.':'역참을 막아라!',1600);await say(h,n===0?'남쪽 길을 엽시다!':n===4?'저는 피를 보러 온 것이 아닙니다!':'단천덕, 각오해라!',1400);focusUnit()})}
function paths(u,limit){let q=[[u.x,u.y,0]],s=new Map([[u.x+','+u.y,0]]);for(let j=0;j<q.length;j++){let [x,y,c]=q[j];for(let [a,b] of [[x-1,y],[x+1,y],[x,y-1],[x,y+1]]){let i=b*26+a,k=a+','+b;if(a<0||a>=26||b<0||b>=22||T[g.n].tiles[i]===6||s.has(k)||at(a,b))continue;let n=c+1;if(n<=limit){s.set(k,n);q.push([a,b,n])}}}return s}
function focusUnit(){let u=sel()||g.u[0],f=$('field'),m=$('map');f.scrollLeft=(u.x+.5)*m.clientWidth/26-f.clientWidth/2;f.scrollTop=(u.y+.5)*m.clientHeight/22-f.clientHeight/2}
const arts={0:['삼재검법',5],21:['찌르기',4],22:['양가창법',12],23:['전진검법',8]};
function valid(u,v,spell){if(spell&&u.id===22)return v===u&&live().some(a=>enemy(u,a)&&near(u,a)===1);return v&&enemy(u,v)&&(spell&&u.id===23?near(u,v)===1:dist(u,v)===1)}
function damage(u,v,boost){if(g.n===4&&g.turn===1&&v.id===32)return 0;let hit=Math.max(8,Math.round(stats[u.id][0]*.70-stats[v.id][1]*.24+boost));v.hp=Math.max(0,v.hp-hit);return hit}
function finish(){let u=sel();u.done=true;g.origin=null;g.step='move';if(!win()){let v=live().find(v=>v.side==='ally'&&!v.done);if(v)g.id=v.id;save();battleUI();if(!v)completedTurn()}}
function win(){let h=g.u.find(x=>x.id===0);if(h.hp===0||g.turn>(g.n===0?12:18)){popup('호연 일행이 돌파하지 못했다.',[['재도전',()=>fight(g.n)],['제목으로',titleScreen]]);return true}if((g.n===0&&h.x>=11&&h.x<=14&&h.y>=18)||(!live().some(v=>v.side==='foe')&&(g.n!==4||g.turn>=2))){popup(g.n===0?'남쪽 길이 열렸다. 연기 속에서 일행이 흩어졌다.':g.n===3?'단천덕의 말이 사라졌다. 발굽 자국이 산사로 이어진다.':'송군이 물러섰다. 호연은 이평을 구하러 동문을 나섰다.',[['이야기 계속',()=>story(g.n===0?1:g.n+1)]]);return true}return false}
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
let animating=false, ticker=0;
function cancelTimer(){clearTimeout(ticker);ticker=0}
function completedTurn(){popup('아군이 모두 행동했습니다. 턴을 끝내겠습니까?',[['턴 종료',()=>{cancelTimer();endTurn()}],['자동 종료 취소',cancelTimer]]);const yes=$('modal').querySelector('button');let left=4;function tick(){yes.textContent='턴 종료 ('+left+'초)';if(left--===0){$('modal').hidden=true;endTurn();return}ticker=setTimeout(tick,1000)}tick()}
function camera(u){let f=$('field'),m=$('map');f.scrollLeft=(u.x+.5)*m.clientWidth/26-f.clientWidth/2;f.scrollTop=(u.y+.5)*m.clientHeight/22-f.clientHeight/2}
function tile(u){return $('map').children[u.y*26+u.x]}
async function say(u,text,ms=1350){if(!u)return;camera(u);let cell=tile(u);let b=document.createElement('span');b.className='bubble'+(u.x<4?' left':u.x>21?' right':'');b.textContent=text;cell.append(b);panel(P[u.id][0],text);await sleep(ms);b.remove()}
function route(u,x,y,lim){let costs=paths(u,lim),out=[],c=costs.get(x+','+y);if(c===undefined)return [];while(c>0){out.unshift([x,y]);let prev=[[x-1,y],[x+1,y],[x,y-1],[x,y+1]].find(([a,b])=>costs.get(a+','+b)===c-1);[x,y]=prev;c--}return out}
async function walkTo(u,x,y,lim){let steps=route(u,x,y,lim);for(let i=0;i<steps.length;i++){let [a,b]=steps[i],dx=a-u.x,dy=b-u.y;face(u,dx,dy);let img=tile(u).querySelector('img');if(img){let flip=paint(img,u,'walk',i);img.style.transition='none';img.style.zIndex='4';img.style.transition='transform 175ms linear';img.getBoundingClientRect();let shift='translate('+dx*100+'%,'+dy*100+'%)';img.style.transform=shift+' scaleX('+flip+')';if(u.id===146&&g.captive?.taken){let c=tile(u).children[1];c.style.transition=img.style.transition;c.style.transform=shift}}await sleep(185);u.x=a;u.y=b;battleUI();camera(u)}}
async function blow(u,v,power,label){face(u,v.x-u.x,v.y-u.y);face(v,u.x-v.x,u.y-v.y);battleUI();camera(u);let im=tile(u).querySelector('img');if(im)paint(im,u,'attack');await say(u,label,330);let amt=damage(u,v,power);await say(v,amt?'−'+amt:'막아냈다',350);battleUI();return amt}
async function clash(u,v,power,magic=false){let n=await blow(u,v,power,magic?arts[u.id][0]:'공격');let result=P[u.id][0]+' → '+P[v.id][0]+'  −'+n;if(!magic&&v.hp>0&&u.hp>0&&dist(u,v)===1){let ret=await blow(v,u,-5,'반격!');result+=' · 반격 −'+ret}g.log=result}
async function sequence(fn){if(animating)return;animating=true;$('frame').classList.add('busy');try{await fn()}finally{animating=false;$('frame').classList.remove('busy')}}
let inspectedUnit=null;
function inspectRange(unit){
 const reach=new Set();
 const limit=g.n===4&&g.turn===1&&unit.id===32?0:3;
 for(const cell of paths(unit,limit).keys()){
  const [x,y]=cell.split(',').map(Number);
  for(const [a,b] of [[x-1,y],[x+1,y],[x,y-1],[x,y+1]]){
   if(a>=0&&a<26&&b>=0&&b<22&&T[g.n].tiles[b*26+a]!==6)reach.add(a+','+b);
  }
 }
 return reach
}
function unitCard(unit,command=false){
 if(command){openOrders(unit);return}
 const ally=unit.side==='ally',side=ally?'아군':unit.side==='foe'?'적군':'우군';
 const box=document.createElement('section');box.className='unitCard';box.setAttribute('role','dialog');box.setAttribute('aria-label',P[unit.id][0]+' 부대 정보');
 const portrait=new Image();portrait.src=P[unit.id][1];portrait.alt='';
 const head=document.createElement('h2');head.textContent=P[unit.id][0];
 const faction=document.createElement('small');faction.textContent=side+(ally?(unit.done?' · 행동 완료':' · 행동 가능'):'');
 const detail=document.createElement('p');detail.textContent='체력 '+unit.hp+' / '+unit.max+'　 내공 '+unit.mp+' / '+stats[unit.id][6]+'\n공격력 '+stats[unit.id][0]+'　 방어력 '+stats[unit.id][1]+'\n이동 '+(ally?4:g.n===4&&g.turn===1&&unit.id===32?0:3)+'칸　 일반 공격 상하좌우 1칸';
 const body=document.createElement('div');body.append(faction,head,detail);
 const list=document.createElement('div');list.className='orders';
 const close=()=>{$('modal').hidden=true};
 function order(label,fn,off=false){list.append(btn(label,()=>{close();fn()},off))}
 if(command){
  order('이동',()=>{g.step='move';g.log='이동할 칸을 선택하세요.';battleUI()},!!g.origin);
  order('공격',()=>{g.step='attack';g.log='공격할 적을 선택하세요.';battleUI()},!live().some(v=>valid(unit,v,false)));
  const art=arts[unit.id],learned=art&&(unit.id!==0||(g.learned??g.n!==0));
  order(learned?'무공 · '+art[0]:'무공',()=>{g.step='skill';g.log=unit.id===22?'자신의 칸을 눌러 양가창법을 펼치세요.':'무공을 사용할 적을 선택하세요.';battleUI()},!learned||unit.mp<art[1]||!live().some(v=>valid(unit,v,true)));
  order('대기',()=>{g.log=P[unit.id][0]+' 대기.';finish()});
  if(g.origin)order('이동 취소',()=>{[unit.x,unit.y]=g.origin;g.origin=null;g.step='move';battleUI();focusUnit()});
 }else if(unit.side==='foe'){
  order('공격 범위',()=>{inspectedUnit=unit;battleUI();camera(unit)})
 }
 order('닫기',()=>{});box.append(portrait,body,list);$('modal').replaceChildren(box);$('modal').hidden=false
}
function clickTile(x,y){if(animating)return;closeOrders();let u=sel(),v=at(x,y);if(inspectedUnit){inspectedUnit=null;battleUI();if(v)unitCard(v);return}
 const targeting=['attack','skill'].includes(g.step);
 if(v&&!(targeting&&valid(u,v,g.step==='skill'))){
  const command=v.side==='ally'&&!v.done&&((g.step==='move')||(g.step==='act'&&u===v));
  if(command){
   const repeated=radialSelection===v.id&&g.id===v.id;
   g.id=v.id;radialSelection=v.id;battleUI();
   if(g.origin||repeated)openOrders(v);
  }else unitCard(v);
  return
 }else if(g.step==='move'&&!u.done&&!v&&paths(u,4).has(x+','+y)){sequence(async()=>{g.origin=[u.x,u.y];await walkTo(u,x,y,4);g.step='act';g.log='공격·무공·대기를 선택하세요.';battleUI();unitCard(u,true)})}else if(['attack','skill'].includes(g.step)&&valid(u,v,g.step==='skill')){sequence(async()=>{let magic=g.step==='skill';if(magic)u.mp-=arts[u.id][1];for(let a of magic&&u.id===22?live().filter(a=>enemy(u,a)&&near(u,a)===1):[v])await clash(u,a,magic?(u.id===0?12:19):6,magic);finish()})}}
async function ai(u){if(u.hp<=0||(g.n===4&&g.turn===1&&u.id===32))return;let targets=live().filter(v=>enemy(u,v));if(!targets.length)return;let best=[u.x,u.y],score=Infinity;for(let [k,c] of paths(u,3)){let [x,y]=k.split(',').map(Number),s=Math.min(...targets.map(v=>dist({x,y},v)))*10+c;if(s<score){score=s;best=[x,y]}}await walkTo(u,...best,3);let v=targets.filter(a=>dist(u,a)===1).sort((a,b)=>a.hp-b.hp)[0];if(v)await clash(u,v,0)}
function reveal(v){let old=at(v.x,v.y);if(old){let pos=[...paths(old,8).keys()].find(k=>k!==old.x+','+old.y&&!g.u.some(a=>a.hidden&&a.x+','+a.y===k));if(pos)[old.x,old.y]=pos.split(',').map(Number)}v.hidden=false}
async function endTurn(){inspectedUnit=null;cancelTimer();return sequence(async()=>{for(let u of [...live().filter(v=>v.side==='guest'),...live().filter(v=>v.side==='foe')]){await ai(u);if(!g.u.find(a=>a.id===0).hp||!live().some(a=>a.side==='foe'))break}g.turn++;g.u.forEach(v=>v.done=false);g.origin=null;g.id=0;g.step='move';g.log='아군의 차례입니다.';if(g.n===4&&g.turn===2&&sel().hp){await raid()}if(!win()){save();battleUI();focusUnit()}})}
function teach(dest){let row=D.chap[1].at(-1);g={mode:'lesson',dest,lesson:0,ch:1,i:D.chap[1].length-1};save();draw()}
function lessonUI(){let lines=[['구처기','떠나기 전에 검 한 수를 주겠소. 삼재검법이라 하오.'],['구처기','천·지·인 세 자세요. 오늘은 자세를 잇는 기초만 익히시오.'],['호연','천, 지, 인…… 발을 디디고 검을 거둔다. 기억하겠습니다.'],['무공 습득','호연이 삼재검법의 기초를 익혔다. 인접한 적 한 명을 공격한다. 소모 내공 5.']];panel(...lines[g.lesson]);controls('actions',[[g.lesson===3?'추격 시작':'다음 ›',()=>{if(g.lesson<3){g.lesson++;save();lessonUI()}else{g.learned=true;story(g.dest)}}]])}

function battleRender(){let u=sel(),m=$('map'),range=!u.done&&g.step==='move'?paths(u,4):new Map;const threat=inspectedUnit?inspectRange(inspectedUnit):null;m.replaceChildren();m.style.width=zoom+'%';m.style.backgroundImage='url('+D.battle[g.n]+')';$('place').textContent=({0:'우가촌 탈출전',3:'역참 추격전',4:'산사의 혈투'}[g.n])+' · '+g.turn+'턴';for(let y=0;y<22;y++)for(let x=0;x<26;x++){let v=at(x,y),b=btn('',()=>clickTile(x,y));b.className='tile'+(u===v?' sel':'')+(v?.done?' spent':'')+(v?.side==='foe'?' enemy':v?.side==='guest'?' guest':'')+(!v&&range.has(x+','+y)?' reach':'')+(['attack','skill'].includes(g.step)&&valid(u,v,g.step==='skill')?' hit':'');if(threat)b.className='tile'+(threat.has(x+','+y)?' danger':'')+(v===inspectedUnit?' source':'')+(v?.side==='foe'?' enemy':'');if(g.n===0&&x>=11&&x<=14&&y>=18)b.style.borderBottom='2px solid #ffdb7c';b.setAttribute('aria-label',v?P[v.id][0]+' 체력 '+v.hp:(x+1)+','+(y+1));if(v){let im=new Image;paint(im,v);b.append(im);if(v.id===146&&g.captive?.taken){let c=new Image;c.src=P[24][2][0];c.style.left='-35%';b.append(c)}let i=document.createElement('i');i.style.width=72*v.hp/v.max+'%';b.append(i)}if(g.captive&&!g.captive.taken&&g.captive.x===x&&g.captive.y===y){let c=new Image;c.src=P[24][2][0];b.append(c)}m.append(b)}panel(P[u.id][0],'체력 '+u.hp+'/'+u.max+'　내공 '+u.mp+'\n'+g.log);tools([['배율 '+zoom+'%',()=>{zoom=zoom===175?100:175;battleUI();focusUnit()}],['턴 종료',()=>popup('남은 행동을 마치고 턴을 종료할까?',[['턴 종료',endTurn],['취소',()=>{}]])]]);if(inspectedUnit){panel(P[inspectedUnit.id][0],'붉은 칸은 이동 후 일반 공격이 닿을 수 있는 위치입니다.');controls('tools',[]);controls('actions',[['범위 닫기',()=>{inspectedUnit=null;battleUI();focusUnit()}]]);return}let act=[];if(!u.done){if(g.step==='move'||g.step==='act'){act.push(['공격',()=>{g.step='attack';g.log='인접한 붉은 칸의 적을 선택하세요.';battleUI()},!live().some(v=>valid(u,v,false))]);if(arts[u.id]&&(u.id!==0||(g.learned??g.n!==0)))act.push([arts[u.id][0],()=>{g.step='skill';g.log=u.id===22?'자신의 칸을 눌러 주변 적을 공격하세요.':'대상 칸을 선택하세요.';battleUI()},u.mp<arts[u.id][1]||!live().some(v=>valid(u,v,true))]);act.push(['대기',()=>{g.log=P[u.id][0]+' 대기.';finish()}])}if(g.step!=='move')act.push(['취소',()=>{if(g.step==='act'&&g.origin){[u.x,u.y]=g.origin;g.origin=null;g.step='move'}else g.step=g.origin?'act':'move';g.log='행동을 선택하세요.';battleUI()}])}controls('actions',act)}
let radialSelection=null;
function closeOrders(){
 $('radialOrders').hidden=true;
}
function openOrders(unit){
 if(unit.done||unit.side!=='ally')return;
 const menu=$('radialOrders');
 menu.replaceChildren();
 const art=arts[unit.id],learned=art&&(unit.id!==0||(g.learned??g.n!==0));
 const command=(label,position,fn,disabled=false)=>{
  const button=btn(label,()=>{if(animating)return;closeOrders();fn()},disabled);
  button.className='radialOrder '+position;menu.append(button)
 };
 command('공격','north',()=>{g.step='attack';battleUI()},!live().some(v=>valid(unit,v,false)));
 command('무공','east',()=>{g.step='skill';battleUI()},!learned||unit.mp<art[1]||!live().some(v=>valid(unit,v,true)));
 command('대기','south',()=>{g.log=P[unit.id][0]+' 대기.';finish()});
 command(g.origin?'이동 취소':'닫기','west',()=>{
  if(g.origin){[unit.x,unit.y]=g.origin;g.origin=null;g.step='move';battleUI();focusUnit()}
 });
 menu.setAttribute('aria-label',P[unit.id][0]+' 행동 명령');
 camera(unit);
 menu.hidden=false;
 const field=$('field'),map=$('map');
 const radius=field.clientWidth*.13;
 const centerX=(unit.x+.5)*map.clientWidth/26-field.scrollLeft;
 const centerY=(unit.y+.5)*map.clientHeight/22-field.scrollTop;
 menu.style.left=Math.max(radius,Math.min(field.clientWidth-radius,centerX))+'px';
 menu.style.top=(field.offsetTop+Math.max(radius,Math.min(field.clientHeight-radius,centerY)))+'px';
}
function battleUI(){
 closeOrders();$('frame').classList.add('battle');
 battleRender();
 const actions=$('tools');
 if(inspectedUnit){
  controls('tools',[['범위 닫기',()=>{inspectedUnit=null;battleUI();focusUnit()}]]);
 }else if(['attack','skill'].includes(g.step)){
  actions.append(btn(g.step==='skill'&&arts[sel().id]?arts[sel().id][0]+' 취소':'공격 취소',()=>{
   g.step=g.origin?'act':'move';battleUI();openOrders(sel())
  }));
 }else if(!sel().done){
  actions.append(btn('명령',()=>openOrders(sel())));
 }
}

bootResources();document.addEventListener('keydown',e=>{if(g.mode==='lesson'&&e.key==='ArrowRight'&&$('modal').hidden&&$('title').hidden){$('actions').querySelector('button').click();return}if(g.mode==='story'&&$('modal').hidden&&$('title').hidden&&e.key==='ArrowRight')next()});

$('field').addEventListener('touchmove',closeOrders,{passive:true});
