/* =====================================================================
   업적 · 도감 (인연 · 보물 · 기연) · 돌발 임무 · 기연 · 기록 (v122)
   ---------------------------------------------------------------------
   내용은 data/meta.js (META_NPCS · BQUESTS · ACHIEVEMENTS). 엔진(js/engine.js)에서 부르는 곳 :
     strike → metaOnHit · showBattleSummary → metaOnVictory · allyTurnStart → metaOnTurn · 아군 이동 → metaOnMove
     전투 시작 · 이어하기 → metaOnBattleStart · renderMissionHud → metaHudLines · ascendRealm → metaOnRealm
     addToBag → metaDex · 끝 화면 인물 → metaCond · metaKiyeonMet · metaKiyeonFound · 저장 · 불러오기 → PLAYER.meta
   PLAYER.meta = { stats:{ wins, kills, heroKills, bossKills, downs, noDownWins, maxHit, finalMax, finalFew },
                   dex:{ 물건:1 }, bq:{ 돌발 id:1 }, kiyeon:{ 기연 id:1 }, ach:{ 업적 id:달성 시각 } }
   — 다회차(윤회 포인트)를 만들 때 이 기록을 그대로 씀 (기획 초안 참고)
   ===================================================================== */
function metaState(){
  const m = PLAYER.meta || (PLAYER.meta = {});
  ['stats','dex','bq','kiyeon','ach'].forEach(k=>{ if (!m[k] || typeof m[k] !== 'object') m[k] = {}; });
  return m;
}
const JEOLGI_NAMES = ['천씨검법 · 유성','성화요원','태극검 · 만류귀종','매화낙영전','항룡유회','제왕검형 · 비룡','팔진도 · 귀문','금강항마권','폭우이화침',
                      '관음천수','태을검 · 귀일','빙백신장 · 설화','백수군무','광도난무','제왕일검','매화만개','광풍매화','운룡삼현'];

/* ---------- 끝 화면 인물 (data/meta.js 의 META_NPCS) : 장면에 붙임 ---------- */
(function(){
  if (typeof META_NPCS === 'undefined') return;
  Object.keys(META_NPCS).forEach(sc=>{ if (SCENES[sc]) SCENES[sc].npcs = (SCENES[sc].npcs || []).concat(META_NPCS[sc]); });
})();
function kiyeonList(){
  const out = [];
  if (typeof META_NPCS === 'undefined') return out;
  Object.keys(META_NPCS).forEach(sc=> META_NPCS[sc].forEach(n=>{ if (n.kiyeon) out.push({ id:n.kiyeon, scene:sc, npc:n }); }));
  return out.sort((a,b)=> storyIdx(a.scene) - storyIdx(b.scene));
}
function metaCond(c){
  if (!c) return true;
  if (c.mission && missionState(c.mission) !== 'done') return false;
  if (c.member && !isParty(c.member)) return false;
  if (c.realm){ const [who, r] = c.realm; if (!isParty(who) && who !== 'hero') return false; if (realmIndex(memberRealm(who)) < REALMS.indexOf(r)) return false; }
  if (c.kiyeon && Object.keys(metaState().kiyeon).length < c.kiyeon) return false;
  if (c.level && (HERO.level || 1) < c.level) return false;
  return true;
}
function metaKiyeonMet(id){ return !!metaState().kiyeon[id]; }
function metaKiyeonFound(n){
  const m = metaState(); if (!n.kiyeon || m.kiyeon[n.kiyeon]) return;
  m.kiyeon[n.kiyeon] = 1;
  metaPop('기연', nameOf(n.id) + josa(nameOf(n.id), '과', '와') + '의 인연 — 기연 도감에 남았습니다');
  setTimeout(()=> achCheck(), 1200);
}

/* ---------- 보물 도감 : 장신구 · 보물 (명품 포함) — 한 번이라도 가지면 열림 ---------- */
function dexList(){
  return Object.keys(ITEM_DB).filter(n=>{ const t = ITEM_DB[n]; return t && (t.type==='accessory' || t.type==='treasure'); })
    .sort((a,b)=>{ const A = ITEM_DB[a], B = ITEM_DB[b], o = t=> (t.type==='accessory' ? 0 : t.named ? 2 : 1);
                   return o(A) - o(B) || (A.price||0) - (B.price||0); });
}
function metaDex(name){
  const t = ITEM_DB[name]; if (!t || (t.type!=='accessory' && t.type!=='treasure')) return false;
  const m = metaState(); if (m.dex[name]) return false;
  m.dex[name] = 1; return true;
}
function dexSweep(){
  let added = false;
  Object.keys(PLAYER.inv || {}).forEach(n=>{ if (PLAYER.inv[n] > 0 && metaDex(n)) added = true; });
  ['hero'].concat(Object.keys(MEMBERS || {})).forEach(id=>{ const st = memberState(id); if (st && st.equip) Object.values(st.equip).forEach(n=>{ if (n && metaDex(n)) added = true; }); });
  return added;
}

/* ---------- 전투 기록 (승리할 때만 쌓임 — 지고 다시하면 그 전투 기록은 버림) ---------- */
function metaOnHit(atk, def, dmg){
  if (!bState) return;
  const s = bState.ms || (bState.ms = { kills:0, heroKills:0, bossKills:0, downs:0, maxHit:0 });
  const mine = u=> u && u.side==='ally' && !u.friend && !u.noControl;
  if (mine(atk) && dmg > s.maxHit) s.maxHit = dmg;
  if (def.hp > 0) return;
  if (def.side==='enemy'){
    if (mine(atk)){ s.kills++; if (atk.key==='hero') s.heroKills++; if (def.rank) s.bossKills++; }
    if (String(def.id||'').startsWith('bq_') && !def.fled){ bState.mission['bq:'+def.id.slice(3)] = 'ok'; setTimeout(()=>{ renderMissionHud(); toast('돌발 임무 성공 — '+def.name+' (이기면 보상)', 1600); }, 600); }
  } else if (mine(def)) s.downs++;
}
function metaOnVictory(){
  const m = metaState(), st = m.stats, s = bState.ms || {};
  st.wins = (st.wins||0) + 1;
  ['kills','heroKills','bossKills','downs'].forEach(k=> st[k] = (st[k]||0) + (s[k]||0));
  if (!s.downs) st.noDownWins = (st.noDownWins||0) + 1;
  st.maxHit = Math.max(st.maxHit||0, s.maxHit||0);
  if (curBattleId === 'final'){
    const n = Object.values(units).filter(u=> u.side==='ally' && !u.friend && (u.key==='hero' || isParty(u.id))).length;
    st.finalMax = Math.max(st.finalMax||0, n); st.finalFew = st.finalFew ? Math.min(st.finalFew, n) : n;
  }
  // 돌발 임무 보상
  const rows = [];
  bqFor(curBattleId).forEach(q=>{
    const ok = bState.mission['bq:'+q.id] === 'ok';
    if (ok && !m.bq[q.id]){ m.bq[q.id] = 1; const got = applyGive(q.reward || {}); rows.push('돌발 · '+q.title+' <span class="mok">성공</span><small>'+got.join(' · ')+'</small>'); }
    else if (!ok && bqSeen(q)) rows.push('돌발 · '+q.title+' <span class="mfail">놓침</span>');
  });
  if (rows.length){
    const row = document.getElementById('bs-mission-row'), el = document.getElementById('bs-mission');
    row.style.display = ''; el.innerHTML = (el.innerHTML ? el.innerHTML + '<br>' : '') + rows.join('<br>');
  }
  dexSweep();
  setTimeout(()=> achCheck(), 600);
}
function metaOnRealm(id){ if (id==='hero') setTimeout(()=> achCheck(), 900); }

/* ---------- 돌발 임무 (data/meta.js 의 BQUESTS) ---------- */
function bqFor(bid){ return (typeof BQUESTS !== 'undefined' && BQUESTS[bid]) || []; }
function bqAll(){ const out = []; if (typeof BQUESTS !== 'undefined') Object.keys(BQUESTS).forEach(b=> BQUESTS[b].forEach(q=> out.push(Object.assign({ battle:b }, q)))); return out; }
function bqState(q){ return (bState && bState.mission && bState.mission['bq:'+q.id]) || ''; }
function bqSeen(q){   // 이번 전투에서 플레이어가 본 적이 있는지 (놓침 표시용)
  if (q.kind==='hunt') return Object.values(units).some(u=> u.id==='bq_'+q.id);
  return !q.hidden || bqState(q)==='seen' || bqState(q)==='ok' || bqState(q)==='gone';
}
// 지도 칸 : 걸을 수 있는지
function bqWalk(map){
  const M = MAPS[map]; if (!M) return null;
  const T = {}; (M.tiles||[]).forEach(t=>{ const d = TERRAIN_DATA[t.terrain]; T[t.x+','+t.y] = !d || (d.cost||1) < 99; });
  return { w:M.width, h:M.height, ok:(x,y)=> !!T[x+','+y] };
}
// 상자 · 강적 자리 : 따로 적지 않으면 지도에서 정함 (아군 시작 자리에서 9칸 안팎 · 적 대장 쪽 큰길에서 비켜난 샛길 / 강적은 아군에서 가장 먼 칸)
(function placeBQuests(){
  if (typeof BQUESTS === 'undefined') return;
  Object.keys(BQUESTS).forEach(bid=>{
    const B = BATTLES[bid], W = B && bqWalk(B.map); if (!W) return;
    const taken = new Set(), add = c=> taken.add(c.x+','+c.y);
    (B.allies||[]).forEach(add); (B.picks||[]).forEach(add); (B.enemies||[]).forEach(add);
    (B.events||[]).forEach(e=>{ (e.spawn||[]).forEach(add); if (e.arrive) add(e.arrive); });
    const al = (B.allies||[]).concat(B.picks||[]), cx = al.reduce((s,a)=>s+a.x,0)/Math.max(1,al.length), cy = al.reduce((s,a)=>s+a.y,0)/Math.max(1,al.length);
    const boss = (B.enemies||[]).find(e=> e.rank==='boss' || e.rank==='final') || (B.enemies||[])[0] || { x:cx, y:cy };
    const vx = boss.x - cx, vy = boss.y - cy, vl = Math.hypot(vx, vy) || 1;
    const nearEnemy = (x,y,g)=> (B.enemies||[]).some(e=> Math.abs(e.x-x)+Math.abs(e.y-y) < g);
    const cells = [];
    for (let y=1; y<=W.h; y++) for (let x=1; x<=W.w; x++) if (W.ok(x,y) && !taken.has(x+','+y)) cells.push({ x, y });
    BQUESTS[bid].forEach(q=>{
      if (q.kind==='chest' && !q.at){
        let best = null;
        cells.filter(c=> !nearEnemy(c.x, c.y, 3)).forEach(c=>{
          const d = Math.abs(c.x-cx) + Math.abs(c.y-cy), perp = Math.abs((c.x-cx)*vy - (c.y-cy)*vx) / vl;
          const sc = -Math.abs(d - 9) + Math.min(perp, 7) * 0.8;
          if (!best || sc > best.sc) best = { sc, x:c.x, y:c.y };
        });
        if (best){ q.at = [best.x, best.y]; taken.add(best.x+','+best.y); }
      }
      if (q.kind==='hunt'){
        const uid = 'bq_' + q.id, base = UNITS[q.base] || {};
        UNITS[uid] = Object.assign({}, base, { name:q.title, rank:'mid', foe:true, face:base.face || q.base, card:base.card || base.face || q.base });
        if (!q.at){
          let best = null;
          cells.filter(c=> !nearEnemy(c.x, c.y, 2)).forEach(c=>{ const d = Math.abs(c.x-cx) + Math.abs(c.y-cy); if (!best || d > best.d) best = { d, x:c.x, y:c.y }; });
          if (best){ q.at = [best.x, best.y]; taken.add(best.x+','+best.y); }
        }
        if (q.at){
          B.events = B.events || [];
          B.events.push({ turn:q.turn || 3, bq:q.id, spawn:[ { id:uid, x:q.at[0], y:q.at[1], level:q.level || 'hero+1', rank:'mid' } ], talk:q.talk || [] });
        }
      }
    });
  });
})();
// 전투를 열 때 · 이어할 때 : 상자 그리기 · 강적 표시
function metaOnBattleStart(){
  document.querySelectorAll('#b-stage .bq-chest').forEach(e=> e.remove());
  const stage = document.getElementById('b-stage') || (typeof bStage !== 'undefined' ? bStage : null);
  bqFor(curBattleId).forEach(q=>{
    if (q.kind==='hunt') return;
    if (!q.at || !stage) return;
    const el = document.createElement('div'); el.className = 'bq-chest'; el.dataset.q = q.id;
    el.style.left = ((q.at[0]-1)*B_TILE)+'px'; el.style.top = ((q.at[1]-1)*B_TILE)+'px';
    el.style.width = el.style.height = B_TILE+'px';
    el.innerHTML = itemIcon('보물상자');
    stage.appendChild(el);
  });
  bqRefresh();
}
function bqRefresh(){
  bqFor(curBattleId).forEach(q=>{
    if (q.kind!=='chest') return;
    const el = document.querySelector('#b-stage .bq-chest[data-q="'+q.id+'"]'), st = bqState(q);
    if (!el) return;
    const gone = st==='ok' || st==='gone' || (q.until && bState.turnCount > q.until && st!=='ok');
    el.classList.toggle('hide', !!(gone || (q.hidden && st!=='seen')));
  });
}
// 아군이 이동을 마침 : 상자 칸이면 엶 · 숨은 상자가 3칸 안이면 드러남
function metaOnMove(u){
  if (!u || u.side!=='ally') return;
  let changed = false;
  bqFor(curBattleId).forEach(q=>{
    if (q.kind!=='chest' || !q.at) return;
    const st = bqState(q); if (st==='ok' || st==='gone') return;
    if (q.until && bState.turnCount > q.until) return;
    const d = Math.abs(u.x-q.at[0]) + Math.abs(u.y-q.at[1]);
    if (q.hidden && st!=='seen' && d <= 3){ bState.mission['bq:'+q.id] = 'seen'; changed = true; toast('숨은 상자를 찾았습니다 — '+q.title, 1600); sfx('item'); }
    if (d === 0){ bState.mission['bq:'+q.id] = 'ok'; changed = true; toast(u.name+' — '+q.title+' (이기면 챙깁니다)', 1800); sfx('chest'); }
  });
  if (changed){ bqRefresh(); renderMissionHud(); }
}
// 아군 턴이 시작될 때 : 상자 시간 지남 · 강적 달아남
function metaOnTurn(){
  let changed = false;
  bqFor(curBattleId).forEach(q=>{
    const st = bqState(q);
    if (q.kind==='chest' && q.until && bState.turnCount > q.until && st!=='ok' && st!=='gone' && bqSeen(q)){
      bState.mission['bq:'+q.id] = 'gone'; changed = true; toast(q.title+' — 때를 놓쳐 사라졌습니다', 1600);
    }
    if (q.kind==='hunt' && q.until && bState.turnCount > q.until && st!=='ok'){
      Object.values(units).filter(u=> u.id==='bq_'+q.id && u.hp>0).forEach(u=>{
        u.fled = true; u.hp = 0; u.el.style.transition = 'opacity .6s ease'; u.el.style.opacity = '0';
        setTimeout(()=>{ u.el.style.display = 'none'; }, 700);
        bState.mission['bq:'+q.id] = 'gone'; changed = true; toast(q.title+josa(q.title,'이','가')+' 달아났습니다', 1600);
      });
    }
  });
  if (changed) bqRefresh();
  renderMissionHud();                                   // 이번 턴에 나타난 강적도 표시
}
function metaHudLines(){
  return bqFor(curBattleId).map(q=>{
    const st = bqState(q);
    if (q.kind==='chest'){
      if (q.hidden && !st) return '';
      if (!q.at) return '';
      const late = q.until && bState.turnCount > q.until && st!=='ok';
      const p = st==='ok' ? 'ok' : (st==='gone' || late) ? 'fail' : '';
      return '<div class="bq '+p+'">돌발 · '+q.title+(p==='ok' ? ' ✓' : p==='fail' ? ' ✗' : ' — 상자 칸에서 이동 마치기'+(q.until ? ' ('+q.until+'턴까지)' : ''))+'</div>';
    }
    const u = Object.values(units).find(x=> x.id==='bq_'+q.id); if (!u) return '';
    const p = st==='ok' ? 'ok' : st==='gone' ? 'fail' : '';
    return '<div class="bq '+p+'">돌발 · '+q.title+(p==='ok' ? ' ✓' : p==='fail' ? ' ✗ 달아남' : ' 쓰러뜨리기 ('+q.until+'턴까지)')+'</div>';
  }).join('');
}

/* ---------- 업적 ---------- */
function achTotal(kind){
  if (kind==='missions') return Object.keys(typeof MISSIONS !== 'undefined' ? MISSIONS : {}).length;
  if (kind==='bq') return bqAll().length;
  if (kind==='kiyeon') return kiyeonList().length;
  if (kind==='bonds') return bondList().length;
  if (kind==='dex') return dexList().length;
  return 0;
}
function achValue(kind){
  const m = metaState(), st = m.stats;
  switch (kind){
    case 'realm':    return realmIndex(memberRealm('hero'));
    case 'jeolgi':   { const set = new Set(); PARTY.forEach(id=> (typeof memberSkillsAll==='function' ? memberSkillsAll(id) : memberSkills(id)).forEach(s=>{ if (JEOLGI_NAMES.includes(s)) set.add(s); })); return set.size; }
    case 'missions': return Object.values(PLAYER.missions || {}).filter(v=> v==='done').length;
    case 'bq':       return Object.keys(m.bq).length;
    case 'kiyeon':   return Object.keys(m.kiyeon).length;
    case 'bonds':    return bondList().filter(bondOpen).length;
    case 'dex':      return Object.keys(m.dex).filter(n=> ITEM_DB[n]).length;
    case 'party':    return PARTY.length;
    case 'cleared':  return PLAYER.flags && PLAYER.flags.cleared ? 1 : 0;
    case 'allIn':    return st.finalMax || 0;
    case 'craft':    { let n = 0; ['hero'].concat(Object.keys(MEMBERS||{})).forEach(id=>{ const s = memberState(id); if (s && s.equip) Object.values(s.equip).forEach(x=>{ if (x && itemParse(x).excl) n++; }); });
                       Object.keys(PLAYER.inv||{}).forEach(x=>{ if (PLAYER.inv[x] > 0 && itemParse(x).excl) n++; }); return n; }
    default:         return st[kind] || 0;
  }
}
function achNeed(a){ return a.need.kind==='realm' ? REALMS.indexOf(a.need.n) : (a.need.n==='all' ? achTotal(a.need.kind) : a.need.n); }
function achDone(a){
  if (a.need.kind==='fewFinal'){ const f = metaState().stats.finalFew; return !!f && f <= a.need.n; }
  const need = achNeed(a); return need > 0 && achValue(a.need.kind) >= need;
}
function achList(){ return typeof ACHIEVEMENTS !== 'undefined' ? ACHIEVEMENTS : []; }
function achCheck(){
  if (!PLAYER || !HERO) return;
  const m = metaState(), got = [];
  dexSweep();
  achList().forEach(a=>{ if (m.ach[a.id] || !achDone(a)) return; m.ach[a.id] = Date.now(); const r = a.reward ? applyGive(a.reward) : []; got.push({ a, r }); });
  if (!got.length) return;
  if (got.length > 2) metaPop('업적 ' + got.length + '개 달성', got.map(x=> x.a.name).join(' · ') + ' — 설정 → 업적');
  else got.forEach(x=> metaPop('업적 달성 — ' + x.a.name, x.a.desc + (x.r.length ? ' · 받음 ' + x.r.join(' · ') : '')));
}
// 화면 위 가운데 띠 (전투 중에도 보임)
const metaPopQ = [];
function metaPop(title, body){
  metaPopQ.push([title, body]); if (metaPopQ.length > 1) return;
  const run = ()=>{
    const it = metaPopQ[0]; if (!it) return;
    let el = document.getElementById('meta-pop');
    if (!el){ el = document.createElement('div'); el.id = 'meta-pop'; document.body.appendChild(el); el.addEventListener('click', ()=> el.classList.remove('on')); }
    el.innerHTML = '<b>'+it[0]+'</b><span>'+it[1]+'</span>';
    el.classList.remove('on'); void el.offsetWidth; el.classList.add('on'); try { sfx('achieve'); } catch (e) {}
    setTimeout(()=>{ el.classList.remove('on'); setTimeout(()=>{ metaPopQ.shift(); run(); }, 350); }, 2600);
  };
  run();
}
// 불러올 때 : 예전 저장 맞추기 (승리 수 = 지나온 전투 수) · 도감 · 업적 (한 번에 묶어 알림)
function metaOnLoad(){
  const m = metaState();
  if (!m.seeded){
    const lim = codexPos(), won = storyOrder().filter((k,i)=> k.startsWith('battle:') && i < lim && BATTLES[k.slice(7)] && !BATTLES[k.slice(7)].lossOk).length;
    m.stats.wins = Math.max(m.stats.wins||0, won); m.seeded = 1;
  }
  dexSweep();
  setTimeout(()=> achCheck(), 1500);
}

/* ---------- 기록 창 (설정 → 업적 · 인연 도감 · 보물 도감 · 기연) ---------- */
let mtTab = 'ach', mtSel = null;
function openMeta(tab){
  mtTab = tab || mtTab; mtSel = null; dexSweep();
  renderMeta(); document.getElementById('meta-modal').style.display = 'flex';
}
function renderMeta(){
  const m = metaState(), body = document.getElementById('mt-body');
  const cnt = { ach:[achList().filter(a=>m.ach[a.id]).length, achList().length], bond:[bondList().filter(bondOpen).length, bondList().length],
                dex:[achValue('dex'), dexList().length], ky:[Object.keys(m.kiyeon).length + Object.keys(m.bq).length, kiyeonList().length + bqAll().length] };
  document.querySelectorAll('#mt-tabs .of-tab').forEach(t=>{ t.classList.toggle('on', t.dataset.t===mtTab); const c = cnt[t.dataset.t]; t.querySelector('small').textContent = c[0]+'/'+c[1]; });
  let h = '';
  if (mtTab==='ach'){
    const cats = []; achList().forEach(a=>{ if (!cats.includes(a.cat)) cats.push(a.cat); });
    cats.forEach(c=>{
      h += '<div class="of-sec">'+c+'</div>';
      achList().filter(a=>a.cat===c).forEach(a=>{
        const done = !!m.ach[a.id], need = achNeed(a), raw = a.need.kind==='fewFinal' ? (m.stats.finalFew||0) : achValue(a.need.kind);
        const cur = a.need.kind==='realm' ? (done ? need : Math.max(0, raw)) : Math.min(raw, need);
        const pct = a.need.kind==='fewFinal' ? (done ? 100 : 0) : (need ? Math.round(cur/need*100) : 0);
        const prog = a.need.kind==='realm' ? (done ? a.need.n : memberRealm('hero')+' → '+a.need.n) : a.need.kind==='fewFinal' ? (done ? m.stats.finalFew+'명' : (m.stats.finalFew ? m.stats.finalFew+'명' : '아직')) : (a.need.kind==='maxHit' ? cur.toLocaleString()+' / '+need.toLocaleString() : cur+' / '+need);
        h += '<div class="mt-ach'+(done?' done':'')+'"><div class="mt-a1"><b>'+(done?'✓ ':'')+a.name+'</b><span>'+a.desc+'</span></div>'+
             '<div class="mt-a2"><div class="mt-bar"><i style="width:'+pct+'%"></i></div><small>'+prog+'</small>'+(a.reward ? '<small class="rw">보상 · '+rewardText(a.reward)+'</small>' : '')+'</div></div>';
      });
    });
  }
  if (mtTab==='bond'){
    bondList().forEach(b=>{
      const open = bondOpen(b), sc = b.from && SCENES[b.from];
      const faces = (b.members||[]).map(id=> open || isParty(id) ? '<img src="'+faceOf(id)+'" alt="">' : '<span class="q">?</span>').join('');
      h += '<div class="mt-bond'+(open?'':' locked')+'"><div class="mt-faces">'+faces+'</div><div class="mt-b1"><b>'+(open ? b.name : '???')+'</b>'+
           '<span>'+(open ? (b.members||[]).map(nameOf).join(' · ')+' — '+(b.text||'') : (sc ? sc.chapter+'에서 맺어짐' : '아직 알 수 없는 인연'))+'</span>'+
           (open ? '<small>'+(b.when==='adj' ? '이웃하면 발동' : '함께 출전하면 발동')+(sc ? ' · '+sc.chapter+(sc.place ? ' '+sc.place : '') : '')+'</small>' : '')+'</div></div>';
    });
  }
  if (mtTab==='dex'){
    const list = dexList(), kind = n=> ITEM_DB[n].type==='accessory' ? '장신구' : ITEM_DB[n].named ? '명품' : '보물';
    ['장신구','보물','명품'].forEach(k=>{
      const L = list.filter(n=> kind(n)===k), got = L.filter(n=> m.dex[n]).length;
      h += '<div class="of-sec">'+k+' '+got+'/'+L.length+'</div><div class="mt-grid">';
      L.forEach(n=>{ const has = !!m.dex[n];
        h += '<div class="mt-item'+(has?'':' locked')+(mtSel===n?' sel':'')+'" data-n="'+n+'"><span class="ic">'+(has ? itemIcon(n) : '?')+'</span><span class="nm">'+(has ? n : '???')+'</span></div>'; });
      h += '</div>';
    });
    const it = mtSel && ITEM_DB[mtSel];
    h = '<div class="mt-info">'+(it ? (m.dex[mtSel] ? '<b>'+mtSel+'</b> '+(it.sub ? '<small>'+it.sub+'</small> ' : '')+'<span class="st">'+statText(it.stat)+'</span><span>'+(it.desc||'')+'</span>'
                                                   : '<b>???</b><span>아직 얻지 못한 '+kind(mtSel)+' — 상자 · 상점 · 돌발 임무 · 기연에서 나올 수 있음</span>')
                                       : '<span>칸을 누르면 설명</span>')+'</div>' + h;
  }
  if (mtTab==='ky'){
    h += '<div class="of-sec">기연 — 끝 화면에 조건이 맞으면 \'緣\' 표시와 함께 나타나는 인물</div>';
    kiyeonList().forEach(k=>{
      const met = !!m.kiyeon[k.id], sc = SCENES[k.scene] || {}, g = k.npc.give || {};
      const what = [g.skill ? '무공 「'+g.skill+'」' + (g.to && g.to!=='hero' ? ' → '+nameOf(g.to) : '') : '', g.item ? g.item : ''].filter(Boolean).join(' · ');
      h += '<div class="mt-bond'+(met?'':' locked')+'"><div class="mt-faces">'+(met ? '<img src="'+faceOf(k.npc.id)+'" alt="">' : '<span class="q">緣</span>')+'</div><div class="mt-b1">'+
           '<b>'+(met ? nameOf(k.npc.id)+'의 기연' : '???')+'</b><span>'+sc.chapter+(met ? ' · '+(sc.place||'')+' — '+what : ' · '+kiyeonHint(k.npc.cond))+'</span></div></div>';
    });
    h += '<div class="of-sec">돌발 임무 — 전투 중에 나타나는 상자 · 강적</div>';
    bqAll().forEach(q=>{
      const ok = !!m.bq[q.id], B = BATTLES[q.battle] || {};
      h += '<div class="of-past"><span>'+(ok ? q.title : (q.kind==='chest' ? '??? (상자)' : '??? (강적)'))+' <small>'+battleShortName(q.battle)+'</small></span>'+
           (ok ? '<span class="ok">성공 · '+rewardText(q.reward)+'</span>' : '<span class="fail">'+(q.kind==='chest' ? (q.hidden ? '숨겨져 있음' : '상자') : q.turn+'턴에 나타남')+'</span>')+'</div>';
    });
  }
  body.innerHTML = h;
  body.querySelectorAll('.mt-item').forEach(el=> el.addEventListener('click', ()=>{ mtSel = el.dataset.n; renderMeta(); }));
}
function kiyeonHint(c){
  if (!c) return '그곳을 다시 살펴볼 것';
  const out = [];
  if (c.mission){ const M = (typeof MISSIONS !== 'undefined' ? MISSIONS : {})[c.mission]; out.push('집무실 임무 「'+(M ? M.title : c.mission)+'」 완료'); }
  if (c.member) out.push(nameOf(c.member)+josa(nameOf(c.member),'이','가')+' 동료일 것');
  if (c.realm) out.push(nameOf(c.realm[0])+' '+c.realm[1]+' 이상');
  if (c.kiyeon) out.push('기연 '+c.kiyeon+'번 이상');
  if (c.level) out.push('주인공 Lv '+c.level+' 이상');
  return out.join(' · ');
}
document.querySelectorAll('#mt-tabs .of-tab').forEach(t=> t.addEventListener('click', ()=>{ mtTab = t.dataset.t; mtSel = null; renderMeta(); }));
document.getElementById('mt-close').addEventListener('click', ()=>{ document.getElementById('meta-modal').style.display = 'none'; });
['ach','bond','dex'].forEach(k=>{ const b = document.getElementById('set-meta-'+k); if (b) b.addEventListener('click', ()=> openMeta(k)); });
