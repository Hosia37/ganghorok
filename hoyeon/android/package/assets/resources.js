const RESOURCE_BASE=1, ENGINE_VERSION=5;
const patchOrigin='https://raw.githubusercontent.com/Hosia37/ganghorok/hoyeon/patch-baseline/hoyeon/android/';
let resourceVersion=RESOURCE_BASE, resourceBusy=false, resourceDatabase, resourceChecked=false;
function resourceDB(){
 if(resourceDatabase)return Promise.resolve(resourceDatabase);
 return new Promise((resolve,reject)=>{
  const request=indexedDB.open('hoyeon-resources',1);
  request.onupgradeneeded=()=>request.result.createObjectStore('active');
  request.onerror=()=>reject(request.error);
  request.onsuccess=()=>{resourceDatabase=request.result;resolve(resourceDatabase)}
 })
}
async function resourceRecord(value){
 const db=await resourceDB();
 return new Promise((resolve,reject)=>{
  const tx=db.transaction('active',value?'readwrite':'readonly'),store=tx.objectStore('active');
  const request=value?store.put(value,'release'):store.get('release');
  let result;
  request.onsuccess=()=>{result=request.result};
  tx.oncomplete=()=>resolve(result);tx.onabort=tx.onerror=()=>reject(tx.error||Error('저장 실패'))
 })
}
function loadResourceScript(file,callback){
 return new Promise((resolve,reject)=>{
  const script=document.createElement('script');
  const timer=setTimeout(()=>done(Error('연결 시간 초과')),20000);
  function done(error,value){
   clearTimeout(timer);script.remove();window[callback]=()=>{};
   if(error)reject(error);else resolve(value)
  }
  window[callback]=value=>done(null,value);
  script.onerror=()=>done(Error('다운로드 실패'));
  script.src=patchOrigin+file+'?t='+Date.now();document.head.append(script)
 })
}
function safeResource(value){
 if(Array.isArray(value))return value.every(safeResource);
 if(value&&typeof value==='object')return Object.entries(value).every(([key,v])=>!['__proto__','prototype','constructor'].includes(key)&&safeResource(v));
 return value===null||typeof value==='string'||typeof value==='boolean'||(typeof value==='number'&&Number.isFinite(value))
}
function validateResource(release){
 if(!release||!Number.isInteger(release.version)||release.version<RESOURCE_BASE||release.engine!==ENGINE_VERSION||!safeResource(release))throw Error('호환되지 않는 리소스');
 const groups={chap:D.chap,bg:D.bg,players:D.players,battle:D.battle,terrain:T,stats};
 for(const [name,entries] of Object.entries(release.data||{})){
  if(!Object.hasOwn(groups,name)||!entries||Array.isArray(entries)||typeof entries!=='object')throw Error('잘못된 데이터 종류');
  for(const [id,row] of Object.entries(entries)){
   if(!Object.hasOwn(groups[name],id))throw Error('새 데이터는 앱 업데이트가 필요합니다');
   if(name==='stats'&&(!Array.isArray(row)||row.length<7||!row.every(n=>Number.isFinite(n)&&n>=0)))throw Error('잘못된 능력치');
   if(name==='players'&&(!Array.isArray(row)||row.length<7||typeof row[0]!=='string'||!Array.isArray(row[2])||!Array.isArray(row[6])))throw Error('잘못된 인물 데이터');
   if(name==='chap'&&(!Array.isArray(row)||row.length!==groups.chap[id].length||!row.every(r=>Array.isArray(r)&&r.length===5&&Array.isArray(r[2])&&typeof r[3]==='string'&&typeof r[4]==='string')))throw Error('기존 저장과 호환되지 않는 장면');
   if(name==='terrain'&&(!row||!Array.isArray(row.tiles)||row.tiles.length!==572||!Array.isArray(row.cast)))throw Error('잘못된 전장');
   if((name==='bg'||name==='battle')&&typeof row!=='string')throw Error('잘못된 배경');
  }
 }
 for(const [path,image] of Object.entries(release.assets||{})){
  if(!/^assets\/[\w/.-]+\.(png|jpg|jpeg|webp)$/.test(path)||path.includes('..')||typeof image!=='string'||!/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(image))throw Error('잘못된 이미지');
 }
 if(JSON.stringify(release).length>60000000)throw Error('패치 용량 초과')
}
async function checkImages(release){
 for(const url of Object.values(release.assets||{})){
  await new Promise((resolve,reject)=>{
   const img=new Image(),timer=setTimeout(()=>reject(Error('이미지 확인 시간 초과')),10000);
   img.onload=()=>{clearTimeout(timer);resolve()};img.onerror=()=>{clearTimeout(timer);reject(Error('이미지 손상'))};img.src=url
  })
 }
}
function applyResource(release){
 const groups={chap:D.chap,bg:D.bg,players:D.players,battle:D.battle,terrain:T,stats};
 const assets=release.assets||{};
 function resolve(value){
  if(typeof value==='string')return assets[value]||value;
  if(Array.isArray(value))return value.map(resolve);
  if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,resolve(v)]));
  return value
 }
 for(const [group,obj] of Object.entries(groups)){
  const candidate=resolve({...obj,...(release.data?.[group]||{})});
  for(const [key,value] of Object.entries(candidate))obj[key]=value
 }
 resourceVersion=release.version
}
async function bootResources(){
 let warning=false;
 try{
  const record=await resourceRecord();
  if(record){validateResource(record);await checkImages(record);applyResource(record)}
 }catch{warning=true}
 titleScreen();
 if(warning)popup('저장된 리소스를 불러오지 못해 기본 리소스로 시작했습니다.',[['확인',()=>{}]])
}
async function installResources(info){
 if(resourceBusy)return;
 resourceBusy=true;popup('리소스를 내려받는 중입니다. 게임을 종료하지 말아 주세요.',[]);
 try{
  const release=await loadResourceScript(info.file,'hoyeonResourcePayload');
  validateResource(release);
  if(release.version!==info.version)throw Error('리소스 버전 불일치');
  await checkImages(release);
  await resourceRecord(release);
  popup('리소스 업데이트가 완료됐습니다.\n다시 시작하면 적용됩니다.',[['다시 시작',()=>location.reload()]])
 }catch{
  popup('리소스 업데이트에 실패했습니다. 기존 버전으로 계속할 수 있습니다.',[['닫기',()=>{}]])
 }finally{resourceBusy=false}
}
async function checkResources(manual=false){
 if(resourceBusy||(!manual&&resourceChecked))return;
 resourceChecked=true;resourceBusy=true;
 try{
  const info=await loadResourceScript('resources-latest.js','hoyeonResourceManifest');
  if($('title').hidden)return;
  if(!info||!Number.isInteger(info.version)||!Number.isInteger(info.engine)||!/^releases\/[a-zA-Z0-9_-]+\.js$/.test(info.file))throw Error('잘못된 패치 정보');
  if(info.engine>ENGINE_VERSION){
   popup('새 리소스를 사용하려면 앱 업데이트가 필요합니다.',[['앱 업데이트 확인',()=>checkUpdate(true)],['닫기',()=>{}]]);
  }else if(info.version>resourceVersion){
   popup('새 리소스 R'+info.version+'가 있습니다.\n다운로드하여 업데이트하시겠습니까?',[
    ['업데이트',()=>installResources(info)],['나중에',()=>{}]
   ])
  }else if(manual)popup('최신 리소스입니다. R'+resourceVersion,[['닫기',()=>{}]])
 }catch{
  if(manual&&!$('title').hidden)popup('리소스 정보를 확인하지 못했습니다. 인터넷 연결 후 다시 시도해 주세요.',[['닫기',()=>{}]])
 }finally{resourceBusy=false}
}
