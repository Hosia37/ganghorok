const installedVersion=6;
let checkingUpdate=false,updateTimer,updateScript,manualUpdate=false;
function finishUpdateCheck(){
 clearTimeout(updateTimer);checkingUpdate=false;
 if(updateScript)updateScript.remove();
 window.hoyeonUpdate=()=>{};
}
function checkUpdate(manual=false){
 if(checkingUpdate)return;
 checkingUpdate=true;manualUpdate=manual;
 window.hoyeonUpdate=release=>{
  finishUpdateCheck();
  if($('title').hidden)return;
  if(!release||!Number.isInteger(release.code)||!/^https:\/\/chatgpt\.com\/library\?file_id=libfile_[a-zA-Z0-9_]+&account_id=personal$/.test(release.url)){
   if(manual)popup('업데이트 정보를 확인하지 못했습니다.',[['닫기',()=>{}]]);
   return
  }
  if(release.code<=installedVersion){
   if(manual)popup('현재 최신 버전입니다. (0.1.5)',[['닫기',()=>{}]]);
   return
  }
  popup('최신 버전 '+release.version+'이 있습니다.\n업데이트하시겠습니까?\n새 APK를 받은 뒤 열어 업데이트를 설치해 주세요.',[
   ['업데이트',()=>{location.href=release.url}],
   ['나중에',()=>{}]
  ])
 };
 const fail=()=>{finishUpdateCheck();if(manual&&!$('title').hidden)popup('업데이트 서버에 연결하지 못했습니다. 인터넷 연결을 확인해 주세요.',[['닫기',()=>{}]])};
 updateScript=document.createElement('script');
 updateScript.src='https://raw.githubusercontent.com/Hosia37/ganghorok/hoyeon/patch-baseline/hoyeon/android/latest.js?t='+Date.now();
 updateScript.onerror=fail;updateTimer=setTimeout(fail,10000);
 document.head.append(updateScript)
}
