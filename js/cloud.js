/* =====================================================================
   서버 저장 (Firebase) — 설정은 data/server.js
   ---------------------------------------------------------------------
   - 저장 칸 15개는 지금처럼 이 브라우저(localStorage)에도 그대로 둠 (빠르고, 인터넷이 끊겨도 됨)
   - 구글 계정으로 로그인하면 칸마다 서버(Firestore)와 맞춤
       · 저장할 때 : 그 칸을 서버에도 올림
       · 로그인할 때 · 저장/불러오기 창을 열 때 : 서버와 비교해서 칸마다 '더 나중에 저장한 쪽' 을 남김
   - 서버 문서 : users/{uid}/saves/s{칸 번호}  { slot, time, data(JSON 글자), name, level, place }
                 자동 저장은 users/{uid}/saves/sauto  (slot:'auto')
     (Firestore 는 배열 속 배열을 못 담아서 저장 내용은 JSON 글자로 넣음)
   ===================================================================== */
const CLOUD = { fb:null, loading:false, user:null, busy:false, err:'', lastSync:0 };

function cloudConfigured(){ return typeof SERVER !== 'undefined' && !!(SERVER.firebase && SERVER.firebase.apiKey); }
function cloudAvailable(){ return cloudConfigured() && /^https?:$/.test(location.protocol); }

async function cloudInit(){
  if (!cloudAvailable() || CLOUD.fb || CLOUD.loading) return;
  CLOUD.loading = true; cloudUI();
  try{
    const base = 'https://www.gstatic.com/firebasejs/' + (SERVER.sdkVersion || '12.18.0') + '/';
    const [A, Au, F] = await Promise.all([ import(base+'firebase-app.js'), import(base+'firebase-auth.js'), import(base+'firebase-firestore.js') ]);
    const app = A.initializeApp(SERVER.firebase);
    const auth = Au.getAuth(app), db = F.getFirestore(app);
    CLOUD.fb = { A, Au, F, app, auth, db };
    Au.getRedirectResult(auth).catch(e=>{ CLOUD.err = loginErrText(e); cloudUI(); });     // 팝업 대신 이동 방식으로 로그인했을 때
    Au.onAuthStateChanged(auth, u=>{
      CLOUD.user = u ? { uid:u.uid, name:u.displayName || u.email || '이름 없음', email:u.email || '' } : null;
      CLOUD.err = ''; cloudUI();
      if (u) cloudSync(true);
    });
  }catch(e){
    CLOUD.err = '서버에 연결하지 못했습니다 (인터넷 연결 확인)';
  }
  CLOUD.loading = false; cloudUI();
}

function loginErrText(e){
  const c = (e && e.code) || '';
  if (c==='auth/unauthorized-domain') return '이 주소가 Firebase 승인된 도메인에 없습니다';
  if (c==='auth/network-request-failed') return '인터넷 연결을 확인해 주세요';
  if (c==='auth/operation-not-allowed') return 'Firebase 에서 Google 로그인이 꺼져 있습니다';
  return '로그인하지 못했습니다' + (c ? ' ('+c+')' : '');
}
async function cloudLogin(){
  if (!CLOUD.fb){ cloudInit(); showToast('서버에 연결하는 중입니다. 잠시 뒤에 다시 눌러 주세요'); return; }
  const { Au, auth } = CLOUD.fb, prov = new Au.GoogleAuthProvider();
  prov.setCustomParameters({ prompt:'select_account' });
  try{ await Au.signInWithPopup(auth, prov); }
  catch(e){
    const c = (e && e.code) || '';
    if (c==='auth/popup-closed-by-user' || c==='auth/cancelled-popup-request') return;
    if (c==='auth/popup-blocked' || c==='auth/operation-not-supported-in-this-environment'){
      try{ await Au.signInWithRedirect(auth, prov); return; }catch(e2){ e = e2; }
    }
    CLOUD.err = loginErrText(e); cloudUI(); showToast(CLOUD.err);
  }
}
async function cloudLogout(){
  if (!CLOUD.fb) return;
  try{ await CLOUD.fb.Au.signOut(CLOUD.fb.auth); showToast('로그아웃했습니다 (이 기기의 저장은 그대로 남음)'); }catch(e){}
}

function slotDoc(i){ const { F, db } = CLOUD.fb; return F.doc(db, 'users', CLOUD.user.uid, 'saves', 's'+i); }   // i = 칸 번호 또는 'auto'
async function cloudPutSlot(i, sv){
  const { F } = CLOUD.fb;
  await F.setDoc(slotDoc(i), { slot:i, time:sv.time || Date.now(), data:JSON.stringify(sv),
    name:(sv.hero && sv.hero.name) || '', level:(sv.hero && sv.hero.level) || 1, place:sv.place || '' });
}
// 서버와 맞추기 : 칸마다 더 나중에 저장한 쪽을 남김 (서버가 새것 → 이 기기로 / 이 기기가 새것 → 서버로)
async function cloudSync(quiet){
  if (!CLOUD.user || !CLOUD.fb || CLOUD.busy) return;
  CLOUD.busy = true; cloudUI();
  try{
    const { F, db } = CLOUD.fb;
    const got = await F.getDocs(F.collection(db, 'users', CLOUD.user.uid, 'saves'));
    const remote = []; let rAuto = null;
    got.forEach(d=>{ const v = d.data(); if (typeof v.slot === 'number') remote[v.slot] = v; else if (v.slot === 'auto') rAuto = v; });
    const local = readSaves(), ups = [];
    let pulled = 0;
    for (let i=0;i<SAVE_SLOTS;i++){
      const r = remote[i], l = local[i];
      const rt = r ? (r.time || 0) : -1, lt = l ? (l.time || 0) : -1;
      if (r && rt > lt){ try{ local[i] = JSON.parse(r.data); pulled++; }catch(e){} }
      else if (l && lt > rt) ups.push(i);
    }
    if (pulled) writeSaves(local);
    for (const i of ups) await cloudPutSlot(i, local[i]);
    // 자동 저장 칸도 같은 방식으로
    if (typeof readAuto === 'function'){
      const la = readAuto(), lt = la ? (la.time||0) : -1, rt = rAuto ? (rAuto.time||0) : -1;
      if (rAuto && rt > lt){ try{ writeAuto(JSON.parse(rAuto.data), true); pulled++; }catch(e){} }
      else if (la && lt > rt){ await cloudPutSlot('auto', la); ups.push('auto'); }
    }
    CLOUD.lastSync = Date.now(); CLOUD.err = '';
    if (pulled && document.getElementById('save-modal').style.display === 'flex') renderSaveList();
    if (!quiet && (pulled || ups.length)) showToast('서버와 맞췄습니다 (받음 '+pulled+' · 올림 '+ups.length+')');
  }catch(e){
    CLOUD.err = '서버와 맞추지 못했습니다' + (e && e.code ? ' ('+e.code+')' : '');
  }
  CLOUD.busy = false; cloudUI();
}
// 자동 저장 → 서버 (장면 단위만. 전투 중 자동 저장은 턴마다라서 다음에 맞출 때 올림)
function cloudSaveAuto(sv){
  if (!CLOUD.user || !CLOUD.fb || !sv || sv.pos === 'battle') return;
  cloudPutSlot('auto', sv).then(()=>{ CLOUD.lastSync = Date.now(); cloudUI(); }).catch(()=>{});
}
// 저장 칸 하나를 서버에도 올림 (저장 화면에서 저장할 때)
function cloudSaveSlot(i, sv){
  if (!CLOUD.user || !CLOUD.fb || !sv) return;
  CLOUD.busy = true; cloudUI();
  cloudPutSlot(i, sv).then(()=>{ CLOUD.lastSync = Date.now(); CLOUD.err = ''; })
    .catch(e=>{ CLOUD.err = '서버에 올리지 못했습니다 — 이 기기에는 저장됨'; showToast(CLOUD.err); })
    .finally(()=>{ CLOUD.busy = false; cloudUI(); });
}

// 화면 표시 : 설정의 '계정 · 서버 저장' 줄, 저장 창 위쪽 글
function cloudStatusText(){
  if (!cloudConfigured()) return '';
  if (!cloudAvailable()) return '서버 저장은 웹 주소로 접속했을 때만 쓸 수 있습니다 (지금은 이 브라우저에 저장)';
  if (CLOUD.err) return CLOUD.err;
  if (CLOUD.loading || !CLOUD.fb) return '서버에 연결하는 중…';
  if (!CLOUD.user) return '로그인하면 저장이 서버에도 올라가 다른 기기에서도 이어 할 수 있습니다';
  const t = CLOUD.lastSync ? new Date(CLOUD.lastSync) : null, p = n=>String(n).padStart(2,'0');
  return CLOUD.user.name + ' · ' + (CLOUD.busy ? '서버와 맞추는 중…' : t ? '서버 저장 켜짐 · '+p(t.getHours())+':'+p(t.getMinutes())+' 맞춤' : '서버 저장 켜짐');
}
function cloudUI(){
  const on = cloudConfigured();
  const sec = document.getElementById('acc-sec'), row = document.getElementById('acc-row');
  if (sec) sec.style.display = on ? '' : 'none';
  if (row) row.style.display = on ? 'flex' : 'none';
  const st = document.getElementById('acc-st'), btn = document.getElementById('acc-btn');
  if (st) st.textContent = cloudStatusText();
  if (btn){
    btn.style.display = cloudAvailable() ? '' : 'none';
    btn.textContent = CLOUD.user ? '로그아웃' : '구글로 로그인';
    btn.classList.toggle('off', !CLOUD.fb);
  }
  const note = document.getElementById('sv-cloud');
  if (note){
    note.textContent = !cloudAvailable() ? '' : CLOUD.user ? '☁ '+CLOUD.user.name+(CLOUD.busy ? ' · 맞추는 중…' : ' · 서버 저장') : '☁ 로그인하면 서버에도 저장 (설정)';
  }
}
(function(){
  const btn = document.getElementById('acc-btn');
  if (btn) btn.addEventListener('click', ()=>{ if (CLOUD.user) askConfirm('로그아웃하시겠습니까?', cloudLogout); else cloudLogin(); });
  cloudUI();
  cloudInit();
})();
