/* =====================================================================
   강호록 엔진
   - 내용(대사, 전투 배치, 인물, 물건, 성장표, 그림 경로)은 data/ 폴더에 있습니다.
   - 이 파일은 그 내용을 화면에 보여 주고 움직이는 부분입니다.
   ===================================================================== */

/* ---------- 공통 도우미 ---------- */
function asset(key, depth){
  if (!key) return ''; const i = key.indexOf('.'); const g = ASSETS[key.slice(0,i)];
  const v = (g && g[key.slice(i+1)]) || '';
  return (v[0]==='@' && (depth||0) < 5) ? asset(v.slice(1), (depth||0)+1) : v;   // '@bg.hub' = 다른 그림 빌려 쓰기
}
function cssUrl(p){ return p ? "url('"+p+"')" : 'none'; }
function heroLook(){ return HERO.look==='f' ? 'hero_f' : 'hero_m'; }
// 주인공 이름은 모습에 따라 정해짐 (data/units.js 의 HERO_LOOKS)
function heroNameOf(look, fallback){ const L = (typeof HERO_LOOKS !== 'undefined') && HERO_LOOKS[look==='f' ? 'f' : 'm']; return (L && L.name) || fallback || '주인공'; }
function faceOf(id){ return id==='hero' ? asset('face.'+heroLook()) : asset('face.'+((UNITS[id]||{}).face||'')); }
function cardOf(id){ return id==='hero' ? asset('card.'+heroLook()) : asset('card.'+((UNITS[id]||{}).card||'')); }
function nameOf(id){ return id==='hero' ? HERO.name : ((UNITS[id]||{}).name||''); }
// 화면에 고정된 그림 채우기 (index.html 의 data-asset / data-bg)
document.querySelectorAll('[data-asset]').forEach(el=>{ el.src = asset(el.dataset.asset); });
document.querySelectorAll('[data-bg]').forEach(el=>{ el.style.backgroundImage = cssUrl(asset(el.dataset.bg)); });

/* ---------- 성장 : 레벨 → 경지 · 능력치 (표는 data/growth.js) ---------- */
function realmOfLevel(lv){ let r = REALMS[0]; REALM_LEVELS.forEach(([n,l])=>{ if (lv>=l) r = n; }); return r; }
// LEVEL_TABLE[lv] = 그 레벨의 기본 능력치 (레벨이 오를 때마다 오른 뒤 경지의 LEVEL_GROWTH 만큼 증가)
const LEVEL_TABLE = (()=>{
  const t = [null], s = Object.assign({}, BASE_STATS);
  for (let lv=1; lv<=MAX_LEVEL; lv++){
    const realm = realmOfLevel(lv);
    if (lv>1){ const g = LEVEL_GROWTH[realm] || 0; ['hp','mp','atk','def'].forEach(k=>{ s[k] += Math.round(g*(GROWTH_MULT[k]||1)); }); }
    const he = REALM_HIT_EVA[realm] || [80,5];
    t.push({ realm, hp:s.hp, mp:s.mp, atk:s.atk, def:s.def, hit:he[0], eva:he[1] });
  }
  return t;
})();
function statsAtLevel(lv){ return LEVEL_TABLE[Math.max(1, Math.min(MAX_LEVEL, lv||1))]; }
// 레벨 + 장비 → 최종 능력치
/* ---------- 경지 (아군은 수련도 + 레벨로 오름, 우군 · 적은 레벨로) ---------- */
function realmIndex(name){ return Math.max(0, REALMS.indexOf(name)); }
function memberRealm(id){ const st = memberState(id); return (st && REALMS.includes(st.realm)) ? st.realm : REALMS[0]; }
// 경지의 벽 : 지금 경지에서 오를 수 있는 최고 레벨 (= 다음 경지 레벨)
function levelCap(id){
  if (typeof REALM_WALL !== 'undefined' && !REALM_WALL) return MAX_LEVEL;
  const next = REALM_LEVELS[realmIndex(memberRealm(id)) + 1];
  return next ? next[1] : MAX_LEVEL;
}
function atWall(id){ const st = memberState(id); return !!st && (st.level||1) >= levelCap(id) && levelCap(id) < MAX_LEVEL; }

/* ---------- 수련도 (data/training.js) — 경지마다 판 하나 ---------- */
function treeBase(id){ return (typeof TRAIN_TREE !== 'undefined' && TRAIN_TREE[id]) || []; }
const _boardCache = {};
// ri 번째 경지의 판. 삼류(0)는 TRAIN_TREE 그대로, 이류부터는 직접 짠 판(TRAIN_TREE_REALM) 또는 자동 생성. 노드 id 는 'r1:a1' 처럼 경지 번호가 붙음
function realmBoard(id, ri){
  if (!ri) return treeBase(id);
  const key = id+'|'+ri; if (_boardCache[key]) return _boardCache[key];
  const R = REALMS[ri], pre = 'r'+ri+':';
  const fix = (n)=>{ const o = Object.assign({}, n, { id:pre+n.id, ri }); if (n.req !== undefined) o.req = n.req===null ? null : pre+n.req; return o; };
  const custom = (typeof TRAIN_TREE_REALM !== 'undefined' && TRAIN_TREE_REALM[id] && TRAIN_TREE_REALM[id][R]);
  let board;
  if (custom) board = custom.map(fix);
  else {
    const cfg = (typeof REALM_BOARD !== 'undefined' && REALM_BOARD[R]) || { stat:1+ri, cost:1+ri };
    const M = Object.assign({ single:0.25, line3:0.2, guard:6, heal:0.05 }, (typeof MASTERY !== 'undefined') ? MASTERY : {});
    const lv0 = REALM_LEVELS[ri][1], lv1 = (REALM_LEVELS[ri+1] || [0, MAX_LEVEL])[1];
    board = treeBase(id).map(b=>{
      const n = fix({ id:b.id, branch:b.branch, type:b.type, req:b.req });
      if (b.req === undefined) delete n.req;
      n.level = Math.min(Math.max(lv0, lv1), lv0 + Math.round(((b.level||1)-1) * (lv1-lv0) / 9));
      n.cost = Math.max(10, Math.round((b.cost||100) * cfg.cost / 10) * 10);
      const he = (typeof HIT_EVA_SCALE !== 'undefined') ? HIT_EVA_SCALE : 1;      // 명중 · 회피는 경지 배율을 이만큼만 (data/training.js)
      if (b.stat){ n.stat = {}; for (const k in b.stat) n.stat[k] = Math.max(1, Math.round(b.stat[k] * ((k==='hit' || k==='eva') ? 1 + (cfg.stat-1)*he : cfg.stat))); }
      if (b.type==='skill'){
        const ev = (typeof artsBoardSkill==='function') ? artsBoardSkill(id, ri, b.skill) : null;   // 동료 무공 진화 (js/arts.js)
        const sk = ev ? ev.skill : b.skill, d = SKILLS[sk] || {};
        if (ev && ev.evo){ n.type = 'skill'; n.skill = sk; n.evo = ev.evo; n.name = '진화 · '+sk; }
        else { n.type = 'master'; n.skill = sk; n.name = sk+' '+(ri+1)+'성'; }
        if (d.area==='self') n.guard = Math.max(1, Math.round(M.guard * cfg.stat));
        else if (d.area==='ally') n.heal = M.heal;                 // 회복 무공 : 회복량 +5%
        else n.power = areaSkill(d) ? M.line3 : M.single;
      } else n.name = b.name+' · '+R;
      if (b.effect){
        n.effect = {};
        for (const k in b.effect){
          if (k==='mpRegen' || k==='hpRegen') n.effect[k] = Math.max(1, Math.round(b.effect[k] * cfg.stat / 2));
          else if (k==='counterPow') n.effect[k] = 0.1;
          else if (k==='dmgCut') n.effect[k] = 0.02;
          else n.effect[k] = b.effect[k];
        }
      }
      return n;
    });
  }
  return (_boardCache[key] = board);
}
function treeNodes(id){ return realmBoard(id, realmIndex(memberRealm(id))); }      // 지금 경지의 판
function treeUnlocked(id){ const st = memberState(id); return (st && st.tree) || []; }
function nodeRealmIdx(nid){ const m = /^r(\d+):/.exec(nid); return m ? +m[1] : 0; }
function treeNode(id, nid){ return realmBoard(id, nodeRealmIdx(nid)).find(n=>n.id===nid) || null; }
// 먼저 해금해야 하는 노드 id (null = 큰 원에 바로 붙은 첫 노드)
function treeParent(id, node){
  if (node.req !== undefined) return node.req;
  const list = realmBoard(id, nodeRealmIdx(node.id)).filter(n=>n.branch===node.branch), i = list.findIndex(n=>n.id===node.id);
  return i > 0 ? list[i-1].id : null;
}
function unlockedNodes(id){ return treeUnlocked(id).map(nid=>treeNode(id, nid)).filter(Boolean); }
// 해금한 노드들의 능력치 합 (지난 경지의 판까지 모두)
function treeBonus(id){
  const b = { atk:0, def:0, hit:0, eva:0, hp:0, mp:0 };
  unlockedNodes(id).forEach(n=>{ if (n.stat) for (const k in n.stat) b[k] = (b[k]||0) + n.stat[k]; });
  return b;
}
// 성장 보너스 = 수련도 + 영약 (능력치 계산에 들어감)
function growthBonus(id){
  const b = treeBonus(id), st = memberState(id) || {};
  elixirList().forEach(e=>{ const n = elixirCount(st, e.item); if (n) for (const k in e.stat) b[k] = (b[k]||0) + e.stat[k] * n; });
  if (id==='hero' && typeof HERO_LOOKS !== 'undefined'){ const L = HERO_LOOKS[HERO.look==='f' ? 'f' : 'm']; if (L && L.stat) for (const k in L.stat) b[k] = (b[k]||0) + L.stat[k]; }   // 남 : 공격 +8 · 여 : 내력 +8
  return b;
}
/* ---------- 능력 점수 (data/growth.js 의 ATTR) : 10레벨마다 4점 → 무력 · 내력 · 신법 ---------- */
function attrTotal(level){ return typeof ATTR === 'undefined' ? 0 : Math.floor((level||1) / ATTR.per) * ATTR.gain; }
function attrOf(id){ const st = memberState(id); if (!st) return { mu:0, ne:0, sin:0 }; if (!st.attr) st.attr = { mu:0, ne:0, sin:0 }; return st.attr; }
function attrUsed(a){ return a ? (a.mu||0) + (a.ne||0) + (a.sin||0) : 0; }
function attrLeft(id){ const st = memberState(id); return st && isParty(id) ? Math.max(0, attrTotal(st.level) - attrUsed(attrOf(id))) : 0; }
function attrModOf(a){                       // computeStats 의 mods 하나 { mult, add }
  if (typeof ATTR === 'undefined' || !a || !attrUsed(a)) return null;
  const m = { mult:{}, add:{} };
  ATTR.list.forEach(L=>{ const n = a[L.key] || 0; if (!n) return;
    for (const k in (L.mult||{})) m.mult[k] = (m.mult[k] || 1) + L.mult[k] * n;
    for (const k in (L.add||{}))  m.add[k]  = (m.add[k]  || 0) + L.add[k] * n; });
  return m;
}
function attrMoveOf(a){ const L = typeof ATTR !== 'undefined' && ATTR.list.find(x=>x.movePer); return L && a ? Math.floor((a[L.key]||0) / L.movePer) : 0; }
function attrSkillPowOf(a){ let p = 1; if (typeof ATTR !== 'undefined' && a) ATTR.list.forEach(L=>{ if (L.skillPow) p += L.skillPow * (a[L.key]||0); }); return p; }
function attrMove(id){ return isParty(id) ? attrMoveOf(attrOf(id)) : 0; }
// '추천' : 그 인물의 비율(attrRec)대로 점수를 나눔 (나머지는 비율이 큰 쪽부터)
function attrRecommend(id, total){
  const rec = (id==='hero' ? ((HERO_LOOKS[heroSex()]||{}).attrRec) : (UNITS[id]||{}).attrRec) || [1,1,1];
  const sum = rec.reduce((a,b)=>a+b, 0) || 1, keys = ['mu','ne','sin'];
  const raw = rec.map(r=> total * r / sum), out = raw.map(Math.floor); let left = total - out.reduce((a,b)=>a+b, 0);
  raw.map((r,i)=>[r - out[i], rec[i], i]).sort((a,b)=> b[0]-a[0] || b[1]-a[1]).forEach(([,,i])=>{ if (left > 0){ out[i]++; left--; } });
  const o = {}; keys.forEach((k,i)=> o[k] = out[i]); return o;
}

/* ---------- 영약 (data/items.js 의 ELIXIRS) : 종류마다 인물당 max 개 — st.elixir = { '초급 영약':n, … } (예전 저장은 숫자 = 초급) ---------- */
function elixirList(){ return typeof ELIXIRS !== 'undefined' ? ELIXIRS : []; }
function elixirDef(name){ return elixirList().find(e=> e.item===name) || null; }
function elixirCount(st, name){
  if (!st) return 0;
  if (typeof st.elixir === 'number'){ const n = st.elixir; st.elixir = {}; if (n) st.elixir[(elixirList()[0]||{}).item || '초급 영약'] = n; }
  return (st.elixir || {})[name] || 0;
}

// 해금한 심법(패시브)들의 효과 합
function treeEffects(id){
  const e = { mpRegen:0, hpRegen:0, counterPow:0, dmgCut:0 };
  unlockedNodes(id).forEach(n=>{ if (n.effect) for (const k in n.effect) e[k] = (e[k]||0) + n.effect[k]; });
  if (typeof artsSimbeopEffects==='function') artsSimbeopEffects(id, e);   // 이야기에서 받은 심법 (자하공 등 · js/arts.js)
  e.dmgCut = Math.min(0.6, e.dmgCut);                       // 받는 피해 감소는 최대 60%
  return e;
}
function treeSkills(id){ return unlockedNodes(id).filter(n=>n.type==='skill' && n.skill).map(n=>n.skill); }
// 무공 숙련 (n성) : { 무공이름: { power, guard, star } }
function treeMastery(id){
  const m = {};
  treeSkills(id).forEach(s=>{ m[s] = { power:0, guard:0, heal:0, star:1 }; });
  unlockedNodes(id).forEach(n=>{ if (n.type!=='master' && !n.evo) return; const o = m[n.skill] || (m[n.skill] = { power:0, guard:0, heal:0, star:1 });
    o.power += n.power||0; o.guard += n.guard||0; o.heal += n.heal||0; o.star++; });
  return typeof artsMasteryCarry==='function' ? artsMasteryCarry(id, m) : m;
}
// 경지 상승 : 지금 판을 모두 채우고 다음 경지 레벨이 되면
function boardDone(id){ const on = treeUnlocked(id), b = treeNodes(id); return b.length>0 && b.every(n=>on.includes(n.id)); }
function ascendInfo(id){
  const st = memberState(id), ri = realmIndex(memberRealm(id)), next = REALM_LEVELS[ri+1];
  const b = treeNodes(id), on = treeUnlocked(id);
  const done = b.filter(n=>on.includes(n.id)).length;
  if (!next) return { max:true, done, total:b.length };
  const full = done===b.length, lvOk = (st.level||1) >= next[1];
  return { ok:full && lvOk, full, lvOk, done, total:b.length, from:REALMS[ri], to:next[0], need:next[1], level:st.level||1 };
}
// 뒤처진 동료 따라잡기 (data/training.js 의 CATCH_UP) : 주인공보다 경지가 gap 단계 넘게 낮은 동료는
//   (주인공 경지 - gap) 까지 올려 줌 — 그 아래 경지의 판은 모두 채운 채로, 레벨은 그 경지 첫 레벨 이상. 올린 인물 id 목록을 돌려줌
function catchUpMembers(){
  if (typeof CATCH_UP === 'undefined' || !CATCH_UP) return [];
  const to = realmIndex(memberRealm('hero')) - (CATCH_UP.gap || 1), out = [];
  if (to <= 0) return out;
  PARTY.forEach(id=>{
    if (id==='hero') return; const st = memberState(id); if (!st || realmIndex(memberRealm(id)) >= to) return;
    const t = st.tree || (st.tree = []);
    for (let r = 0; r < to; r++) realmBoard(id, r).forEach(n=>{ if (!t.includes(n.id)) t.push(n.id); });
    st.realm = REALMS[to]; st.level = Math.max(st.level||1, REALM_LEVELS[to][1]);
    out.push(id);
  });
  return out;
}
function ascendRealm(id){
  const a = ascendInfo(id); if (!a.ok) return false;
  const st = memberState(id); st.realm = a.to;
  const cap = levelCap(id);                                   // 벽에서 기다리던 경험치 → 바로 레벨업
  while ((st.exp||0) >= EXP_MAX && st.level < cap){ st.exp -= EXP_MAX; st.level++; }
  if (typeof metaOnRealm==='function') metaOnRealm(id);       // 업적 (js/meta.js)
  return true;
}

// 능력치 = 레벨 + 장비 + 수련도.  bonus = 장비 + 수련도 (상태보기의 초록 숫자)
//   realm 을 주면 그 경지의 명중 · 회피 (아군), 없으면 레벨로 정해진 경지 (우군 · 적)
// mods : 인물 특성 · 대장 등급 [{ mult:{hp,mp,atk,def}, add:{hit,eva,…} }] — 레벨 능력치에 곱하고 더한 뒤 장비 · 수련도를 더함
function computeStats(level, equip, extra, realm, mods){
  const s0 = statsAtLevel(level), e = equipBonus(equip), t = extra || {};
  const s = Object.assign({}, s0);
  (mods || []).forEach(m=>{ if (!m) return;
    for (const k in (m.mult||{})) if (s[k] !== undefined) s[k] = Math.round(s[k] * m.mult[k]);
  });
  const r = (realm && REALM_HIT_EVA[realm]) ? realm : s.realm, he = REALM_HIT_EVA[r] || [s.hit, s.eva];
  const b = { atk:e.atk+(t.atk||0), def:e.def+(t.def||0), hit:e.hit+(t.hit||0), eva:e.eva+(t.eva||0), hp:e.hp+(t.hp||0), mp:e.mp+(t.mp||0) };
  const a = { atk:0, def:0, hit:0, eva:0, hp:0, mp:0 };
  (mods || []).forEach(m=>{ if (m) for (const k in (m.add||{})) a[k] = (a[k]||0) + m.add[k]; });
  return { realm:r, atk:s.atk+b.atk+a.atk, def:s.def+b.def+a.def, hit:he[0]+b.hit+a.hit, eva:he[1]+b.eva+a.eva,
           maxHp:s.hp+b.hp+a.hp, maxMp:s.mp+b.mp+a.mp, bonus:b };
}
// 인물 특성 · 대장 등급 보정 목록 (computeStats 의 mods)
function isBossRank(r){ return r==='boss' || r==='final'; }
// 적 경지 보정 (data/growth.js 의 ENEMY_REALM) : 그 레벨(= 전투를 열 때의 주인공 레벨)의 경지 줄 → { mult } — 대장 · 중간보스는 체력을 더
//   표의 값은 그 경지 첫 레벨의 값 — 사이 레벨은 다음 경지 값까지 고르게 이어짐 (경지 경계에서 갑자기 세지지 않게)
function enemyRealmMod(level, rank){
  if (typeof ENEMY_REALM === 'undefined' || !level) return null;
  const ri = realmIndex(realmOfLevel(level)), a = ENEMY_REALM[REALMS[ri]] || {}, b = ENEMY_REALM[REALMS[ri+1]] || a;
  const lo = REALM_LEVELS[ri][1], hi = REALM_LEVELS[ri+1] ? REALM_LEVELS[ri+1][1] : lo, t = hi > lo ? Math.min(1, (level-lo)/(hi-lo)) : 0;
  const v = k => { const x = a[k] || 1, y = b[k] || x; return x + (y-x)*t; };
  const m = { mult:{} }; ['hp','atk','def','mp'].forEach(k=>{ const x = v(k); if (x !== 1) m.mult[k] = x; });
  const x = isBossRank(rank) ? v('boss') : (rank==='mid' ? v('mid') : 1);
  if (x !== 1) m.mult.hp = (m.mult.hp||1) * x;
  return Object.keys(m.mult).length ? m : null;
}
function statMods(id, rank, side, attr, level){        // attr : 능력 점수 (안 주면 저장된 점수, null 이면 빼고 계산) · level : 적 경지 보정에 쓰는 레벨 (주인공 레벨)
  const d = UNITS[id] || {}, out = [];
  if (side!=='enemy' && isParty(id) && memberState(id)){ const am = attrModOf(attr === undefined ? attrOf(id) : attr); if (am) out.push(am); }
  if (d.trait) out.push(d.trait);
  if (rank && typeof UNIT_RANKS !== 'undefined' && UNIT_RANKS[rank]) out.push(UNIT_RANKS[rank]);
  if (side==='enemy' && typeof ENEMY_STAT !== 'undefined') out.push(ENEMY_STAT);       // 적 공통 보정 (data/growth.js)
  if (side==='enemy'){ const er = enemyRealmMod(level, rank); if (er) out.push(er); }    // 적 경지 보정 (data/growth.js)
  return out;
}
// 특성 이름 (주인공은 모습에 따라)
function traitName(id){
  if (id==='hero') return ((typeof HERO_LOOKS !== 'undefined' && HERO_LOOKS[HERO.look==='f' ? 'f' : 'm']) || {}).trait || '';
  return ((UNITS[id] || {}).trait || {}).name || '';
}

/* ================= 이야기 씬 ================= */
const SHOW_HUB_BUTTON = false;   // true 면 처음부터 거점 버튼을 보임 (테스트용). 보통은 장면의 unlock:'hub' 로 열림
let curScene = FIRST_SCENE;
// 남녀 주인공에 따라 다른 대사 — only:'m'|'f' 인 줄은 그 주인공일 때만, textM / textF 는 그 주인공일 때 text 대신
function heroSex(){ return HERO.look==='f' ? 'f' : 'm'; }
function sexOk(L){ return !L || !L.only || L.only===heroSex(); }
function sexText(o){ return (heroSex()==='f' ? o.textF : o.textM) || o.text; }
function curScript(){ return SCENES[curScene].script.filter(sexOk); }
// 배경 : 여자 주인공이면 '이름_f' 그림이 있을 때 그것을 씀 (엔딩 장면 등)
function bgKey(key){ return (key && heroSex()==='f' && (ASSETS.bg || {})[key+'_f']) ? key+'_f' : key; }
function setStoryBg(key){ document.getElementById('story-screen').style.backgroundImage = cssUrl(asset('bg.'+bgKey(key))); }
// 이야기 장면 카드 — cast 목록의 첫 인물은 왼쪽, 나머지는 오른쪽에 나란히
const castEls = {};
function castEl(id){
  if (!castEls[id]){ const im = document.createElement('img'); im.className = 'story-card'; im.alt = ''; castEls[id] = im; }
  castEls[id].src = cardOf(id);
  return castEls[id];
}
function setCast(list){
  const wrap = document.getElementById('story-cards'); wrap.innerHTML = '';
  const L = document.createElement('div'), R = document.createElement('div');
  L.className = R.className = 'card-pair';
  list.forEach((id,i)=> (i===0 ? L : R).appendChild(castEl(id)));
  wrap.appendChild(L); wrap.appendChild(R);
  wrap.classList.toggle('four', list.length===4);
  wrap.classList.toggle('five', list.length>=5);
}
function fadeSwap(mid, after){
  const f = document.getElementById('fade'); f.classList.add('on');
  setTimeout(()=>{ if (mid) mid(); setTimeout(()=>{ f.classList.remove('on'); setTimeout(()=>{ if (after) after(); }, 460); }, 150); }, 460);
}
let storyBusy = false;
/* 받기 (대사 한 줄의 give · 끝 화면 인물의 give 공통)
   { gold:700, suryeon:300, item:'금창약', n:7, items:[ '옥패', { item:'해독제', n:2 } ], skill:'일운 찌르기', to:'hero' }
   — 적은 것만 받음. skill = 무공을 배움 (to = 배우는 아군, 적지 않으면 주인공) */
function applyGive(g){
  const got = [];
  if (g.gold){ PLAYER.gold += g.gold; got.push('금 '+g.gold.toLocaleString()); }
  if (g.suryeon){ PLAYER.suryeon = (PLAYER.suryeon||0) + g.suryeon; got.push('수련치 '+g.suryeon.toLocaleString()); }
  [].concat(g.item ? [{ item:g.item, n:g.n||1 }] : [], (g.items||[]).map(x=> typeof x==='string' ? { item:x, n:1 } : { item:x.item, n:x.n||1 }))
    .forEach(o=>{ for (let k=0;k<o.n;k++) addToBag(o.item); got.push(o.item+(o.n>1 ? ' '+o.n+'개' : '')); });
  if (g.skill && SKILLS[g.skill]){
    const id = g.to || 'hero', st = memberState(id);
    if (st){ st.learned = st.learned || []; if (!st.learned.includes(g.skill)) st.learned.push(g.skill);
             got.push(nameOf(id)+josa(nameOf(id),'이','가')+' 무공 「'+g.skill+'」'+josa(g.skill,'을','를')+' 익힘');
             if (typeof artsAfterLearn==='function') artsAfterLearn(id, g.skill); }
  }
  if (g.simbeop && typeof SIMBEOP !== 'undefined' && SIMBEOP[g.simbeop]){        // 심법 (data/arts.js 의 SIMBEOP)
    const id = g.to || 'hero', st = memberState(id);
    if (st){ st.simbeop = st.simbeop || []; if (!st.simbeop.includes(g.simbeop)) st.simbeop.push(g.simbeop);
             got.push(nameOf(id)+josa(nameOf(id),'이','가')+' 심법 「'+g.simbeop+'」'+josa(g.simbeop,'을','를')+' 깨우침'); }
  }
  return got;
}
// 회상 · 시점 표시 : 장면의 flashback:true (처음부터 회상) · pov:'천교' (적의 시점), 대사 줄의 fb:true / false (회상 들어가기 · 나오기)
let storyFb = false;
function setStoryMood(sc, fb){
  const ss = document.getElementById('story-screen'), bd = document.getElementById('story-badge');
  ss.classList.toggle('fb', !!fb);
  if (!bd) return;
  ss.classList.toggle('night', !fb && !!(sc && sc.night));          // 밤 장면 (낮 그림을 쓸 때 어둡게)
  const pov = sc && sc.pov, t = fb ? (pov ? pov+' 시점 · 회상' : '회상') : (pov ? pov+' 시점' : '');
  bd.textContent = t; bd.classList.toggle('on', !!t); bd.classList.toggle('pov', !!pov);
}
function advanceTo(i){
  const line = curScript()[i];
  if (line.fb !== undefined) storyFb = !!line.fb;
  if (line.join) joinParty(line.join);
  if (line.give){ const got = applyGive(line.give); if (got.length) setTimeout(()=>showToast('받았습니다 — '+got.join(' · ')), 300); }
  if (line.bg){
    storyBusy = true;
    fadeSwap(()=>{ setStoryBg(line.bg); if (line.cast) setCast(line.cast); setStoryMood(SCENES[curScene], storyFb); }, ()=>{ storyBusy = false; showLine(i); });
    return;
  }
  if (line.fb !== undefined) setStoryMood(SCENES[curScene], storyFb);
  if (line.cast) setCast(line.cast);
  showLine(i);
}
// 장면 끝의 unlock (예: 'hub') → 진행 표시(PLAYER.flags)에 기록. 새로 열린 것들을 돌려줌
function unlockFromScene(sc){
  const list = [].concat(sc.unlock || []), opened = [];
  list.forEach(k=>{ if (!PLAYER.flags[k]){ PLAYER.flags[k] = true; opened.push(k); } });
  return opened;
}
function hubOpen(){ return SHOW_HUB_BUTTON || !!PLAYER.flags.hub; }
// 다음 장면으로 바로 이어가기. 장(chapter)이 바뀌면 검은 화면에 장 제목을 잠깐 보여 줌
function chainScene(next){
  const from = SCENES[curScene], to = SCENES[next];
  const newChapter = !!(to.chapter && to.chapter !== from.chapter);
  const card = document.getElementById('chapter-card');
  storyBusy = true;
  fadeSwap(()=>{
    curScene = next; resetStoryScreen(to); scriptIdx = 0;
    storyTextSpan.textContent = ''; storyName.textContent = ''; storyNext.style.visibility = 'hidden';
    if (newChapter){ card.innerHTML = '<b>'+to.chapter+'</b><span>'+(to.title || to.place || '')+'</span>'; card.classList.add('on'); }
  }, ()=>{
    const go = ()=>{ storyBusy = false; advanceTo(0); setTimeout(()=>autoSave('start'), 700); };
    if (newChapter) setTimeout(()=>{ card.classList.remove('on'); setTimeout(go, 650); }, 1900); else go();
  });
}
function resetStoryScreen(sc){
  const ss = document.getElementById('story-screen');
  ss.style.display = ''; ss.classList.remove('ended');
  setStoryBg(sc.bg); setCast(sc.cast);
  storyFb = !!sc.flashback; setStoryMood(sc, storyFb);
  document.getElementById('top-menu-wrap').classList.add('hidden');
  document.getElementById('hub-open-wrap').classList.add('hidden');
  document.getElementById('snpc-box').style.display = 'none';
  document.getElementById('story-npcs').innerHTML = '';
  curPlace = null; buildPlaceButtons();
  document.getElementById('story-box').style.cursor = 'pointer';
}
function startScene(name, fromLoad){
  curScene = name; playBgm('story');
  if (!fromLoad){ setTimeout(()=>autoSave('start'), 1500); }
  else setTimeout(()=>codexCheck(true), 50);   // 새 이야기 장면 : 표국 귀환 · 승급, 자동 저장
  ['intro-screen','battle-screen','hub-screen','npc-screen'].forEach(id=>{ const el=document.getElementById(id); if (el) el.style.display='none'; });
  resetStoryScreen(SCENES[name]);
  scriptIdx = 0; advanceTo(0);
}
let scriptIdx = 0, typing = false, typeTimer = null;
const HERO = { name:'주인공', look:'m', job:HERO_DEFAULT.job, move:HERO_DEFAULT.move, skills:HERO_DEFAULT.skills.slice(),
               level:1, exp:0, realm:REALMS[0], equip:{ weapon:null, armor:null, accessory:null, treasure:null }, attr:{ mu:0, ne:0, sin:0 },
               tree:[], learned:[] };     // tree = 수련도에서 해금한 노드, learned = 이야기 등으로 따로 배운 무공
function fillName(t){ return codexText(t); }   // {name} → 주인공 이름 (조사는 받침에 맞춤) · {소협|소저} → 남자 주인공은 앞, 여자 주인공은 뒤 — 아래 codexText
function lineText(line){ return fillName(sexText(line)); }

/* ---------- 대사 줄 나눔 · 창 넘김 (이야기 · 전투 대사 · 인물에게 말 걸기 공통) ----------
   - 문장(. ? !)이 끝나면 줄을 바꿈. 아주 짧은 말("흥." "예." "알겠소.")은 한 줄에 들어가면 다음 문장과 붙여 둠
   - 한 줄에 안 들어가는 긴 문장은 줄 수는 가장 적게, 줄 길이는 고르게 나눔 (쉼표 · 말줄임 · 닫는 괄호 뒤에서 끊기를 좋아함)
     → 마지막 줄에 낱말 하나만 덩그러니 남지 않음
   - 창 하나에 들어가는 줄 수(dlgRows)를 넘으면 '클릭해서 계속' 으로 다음 창. 한 문장은 되도록 한 창 안에
   - 대사 글에 '\n' 을 넣으면 그 자리에서 줄을 바꿈
   - 줄 길이는 기기 화면 폭에 맞춰 그때그때 잼 (canvas 로 글자 폭 측정) */
let _dlgCtx = null;
function dlgMeasurer(el){
  if (!_dlgCtx) _dlgCtx = document.createElement('canvas').getContext('2d');
  const cs = getComputedStyle(el), font = cs.fontStyle+' '+cs.fontWeight+' '+cs.fontSize+' '+cs.fontFamily, cache = {};
  return s=>{ if (cache[s] === undefined){ _dlgCtx.font = font; cache[s] = _dlgCtx.measureText(s).width; } return cache[s]; };
}
function dlgWidth(box){      // 글이 놓일 칸의 안쪽 폭
  const cs = getComputedStyle(box);
  return box.clientWidth - (parseFloat(cs.paddingLeft)||0) - (parseFloat(cs.paddingRight)||0) - 3;
}
function dlgRows(kind){ return kind==='story' && window.innerHeight <= 500 ? 2 : 3; }   // 폰 가로 : 이야기 창은 두 줄
function dlgSentences(par){
  const out = [], re = /[.?!]+["'”’」』)\]]*\s+/g; let last = 0, m;
  while ((m = re.exec(par))){ out.push(par.slice(last, m.index + m[0].trimEnd().length)); last = m.index + m[0].length; }
  if (last < par.length) out.push(par.slice(last));
  return out.map(s=>s.trim()).filter(Boolean);
}
// 낱말 a 뒤 · 낱말 b 앞에서 줄을 바꿀 때의 벌점 — 작을수록 자연스러운 자리
function dlgBreakCost(a, b){
  if (/[,…)」』:;~—]$/.test(a)) return 0;                                         // 쉼표 · 말줄임 뒤
  const core = a.replace(/[^가-힣]+$/,'');
  if (/^(그|이|저|몇|한|두|세|네|새|옛|온|모든|어느|무슨|웬|십|백|천|만|열|스무|다섯|여섯|일곱|여덟|아홉)$/.test(core)) return 0.6;   // '그 / 무렵' · '십 / 년'
  if (/^(수|것|줄|뿐|때문|듯|만큼|채|척|터|바)/.test(b) && b.length <= 4) return 0.6;              // '할 / 수 있다'
  if (/지$/.test(core) && /^(못|않|말)/.test(b)) return 0.6;                                       // '끼지 / 못해'
  if (/[아어여해와워줘봐]$/.test(core) && /^(주|줘|준|보|봐|본|버|두|놓|있|내|드|댔)/.test(b)) return 0.4;   // '알아 / 보다'
  if (/(지만|는데|은데|인데|던데|니까|으니|면서|다가|도록|려고|어서|아서|해서|여서|으며|니|며|고|면|서)$/.test(core)) return 0.05;   // 이어지는 말 끝
  return 0.2;
}
// 한 문장을 폭 W 안의 줄들로 : (줄 수, 들쭉날쭉한 정도 + 끊는 자리 벌점) 이 가장 작게
function dlgWrap(s, W, mw){
  if (mw(s) <= W) return [s];
  const w = s.split(' '), n = w.length, seg = (a,b)=> w.slice(a,b).join(' ');
  const best = [{ rows:0, cost:0, prev:-1 }];
  for (let b=1;b<=n;b++){
    let bb = null;
    for (let a=b-1;a>=0;a--){
      const tw = mw(seg(a,b));
      if (tw > W && b-a > 1) break;
      const p = best[a]; if (!p) continue;
      const slack = Math.max(0, (W - tw) / W);
      const cost = p.cost + slack*slack + (b<n ? dlgBreakCost(w[b-1], w[b]) : 0), rows = p.rows + 1;
      if (!bb || rows < bb.rows || (rows===bb.rows && cost < bb.cost)) bb = { rows, cost, prev:a };
    }
    best[b] = bb;
  }
  const out = []; let b = n;
  while (b > 0){ const a = best[b].prev; out.unshift(seg(a,b)); b = a; }
  return out;
}
// 대사 하나 → 창(page) 목록. 창마다 줄은 '\n' 으로
function dlgPages(text, el, W, maxRows){
  const mw = dlgMeasurer(el);
  const pars = String(text||'').split('\n').map(dlgSentences);
  // ① 문장마다 한 줄 (아주 짧은 말은 한 줄에 들어가면 다음 문장과 함께)
  const groups = [];
  pars.forEach(ss=>{
    for (let i=0;i<ss.length;i++){
      let s = ss[i];
      while (i+1 < ss.length && s.replace(/[^가-힣A-Za-z0-9]/g,'').length <= 3 && mw(s+' '+ss[i+1]) <= W) s = s+' '+ss[++i];
      groups.push(dlgWrap(s, W, mw));
    }
  });
  // ② 창 하나를 넘치면 : 이웃한 짧은 문장끼리 한 줄에 붙여서 창 하나에 담을 수 있는지 (붙이는 건 되도록 적게, 줄 길이는 고르게)
  if (groups.reduce((n,g)=>n+g.length,0) > maxRows){
    const units = []; pars.forEach((ss,pi)=> ss.forEach(s=> units.push({ s, par:pi, rows:dlgWrap(s, W, mw) })));
    const k = units.length;
    if (k > 1 && k <= 10){
      let best = null;
      for (let mask=0; mask < (1<<(k-1)); mask++){            // mask 의 i 번째 비트 = i 번째와 i+1 번째 문장을 한 줄에
        const rows = []; let ok = true, i = 0;
        while (ok && i < k){
          let j = i; while (j < k-1 && (mask>>j & 1)) j++;
          if (j === i) rows.push(...units[i].rows);
          else {
            const grp = units.slice(i, j+1), t = grp.map(u=>u.s).join(' ');
            if (grp.some(u=>u.rows.length > 1 || u.par !== units[i].par) || mw(t) > W) ok = false; else rows.push(t);
          }
          i = j + 1;
        }
        if (!ok || rows.length > maxRows) continue;
        const cost = rows.reduce((c,t)=>{ const sl = Math.max(0, (W - mw(t)) / W); return c + sl*sl; }, 0);
        if (!best || rows.length > best.rows.length || (rows.length === best.rows.length && cost < best.cost)) best = { rows, cost };
      }
      if (best) return [best.rows.join('\n')];
    }
  }
  // ③ 그래도 넘치면 다음 창으로 (한 문장은 되도록 한 창 안에)
  const pages = []; let cur = [];
  groups.forEach(g=>{
    if (cur.length + g.length <= maxRows){ cur = cur.concat(g); return; }
    if (cur.length){ pages.push(cur); cur = []; }
    g = g.slice(); while (g.length > maxRows) pages.push(g.splice(0, maxRows));
    cur = g;
  });
  if (cur.length || !pages.length) pages.push(cur);
  return pages.map(p=>p.join('\n'));
}
// 글자를 하나씩 — 아직 안 나온 글자도 자리를 미리 차지해서 줄이 도중에 바뀌며 글이 튀지 않게. 타이머 id 를 돌려줌
function typeText(el, text, ms, onDone){
  const chars = Array.from(text); let c = 0;
  el.innerHTML = '<span></span><span class="ghost"></span>';
  const a = el.firstChild, g = el.lastChild; g.textContent = text;
  const id = setInterval(()=>{
    c++; a.textContent = chars.slice(0,c).join(''); g.textContent = chars.slice(c).join('');
    if (c >= chars.length){ clearInterval(id); if (onDone) onDone(); }
  }, ms);
  return id;
}

/* ---------- 아군 파티 (주인공 + 합류한 인물) ---------- */
let PARTY = ['hero'];      // 합류 순서
let MEMBERS = {};          // 합류 인물 상태 { level, exp, realm, equip }
function isParty(id){ return PARTY.includes(id); }
function memberState(id){ return id==='hero' ? HERO : MEMBERS[id]; }
function emptyEquip(){ return { weapon:null, armor:null, accessory:null, treasure:null }; }
// 예전 저장 : 장신구 칸에 낀 심법 서책 · 보패 → 보물 칸으로 (보물 칸에 이미 있으면 배낭으로)
function fixEquipSlots(st){
  if (!st || !st.equip) return;
  st.equip = Object.assign(emptyEquip(), st.equip);
  const a = st.equip.accessory, it = a && ITEM_DB[a];
  if (it && it.type==='treasure'){ if (!st.equip.treasure) st.equip.treasure = a; else addToBag(a); st.equip.accessory = null; }
  if (!st.attr) st.attr = { mu:0, ne:0, sin:0 };
}
function joinParty(id, silent){
  const d = UNITS[id];
  if (!d || isParty(id)) return;
  PARTY.push(id);
  let lv = Math.max(resolveLevel(d.level, 1), d.minLevel||0);   // 'hero+2' = 합류할 때 주인공 레벨 +2 · minLevel = 레벨 하한
  let realm = realmOfLevel(lv);
  const jr = d.joinRealm==='hero' ? memberRealm('hero') : d.joinRealm;   // joinRealm:'hero' = 주인공과 같은 경지로
  if (jr && REALMS.includes(jr)){                                    // joinRealm = 이 경지로 합류 (레벨도 그 경지 구간 안으로)
    const ri = REALMS.indexOf(jr), lo = REALM_LEVELS[ri][1], hi = REALM_LEVELS[ri+1] ? REALM_LEVELS[ri+1][1] : MAX_LEVEL;
    lv = Math.max(lo, Math.min(hi, lv)); realm = jr;
  }
  MEMBERS[id] = { level:lv, exp:0, realm, equip:emptyEquip(), tree:(d.startTree||[]).slice(), learned:[], attr:{ mu:0, ne:0, sin:0 } };
  if (d.autoTree){                                                   // 늦게 합류 : 지난 경지의 판은 모두 채운 채로 (지금 경지의 판은 처음부터)
    const ri = REALMS.indexOf(realm), t = MEMBERS[id].tree;
    for (let r = 0; r < ri; r++) realmBoard(id, r).forEach(n=>{ if (!t.includes(n.id)) t.push(n.id); });
    if (d.startTree) d.startTree.forEach(x=>{ if (!t.includes(x)) t.push(x); });
  }
  equipFixedGear(id, d.gearGrade != null ? d.gearGrade : (chapterNo((SCENES[curScene] || {}).chapter) >= 2 ? 1 : 0));   // 제2장부터 합류 : 상급(파랑)
  if (!silent) showToast(d.name+josa(d.name,'이','가')+' 아군으로 합류했습니다');
}
function resetParty(){ PARTY = ['hero']; MEMBERS = {}; }
// 아군이 익힌 무공 전부 = 원래 무공 + 따로 배운 무공(learned) + 수련도에서 해금한 무공
function memberSkillsAll(id){
  const st = memberState(id) || {};
  const base = id==='hero' ? (HERO.skills || []) : ((UNITS[id] || {}).skills || []);
  return Array.from(new Set(base.concat(st.learned || [], treeSkills(id)))).filter(n=>SKILLS[n]);
}
// 전투에 가지고 나가는 무공 — 주인공은 무공 칸, 동료는 세 갈래의 맨 위 무공 + 절기 (js/arts.js)
function memberSkills(id){ return typeof artsActive==='function' ? artsActive(id) : memberSkillsAll(id); }
// 전투 밖에서 경험치 받기 (전투 보상 등) — 오른 레벨 수를 돌려줌
function grantExp(id, amount){
  const st = memberState(id); if (!st || amount<=0) return 0;
  const cap = levelCap(id);
  let ups = 0; st.exp = (st.exp||0) + amount;
  while (st.exp >= EXP_MAX && st.level < cap){ st.exp -= EXP_MAX; st.level++; ups++; }
  if (st.level >= cap) st.exp = Math.min(st.exp, EXP_MAX);     // 경지의 벽 : 가득 찬 채로 대기
  if (st.level >= MAX_LEVEL) st.exp = 0;
  return ups;
}
const storyName = document.getElementById('story-name');
const storyTextSpan = document.getElementById('story-text-span');
const storyNext = document.getElementById('story-next');

function showLine(i){
  const line = curScript()[i];
  storyName.textContent = line.name || nameOf(line.who);
  storyName.classList.toggle('enemy', line.who==='enemy' || !!(UNITS[line.who]||{}).foe);   // 적 인물은 붉은 이름표
  if (line.shake){ const ss=document.getElementById('story-screen'); ss.classList.remove('shake'); void ss.offsetWidth; ss.classList.add('shake'); }
  Object.keys(castEls).forEach(id=>{
    const el = castEls[id];
    el.classList.toggle('dim', line.who!==id);
    el.classList.toggle('speaking', line.who===id);
  });
  storyPages = dlgPages(lineText(line), storyTextSpan, dlgWidth(document.getElementById('story-text')), dlgRows('story'));
  storyPage = 0; showStoryPage();
}
// 엔딩 화면 (data/story_ch11.js 의 ending 장면 : ending:true)
function showEnding(){
  PLAYER.flags = PLAYER.flags || {}; PLAYER.flags.cleared = true;
  if (typeof achCheck==='function') setTimeout(achCheck, 2500);              // 업적 '작은 별'
  const el = document.getElementById('ending-screen'); if (!el) return;
  const st = document.getElementById('end-stat');
  if (st) st.textContent = '성화대 ' + PARTY.length + '명 · 주인공 Lv ' + ((memberState('hero') || {}).level || '?');
  el.style.backgroundImage = 'radial-gradient(ellipse at 0% 100%, rgba(5,8,14,.72) 0%, rgba(5,8,14,0) 55%),' + cssUrl(asset('bg.'+bgKey('ending_lanterns')));   // 엔딩 그림 (양양 사당 · 연등 두 개 · 성화대) — 글은 왼쪽 아래
  el.classList.add('show');
}
document.addEventListener('click', ev=>{ if (ev.target && ev.target.id==='end-close') document.getElementById('ending-screen').classList.remove('show'); });
let storyPages = [''], storyPage = 0;
function showStoryPage(){
  storyNext.style.visibility = 'hidden';
  typing = true; clearInterval(typeTimer);
  typeTimer = typeText(storyTextSpan, storyPages[storyPage], 40, ()=>{ typing = false; storyNext.style.visibility = 'visible'; });
}

document.getElementById('story-box').addEventListener('click', ()=>{
  if (storyBusy) return;
  if (typing){
    clearInterval(typeTimer);
    storyTextSpan.textContent = storyPages[storyPage];
    typing = false;
    storyNext.style.visibility = 'visible';
    return;
  }
  if (storyPage < storyPages.length - 1){ storyPage++; showStoryPage(); return; }   // 긴 대사 : 다음 창
  scriptIdx++;
  if (scriptIdx >= curScript().length){
    const sc = SCENES[curScene];
    if (sc.fight && BATTLES[sc.fight]){ storyBusy = true; fadeSwap(()=>{ storyBusy = false; goBattle(sc.fight); }); return; }   // 끝 화면 없이 바로 전투
    const nx = resolveNext(sc.next);
    if (nx && SCENES[nx]){ chainScene(nx); return; }                  // 전투 없이 다음 장면으로
    document.getElementById('story-box').style.cursor = 'default';
    storyNext.style.visibility = 'hidden';
    document.getElementById('story-screen').classList.add('ended');   // 인물/대사 사라짐
    if (sc.ending) showEnding();                                        // 최종장 끝 : 엔딩 화면 (닫으면 거점 · 저장 그대로 둘러보기)
    buildStoryNpcs();
    document.getElementById('top-menu-wrap').classList.remove('hidden');
    const opened = unlockFromScene(sc);
    if (hubOpen()) document.getElementById('hub-open-wrap').classList.remove('hidden');
    refreshMissionBadges();
    if (opened.includes('hub')) setTimeout(()=>showToast('거점이 열렸습니다 — 아래 거점 버튼'), 500);
    setTimeout(pyoArrive, 500);                       // 대화가 다 끝나고 출정 전 : 표국 행렬 귀환 · 승급
    setTimeout(noticeMissions, 1100);
    setTimeout(()=>codexCheck(), 1500);
    setTimeout(()=>autoSave('end'), 700);             // 표국이 가져온 물건까지 담아서                                  // 장면이 끝난 화면 : 자동 저장
    return;
  }
  advanceTo(scriptIdx);
});

let toastTimer;
function showToast(msg){
  const el = document.getElementById('toast');
  el.textContent = msg; el.style.display = 'block';
  clearTimeout(toastTimer); toastTimer = setTimeout(()=>{ el.style.display='none'; }, 1400);
}
document.querySelectorAll('.top-btn[data-msg]').forEach(b=>{
  b.addEventListener('click', ()=> showToast(b.dataset.msg));
});

// 거점 화면
// 거점 그림 · 이름 : 장마다 (data/scenes.js 의 HUB_BASES — 제4장 성화대부터 거점을 옮김)
function hubBase(){
  const B = typeof HUB_BASES !== 'undefined' ? HUB_BASES : [], ch = chapterNo((SCENES[curScene] || {}).chapter);
  if (PLAYER.flags && PLAYER.flags.cleared){ const home = B.find(b=> b.home); if (home) return home; }   // 엔딩 뒤 : 성도 성화대 본진으로 돌아옴
  let cur = null; B.forEach(b=>{ if (ch >= b.ch) cur = b; }); return cur;
}
// 거점 그림마다 시설 단추 자리 (HUB_BASES 의 spots : { office, store, smith, pyo, train } = [가로 %, 세로 %]) — 없으면 처음 자리 (양양 장원)
const HUB_SPOT_EL = { office:'#hub-office', store:'[data-npc="store"]', smith:'[data-npc="smith"]', pyo:'#hub-pyo', train:'#hub-train' };
let hubSpot0 = null;
function placeHubSpots(spots){
  if (!hubSpot0){ hubSpot0 = {}; for (const k in HUB_SPOT_EL){ const el = document.querySelector('#hub-stage '+HUB_SPOT_EL[k]); if (el) hubSpot0[k] = [el.style.left, el.style.top]; } }
  for (const k in HUB_SPOT_EL){
    const el = document.querySelector('#hub-stage '+HUB_SPOT_EL[k]); if (!el) continue;
    const p = spots && spots[k] ? [spots[k][0]+'%', spots[k][1]+'%'] : hubSpot0[k];
    if (p){ el.style.left = p[0]; el.style.top = p[1]; }
  }
}
function applyHubBase(){
  const b = hubBase(), st = document.getElementById('hub-stage'), nm = document.getElementById('hub-base-name');
  st.style.backgroundImage = cssUrl(asset(b && b.bg ? 'bg.'+b.bg : 'bg.hub'));
  placeHubSpots(b && b.spots);
  if (nm){ nm.textContent = b ? b.name : '양양 · 천씨 장원'; }
}
document.getElementById('btn-hub').addEventListener('click', ()=>{
  clearNotices(); applyHubBase(); catchUpMembers();
  if (!tipSeen('hub')) setTimeout(()=>showTips('hub'), 300);
  document.getElementById('story-screen').style.display = 'none';
  document.getElementById('hub-screen').style.display = 'block';
  refreshMissionBadges();
});

/* ================= 알림 (화면 가운데에 쌓이는 쪽지) =================
   notify(제목, 내용, 종류) — 종류 : 'pyo'(표국) · 'mission'(임무) · 'up'(승급). 몇 초 뒤 사라지고, 누르면 바로 닫힘 */
function notify(title, body, kind){
  const st = document.getElementById('notice-stack'); if (!st) return;
  if (document.getElementById('battle-screen').style.display === 'block') return;   // 출정을 서둘러 눌러도 전투 화면에는 띄우지 않음
  const el = document.createElement('div'); el.className = 'notice ' + (kind || '');
  el.innerHTML = '<b>' + title + '</b>' + (body ? '<span>' + String(body).split('\n').join('<br>') + '</span>' : '');
  const close = ()=>{ if (el.classList.contains('out')) return; el.classList.add('out'); setTimeout(()=> el.remove(), 320); };
  el.addEventListener('click', ev=>{ ev.stopPropagation(); close(); });
  st.appendChild(el);
  while (st.children.length > 4) st.removeChild(st.firstChild);
  setTimeout(close, kind==='mission' ? 6000 : 7000);
}
// 떠 있는 알림을 모두 닫음 (거점에 들어가거나 창을 열 때 — 이미 본 것으로 침)
function clearNotices(){ document.querySelectorAll('#notice-stack .notice').forEach(el=>{ el.classList.add('out'); setTimeout(()=> el.remove(), 320); }); }
// 이야기 끝 화면 : 집무실에 아직 받지 않은 임무가 있으면 알림 (임무마다 한 번)
const noticedMissions = new Set();
function noticeMissions(){
  const vis = id=>{ const el = document.getElementById(id); return el && el.style.display && el.style.display!=='none'; };
  if (vis('hub-screen') || vis('npc-screen') || vis('battle-screen')) return;      // 이미 거점 · 전투에 들어갔으면 알리지 않음 (배지로 충분)
  const M = missionDB();
  offerMissions().filter(id=>!missionState(id) && !noticedMissions.has(id)).forEach(id=>{
    noticedMissions.add(id);
    notify('집무실에 새 임무가 있습니다', M[id].title + ' — 거점 → 집무실에서 수락', 'mission');
  });
}

/* ================= 표국 (data/pyoguk.js) =================
   의뢰는 늘 같은 5가지 (PYOGUK.jobs). 한 번에 pyoPicks() 곳까지 보냄
   PLAYER.pyo = { grade, sent:[보낸 의뢰 { id, title, route, loot:{ items:[{item,n}] } 또는 { gold }, at:보낸 장면 }] }
   가져오는 것은 보낸 때의 장에 따라 (PYOGUK.jobs 의 items · gold 가 장마다 배열) — 예전 저장의 { reward, n } 도 그대로 받음 */
function chapterNo(ch){ if (!ch || ch==='서장') return 0; if (ch==='최종장') return 11; const m = String(ch).match(/\d+/); return m ? +m[0] : 0; }
function pyoGrade(){ return Math.max(1, chapterNo((SCENES[curScene] || {}).chapter)); }
function pyoPicks(g){ return Math.min(PYOGUK.jobs.length, (PYOGUK.picksBase || 2) + (g || 1) - 1); }   // 한 번에 보낼 수 있는 행렬 수
function pyoGradeName(g){ const n = (PYOGUK.gradeNames || [])[g-1]; return g + '등급' + (n ? ' · ' + n : ''); }
function pyoState(){
  if (!PLAYER.pyo) PLAYER.pyo = { grade:pyoGrade(), sent:[] };
  const P = PLAYER.pyo; P.sent = P.sent || []; delete P.offers;      // offers : 예전(무작위 의뢰) 저장에만 있던 것
  return P;
}
function pyoAt(arr, g){ return Array.isArray(arr) ? arr[Math.min(arr.length, Math.max(1, g)) - 1] : arr; }   // 장마다 배열 → 그 장의 값 (모자라면 마지막)
// 의뢰(정의) 또는 보낸 행렬 → { gold } | { items:[{item,n}] }
function pyoLoot(j, g){
  if (j.loot) return j.loot;                                                                  // 보낸 행렬 (보낸 때 정해짐)
  if (j.gold) return { gold:pyoAt(j.gold, g) };
  if (j.items){ const L = pyoAt(j.items, g) || []; return { items:L.map(x=> Array.isArray(x) ? { item:x[0], n:x[1] } : x) }; }
  if (j.reward) return { items:[{ item:ITEM_RENAMED[j.reward] || j.reward, n:j.n || 1 }] };   // 예전 저장
  return { items:[] };
}
function pyoRewardText(j, g){ const L = pyoLoot(j, g); return L.gold ? '금 ' + L.gold.toLocaleString() : L.items.map(x=> (ITEM_RENAMED[x.item] || x.item) + ' ' + x.n + '개').join(' · '); }
function pyoRewardIcon(j, g){ const L = pyoLoot(j, g); return L.gold ? '<span class="pyo-gold">金</span>' : itemIcon(ITEM_RENAMED[(L.items[0]||{}).item] || (L.items[0]||{}).item); }
function pyoIdle(){ const P = PLAYER.pyo; const g = P ? P.grade : pyoGrade(); return Math.max(0, pyoPicks(g) - (P ? P.sent.length : 0)); }   // 더 보낼 수 있는 행렬 수
// 이야기 대화가 다 끝난 화면 (출정 전) : 그 전 장면에서 보낸 행렬이 돌아옴 + 장이 바뀌었으면 승급
function pyoArrive(){
  if (!hubOpen()) return;
  const P = pyoState(), g = pyoGrade();
  const back = P.sent.filter(j=> j.at !== curScene);    // 보낸 장면이 아닌, 그 뒤 이야기의 끝 화면에서 돌아옴
  if (back.length){
    P.sent = P.sent.filter(j=> j.at === curScene);
    let items = false;
    const lines = back.map(j=>{
      const L = pyoLoot(j);
      if (L.gold) PLAYER.gold += L.gold;
      else L.items.forEach(x=>{ const r = ITEM_RENAMED[x.item] || x.item; PLAYER.inv[r] = (PLAYER.inv[r] || 0) + x.n; items = true; });
      return j.title + ' — ' + pyoRewardText(j);
    });
    notify('표국 행렬이 돌아왔습니다', lines.join('\n') + (items ? '\n(배낭에 넣었습니다)' : ''), 'pyo');
  }
  if (g > (P.grade || 1)){
    const before = pyoPicks(P.grade || 1); P.grade = g;
    setTimeout(()=> notify('표국이 승급했습니다', pyoGradeName(g) + (pyoPicks(g) > before ? ' — 한 번에 보내는 행렬 ' + pyoPicks(g) + '곳' : ''), 'up'), 400);
  }
  refreshMissionBadges();
}
function renderPyo(){
  const P = pyoState(), max = pyoPicks(P.grade), left = Math.max(0, max - P.sent.length);
  document.getElementById('pyo-grade').textContent = pyoGradeName(P.grade) + ' · 행렬 ' + P.sent.length + ' / ' + max;
  const g = pyoGrade();
  let h = '<div class="of-sec">의뢰 다섯 중 ' + max + '곳까지 골라 보냅니다 · 다음 이야기가 끝나고 출발하기 전에 돌아옴 · 가져오는 것은 보낸 때의 장에 따라</div>';
  PYOGUK.jobs.forEach(j=>{
    const sent = P.sent.find(s=> s.id === j.id), out = !!sent;
    h += '<div class="pyo-job' + (out ? ' out' : '') + '"><span class="pj-ic">' + pyoRewardIcon(sent || j, g) + '</span>' +
         '<div class="pj-main"><b>' + pyoRewardText(sent || j, g) + '</b><small>' + j.title + ' · ' + j.route + '</small></div>' +
         (out ? '<span class="pyo-out">길을 떠남</span>'
              : '<div class="top-btn pyo-send' + (left ? '' : ' off') + '" data-id="' + j.id + '">' + (left ? '보내기' : '행렬 없음') + '</div>') +
         '</div>';
  });
  const old = P.sent.filter(s=> !s.id || !PYOGUK.jobs.some(j=> j.id === s.id));   // 예전 저장의 무작위 의뢰
  if (old.length){
    h += '<div class="of-sec">길을 떠난 행렬 (예전 의뢰)</div>';
    old.forEach(j=>{ h += '<div class="of-past"><span>' + j.title + '</span><span class="ok">' + pyoRewardText(j) + ' · 다음 이야기가 끝나면 돌아옴</span></div>'; });
  }
  const body = document.getElementById('pyo-body'); body.innerHTML = h;
  body.querySelectorAll('.pyo-send').forEach(b=> b.addEventListener('click', ()=> pyoSend(b.dataset.id)));
}
function pyoSend(id){
  const P = pyoState(), j = PYOGUK.jobs.find(x=> x.id === id); if (!j || P.sent.some(s=> s.id === id)) return;
  if (P.sent.length >= pyoPicks(P.grade)){ showToast('보낼 수 있는 행렬이 없습니다 — 한 번에 ' + pyoPicks(P.grade) + '곳까지 (돌아오면 다시 보냄)'); return; }
  const job = { id:j.id, title:j.title, route:j.route, at:curScene, loot:pyoLoot(j, pyoGrade()) };
  P.sent.push(job);
  showToast(j.title + ' — 행렬이 길을 떠났습니다 (다음 이야기가 끝나면 돌아옴)');
  renderPyo(); refreshMissionBadges();
}
function openPyo(){ clearNotices(); renderPyo(); document.getElementById('pyo-modal').style.display = 'flex'; }
document.getElementById('hub-pyo').addEventListener('click', openPyo);
document.getElementById('pyo-close').addEventListener('click', ()=>{ document.getElementById('pyo-modal').style.display = 'none'; });

/* ================= 보물상자 (data/items.js 의 TREASURE_BOX) — 배낭에서 열기 → 장신구 · 심법 서책 하나 ================= */
function boxChapter(){ return Math.max(1, chapterNo((SCENES[curScene] || {}).chapter)); }
// 장마다 고르는 값 (배열이면 장 순서대로, 모자라면 마지막 값)
function perChapter(arr, ch){ return Array.isArray(arr) ? arr[Math.min(Math.max(1, ch), arr.length) - 1] : arr; }
// 지금 장에서 나올 수 있는 물건과 무게
function boxLoot(){
  const ch = boxChapter();
  return TREASURE_BOX.loot.map(x=>({ item:x.item, weight: x.w ? perChapter(x.w, ch) : ((x.chapter || 1) <= ch ? (x.weight || 1) : 0) }))
    .filter(x=> ITEM_DB[x.item] && x.weight > 0);
}
function boxStones(){ return TREASURE_BOX.stone ? perChapter(TREASURE_BOX.stone, boxChapter()) : 0; }   // 꼭 함께 나오는 강화석
function boxRoll(){
  const L = boxLoot();
  let r = Math.random() * L.reduce((a,x)=> a + x.weight, 0);
  for (const x of L){ r -= x.weight; if (r <= 0) return x.item; }
  return L[L.length-1].item;
}
let boxKind = 'treasure';                                  // 'treasure' 보물상자 · 'gold' 금전상자
function askOpenBox(kind){
  boxKind = kind || 'treasure';
  const B = boxKind==='gold' ? GOLD_BOX.item : TREASURE_BOX.item, n = PLAYER.inv[B] || 0; if (!n) return;
  askConfirm(B + '를 여시겠습니까?' + (n > 1 ? '\n(남은 상자 ' + n + '개)' : ''), openBox, null, '연다', '그만둔다');
}
// 금전상자에서 나올 수 있는 금 [최소, 최대] — 지금 장에 따라
function goldBoxRange(){ const R = GOLD_BOX.gold, i = Math.max(0, boxChapter() - 1); return R[Math.min(i, R.length - 1)]; }
function openGoldBox(){
  const B = GOLD_BOX.item;
  if (!takeFromBag(B)) return;
  const [lo, hi] = goldBoxRange(), g = Math.round((lo + Math.random() * (hi - lo)) / 10) * 10;
  PLAYER.gold += g; sfx('levelup');
  document.querySelector('#box-modal .bx-title').textContent = B + '를 열었습니다';
  document.getElementById('bx-ic').innerHTML = itemIcon(B);
  document.getElementById('bx-nm').textContent = '금 ' + g.toLocaleString();
  document.getElementById('bx-st').textContent = '보유 금 ' + PLAYER.gold.toLocaleString();
  document.getElementById('bx-ds').textContent = '';
  const more = document.getElementById('bx-more'), left = PLAYER.inv[B] || 0;
  more.style.display = left ? '' : 'none'; more.textContent = '하나 더 열기 (' + left + ')';
  const m = document.getElementById('box-modal'); m.style.display = 'none'; void m.offsetWidth; m.style.display = 'flex';
  bagSel = left ? B : null; bagChanged();
}
// 금전상자 모두 열기 → 합계
function openAllGoldBoxes(){
  const B = GOLD_BOX.item, n = PLAYER.inv[B] || 0; if (!n) return;
  const [lo, hi] = goldBoxRange(); let sum = 0, k = 0;
  for (let i=0;i<n;i++){ if (!takeFromBag(B)) break; k++; sum += Math.round((lo + Math.random() * (hi - lo)) / 10) * 10; }
  PLAYER.gold += sum; sfx('levelup');
  document.querySelector('#box-modal .bx-title').textContent = B + ' ' + k + '개를 열었습니다';
  document.getElementById('bx-ic').innerHTML = itemIcon(B);
  document.getElementById('bx-nm').textContent = '금 ' + sum.toLocaleString();
  document.getElementById('bx-st').textContent = '보유 금 ' + PLAYER.gold.toLocaleString();
  document.getElementById('bx-ds').textContent = '';
  document.getElementById('bx-more').style.display = 'none';
  const m = document.getElementById('box-modal'); m.style.display = 'none'; void m.offsetWidth; m.style.display = 'flex';
  bagSel = null; bagChanged();
}
// 배낭이 바뀜 (상자 열기 등) → 배낭 창 · 상태보기(배낭 탭)를 다시 그림
function bagChanged(){ renderBag(); if (document.getElementById('status-modal').style.display==='flex' && document.getElementById('st-detail').style.display!=='none') refreshStatus(); }
function openBox(){
  if (boxKind==='gold'){ openGoldBox(); return; }
  const B = TREASURE_BOX.item;
  if (!takeFromBag(B)) return;
  document.querySelector('#box-modal .bx-title').textContent = B + '를 열었습니다';
  const got = boxRoll();
  if (!addToBag(got)){ PLAYER.inv[B] = (PLAYER.inv[B] || 0) + 1; showToast('배낭이 가득 찼습니다 — 물건을 정리한 뒤 여세요'); bagChanged(); return; }
  const ns = boxStones(); for (let k=0;k<ns;k++) addToBag('강화석');     // 강화석은 꼭
  const it = ITEM_DB[got] || {};
  document.getElementById('bx-ic').innerHTML = itemIcon(got);
  document.getElementById('bx-nm').textContent = got;
  document.getElementById('bx-st').textContent = (ITEM_TYPE_NAME[it.type] || '') + (it.stat ? ' · ' + statText(it.stat) : '');
  document.getElementById('bx-ds').textContent = (ns ? '＋ 강화석 ' + ns + '개\n' : '') + (it.desc || '');
  const more = document.getElementById('bx-more'), left = PLAYER.inv[B] || 0;
  more.style.display = left ? '' : 'none'; more.textContent = '하나 더 열기 (' + left + ')';
  const m = document.getElementById('box-modal'); m.style.display = 'none'; void m.offsetWidth; m.style.display = 'flex';
  bagSel = left ? B : got; bagChanged();
}
document.getElementById('bx-ok').addEventListener('click', ()=>{ document.getElementById('box-modal').style.display = 'none'; });
document.getElementById('bx-more').addEventListener('click', openBox);

/* ================= 기록 : 인물 · 세력 (data/codex.js) =================
   쪽지는 그 장면이 끝나면 (다음 장면으로 넘어가면) 보임. PLAYER.codex = { seen:{ 'p:hero':본 쪽지 수 }, known:{ … 알린 쪽지 수 } } */
let storyOrderCache = null;
function storyIdx(sc){ if (!storyOrderCache) storyOrderCache = storyOrder(); return storyOrderCache.indexOf(sc); }
function codexPos(){
  let i = storyIdx(curScene);
  if (i < 0){ const nx = SCENES[curScene] && resolveNext(SCENES[curScene].next, true); return nx ? storyIdx(nx) : 0; }   // 갈림길 장면 (순서에 없음) → 다음 장면 바로 앞
  const ended = document.getElementById('story-screen').classList.contains('ended');
  return i + (ended ? 1 : 0);
}
function codexDB(){ return (typeof CODEX !== 'undefined') ? CODEX : { people:[], factions:[] }; }
function codexAll(){ const C = codexDB(); return (C.people||[]).map(e=>({ kind:'p', e })).concat((C.factions||[]).map(e=>({ kind:'f', e }))); }
function codexKey(kind, e){ return kind+':'+e.id; }
function codexNotes(e){ const p = codexPos(); return (e.notes||[]).filter(n=>{ const i = storyIdx(n.from); return i >= 0 && i < p; }); }
function codexName(e, notes){ let nm = e.name; (notes || codexNotes(e)).forEach(n=>{ if (n.name) nm = n.name; }); return codexText(nm); }
// {name} + 조사 : {name}이/가 · 을/를 · 은/는 · 과/와 를 주인공 이름에 맞게
function codexText(t){
  const P = { '이':['이','가'], '가':['이','가'], '을':['을','를'], '를':['을','를'], '은':['은','는'], '는':['은','는'], '과':['과','와'], '와':['과','와'] };
  return String(t||'').replace(/\{([^{}|]+)\|([^{}|]+)\}/g, (m, a, b)=> heroSex()==='f' ? b : a)                  // {소협|소저} → 남 : 소협 · 여 : 소저
    .replace(/\{name\}이라/g, ()=> HERO.name + josa(HERO.name, '이라', '라'))                                   // '{name}이라 합니다' → 하나라 · 리온이라
    .replace(/\{name\}(이|가|을|를|은|는|과|와)(?=[\s.,!?·]|$)/g, (m, j)=> HERO.name + josa(HERO.name, P[j][0], P[j][1])).split('{name}').join(HERO.name);
}
function codexState(){ PLAYER.codex = PLAYER.codex || { seen:{}, known:{} }; PLAYER.codex.seen = PLAYER.codex.seen || {}; PLAYER.codex.known = PLAYER.codex.known || {}; return PLAYER.codex; }
function codexNewCount(){ const S = codexState(); return codexAll().filter(({kind,e})=> codexNotes(e).length > (S.seen[codexKey(kind,e)]||0)).length; }
// 새로 보이게 된 쪽지 알림 (거점이 열린 뒤에만). silent = 불러오기 등 → 알리지 않고 맞추기만
function codexCheck(silent){
  if (window.__codexSilent){ silent = true; window.__codexSilent = false; }
  const S = codexState(), fresh = [];
  codexAll().forEach(({kind,e})=>{
    const k = codexKey(kind,e), n = codexNotes(e).length;
    if (n > (S.known[k]||0)){ fresh.push((kind==='p' ? '인물 · ' : '세력 · ') + codexName(e)); S.known[k] = n; }
  });
  if (fresh.length && !silent && hubOpen()) notify('기록이 갱신되었습니다', fresh.slice(0,4).join(', ') + (fresh.length>4 ? ' 외 '+(fresh.length-4)+'건' : '') + '\n거점 → 집무실 → 기록', 'codex');
  refreshMissionBadges();
}
let ofTab = 'mission', cxSel = null;
function renderCodex(kind){
  const S = codexState();
  const list = codexAll().filter(x=>x.kind===kind && codexNotes(x.e).length);
  if (!list.length) return '<div class="of-empty">아직 기록된 '+(kind==='p' ? '인물' : '세력')+'이 없습니다. 이야기를 진행하면 채워집니다.</div>';
  if (!cxSel || !list.some(x=>codexKey(x.kind,x.e)===cxSel)) cxSel = codexKey(list[0].kind, list[0].e);
  const seenN = S.seen[cxSel]||0;
  { const c0 = list.find(x=>codexKey(x.kind,x.e)===cxSel); S.seen[cxSel] = codexNotes(c0.e).length; }   // 고른 항목은 본 것으로 (NEW 표시는 목록에서 바로 사라짐)
  const icon = (x)=> x.kind==='p' ? '<img class="cx-face" src="'+(x.e.face==='hero' ? faceOf('hero') : faceOf(x.e.face))+'" alt="">' : '<span class="cx-icon">'+(x.e.icon||'?')+'</span>';
  let h = '<div class="cx-wrap"><div class="cx-list">';
  list.forEach(x=>{ const k = codexKey(x.kind,x.e), nn = codexNotes(x.e), isNew = nn.length > (S.seen[k]||0);
    h += '<div class="cx-row'+(k===cxSel ? ' sel' : '')+'" data-k="'+k+'">'+icon(x)+'<span class="cx-nm">'+codexName(x.e, nn)+'</span>'+(isNew ? '<span class="cx-new">NEW</span>' : '')+'</div>'; });
  const cur = list.find(x=>codexKey(x.kind,x.e)===cxSel), notes = codexNotes(cur.e);
  h += '</div><div class="cx-detail"><div class="cx-top">'+icon(cur)+'<div><b>'+codexName(cur.e, notes)+'</b>'+(cur.e.tag ? '<small>'+cur.e.tag+'</small>' : '')+'</div></div>';
  const bio = bioOf(cur.e.id);                                   // 열전 (정체가 드러난 뒤에만 — from)
  if (bio) h += '<div class="cx-bio">'+(bio.alias ? '<b>'+bio.alias+'</b> · ' : '')+codexText(sexText(bio))+'</div>';
  notes.forEach((n,i)=>{ h += '<div class="cx-note'+(i>=seenN ? ' new' : '')+'">'+codexText(sexText(n))+'</div>'; });
  h += '</div></div>';
  return h;
}

/* ================= 집무실 임무 (data/missions.js) ================= */
function missionDB(){ return (typeof MISSIONS !== 'undefined') ? MISSIONS : {}; }
function missionState(id){ return (PLAYER.missions || {})[id] || null; }        // null · 'taken'(수락) · 'done'(완료) · 'failed'(실패)
function missionsFor(battleId){ const M = missionDB(); return Object.keys(M).filter(id=>M[id].battle===battleId); }
function upcomingBattle(){ const sc = SCENES[curScene]; return (sc && sc.sortie && BATTLES[sc.sortie]) ? sc.sortie : null; }
// 지금 집무실에 뜨는 임무 = 다음 출정 전투의 임무 중 아직 끝나지 않은 것
function offerMissions(){ const b = upcomingBattle(); return b ? missionsFor(b).filter(id=>{ const st = missionState(id); return !st || st==='taken'; }) : []; }
function refreshMissionBadges(){
  const n = offerMissions().filter(id=>!missionState(id)).length;
  const p = hubOpen() ? pyoIdle() : 0;                 // 표국 : 아직 보내지 않은 의뢰
  const set = (id, on)=>{ const el = document.getElementById(id); if (el) el.classList.toggle('badge', on); };
  const cx = hubOpen() ? codexNewCount() : 0;           // 기록 : 아직 안 본 쪽지가 있는 인물 · 세력
  set('hub-office', n>0 || cx>0); set('hub-pyo', p>0); set('btn-hub', n>0 || p>0 || cx>0);
}
function battleShortName(id){ const n = (BATTLES[id] || {}).name || '', i = n.indexOf(' · '); return i>=0 ? n.slice(i+3) : n; }
function condText(c){
  if (c.type==='talk'){
    const by = (c.by || ['hero']).map(nameOf).join(' · '), t = (UNITS[c.target] || {}).name || c.target;
    return '전투 중 '+by+josa(by,'이','가')+' '+t+' 바로 옆에서 \'대화\' 명령 ('+t+josa(t,'이','가')+' 쓰러지기 전에) · 그리고 승리';
  }
  if (c.type==='kill'){
    const by = (c.by || ['hero']).map(nameOf).join(' · '), t = (UNITS[c.target] || {}).name || c.target;
    return '전투 중 '+by+josa(by,'이','가')+' 직접 '+t+josa(t,'을','를')+' 쓰러뜨리기 (마지막 일격) · 그리고 승리';
  }
  if (c.type==='turns')  return c.n+'턴 안에 승리';
  if (c.type==='noDown') return '아군이 아무도 쓰러지지 않고 승리';
  if (c.type==='keep'){ const t = [].concat(c.target).map(nameOf).join(' · '); return t+josa(t,'이','가')+' 쓰러지지 않고 승리'; }
  if (c.type==='few')    return '고정 인물을 포함해 '+c.n+'명 이하로 출전해서 승리 (출전 편성에서 인원 줄이기)';
  return '';
}
function rewardText(r){
  r = r || {}; const out = [];
  if (r.gold) out.push('금 '+r.gold.toLocaleString());
  if (r.suryeon) out.push('수련치 '+r.suryeon.toLocaleString());
  if (r.item) out.push(r.item+' '+(r.n||1)+'개');
  if (r.exp)  out.push('경험치 +'+r.exp);
  return out.join(' · ') || '없음';
}
function renderOffice(){
  const M = missionDB(), b = upcomingBattle(), offer = offerMissions();
  document.getElementById('of-gold').textContent = '보유 금 '+PLAYER.gold.toLocaleString();
  document.querySelectorAll('.of-tab').forEach(t=>{ t.classList.toggle('on', t.dataset.t===ofTab);
    const k = t.dataset.t==='people' ? 'p' : t.dataset.t==='faction' ? 'f' : null;
    t.classList.toggle('badge', !!k && codexAll().some(x=>x.kind===k && codexNotes(x.e).length > (codexState().seen[codexKey(x.kind,x.e)]||0)));
    if (t.dataset.t==='mission') t.classList.toggle('badge', offer.some(id=>!missionState(id))); });
  if (ofTab!=='mission'){
    const body = document.getElementById('of-body'); body.innerHTML = renderCodex(ofTab==='people' ? 'p' : 'f');
    body.querySelectorAll('.cx-row').forEach(r=> r.addEventListener('click', ()=>{ cxSel = r.dataset.k; renderOffice(); }));
    document.querySelectorAll('.of-tab').forEach(t=>{ if (t.dataset.t===ofTab) t.classList.remove('badge'); });
    refreshMissionBadges();
    return;
  }
  let h = b ? '<div class="of-sec">다음 전투 · '+battleShortName(b)+'</div>' : '';
  if (offer.length) offer.forEach(id=>{
    const m = M[id], taken = missionState(id)==='taken';
    h += '<div class="of-card'+(taken?' taken':'')+'"><div class="of-top"><span class="of-kind">'+(m.kind||'임무')+'</span><b>'+m.title+'</b><span class="of-rw">보상 · '+rewardText(m.reward)+'</span></div>'+
         '<div class="of-desc">'+m.desc+'</div><div class="of-cond">조건 · '+condText(m.cond)+'</div>'+
         '<div class="of-act">'+(taken ? '<span class="of-taken">수락함 ✓ — 전투에서 조건을 채우세요</span>' : '<div class="top-btn of-take" data-id="'+id+'">수락</div>')+'</div></div>';
  });
  else h += '<div class="of-empty">'+(b ? '이번 전투에 걸린 임무가 없습니다.' : '지금 받을 수 있는 임무가 없습니다. 이야기를 진행하면 새 임무가 들어옵니다.')+'</div>';
  const past = Object.keys(PLAYER.missions || {}).filter(id=>M[id] && (PLAYER.missions[id]==='done' || PLAYER.missions[id]==='failed'));
  if (past.length){
    h += '<div class="of-sec">지난 임무</div>';
    past.forEach(id=>{ const ok = PLAYER.missions[id]==='done';
      h += '<div class="of-past"><span>'+M[id].title+'</span>'+(ok ? '<span class="ok">완료 · '+rewardText(M[id].reward)+'</span>' : '<span class="fail">실패</span>')+'</div>'; });
  }
  const body = document.getElementById('of-body'); body.innerHTML = h;
  body.querySelectorAll('.of-take').forEach(btn=> btn.addEventListener('click', ()=>{
    const id = btn.dataset.id; PLAYER.missions = PLAYER.missions || {}; PLAYER.missions[id] = 'taken';
    showToast('임무를 받았습니다 — '+M[id].title); renderOffice(); refreshMissionBadges();
  }));
}
function openOffice(){ clearNotices(); renderOffice(); document.getElementById('office-modal').style.display = 'flex'; }
document.getElementById('hub-office').addEventListener('click', openOffice);
document.querySelectorAll('.of-tab').forEach(t=> t.addEventListener('click', ()=>{ ofTab = t.dataset.t; renderOffice(); }));
document.getElementById('of-close').addEventListener('click', ()=>{ document.getElementById('office-modal').style.display = 'none'; });
document.getElementById('hub-back').addEventListener('click', ()=>{
  document.getElementById('hub-screen').style.display = 'none';
  document.getElementById('story-screen').style.display = '';
});

document.getElementById('btn-go-battle').addEventListener('click', ()=>{
  clearNotices();
  const sc = SCENES[curScene], id = sc.sortie;
  if (!id || !BATTLES[id]){ showToast('다음 전투는 준비 중입니다'); return; }
  if (sc.sortieScene && SCENES[sc.sortieScene]){ document.getElementById('snpc-box').style.display = 'none'; chainScene(sc.sortieScene); return; }   // 출정 → 전투 전 장면 (대화 뒤 바로 전투)
  goBattle(id);
});
/* ================= 출전 편성 (data/units.js 의 SORTIE · 전투의 picks) =================
   전투에 picks 가 있으면 출발 전에 편성 창 : 고정 인물(allies) + 아군 중에서 pick 명 — 고른 인물은 picks 자리에 순서대로
   고를 사람이 pick 명 이하면 창 없이 모두 출전. 마지막에 고른 인원을 기억 (PLAYER.lastPicks) */
let curPicks = null, spBattle = null, spDone = null, spSel = [];
// 고를 수 있는 최대 인원 = 전투의 picks 자리 수 (pick 으로 줄일 수 있음, pick:'all' = 자리 수만큼 — 최종장 전원 출전)
function sortiePick(b){ const pos = (b.picks || []).length; return b.pick != null && b.pick !== 'all' ? Math.min(b.pick, pos) : pos; }
function sortieAll(b){ return !!b && b.pick === 'all'; }
// 인원 보정 : 기준(SORTIE.base, 전투마다 base)보다 많이 데려가면 적 체력이 오름 (SORTIE.crowd)
function sortieBase(b){ const S = typeof SORTIE !== 'undefined' ? SORTIE : {}; return (b && b.base != null) ? b.base : (S.base || 5); }
function crowdExtra(b, n){ const C = (typeof SORTIE !== 'undefined' && SORTIE.crowd) || {}; const mx = (b && b.crowdMax != null) ? b.crowdMax : (C.max != null ? C.max : 99); return b && b.picks ? Math.min(mx, Math.max(0, n - sortieBase(b))) : 0; }
function crowdMult(extra, rank){ const C = (typeof SORTIE !== 'undefined' && SORTIE.crowd) || {}; return 1 + extra * ((isBossRank(rank) ? C.boss : C.hp) || 0); }
// 수락한 임무 중 '몇 명 이하로 출전' (few) 이 있으면 그 수
function sortieFewLimit(id){ let n = null; missionsFor(id).filter(m=> missionState(m)==='taken').forEach(m=>{ const c = missionDB()[m].cond; if (c.type==='few') n = n==null ? c.n : Math.min(n, c.n); }); return n; }
function sortieFixed(b){ return (b.allies || []).map(a=> a.id).filter(id=> id==='hero' || isParty(id)); }
function sortieCands(b){ const used = new Set((b.allies || []).map(a=> a.id)); return PARTY.filter(id=> !used.has(id)); }
function openSortie(id, done, canCancel){
  const b = BATTLES[id], n = sortiePick(b), cands = sortieCands(b);
  if (!cands.length || !n){ done([]); return; }
  spBattle = id; spDone = done;
  // 처음 : 레벨 높은 순으로 채움 / 최종장(전원) : 모두 / 그 뒤 : 지난번 고른 인원 그대로 (적게 데려간 것도 기억)
  const byLv = cands.slice().sort((a,c)=> ((memberState(c)||{}).level||1) - ((memberState(a)||{}).level||1));
  if (sortieAll(b)) spSel = Array.isArray(PLAYER.lastAll) ? PLAYER.lastAll.filter(x=> cands.includes(x)).concat(cands.filter(x=> !(PLAYER.lastAllSeen||[]).includes(x))) : cands.slice();
  else spSel = Array.isArray(PLAYER.lastPicks) ? PLAYER.lastPicks.filter(x=> cands.includes(x)) : byLv;
  spSel = Array.from(new Set(spSel)).slice(0, n);
  document.getElementById('sp-cancel').style.display = canCancel ? '' : 'none';
  renderSortie(); document.getElementById('sortie-modal').style.display = 'flex';
}
function renderSortie(){
  const b = BATTLES[spBattle], n = sortiePick(b), cands = sortieCands(b), fixed = sortieFixed(b);
  const card = (id, cls, tag)=>{ const st = memberState(id) || {};
    return '<div class="sp-card '+cls+'" data-id="'+id+'">'+(tag ? '<span class="tag">'+tag+'</span>' : '')+'<img src="'+faceOf(id)+'" alt="">'+
           '<span class="nm">'+nameOf(id)+'</span><span class="lv">Lv '+(st.level||1)+' · '+memberRealm(id)+'</span></div>'; };
  document.getElementById('sp-sub').textContent = (b.name || '') + ' · 고정 ' + fixed.length + '명 + ' + (sortieAll(b) ? '모두 함께 (빼고 싶은 인물만 빼기)' : '최대 ' + n + '명');
  document.getElementById('sp-team-label').textContent = '출전 ' + (fixed.length + spSel.length) + ' / ' + (fixed.length + n) + ' — 다 채우지 않아도 출전할 수 있음';
  document.getElementById('sp-box').classList.toggle('many', fixed.length + n > 9);
  document.querySelector('#sp-box .sp-label + #sp-team + .sp-label').textContent = fixed.length + n > 9 ? '함께 갈 인물 — 눌러서 빼기 · 다시 누르면 넣기' : '대기 — 눌러서 출전 · 다시 누르면 빼기';
  const tot = fixed.length + spSel.length, ex = crowdExtra(b, tot), few = sortieFewLimit(spBattle);
  const C = (typeof SORTIE !== 'undefined' && SORTIE.crowd) || {};
  const exRaw = Math.max(0, tot - sortieBase(b));
  let note = ex > 0 ? '기준 ' + sortieBase(b) + '명보다 ' + exRaw + '명 많음 → 적 체력 +' + Math.round(ex*(C.hp||0)*100) + '% · 대장 +' + Math.round(ex*(C.boss||0)*100) + '%' + (exRaw > ex ? ' (+' + ex + '명까지만 셈)' : '') : '기준 ' + sortieBase(b) + '명 — 더 데려가면 적이 조금씩 단단해짐';
  if (few != null) note += ' · 임무 : ' + few + '명 이하 출전' + (tot > few ? ' (지금 ' + tot + '명 — 실패)' : ' ✓');
  const team0 = fixed.concat(spSel), need = [];
  missionsFor(spBattle).filter(m=> missionState(m)==='taken').forEach(m=>{ const c = missionDB()[m].cond;
    if ((c.type==='kill' || c.type==='talk') && !(c.by || ['hero']).some(x=> team0.includes(x))) (c.by || ['hero']).forEach(x=>{ if (!need.includes(x)) need.push(x); }); });
  if (need.length) note += ' · 임무에 필요한 인물 : ' + need.map(nameOf).join(' · ') + ' (출전시키기)';
  const fewBad = few != null && tot > few;
  const cr = document.getElementById('sp-crowd'); if (cr){ cr.textContent = note; cr.classList.toggle('warn', fewBad || need.length > 0); }
  const many = fixed.length + n > 9;               // 자리가 많으면 (최종장) 위 줄은 고정 인물 + 인원 수만 — 고르기는 아래 대기 줄에서
  let h = fixed.map(id=> card(id, 'fixed', '고정')).join('');
  if (many) h += '<div class="sp-card sum"><span class="g">'+spSel.length+'</span><span class="nm">명 함께</span><span class="lv">아래에서 빼기</span></div>';
  else {
    h += spSel.map(id=> card(id, 'pick on', '출전')).join('');
    for (let i = spSel.length; i < n; i++) h += '<div class="sp-card empty"><span class="g">+</span><span class="nm">빈 자리</span></div>';
  }
  document.getElementById('sp-team').innerHTML = h;
  document.getElementById('sp-bench').innerHTML = cands.map(id=> card(id, 'cand' + (spSel.includes(id) ? ' on' : ''), spSel.includes(id) ? '출전' : '')).join('');
  if (typeof artsSortieDecor==='function') artsSortieDecor();                 // 적의 무기 · 주인공 무공 칸 (js/arts.js)
  const team = fixed.concat(spSel);                                  // 이 편성으로 맺어지는 인연
  const bs = bondList().filter(x=> bondOpen(x) && x.members.every(m=> team.includes(m))).map(x=> x.name + (x.when==='adj' ? ' (이웃하면)' : ''));
  document.getElementById('sp-bond').textContent = bs.length ? '인연 — ' + bs.join(' · ') : '';
  document.getElementById('sp-go').classList.remove('off');
  document.querySelectorAll('#sp-bench .sp-card, #sp-team .sp-card.pick').forEach(c=> c.onclick = ()=> spToggle(c.dataset.id));
}
// 모두 넣기 (레벨 높은 순으로 빈 자리까지) · 비우기
function spFill(){ const b = BATTLES[spBattle], n = sortiePick(b), cands = sortieCands(b).filter(x=> !spSel.includes(x)).sort((a,c)=> ((memberState(c)||{}).level||1) - ((memberState(a)||{}).level||1));
  spSel = spSel.concat(cands).slice(0, n); sfx('click'); renderSortie(); }
function spClear(){ spSel = []; sfx('click'); renderSortie(); }
document.getElementById('sp-fill').addEventListener('click', spFill);
document.getElementById('sp-clear').addEventListener('click', spClear);
function spToggle(id){
  const n = sortiePick(BATTLES[spBattle]), i = spSel.indexOf(id);
  if (i >= 0) spSel.splice(i, 1); else { if (spSel.length >= n) spSel.shift(); spSel.push(id); }
  sfx('click'); renderSortie();
}
document.getElementById('sp-go').addEventListener('click', ()=>{
  document.getElementById('sortie-modal').style.display = 'none';
  const b = BATTLES[spBattle];
  if (sortieAll(b)){ PLAYER.lastAll = spSel.slice(); PLAYER.lastAllSeen = sortieCands(b); } else PLAYER.lastPicks = spSel.slice();
  const d = spDone; spDone = null; if (d) d(spSel.slice());
});
document.getElementById('sp-cancel').addEventListener('click', ()=>{ document.getElementById('sortie-modal').style.display = 'none'; spDone = null; });
function goBattle(id, picked){
  const b = BATTLES[id];
  if (b && b.picks && !picked){                                      // 출전 편성 먼저
    const ss = document.getElementById('story-screen');
    openSortie(id, ids=>{ curPicks = ids; goBattle(id, true); }, ss.style.display !== 'none' && ss.classList.contains('ended'));
    return;
  }
  if (!(b && b.picks)) curPicks = null;
  document.getElementById('story-screen').style.display = 'none';
  document.getElementById('battle-screen').style.display = 'block';
  startBattle(id);
}




/* ================= 화면 크기 / 가로 고정 ================= */
function setViewportVars(){
  const r = document.documentElement.style;
  r.setProperty('--vw', (window.innerWidth/100) + 'px');
  r.setProperty('--vh', (window.innerHeight/100) + 'px');
}
setViewportVars();
window.addEventListener('resize', setViewportVars);
window.addEventListener('orientationchange', ()=> setTimeout(setViewportVars, 200));

// 터치 기기에서는 첫 터치 때 전체화면 + 가로 고정 시도 (지원하지 않는 브라우저에서는 조용히 무시)
let landscapeTried = false;
function lockLandscape(){
  if (landscapeTried) return; landscapeTried = true;
  if (!window.matchMedia || !matchMedia('(pointer: coarse)').matches) return;
  const el = document.documentElement;
  const rf = el.requestFullscreen || el.webkitRequestFullscreen;
  const lock = ()=>{ try{ if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(()=>{}); }catch(e){} };
  try{
    const p = rf ? rf.call(el) : null;
    if (p && p.then) p.then(lock).catch(lock); else lock();
  }catch(e){ lock(); }
}
document.addEventListener('pointerdown', lockLandscape, { once:true });


/* ================= 대화 후 객잔 앞 인물 ================= */
let snpcTimer = null;
/* ---------- 끝 화면 : 다른 곳 들르기 (장면의 go · places) ----------
   sc.go = ['lord']  — 끝 화면 처음 자리에 보일 이동 버튼 (places 의 이름)
   sc.places = { lord:{ name:'양양성 성주실', btn:'양양성으로', bg:'yangyang_lord_hall', npcs:[…], go:['cheolgeom'] }, … }
   go 의 'home' = 처음 자리로 (버튼 글 = sc.homeBtn, 없으면 '돌아가기'). 출정 · 거점은 어디서든 누를 수 있음. 불러오면 처음 자리 */
let curPlace = null;
function placeOf(sc){ return sc && curPlace && sc.places && sc.places[curPlace] ? sc.places[curPlace] : null; }
function curNpcs(){ const sc = SCENES[curScene], p = placeOf(sc); return ((p ? p.npcs : sc.npcs) || []).filter(n=> !n.cond || (typeof metaCond==='function' && metaCond(n.cond))); }   // cond : 조건이 맞을 때만 (기연 · data/meta.js)
function buildPlaceButtons(){
  const sc = SCENES[curScene], p = placeOf(sc), wrap = document.getElementById('place-wrap'), nm = document.getElementById('place-name');
  const go = ((p ? p.go : sc && sc.go) || []).filter(k=> k==='home' || (sc.places && sc.places[k]));
  wrap.innerHTML = '';
  go.forEach(k=>{
    const t = k==='home' ? null : sc.places[k];
    const b = document.createElement('div'); b.className = 'top-btn place-btn'; b.dataset.place = k;
    b.textContent = (t ? (t.btn || t.name) : (sc.homeBtn || '돌아가기')) + ' ▶';
    b.addEventListener('click', e=>{ e.stopPropagation(); goPlace(t ? k : null); });
    wrap.appendChild(b);
  });
  wrap.classList.toggle('hidden', !go.length);
  nm.textContent = p ? p.name : ''; nm.classList.toggle('hidden', !p);
}
function goPlace(k){
  const sc = SCENES[curScene];
  document.getElementById('snpc-box').style.display = 'none';
  clearInterval(snpcTimer);
  fadeSwap(()=>{
    curPlace = k;
    const p = placeOf(sc), end = sc.end || { bg:sc.bg };
    setStoryBg(p ? p.bg : end.bg);
    buildStoryNpcs();
  });
}
function npcKey(n){ return curScene+':'+(curPlace ? curPlace+'/' : '')+n.id; }      // 받기 · 말 건 표시 (처음 자리는 예전 저장과 같은 이름)
function buildStoryNpcs(){
  const wrap = document.getElementById('story-npcs'); wrap.innerHTML = '';
  curNpcs().forEach(n=>{
    const d = document.createElement('div'); d.className = 'snpc' + (isParty(n.id) ? ' ally' : '');
    d.style.left = n.x+'%'; d.style.top = n.y+'%';
    const k = npcKey(n), gift = n.give && !PLAYER.flags['give:'+k], fresh = !PLAYER.flags['talk:'+k];   // 받을 것이 있으면 선물 표시 · 아직 말을 안 걸었으면 !
    const ky = n.kiyeon && typeof metaKiyeonMet==='function' && !metaKiyeonMet(n.kiyeon);              // 기연 : 緣
    if (n.kiyeon) d.classList.add('kiyeon');
    d.innerHTML = '<img src="'+faceOf(n.id)+'"><span>'+nameOf(n.id)+'</span>'+(ky ? '<div class="mark ky">緣</div>' : (gift || fresh ? '<div class="mark'+(gift ? ' gift' : '')+'">'+(gift ? '贈' : '!')+'</div>' : ''));
    d.addEventListener('click', e=>{ e.stopPropagation(); talkStoryNpc(n, d); });
    wrap.appendChild(d);
  });
  buildPlaceButtons();
}
/* 말 걸기
   - line (+ give · after) : 한 마디. give 는 처음 말을 걸 때 한 번, 받은 뒤에는 after
   - talk:[{ who:'hero' | 인물 id, text, textM/textF, only, give:true }, …] : 처음 말을 걸 때 주고받는 대화 (주인공 대사도 섞임)
       give:true 를 적은 줄에서 n.give 를 받음 (적은 줄이 없으면 대화를 시작할 때). 다시 말을 걸면 after (없으면 line) */
function talkStoryNpc(n, el){
  const box = document.getElementById('snpc-box'), t = document.getElementById('snpc-text'), close = document.getElementById('snpc-close');
  if (el){ const m = el.querySelector('.mark'); if (m) m.remove(); }
  clearInterval(snpcTimer);
  const k = npcKey(n), gk = 'give:'+k, tk = 'talk:'+k, first = !PLAYER.flags[tk];
  PLAYER.flags[tk] = true;
  if (n.kiyeon && typeof metaKiyeonFound==='function') metaKiyeonFound(n);   // 기연 도감 (js/meta.js)
  const giveNow = ()=>{
    if (!n.give || PLAYER.flags[gk]) return;
    PLAYER.flags[gk] = true;
    const got = applyGive(n.give);
    if (got.length) setTimeout(()=>showToast('받았습니다 — '+got.join(' · ')), 400);
    setTimeout(()=>autoSave('end'), 900);            // 받은 것까지 저장
  };
  let lines;
  if (n.talk && first) lines = n.talk.filter(sexOk);
  else lines = [{ who:n.id, text: (n.talk || (n.give && PLAYER.flags[gk])) && n.after ? n.after : n.line }];
  if (!lines.some(L=>L.give)) giveNow();             // 받는 줄을 따로 적지 않았으면 처음 말을 걸 때
  box.style.display = 'flex';
  let li = -1, pages = [], pg = 0, busy = false;
  const nextLine = ()=>{
    li++; if (li >= lines.length){ box.style.display = 'none'; return; }
    const L = lines[li], who = L.who || n.id;
    document.getElementById('snpc-face').src = faceOf(who);
    document.getElementById('snpc-name').textContent = L.name || nameOf(who);
    box.classList.toggle('hero', who==='hero');
    if (L.give) giveNow();
    t.textContent = '';
    pages = dlgPages(lineText(L), t, dlgWidth(t), dlgRows('npc')); pg = 0; show();
  };
  const show = ()=>{ busy = true; clearInterval(snpcTimer);
                     close.textContent = (pg < pages.length - 1 || li < lines.length - 1) ? '▶ 눌러서 계속' : '눌러서 닫기';
                     snpcTimer = typeText(t, pages[pg], 35, ()=>{ busy = false; }); };
  nextLine();
  box.onclick = ()=>{
    if (busy){ clearInterval(snpcTimer); t.textContent = pages[pg]; busy = false; return; }
    if (pg < pages.length - 1){ pg++; show(); return; }                 // 긴 말 : 다음 창
    nextLine();                                                         // 대화 : 다음 줄 (끝이면 닫힘)
  };
}

/* ================= 시작 화면 ================= */
function startStory(){
  curScene = FIRST_SCENE;
  resetStoryScreen(SCENES[curScene]);
  scriptIdx = 0; advanceTo(0);
  const is = document.getElementById('intro-screen');
  is.classList.add('leaving');
  setTimeout(()=>{ is.style.display = 'none'; }, 750);
}
function showTitle(){
  refreshContinue();
  const ts = document.getElementById('title-screen');
  ts.style.display = 'block'; playBgm('title');
  requestAnimationFrame(()=>ts.classList.remove('leaving'));
}
document.getElementById('t-start').addEventListener('click', startIntro);
document.getElementById('t-load').addEventListener('click', ()=> openSaveModal('load'));
document.getElementById('t-continue').addEventListener('click', ()=>{ const a = readAuto(); if (a) applySnapshot(a); else refreshContinue(); });
document.getElementById('t-settings').addEventListener('click', ()=> openSettings('title'));
document.getElementById('t-achv').addEventListener('click', ()=> showToast('업적은 준비 중입니다'));
document.getElementById('t-exit').addEventListener('click', ()=>{ document.getElementById('exit-confirm').style.display='flex'; });
document.getElementById('exit-no').addEventListener('click', ()=>{ document.getElementById('exit-confirm').style.display='none'; });
document.getElementById('exit-yes').addEventListener('click', ()=>{
  document.getElementById('exit-confirm').style.display = 'none';
  try { window.close(); } catch(e) {}
  document.getElementById('exit-screen').style.display = 'flex';   // 창이 안 닫히는 경우 대비
});
document.getElementById('exit-back').addEventListener('click', ()=>{ document.getElementById('exit-screen').style.display='none'; });

/* ================= 설정 : 소리 · 불러오기 · 로비로 돌아가기 ================= */
// mode : 'title' = 소리만 / 'story' = 소리 · 불러오기 · 로비 / 'battle' = 소리 · 저장 · 불러오기 · 로비
let setMode = 'story', setTimer = null;
function openSettings(mode){
  setMode = mode || 'story';
  document.getElementById('set-game').style.display = setMode==='title' ? 'none' : 'flex';
  document.getElementById('set-save').style.display = setMode==='battle' ? '' : 'none';
  ['set-meta-row','set-meta-sec'].forEach(i=>{ const e = document.getElementById(i); if (e) e.style.display = setMode==='title' ? 'none' : ''; });   // 기록 : 업적 · 도감 (게임 중에만)
  syncSettingsUI(); refreshSetButtons();
  if (typeof cloudUI === 'function') cloudUI();      // 계정 · 서버 저장 줄 (js/cloud.js)
  clearInterval(setTimer); if (setMode==='battle') setTimer = setInterval(refreshSetButtons, 300);   // 턴이 바뀌면 버튼 상태도 바뀜
  document.getElementById('settings-modal').style.display = 'flex';
}
function closeSettings(){ document.getElementById('settings-modal').style.display = 'none'; clearInterval(setTimer); }
// 전투 중 불러오기 · 로비로 돌아가기를 막는 이유 (적 턴 · 대화 · 공격 연출 중에는 막음)
function battleLeaveBlock(){
  if (bState.over) return bState.intro ? '전투가 끝나는 중에는 저장 · 불러오기를 할 수 없습니다' : '';
  if (bState.intro) return '대화 중에는 저장 · 불러오기를 할 수 없습니다';
  if (bState.turn!=='ally') return '적 턴에는 저장 · 불러오기 · 로비로 돌아가기를 할 수 없습니다';
  if (bState.busy || bState.moving) return '행동이 끝난 뒤에 할 수 있습니다';
  return '';
}
function refreshSetButtons(){
  const note = document.getElementById('set-note');
  const sv = setMode==='battle' ? battleSaveBlock() : '', lv = setMode==='battle' ? battleLeaveBlock() : '';
  document.getElementById('set-save').classList.toggle('off', !!sv);
  document.getElementById('set-load').classList.toggle('off', !!lv);
  document.getElementById('set-lobby').classList.toggle('off', !!lv);
  note.textContent = lv || sv || '';
}
// 전투에서 나갈 때 (불러오기 · 로비) 남아 있는 전투 예약을 모두 무효로
function stopBattle(){
  if (!bState) return;
  bState.phase = (bState.phase||0) + 1; clearTimeout(bState.endTimer);
  bState.over = true; bState.busy = false; clearInterval(bdTimer);
}
function syncSettingsUI(){
  const b = Math.round(SOUND.bgm*100), s = Math.round(SOUND.sfx*100);
  document.getElementById('set-bgm').value = b; document.getElementById('set-bgm-v').textContent = b;
  document.getElementById('set-sfx').value = s; document.getElementById('set-sfx-v').textContent = s;
  document.getElementById('set-mute').classList.toggle('on', !!SOUND.mute);
  document.getElementById('set-mute-v').textContent = SOUND.mute ? '켜짐' : '꺼짐';
  document.getElementById('set-cutin').classList.toggle('on', SOUND.cutin!==false);
  document.getElementById('set-cutin-v').textContent = SOUND.cutin!==false ? '켜짐' : '꺼짐';
}
document.getElementById('set-bgm').addEventListener('input', e=>{ SOUND.bgm = e.target.value/100; applyBgmVolume(); syncSettingsUI(); saveSoundSettings(); });
document.getElementById('set-sfx').addEventListener('input', e=>{ SOUND.sfx = e.target.value/100; syncSettingsUI(); saveSoundSettings(); });
document.getElementById('set-sfx').addEventListener('change', ()=> sfx('hit'));          // 손을 떼면 크기 들어 보기
document.getElementById('set-mute').addEventListener('click', ()=>{ SOUND.mute = !SOUND.mute; applyBgmVolume(); syncSettingsUI(); saveSoundSettings(); });
document.getElementById('set-tips').addEventListener('click', ()=>{
  resetTips();
  if (setMode==='battle' && bState && !bState.over){ closeSettings(); showTips('battle'); }
  else showToast('다음 전투 · 거점에 들어갈 때 조작 안내가 다시 나옵니다');
});
document.getElementById('set-cutin').addEventListener('click', ()=>{ SOUND.cutin = SOUND.cutin===false; syncSettingsUI(); saveSoundSettings(); });

/* ================= 홈 화면 설치 (앱처럼 주소창 없이 실행) =================
   - manifest.webmanifest · sw.js · icon-*.png 가 index.html 과 같은 폴더(깃허브 페이지)에 있어야 설치됨
   - 크롬 · 삼성 인터넷 : 브라우저가 설치를 허락하면(beforeinstallprompt) '지금 설치하기' 로 바로 설치
   - 그 밖(아이폰 사파리 등) · 아직 허락 전 : 브라우저별 설치 방법 안내
   - 이미 설치한 앱으로 실행 중이면 시작 화면의 설치 버튼을 숨김 */
const GAME_URL = 'https://hosia37.github.io/ganghorok/';
let installEvt = null;
function isInstalledApp(){
  try{ return ['standalone','fullscreen','minimal-ui'].some(m=> matchMedia('(display-mode: '+m+')').matches) || navigator.standalone === true; }catch(e){ return false; }
}
function refreshInstallUI(){
  const inst = isInstalledApp();
  const t = document.getElementById('t-install'); if (t) t.style.display = inst ? 'none' : '';
  const v = document.getElementById('set-install-v'); if (v) v.textContent = inst ? '설치됨' : '';
  const b = document.getElementById('set-install'); if (b) b.classList.toggle('off', inst);
}
function installSteps(){
  const ua = navigator.userAgent || '';
  if (location.protocol === 'file:')
    return '지금은 <b>파일</b>로 열려 있어 설치할 수 없어요.<br>인터넷 주소 <span class="k">'+GAME_URL.replace('https://','')+'</span> 로 접속한 뒤 설치해 주세요.';
  if (/SamsungBrowser/i.test(ua))
    return '<b>삼성 인터넷</b><br>① 주소창 오른쪽에 <span class="k">설치(⬇) 아이콘</span>이 보이면 누르기<br>② 또는 아래쪽 <span class="k">≡ 메뉴</span> → <span class="k">현재 페이지 추가</span> → <span class="k">홈 화면</span>';
  if (/iPhone|iPad|iPod/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1))
    return '<b>아이폰 · 아이패드 (사파리)</b><br>① 아래 가운데 <span class="k">공유 버튼(□↑)</span> 누르기<br>② <span class="k">홈 화면에 추가</span> → 오른쪽 위 <span class="k">추가</span>';
  if (/Android/i.test(ua))
    return '<b>크롬 (안드로이드)</b><br>오른쪽 위 <span class="k">⋮ 메뉴</span> → <span class="k">앱 설치</span> (또는 <span class="k">홈 화면에 추가</span>)';
  if (/Edg\//.test(ua) || /Chrome/.test(ua))
    return '<b>PC 크롬 · 엣지</b><br>주소창 오른쪽의 <span class="k">설치 아이콘(⊕)</span> 또는 메뉴 → <span class="k">앱 설치</span>';
  return '브라우저 메뉴에서 <span class="k">홈 화면에 추가</span> 또는 <span class="k">앱 설치</span>를 찾아 주세요.';
}
function openInstall(){
  if (isInstalledApp()){ showToast('이미 홈 화면 앱으로 실행 중입니다'); return; }
  document.getElementById('in-steps').innerHTML = installEvt ? '아래 <b>지금 설치하기</b>를 누르면 바로 설치됩니다.<br><br>'+installSteps() : installSteps();
  document.getElementById('in-go').style.display = installEvt ? '' : 'none';
  document.getElementById('install-modal').style.display = 'flex';
}
async function doInstall(){
  if (!installEvt){ openInstall(); return; }
  const ev = installEvt; installEvt = null;
  try{ ev.prompt(); const r = await ev.userChoice; if (r && r.outcome === 'accepted') showToast('홈 화면에 설치하는 중입니다'); }catch(e){}
  document.getElementById('install-modal').style.display = 'none';
  refreshInstallUI();
}
window.addEventListener('beforeinstallprompt', e=>{ e.preventDefault(); installEvt = e; refreshInstallUI(); });
window.addEventListener('appinstalled', ()=>{ installEvt = null; showToast('홈 화면에 설치되었습니다 — 홈 화면의 강호록 아이콘으로 열어 주세요'); refreshInstallUI(); });
try{ matchMedia('(display-mode: standalone)').addEventListener('change', refreshInstallUI); }catch(e){}
document.getElementById('t-install').addEventListener('click', openInstall);
document.getElementById('set-install').addEventListener('click', openInstall);
document.getElementById('in-go').addEventListener('click', doInstall);
document.getElementById('in-close').addEventListener('click', ()=>{ document.getElementById('install-modal').style.display = 'none'; });
document.getElementById('install-modal').addEventListener('click', e=>{ if (e.target.id==='install-modal') e.target.style.display = 'none'; });
if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)){
  window.addEventListener('load', ()=> navigator.serviceWorker.register('sw.js').catch(()=>{}));
  // 그림 미리 받기 (여러 파일 배포 — tools/build_web.py) : 열리고 8초 뒤 나머지 그림을 뒤에서 받아 둠 → 그 뒤로는 인터넷 없이도 다 보임
  //   인터넷이 안 되거나 데이터 절약 모드면 하지 않음 (그때는 그림이 필요할 때 받음)
  setTimeout(()=>{
    const cn = navigator.connection; if (!navigator.onLine || (cn && cn.saveData)) return;
    navigator.serviceWorker.ready.then(r=>{ if (r.active) r.active.postMessage({ type:'warm' }); }).catch(()=>{});
  }, 8000);
}
refreshInstallUI();
document.getElementById('set-close').addEventListener('click', closeSettings);
document.getElementById('settings-modal').addEventListener('click', e=>{ if (e.target.id==='settings-modal') closeSettings(); });
document.getElementById('set-save').addEventListener('click', ()=>{
  if (setMode!=='battle') return;
  const why = battleSaveBlock(); if (why){ showToast(why); return; }
  closeSettings(); doBattleSave();
});
document.getElementById('set-load').addEventListener('click', ()=>{
  const why = setMode==='battle' ? battleLeaveBlock() : ''; if (why){ showToast(why); return; }
  closeSettings(); openSaveModal('load');
});
document.getElementById('set-lobby').addEventListener('click', ()=>{
  const why = setMode==='battle' ? battleLeaveBlock() : ''; if (why){ showToast(why); return; }
  askConfirm('로비로 돌아가시겠습니까?\n저장하지 않은 진행은 사라집니다.', ()=>{
    closeSettings(); stopBattle();
    fadeSwap(()=>{
      ['hub-screen','npc-screen','battle-screen','status-modal','bag-modal','train-modal'].forEach(id=>{ const el=document.getElementById(id); if (el) el.style.display='none'; });
      showTitle();
    });
  }, null, '돌아가기', '취소');
});
document.getElementById('btn-settings').addEventListener('click', ()=> openSettings('story'));
// 버튼을 누를 때 작은 소리
document.addEventListener('click', e=>{
  if (e.target.closest && e.target.closest('.top-btn,.big-btn,.title-btn,.um-btn,#um-info,.sv-slot,.ep-row,.bag-slot,.bag-tab,.set-toggle,.tr-mem,.tn')) sfx('click');
}, true);


/* ================= 서사(인트로) → 캐릭터 생성 ================= */
let introIdx = 0, introTyping = false, introTimer = null;
const introText = document.getElementById('intro-text'), introNext = document.getElementById('intro-next');
// 서사 배경 두 겹을 번갈아 쓰며 부드럽게 전환
let introLayer = 1;
function setIntroBg(key){
  const cur = document.getElementById('intro-bg'+introLayer);
  if (cur.dataset.key===key && cur.classList.contains('on')) return;
  const nextNo = introLayer===1 ? 2 : 1, nx = document.getElementById('intro-bg'+nextNo);
  nx.style.backgroundImage = cssUrl(asset('bg.'+key)); nx.dataset.key = key;
  nx.classList.add('on'); cur.classList.remove('on'); introLayer = nextNo;
}

function startIntro(){
  introIdx = 0; playBgm('story');
  ['intro-bg1','intro-bg2'].forEach(id=>{ const el=document.getElementById(id); el.classList.remove('on'); el.dataset.key=''; });
  const is = document.getElementById('intro-screen');
  is.classList.remove('leaving'); is.style.display = 'block';
  document.getElementById('select-wrap').style.display = 'none';
  document.getElementById('intro-box').style.display = 'block';
  document.getElementById('intro-skip').style.display = 'block';
  showIntro(0);
  const ts = document.getElementById('title-screen');
  ts.classList.add('leaving');
  setTimeout(()=>{ ts.style.display = 'none'; }, 750);
}
function showIntro(i){
  const it = INTRO[i];
  setIntroBg(it.bg);
  introText.textContent = ''; introNext.style.visibility = 'hidden';
  introTyping = true; let c = 0;
  clearInterval(introTimer);
  introTimer = setInterval(()=>{
    introText.textContent += it.text[c]; c++;
    if (c>=it.text.length){ clearInterval(introTimer); introTyping=false; introNext.style.visibility='visible'; }
  }, 45);
}
function openSelect(){
  clearInterval(introTimer);
  document.getElementById('intro-box').style.display = 'none';
  document.getElementById('intro-skip').style.display = 'none';
  setIntroBg(INTRO[INTRO.length-1].bg);
  document.querySelectorAll('.sel-card, .sel-item').forEach(c=>c.classList.remove('on'));
  document.querySelectorAll('.sel-cap').forEach(c=>{ const L = HERO_LOOKS[c.dataset.hero] || {};
    c.innerHTML = '<b>' + (L.name||'') + '</b><small>' + Object.keys(L.stat||{}).map(k=> STAT_NAME[k] + ' +' + L.stat[k]).join(' · ') + '</small>'; });
  document.getElementById('name-msg').textContent = '';
  HERO.look = null;
  document.getElementById('select-wrap').style.display = 'flex';
}
document.getElementById('intro-box').addEventListener('click', ()=>{
  if (introTyping){ clearInterval(introTimer); introText.textContent = INTRO[introIdx].text; introTyping=false; introNext.style.visibility='visible'; return; }
  introIdx++;
  if (introIdx >= INTRO.length){ openSelect(); return; }
  showIntro(introIdx);
});
document.getElementById('intro-skip').addEventListener('click', openSelect);
document.querySelectorAll('.sel-card').forEach(c=>{
  c.addEventListener('click', ()=>{
    document.querySelectorAll('.sel-card').forEach(x=>{ x.classList.toggle('on', x===c); x.parentNode.classList.toggle('on', x===c); });
    HERO.look = c.dataset.hero;
    const msg = document.getElementById('name-msg'); msg.classList.remove('warn');
    msg.textContent = (HERO_LOOKS[HERO.look] || {}).story || '';
  });
});
function makeHero(){
  const msg = document.getElementById('name-msg');
  if (!HERO.look){ msg.classList.add('warn'); msg.textContent = '강호에서의 모습을 먼저 선택해주세요'; return; }
  HERO.name = heroNameOf(HERO.look); HERO.level = 1; HERO.exp = 0; HERO.realm = REALMS[0];
  HERO.equip = emptyEquip(); HERO.tree = []; HERO.learned = []; HERO.elixir = {}; HERO.attr = { mu:0, ne:0, sin:0 }; HERO.arts = null; HERO.simbeop = []; delete HERO.train;
  equipFixedGear('hero', 0);                                   // 무기 · 방어구 : 인물마다 고정 (주인공 철검 · 천옷)
  resetParty();
  PLAYER.gold = START_GOLD; PLAYER.suryeon = 0; PLAYER.trainCnt = {}; PLAYER.inv = {}; PLAYER.flags = {}; PLAYER.missions = {}; PLAYER.pyo = null; PLAYER.codex = null; PLAYER.playMs = 0; PLAYER.meta = {};
  startStory();
}
document.getElementById('name-make').addEventListener('click', makeHero);


/* ================= 저장 / 불러오기 (5칸 × 3페이지 = 15칸) ================= */
const SAVE_KEY = 'ganghorok_saves_v1';
const SLOTS_PER_PAGE = 5, SAVE_PAGES = 3, SAVE_SLOTS = SLOTS_PER_PAGE * SAVE_PAGES;
let memSaves = null, storageWarned = false;
function storageOK(){ try{ const k='__t'; localStorage.setItem(k,'1'); localStorage.removeItem(k); return true; }catch(e){ return false; } }
function readSaves(){
  let arr = null;
  try{ arr = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); }catch(e){ arr = memSaves; }
  if (!Array.isArray(arr)) arr = memSaves || [];
  while (arr.length < SAVE_SLOTS) arr.push(null);
  return arr;
}
function writeSaves(arr){
  memSaves = arr;
  try{ localStorage.setItem(SAVE_KEY, JSON.stringify(arr)); return true; }catch(e){ return false; }
}
// 현재 진행 상황 (지금은 '서장 대화가 끝난 뒤' 시점에서 저장)
let saveCtx = null;     // 전투 뒤 저장 : { scene, pos:'start', onClose }
//   pos : 'end' = 장면 대사가 끝난 화면 / 'start' = 그 장면 처음부터 / 'battle' = 전투 중 (battle 에 전투 상태)
function makeSnapshot(){
  const sceneId = (saveCtx && saveCtx.scene) || curScene, sc = SCENES[sceneId];
  const snap = { v:1, rv:2, time:Date.now(), chapter:sc.chapter, place:sc.place, scene:sceneId, pos:(saveCtx && saveCtx.pos) || 'end',
           hero:{ name:HERO.name, look:HERO.look, job:HERO.job, level:HERO.level, exp:HERO.exp, realm:HERO.realm, equip:Object.assign({}, HERO.equip),
                  tree:(HERO.tree||[]).slice(), learned:(HERO.learned||[]).slice(), elixir:(typeof HERO.elixir === 'number' ? HERO.elixir : JSON.parse(JSON.stringify(HERO.elixir || {}))), attr:Object.assign({ mu:0, ne:0, sin:0 }, HERO.attr||{}), arts:HERO.arts ? JSON.parse(JSON.stringify(HERO.arts)) : null, simbeop:(HERO.simbeop||[]).slice() },
           party:PARTY.slice(), members:JSON.parse(JSON.stringify(MEMBERS)),
           player:{ gold:PLAYER.gold, suryeon:PLAYER.suryeon||0, trainCnt:Object.assign({}, PLAYER.trainCnt || {}), inv:Object.assign({}, PLAYER.inv), flags:Object.assign({}, PLAYER.flags), missions:Object.assign({}, PLAYER.missions || {}), pyo:PLAYER.pyo ? JSON.parse(JSON.stringify(PLAYER.pyo)) : null, codex:JSON.parse(JSON.stringify(codexState())), playMs:Math.round(PLAYER.playMs||0), meta:JSON.parse(JSON.stringify(PLAYER.meta || {})) } };
  if (saveCtx && saveCtx.battle){ snap.pos = 'battle'; snap.place = battlePlace(); snap.battle = battleSnapshot(); }
  return snap;
}
// 다음 장면 : 'scene' 또는 { mission:'cheolgeom_talk', done:'A', else:'B' } — 그 임무를 완료했으면 done, 아니면 else
//   any = true 면 임무와 상관없이 하나 (이야기 순서 계산용)
function resolveNext(n, any){
  if (!n || typeof n === 'string') return n || null;
  if (any) return n.else || n.done || null;
  if (n.mission) return missionState(n.mission)==='done' ? n.done : n.else;
  return n.else || null;
}
// 이야기 순서 (장면 → next 또는 출정 전투 → 승리 뒤 장면 …)
function storyOrder(){
  const out = []; let sc = FIRST_SCENE, guard = 0;
  while (sc && SCENES[sc] && !out.includes(sc) && guard++ < 500){
    out.push(sc); const S = SCENES[sc];
    if (S.next) sc = resolveNext(S.next, true);
    else if (S.sortie && BATTLES[S.sortie]){
      if (S.sortieScene && SCENES[S.sortieScene] && !out.includes(S.sortieScene)) out.push(S.sortieScene);   // 출정 → 전투 전 장면
      out.push('battle:'+S.sortie); sc = resolveNext((BATTLES[S.sortie].victory || {}).next, true);
    }
    else sc = null;
  }
  return out;
}
// 이 장면 앞에서 이긴 전투들의 수련치 합
function earnedSuryeon(scene){
  const order = storyOrder(), i = order.indexOf(scene); if (i < 0) return 0;
  return order.slice(0, i).filter(k=>k.startsWith('battle:')).reduce((a,k)=> a + ((BATTLES[k.slice(7)].victory || {}).suryeon || 0), 0);
}
// v40 훈련장(횟수 수련) 저장 → 수련도로 옮기기 : 수련에 쓴 금은 돌려주고, 배운 무공은 그 노드까지(앞 노드 포함) 해금
function migrateOldTraining(id, st){
  if (!st) return 0;
  const OLD = { hp:[100,50], mp:[100,50], atk:[150,75], def:[150,75] };
  let refund = 0;
  if (st.train) Object.keys(st.train).forEach(k=>{ const n = st.train[k]||0, o = OLD[k]; if (o) for (let i=0;i<n;i++) refund += o[0] + o[1]*i; });
  delete st.train;
  PLAYER.gold += refund;
  st.tree = st.tree || []; st.learned = st.learned || [];
  st.learned.slice().forEach(name=>{
    let cur = treeBase(id).find(n=>n.type==='skill' && n.skill===name); if (!cur) return;
    while (cur){ if (!st.tree.includes(cur.id)) st.tree.push(cur.id); const pid = treeParent(id, cur); cur = pid ? treeNode(id, pid) : null; }
    st.learned = st.learned.filter(x=>x!==name);
  });
  return refund;
}
// 예전 저장에 남은 옛 물건 이름 → 새 이름 (data/items.js 의 ITEM_RENAMED)
// 예전 저장 : 지나온 장면의 대사 줄에서 익혔어야 할 무공 (give.skill) 을 조용히 채움
function learnCatchUp(scene, passed){
  const lim = storyIdx(scene) + (passed ? 1 : 0); if (lim <= 0) return;
  Object.keys(SCENES).forEach(id=>{
    const i = storyIdx(id); if (i < 0 || i >= lim) return;
    (SCENES[id].script || []).forEach(l=>{
      const g = l.give; if (!g) return;
      const to = g.to || 'hero', st = memberState(to); if (!st || !isParty(to)) return;
      if (g.simbeop && typeof SIMBEOP !== 'undefined' && SIMBEOP[g.simbeop]){ st.simbeop = st.simbeop || []; if (!st.simbeop.includes(g.simbeop)) st.simbeop.push(g.simbeop); }
      if (!g.skill || !SKILLS[g.skill]) return;
      st.learned = st.learned || []; if (!st.learned.includes(g.skill)) st.learned.push(g.skill);
    });
  });
}
function renameOldItems(){
  const R = (typeof ITEM_RENAMED !== 'undefined') ? ITEM_RENAMED : {};
  const fix = n => (R[n] && ITEM_DB[R[n]]) ? R[n] : n;
  const inv = {};
  Object.keys(PLAYER.inv||{}).forEach(n=>{ const k = fix(n); inv[k] = (inv[k]||0) + PLAYER.inv[n]; });
  PLAYER.inv = inv;
  [HERO.equip].concat(Object.keys(MEMBERS).map(id=>MEMBERS[id].equip)).forEach(eq=>{
    if (eq) Object.keys(eq).forEach(sl=>{ if (eq[sl]) eq[sl] = fix(eq[sl]); });
  });
}
function applySnapshot(s){
  closeSettings(); stopBattle();
  Object.assign(HERO, { level:1, exp:0, job:HERO_DEFAULT.job }, s.hero);
  HERO.name = heroNameOf(HERO.look, HERO.name);              // 이름은 모습에 따라 고정 (예전 저장의 직접 지은 이름도 바꿈)
  // 경지 : 새 저장(rv 2)은 저장된 경지 그대로, 예전 저장은 새 레벨표로 다시 계산
  const keepRealm = (r, lv)=> (s.rv >= 2 && REALMS.includes(r)) ? r : realmOfLevel(lv||1);
  HERO.realm = keepRealm(s.hero.realm, HERO.level);
  HERO.equip = Object.assign(emptyEquip(), s.hero.equip || {});
  HERO.tree = (s.hero.tree || []).slice(); HERO.learned = (s.hero.learned || []).slice(); HERO.elixir = (s.hero.elixir && typeof s.hero.elixir === 'object') ? Object.assign({}, s.hero.elixir) : (s.hero.elixir || 0);
  HERO.attr = Object.assign({ mu:0, ne:0, sin:0 }, s.hero.attr || {});
  HERO.arts = s.hero.arts ? JSON.parse(JSON.stringify(s.hero.arts)) : null;     // 무공 칸 (예전 저장은 처음에 저절로 채움)
  HERO.simbeop = (s.hero.simbeop || []).slice();
  PARTY = (s.party && s.party.length) ? s.party.slice() : ['hero'];
  MEMBERS = JSON.parse(JSON.stringify(s.members || {}));
  Object.keys(MEMBERS).forEach(id=>{ const m = MEMBERS[id]; m.realm = keepRealm(m.realm, m.level); m.equip = Object.assign(emptyEquip(), m.equip||{});
                                     m.tree = m.tree || []; m.learned = m.learned || []; });
  PLAYER.playMs = s.player.playMs || 0;                     // 플레이 시간 (예전 저장은 0부터)
  PLAYER.gold = s.player.gold; PLAYER.inv = Object.assign({}, s.player.inv); PLAYER.flags = Object.assign({}, s.player.flags || {});
  PLAYER.missions = Object.assign({}, s.player.missions || {});
  PLAYER.meta = JSON.parse(JSON.stringify(s.player.meta || {}));             // 업적 · 도감 · 기록 (js/meta.js)
  PLAYER.pyo = s.player.pyo ? JSON.parse(JSON.stringify(s.player.pyo)) : null;
  if (PLAYER.pyo && PLAYER.pyo.sent) PLAYER.pyo.sent.forEach(j=>{ if (!j.at) j.at = s.scene; if (j.reward) j.reward = ITEM_RENAMED[j.reward] || j.reward; });
  if (PLAYER.pyo) delete PLAYER.pyo.offers;
  PLAYER.codex = s.player.codex ? JSON.parse(JSON.stringify(s.player.codex)) : null;   // 예전 저장 : 처음 맞출 때 조용히 채움
  if (!PLAYER.codex) window.__codexSilent = true;
  PLAYER.trainCnt = Object.assign({}, s.player.trainCnt || {});
  PLAYER.suryeon = (typeof s.player.suryeon === 'number') ? s.player.suryeon : earnedSuryeon(s.scene);   // 수련치가 생기기 전 저장 → 지나온 전투 보상만큼
  renameOldItems(); ensureSavedItems();          // 강화한 물건 (철검 +3 …) 을 물건 사전에 등록
  fixEquipSlots(HERO); Object.keys(MEMBERS).forEach(id=> fixEquipSlots(MEMBERS[id]));   // 보물 칸 · 능력 점수 (예전 저장)
  normalizeBagGear(); PARTY.forEach(fixFixedGear);                                         // 고정 장비 · 새 등급 규칙 (예전 저장)
  migrateOldTraining('hero', HERO); Object.keys(MEMBERS).forEach(id=> migrateOldTraining(id, MEMBERS[id]));
  learnCatchUp(s.scene, s.pos!=='start');                                   // 지나온 장면에서 익혔어야 할 절기 (이야기가 늘어나기 전 저장)
  catchUpMembers();                                                         // 뒤처진 동료 따라잡기 (v117 전 저장)
  if (typeof metaOnLoad==='function') metaOnLoad();                          // 업적 · 도감 (v122 전 저장 맞추기)
  if (typeof artsOnLoad==='function') artsOnLoad();                          // 무공 칸 · 비전 (v123 전 저장 맞추기)
  if (s.pos==='battle' && s.battle && BATTLES[s.battle.id]){        // 전투 중 저장 → 그 턴부터 이어서
    const ts = document.getElementById('title-screen');
    if (ts.style.display !== 'none'){ ts.classList.add('leaving'); setTimeout(()=>{ ts.style.display='none'; }, 750); }
    curScene = SCENES[s.scene] ? s.scene : FIRST_SCENE;
    ['intro-screen','story-screen','hub-screen','npc-screen','status-modal','bag-modal','settings-modal'].forEach(id=>{ const el=document.getElementById(id); if (el) el.style.display='none'; });
    document.getElementById('battle-screen').style.display = 'block';
    resumeBattle(s.battle);
    return;
  }
  const extended = s.pos==='end' && SCENES[s.scene] && SCENES[s.scene].next && SCENES[resolveNext(SCENES[s.scene].next, true)];
  if ((s.pos==='start' || extended) && SCENES[s.scene]){   // 전투 뒤 저장 → 다음 장면을 처음부터 (이야기가 뒤로 늘어난 예전 저장도)
    const ts = document.getElementById('title-screen');
    if (ts.style.display !== 'none'){ ts.classList.add('leaving'); setTimeout(()=>{ ts.style.display='none'; }, 750); }
    startScene(s.scene, true);
  } else goStoryEnd(SCENES[s.scene] ? s.scene : FIRST_SCENE);
}
// 서장 대화가 끝난 화면(상단 메뉴)으로 바로 이동
function goStoryEnd(scene){
  curScene = (scene && SCENES[scene]) ? scene : FIRST_SCENE; playBgm('story');
  const sc = SCENES[curScene];
  ['intro-screen','battle-screen','hub-screen','npc-screen'].forEach(id=>{ const el=document.getElementById(id); if (el) el.style.display='none'; });
  const ss = document.getElementById('story-screen');
  ss.style.display = ''; ss.classList.add('ended');
  const end = sc.end || { bg:sc.bg, cast:sc.cast };
  setStoryBg(end.bg); setCast(end.cast);
  curPlace = null; buildStoryNpcs(); document.getElementById('snpc-box').style.display = 'none';
  scriptIdx = curScript().length; clearInterval(typeTimer); typing = false;
  document.getElementById('story-box').style.cursor = 'default';
  document.getElementById('top-menu-wrap').classList.remove('hidden');
  unlockFromScene(sc);
  document.getElementById('hub-open-wrap').classList.toggle('hidden', !hubOpen());
  codexCheck(true);
  refreshMissionBadges();
  setTimeout(noticeMissions, 900);
  const ts = document.getElementById('title-screen');
  if (ts.style.display !== 'none'){ ts.classList.add('leaving'); setTimeout(()=>{ ts.style.display='none'; }, 750); }
}
function fmtTime(t){
  const d = new Date(t), p = n=>String(n).padStart(2,'0');
  return d.getFullYear()+'.'+p(d.getMonth()+1)+'.'+p(d.getDate())+'<br>'+p(d.getHours())+':'+p(d.getMinutes());
}
let svMode = 'save', svPage = 0;
function openSaveModal(mode, ctx){
  svMode = mode; svPage = 0; saveCtx = ctx || null;
  document.getElementById('sv-title').textContent = mode==='save' ? '저장하기' : '불러오기';
  document.getElementById('sv-note').textContent = storageOK() ? '' : '※ 이 브라우저에서는 창을 닫으면 저장이 사라집니다';
  renderSaveList();
  document.getElementById('save-modal').style.display = 'flex';
  if (typeof cloudSync === 'function'){ cloudUI(); cloudSync(true); }       // 로그인했으면 서버와 맞춘 뒤 다시 그림 (js/cloud.js)
}
function closeSaveModal(){
  document.getElementById('save-modal').style.display = 'none';
  const c = saveCtx; saveCtx = null;
  if (c && c.onClose) c.onClose();
}
function renderSaveList(){
  renderAutoRow();
  const saves = readSaves();
  const list = document.getElementById('sv-list'); list.innerHTML = '';
  for (let i=0;i<SLOTS_PER_PAGE;i++){
    const idx = svPage*SLOTS_PER_PAGE + i, sv = saves[idx];
    const row = document.createElement('div'); row.className = 'sv-slot';
    const no = 'No.'+String(idx+1).padStart(2,'0');
    if (sv){
      const face = asset('face.'+(sv.hero.look==='f' ? 'hero_f' : 'hero_m'));
      row.innerHTML = '<span class="sv-no">'+no+'</span><img class="sv-face" src="'+face+'">'+
        '<div class="sv-main">'+heroNameOf(sv.hero.look, sv.hero.name)+' Lv'+(sv.hero.level||1)+' · '+sv.hero.job+' '+((sv.rv>=2 && sv.hero.realm) || realmOfLevel(sv.hero.level||1))+
        '<small>'+sv.chapter+' · '+sv.place+' · 금 '+Number(sv.player.gold).toLocaleString()+playTag(sv)+'</small></div>'+
        '<span class="sv-time">'+fmtTime(sv.time)+'</span>';
    } else {
      row.innerHTML = '<span class="sv-no">'+no+'</span><div class="sv-main sv-empty">비어 있음</div>';
    }
    row.addEventListener('click', ()=>onSlotClick(idx));
    list.appendChild(row);
  }
  document.getElementById('sv-page').textContent = (svPage+1)+' / '+SAVE_PAGES;
}
function onSlotClick(idx){
  const saves = readSaves(), sv = saves[idx], no = 'No.'+String(idx+1).padStart(2,'0');
  if (svMode==='save'){
    const doSave = ()=>{
      saves[idx] = makeSnapshot();
      const ok = writeSaves(saves);
      if (typeof cloudSaveSlot === 'function') cloudSaveSlot(idx, saves[idx]);    // 로그인했으면 서버에도 (js/cloud.js)
      renderSaveList();
      showToast(no+'에 저장했습니다' + (ok ? '' : ' (창을 닫으면 사라짐)'));
      if (saveCtx && saveCtx.onClose) setTimeout(closeSaveModal, 700);    // 전투 뒤 저장이면 바로 이어서 진행
    };
    if (sv) askConfirm(no+'에 덮어쓰시겠습니까?', doSave); else doSave();
  } else {
    if (!sv){ showToast('비어 있는 칸입니다'); return; }
    askConfirm(no+' 이야기를 불러오시겠습니까?', ()=>{ saveCtx = null; closeSaveModal(); applySnapshot(sv); showToast(no+' 불러오기 완료'); });
  }
}
function askConfirm(msg, onYes, onNo, yesLabel, noLabel){
  document.getElementById('ask-msg').textContent = msg;
  const m = document.getElementById('ask-modal'); m.style.display = 'flex';
  const yes = document.getElementById('ask-yes'), no = document.getElementById('ask-no');
  yes.textContent = yesLabel || '확인'; no.textContent = noLabel || '취소';
  yes.onclick = ()=>{ m.style.display='none'; onYes && onYes(); };
  no.onclick  = ()=>{ m.style.display='none'; onNo && onNo(); };
}
document.getElementById('sv-prev').addEventListener('click', ()=>{ svPage = (svPage+SAVE_PAGES-1)%SAVE_PAGES; renderSaveList(); });
document.getElementById('sv-next').addEventListener('click', ()=>{ svPage = (svPage+1)%SAVE_PAGES; renderSaveList(); });
document.getElementById('sv-close').addEventListener('click', closeSaveModal);
document.getElementById('btn-save').addEventListener('click', ()=> openSaveModal('save'));


/* ================= 상태보기: 아군 목록 → 인물 정보 ================= */
function partyMembers(){
  // 상태보기에는 아군(주인공 + 합류 인물)만 표시. 우군은 제외
  return PARTY.map(memberView);
}
function memberView(id){
  const src = id==='hero' ? HERO : Object.assign({}, UNITS[id], MEMBERS[id] || {});
  const party = isParty(id);
  const c = Object.assign({}, src, { key:id, camp: party ? '아군' : '우군', friend: !party, face:faceOf(id), card:cardOf(id) });
  c.skills = party ? memberSkills(id) : (src.skills||[]).slice(); c.level = c.level || 1;
  if (party) c.move = (c.move || 4) + attrMove(id);                 // 신법 10점마다 이동 +1
  Object.assign(c, computeStats(c.level, c.equip, party ? growthBonus(id) : null, party ? memberRealm(id) : null, statMods(id))); c.hp = c.maxHp; c.mp = c.maxMp;
  return c;
}
let stMembers = [], stIdx = 0, stTab = 'stat';
// 상태보기 (인물 정보) 상태 : 배낭 탭 분류 · 고른 물건 ('@weapon' = 그 칸에 낀 물건) · 고른 장비 칸 · 능력 점수 (확정 전)
let stBagF = 'all', stSel = null, stSlot = null, stPend = null, stPendFor = null;
function refreshStatus(){ stMembers = partyMembers(); openDetail(stIdx, true); }
function openStatus(){
  stMembers = partyMembers();
  const rows = document.getElementById('st-rows'); rows.innerHTML = '';
  stMembers.forEach((m,i)=>{
    const r = document.createElement('div'); r.className = 'st-row' + (m.friend?' friend':'');
    const left = attrLeft(m.key);
    r.innerHTML = '<img src="'+m.face+'"><div class="nm">'+m.name+'<span class="camp'+(m.friend?' friend':'')+'">'+m.camp+'</span>'+
                  (left ? '<span class="pt-badge">능력 점수 +'+left+'</span>' : '')+
                  '<small>Lv '+(m.level||1)+' · '+m.job+' · '+m.realm+' · 경험 '+(m.exp||0)+'/'+EXP_MAX+(atWall(m.key)?' · <span class="wall">경지의 벽</span>':'')+'</small></div>'+
                  '<div class="hp">체력 '+m.hp+'/'+m.maxHp+'<br>내공 '+m.mp+'/'+m.maxMp+'</div>';
    r.addEventListener('click', ()=>openDetail(i));
    rows.appendChild(r);
  });
  document.getElementById('st-list').style.display = 'flex';
  document.getElementById('st-detail').style.display = 'none';
  document.getElementById('status-modal').style.display = 'flex';
}
function stMember(){ return stMembers[stIdx]; }
function openDetail(i, keep){
  stIdx = (i + stMembers.length) % stMembers.length;
  const m = stMember();
  if (!keep || stPendFor !== m.key){ stSel = null; stSlot = null; stPend = Object.assign({ mu:0, ne:0, sin:0 }, attrOf(m.key)); stPendFor = m.key; }
  const p = document.getElementById('sd-portrait'); p.src = m.card; p.className = m.friend ? 'friend' : '';
  document.getElementById('sd-name').textContent = m.name;
  document.getElementById('sd-lv').textContent = 'Lv '+(m.level||1);
  document.getElementById('sd-ex').textContent = (m.exp||0)+'/'+EXP_MAX;
  document.getElementById('sd-ex-bar').style.width = ((m.exp||0)/EXP_MAX*100)+'%';
  document.getElementById('sd-realm').textContent = m.realm;
  document.getElementById('sd-job').textContent = m.job;
  document.getElementById('sd-camp').innerHTML = '<span class="camp'+(m.friend?' friend':'')+'">'+m.camp+'</span>';
  document.getElementById('sd-hp').textContent = m.hp+'/'+m.maxHp;
  document.getElementById('sd-mp').textContent = m.mp+'/'+m.maxMp;
  document.getElementById('sd-hp-bar').style.width = (m.hp/m.maxHp*100)+'%';
  document.getElementById('sd-mp-bar').style.width = (m.maxMp ? m.mp/m.maxMp*100 : 0)+'%';
  document.getElementById('sd-gold').textContent = PLAYER.gold.toLocaleString();
  document.getElementById('sd-bio').innerHTML = bioPanel(m);
  document.getElementById('st-list').style.display = 'none';
  document.getElementById('st-detail').style.display = 'flex';
  renderTab();
}
// 오른쪽 : 열전 (별호 · 칭호 · 특성 · 열전 글)
function bioPanel(m){
  const b = bioOf(m.key), tn = traitName(m.key), tt = traitText(m.key);
  let h = '<div class="bio-row"><span class="k">별호</span><span>'+((b && b.alias) || '없음')+'</span></div>'+
          '<div class="bio-row"><span class="k">칭호</span><span>'+(m.title || '없음')+'</span></div>';
  if (tn) h += '<div class="bio-row"><span class="k">특성</span><span>'+tn+(tt ? '<small>'+tt+'</small>' : '')+'</span></div>';
  h += b ? '<div class="bio-text">'+codexText(sexText(b))+'</div>' : '<div class="bio-text none">아직 열전이 없습니다.</div>';
  return h;
}
// 왼쪽 : 초상화 옆 장비 네 칸 — 누르면 배낭 탭에서 그 칸에 낄 물건만
function renderSlots(m){
  const w = document.getElementById('sd-slots'); w.innerHTML = '';
  const eq = m.equip || {};
  EQUIP_SLOTS.forEach(([slot, label])=>{
    const n = eq[slot], d = document.createElement('div');
    const pg = n ? itemParse(n) : null;
    d.className = 'eq-slot' + (n ? ' on' : '') + (n && isNamed(n) ? ' named' : '') + (pg && pg.grade ? ' g'+pg.grade : '') + (stTab==='bag' && (stSlot===slot || stSel==='@'+slot) ? ' sel' : '');
    d.innerHTML = n ? '<span class="tag">'+EQUIP_GLYPH[slot]+'</span><span class="ic'+gradeCls(n)+'">'+itemIcon(n)+'</span>'+(pg.lv ? '<span class="lv">+'+pg.lv+'</span>' : '')
                    : '<span class="g">'+EQUIP_GLYPH[slot]+'</span><span class="n">'+label+'</span>';
    d.title = label + ' : ' + (n || '비어 있음');
    const fixed = (slot==='weapon' || slot==='armor') && isParty(m.key);    // 무기 · 방어구 : 고정 장비 (배낭에서 바꾸지 않음)
    d.onclick = ()=>{ stTab = 'bag'; stSlot = fixed ? null : slot; stBagF = fixed ? 'all' : slot; stSel = n ? '@'+slot : null; renderTab(); };
    w.appendChild(d);
  });
}
function renderTab(){
  const m = stMember(), body = document.getElementById('sd-tabbody');
  document.querySelectorAll('.sd-tab').forEach(t=>t.classList.toggle('on', t.dataset.tab===stTab));
  const dot = document.getElementById('sd-pt-dot'); if (dot) dot.style.display = attrLeft(m.key) > 0 ? '' : 'none';
  renderSlots(m);
  if (stTab==='stat'){ body.innerHTML = statTabHtml(m); bindStatTab(m); }
  else if (stTab==='skill' && typeof artsTabHtml==='function' && artsTabHtml(m) !== null){ body.innerHTML = artsTabHtml(m); bindArtsTab(m, renderTab); }   // 무공 칸 · 갈래 (js/arts.js)
  else if (stTab==='skill'){
    const party = isParty(m.key), ms = party ? treeMastery(m.key) : {};
    const pas = party ? unlockedNodes(m.key).filter(n=>n.type==='passive').map(n=>n.name) : [];
    const ef = party ? treeEffects(m.key) : {};
    const efTxt = nodeEffectText({ effect:ef });
    if (!m.skills.length && !pas.length){ body.innerHTML = '<div class="sbag-empty">익힌 무공이 없습니다.</div>'; return; }
    body.innerHTML = m.skills.map(n=> '<div class="sk-card"><b>'+n+'</b><small>'+skillText(SKILLS[n], ms[n])+'</small></div>').join('') +
                     (pas.length ? '<div class="sk-card passive"><b>심법 <em>'+pas.length+'개</em></b><small>'+efTxt+'<br>'+pas.join(' · ')+'</small></div>' : '');
  }
  else if (stTab==='bag'){ body.innerHTML = bagTabHtml(m); bindBagTab(m); }
  else { body.innerHTML = bondTabHtml(m); }
}
/* ---- 능력 : 능력 점수 (무력 · 내력 · 신법) + 능력치 (장비 초록 · 능력 점수 파랑) ---- */
function statTabHtml(m){
  const id = m.key, party = isParty(id), P = stPend || { mu:0, ne:0, sin:0 };
  let h = '';
  if (party && typeof ATTR !== 'undefined'){
    const tot = attrTotal(m.level), left = tot - attrUsed(P), saved = attrOf(id);
    const dirty = ATTR.list.some(L=> (P[L.key]||0) !== (saved[L.key]||0));
    h += '<div class="pt-head"><span>능력 점수 <small>· '+ATTR.per+'레벨마다 '+ATTR.gain+'점 · 1점마다 →</small></span><span>남은 점수 <b>'+left+'</b> / '+tot+'</span></div>';
    ATTR.list.forEach(L=>{
      const v = P[L.key] || 0;
      h += '<div class="attr"><span class="nm"><i>'+L.g+'</i>'+L.name+'</span>'+
           '<span class="stepper"><button data-k="'+L.key+'" data-d="-1"'+(v<=0?' disabled':'')+'>−</button><b>'+v+'</b><button data-k="'+L.key+'" data-d="1"'+(left<=0?' disabled':'')+'>+</button></span>'+
           '<span class="ef">'+L.desc+'</span></div>';
    });
    h += '<div class="pt-btns">'+(tot ? '<span class="mini" id="pt-rec">추천</span><span class="mini" id="pt-reset">다시 나누기</span><span class="mini go'+(dirty?'':' off')+'" id="pt-ok">확정</span>'
                                      : '<span class="pt-none">Lv '+ATTR.per+'부터 '+ATTR.gain+'점씩 생깁니다</span>')+'</div>';
  }
  // 능력치 : 확정 전이면 나눈 대로 미리 보기
  const st = memberState(id), lv = m.level || 1, eqB = equipBonus(m.equip), tb = party ? growthBonus(id) : null, rl = party ? memberRealm(id) : null;
  const full = computeStats(lv, m.equip, tb, rl, statMods(id, null, null, party ? P : null));
  const noAt = computeStats(lv, m.equip, tb, rl, statMods(id, null, null, null));
  const row = (nm, k, eqk)=>{ const v = full[k], e = eqB[eqk] || 0, a = v - noAt[k];
    return '<div class="dv"><span>'+nm+'</span><b>'+v+(e ? '<em class="eq">+'+e+'</em>' : '')+(a ? '<em class="pt">'+(a>0?'+':'')+a+'</em>' : '')+'</b></div>'; };
  const mv = (UNITS[id] && UNITS[id].move) || (id==='hero' ? HERO.move : 4), mvA = party ? attrMoveOf(P) : 0;
  h += '<div class="derived">'+row('공격','atk','atk')+row('방어','def','def')+row('명중','hit','hit')+row('회피','eva','eva')+row('체력','maxHp','hp')+row('내공','maxMp','mp')+
       '<div class="dv"><span>이동</span><b>'+((id==='hero' ? HERO.move : mv) + mvA)+(mvA ? '<em class="pt">+'+mvA+'</em>' : '')+'</b></div>'+
       (party && attrSkillPowOf(P) > 1 ? '<div class="dv"><span>무공 위력</span><b>+'+Math.round((attrSkillPowOf(P)-1)*100)+'%</b></div>' : '')+'</div>'+
       '<div class="dv-note"><span class="eq">초록</span> = 장비 · <span class="pt">파랑</span> = 능력 점수</div>';
  return h;
}
function bindStatTab(m){
  const body = document.getElementById('sd-tabbody'), id = m.key;
  body.querySelectorAll('.stepper button').forEach(b=> b.onclick = ()=>{ const k = b.dataset.k; stPend[k] = Math.max(0, (stPend[k]||0) + (+b.dataset.d)); renderTab(); });
  const q = x=> document.getElementById(x);
  if (q('pt-rec'))   q('pt-rec').onclick   = ()=>{ stPend = attrRecommend(id, attrTotal(m.level)); renderTab(); };
  if (q('pt-reset')) q('pt-reset').onclick = ()=>{ stPend = { mu:0, ne:0, sin:0 }; renderTab(); };
  if (q('pt-ok'))    q('pt-ok').onclick    = ()=>{
    if (q('pt-ok').classList.contains('off')) return;
    Object.assign(attrOf(id), stPend); sfx('levelup');
    showToast(m.name+' — 능력 점수를 나눴습니다 (무력 '+stPend.mu+' · 내력 '+stPend.ne+' · 신법 '+stPend.sin+')');
    refreshStatus();
  };
}
/* ---- 배낭 : 물건을 눌러 장착 · 해제 · 복용 · 열기 ---- */
const ST_BAG_F = [['all','전체'],['accessory','장신구'],['treasure','보물'],['consumable','도구'],['material','재료']];   // 무기 · 방어구는 고정 (대장간)
function bagTabHtml(m){
  let h = '<div class="chips">'+ST_BAG_F.map(([k,n])=>'<span class="chip'+(stBagF===k?' on':'')+'" data-f="'+k+'">'+n+'</span>').join('')+'</div>';
  const usable = n=> !!elixirDef(n) || (typeof TREASURE_BOX !== 'undefined' && n===TREASURE_BOX.item) || (typeof GOLD_BOX !== 'undefined' && n===GOLD_BOX.item);
  const kind = n=> usable(n) ? 'consumable' : (ITEM_DB[n].type==='weapon' || ITEM_DB[n].type==='armor') ? 'material' : ITEM_DB[n].type;   // 상자 · 영약은 '도구' · (예전 저장의) 무기 · 방어구는 '재료' 쪽에
  const items = Object.keys(PLAYER.inv).filter(n=> PLAYER.inv[n]>0 && ITEM_DB[n] && (stBagF==='all' || kind(n)===stBagF));
  if (stSel && stSel[0]!=='@' && !items.includes(stSel)) stSel = null;
  h += items.length ? '<div class="sbag-grid">'+items.map((n,i)=>{ const it = ITEM_DB[n], fit = stSlot && it.type===stSlot && !equipBlock(n, m.key);
         return '<div class="sbag-it'+(isNamed(n)?' named':'')+(stSel===n?' sel':'')+(fit?' fit':'')+'" data-i="'+i+'"><span class="ic'+gradeCls(n)+'">'+itemIcon(n)+'</span>'+
                (PLAYER.inv[n]>1 ? '<span class="ct">'+PLAYER.inv[n]+'</span>' : '')+'<span class="nm'+gradeCls(n)+'">'+n+'</span></div>'; }).join('')+'</div>'
                    : '<div class="sbag-empty">'+(stSlot ? '배낭에 이 칸에 낄 물건이 없습니다.' : '배낭이 비어 있습니다.')+'</div>';
  h += '<div class="sbag-det">'+bagDetHtml(m)+'</div>';
  bagTabHtml.items = items;
  return h;
}
function bagDetHtml(m){
  const id = m.key, st = memberState(id);
  if (stSel && stSel[0]==='@'){                          // 낀 물건
    const slot = stSel.slice(1), n = (m.equip||{})[slot], it = n && ITEM_DB[n];
    if (!it) return '<div class="tx"><small>'+ITEM_TYPE_NAME[slot]+' 칸이 비어 있습니다 — 위에서 낄 물건을 고르세요.</small></div>';
    if ((slot==='weapon' || slot==='armor') && isParty(id)){         // 고정 장비 : 등급 · 강화 · 다음 단계
      const p = itemParse(n), cap = enhCap(p.grade), G = gradeNames();
      const next = p.excl ? (p.lv < cap ? '강화 +'+(p.lv+1)+'까지 올릴 수 있음' : '최대 강화')
                 : p.grade < PROMOTE.need.length ? (p.lv < PROMOTE.need[p.grade] ? '강화 +'+PROMOTE.need[p.grade]+' → '+G[p.grade+1]+' 승급 (승급석 '+PROMOTE.stone[p.grade]+')' : G[p.grade+1]+'(으)로 승급할 수 있음 (승급석 '+PROMOTE.stone[p.grade]+')')
                 : p.lv < CRAFT.needLv ? '강화 +'+CRAFT.needLv+' → 전용 장비 제작' : (exclFor(id, slot) ? '전용 장비 «'+exclFor(id, slot)+'» 제작 가능 ('+CRAFT.material[slot]+')' : '최대');
      return '<span class="dic'+gradeCls(n)+'">'+itemIcon(n)+'</span><div class="tx"><b class="'+gradeCls(n).trim()+'">'+n+'</b> <small class="ty">'+ITEM_TYPE_NAME[it.type]+' · '+G[p.grade]+' · 강화 +'+p.lv+' / '+cap+'</small>'+
             (it.stat ? '<div class="st">'+statText(it.stat)+'</div>' : '')+'<div class="diff">다음 : '+next+'</div><small>고정 장비 — 대장간에서 강화 · 승급 · 제작</small></div>';
    }
    return '<span class="dic'+gradeCls(n)+'">'+itemIcon(n)+'</span><div class="tx"><b class="'+gradeCls(n).trim()+'">'+n+'</b> <small class="ty">'+ITEM_TYPE_NAME[it.type]+(it.sub?' · '+it.sub:'')+' · 장착 중</small>'+
           (it.stat ? '<div class="st">'+statText(it.stat)+'</div>' : '')+'<small>'+(it.desc||'')+'</small></div><span class="mini" data-act="unequip" data-slot="'+slot+'">해제</span>';
  }
  if (!stSel){
    if (stSlot && !(m.equip||{})[stSlot]) return '<div class="tx"><small>'+ITEM_TYPE_NAME[stSlot]+' 칸이 비어 있습니다 — 초록 테 물건을 눌러 장착하세요.</small></div>';
    return '<div class="tx"><small>물건을 누르면 설명과 장착 · 복용 · 열기 버튼이 나옵니다. 초상화 옆 장비 칸을 누르면 그 칸에 낄 물건만 보여 줍니다.</small></div>';
  }
  const n = stSel, it = ITEM_DB[n] || {};
  let extra = '', btn = '';
  if (isEquip(n)){
    const block = equipBlock(n, id);
    if (block) extra = '<div class="no">장착 불가 — '+block+'</div>';
    else {
      const lv = st.level||1, tb = growthBonus(id), rl = memberRealm(id), md = statMods(id);
      const a = computeStats(lv, st.equip, tb, rl, md), b = computeStats(lv, Object.assign({}, st.equip, { [it.type]:n }), tb, rl, md);
      const diff = EQ_DIFF_KEYS.filter(([k])=> a[k]!==b[k]).map(([k,nm])=>{ const d = b[k]-a[k]; return '<span class="'+(d>0?'up':'down')+'">'+STAT_NAME[nm]+' '+a[k]+'→'+b[k]+'</span>'; }).join(' ');
      const prev = st.equip[it.type];
      extra = '<div class="diff">'+(prev ? '지금 '+prev+' · ' : '')+(diff || '변화 없음')+'</div>';
      btn = '<span class="mini go" data-act="equip">장착</span>';
    }
  } else if (elixirDef(n)){
    const E = elixirDef(n), k = elixirCount(st, n);
    extra = '<div class="diff">'+Object.keys(E.stat).map(x=>STAT_NAME[x]+' +'+E.stat[x]).join(' · ')+' (영구) · 복용 '+k+' / '+E.max+'</div>';
    if (k < E.max) btn = '<span class="mini go" data-act="eat">복용</span>';
    else extra += '<div class="no">더 먹을 수 없습니다</div>';
  } else if (typeof TREASURE_BOX !== 'undefined' && n===TREASURE_BOX.item){
    extra = '<div class="diff">강화석 '+boxStones()+'개 (꼭) + 하나</div>'; btn = '<span class="mini go" data-act="open-t">열기</span>';
  } else if (typeof GOLD_BOX !== 'undefined' && n===GOLD_BOX.item){
    extra = '<div class="diff">한 상자에 금 '+goldBoxRange().map(x=>x.toLocaleString()).join(' ~ ')+'</div>';
    btn = '<span class="mini go" data-act="open-g">열기</span>'+(PLAYER.inv[n] > 1 ? '<span class="mini" data-act="open-ga">모두 열기</span>' : '');
  } else if (it.type==='consumable') extra = '<div class="no">전투 중 명령 메뉴의 \'도구\'로 씁니다</div>';
  else if (it.type==='weapon' || it.type==='armor') extra = '<div class="no">무기 · 방어구는 인물마다 정해져 있음 — 잡화점에서 팔 수 있습니다</div>';
  else if (it.type==='material') extra = '<div class="no">대장간에서 씁니다'+(n===CRAFT.material.weapon || n===CRAFT.material.armor ? ' (전용 장비 제작)' : '')+'</div>';
  return '<span class="dic'+gradeCls(n)+'">'+itemIcon(n)+'</span><div class="tx"><b class="'+gradeCls(n).trim()+'">'+n+'</b> <small class="ty">'+(elixirDef(n) ? '영약' : (ITEM_TYPE_NAME[it.type]||''))+(it.sub?' · '+it.sub:'')+(isNamed(n)?' · 명품':'')+' · '+PLAYER.inv[n]+'개</small>'+
         (it.stat ? '<div class="st">'+statText(it.stat)+'</div>' : '')+(it.heal ? '<div class="st">체력 회복 +'+it.heal+'</div>' : '')+extra+'<small>'+(it.desc||'')+'</small></div><span class="btns">'+btn+'</span>';
}
function bindBagTab(m){
  const body = document.getElementById('sd-tabbody'), id = m.key, items = bagTabHtml.items || [];
  body.querySelectorAll('.chip').forEach(c=> c.onclick = ()=>{ stBagF = c.dataset.f; stSlot = EQUIP_SLOTS.some(([s])=> s===stBagF) ? stBagF : null; stSel = null; renderTab(); });
  body.querySelectorAll('.sbag-it').forEach(c=> c.onclick = ()=>{ stSel = items[+c.dataset.i]; renderTab(); });
  body.querySelectorAll('[data-act]').forEach(b=> b.onclick = ()=>{
    const act = b.dataset.act, n = stSel;
    if (act==='equip'){ const t = ITEM_DB[n].type; if (equipItem(n, id)){ stSel = '@'+t; stSlot = t; refreshStatus(); } }
    else if (act==='unequip'){ if (unequipSlot(b.dataset.slot, id)){ stSel = null; refreshStatus(); } }
    else if (act==='eat') askConfirm(m.name+josa(m.name,'이','가')+' '+n+josa(n,'을','를')+' 복용하시겠습니까?\n(최대 체력 · 내공이 영구히 오름)', ()=>{ eatElixir(id, n); refreshStatus(); }, null, '복용한다', '그만둔다');
    else if (act==='open-t') askOpenBox('treasure');
    else if (act==='open-g') askOpenBox('gold');
    else if (act==='open-ga') askConfirm(GOLD_BOX.item+' '+(PLAYER.inv[GOLD_BOX.item]||0)+'개를 모두 여시겠습니까?', openAllGoldBoxes, null, '모두 연다', '그만둔다');
  });
}
/* ---- 인연 : 이 인물이 맺은 (맺을) 인연 ---- */
function bondTabHtml(m){
  const list = bondList().filter(b=> b.members.includes(m.key));
  if (!list.length) return '<div class="sbag-empty">아직 맺은 인연이 없습니다.</div>';
  const when = b=> b.when==='deploy' ? (b.members.length > 2 ? b.members.length+'명 모두 출전' : '함께 출전') : '이웃하면';
  return '<div class="bond-note">인연은 이야기에서 맺어지고, 조건이 맞으면 전투에서 저절로 발동합니다.</div>' + list.map(b=>{
    const open = bondOpen(b), sc = open && SCENES[b.from];
    const faces = b.members.map(id=> open || id===m.key ? '<img src="'+faceOf(id)+'" alt="">' : '<span>?</span>').join('');
    return '<div class="bond'+(open?'':' lock')+'"><span class="faces">'+faces+'</span><div class="tx"><b>'+(open ? b.name : '???')+'</b>'+
           '<small>'+(open ? (sc.chapter||'')+' · '+(sc.place||'') : '아직 맺지 못한 인연')+'</small>'+(open ? '<span class="ef">'+b.text+'</span>' : '')+'</div>'+
           '<span class="when">'+(open ? when(b) : '잠김')+'</span></div>';
  }).join('');
}
// 영약 복용 (한 사람) — 배낭 창의 고르기 창과 상태보기의 '복용'이 함께 씀
function eatElixir(id, name){
  const E = elixirDef(name || (elixirList()[0] || {}).item), st = memberState(id); if (!st || !E) return false;
  const n = elixirCount(st, E.item); if (n >= E.max){ showToast(nameOf(id)+' — '+E.item+'은 더 먹을 수 없습니다'); return false; }
  if (!takeFromBag(E.item)) return false;
  st.elixir = st.elixir || {}; st.elixir[E.item] = n + 1; sfx('heal');
  showToast(nameOf(id) + josa(nameOf(id),'이','가') + ' ' + E.item + josa(E.item,'을','를') + ' 복용했습니다 — ' + Object.keys(E.stat).map(k=>STAT_NAME[k] + ' +' + E.stat[k]).join(' · '));
  renderBag(); return true;
}
// 열전 : 별호 · 특성 (능력치 보정) · 열전 글 (data/codex.js 의 BIOS)
function traitText(id){
  const nm = { hp:'체력', mp:'내공', atk:'공격', def:'방어', hit:'명중', eva:'회피' };
  if (id==='hero'){ const L = (typeof HERO_LOOKS !== 'undefined' && HERO_LOOKS[heroSex()]) || {};
    return Object.keys(L.stat||{}).map(k=> nm[k]+' +'+L.stat[k]).join(' · '); }
  const t = (UNITS[id] || {}).trait || {};
  return Object.keys(t.mult||{}).map(k=> nm[k]+' ×'+t.mult[k]).concat(Object.keys(t.add||{}).map(k=> nm[k]+' +'+t.add[k])).join(' · ');
}
function bioOf(id){ const b = (typeof BIOS !== 'undefined' && BIOS[id]) || null;      // from 장면을 지나기 전에는 숨김
  return b && (!b.from || (storyIdx(b.from) >= 0 && storyIdx(b.from) < codexPos())) ? b : null; }
document.querySelectorAll('.sd-tab').forEach(t=>t.addEventListener('click', ()=>{ stTab = t.dataset.tab; if (stTab!=='bag'){ stSlot = null; } renderTab(); }));
document.getElementById('sd-prev').addEventListener('click', ()=>openDetail(stIdx-1));
document.getElementById('sd-next').addEventListener('click', ()=>openDetail(stIdx+1));
document.getElementById('sd-list').addEventListener('click', openStatus);
document.getElementById('sd-close').addEventListener('click', ()=>{ document.getElementById('status-modal').style.display='none'; });
document.getElementById('st-close').addEventListener('click', ()=>{ document.getElementById('status-modal').style.display='none'; });
document.getElementById('btn-status').addEventListener('click', openStatus);


/* ================= 배낭 ================= */
let bagFilter = 'all', bagSel = null;
function bagItems(){
  return Object.keys(PLAYER.inv).filter(n=>PLAYER.inv[n]>0).filter(n=>{
    const t = (ITEM_DB[n]||{}).type;
    return bagFilter==='all' || (bagFilter==='equip' ? isEquip(n) : t===bagFilter);
  });
}
function openBag(){ clearNotices(); bagSel = null; closeEquipPick(); renderBag(); document.getElementById('bag-modal').style.display = 'flex'; }
function renderBag(){
  document.getElementById('bag-count').textContent = bagUsed()+'/'+BAG_SIZE;
  document.getElementById('bag-gold').textContent = PLAYER.gold.toLocaleString();
  document.getElementById('bag-sr').textContent = (PLAYER.suryeon||0).toLocaleString();
  document.querySelectorAll('.bag-tab').forEach(t=>t.classList.toggle('on', t.dataset.f===bagFilter));
  const items = bagItems();
  if (bagSel && !items.includes(bagSel)) bagSel = null;
  const grid = document.getElementById('bag-grid'); grid.innerHTML = '';
  const slots = bagFilter==='all' ? BAG_SIZE : Math.max(items.length, 10);
  for (let i=0;i<slots;i++){
    const n = items[i], d = document.createElement('div');
    if (n){
      const it = ITEM_DB[n] || { icon:'?', type:'' };
      d.className = 'bag-slot t-'+it.type + (bagSel===n ? ' sel' : '');
      d.innerHTML = itemIcon(n) + (PLAYER.inv[n]>1 ? '<span class="cnt">×'+PLAYER.inv[n]+'</span>' : '') + '<span class="nm'+gradeCls(n)+'">'+n+'</span>';
      d.onclick = ()=>{ bagSel = n; renderBag(); };
    } else d.className = 'bag-slot empty';
    grid.appendChild(d);
  }
  renderBagDetail();
}
function renderBagDetail(){
  const box = document.getElementById('bag-detail');
  if (!bagSel){ box.innerHTML = '<div class="bd-none">물건을 눌러<br>정보를 확인하세요</div>'; return; }
  const n = bagSel, it = ITEM_DB[n] || {};
  const curTxt = isEquip(n) ? PARTY.map(id=> nameOf(id)+' '+(memberState(id).equip[it.type]||'없음')).join(' · ') : '';
  box.innerHTML = '<div class="bd-top"><div class="bd-ic">'+itemIcon(n)+'</div><div><div class="bd-nm'+gradeCls(n)+'">'+n+'</div><div class="bd-ty">'+(elixirDef(n) ? '영약' : (ITEM_TYPE_NAME[it.type]||''))+(it.sub ? ' · '+it.sub : '')+(isNamed(n) ? ' · 명품' : isEquip(n) && !['accessory','treasure'].includes(it.type) ? ' · '+gradeNames()[itemParse(n).grade] : '')+' · 보유 '+PLAYER.inv[n]+'</div></div></div>'+
    (it.stat ? '<div class="bd-st">'+statText(it.stat)+'</div>' : '')+
    (it.heal ? '<div class="bd-st">체력 회복 +'+it.heal+'</div>' : '')+
    '<div class="bd-ds">'+(it.desc||'')+'</div>'+
    (typeof TREASURE_BOX !== 'undefined' && n===TREASURE_BOX.item ? '<div class="bd-cur">강화석 '+boxStones()+'개 (꼭) + 하나 : '+boxLoot().map(x=>x.item).join(' · ')+'</div>' : '')+
    (typeof GOLD_BOX !== 'undefined' && n===GOLD_BOX.item ? '<div class="bd-cur">나올 수 있는 것 : 한 상자에 금 '+goldBoxRange().map(x=>x.toLocaleString()).join(' ~ ')+'</div>' : '')+
    (isEquip(n) ? '<div class="bd-cur">현재 '+ITEM_TYPE_NAME[it.type]+' : '+curTxt+'</div>' : '')+
    '<div class="bd-pr">판매가 '+Math.floor(itemPrice(n)*SELL_RATE)+' 금</div>'+
    '<div class="bd-btns">'+
      (isEquip(n) && !['weapon','armor'].includes(it.type) ? '<div class="top-btn" id="bd-equip">장착하기</div>' : '')+
      (it.type==='consumable' ? '<div class="top-btn" id="bd-use">사용</div>' : '')+
      (elixirDef(n) ? '<div class="top-btn" id="bd-eat">복용</div>' : '')+
      (typeof TREASURE_BOX !== 'undefined' && n===TREASURE_BOX.item ? '<div class="top-btn" id="bd-open">열기</div>' : '')+
      (typeof GOLD_BOX !== 'undefined' && n===GOLD_BOX.item ? '<div class="top-btn" id="bd-open-gold">열기</div>'+(PLAYER.inv[n] > 1 ? '<div class="top-btn" id="bd-open-gold-all">모두 열기</div>' : '') : '')+
    '</div>';
  const eb = document.getElementById('bd-equip');  if (eb) eb.onclick = ()=> openEquipPick(n);
  const ub = document.getElementById('bd-use');   if (ub) ub.onclick = ()=> showToast('소모품은 전투 중 도구로 사용합니다 (준비 중)');
  const xb = document.getElementById('bd-eat');   if (xb) xb.onclick = ()=> openElixirPick(n);
  const ob = document.getElementById('bd-open');  if (ob) ob.onclick = ()=> askOpenBox('treasure');
  const og = document.getElementById('bd-open-gold'); if (og) og.onclick = ()=> askOpenBox('gold');
  const oa = document.getElementById('bd-open-gold-all'); if (oa) oa.onclick = ()=> askConfirm(GOLD_BOX.item+' '+(PLAYER.inv[GOLD_BOX.item]||0)+'개를 모두 여시겠습니까?', openAllGoldBoxes, null, '모두 연다', '그만둔다');
}
// 장착하기 → 아군 목록 (누구에게 낄지 고르기). 줄마다 지금 낀 물건과 바뀌는 능력치를 보여 줌
const EQ_DIFF_KEYS = [['maxHp','hp'], ['maxMp','mp'], ['atk','atk'], ['def','def'], ['hit','hit'], ['eva','eva']];
function openEquipPick(n){
  const it = ITEM_DB[n]; if (!it) return;
  const slot = ITEM_TYPE_NAME[it.type];
  document.getElementById('ep-title').innerHTML = n+' <small>'+slot+(it.stat ? ' · '+statText(it.stat) : '')+' — 장착할 아군을 고르세요</small>';
  const rows = document.getElementById('ep-rows'); rows.innerHTML = '';
  PARTY.forEach(id=>{
    const st = memberState(id); if (!st) return;
    const lv = st.level||1, prev = st.equip[it.type];
    const tb = growthBonus(id), rl = memberRealm(id), md = statMods(id), a = computeStats(lv, st.equip, tb, rl, md), b = computeStats(lv, Object.assign({}, st.equip, { [it.type]:n }), tb, rl, md);
    const diff = EQ_DIFF_KEYS.filter(([k])=>a[k]!==b[k]).map(([k,nm])=>{
      const d = b[k]-a[k];
      return '<div class="'+(d>0?'up':'down')+'">'+STAT_NAME[nm]+' '+a[k]+' → '+b[k]+' ('+(d>0?'+':'')+d+')</div>';
    }).join('');
    const same = prev === n, block = equipBlock(n, id);
    const row = document.createElement('div');
    row.className = 'ep-row' + (same || block ? ' same' : '');
    row.innerHTML = '<img src="'+faceOf(id)+'" alt="">'+
      '<div class="ep-info"><div class="ep-nm">'+nameOf(id)+'<span>Lv '+lv+' · '+memberRealm(id)+'</span></div>'+
      '<div class="ep-cur">현재 '+slot+' : '+(prev||'없음')+'</div></div>'+
      '<div class="ep-diff">'+(block ? '장착 불가 — '+block : same ? '이미 장착 중' : (diff || '변화 없음'))+'</div>';
    if (!same && !block) row.onclick = ()=>{ closeEquipPick(); if (equipItem(n, id)) renderBag(); };
    rows.appendChild(row);
  });
  document.getElementById('eq-pick').style.display = 'flex';
}
function closeEquipPick(){ document.getElementById('eq-pick').style.display = 'none'; }
document.getElementById('ep-cancel').addEventListener('click', closeEquipPick);
document.getElementById('eq-pick').addEventListener('click', e=>{ if (e.target.id==='eq-pick') closeEquipPick(); });
document.querySelectorAll('.bag-tab').forEach(t=>t.addEventListener('click', ()=>{ bagFilter = t.dataset.f; renderBag(); }));
document.getElementById('bag-close').addEventListener('click', ()=>{ document.getElementById('bag-modal').style.display='none'; });
document.getElementById('bag-to-status').addEventListener('click', ()=>{
  document.getElementById('bag-modal').style.display='none';
  openStatus(); stTab = 'bag'; openDetail(0);
});
// (출발 전 화면의 '배낭' 버튼은 없앰 — 배낭은 상태보기의 '배낭' 탭에서)

/* ================= NPC: 대장간 / 잡화점 ================= */
function itemPrice(name){ return (ITEM_DB[name] || { price:0 }).price; }
function isEquip(name){ const it = ITEM_DB[name]; return !!it && ['weapon','armor','accessory','treasure'].includes(it.type); }
// 무공 한 줄 설명 (mastery = 그 인물의 숙련 { power, guard, star } — 있으면 오른 값으로)
function skillText(d, ms){
  if (!d) return '';
  ms = ms || {};
  const star = ms.star > 1 ? ' · '+ms.star+'성' : '';
  if (d.area==='self') return '자신 · 다음 턴까지 방어 +'+(((d.guard||{}).def||0) + (ms.guard||0))+(d.selfHeal ? ' · 체력 '+Math.round(d.selfHeal*100)+'% 회복' : '')+' · 내공 '+d.mp+star;
  if (d.area==='ally') return ((d.range||1) > 1 ? d.range+'칸 안 자신 · 아군' : '자신 · 옆 아군')+' · 체력 '+Math.round(((d.heal||0) + (ms.heal||0))*100)+'% 회복 · 내공 '+d.mp+star;
  return d.desc+' · 거리 '+(d.minRange ? d.minRange+'~'+d.range : d.range)+' · 위력 공격×'+(+(d.power + (ms.power||0)).toFixed(2))+' · 내공 '+d.mp+star;
}
// 수련도 노드 효과 설명
function nodeEffectText(n){
  const out = [];
  if (n.stat) out.push(Object.keys(n.stat).map(k=>(k==='mp' ? '내공' : STAT_NAME[k])+' +'+n.stat[k]).join(' · '));
  const e = n.effect || {};
  if (e.mpRegen)    out.push('아군 턴마다 내공 +'+e.mpRegen);
  if (e.hpRegen)    out.push('아군 턴마다 체력 +'+e.hpRegen);
  if (e.counterPow) out.push('반격 위력 +'+Math.round(e.counterPow*100)+'%');
  if (e.dmgCut)     out.push('받는 피해 -'+Math.round(e.dmgCut*100)+'%');
  if (n.evo) out.push('무공 진화 「'+n.evo+'」 → 「'+n.skill+'」 · 숙련은 그대로 이어짐');
  if (n.type==='skill' && SKILLS[n.skill]) out.push(skillText(SKILLS[n.skill]));
  if (n.type==='master') out.push(n.skill+' '+(n.guard ? '방어 +'+n.guard : n.heal ? '회복 +'+Math.round(n.heal*100)+'%' : '위력 +'+n.power));
  return out.join(' · ');
}
function statText(stat){ return stat ? Object.keys(stat).map(k=>STAT_NAME[k]+' +'+stat[k]).join(' · ') : ''; }
function josa(word, a, b){ const c = word.charCodeAt(word.length-1); return (c>=0xAC00 && c<=0xD7A3 && (c-0xAC00)%28) ? a : b; }
function equipBonus(eq){
  const b = { atk:0, def:0, hit:0, eva:0, hp:0, mp:0 };
  if (eq) Object.values(eq).forEach(n=>{ const it = n && ITEM_DB[n]; if (it && it.stat) for (const k in it.stat) b[k] += it.stat[k]; });
  return b;
}
// 배낭 = PLAYER.inv (이름: 개수). 장착한 물건은 배낭에서 빠지고 그 인물의 equip 에 들어감
const PLAYER = { gold:START_GOLD, suryeon:0, trainCnt:{}, inv:{}, flags:{}, missions:{} };
// gold : 금 (잡화점 · 대장간) · suryeon : 수련치 (훈련장) · trainCnt : 이번 정비에 인물마다 해금한 수 · flags : 진행 표시 (예: hub = 거점 열림) · missions : 집무실 임무 상태
function bagUsed(){ return Object.keys(PLAYER.inv).filter(k=>PLAYER.inv[k]>0).length; }
function addToBag(name, n){
  n = n || 1;
  if (!PLAYER.inv[name] && bagUsed() >= BAG_SIZE) return false;
  PLAYER.inv[name] = (PLAYER.inv[name]||0) + n;
  if (typeof metaDex==='function' && metaDex(name) && typeof achCheck==='function') setTimeout(achCheck, 800);   // 보물 도감 (js/meta.js)
  return true;
}
function takeFromBag(name){
  if (!(PLAYER.inv[name] > 0)) return false;
  PLAYER.inv[name]--; if (!PLAYER.inv[name]) delete PLAYER.inv[name]; return true;
}
// 이 인물이 이 물건을 낄 수 있는지 — 못 끼면 이유를 돌려줌
function equipBlock(name, who){
  const it = ITEM_DB[name]; if (!it) return '';
  if ((it.type==='weapon' || it.type==='armor') && isParty(who || 'hero')) return '무기 · 방어구는 인물마다 정해져 있음 (대장간에서 강화 · 승급)';
  if (it.type!=='weapon') return '';
  const bow = who!=='hero' && (UNITS[who] || {}).weapon==='bow';
  if (it.kind==='bow' && !bow) return '활을 쓰는 인물만';
  if (it.kind!=='bow' && bow) return '활만 쓸 수 있음';
  return '';
}
// 물건 아이콘 : 그림(data/assets.js 의 item)이 있으면 그림, 없으면 글자
function itemIcon(name){
  const it = ITEM_DB[name] || {}, src = it.img ? asset('item.'+it.img) : '';
  return src ? '<img class="item-img" src="'+src+'" alt="">' : (it.icon || '?');
}
function equipItem(name, who){
  who = who || 'hero';
  const st = memberState(who), it = ITEM_DB[name];
  const block = equipBlock(name, who);
  if (block){ showToast(nameOf(who)+' : '+name+josa(name,'은','는')+' '+(block.indexOf('정해져')>=0 ? '낄 수 없습니다 — '+block : block==='활만 쓸 수 있음' ? '쓸 수 없습니다 (활만 쓸 수 있음)' : '활을 쓰는 인물만 장착할 수 있습니다')); return false; }
  if (!st || !isEquip(name) || !takeFromBag(name)) return false;
  const prev = st.equip[it.type];
  st.equip[it.type] = name;
  if (prev) addToBag(prev);
  showToast(nameOf(who)+' : '+name+josa(name,'을','를')+' 장착했습니다'+(prev ? ' ('+prev+' → 배낭)' : ''));
  return true;
}
function unequipSlot(slot, who){
  who = who || 'hero';
  const st = memberState(who), n = st && st.equip[slot]; if (!n) return false;
  if (slot==='weapon' || slot==='armor'){ showToast('무기 · 방어구는 인물마다 정해져 있어 뺄 수 없습니다'); return false; }
  if (!addToBag(n)){ showToast('배낭이 가득 찼습니다'); return false; }
  st.equip[slot] = null;
  showToast(nameOf(who)+' : '+n+josa(n,'을','를')+' 해제했습니다');
  return true;
}

const npcScreen = document.getElementById('npc-screen');
const npcMenu = document.getElementById('npc-menu');
const shopPanel = document.getElementById('shop-panel');
let curNpc = null, shopMode = 'buy';

function updateGold(){ document.getElementById('npc-gold-num').textContent = PLAYER.gold.toLocaleString(); }

function openNpc(key){
  clearNotices();
  curNpc = key; const n = NPCS[key];
  document.getElementById('npc-title').textContent = n.title;
  document.getElementById('npc-name').textContent = n.name;
  document.getElementById('npc-portrait').src = asset(n.img);
  document.getElementById('npc-line').textContent = n.line;
  updateGold();
  npcScreen.style.display = 'flex';
  showNpcMenu();   // 열리자마자 메뉴 표시
}
function closeNpc(){ npcScreen.style.display = 'none'; curNpc = null; }

function showNpcMenu(){
  if (!curNpc) return;
  const n = NPCS[curNpc];
  document.getElementById('npc-line').style.display = 'block';
  shopPanel.style.display = 'none';
  npcMenu.innerHTML = '';
  n.menu.forEach(label=>{
    const b = document.createElement('div');
    b.className = 'top-btn npc-act'; b.textContent = label;
    b.addEventListener('click', ()=>onNpcAction(label));
    npcMenu.appendChild(b);
  });
  const x = document.createElement('div');
  x.className = 'top-btn npc-act'; x.textContent = '나가기'; x.style.opacity = '.85';
  x.addEventListener('click', closeNpc);
  npcMenu.appendChild(x);
  npcMenu.style.display = 'flex';
}

function onNpcAction(label){
  if (label==='구매'){ openShop('buy'); }
  else if (label==='판매'){ openShop('sell'); }
  else if (label==='강화'){ openShop('enh'); }
  else if (label==='승급'){ openShop('prom'); }
  else if (label==='제작'){ openShop('craft'); }
  else { showToast(label + ' 기능은 준비 중입니다'); }
}

function openShop(mode){
  shopMode = mode;
  npcMenu.style.display = 'none';
  document.getElementById('npc-line').style.display = 'none';
  shopPanel.style.display = 'flex';
  renderShop();
}
function renderShop(){
  const forge = shopMode==='enh' || shopMode==='prom' || shopMode==='craft';
  document.getElementById('shop-tabs').style.display = forge ? 'none' : '';
  shopPanel.classList.toggle('enh', forge);
  if (forge){ renderForge(shopMode); return; }
  document.getElementById('tab-buy').classList.toggle('on', shopMode==='buy');
  document.getElementById('tab-sell').classList.toggle('on', shopMode==='sell');
  const list = document.getElementById('shop-list'); list.innerHTML = '';
  if (shopMode==='buy'){
    shopStock().forEach(name=>{
      const it = ITEM_DB[name];
      list.appendChild(makeRow(name, it.desc, it.price + ' 금', '구매', ()=>buyItem(name)));
    });
  } else {
    const names = Object.keys(PLAYER.inv).filter(k=>PLAYER.inv[k]>0);
    if (!names.length){ list.innerHTML = '<div class="shop-empty">팔 수 있는 물건이 없습니다</div>'; }
    names.forEach(name=>{
      const price = Math.floor(itemPrice(name) * SELL_RATE);
      list.appendChild(makeRow(name, '보유 ' + PLAYER.inv[name] + '개', price + ' 금', '판매', ()=>sellItem(name)));
    });
  }
  updateGold();
}
// 잡화점에서 파는 것 : 장마다 (data/items.js 의 SHOP_STOCK — 모자라면 마지막 것)
function shopStock(){ const S = typeof SHOP_STOCK !== 'undefined' ? SHOP_STOCK : [['금창약','해독제']]; return S[Math.min(S.length, Math.max(1, chapterNo((SCENES[curScene] || {}).chapter))) - 1].filter(n=> ITEM_DB[n]); }
function makeRow(name, sub, price, btnLabel, onClick){
  const r = document.createElement('div'); r.className = 'shop-row';
  r.innerHTML = '<div class="sh-ic">' + itemIcon(name) + '</div><div class="nm">' + name + '<small>' + sub + '</small></div><div class="pr">' + price + '</div>';
  const b = document.createElement('div'); b.className = 'top-btn'; b.textContent = btnLabel;
  b.addEventListener('click', onClick); r.appendChild(b);
  return r;
}
function buyItem(name){
  const p = ITEM_DB[name].price;
  if (PLAYER.gold < p){ showToast('금이 부족합니다'); return; }
  if (!addToBag(name)){ showToast('배낭이 가득 찼습니다'); return; }
  PLAYER.gold -= p;
  showToast(name + ' 구매 (-' + p + ' 금)'); renderShop();
}
function sellItem(name){
  if (!(PLAYER.inv[name] > 0)) return;
  const p = Math.floor(itemPrice(name) * SELL_RATE);
  takeFromBag(name); PLAYER.gold += p;
  showToast(name + ' 판매 (+' + p + ' 금)'); renderShop();
}

/* ================= 대장간 강화 · 승급 · 제작 (data/items.js 의 ENHANCE · PROMOTE · CRAFT) =================
   물건 이름 = [등급 ]원래 이름[ +강화]   예) 철검 · 철검 +3 · 희귀 철검 +3 · 보구 가죽갑옷
   (흔함은 붙이지 않음) 물건 사전에는 처음 쓸 때 자동으로 등록 (원래 물건 + 등급 · 강화 능력치) */
function gradeNames(){ return (typeof PROMOTE !== 'undefined' && PROMOTE.names) || ['흔함']; }
const EXCL_GRADE = 4;                                    // 전용 장비의 등급 (PROMOTE.names 의 '전용')
function itemParse(name){
  const s = String(name||''), m0 = s.match(/^(.+?)(?: \+(\d+))?$/);
  if (m0 && ITEM_DB[m0[1]] && ITEM_DB[m0[1]].excl) return { base:m0[1], grade:EXCL_GRADE, lv:m0[2] ? +m0[2] : 0, excl:true };   // 전용 : 이름이 따로
  const G = gradeNames().slice(1).concat(['일반']).join('|');                                   // '일반' = 예전 이름 (지금 상급)
  const m = s.match(new RegExp('^(?:(' + G + ') )?(.+?)(?: \\+(\\d+))?$'));
  if (!m) return { base:name, grade:0, lv:0 };
  return { base:m[2], grade:m[1] ? (m[1]==='일반' ? 1 : gradeNames().indexOf(m[1])) : 0, lv:m[3] ? +m[3] : 0 };
}
function itemName(base, grade, lv){ const ex = ITEM_DB[base] && ITEM_DB[base].excl; return (grade > 0 && !ex ? gradeNames()[grade] + ' ' : '') + base + (lv > 0 ? ' +' + lv : ''); }
// 능력치 = 원래 능력치 × (등급 배수 + 강화 단계 × perLevel) — 전용은 원래 장비(from) 기준
function itemStatOf(base, grade, lv){
  const b = ITEM_DB[base] || {}, src = b.excl ? (ITEM_DB[b.from] || {}).stat : b.stat, G = (PROMOTE.statMult || [1])[grade] || 1, o = {};
  for (const k in (src||{})){ const v = src[k]; o[k] = Math.round(v * G) + Math.max(1, Math.round(Math.abs(v) * (ENHANCE.perLevel||0.25))) * (lv||0); }
  return o;
}
function enhCap(grade){ return (ENHANCE.cap || [])[grade] != null ? ENHANCE.cap[grade] : (ENHANCE.max || 7); }
// 전용 장비 : 능력치 · 등급을 미리 채워 둠
Object.keys(ITEM_DB).forEach(k=>{ const b = ITEM_DB[k]; if (b.excl){ b.grade = EXCL_GRADE; if (!b.stat) b.stat = itemStatOf(k, EXCL_GRADE, 0); } });
function ensureItem(name){
  if (!name || ITEM_DB[name]) return ITEM_DB[name] || null;
  const p = itemParse(name), b = ITEM_DB[p.base]; if (!b || (!p.lv && !p.grade)) return null;
  const mul = b.excl ? 1 : (PROMOTE.statMult || [1])[p.grade] || 1;
  ITEM_DB[name] = Object.assign({}, b, { stat:itemStatOf(p.base, p.grade, p.lv), price:Math.round(b.price * mul * (1 + 0.5 * p.lv)), base:p.base, grade:p.grade, enh:p.lv,
    desc:(b.desc||'') + ' (' + gradeNames()[p.grade] + (p.lv ? ' · 강화 +' + p.lv : '') + ')' });
  return ITEM_DB[name];
}
function ensureSavedItems(){
  Object.keys(PLAYER.inv || {}).forEach(ensureItem);
  [HERO.equip].concat(Object.keys(MEMBERS).map(id=>MEMBERS[id].equip)).forEach(eq=>{ if (eq) Object.values(eq).forEach(n=>{ if (n) ensureItem(n); }); });
}
function isNamed(name){ const p = itemParse(name), b = ITEM_DB[p.base] || ITEM_DB[name]; return !!(b && b.named); }   // 명품 (data/items.js 의 named)
function gradeCls(name){ const g = itemParse(name).grade; return (g ? ' grade-' + g : '') + (isNamed(name) ? ' named' : ''); }
function enhCost(lv){ return { stone:ENHANCE.stone[lv]||0, gold:ENHANCE.gold[lv]||0 }; }   // lv → lv+1
function promCost(g){ return { stone:PROMOTE.stone[g]||0, gold:PROMOTE.gold[g]||0 }; }      // g → g+1
function costText(c, stone){ return stone + ' ' + c.stone + '<br>금 ' + c.gold.toLocaleString(); }
function canPay(c, stone){ return (PLAYER.inv[stone]||0) >= c.stone && PLAYER.gold >= c.gold; }

/* ---------- 고정 장비 : 인물마다 정해진 무기 · 방어구 (data/units.js 의 gear · 주인공은 HERO_DEFAULT.gear) ---------- */
function fixedGear(id){ return (id==='hero' ? HERO_DEFAULT.gear : (UNITS[id] || {}).gear) || null; }
function equipFixedGear(id, grade){
  const st = memberState(id), G = fixedGear(id); if (!st || !G) return;
  st.equip = Object.assign(emptyEquip(), st.equip || {});
  ['weapon','armor'].forEach(sl=>{ if (G[sl] && !st.equip[sl]){ const n = itemName(G[sl], grade || 0, 0); ensureItem(n); st.equip[sl] = n; } });
}
// 등급 규칙에 맞춤 : 예전 이름('일반') → 새 이름, 그 등급의 최대 강화를 넘은 단계는 잘라 내고 강화석을 돌려줌
function normalizeGear(name, acc){            // acc 를 주면 돌려줄 강화석을 거기에 더함 (안 주면 바로 배낭에)
  const p = itemParse(name), b = ITEM_DB[p.base];
  if (!b || (b.type!=='weapon' && b.type!=='armor')) return name;
  const cap = enhCap(p.grade); let lv = p.lv, refund = 0;
  while (lv > cap){ lv--; refund += ENHANCE.stone[lv] || 0; }
  if (refund){ if (acc) acc.stone += refund; else PLAYER.inv['강화석'] = (PLAYER.inv['강화석'] || 0) + refund; }
  const n = itemName(p.base, p.grade, lv); ensureItem(n); return n;
}
function normalizeBagGear(){
  const old = PLAYER.inv || {}, inv = {}; let stone = 0;
  Object.keys(old).forEach(n=>{ const a = { stone:0 }, k = normalizeGear(n, a), c = old[n]; inv[k] = (inv[k] || 0) + c; stone += a.stone * c; });
  if (stone) inv['강화석'] = (inv['강화석'] || 0) + stone;
  PLAYER.inv = inv;
}
// 예전 저장 : 무기 · 방어구 칸을 그 인물의 고정 장비로 (다른 장비였으면 그 등급 · 강화를 옮김) · 보검(간장 · 막야 · 태아검)은 보물 칸으로
function fixFixedGear(id){
  const st = memberState(id), G = fixedGear(id); if (!st || !G) return;
  st.equip = Object.assign(emptyEquip(), st.equip || {});
  ['weapon','armor'].forEach(sl=>{
    const cur = st.equip[sl];
    if (cur){
      const p = itemParse(cur), b = ITEM_DB[p.base];
      if (b && b.type==='treasure'){ if (!st.equip.treasure) st.equip.treasure = cur; else addToBag(cur); st.equip[sl] = null; }
      else if (b && (p.base===G[sl] || (b.excl && b.owner===id))) st.equip[sl] = normalizeGear(cur);
      else st.equip[sl] = normalizeGear(itemName(G[sl], Math.min(p.grade, EXCL_GRADE - 1), p.lv));
    }
  });
  equipFixedGear(id, (UNITS[id] || {}).gearGrade || 0);
}
// 대장간에 올릴 수 있는 물건 : 아군의 고정 무기 · 방어구
function enhTargets(){
  const out = [];
  PARTY.forEach(id=>{ const eq = (memberState(id) || {}).equip || {}; ['weapon','armor'].forEach(sl=>{ const n = eq[sl]; if (n && (ITEM_DB[n] || ensureItem(n))) out.push({ name:n, owner:id, slot:sl }); }); });
  return out;
}
function exclFor(owner, slot){ return Object.keys(ITEM_DB).find(k=> ITEM_DB[k].excl && ITEM_DB[k].owner===owner && ITEM_DB[k].type===slot) || null; }
// 강화 · 승급 · 제작 화면 (mode = 'enh' | 'prom' | 'craft')
function renderForge(mode){
  const list = document.getElementById('shop-list'); list.innerHTML = '';
  const stone = mode==='enh' ? '강화석' : mode==='prom' ? '승급석' : null;
  const head = document.createElement('div'); head.className = 'enh-head';
  const G = gradeNames();
  head.innerHTML = '보유 · ' + (stone ? '<b>' + itemIcon(stone) + ' ' + stone + ' ' + (PLAYER.inv[stone]||0) + '</b> · '
                                     : '<b>현철 ' + (PLAYER.inv['현철']||0) + '</b> · <b>천잠사 ' + (PLAYER.inv['천잠사']||0) + '</b> · ') + '<b>금 ' + PLAYER.gold.toLocaleString() + '</b>' +
    '<small>' + (mode==='enh' ? '등급마다 최대 강화 — ' + G.map((g,i)=> g + ' +' + enhCap(i)).join(' · ')
               : mode==='prom' ? PROMOTE.need.map((nd,g)=> G[g] + ' +' + nd + '→' + G[g+1] + ' (석 ' + PROMOTE.stone[g] + ')').join(' · ') + ' · 승급하면 강화 0단계부터'
               : G[CRAFT.needGrade] + ' +' + CRAFT.needLv + ' + 재료 (무기 ' + CRAFT.material.weapon + ' · 방어구 ' + CRAFT.material.armor + ') + 금 ' + CRAFT.gold.toLocaleString() + ' → 전용 장비 (강화 +' + enhCap(EXCL_GRADE) + '까지)') + '</small>';
  list.appendChild(head);
  enhTargets().forEach(t=>{
    const p = itemParse(t.name), it = ITEM_DB[t.name] || ensureItem(t.name) || {}, cap = enhCap(p.grade);
    let nx = null, c = null, label = '', why = '', costHtml = '';
    if (mode==='enh'){
      if (p.lv >= cap) why = '최대 (+' + cap + ')';
      else { nx = itemStatOf(p.base, p.grade, p.lv + 1); c = enhCost(p.lv); label = '강화'; }
    } else if (mode==='prom'){
      if (p.excl || p.grade >= PROMOTE.need.length) why = p.excl ? '전용 장비' : '보구 — 제작으로';
      else if (p.lv < PROMOTE.need[p.grade]) why = '강화 +' + PROMOTE.need[p.grade] + ' 필요';
      else { nx = itemStatOf(p.base, p.grade + 1, 0); c = promCost(p.grade); label = '승급'; }
    } else {
      const ex = exclFor(t.owner, t.slot), mat = CRAFT.material[t.slot];
      if (p.excl) why = '전용 장비';
      else if (!ex) why = '전용 장비 없음';
      else if (p.grade < CRAFT.needGrade || p.lv < CRAFT.needLv) why = G[CRAFT.needGrade] + ' +' + CRAFT.needLv + ' 필요';
      else { nx = ITEM_DB[ex].stat; c = { stone:1, gold:CRAFT.gold }; label = '제작'; t.excl = ex; t.mat = mat; }
      if (ex) t.exName = ex;
    }
    const where = nameOf(t.owner) + ' · ' + ITEM_TYPE_NAME[t.slot];
    const gTxt = p.excl ? '전용' : G[p.grade] + ' +' + p.lv + '/' + cap;
    const stTxt = Object.keys(it.stat || {}).map(k=> STAT_NAME[k] + ' ' + it.stat[k] + (nx && nx[k] != null ? '→' + nx[k] : '')).join(' · ');
    const sub = where + ' · ' + gTxt + (mode==='prom' && nx ? ' → ' + G[p.grade+1] + ' +0' : '') + (mode==='craft' && t.exName ? ' → ' + t.exName : '') + ' · ' + stTxt;
    costHtml = c ? (mode==='craft' ? t.mat + ' 1<br>금 ' + c.gold.toLocaleString() : costText(c, stone)) : why;
    const row = makeRow(t.name, sub, costHtml, c ? label : (mode==='enh' && why ? '최대' : '—'), ()=> doForge(t, mode));
    row.classList.add('enh');
    const nm = row.querySelector('.nm'); if (nm) nm.className += gradeCls(t.name);
    const btn = row.querySelector('.top-btn');
    const pay = c && (mode==='craft' ? (PLAYER.inv[t.mat]||0) >= 1 && PLAYER.gold >= c.gold : canPay(c, stone));
    if (!c || !pay) btn.classList.add('off');
    list.appendChild(row);
  });
  updateGold();
}
function renderEnhance(){ renderForge('enh'); }
function doForge(t, mode){
  const p = itemParse(t.name), st = memberState(t.owner); if (!st) return;
  let nn = null;
  if (mode==='enh'){
    if (p.lv >= enhCap(p.grade)) return;
    const c = enhCost(p.lv);
    if ((PLAYER.inv['강화석']||0) < c.stone){ showToast('강화석이 부족합니다 (필요 ' + c.stone + ')'); return; }
    if (PLAYER.gold < c.gold){ showToast('금이 부족합니다 (필요 ' + c.gold.toLocaleString() + ')'); return; }
    for (let i=0;i<c.stone;i++) takeFromBag('강화석'); PLAYER.gold -= c.gold;
    nn = itemName(p.base, p.grade, p.lv + 1);
  } else if (mode==='prom'){
    if (p.excl || p.grade >= PROMOTE.need.length) return;
    if (p.lv < PROMOTE.need[p.grade]){ showToast('먼저 강화 +' + PROMOTE.need[p.grade] + '까지 올리세요'); return; }
    const c = promCost(p.grade);
    if ((PLAYER.inv['승급석']||0) < c.stone){ showToast('승급석이 부족합니다 (필요 ' + c.stone + ')'); return; }
    if (PLAYER.gold < c.gold){ showToast('금이 부족합니다 (필요 ' + c.gold.toLocaleString() + ')'); return; }
    for (let i=0;i<c.stone;i++) takeFromBag('승급석'); PLAYER.gold -= c.gold;
    nn = itemName(p.base, p.grade + 1, 0);
  } else {
    const ex = exclFor(t.owner, t.slot), mat = CRAFT.material[t.slot];
    if (!ex || p.excl || p.grade < CRAFT.needGrade || p.lv < CRAFT.needLv) return;
    if (!(PLAYER.inv[mat] > 0)){ showToast(mat + '이 필요합니다'); return; }
    if (PLAYER.gold < CRAFT.gold){ showToast('금이 부족합니다 (필요 ' + CRAFT.gold.toLocaleString() + ')'); return; }
    takeFromBag(mat); PLAYER.gold -= CRAFT.gold;
    nn = ex;
  }
  ensureItem(nn); st.equip[t.slot] = nn;
  sfx('levelup'); showToast(nameOf(t.owner) + ' — ' + t.name + ' → ' + nn + (mode==='enh' ? ' 강화 성공!' : mode==='prom' ? ' 승급 성공! (강화 0단계부터)' : ' 제작 완료!'));
  renderForge(mode);
}

/* ================= 영약 (data/items.js 의 ELIXIRS — 초급 · 중급) — 배낭에서 복용 → 고른 인물의 최대 체력 · 내공 영구 증가 ================= */
function openElixirPick(name){
  const E = elixirDef(name) || elixirList()[0], slot = Object.keys(E.stat).map(k=>STAT_NAME[k] + ' +' + E.stat[k]).join(' · ');
  document.getElementById('ep-title').innerHTML = E.item + ' <small>' + slot + ' (영구) — 복용할 아군을 고르세요 · 인물마다 ' + E.max + '개까지</small>';
  const rows = document.getElementById('ep-rows'); rows.innerHTML = '';
  PARTY.forEach(id=>{
    const st = memberState(id); if (!st) return;
    const n = elixirCount(st, E.item), full = n >= E.max, v = memberView(id);
    const row = document.createElement('div'); row.className = 'ep-row' + (full ? ' same' : '');
    row.innerHTML = '<img src="' + faceOf(id) + '" alt="">' +
      '<div class="ep-info"><div class="ep-nm">' + nameOf(id) + '<span>Lv ' + (st.level||1) + ' · ' + memberRealm(id) + '</span></div>' +
      '<div class="ep-cur">복용한 ' + E.item + ' ' + n + ' / ' + E.max + '</div></div>' +
      '<div class="ep-diff">' + (full ? '더 먹을 수 없음' : '<div class="up">체력 ' + v.maxHp + ' → ' + (v.maxHp + (E.stat.hp||0)) + '</div><div class="up">내공 ' + v.maxMp + ' → ' + (v.maxMp + (E.stat.mp||0)) + '</div>') + '</div>';
    if (!full) row.onclick = ()=>{ closeEquipPick(); eatElixir(id, E.item); };
    rows.appendChild(row);
  });
  document.getElementById('eq-pick').style.display = 'flex';
}

/* ================= 자동 저장 =================
   - 이야기 장면이 시작될 때 · 장면이 끝난 화면 · 전투의 아군 턴이 시작될 때 (아무도 움직이기 전) 자동으로 한 칸에 저장
   - 시작 화면 '이야기 이어하기' / 불러오기 창 맨 위 '자동 저장' 으로 이어서 할 수 있음
   - 서버 저장에 로그인했으면 장면 단위 자동 저장은 서버에도 올라감 (전투 중 자동 저장은 다음에 맞출 때) */
const AUTO_KEY = 'ganghorok_autosave_v1';
let memAuto = null;
function readAuto(){ try{ const s = JSON.parse(localStorage.getItem(AUTO_KEY) || 'null'); return s || memAuto; }catch(e){ return memAuto; } }
function writeAuto(s, fromCloud){
  memAuto = s;
  try{ localStorage.setItem(AUTO_KEY, JSON.stringify(s)); }catch(e){}
  if (!fromCloud && typeof cloudSaveAuto === 'function') cloudSaveAuto(s);
  refreshContinue();
}
function autoSave(kind){
  if (!SCENES[curScene] || document.getElementById('title-screen').style.display === 'block') return;
  const keep = saveCtx;
  saveCtx = kind==='battle' ? { battle:true } : { scene:curScene, pos:kind };
  try{ const s = makeSnapshot(); s.auto = true; writeAuto(s); }catch(e){}
  saveCtx = keep;
}
// 전투 : 아군 턴이 시작되고 대화 · 연출이 끝나면 (아무도 움직이기 전) 자동 저장. 처음 전투면 조작 안내
function battleCheckpoint(){
  const ph = bState.phase; let tries = 0;
  (function wait(){
    if (!bState || bState.over || bState.phase !== ph || tries++ > 60) return;
    const ready = bState.turn==='ally' && !bState.intro && !bState.busy && !bState.moving && document.getElementById('battle-screen').style.display==='block';
    if (!ready){ setTimeout(wait, 400); return; }
    if (aliveOf('ally').every(u=>!u.moved && !u.acted)) autoSave('battle');
    if (!tipSeen('battle')) setTimeout(()=>{ if (!bState.over) showTips('battle'); }, 600);
  })();
}
function refreshContinue(){
  const a = readAuto(), b = document.getElementById('t-continue'); if (!b) return;
  b.style.display = a ? '' : 'none';
  b.innerHTML = a ? '이어하기<small>' + a.chapter + ' · ' + a.place + playTag(a) + '</small>' : '이어하기';
}
/* ---------- 플레이 시간 — 게임 화면이 보이는 동안만 셈 (시작 화면 · 다른 앱으로 나가 있는 동안은 빼고). 저장에 같이 남음 ---------- */
function fmtPlay(ms){ const m = Math.floor((ms||0) / 60000); return Math.floor(m/60) + ':' + String(m%60).padStart(2,'0'); }
function playTag(sv){ const ms = sv && sv.player && sv.player.playMs; return ms ? ' · 플레이 ' + fmtPlay(ms) : ''; }
(function playClock(){
  let last = Date.now();
  setInterval(()=>{
    const now = Date.now(), dt = Math.min(now - last, 10000); last = now;        // 기기가 잠들었다 깨어나도 크게 뛰지 않게
    const ts = document.getElementById('title-screen');
    if (document.visibilityState === 'visible' && !(ts && ts.style.display !== 'none' && !ts.classList.contains('leaving'))) PLAYER.playMs = (PLAYER.playMs||0) + dt;
  }, 5000);
})();
function renderAutoRow(){
  const box = document.getElementById('sv-auto'), a = readAuto();
  if (!a || svMode!=='load'){ box.innerHTML = ''; box.style.display = 'none'; return; }
  const face = asset('face.' + (a.hero.look==='f' ? 'hero_f' : 'hero_m'));
  box.style.display = '';
  box.innerHTML = '<div class="sv-slot auto"><span class="sv-no">자동</span><img class="sv-face" src="' + face + '">' +
    '<div class="sv-main">' + heroNameOf(a.hero.look, a.hero.name) + ' Lv' + (a.hero.level||1) + ' · ' + a.hero.job + ' ' + (a.hero.realm || realmOfLevel(a.hero.level||1)) +
    '<small>' + a.chapter + ' · ' + a.place + (a.pos==='battle' ? ' · 전투 중' : '') + ' · 금 ' + Number(a.player.gold).toLocaleString() + playTag(a) + '</small></div>' +
    '<span class="sv-time">' + fmtTime(a.time) + '</span></div>';
  box.firstChild.onclick = ()=> askConfirm('자동 저장으로 이어서 하시겠습니까?', ()=>{ saveCtx = null; closeSaveModal(); applySnapshot(a); showToast('자동 저장 불러오기 완료'); });
}

/* ================= 조작 안내 (처음 하는 사람용) ================= */
const TIPS_KEY = 'ganghorok_tips_v1';
let memTips = {};
const TIPS = {
  battle: [
    { t:'아군 움직이기', d:'파란 테두리의 아군을 누르면 갈 수 있는 칸이 밝게 보입니다. 가고 싶은 칸을 누르면 이동합니다.<br>제자리에서 행동하려면 아군을 누른 뒤 메뉴를 고르면 됩니다.' },
    { t:'행동 메뉴', d:'<b>공격</b> 바로 옆 적(활은 한 칸 띄운 적) · <b>무공</b> 내공을 써서 강한 공격 · <b>도구</b> 금창약 등 · <b>대기</b> 행동 끝<br>메뉴가 이동할 파란 칸을 가리면 반투명해집니다. 버튼 가운데 글자를 누르면 버튼, 그 밖의 반투명한 곳을 누르면 그 아래 칸으로 이동합니다.' },
    { t:'반격', d:'공격이나 무공을 맞고 살아남은 상대는 사거리가 닿으면 한 번 되받아칩니다.<br>멀리서 쏘는 활 · 원거리 무공은 근접 적의 반격을 받지 않습니다.' },
    { t:'정보 보기', d:'적을 누르면 정보 창(체력 · 내공 · 공격 · 방어 · 이동 · 무공)이, 빈 칸을 누르면 지형(이동 소모)이 보입니다. 다시 누르면 닫힙니다.<br>오른쪽 위 <b>확대</b> 버튼으로 지도를 크게 볼 수 있습니다.' },
    { t:'턴 넘기기 · 저장', d:'모두 행동하면 자동으로 적 턴이 됩니다. 일찍 넘기려면 <b>턴 종료</b>.<br>아군 턴이 시작될 때마다 <b>자동 저장</b>되고, ⚙ 설정에서 직접 저장할 수도 있습니다.' },
  ],
  hub: [
    { t:'거점', d:'<b>집무실</b> 전투마다 걸린 임무를 받습니다 · <b>표국</b> 의뢰 다섯 중 골라 행렬을 보내면 다음 이야기가 끝날 때 물건을 가져옵니다<br>' +
              '<b>훈련장</b> 수련치로 능력 · 무공을 익힙니다 · <b>잡화점</b> 사고팔기 · <b>대장간</b> 무기 · 방어구 강화 · 승급 · 전용 제작<br>! 표시가 있는 곳에 할 일이 있습니다.' },
  ],
};
function tipStore(){ try{ return JSON.parse(localStorage.getItem(TIPS_KEY) || '{}'); }catch(e){ return memTips; } }
function tipSeen(k){ return !!tipStore()[k]; }
function markTip(k){ const s = tipStore(); s[k] = 1; memTips = s; try{ localStorage.setItem(TIPS_KEY, JSON.stringify(s)); }catch(e){} }
function resetTips(){ memTips = {}; try{ localStorage.removeItem(TIPS_KEY); }catch(e){} }
let tipK = null, tipI = 0;
function showTips(k){
  if (!TIPS[k]) return;
  tipK = k; tipI = 0; markTip(k); renderTip();
  document.getElementById('tip-modal').style.display = 'flex';
}
function renderTip(){
  const L = TIPS[tipK], c = L[tipI];
  document.getElementById('tip-title').textContent = '조작 안내 · ' + c.t;
  document.getElementById('tip-page').textContent = L.length > 1 ? (tipI+1) + ' / ' + L.length : '';
  document.getElementById('tip-body').innerHTML = c.d;
  document.getElementById('tip-next').textContent = tipI < L.length-1 ? '다음' : '확인';
  document.getElementById('tip-skip').style.display = tipI < L.length-1 ? '' : 'none';
}
function closeTips(){ document.getElementById('tip-modal').style.display = 'none'; tipK = null; }
document.getElementById('tip-next').addEventListener('click', ()=>{ if (tipK && tipI < TIPS[tipK].length-1){ tipI++; renderTip(); } else closeTips(); });
document.getElementById('tip-skip').addEventListener('click', closeTips);

/* ================= 훈련장 : 수련도 (data/training.js) ================= */
// 화면 배치 (가로 1000 × 세로 500 기준) : 가운데 초상화, 큰 원 세 개, 큰 원 둘레의 호를 따라 노드
const TREE_CENTER = [500, 300];
const TREE_LAYOUT = {
  nei: { hub:[500,150], rx:255, ry:105, a0:200, a1:340 },   // 내력 : 위쪽
  atk: { hub:[300,330], rx:205, ry:140, a0:252, a1:146 },   // 공격 : 왼쪽
  def: { hub:[700,330], rx:205, ry:140, a0:288, a1:394 },   // 방어 : 오른쪽
};
const STAT_ICON = { atk:'攻', def:'防', hit:'命', eva:'避', hp:'體', mp:'氣' };
let trWho = 'hero', trSel = null, trJust = null;
function treeLayout(id){
  const pos = {}, nodes = treeNodes(id);
  Object.keys(TREE_LAYOUT).forEach(br=>{
    const L = TREE_LAYOUT[br], list = nodes.filter(n=>n.branch===br);
    list.forEach((n,i)=>{
      if (n.pos){ pos[n.id] = n.pos; return; }
      const t = list.length===1 ? 0.5 : i/(list.length-1), a = (L.a0 + (L.a1-L.a0)*t) * Math.PI/180;
      pos[n.id] = [L.hub[0] + L.rx*Math.cos(a), L.hub[1] + L.ry*Math.sin(a)];
    });
  });
  return pos;
}
// 'on' 해금 / 'avail' 해금 가능 / 'lvlock' 앞은 열렸지만 레벨 부족 / 'locked' 앞 노드가 아직
function nodeState(id, n){
  const on = treeUnlocked(id);
  if (on.includes(n.id)) return 'on';
  const p = treeParent(id, n);
  if (p && !on.includes(p)) return 'locked';
  return ((memberState(id).level||1) < n.level) ? 'lvlock' : 'avail';
}
function nodeIcon(n){
  if (n.evo) return '進';
  if (n.type==='skill' || n.type==='master') return '武';
  if (n.type==='passive') return '心';
  return STAT_ICON[Object.keys(n.stat||{})[0]] || '修';
}
function nodeShort(n){ return n.evo ? '진화' : n.type==='master' ? (n.name.split(' ').pop()) : Object.values(n.stat||{}).map(v=>'+'+v).join(' '); }
const TYPE_NAME = { stat:'능력치', skill:'무공', passive:'심법', master:'무공 숙련' };
function openTraining(){
  if (!isParty(trWho)) trWho = 'hero';
  trSel = undefined;
  document.getElementById('train-modal').style.display = 'flex';
  renderTraining();
}
function sizeTree(){
  const wrap = document.getElementById('tr-tree-wrap'), t = document.getElementById('tr-tree');
  const w = Math.max(240, Math.min(wrap.clientWidth - 6, (wrap.clientHeight - 6) * 2));
  t.style.width = w+'px'; t.style.height = (w/2)+'px'; t.style.setProperty('--u', (w/1000)+'px');
}
function renderTraining(){
  if (!isParty(trWho)) trWho = 'hero';
  document.getElementById('tr-gold').textContent = (PLAYER.suryeon||0).toLocaleString();
  // 인물 고르기
  const mem = document.getElementById('tr-members'); mem.innerHTML = '';
  PARTY.forEach(id=>{
    const m = memberView(id), d = document.createElement('div');
    d.className = 'tr-mem' + (id===trWho ? ' on' : '');
    d.innerHTML = '<img src="'+m.face+'">'+m.name+'<small>Lv '+m.level+' · <em class="'+(trainLeft(id)?'':'no')+'">'+trainUsed(id)+'/'+TRAIN_PER_BREAK+'</em></small>';
    d.onclick = ()=>{ trWho = id; trSel = undefined; renderTraining(); };
    mem.appendChild(d);
  });
  sizeTree();
  const tree = document.getElementById('tr-tree');
  tree.querySelectorAll('.tp,.th,.tn').forEach(e=>e.remove());
  const nodes = treeNodes(trWho), pos = treeLayout(trWho), on = treeUnlocked(trWho), m = memberView(trWho);
  const asc = ascendInfo(trWho);
  if (trSel === undefined || (trSel && !nodes.some(n=>n.id===trSel))){       // 처음엔 해금 가능한 노드를, 판을 다 채웠으면 경지 상승 화면을
    const first = nodes.find(n=>nodeState(trWho,n)==='avail') || nodes.find(n=>nodeState(trWho,n)==='lvlock');
    trSel = (first && !asc.full) ? first.id : null;
  }
  document.getElementById('tr-board').innerHTML = '<b>'+memberRealm(trWho)+'</b> 수련도 · '+asc.done+' / '+asc.total+
    (asc.max ? ' · 최고 경지' : ' <small>→ '+asc.to+' (Lv '+asc.need+')</small>');
  const at = (x,y)=> 'left:'+(x/10)+'%;top:'+(y/5)+'%';
  // 선
  let lines = '';
  Object.keys(TREE_LAYOUT).forEach(br=>{
    const h = TREE_LAYOUT[br].hub, c = (TREE_BRANCHES[br]||{}).color || '#888';
    lines += '<line x1="'+TREE_CENTER[0]+'" y1="'+TREE_CENTER[1]+'" x2="'+h[0]+'" y2="'+h[1]+'" stroke="'+c+'" stroke-width="6" stroke-opacity=".6"/>';
  });
  nodes.forEach(n=>{
    const p = treeParent(trWho, n), a = p ? pos[p] : TREE_LAYOUT[n.branch].hub, b = pos[n.id]; if (!a || !b) return;
    const lit = on.includes(n.id), c = TREE_BRANCHES[n.branch].color;
    lines += '<line x1="'+a[0]+'" y1="'+a[1]+'" x2="'+b[0]+'" y2="'+b[1]+'" stroke="'+(lit ? c : '#6b5c40')+'" stroke-width="'+(lit ? 6 : 3)+'"'+
             (lit ? '' : ' stroke-dasharray="9 8" stroke-opacity=".8"')+'/>';
  });
  document.getElementById('tr-lines').innerHTML = lines;
  // 가운데 초상화
  const pt = document.createElement('div'); pt.className = 'tp'+(asc.ok ? ' ready' : '')+(trSel===null ? ' sel' : '');
  pt.style.cssText = at(TREE_CENTER[0], TREE_CENTER[1]);
  pt.innerHTML = '<img src="'+m.face+'"><span>'+m.name+' · Lv '+m.level+' · '+memberRealm(trWho)+'</span>'+(asc.ok ? '<i class="tp-up">경지 상승</i>' : '');
  pt.onclick = ()=>{ trSel = null; renderTraining(); };                      // 초상화 = 경지 상승 화면
  tree.appendChild(pt);
  // 큰 원
  Object.keys(TREE_LAYOUT).forEach(br=>{
    const B = TREE_BRANCHES[br], h = TREE_LAYOUT[br].hub, list = nodes.filter(n=>n.branch===br);
    const d = document.createElement('div'); d.className = 'th'; d.style.cssText = at(h[0], h[1])+';--c:'+B.color;
    d.innerHTML = '<b>'+B.name+'</b><small>'+list.filter(n=>on.includes(n.id)).length+' / '+list.length+'</small>';
    tree.appendChild(d);
  });
  // 노드
  nodes.forEach(n=>{
    const st = nodeState(trWho, n), p = pos[n.id], d = document.createElement('div');
    d.className = 'tn '+st+' t-'+n.type+(trSel===n.id ? ' sel' : '')+(trJust===n.id ? ' just' : '');
    d.style.cssText = at(p[0], p[1])+';--c:'+TREE_BRANCHES[n.branch].color;
    d.innerHTML = '<i>'+nodeIcon(n)+'</i>'+((n.type==='stat' || n.type==='master' || n.evo) ? '<em>'+nodeShort(n)+'</em>' : '');
    d.title = n.name;
    d.onclick = ()=>{ trSel = n.id; trJust = null; renderTraining(); };
    tree.appendChild(d);
  });
  trJust = null;
  renderTreeInfo();
}
function renderTreeInfo(){
  const box = document.getElementById('tr-info'), id = trWho, n = treeNode(id, trSel);
  const on = treeUnlocked(id), all = treeNodes(id);
  const ms = treeMastery(id);
  const sk = memberSkills(id).map(s=> s + (ms[s] && ms[s].star > 1 ? ' '+ms[s].star+'성' : ''));
  // 심법 : 지난 경지에서 익힌 것까지 (같은 심법의 윗 경지 노드는 하나로)
  const pas = Array.from(new Set(unlockedNodes(id).filter(x=>x.type==='passive').map(x=>{ const base = treeBase(id).find(b=>b.id===x.id.replace(/^r\d+:/,'')); return base ? base.name : x.name; }).concat((memberState(id)||{}).simbeop || [])));
  const done = all.filter(x=>on.includes(x.id)).length;
  const sum = '<div class="ti-sum">'+memberRealm(id)+' 수련도 <b>'+done+' / '+all.length+'</b><br>무공 : <b>'+(sk.join(', ') || '없음')+'</b><br>심법 : <b>'+(pas.join(', ') || '없음')+'</b></div>';
  if (!n){                                                                    // 경지 상승 화면
    const a = ascendInfo(id); box.style.setProperty('--c', '#ffd88a');
    if (a.max){ box.innerHTML = '<div class="ti-top"><div class="ti-ic">境</div><div><div class="ti-nm">'+memberRealm(id)+'</div><div class="ti-ty">최고 경지</div></div></div>'+
                  '<div class="ti-rq">더 오를 경지가 없습니다. 남은 노드를 채워 능력을 다듬으세요.</div>'+sum; return; }
    box.innerHTML = '<div class="ti-top"><div class="ti-ic">境</div><div><div class="ti-nm">경지 상승</div><div class="ti-ty">'+a.from+' → <b>'+a.to+'</b></div></div></div>'+
      '<div class="ti-rq">수련도 : <span class="'+(a.full?'ok':'no')+'">'+a.done+' / '+a.total+(a.full?' ✓':'')+'</span><br>'+
      '필요 레벨 : <span class="'+(a.lvOk?'ok':'no')+'">Lv '+a.need+(a.lvOk?' ✓':' (지금 Lv '+a.level+')')+'</span></div>'+
      '<div class="ti-ef">'+(a.ok ? a.to+' 경지에 오를 수 있습니다. 명중 · 회피가 오르고 '+a.to+' 수련도가 열립니다.'
                              : (a.full ? 'Lv '+a.need+'이 되면 오를 수 있습니다.' : '이 판의 노드를 모두 해금하고 Lv '+a.need+'이 되면 오를 수 있습니다.'))+'</div>'+
      '<div class="ti-btn"><div class="top-btn'+(a.ok?' asc':' off')+'" id="ti-ascend">'+a.to+'(으)로 오르기</div></div>'+sum;
    document.getElementById('ti-ascend').onclick = ()=> doAscend(id);
    return;
  }
  const B = TREE_BRANCHES[n.branch], st = nodeState(id, n), lv = memberState(id).level || 1;
  const pid = treeParent(id, n), parent = pid ? treeNode(id, pid) : null;
  box.style.setProperty('--c', B.color);
  const rq = '<div class="ti-rq">'+
    (parent ? '앞 노드 : <span class="'+(on.includes(pid)?'ok':'no')+'">'+parent.name+(on.includes(pid)?' ✓':'')+'</span><br>' : '')+
    '필요 레벨 : <span class="'+(lv>=n.level?'ok':'no')+'">Lv '+n.level+(lv>=n.level?' ✓':' (지금 Lv '+lv+')')+'</span><br>'+
    '비용 : <span class="'+((PLAYER.suryeon||0)>=n.cost?'ok':'no')+'">수련치 '+n.cost.toLocaleString()+'</span><br>'+
    '이번 정비 : <span class="'+(trainLeft(id)?'ok':'no')+'">'+trainUsed(id)+' / '+TRAIN_PER_BREAK+'회'+(trainLeft(id)?'':' (다음 전투 뒤 다시 채워짐)')+'</span></div>';
  let btn;
  if (st==='on') btn = '<div class="ti-done">해금 완료</div>';
  else btn = '<div class="top-btn'+(st==='avail' && (PLAYER.suryeon||0)>=n.cost && trainLeft(id) ? '' : ' off')+'" id="ti-unlock">해금 · 수련치 '+n.cost.toLocaleString()+'</div>';
  box.innerHTML = '<div class="ti-top"><div class="ti-ic t-'+n.type+'">'+nodeIcon(n)+'</div>'+
                  '<div><div class="ti-nm">'+n.name+'</div><div class="ti-ty"><b>'+B.name+'</b> · '+TYPE_NAME[n.type]+'</div></div></div>'+
                  '<div class="ti-ef">'+nodeEffectText(n)+'</div>'+rq+'<div class="ti-btn">'+btn+'</div>'+sum;
  const ub = document.getElementById('ti-unlock'); if (ub) ub.onclick = ()=> unlockNode(id, n);
}
function doAscend(id){
  const a = ascendInfo(id);
  if (!a.ok){ showToast(a.full ? 'Lv '+a.need+' 이상이어야 오를 수 있습니다' : '수련도를 모두 채워야 오를 수 있습니다'); return; }
  const lv0 = memberState(id).level;
  ascendRealm(id);
  sfx('levelup');
  const fx = document.getElementById('tr-asc'), lv1 = memberState(id).level;
  fx.innerHTML = '<span>'+nameOf(id)+'</span><b>'+a.to+'</b><small>경지에 올랐습니다'+(lv1>lv0 ? ' · Lv '+lv1 : '')+'</small>';
  fx.classList.remove('on'); void fx.offsetWidth; fx.classList.add('on');
  setTimeout(()=> fx.classList.remove('on'), 2200);
  if (id==='hero'){ const c = catchUpMembers(); if (c.length) setTimeout(()=> showToast(c.map(nameOf).join(' · ')+' — 뒤처진 동료가 '+memberRealm(c[0])+' 경지까지 따라왔습니다'), 2300); }
  trSel = undefined; renderTraining();
}
// 이번 정비(전투와 전투 사이)에 이 인물이 해금한 수 / 더 할 수 있는지
function trainUsed(id){ return (PLAYER.trainCnt || {})[id] || 0; }
function trainLeft(id){ return trainUsed(id) < TRAIN_PER_BREAK; }
function unlockNode(id, n){
  const st = memberState(id), state = nodeState(id, n);
  if (state==='on') return;
  if (state==='locked'){ showToast('앞 노드를 먼저 해금하세요'); return; }
  if (state==='lvlock'){ showToast('Lv '+n.level+' 이상이어야 해금할 수 있습니다'); return; }
  if (!trainLeft(id)){ showToast('이번 정비에는 '+nameOf(id)+josa(nameOf(id),'이','가')+' 더 수련할 수 없습니다 ('+TRAIN_PER_BREAK+'/'+TRAIN_PER_BREAK+') — 전투 뒤 다시 채워집니다'); return; }
  if ((PLAYER.suryeon||0) < n.cost){ showToast('수련치가 부족합니다 (필요 '+n.cost.toLocaleString()+')'); return; }
  PLAYER.suryeon -= n.cost; st.tree = (st.tree || []).concat([n.id]);
  PLAYER.trainCnt = PLAYER.trainCnt || {}; PLAYER.trainCnt[id] = trainUsed(id) + 1;
  sfx(n.type==='stat' ? 'heal' : 'levelup');
  showToast(nameOf(id)+' : '+(n.evo ? '「'+n.evo+'」 → 「'+n.skill+'」 무공이 진화했습니다' : n.name+(n.type==='skill' ? ' — 무공을 익혔습니다' : n.type==='passive' ? ' — 심법을 깨우쳤습니다' : ' 해금')));
  if (n.type==='skill' && typeof artsAfterLearn==='function') artsAfterLearn(id, n.skill);
  trJust = n.id;
  const next = treeNodes(id).find(x=>treeParent(id, x)===n.id && nodeState(id, x)!=='on');   // 다음 노드로 넘어가 둠
  trSel = boardDone(id) ? null : (next ? next.id : n.id);                    // 판을 다 채우면 경지 상승 화면
  if (boardDone(id)) setTimeout(()=> showToast(memberRealm(id)+' 수련도를 모두 채웠습니다'+(ascendInfo(id).ok ? ' — 경지 상승!' : '')), 300);
  renderTraining();
}
document.getElementById('tr-close').addEventListener('click', ()=>{ document.getElementById('train-modal').style.display = 'none'; });
document.getElementById('hub-train').addEventListener('click', openTraining);
window.addEventListener('resize', ()=>{ if (document.getElementById('train-modal').style.display==='flex') renderTraining(); });

document.querySelectorAll('.hub-btn[data-npc]').forEach(b=>{
  b.addEventListener('click', ()=> openNpc(b.dataset.npc));
});
document.getElementById('tab-buy').addEventListener('click', ()=>{ shopMode='buy'; renderShop(); });
document.getElementById('tab-sell').addEventListener('click', ()=>{ shopMode='sell'; renderShop(); });
document.getElementById('shop-back').addEventListener('click', showNpcMenu);

/* ================= 전투 씬 ================= */
// 지금 전투의 지도 (loadMap 으로 바뀜)
let MAP = null, B_TILE = 60, B_COLS = 20, B_ROWS = 20, STAGE_W = 1200, STAGE_H = 1200;
let bTileAt = {};
let curBattleId = null, curBattle = null;

function terrainOf(x,y){ return bTileAt[x+','+y] || '초원'; }
function terrainData(x,y){ const t=terrainOf(x,y); return TERRAIN_DATA[t] || TERRAIN_DATA['초원']; }

const bStage = document.getElementById('b-stage');
const bGridEl = document.getElementById('b-grid');
const bScaler = document.getElementById('b-scaler');
function loadMap(no){
  MAP = MAPS[no];
  if (!MAP){ alert('지도 '+no+' 를 찾을 수 없습니다 (data/maps.js)'); return false; }
  B_TILE = MAP.tile_size; B_COLS = MAP.width; B_ROWS = MAP.height;
  STAGE_W = B_COLS*B_TILE; STAGE_H = B_ROWS*B_TILE;
  bTileAt = {}; MAP.tiles.forEach(t=> bTileAt[t.x+','+t.y] = t.terrain);
  [bStage, bScaler].forEach(el=>{ el.style.width = STAGE_W+'px'; el.style.height = STAGE_H+'px'; });
  bStage.style.backgroundImage = cssUrl(asset('map.'+no));
  buildGrid();
  return true;
}

/* ---- 카메라: 확대 모드(기본, 아군 중심) / 전체 보기 ---- */
const BS = document.getElementById('battle-screen');
const cam = { zoom:true, s:1, cx:STAGE_W/2, cy:STAGE_H/2 };
function viewSize(){ return [BS.clientWidth || window.innerWidth, BS.clientHeight || window.innerHeight]; }
function fitScale(){ const [W,H]=viewSize(); return Math.min(W/STAGE_W, H/STAGE_H)*0.96; }
function zoomScale(){ const [W,H]=viewSize(); const tile = Math.min(H/8, W/11, 84); return Math.max(tile/B_TILE, fitScale()*1.4); }
function applyCam(animate){
  const [W,H] = viewSize();
  const s = cam.zoom ? zoomScale() : fitScale(); cam.s = s;
  const sw = STAGE_W*s, sh = STAGE_H*s;
  let tx, ty;
  if (sw<=W) tx = (W-sw)/2; else { tx = Math.min(0, Math.max(W-sw, W/2 - cam.cx*s)); cam.cx = (W/2 - tx)/s; }
  if (sh<=H) ty = (H-sh)/2; else { ty = Math.min(0, Math.max(H-sh, H/2 - cam.cy*s)); cam.cy = (H/2 - ty)/s; }
  bScaler.style.transition = animate ? 'transform .3s ease' : 'none';
  bScaler.style.transform = 'translate('+tx+'px,'+ty+'px) scale('+s+')';
}
function camTo(u, animate){
  cam.cx = (u.x-0.5)*B_TILE; cam.cy = (u.y-0.5)*B_TILE;
  if (cam.zoom) applyCam(animate!==false);
}
function fitBStage(){ applyCam(false); }
function setZoom(on){
  cam.zoom = on;
  document.getElementById('b-zoom').textContent = on ? '🔍 확대 켜짐' : '🔍 확대 꺼짐';
  if (on && units.hero) { cam.cx=(units.hero.x-0.5)*B_TILE; cam.cy=(units.hero.y-0.5)*B_TILE; }
  applyCam(true);
}
document.getElementById('b-zoom').addEventListener('click', ()=> setZoom(!cam.zoom));

// 확대 모드에서 드래그로 화면 이동 (짧은 터치/클릭은 그대로 클릭으로 처리)
let bDrag = null, bDragMoved = false;
BS.addEventListener('pointerdown', e=>{
  bDragMoved = false;
  if (!cam.zoom || e.target.closest('.bhud')) return;
  bDrag = { x:e.clientX, y:e.clientY, cx:cam.cx, cy:cam.cy };
});
window.addEventListener('pointermove', e=>{
  if (!bDrag) return;
  const dx = e.clientX-bDrag.x, dy = e.clientY-bDrag.y;
  if (!bDragMoved && Math.hypot(dx,dy) < 8) return;
  bDragMoved = true;
  cam.cx = bDrag.cx - dx/cam.s; cam.cy = bDrag.cy - dy/cam.s;
  applyCam(false);
});
window.addEventListener('pointerup', ()=>{ bDrag = null; });
window.addEventListener('pointercancel', ()=>{ bDrag = null; });
BS.addEventListener('click', e=>{ if (bDragMoved){ e.stopPropagation(); e.preventDefault(); bDragMoved=false; } }, true);
window.addEventListener('resize', ()=>{ if(document.getElementById('battle-screen').style.display==='block') fitBStage(); });

const bCells = {};
function buildGrid(){
  bGridEl.innerHTML = '';
  Object.keys(bCells).forEach(k=> delete bCells[k]);
  for (let y=1;y<=B_ROWS;y++) for (let x=1;x<=B_COLS;x++){
    const c = document.createElement('div');
    c.className = 'cell';
    c.style.left = ((x-1)*B_TILE)+'px'; c.style.top = ((y-1)*B_TILE)+'px';
    c.dataset.x = x; c.dataset.y = y;
    c.addEventListener('click', ()=>onCellClick(x,y));
    bGridEl.appendChild(c);
    bCells[x+','+y] = c;
  }
}


let units = {};
// 유닛 능력치 = 레벨(data/growth.js) + 장비
function crowdMods(u, mods){ return (u && u.side==='enemy' && u.crowd > 1) ? mods.concat([{ mult:{ hp:u.crowd } }]) : mods; }
function applyUnitStats(cfg){
  if (cfg.side==='enemy' && !cfg.prog) cfg.prog = HERO.level || 1;          // 적 경지 보정은 적 레벨이 아니라 주인공 레벨(진행도)로 — 제1장의 Lv45 사파 간부 같은 고정 레벨 적은 예전 그대로
  Object.assign(cfg, computeStats(cfg.level||1, cfg.equip, cfg.treeBonus, cfg.realmFixed, crowdMods(cfg, statMods(cfg.id, cfg.rank, cfg.side, undefined, cfg.prog || cfg.level))));
  cfg.hp = cfg.maxHp; cfg.mp = cfg.maxMp;
  return cfg;
}
function aliveOf(side){ return Object.values(units).filter(u=>u.side===side && u.hp>0); }
function unitAt(x,y,side){ return Object.values(units).find(u=>u.hp>0 && u.x===x && u.y===y && (!side || u.side===side)); }
function adjacentFoes(u){ return aliveOf(u.side==='ally'?'enemy':'ally').filter(o=>manhattan(u,o)<=1); }
// 일반 공격 거리 : minRange ~ range (근접 = 1~1, 활 = 2~2 → 붙은 적은 못 쏨)
function inAttackRange(u, o){ const d = manhattan(u,o); return d >= (u.minRange||1) && d <= (u.range||1); }
function attackTargets(u){ return aliveOf(u.side==='ally'?'enemy':'ally').filter(o=>inAttackRange(u,o)); }
// 공격 사거리 표시 : 닿는 칸 전체(옅게) + 칠 수 있는 적(진하게)
function showAttackZone(u){
  clearHi();
  for (let y=1;y<=B_ROWS;y++) for (let x=1;x<=B_COLS;x++){
    const d = Math.abs(x-u.x)+Math.abs(y-u.y);
    if (d >= (u.minRange||1) && d <= (u.range||1) && bCells[x+','+y]) bCells[x+','+y].classList.add('atk-zone');
  }
  attackTargets(u).forEach(f=>{ const k=f.x+','+f.y; if (bCells[k]) bCells[k].classList.add('atk-range'); });
  if (typeof artsMarks==='function') artsMarks(u);                               // 상성 ▲▼
}
let bState = { turn:'ally', turnCount:1, selected:null, moveMode:false, attackMode:false, moving:false, over:false };
let bLastPrev = {}, bLastStart = '';
let terrainInfoKey = null;

function makeUnit(cfg){
  applyUnitStats(cfg);
  // acted 가 바뀌면 토큰도 바로 회색으로 (조종하는 아군 · 우군만)
  let _acted = !!cfg.acted;
  Object.defineProperty(cfg, 'acted', { configurable:true, enumerable:true,
    get(){ return _acted; },
    set(v){ _acted = !!v; if (cfg.el) cfg.el.classList.toggle('acted', _acted && cfg.side==='ally' && !cfg.noControl); } });
  const el = document.createElement('div');
  el.className = 'token' + (cfg.side==='enemy' ? ' enemy' : '') + (cfg.friend ? ' friend' : '');
  const showExp = cfg.side==='ally' && !cfg.friend;
  el.innerHTML = '<div class="hpwrap"><div class="hpfill" style="width:100%"></div></div>'+
                 (showExp ? '<div class="expwrap"><div class="expfill" style="width:0"></div></div>' : '')+
                 '<div class="ring"><img src="'+cfg.faceSrc+'"></div>'+(typeof artsTokenBadge==='function' ? artsTokenBadge(cfg) : '')+
                 '<div class="tname">'+cfg.name+'</div>';
  el.addEventListener('click', (e)=>{ e.stopPropagation(); onUnitClick(cfg); });
  bStage.appendChild(el);
  cfg.el = el;
  positionToken(cfg);
  return cfg;
}
function positionToken(u){
  u.el.style.left = ((u.x-1)*B_TILE)+'px';
  u.el.style.top = ((u.y-1)*B_TILE)+'px';
  u.el.querySelector('.hpfill').style.width = Math.max(0,u.hp/u.maxHp*100)+'%';
  const ef = u.el.querySelector('.expfill'); if (ef) ef.style.width = ((u.exp||0)/EXP_MAX*100)+'%';
}

// 전투 중 대사 — who: 유닛 이름표 ('hero', 'guo', 'e1' ...). 카메라가 말하는 유닛을 비춤
let bdIdx = 0, bdTyping = false, bdTimer = null, bdLines = [], bdDone = null;
function runBattleDialog(lines, done){
  lines = (lines || []).filter(sexOk);
  if (!lines.length){ if (done) done(); return; }
  bState.intro = true; bdLines = lines; bdDone = done; bdIdx = 0;
  document.getElementById('b-end-turn').classList.add('hidden');
  document.getElementById('bd-box').style.display = 'flex';
  showBdLine(0);
}
function startBattleIntro(){
  runBattleDialog(curBattle.intro, ()=>{
    bState.intro = false;
    document.getElementById('b-end-turn').classList.remove('hidden');
    const lead = units.hero || aliveOf('ally')[0]; if (lead && cam.zoom) camTo(lead);
    showBanner('전투 개시');
    setTimeout(()=>showBanner('아군 턴'), 1200);
    const bs = bondSummary(); if (bs) setTimeout(()=> toast(bs, 2600), 2300);
    battleCheckpoint();
  });
}
function showBdLine(i){
  const L = bdLines[i], u = units[L.who];
  const face = document.getElementById('bd-face');
  face.src = u ? u.el.querySelector('img').src : faceOf(L.who);   // 전장에 없는 인물 (승리 뒤 나타난 궁주 등) 도 얼굴을 보여 줌
  face.className = u ? (u.side==='enemy' ? 'enemy' : (u.friend ? 'friend' : '')) : '';
  document.getElementById('bd-name').textContent = L.name || (u ? u.name : nameOf(L.who));
  if (u && cam.zoom) camTo(u);
  if (u){ u.el.classList.add('selected'); Object.values(units).forEach(o=>{ if(o!==u) o.el.classList.remove('selected'); }); }
  const t = document.getElementById('bd-text');
  t.textContent = '';
  bdPages = dlgPages(lineText(L), t, dlgWidth(t), dlgRows('battle')); bdPage = 0;
  showBdPage();
}
let bdPages = [''], bdPage = 0;
function showBdPage(){
  const nx = document.getElementById('bd-next');
  nx.style.visibility = 'hidden'; bdTyping = true; clearInterval(bdTimer);
  bdTimer = typeText(document.getElementById('bd-text'), bdPages[bdPage], 35, ()=>{ bdTyping = false; nx.style.visibility = 'visible'; });
}
document.getElementById('bd-box').addEventListener('click', ()=>{
  if (bdTyping){ clearInterval(bdTimer); document.getElementById('bd-text').textContent = bdPages[bdPage]; bdTyping=false; document.getElementById('bd-next').style.visibility='visible'; return; }
  if (bdPage < bdPages.length - 1){ bdPage++; showBdPage(); return; }   // 긴 대사 : 다음 창
  bdIdx++;
  if (bdIdx < bdLines.length){ showBdLine(bdIdx); return; }
  document.getElementById('bd-box').style.display = 'none';
  Object.values(units).forEach(o=>o.el.classList.remove('selected'));
  const done = bdDone; bdDone = null;
  if (done) done();
});

// 전투 시작 (data/battles.js 의 이름표)
let battleStartSave = null;    // 다시하기 할 때 되돌릴 상태 (배낭 · 금 · 레벨 · 경험치)
function startBattle(id){
  curBattleId = id; curBattle = BATTLES[id];
  if (!loadMap(curBattle.map)) return;
  battleStartSave = JSON.stringify({ inv:PLAYER.inv, gold:PLAYER.gold, hero:{ level:HERO.level, exp:HERO.exp, realm:HERO.realm }, members:MEMBERS });
  playBgm('battle');
  resetBattle(true);
}
function restoreBattleStart(){
  if (!battleStartSave) return;
  const b = JSON.parse(battleStartSave);
  PLAYER.inv = b.inv; PLAYER.gold = b.gold; Object.assign(HERO, b.hero); MEMBERS = b.members;
}
// 전투 배치의 레벨 : 숫자 그대로, 또는 'hero+1' / 'hero-2' 처럼 주인공 레벨 기준
function resolveLevel(v, fallback){
  if (typeof v === 'number') return Math.max(1, Math.min(MAX_LEVEL, v));
  const m = /^hero\s*([+-]\s*\d+)?$/.exec(String(v||'').trim());
  if (m) return Math.max(1, Math.min(MAX_LEVEL, (HERO.level||1) + (m[1] ? parseInt(m[1].replace(/\s/g,''), 10) : 0)));
  return fallback;
}
// 배치에 적은 덮어쓰기 : name · skills · passive(심법 { mpRegen }) · focus(먼저 노리는 인물 id 목록)
function placeOverrides(p){ const o = {}; ['name','skills','passive','focus','rank'].forEach(k=>{ if (p && p[k] !== undefined) o[k] = p[k]; }); return o; }
let battleCrowd = 0;                 // 이번 전투에서 기준보다 많이 데려간 인원 (적 체력 보정)
function addEnemy(e, key){
  const d = UNITS[e.id], ov = placeOverrides(e);
  units[key] = makeUnit({ key, id:e.id, x:e.x, y:e.y, side:'enemy', name:ov.name || d.name, job:d.job,
                          level:Math.max(resolveLevel(e.level, d.level), e.minLevel||0), move:d.move, range:d.range, minRange:d.minRange, hold:e.hold, holdRange:e.holdRange,
                          skills:(ov.skills || d.skills || []).slice(), passive:ov.passive || d.passive || null, focus:ov.focus || d.focus || null,
                          rank:ov.rank || d.rank || null, ov, faceSrc:faceOf(e.id), crowd:crowdMult(battleCrowd, ov.rank || d.rank || null) });
  return units[key];
}
// 아군(합류 인물 · 주인공) 또는 우군 유닛 만들기
function makeAlly(id, x, y, extra){
  const d = UNITS[id] || {};
  let cfg;
  if (isParty(id)){
    const st = memberState(id), src = id==='hero' ? HERO : d;
    cfg = { key:id, id, x, y, side:'ally', name:nameOf(id), job:src.job, title:src.title,
            level:st.level, exp:st.exp, move:(src.move||4) + attrMove(id), skillPow:attrSkillPowOf(attrOf(id)), range:src.range, minRange:src.minRange, skills:memberSkills(id), equip:st.equip,
            treeBonus:growthBonus(id), passive:treeEffects(id), mastery:treeMastery(id), realmFixed:memberRealm(id), faceSrc:faceOf(id) };
  } else {
    cfg = { key:id, id, x, y, side:'ally', friend:true, name:d.name, job:d.job,
            level:resolveLevel(d.level, 1), move:d.move, range:d.range, minRange:d.minRange, skills:(d.skills||[]).slice(), passive:d.passive || null, faceSrc:faceOf(id) };
  }
  return makeUnit(Object.assign(cfg, extra || {}));
}
function newBattleState(o){
  const prevPhase = (bState && bState.phase) || 0; clearTimeout(bState && bState.endTimer);
  bState = Object.assign({ turn:'ally', turnCount:1, selected:null, moveMode:false, attackMode:false, moving:false, over:false, phase:prevPhase+1, endTimer:null,
                           expBy:{}, fired:[], enemySeq:curBattle.enemies.length, mission:{} }, o || {});
  // 고른 인물 (selected) 이 바뀔 때마다 위 가운데 전투 정보창을 반투명 / 원래대로
  let sel = bState.selected || null;
  Object.defineProperty(bState, 'selected', { configurable:true, enumerable:true, get(){ return sel; }, set(v){ sel = v || null; syncHudGhost(); } });
  syncHudGhost();
}
// 인물을 고른 동안 (이동 · 공격 · 무공 대상 고르기) 전투 정보창은 반투명 + 눌러도 아래 칸이 눌림. 선택이 풀리면 (행동 끝 · 취소) 원래대로
function syncHudGhost(){ const h = document.getElementById('hud-top'); if (h) h.classList.toggle('ghost', !!(bState && bState.selected)); }
function battleHudReset(){
  document.getElementById('b-turn').textContent = bState.turnCount;
  document.getElementById('b-turn-max').textContent = curBattle.turnLimit;
  document.getElementById('b-goal').textContent = bState.goalText || curBattle.goal || '';
  renderMissionHud();
  document.getElementById('b-turn-name').textContent = '아군 턴';
  document.getElementById('b-end-turn').classList.remove('hidden');
  document.getElementById('b-result').style.display = 'none';
  document.getElementById('b-summary').style.display = 'none';
  clearHi(); hideTerrainInfo(); closeMenu(false);
  clearInterval(bdTimer); document.getElementById('bd-box').style.display = 'none';
}
function resetBattle(withIntro){
  Object.values(units).forEach(u=>{ if(u.el) u.el.remove(); });
  units = {};
  curBattle.allies.forEach(a=>{
    const d = UNITS[a.id] || {};
    if (a.id!=='hero' && d.party && !a.friend && !isParty(a.id)) joinParty(a.id, true);     // 이야기를 건너뛴 저장 등 (friend:true = 합류 전이라 우군으로)
    let key = a.key || a.id, n = 2; while (units[key]) key = a.id+'_'+(n++);    // 같은 인물이 여럿이면 cheolgeom_2 …
    const extra = isParty(a.id) ? null : Object.assign({ key }, a.level ? { level:resolveLevel(a.level, d.level) } : {}, placeOverrides(a), { ov:placeOverrides(a) });
    units[key] = makeAlly(a.id, a.x, a.y, extra);   // 우군은 전투마다 레벨 · 이름 · 무공을 정할 수 있음
  });
  if (curBattle.picks) (curPicks || []).forEach((id, i)=>{          // 출전 편성에서 고른 인물 → picks 자리
    const p = curBattle.picks[i]; if (!p || units[id] || !isParty(id)) return;
    const c = freeCellNear(p.x, p.y) || [p.x, p.y];
    units[id] = makeAlly(id, c[0], c[1], null);
  });
  battleCrowd = crowdExtra(curBattle, Object.values(units).filter(u=> u.side==='ally' && !u.friend && (u.key==='hero' || isParty(u.id))).length);
  curBattle.enemies.forEach((e,i)=> addEnemy(e, 'e'+(i+1)));
  newBattleState();
  battleHudReset();
  const lead = units.hero || aliveOf('ally')[0];
  cam.cx=(lead.x-0.5)*B_TILE; cam.cy=(lead.y-0.5)*B_TILE; applyCam(false);
  if (typeof metaOnBattleStart==='function') metaOnBattleStart();           // 돌발 임무 상자 (js/meta.js)
  if (typeof artsOnBattleStart==='function') artsOnBattleStart();           // 상성 안내 (처음 한 번)
  if (withIntro===true) startBattleIntro(); else showBanner('아군 턴');
}

/* ---------- 전투 중 저장 / 이어하기 ---------- */
// 저장할 수 없으면 이유를 돌려줌
function battleSaveBlock(){
  if (!curBattle || bState.over) return '전투가 끝나서 저장할 수 없습니다';
  if (bState.intro) return '대화 중에는 저장할 수 없습니다';
  if (bState.turn!=='ally') return '적 턴에는 저장할 수 없습니다';
  if (bState.busy || bState.moving) return '행동이 끝난 뒤에 저장하세요';
  if (aliveOf('ally').filter(u=>!u.noControl).every(u=>u.acted)) return '턴이 넘어가는 중입니다';
  return '';
}
function battleSnapshot(){
  const evs = curBattle.events || [];
  return { id:curBattleId, turnCount:bState.turnCount, enemySeq:bState.enemySeq, zoom:cam.zoom, start:battleStartSave, picks:curPicks ? curPicks.slice() : null,
           fired: bState.fired.map(e=>evs.indexOf(e)).filter(i=>i>=0),
           expBy: Object.assign({}, bState.expBy), mission: Object.assign({}, bState.mission || {}), goalText: bState.goalText || null, ms: bState.ms ? Object.assign({}, bState.ms) : null,
           units: Object.keys(units).map(k=>{ const u = units[k];
             return { key:k, id:u.id, side:u.side, friend:!!u.friend, noControl:!!u.noControl,
                      x:u.x, y:u.y, level:u.level, hp:u.hp, mp:u.mp||0, acted:!!u.acted, moved:!!u.moved, fled:!!u.fled, guard:u.guard||null, poison:u.poison ? Object.assign({}, u.poison) : null,
                      hold:u.hold, holdRange:u.holdRange, roused:!!u.roused, ov:u.ov || null }; }) };
}
function battlePlace(){
  const n = curBattle.name || '', i = n.indexOf(' · ');
  return (i>=0 ? n.slice(i+3) : n)+' · 전투 '+bState.turnCount+'턴';
}
// 전투 화면 오른쪽 위 '설정' → 소리 · 저장 · 불러오기 · 로비로 돌아가기
document.getElementById('b-settings').addEventListener('click', ()=> openSettings('battle'));
function doBattleSave(){
  const u = bState.selected;                                     // 이동만 하고 행동 전이면 제자리로
  if (u && u.moved && !u.acted && u.prevPos){ u.x = u.prevPos.x; u.y = u.prevPos.y; u.prevPos = null; u.moved = false; positionToken(u); }
  closeMenu(true); hideTerrainInfo();
  openSaveModal('save', { battle:true });
}
// 저장해 둔 전투를 그 턴부터 이어서
function resumeBattle(b){
  curBattleId = b.id; curBattle = BATTLES[b.id]; curPicks = b.picks || null;
  const s0ms = b.ms ? Object.assign({}, b.ms) : null;                          // 이 전투의 기록 (js/meta.js)
  if (!loadMap(curBattle.map)) return;
  battleStartSave = b.start || JSON.stringify({ inv:PLAYER.inv, gold:PLAYER.gold, hero:{ level:HERO.level, exp:HERO.exp, realm:HERO.realm }, members:MEMBERS });
  Object.values(units).forEach(u=>{ if(u.el) u.el.remove(); });
  units = {};
  battleCrowd = crowdExtra(curBattle, (b.units || []).filter(s=> s.side!=='enemy' && !s.friend && !s.noControl && (s.id==='hero' || isParty(s.id))).length);   // 인원 보정 (저장할 때 출전 인원)
  (b.units || []).forEach(s=>{
    if (!UNITS[s.id] && s.id!=='hero') return;
    const extra = Object.assign({}, s.noControl ? { friend:true, noControl:true } : {}, (!isParty(s.id) && s.level) ? { level:s.level } : {},
                                (!isParty(s.id) && s.side!=='enemy') ? Object.assign({ key:s.key }, s.ov || {}, { ov:s.ov || null }) : {});
    const u = s.side==='enemy' ? addEnemy(Object.assign({ id:s.id, x:s.x, y:s.y, level:s.level, hold:s.hold, holdRange:s.holdRange }, s.ov || {}), s.key)
                               : (units[s.key] = makeAlly(s.id, s.x, s.y, extra));
    u.hp = Math.max(0, Math.min(u.maxHp, s.hp)); u.mp = Math.max(0, Math.min(u.maxMp, s.mp||0));
    u.acted = !!s.acted; u.moved = !!s.moved; u.fled = !!s.fled;
    if (u.hp<=0){ u.el.classList.add('dead'); u.el.style.display = 'none'; }
    if (s.guard){ u.guard = s.guard; u.el.classList.add('guard'); }
    if (s.poison){ u.poison = Object.assign({}, s.poison); u.el.classList.add('poison'); }
    if (s.roused) u.roused = true;
    positionToken(u);
  });
  const evs = curBattle.events || [];
  newBattleState({ turnCount:b.turnCount||1, expBy:Object.assign({}, b.expBy||{}), mission:Object.assign({}, b.mission||{}), goalText:b.goalText || null,
                   fired:(b.fired||[]).map(i=>evs[i]).filter(Boolean), enemySeq:b.enemySeq||curBattle.enemies.length });
  if (s0ms) bState.ms = s0ms;                                                // 이 전투의 기록 (js/meta.js)
  battleHudReset();
  if (typeof metaOnBattleStart==='function') metaOnBattleStart();
  cam.zoom = b.zoom!==false;
  document.getElementById('b-zoom').textContent = cam.zoom ? '🔍 확대 켜짐' : '🔍 확대 꺼짐';
  const lead = (units.hero && units.hero.hp>0) ? units.hero : aliveOf('ally')[0];
  if (lead){ cam.cx=(lead.x-0.5)*B_TILE; cam.cy=(lead.y-0.5)*B_TILE; }
  applyCam(false);
  playBgm('battle');
  showBanner(bState.turnCount+'턴 · 아군 턴');
  autoEndCheck();
}

function clearHi(){ Object.values(bCells).forEach(c=>c.classList.remove('reachable','atk-range','atk-zone','skill-range','skill-area','heal-range')); if (typeof artsMarks==='function') artsMarks(null); }
function manhattan(a,b){ return Math.abs(a.x-b.x)+Math.abs(a.y-b.y); }

function bfsReachable(u){
  const start = u.x+','+u.y;
  const dist = {}; dist[start]=0; const prev={};
  const occ = new Set(Object.values(units).filter(o=>o!==u && o.hp>0).map(o=>o.x+','+o.y));
  const q = [[u.x,u.y,0]];
  while(q.length){
    const [cx,cy,d] = q.shift();
    for (const [nx,ny] of [[cx+1,cy],[cx-1,cy],[cx,cy+1],[cx,cy-1]]){
      if (nx<1||nx>B_COLS||ny<1||ny>B_ROWS) continue;
      const key = nx+','+ny;
      const td = terrainData(nx,ny);
      const cost = td.cost>=99 ? Infinity : td.cost;
      const nd = d+cost;
      if (nd>u.move) continue;
      if (occ.has(key)) continue;
      if (dist[key]===undefined || nd<dist[key]){ dist[key]=nd; prev[key]=cx+','+cy; q.push([nx,ny,nd]); }
    }
  }
  delete dist[start];
  bLastPrev = prev; bLastStart = start;
  return Object.keys(dist);
}
function pathTo(destKey){
  const path = []; let cur = destKey;
  while (cur && cur!==bLastStart){ path.unshift(cur); cur = bLastPrev[cur]; }
  return path.map(k=>{ const [x,y]=k.split(',').map(Number); return {x,y}; });
}

function moveAlong(u, destX, destY, onDone){
  const path = pathTo(destX+','+destY);
  if (!path.length){ onDone&&onDone(); return; }
  bState.moving = true; hideTerrainInfo();
  let i=0;
  (function step(){
    if (i>=path.length){ bState.moving=false; onDone&&onDone(); return; }
    u.x = path[i].x; u.y = path[i].y;
    positionToken(u);
    if (cam.zoom) camTo(u);
    i++;
    setTimeout(step, 190);
  })();
}

const unitMenu = document.getElementById('unit-menu');
const umAttack = document.getElementById('um-attack');

function onUnitClick(u){
  if (bState.over || bState.intro || bState.busy) return;
  if (bState.turn!=='ally') return;
  if (bState.skillMode){ onSkillTarget(u.x, u.y); return; }
  if (bState.itemMode){ onItemTarget(u.x, u.y); return; }
  if (u.side==='enemy'){
    if (bState.attackMode && bState.selected){
      const key = u.x+','+u.y;
      if (bCells[key] && bCells[key].classList.contains('atk-range')){
        bState.attackMode = false; doAttack(bState.selected, u);
      } else { toast('사거리 밖입니다.'); }
    } else togglePeek(u);                             // 적 정보 창 (다시 누르면 닫힘)
    return;
  }
  if (u.noControl || u.acted){ togglePeek(u); return; }   // 우군 · 행동을 마친 아군 : 정보 창만
  openMenu(u);
}

/* 정보 창 — 적 · 우군 · 행동을 마친 아군을 누르면 인물 옆에 (명령 메뉴의 이름 패널과 같은 모양)
   다시 누르거나 다른 곳을 누르면 닫힘. 창을 누르면 인물 반대쪽으로 옮겨감 */
const peekEl = document.getElementById('peek-info');
let peekUnit = null;
function peekHtml(u){
  const lv = '<span class="lv">Lv'+(u.level||1)+'</span>';
  const rg = ((u.range||1) > 1 || (u.minRange||1) > 1) ? '<span class="job">사거리 '+((u.minRange||1)===(u.range||1) ? u.range : (u.minRange||1)+'~'+u.range)+'</span>' : '';
  const sk = (u.skills||[]).filter(n=>SKILLS[n]);
  return '<b>'+u.name+'</b>'+lv+(typeof artsPeekTag==='function' ? artsPeekTag(u) : '')+'<span class="job">'+(u.job||'')+'</span>'+(u.realm?'<span class="realm">'+u.realm+'</span>':'')+rg+
         (u.side==='ally' && u.acted && !u.noControl ? '<span class="done">행동 완료</span>' : '')+
         (u.rank && typeof UNIT_RANKS !== 'undefined' && UNIT_RANKS[u.rank] ? '<span class="rank '+u.rank+'">'+UNIT_RANKS[u.rank].label+'</span>' : '')+
         (u.poison ? '<span class="psn">중독 '+u.poison.turns+'턴</span>' : '')+'<br>'+
         '<span class="lbl">체력</span> '+u.hp+'/'+u.maxHp+'<span class="gap"></span><span class="lbl">내공</span> '+(u.mp||0)+'/'+(u.maxMp||0)+'<br>'+
         '<span class="lbl">공격</span> '+u.atk+'<span class="gap"></span><span class="lbl">방어</span> '+u.def+'<span class="gap"></span><span class="lbl">이동</span> '+(u.move||0)+
         (u.side==='enemy' && traitName(u.id) ? '<div class="sk"><span class="lbl">특성</span> <span class="trait">'+traitName(u.id)+'</span></div>' : '')+
         (sk.length ? '<div class="sk"><span class="lbl">무공</span> '+sk.join(', ')+'</div>' : '');
}
function showPeek(u){
  peekUnit = u;
  peekEl.className = u.side==='enemy' ? 'enemy' : (u.friend || u.noControl ? 'friend' : '');
  peekEl.innerHTML = peekHtml(u);
  peekEl.classList.add('show');
  const sel = bState.selected;                        // 명령 메뉴가 열려 있으면 그 반대쪽으로
  placeBeside(peekEl, u, sel && sel !== u && sel.x > u.x ? 'l' : 'r');
  peekEl.classList.toggle('ghost', !!bState.moveMode);
}
function hidePeek(){ peekEl.classList.remove('show'); peekUnit = null; }
function togglePeek(u){ if (peekUnit === u && peekEl.classList.contains('show')) hidePeek(); else { hideTerrainInfo(); showPeek(u); } }
// 정보 창을 누르면 닫힘. 창 아래가 이동할 파란 칸이면 그 칸으로 이동
peekEl.addEventListener('click', ev=>{
  ev.stopPropagation();
  const c = reachableUnder(ev.clientX, ev.clientY);
  hidePeek();
  if (c) onCellClick(c.x, c.y);
});
// 화면의 한 점 아래에 있는 이동 가능한(파란) 칸 — 메뉴 · 정보 창에 가려져 있어도 찾음
function reachableUnder(cx, cy){
  if (!bState.moveMode || !bState.selected) return null;
  const el = document.elementsFromPoint(cx, cy).find(e=> e.classList && e.classList.contains('cell'));
  if (!el || !el.classList.contains('reachable')) return null;
  return { x:+el.dataset.x, y:+el.dataset.y };
}

function openMenu(u){
  clearHi(); hideTerrainInfo(); hidePeek();
  if (bState.selected && bState.selected!==u) bState.selected.el.classList.remove('selected');
  bState.selected = u; bState.attackMode = false; bState.skillMode = null; bState.itemMode = null;
  unitMenu.classList.remove('skills');
  u.el.classList.add('selected');
  if (!u.moved){
    bState.moveMode = true;
    bfsReachable(u).forEach(k=>{ if(bCells[k]) bCells[k].classList.add('reachable'); });
  } else { bState.moveMode = false; }
  const adjacent = attackTargets(u).length>0;
  umAttack.classList.toggle('show', adjacent);
  document.getElementById('um-talk').classList.toggle('show', talkTargets(u).length>0);   // 임무 : 대화할 상대가 바로 옆에 있을 때
  document.getElementById('um-ascend').classList.toggle('show', canBattleAscend(u));       // 수련도를 다 채우고 다음 경지 레벨이 됐을 때
  document.getElementById('um-info').innerHTML = unitInfoHtml(u);
  unitMenu.classList.add('show');
  unitMenu.classList.remove('ghost');
  if (typeof artsMarks==='function') artsMarks(u);           // 상성 ▲▼ (일반 공격 기준)
  const hidden = placeMenuSmart(u);                          // 메뉴가 가린 파란 칸 수
  unitMenu.classList.toggle('ghost', !!bState.moveMode && hidden > 0);   // 파란 칸을 가릴 때만 반투명
}
// 오른쪽 · 왼쪽 중 파란 칸을 덜 가리는 쪽에 (같으면 오른쪽)
function placeMenuSmart(u){
  const covered = ()=>{
    const L = unitMenu.offsetLeft, T = unitMenu.offsetTop, W = unitMenu.offsetWidth, H = unitMenu.offsetHeight; let n = 0;
    Object.keys(bCells).forEach(k=>{
      if (!bCells[k].classList.contains('reachable')) return;
      const [x, y] = k.split(',').map(Number), cx = (x-1)*B_TILE, cy = (y-1)*B_TILE;
      if (cx < L + W && cx + B_TILE > L && cy < T + H && cy + B_TILE > T) n++;
    });
    return n;
  };
  const r = placeMenu(u, 'r'), nr = covered(); if (!nr) return 0;
  const l = placeMenu(u, r==='r' ? 'l' : 'r'); if (l === r) return nr;
  const nl = covered();
  if (nl >= nr){ placeMenu(u, r); return nr; }
  return nl;
}
/* 메뉴 자리 — 인물 오른쪽('r') 또는 왼쪽('l')에 한 칸 띄워서 (바로 옆 칸은 누를 수 있게)
   원하는 쪽이 지도 · 화면 밖으로 나가면 반대쪽에 둠. 실제로 놓인 쪽을 돌려줌 */
let menuSide = 'r';
function placeMenu(u, want){
  if (!u || !unitMenu.classList.contains('show')) return menuSide;
  return (menuSide = placeBeside(unitMenu, u, want));
}
// 창(el)을 인물 옆에 — 명령 메뉴 · 정보 창 공통
function placeBeside(el, u, want){
  const px=(u.x-1)*B_TILE, py=(u.y-1)*B_TILE, GAP = B_TILE + 6;
  const mw = el.offsetWidth, mh = el.offsetHeight;
  const S = BS.getBoundingClientRect();
  const leftOf = side => side==='r' ? px + B_TILE + GAP : px - mw - GAP;
  const fits = side => {
    const left = leftOf(side);
    if (left < 4 || left + mw > STAGE_W - 4) return false;          // 지도 밖
    el.style.left = left+'px';
    const r = el.getBoundingClientRect();
    return r.left >= S.left + 6 && r.right <= S.right - 6;           // 화면 밖
  };
  const other = want==='r' ? 'l' : 'r';
  let side = fits(want) ? want : fits(other) ? other : (leftOf(want) >= 4 && leftOf(want) + mw <= STAGE_W - 4 ? want : other);
  el.style.left = leftOf(side)+'px';
  // 세로 : 인물 높이에 맞추고, 화면 아래 · 위로 넘치면 안쪽으로
  let top = Math.max(4, Math.min(py - 10, STAGE_H - mh - 4));
  el.style.top = top+'px';
  let mr = el.getBoundingClientRect();
  if (mr.bottom > S.bottom - 6){ top -= (mr.bottom - (S.bottom - 6)) / (cam.s || 1); top = Math.max(4, top); el.style.top = top+'px'; mr = el.getBoundingClientRect(); }
  if (mr.top < S.top + 6){ top += ((S.top + 6) - mr.top) / (cam.s || 1); el.style.top = top+'px'; mr = el.getBoundingClientRect(); }
  // 위 가운데 전투 정보창과 겹치면 그 아래로 (화면 아래로 넘치지 않을 때만)
  const hud = document.getElementById('hud-top'), hr = hud && hud.offsetParent ? hud.getBoundingClientRect() : null;
  if (hr && mr.left < hr.right && mr.right > hr.left && mr.top < hr.bottom + 4){
    const dy = (hr.bottom + 4 - mr.top);
    if (mr.bottom + dy <= S.bottom - 6){ top += dy / (cam.s || 1); el.style.top = top+'px'; }
  }
  el.classList.toggle('on-left', side==='l');
  return side;
}
// 반투명한 메뉴 : 버튼 이름(글자) 밖을 눌렀는데 그 아래가 파란 칸이면 그 칸으로 이동 (가려진 칸도 누를 수 있게)
unitMenu.addEventListener('click', ev=>{
  if (!unitMenu.classList.contains('ghost') || unitMenu.classList.contains('skills')) return;
  if (ev.target.closest('.um-lb')) return;                     // 글자 = 버튼
  const c = reachableUnder(ev.clientX, ev.clientY); if (!c) return;
  ev.stopPropagation(); ev.preventDefault();
  onCellClick(c.x, c.y);
}, true);
document.getElementById('um-info').addEventListener('click', ev=> ev.stopPropagation());
function unitInfoHtml(u){
  const rg = ((u.range||1) > 1 || (u.minRange||1) > 1) ? '<span class="job">사거리 '+((u.minRange||1)===(u.range||1) ? u.range : (u.minRange||1)+'~'+u.range)+'</span>' : '';
  return '<b>'+u.name+'</b>'+(u.side==='ally'?'<span class="lv">Lv'+(u.level||1)+'</span>':'')+'<span class="job">'+(u.job||'')+'</span>'+(u.realm?'<span class="realm">'+u.realm+'</span>':'')+rg+
         (u.poison ? '<span class="psn">중독 '+u.poison.turns+'턴</span>' : '')+'<br>'+
         '<span class="lbl">체력</span> '+u.hp+'/'+u.maxHp+'<span class="gap"></span><span class="lbl">내공</span> '+(u.mp||0)+'/'+(u.maxMp||0)+
         ((u.side==='ally' && !u.friend) ? '<br><span class="lbl">경험</span> '+(u.exp||0)+'/'+EXP_MAX : '');
}
function undoMove(u){
  closeMenu(false);
  u.x = u.prevPos.x; u.y = u.prevPos.y; u.prevPos = null; u.moved = false;
  u.el.style.transition = 'none';                    // 미끄러지지 않고 바로 이동
  positionToken(u); void u.el.offsetWidth;
  u.el.style.transition = '';
  if (cam.zoom) camTo(u, false);
  openMenu(u);                                       // 다시 이동 범위 표시
}
function closeMenu(deselect){
  unitMenu.classList.remove('show','skills'); bState.skillMode=null; bState.itemMode=null;
  if (deselect && bState.selected){ bState.selected.el.classList.remove('selected'); bState.selected=null; }
  clearHi(); bState.moveMode=false; bState.attackMode=false;
}
unitMenu.addEventListener('click', (e)=>{
  const btn = e.target.closest('.um-btn'); if(!btn) return;
  const a = btn.dataset.a; const u = bState.selected; if(!u) return;
  if (a==='attack'){
    unitMenu.classList.remove('show'); bState.moveMode=false; bState.attackMode=true;
    showAttackZone(u);
    hint('공격할 대상을 선택하세요 (붉은 칸)');
  } else if (a==='talk'){
    const t = talkTargets(u)[0]; if (!t) return;
    unitMenu.classList.remove('show'); clearHi(); bState.moveMode = false;
    doTalk(u, t.e, t.id);
  } else if (a==='ascend'){
    doBattleAscend(u);
  } else if (a==='wait'){
    unitMenu.classList.remove('show'); u.acted=true; u.el.classList.remove('selected'); bState.selected=null;
    clearHi(); toast('대기합니다.'); autoEndCheck();
  } else if (a==='tactic'){
    openSkillList(u);
  } else if (a==='item'){
    openItemList(u);
  } else if (a==='cancel'){
    if (u.moved && !u.acted && u.prevPos){ undoMove(u); return; }   // 이동 후 취소 → 즉시 제자리
    closeMenu(true);
  }
});

/* ---------- 도구 (배낭의 회복약) ---------- */
function battleItems(){ return Object.keys(PLAYER.inv).filter(n=>PLAYER.inv[n]>0 && ITEM_DB[n] && ITEM_DB[n].type==='consumable' && (ITEM_DB[n].heal || ITEM_DB[n].cure)); }
// 도구를 쓸 수 있는 대상 : 자신 + 붙어 있는 아군·우군
function itemTargets(u){ return [u].concat(aliveOf('ally').filter(a=>a!==u && !a.noControl && manhattan(a,u)===1)); }
function openItemList(u){
  const list = document.getElementById('um-skills'); list.innerHTML = '';
  const items = battleItems();
  if (!items.length){ toast('쓸 수 있는 도구가 없습니다.'); return; }
  items.forEach(n=>{
    const it = ITEM_DB[n], b = document.createElement('div');
    b.className = 'sk-btn';
    b.innerHTML = itemIcon(n)+' '+n+' ×'+PLAYER.inv[n]+'<small>'+(it.cure==='all' ? '상태 이상 풀기 · 체력 +'+(it.heal||0) : it.cure ? '중독 풀기' : '체력 +'+it.heal)+' · 자신 / 옆 아군</small>';
    b.addEventListener('click', ev=>{ ev.stopPropagation(); startItem(u, n); });
    list.appendChild(b);
  });
  const back = document.createElement('div'); back.className = 'sk-back'; back.textContent = '뒤로';
  back.addEventListener('click', ev=>{ ev.stopPropagation(); unitMenu.classList.remove('skills'); placeMenu(bState.selected, menuSide); });
  list.appendChild(back);
  unitMenu.classList.add('skills');
  placeMenu(u, menuSide);                            // 목록 폭이 달라지므로 다시 자리 잡기
}
function startItem(u, n){
  unitMenu.classList.remove('show','skills');
  clearHi(); bState.moveMode=false; bState.attackMode=false; bState.skillMode=null;
  bState.itemMode = { u, n };
  itemTargets(u).forEach(t=>{ const c = bCells[t.x+','+t.y]; if (c) c.classList.add('heal-range'); });
  hint(n+' — 쓸 대상을 고르세요 (초록 칸)');
}
function onItemTarget(x, y){
  const im = bState.itemMode;
  const t = itemTargets(im.u).find(a=>a.x===x && a.y===y);
  if (!t){ closeMenu(true); return; }
  useItem(im.u, t, im.n);
}
function useItem(u, t, n){
  bState.itemMode = null; clearHi();
  const it = ITEM_DB[n];
  if (it.cure==='all'){                              // 청심환 : 모든 상태 이상 풀기 + 체력 회복
    if (!t.poison && t.hp >= t.maxHp){ toast(t.name+josa(t.name,'은','는')+' 풀 상태 이상도, 잃은 체력도 없습니다.'); bState.itemMode = { u, n }; itemTargets(u).forEach(a=>{ const c = bCells[a.x+','+a.y]; if (c) c.classList.add('heal-range'); }); return; }
    if (!takeFromBag(n)) return;
    const cured = cureUnit(t), before = t.hp; t.hp = Math.min(t.maxHp, t.hp + (it.heal||0));
    floatNum(t, cured ? '해독 +'+(t.hp-before) : '+'+(t.hp-before), 'heal'); sfx('heal'); positionToken(t);
    t.el.classList.remove('heal'); void t.el.offsetWidth; t.el.classList.add('heal'); setTimeout(()=>t.el.classList.remove('heal'), 800);
    toast(u.name+josa(u.name,'이','가')+' '+n+josa(n,'을','를')+' 썼습니다 — '+t.name+(cured ? ' 상태 이상이 풀리고' : '')+' 체력 +'+(t.hp-before)+'  (남은 '+n+' '+(PLAYER.inv[n]||0)+'개)', 1800, [u, t]);
    u.acted = true; u.el.classList.remove('selected'); bState.selected = null;
    autoEndCheck(); return;
  }
  if (it.cure){                                      // 해독제 : 중독 풀기
    if (!t.poison){ toast(t.name+josa(t.name,'은','는')+' 중독되지 않았습니다.'); bState.itemMode = { u, n }; itemTargets(u).forEach(a=>{ const c = bCells[a.x+','+a.y]; if (c) c.classList.add('heal-range'); }); return; }
    if (!takeFromBag(n)) return;
    cureUnit(t); floatNum(t, '해독', 'heal'); sfx('heal');
    toast(u.name+josa(u.name,'이','가')+' '+n+josa(n,'을','를')+' 썼습니다 — '+t.name+'의 중독이 풀렸습니다  (남은 '+n+' '+(PLAYER.inv[n]||0)+'개)', 1800, [u, t]);
    u.acted = true; u.el.classList.remove('selected'); bState.selected = null;
    autoEndCheck(); return;
  }
  if (!takeFromBag(n)) return;
  const before = t.hp; t.hp = Math.min(t.maxHp, t.hp + it.heal);
  floatNum(t, '+'+(t.hp-before), 'heal'); sfx('heal');
  positionToken(t);
  t.el.classList.remove('heal'); void t.el.offsetWidth; t.el.classList.add('heal');
  setTimeout(()=>t.el.classList.remove('heal'), 800);
  toast(u.name+josa(u.name,'이','가')+' '+n+josa(n,'을','를')+' 썼습니다 — '+t.name+' 체력 +'+(t.hp-before)+'  (남은 '+n+' '+(PLAYER.inv[n]||0)+'개)', 1800, [u, t]);
  u.acted = true; u.el.classList.remove('selected'); bState.selected = null;
  autoEndCheck();
}

function openSkillList(u){
  const list = document.getElementById('um-skills'); list.innerHTML = '';
  const sk = u.skills || [];
  if (!sk.length){ toast('익힌 무공이 없습니다.'); return; }
  sk.forEach(name=>{
    const d = SKILLS[name];
    const b = document.createElement('div');
    b.className = 'sk-btn' + ((u.mp < d.mp || !skillHasTarget(u, name)) ? ' off' : '');
    const ms = (u.mastery && u.mastery[name]) || null;
    const area = d.area==='self' ? '자신 방어 +'+(((d.guard||{}).def||0) + ((ms && ms.guard)||0))
               : d.area==='ally' ? '체력 '+Math.round(((d.heal||0) + ((ms && ms.heal)||0))*100)+'% 회복 · '+((d.range||1) > 1 ? d.range+'칸 안' : '자신/옆 아군')
               : String(d.desc||'').split(' · ')[0];
    b.innerHTML = (typeof artsSkillTag==='function' ? artsSkillTag(name, u) : '') + name + (ms && ms.star>1 ? ' '+ms.star+'성' : '') + '<small>내공 ' + d.mp + ' · ' + area + '</small>';   // 좁은 메뉴 : 내공을 앞에
    b.addEventListener('click', ev=>{ ev.stopPropagation(); startSkill(u, name); });
    list.appendChild(b);
  });
  const back = document.createElement('div'); back.className = 'sk-back'; back.textContent = '뒤로';
  back.addEventListener('click', ev=>{ ev.stopPropagation(); unitMenu.classList.remove('skills'); placeMenu(bState.selected, menuSide); });
  list.appendChild(back);
  unitMenu.classList.add('skills');
  placeMenu(u, menuSide);                            // 목록 폭이 달라지므로 다시 자리 잡기
}
// 경험치 (표는 data/growth.js) — 아군만 받음, 우군은 레벨 고정
function gainExp(u, amount){
  if (!u || u.side!=='ally' || u.friend || amount<=0) return 0;
  if (units[u.key] !== u) return 0;                                 // 이미 끝난(나간) 전투의 유닛
  if ((u.level||1) >= MAX_LEVEL) return 0;                         // 만렙
  const cap = levelCap(u.key);
  if (u.level >= cap && (u.exp||0) >= EXP_MAX) return 0;            // 경지의 벽 : 더 쌓이지 않음
  const before = u.exp||0, oldRealm = u.realm; let ups = 0;
  u.exp = before + amount;
  while (u.exp >= EXP_MAX && u.level < cap){ u.exp -= EXP_MAX; u.level++; ups++; }
  if (u.level >= cap) u.exp = Math.min(u.exp, EXP_MAX);
  if (u.level >= MAX_LEVEL) u.exp = 0;
  amount = ups*EXP_MAX + u.exp - before;                            // 실제로 쌓인 양
  if (bState && bState.expBy) bState.expBy[u.key] = (bState.expBy[u.key]||0) + amount;
  if (u.level >= cap && u.exp >= EXP_MAX && cap < MAX_LEVEL && !u.wallSaid && !canBattleAscend(u)){
    u.wallSaid = true;
    setTimeout(()=> toast(u.name+' — 경지의 벽에 닿았습니다\n훈련장에서 수련도를 채워 경지를 올리면 다시 성장합니다', 2600, [u]), 1300);
  }
  let gain = null;
  if (ups) gain = levelUpUnit(u, ups);
  const st = memberState(u.key); if (st){ st.exp = u.exp; st.level = u.level; st.realm = u.realm; }
  showExpPop(u, before, amount, ups);
  if (ups && canBattleAscend(u) && !u.ascSaid){                 // 수련도를 다 채운 채 다음 경지 레벨에 닿음 → 명령 메뉴 '승급'
    u.ascSaid = true;
    setTimeout(()=> toast(u.name+' — '+ascendInfo(u.key).to+' 경지에 오를 수 있습니다!\n명령 메뉴의 \'승급\' (행동을 씀)', 2800, [u]), 3300);
  }
  positionToken(u);
  const ptUp = ups && isParty(u.key) ? attrTotal(u.level) - attrTotal(u.level - ups) : 0;   // 10레벨마다 능력 점수
  if (ups) setTimeout(()=>{
    showBanner(u.realm!==oldRealm ? '경지 상승! '+u.realm : u.name+' 레벨 업!'); sfx('levelup');
    toast(u.name+' Lv '+u.level+' — 체력 +'+gain.hp+' · 내공 +'+gain.mp+' · 공격 +'+gain.atk+' · 방어 +'+gain.def+
          (ptUp > 0 ? '\n능력 점수 +'+ptUp+' (상태보기 → 능력)' : '')+
          (gain.heal>0 ? '\n체력 '+Math.round(LEVELUP_HEAL*100)+'% 회복 +'+gain.heal+'  ('+u.hp+'/'+u.maxHp+')' : ''), 2400, [u]);
    if (gain.heal>0) floatNum(u, '+'+gain.heal, 'heal');
    if (gain.heal>0 && u.el){ u.el.classList.remove('heal'); void u.el.offsetWidth; u.el.classList.add('heal'); setTimeout(()=>u.el.classList.remove('heal'), 800); }
  }, 700);
  return amount;
}
// 전투 중 경지 상승 (명령 메뉴 '승급') — 수련도를 다 채운 인물이 전투에서 다음 경지 레벨(이류 Lv10)에 닿으면. 행동을 씀
function canBattleAscend(u){ return !!u && u.side==='ally' && !u.friend && !u.noControl && isParty(u.key) && ascendInfo(u.key).ok; }
function doBattleAscend(u){
  if (!canBattleAscend(u)) return;
  const a = ascendInfo(u.key), lv0 = u.level;
  unitMenu.classList.remove('show'); clearHi(); bState.moveMode = false;
  ascendRealm(u.key);                                         // 경지 + 벽에서 기다리던 경험치로 레벨업
  const st = memberState(u.key);
  u.realmFixed = st.realm; u.level = st.level; u.exp = st.exp || 0; u.wallSaid = false; u.ascSaid = false;
  const gain = levelUpUnit(u, u.level - lv0);                 // 명중 · 회피는 새 경지 값, 체력도 조금 회복
  u.acted = true; u.el.classList.remove('selected'); bState.selected = null;
  positionToken(u); if (cam.zoom) camTo(u);
  u.el.classList.remove('ascend'); void u.el.offsetWidth; u.el.classList.add('ascend'); setTimeout(()=> u.el.classList.remove('ascend'), 1500);
  showBanner('경지 상승! '+a.to); sfx('levelup');
  if (gain.heal>0) floatNum(u, '+'+gain.heal, 'heal');
  toast(u.name+' — '+a.from+' → '+a.to+' 경지에 올랐습니다'+(u.level>lv0 ? ' · Lv '+u.level : '')+
        '\n명중 · 회피 상승'+(gain.hp>0 ? ' · 체력 +'+gain.hp : '')+(gain.atk>0 ? ' · 공격 +'+gain.atk : '')+(gain.heal>0 ? ' · 체력 회복 +'+gain.heal : ''), 2600, [u]);
  setTimeout(autoEndCheck, 900);
}
// 레벨이 오른 유닛의 능력치 다시 계산 — 늘어난 최대치만큼 더하고, 체력은 LEVELUP_HEAL(최대 체력의 30%)만큼 더 회복
function levelUpUnit(u, ups){
  const s = computeStats(u.level, u.equip, u.treeBonus, u.realmFixed, crowdMods(u, statMods(u.id, u.rank, u.side, undefined, u.prog || u.level)));
  const gain = { hp:s.maxHp-u.maxHp, mp:s.maxMp-u.maxMp, atk:s.atk-u.atk, def:s.def-u.def };
  Object.assign(u, { realm:s.realm, atk:s.atk, def:s.def, hit:s.hit, eva:s.eva, maxHp:s.maxHp, maxMp:s.maxMp });
  const hp0 = Math.min(u.maxHp, u.hp + gain.hp);
  const rate = (typeof LEVELUP_HEAL === 'number') ? LEVELUP_HEAL : 0;
  u.hp = Math.min(u.maxHp, hp0 + Math.round(u.maxHp * rate) * (ups||1));
  gain.heal = u.hp - hp0;                                   // 실제로 회복된 양 (가득 차 있으면 0)
  u.mp = Math.min(u.maxMp, u.mp + gain.mp);
  return gain;
}
// 경험치 획득 표시: 하단 게이지가 차오름 (레벨업이면 끝까지 찼다가 다시 시작)
let expPopTimer = null;
function showExpPop(u, before, amount, ups){
  const pop = document.getElementById('exp-pop'), bar = document.getElementById('xp-bar');
  document.getElementById('xp-name').textContent = u.name;
  document.getElementById('xp-lv').textContent = 'Lv '+(u.level - ups);
  document.getElementById('xp-gain').textContent = '경험 +'+amount;
  document.getElementById('xp-num').textContent = before+'/'+EXP_MAX;
  bar.style.transition = 'none'; bar.style.width = (before/EXP_MAX*100)+'%'; void bar.offsetWidth; bar.style.transition = '';
  pop.style.display = 'block';
  clearTimeout(expPopTimer);
  setTimeout(()=>{
    bar.style.width = (ups ? 100 : u.exp/EXP_MAX*100)+'%';
    document.getElementById('xp-num').textContent = (ups ? EXP_MAX : u.exp)+'/'+EXP_MAX;
    if (ups) setTimeout(()=>{
      document.getElementById('xp-lv').textContent = 'Lv '+u.level+' ▲';
      bar.style.transition = 'none'; bar.style.width = '0%'; void bar.offsetWidth; bar.style.transition = '';
      bar.style.width = (u.exp/EXP_MAX*100)+'%';
      document.getElementById('xp-num').textContent = u.exp+'/'+EXP_MAX;
    }, 650);
  }, 60);
  expPopTimer = setTimeout(()=>{ pop.style.display = 'none'; }, ups ? 2400 : 1700);
}
const DIRS = [[1,0],[-1,0],[0,1],[0,-1]];
function inBounds(x,y){ return x>=1 && x<=B_COLS && y>=1 && y<=B_ROWS; }
// 선택한 칸 → 실제 피해 범위
// 방향을 고르는 무공 : line4 (직진 4칸) · line3 (직진 3칸) · line2 (직진 2칸) · sweep3 (앞쪽 가로 3칸 베기)
function lineLen(d){ return d.area==='line4' ? 4 : d.area==='line3' ? 3 : d.area==='line2' ? 2 : 0; }
function dirSkill(d){ return !!lineLen(d) || d.area==='sweep3'; }
function areaSkill(d){ return dirSkill(d) || d.area==='volley3'; }             // 여러 칸을 치는 무공 (숙련 위력 · 미리 보기)
// volley3 : 고른 칸과 그 양옆 — 쏘는 방향(가로/세로 중 더 먼 쪽)과 직각으로 3칸. 대각선이면 가로로 펼침
function volleyCells(cx, cy, x, y){
  const ax = Math.abs(x-cx), ay = Math.abs(y-cy);
  const px = ax > ay ? 0 : 1, py = ax > ay ? 1 : 0;
  return [[x,y], [x-px,y-py], [x+px,y+py]];
}
function skillArea(skill, x, y, caster){
  const d = SKILLS[skill];
  let cells = [[x,y]];
  if (caster && dirSkill(d)){
    const dx = Math.sign(x-caster.x), dy = Math.sign(y-caster.y);
    if (d.area==='sweep3'){                          // 바로 앞 칸과 그 양옆
      const fx = caster.x+dx, fy = caster.y+dy, px = dy ? 1 : 0, py = dx ? 1 : 0;
      cells = [[fx,fy], [fx+px,fy+py], [fx-px,fy-py]];
    } else cells = Array.from({ length:lineLen(d) }, (_,i)=>[caster.x+dx*(i+1), caster.y+dy*(i+1)]);
  }
  else if (caster && d.area==='volley3')            // 원거리 무공 : 시전자에게 minRange 보다 가까운 칸은 빠짐 (대각선으로 쏠 때)
    cells = volleyCells(caster.x, caster.y, x, y).filter(([cx,cy])=> Math.abs(cx-caster.x)+Math.abs(cy-caster.y) >= (d.minRange||1));
  return cells.filter(([cx,cy])=>inBounds(cx,cy));
}
// 무공으로 고를 수 있는 칸
function skillRangeCells(u, skill){
  const d = SKILLS[skill], out = [];
  if (dirSkill(d)){
    const n = d.area==='sweep3' ? 1 : lineLen(d);
    DIRS.forEach(([dx,dy])=>{ for (let k=1;k<=n;k++){ const x=u.x+dx*k, y=u.y+dy*k; if (inBounds(x,y)) out.push([x,y]); } });
  } else {
    for (let y=1;y<=B_ROWS;y++) for (let x=1;x<=B_COLS;x++){ const dist=Math.abs(x-u.x)+Math.abs(y-u.y); if (dist>=(d.minRange||1) && dist<=d.range) out.push([x,y]); }
  }
  return out;
}
// 지금 위치에서 이 무공으로 맞힐 수 있는 적이 하나라도 있는지
function skillHasTarget(u, skill){
  const d = SKILLS[skill];
  if (d.area==='self') return true;
  if (d.area==='ally') return healTargets(u, skill).length > 0;
  if (dirSkill(d)) return DIRS.some(([dx,dy])=> skillArea(skill, u.x+dx, u.y+dy, u).some(([x,y])=>unitAt(x,y,'enemy')));
  if (d.area==='volley3') return skillRangeCells(u, skill).some(([cx,cy])=> skillArea(skill, cx, cy, u).some(([x,y])=>unitAt(x,y,'enemy')));
  return skillRangeCells(u, skill).some(([x,y])=>unitAt(x,y,'enemy'));
}
function startSkill(u, name){
  const d = SKILLS[name];
  if (u.mp < d.mp){ toast('내공이 부족합니다. (필요 '+d.mp+')'); return; }
  if (d.area==='self'){ unitMenu.classList.remove('show','skills'); castSelf(u, name); return; }
  if (d.area==='ally' && !skillHasTarget(u, name)){ toast('회복할 아군이 없습니다. (자신 · 옆 아군 모두 체력이 가득)'); return; }
  if (!skillHasTarget(u, name)){ toast('공격 불가능합니다. (범위 안에 적이 없습니다)'); return; }
  unitMenu.classList.remove('show','skills');
  clearHi(); bState.moveMode=false; bState.attackMode=false;
  bState.skillMode = { u, name, preview:null };
  if (d.area==='ally'){                               // 회복 : 다친 자신 · 옆 아군을 초록 칸으로
    healTargets(u, name).forEach(t=>{ const c = bCells[t.x+','+t.y]; if (c) c.classList.add('heal-range'); });
    hint(name+' — 회복할 대상을 고르세요 (초록 칸)'); return;
  }
  skillRangeCells(u, name).forEach(([x,y])=> bCells[x+','+y].classList.add('skill-range'));
  if (typeof artsMarks==='function') artsMarks(u, name);                         // 상성 ▲▼ (이 무공의 결로)
  hint(dirSkill(d) ? name+' — 방향을 눌러 범위 확인, 한 번 더 누르면 시전'
     : d.area==='volley3' ? name+' — 칸을 눌러 범위 확인, 한 번 더 누르면 시전' : name+' — 대상을 선택하세요');
}
function onSkillTarget(x,y){
  const sm = bState.skillMode; const key = x+','+y;
  if (SKILLS[sm.name].area==='ally'){
    const t = healTargets(sm.u, sm.name).find(a=>a.x===x && a.y===y);
    if (!t){ closeMenu(true); return; }
    castHeal(sm.u, sm.name, t); return;
  }
  if (!bCells[key] || !bCells[key].classList.contains('skill-range')){ closeMenu(true); return; }
  const d = SKILLS[sm.name];
  if (d.area==='single'){
    if (!unitAt(x,y,'enemy')){ toast('공격 불가능합니다. (적이 없습니다)'); return; }
    castSkill(sm.u, sm.name, x, y); return;
  }
  const area = skillArea(sm.name, x, y, sm.u);
  const hasEnemy = area.some(([cx,cy])=>unitAt(cx,cy,'enemy'));
  const dirKey = d.area==='volley3' ? key : Math.sign(x-sm.u.x)+','+Math.sign(y-sm.u.y);     // 같은 방향의 칸이면 같은 범위 (원거리 범위는 같은 칸)
  if (sm.preview===dirKey){
    if (!hasEnemy){ toast('공격 불가능합니다. (적이 없습니다)'); return; }   // 내공 소모 없음
    castSkill(sm.u, sm.name, x, y); return;
  }
  Object.values(bCells).forEach(c=>c.classList.remove('skill-area'));
  area.forEach(([cx,cy])=> bCells[cx+','+cy].classList.add('skill-area'));
  sm.preview = dirKey;
  if (!hasEnemy) toast(d.area==='volley3' ? '공격 불가능합니다. (이 범위에는 적이 없습니다)' : '공격 불가능합니다. (이 방향에는 적이 없습니다)');
}
// 자신에게 쓰는 방어 무공 : 다음 아군 턴이 시작될 때까지 방어 +
function castSelf(u, name){
  const d = SKILLS[name], g = Object.assign({}, d.guard || {});
  g.def = (g.def||0) + ((u.mastery && u.mastery[name] && u.mastery[name].guard) || 0);     // 숙련(n성)
  clearHi(); bState.moveMode = false; bState.attackMode = false; bState.skillMode = null;
  u.mp -= d.mp;
  u.guard = { def:g.def||0 }; u.el.classList.add('guard');
  positionToken(u);
  showBanner(name); sfx('heal');
  floatNum(u, '방어 +'+(g.def||0), 'buff');
  let healed = 0;
  if (d.selfHeal && u.hp < u.maxHp){ const b0 = u.hp; u.hp = Math.min(u.maxHp, u.hp + Math.max(1, Math.round(u.maxHp * d.selfHeal))); healed = u.hp - b0; floatNum(u, '+'+healed, 'heal', 350); positionToken(u); }
  toast(u.name+' — '+name+' · 다음 턴까지 방어 +'+(g.def||0)+(healed ? ' · 체력 +'+healed : ''), 1600, [u]);
  u.acted = true; u.el.classList.remove('selected'); bState.selected = null;
  autoEndCheck();
}
/* 중독 (data/skills.js 의 poison:{ turns, dmg }) — 그 무공에 맞고 살아남으면 걸림 (이미 걸렸으면 다시 3턴)
   자기 편 턴이 시작될 때마다 체력 -dmg, turns 만큼. 중독으로는 쓰러지지 않음 (체력 1 에서 멈춤). 해독제로 풀림 */
function applyPoison(t, p){
  if (!t || t.hp<=0 || !p) return;
  t.poison = { turns:p.turns, dmg:p.dmg };
  t.el.classList.add('poison');
  floatNum(t, '중독', 'poison', 250);
}
function cureUnit(t){ if (t && t.poison){ t.poison = null; t.el.classList.remove('poison'); return true; } return false; }
function poisonTick(list){
  list.forEach(u=>{
    if (!u.poison || u.hp<=0) return;
    const d = Math.min(u.poison.dmg, u.hp - 1);
    if (d > 0){ u.hp -= d; floatNum(u, '중독 -'+d, 'poison'); positionToken(u); }
    if (--u.poison.turns <= 0) cureUnit(u);
  });
}
// 아군 턴 시작 : 방어 무공 풀림, 중독 피해, 심법 회복 (체력 · 내공)
function allyTurnStart(){
  poisonTick(aliveOf('ally'));
  aliveOf('ally').forEach(u=>{
    if (u.guard){ u.guard = null; u.el.classList.remove('guard'); }
    let delay = 0;
    const br = bondVal(u, 'regenPct');                                          // 인연 : 턴 시작 체력 회복
    if (br > 0 && u.hp < u.maxHp){ const b = u.hp; u.hp = Math.min(u.maxHp, u.hp + Math.max(1, Math.round(u.maxHp * br))); floatNum(u, '+'+(u.hp-b), 'heal', delay); delay += 350; positionToken(u); }
    const p = u.passive; if (!p) return;
    if (p.hpRegen && u.hp < u.maxHp){ const b = u.hp; u.hp = Math.min(u.maxHp, u.hp + p.hpRegen); floatNum(u, '+'+(u.hp-b), 'heal', delay); delay += 350; }
    if (p.mpRegen && u.mp < u.maxMp){ const b = u.mp; u.mp = Math.min(u.maxMp, u.mp + p.mpRegen); floatNum(u, '내공 +'+(u.mp-b), 'mp', delay); }
    positionToken(u);
  });
  if (typeof metaOnTurn==='function') metaOnTurn();                         // 돌발 임무 : 상자 시간 · 강적 달아남 (js/meta.js)
}
// 회복 무공 : 고를 수 있는 대상 (range 안의 다친 자신 · 아군 · 우군)
function healTargets(u, name){
  const d = SKILLS[name], r = d.range || 1;
  return aliveOf('ally').filter(a=>manhattan(a,u) <= r && a.hp < a.maxHp);
}
function castHeal(u, name, t){
  if (SKILLS[name] && SKILLS[name].cutin && !castHeal.cut){                 // 회복 절기도 컷인 (관음천수 등)
    bState.busy = true;
    playCutin(u, name, ()=>{ bState.busy = false; castHeal.cut = true; try { castHeal(u, name, t); } finally { castHeal.cut = false; } });
    return;
  }
  const d = SKILLS[name], ms = (u.mastery && u.mastery[name]) || {};
  bState.skillMode = null; clearHi();
  u.mp -= d.mp;
  const amt = Math.max(1, Math.round(t.maxHp * ((d.heal||0) + (ms.heal||0)))), before = t.hp;
  t.hp = Math.min(t.maxHp, t.hp + amt);
  positionToken(u); positionToken(t);
  showBanner(name); sfx('heal');
  floatNum(t, '+'+(t.hp-before), 'heal');
  t.el.classList.remove('heal'); void t.el.offsetWidth; t.el.classList.add('heal');
  setTimeout(()=>t.el.classList.remove('heal'), 800);
  const ex = gainExp(u, EXP_GAIN.heal || 10);
  toast(u.name+' — '+name+' · '+(t===u ? '자신' : t.name)+' 체력 +'+(t.hp-before)+(ex ? ' · 경험 +'+ex : ''), 1600, [u, t]);
  u.acted = true; u.el.classList.remove('selected'); bState.selected = null;
  autoEndCheck();
}
function castSkill(u, name, x, y){
  const d = SKILLS[name];
  if (!skillArea(name, x, y, u).some(([cx,cy])=>unitAt(cx,cy,'enemy'))){ toast('공격 불가능합니다.'); return; }
  bState.skillMode = null; bState.busy = true;     // 연출 · 반격이 끝날 때까지 다른 조작을 막음
  u.mp -= d.mp; positionToken(u);
  const area = skillArea(name, x, y, u);
  playCutin(u, name, shown=>{                        // 컷인 그림이 있는 무공이면 먼저 연출
  const dir = x>=u.x ? 'lunge-r' : 'lunge-l';
  u.el.classList.add(dir);
  if (!shown) showBanner(name);
  setTimeout(()=>{
    u.el.classList.remove(dir);
    clearHi();
    area.forEach(([cx,cy])=>{ const c=bCells[cx+','+cy]; c.classList.remove('skill-hit'); void c.offsetWidth; c.classList.add('skill-hit'); });
    const targets = area.map(([cx,cy])=>unitAt(cx,cy,'enemy')).filter(Boolean);
    let hits=0, total=0, kills=0;
    const pw = d.power + ((u.mastery && u.mastery[name] && u.mastery[name].power) || 0);     // 숙련(n성)으로 오른 위력
    let adv = 0, dis = 0;
    if (typeof artsSetSkill==='function') artsSetSkill(name, u);                     // 상성 : 무공의 결 (js/arts.js)
    targets.forEach(t=>{ const r = strike(u, t, pw * (u.skillPow || 1), true); if(!r.miss){ hits++; total+=r.dmg; if (r.mu) (r.mu.kind==='adv' ? adv++ : dis++); if(t.hp<=0) kills++; else if (d.poison) applyPoison(t, d.poison); } });   // 내력 : 무공 위력
    if (typeof artsSetSkill==='function') artsSetSkill(null);
    sfx(hits ? 'skill' : 'miss');
    const near = [u].concat(targets);
    if (!targets.length) toast(name+'! 범위 안에 적이 없습니다.');
    else if (!hits) toast(name+'! 모두 피했습니다.', 1300, near);
    else { const ex = gainExp(u, (hits-kills)*EXP_GAIN.hit + kills*EXP_GAIN.kill);
           toast(name+'! '+hits+'명에게 총 '+total+' 데미지'+(adv ? ' · 유리 '+adv : '')+(dis ? ' · 불리 '+dis : '')+(kills?' · '+kills+'명 쓰러뜨림':'')+(ex?' · 경험 +'+ex:''), 1300, near); }
    u.acted = true; u.el.classList.remove('selected'); bState.selected=null;
    const finish = ()=>{ bState.busy = false; checkEnd(); autoEndCheck(); };
    checkEnd(); if (bState.over){ finish(); return; }
    runCounters(u, targets, finish);                 // 맞고 살아남은 적의 반격 (일반 공격과 같은 규칙)
  }, shown ? 320 : 450);
  });
}
/* 반격 : defs 중 살아 있고, 공격한 쪽이 자기 사거리 안에 있는 인물이 차례로 한 번씩 반격. 끝나면 done
   (일반 공격 · 무공 모두. 공격한 쪽이 쓰러지면 거기서 멈춤) */
function runCounters(atk, defs, done){
  const q = defs.slice();
  (function nx(){
    const d = q.shift();
    if (!d || atk.hp<=0 || !COUNTER.on){ done(); return; }
    if (d.hp<=0 || d.noControl || d.fled || !inAttackRange(d, atk)){ nx(); return; }
    const cpow = COUNTER.power * (1 + ((d.passive && d.passive.counterPow) || 0));   // 심법 : 반격 강화
    setTimeout(()=> hitOnce(d, atk, 'counter', cpow, ()=> setTimeout(nx, 150)), 520);
  })();
}
/* 무공 컷인 : SKILLS[name].cutin 그림이 있으면 화면을 가로지르는 그림 + 무공 이름 (누르면 건너뜀)
   설정의 '무공 연출' 을 끄거나 그림이 없으면 바로 done(false) */
const CUTIN_MS = 1250;
function playCutin(u, name, done){
  const d = SKILLS[name] || {};
  let key = d.cutin || '';
  if (key && u && u.key==='hero' && HERO.look==='f') key = (ASSETS.cutin || {})[key+'_f'] ? key+'_f' : '';   // 여자 주인공 : '이름_f' 그림이 있을 때만
  const src = key ? asset('cutin.'+key) : '';
  if (!src || SOUND.cutin===false || !u || (u.side!=='ally' && !isBossRank(u.rank))){ done(false); return; }   // 아군 · 적 대장(rank boss · final) 만
  let el = document.getElementById('cutin');
  if (!el){
    el = document.createElement('div'); el.id = 'cutin';
    el.innerHTML = '<div class="ci-dim"></div><div class="ci-band"><div class="ci-edge"></div><div class="ci-pic"><img alt=""></div><div class="ci-flash"></div></div>'
                 + '<div class="ci-text"><div class="ci-who"></div><div class="ci-name"></div></div>';
    BS.appendChild(el);
  }
  el.classList.toggle('foe', u.side!=='ally');                     // 적 대장의 절기 : 붉은 띠
  const img = el.querySelector('img'); img.src = src; img.style.objectPosition = d.cutinPos || '50% 30%';
  el.querySelector('.ci-who').textContent = u.name;
  el.querySelector('.ci-name').textContent = name;
  el.classList.remove('show','out'); void el.offsetWidth; el.classList.add('show');
  const tst = document.getElementById('b-toast'); if (tst) tst.style.display = 'none';   // '대상을 선택하세요' 같은 알림은 치움
  sfx('cutin');
  let ended = false, timer = null;
  const end = ()=>{
    if (ended) return; ended = true; clearTimeout(timer); el.onclick = null;
    el.classList.add('out');
    setTimeout(()=>{ el.classList.remove('show','out'); done(true); }, 200);
  };
  el.onclick = ev=>{ ev.stopPropagation(); end(); };
  timer = setTimeout(end, CUTIN_MS);
}
(function preloadCutins(){ Object.keys(ASSETS.cutin || {}).forEach(k=>{ const p = asset('cutin.'+k); if (p){ const i = new Image(); i.src = p; } }); })();
function onCellClick(x,y){
  if (bState.over || bState.intro || bState.busy) return;
  if (peekUnit){ hidePeek(); return; }                           // 정보 창이 열려 있으면 먼저 닫기만
  if (!bState.selected){
    if (bState.moving) return;
    const key=x+','+y;
    if (terrainInfoKey===key){ hideTerrainInfo(); return; }
    showTerrainInfo(x,y); return;
  }
  if (bState.turn!=='ally') return;
  if (bState.skillMode){ onSkillTarget(x,y); return; }
  if (bState.itemMode){ onItemTarget(x,y); return; }
  const key = x+','+y; const u = bState.selected;
  if (bState.attackMode){
    const tgt = unitAt(x,y,'enemy');
    if (tgt && bCells[key].classList.contains('atk-range')){ bState.attackMode=false; doAttack(u, tgt); }
    else { closeMenu(true); }
    return;
  }
  if (!bState.moveMode || !bCells[key].classList.contains('reachable')){ closeMenu(true); return; }
  clearHi(); bState.moveMode=false; unitMenu.classList.remove('show');
  u.prevPos = { x:u.x, y:u.y };                                  // 취소하면 돌아갈 자리
  moveAlong(u, x, y, ()=>{ u.moved=true; if (typeof metaOnMove==='function') metaOnMove(u); openMenu(u); });   // 돌발 임무 : 상자 (js/meta.js)
}

// 머리 위로 떠오르는 숫자 / 글자  kind: 'dmg'(피해) · 'miss'(회피) · 'heal'(회복)
function floatNum(u, text, kind, delay){
  if (!u || !u.el || !u.el.parentNode) return;
  const f = document.createElement('div');
  f.className = 'float-num '+(kind||'dmg');
  f.textContent = text;
  f.style.left = ((u.x-1)*B_TILE + B_TILE/2)+'px';
  f.style.top  = ((u.y-1)*B_TILE - 6)+'px';
  if (delay) f.style.animationDelay = delay+'ms';
  u.el.parentNode.appendChild(f);
  setTimeout(()=>f.remove(), 1300 + (delay||0));
}
/* ---------- 인연 (data/units.js 의 BONDS) : 이야기에서 맺어지고, 조건이 맞으면 전투에서 저절로 발동 ---------- */
function bondList(){ return typeof BONDS !== 'undefined' ? BONDS : []; }
function bondOpen(b){ if (!b.from) return false; const i = storyIdx(b.from); return i >= 0 && i < codexPos(); }   // 그 장면을 지났으면 맺어짐
function bondUnit(id){ const u = units[id]; return u && u.side==='ally' && !u.friend && u.hp > 0 && !u.fled ? u : null; }
function bondOn(b, u){                         // 이 전투에서 지금 u 에게 발동하는가
  if (!b.members.includes(u.id) || !bondOpen(b)) return false;
  const others = b.members.filter(id=> id!==u.id).map(bondUnit);
  if (b.when==='deploy') return others.every(Boolean);
  return others.some(o=> o && manhattan(o, u) === 1);                          // adj : 다른 인연 인물이 바로 옆에
}
function bondEffs(u){
  if (!u || u.side!=='ally' || u.friend || !bState) return [];
  return bondList().filter(b=> bondOn(b, u)).map(b=> Object.assign({}, (b.eff||{}).all || {}, (b.eff||{})[u.id] || {}));
}
function bondVal(u, key){ return bondEffs(u).reduce((s,e)=> s + (typeof e[key]==='number' ? e[key] : 0), 0); }
function bondFoe(atk, def){                     // 그 소속의 적에게 주는 피해 +
  const f = typeof UNIT_FACTION !== 'undefined' && def && UNIT_FACTION[def.id]; if (!f) return 0;
  return bondEffs(atk).reduce((s,e)=> s + (e.foe && e.foe.faction===f ? e.foe.pct : 0), 0);
}
// 전투 개시 알림 : 이번 전투에 함께 나온 인연
function bondSummary(){
  const on = [], adj = [];
  bondList().forEach(b=>{ if (!bondOpen(b) || !b.members.every(id=> bondUnit(id))) return; (b.when==='deploy' ? on : adj).push(b.name); });
  if (!on.length && !adj.length) return '';
  return '인연 — ' + on.concat(adj.map(n=> n + ' (이웃하면)')).join(' · ');
}

// 한 번의 타격: 명중률 = 명중 - 회피 / 피해 = 공격×위력(±10%) - 방어×0.5  (지형은 이동에만 영향)
function strike(atk, def, power, quiet){       // quiet = 효과음은 부른 쪽에서 (무공)
  const mu = (typeof artsMatch==='function') ? artsMatch(atk, def) : null;   // 상성 (js/arts.js · data/arts.js)
  const hitChance = Math.max(5, Math.min(99, atk.hit + bondVal(atk,'hit') - def.eva - bondVal(def,'eva') + (mu ? mu.hit : 0)));     // 인연 : 명중 · 회피
  if (Math.random()*100 > hitChance){ floatNum(def, '회피', 'miss'); if (!quiet) sfx('miss'); return { miss:true, hitChance }; }
  const guardDef = (def.guard && def.guard.def) || 0;                       // 방어 무공으로 오른 방어
  const cut = Math.min(0.8, ((def.passive && def.passive.dmgCut) || 0) + bondVal(def,'dmgCut'));   // 심법 · 인연 : 받는 피해 감소
  const up = (1 + bondVal(atk,'atkPct')) * (1 + bondFoe(atk, def));                             // 인연 : 공격 % · 그 소속의 적에게 주는 피해
  const dmg = Math.max(1, Math.round((atk.atk*up*power*(mu ? mu.dmg : 1)*(0.9+Math.random()*0.2) - (def.def+guardDef)*0.5) * (1-cut)));
  def.hp = Math.max(0, def.hp-dmg);
  if (def.hold) def.roused = true;                                          // 대기하던 적은 맞으면 움직이기 시작
  floatNum(def, '-'+dmg, 'dmg'); if (!quiet) sfx('hit');
  if (mu) floatNum(def, mu.kind==='adv' ? '▲유리' : '▼불리', 'mu-'+mu.kind, 140);
  positionToken(def);
  def.el.classList.add('flash','shake');
  setTimeout(()=>def.el.classList.remove('flash','shake'), 320);
  if (def.hp<=0){ def.killedBy = atk.id; def.el.classList.add('dead'); setTimeout(()=>{ def.el.style.display='none'; }, 900); }   // killedBy : 임무 '처치' 판정
  if (typeof metaOnHit==='function') metaOnHit(atk, def, dmg);              // 기록 · 돌발 임무 (js/meta.js)
  return { miss:false, dmg, hitChance, mu };
}
// 한 번 치기 (연출 + 피해 + 경험치). kind = 'attack' | 'counter'
function hitOnce(atk, def, kind, power, done){
  const dir = def.x>=atk.x ? 'lunge-r' : 'lunge-l';
  atk.el.classList.add(dir);
  setTimeout(()=>{
    atk.el.classList.remove(dir);
    const r = strike(atk, def, power);
    const label = kind==='counter' ? '의 반격! ' : '의 공격! ';
    if (r.miss) toast((kind==='counter' ? atk.name+'의 반격 — ' : '')+def.name+' 회피! (명중률 '+r.hitChance+'%)', 1400, [atk, def]);
    else {
      const ex = gainExp(atk, def.hp<=0 ? EXP_GAIN.kill : (kind==='counter' ? EXP_GAIN.counter : EXP_GAIN.hit));
      toast(atk.name+label+def.name+'에게 '+r.dmg+' 데미지'+(r.mu ? ' ('+r.mu.label+')' : '')+(def.hp<=0?' · 쓰러뜨림':'')+(ex?' · 경험 +'+ex:''), 1400, [atk, def]);
    }
    if (done) done();
  }, 220);
}
// 일반 공격 → (살아남으면) 반격. 끝나면 done
function doAttack(atk, def, done){
  if (atk===bState.selected){ atk.el.classList.remove('selected'); bState.selected = null; }
  clearHi();
  atk.acted = true; bState.busy = true;          // 공격·반격 연출 중에는 다른 조작을 막음
  hitOnce(atk, def, 'attack', 1, ()=>{
    const finish = ()=>{
      bState.busy = false; atk.el.classList.remove('selected');
      checkEnd(); autoEndCheck();
      if (done) done();
    };
    runCounters(atk, [def], finish);               // 반격도 자기 사거리 안일 때만
  });
}

function scheduleEndTurn(ms){
  const ph = bState.phase;                       // 예약한 시점의 턴 번호
  clearTimeout(bState.endTimer);
  bState.endTimer = setTimeout(()=>{ if (bState.phase===ph && !bState.over) endTurn(); }, ms);
}
function autoEndCheck(){
  if (bState.over) return;
  if (bState.turn==='ally' && aliveOf('ally').every(u=>u.acted)) scheduleEndTurn(450);
}
function checkEnd(){
  if (bState.over) return;
  missionDeathCheck();
  const lose = (curBattle.loseIfDown||[]).map(k=>units[k]).find(u=>u && u.hp<=0);
  if ((lose || aliveOf('ally').length===0) && curBattle.lossOk){ scriptedLoss(false); return; }
  if (lose){ bState.over = true; setTimeout(()=>{ toast(lose.name+josa(lose.name,'이','가')+' 쓰러졌습니다', 1600); showResult('패 배'); }, 700); return; }
  if (aliveOf('ally').length===0){ bState.over=true; setTimeout(()=>showResult('패 배'),700); return; }
  const en = aliveOf('enemy');
  const v = curBattle.victory || {};
  const bossKeys = v.bossDown ? [].concat(v.bossDown) : [];                                          // 'e1' 또는 ['e1','e2'] (모두 쓰러뜨려야)
  if (bossKeys.length && bossKeys.every(k=> units[k] && units[k].hp<=0 && !units[k].fled)){        // 우두머리를 쓰러뜨리면 승리 (패퇴 · 제압)
    bState.over = true; setTimeout(()=>startVictorySeq(null), 900); return;
  }
  if (v.enemiesLeft!==null && v.enemiesLeft!==undefined && en.length <= v.enemiesLeft){
    bState.over = true; const last = en[0] || null; setTimeout(()=>startVictorySeq(last), 900);
  }
}
function unitKey(u){ return Object.keys(units).find(k=>units[k]===u); }
// 이야기 순서로 몇 번째 전투인지 (1부터, 지는 전투 lossOk 는 세지 않음) — 금전상자 개수
function battleOrderNo(id){
  const list = storyOrder().filter(k=>k.startsWith('battle:')).map(k=>k.slice(7)).filter(b=> BATTLES[b] && !BATTLES[b].lossOk);
  const i = list.indexOf(id); return i >= 0 ? i + 1 : 1;
}
function startVictorySeq(last){
  closeMenu(true); hideTerrainInfo(); clearTimeout(bState.endTimer);
  document.getElementById('b-end-turn').classList.add('hidden');
  const v = curBattle.victory || {};
  const lineOk = L=>{ const c = L.if; if (!c) return true;
    if (c.fled)    return !!(units[c.fled] && units[c.fled].fled);
    if (c.notFled) return !(units[c.notFled] && units[c.notFled].fled);
    return true; };
  const talk = ()=> runBattleDialog((v.talk || []).filter(lineOk), showBattleSummary);
  const rv = v.retreat, who = rv && rv.who ? units[rv.who] : last;
  // 남은 적이 모두 물러남 (retreat.all)
  const leaveAll = (done)=>{
    const rest = aliveOf('enemy'); if (!(rv && rv.all) || !rest.length){ done(); return; }
    toast((rv && rv.msg) || '남은 적들이 물러납니다.', 1300);
    rest.forEach(u=>{ u.el.style.transition = 'opacity .6s ease'; u.el.style.opacity = '0'; });
    setTimeout(()=>{ rest.forEach(u=>{ u.el.style.display = 'none'; u.retreated = true; u.hp = 0; u.fled = true; }); done(); }, 700);
  };
  if (who && rv && !who.fled){
    const say = ()=> runBattleDialog([{ who:unitKey(who), text:rv.line }], ()=>
      who.hp>0 && rv.to ? retreatUnit(who, rv.to[0], rv.to[1], ()=>leaveAll(talk)) : leaveAll(talk));
    say();
  } else if (rv && rv.all && !rv.who) leaveAll(talk);     // 우두머리 없이 남은 적만 물러남 (예: 제압 승리)
  else talk();
}
// 이동력 제한 없이 목표 칸까지의 길 찾기
function fullPath(u, tx, ty){
  const occ = new Set(Object.values(units).filter(o=>o!==u && o.hp>0).map(o=>o.x+','+o.y));
  const start = u.x+','+u.y, goal = tx+','+ty, prev = {}; prev[start] = null;
  const q = [[u.x,u.y]];
  while (q.length){
    const [cx,cy] = q.shift(); if (cx+','+cy===goal) break;
    for (const [dx,dy] of DIRS){
      const nx=cx+dx, ny=cy+dy, k=nx+','+ny;
      if (!inBounds(nx,ny) || k in prev || occ.has(k) || terrainData(nx,ny).cost>=99) continue;
      prev[k] = cx+','+cy; q.push([nx,ny]);
    }
  }
  if (!(goal in prev)) return [];
  const path = []; let cur = goal;
  while (cur && cur!==start){ path.unshift(cur.split(',').map(Number)); cur = prev[cur]; }
  return path;
}
function retreatUnit(u, tx, ty, done, msg){
  bState.intro = true;
  const path = fullPath(u, tx, ty); let i = 0;
  toast(msg || (u.name+josa(u.name,'이','가')+' 물러납니다.'), 1500);
  (function step(){
    if (i < path.length){
      u.x = path[i][0]; u.y = path[i][1]; i++;
      positionToken(u); if (cam.zoom) camTo(u);
      setTimeout(step, 150); return;
    }
    u.el.style.transition = 'opacity .6s ease'; u.el.style.opacity = '0';
    setTimeout(()=>{ u.el.style.display = 'none'; u.retreated = true; u.hp = 0; u.fled = true; if (done) done(); }, 650);
  })();
}
function showBattleSummary(){
  bState.intro = true;
  const v = curBattle.victory || {};
  const kills = Object.values(units).filter(u=>u.side==='enemy' && u.hp<=0 && !u.fled).length;
  const fled  = Object.values(units).filter(u=>u.side==='enemy' && u.fled).length;
  // 집무실 임무 : 조건을 채웠으면 완료 + 보상, 못 채웠으면 실패
  const mres = battleMissions().map(id=>{ const ok = missionOk(id); PLAYER.missions[id] = ok ? 'done' : 'failed'; return { id, ok }; });
  const mRw = mres.filter(r=>r.ok).map(r=>missionDB()[r.id].reward || {});
  const mExp = mRw.reduce((a,r)=>a+(r.exp||0), 0);
  mRw.forEach(r=>{ if (r.gold) PLAYER.gold += r.gold; if (r.suryeon) PLAYER.suryeon = (PLAYER.suryeon||0) + r.suryeon; if (r.item) for (let k=0;k<(r.n||1);k++) addToBag(r.item); });
  // 경험치 보상 : 출전한 아군 모두
  const mine = Object.values(units).filter(u=>u.side==='ally' && !u.friend);
  const expRows = mine.map(u=>{
    const st = memberState(u.key); const lv0 = st.level, ex0 = st.exp||0;
    if ((v.exp||0) + mExp) grantExp(u.key, (v.exp||0) + mExp);
    const total = (bState.expBy[u.key]||0) + ((st.level-lv0)*EXP_MAX + (st.exp||0) - ex0);   // 벽에 막힌 양은 빼고
    const a = ascendInfo(u.key);
    const note = a.ok ? ' · <span class="wall">경지 상승 가능 (훈련장 · 전투 중 승급)</span>' : (atWall(u.key) && st.exp >= EXP_MAX ? ' · <span class="wall">경지의 벽</span>' : '');
    return u.name+' +'+total+'<small>Lv '+st.level+(st.level>lv0?' ▲':'')+' · '+st.exp+'/'+EXP_MAX+note+'</small>';
  });
  // 출전하지 못한 아군 (대기) : 승리 경험치의 절반
  const benchExp = curBattle.lossOk ? 0 : Math.floor(((v.exp||0) + mExp) / 2);
  const bench = PARTY.filter(id=> !mine.some(u=> u.key===id));
  if (benchExp && bench.length){ bench.forEach(id=> grantExp(id, benchExp)); expRows.push('<span class="bench">대기 ' + bench.map(nameOf).join(' · ') + ' +' + benchExp + '</span>'); }
  if (v.gold) PLAYER.gold += v.gold;
  if (v.suryeon) PLAYER.suryeon = (PLAYER.suryeon||0) + v.suryeon;
  PLAYER.trainCnt = {};                                  // 새 정비 : 인물마다 수련 횟수가 다시 채워짐
  // 전리품 : '목검' 또는 { item:'금창약', n:3 } — 모든 전투 공통 전리품(data/battles.js 의 BATTLE_COMMON_LOOT)을 앞에
  const common = (typeof BATTLE_COMMON_LOOT !== 'undefined' && !curBattle.lossOk && !v.noCommonLoot) ? BATTLE_COMMON_LOOT : [];
  const loot = [], lost = [];
  common.concat(v.loot || []).forEach(L=>{                   // 같은 물건은 하나로 합침 (금창약 2 + 3 → 금창약 ×5)
    const o = typeof L==='string' ? { item:L, n:1 } : { item:L.item, n: L.n==='order' ? battleOrderNo(curBattleId) : (L.n||1) };
    const same = loot.find(x=>x.item===o.item); if (same) same.n += o.n; else loot.push(o);
  });
  loot.forEach(L=>{ for (let k=0;k<L.n;k++) if (!addToBag(L.item)){ lost.push(L.item); break; } });
  document.getElementById('bs-kills').innerHTML = kills+'명'+(fled ? '<small>퇴각 '+fled+'명</small>' : '');
  document.getElementById('bs-exp').innerHTML = expRows.join('<br>') || '0';
  document.getElementById('bs-gold-row').style.display = v.gold ? '' : 'none';
  document.getElementById('bs-gold').textContent = (v.gold||0).toLocaleString()+' 금';
  document.getElementById('bs-sr-row').style.display = v.suryeon ? '' : 'none';
  document.getElementById('bs-sr').innerHTML = (v.suryeon||0).toLocaleString()+'<small>보유 '+(PLAYER.suryeon||0).toLocaleString()+'</small>';
  document.getElementById('bs-loot').innerHTML = (loot.length ? loot.map(L=> L.item+(L.n>1 ? ' ×'+L.n : '')).join(', ') : '없음')+(loot.length ? '<small>'+(lost.length ? '배낭이 가득 차 '+lost.join(', ')+' 버림' : '→ 배낭에 넣었습니다')+'</small>' : '');
  document.getElementById('bs-mission-row').style.display = mres.length ? '' : 'none';
  document.getElementById('bs-mission').innerHTML = mres.map(r=>{ const m = missionDB()[r.id];
    return m.title+' '+(r.ok ? '<span class="mok">완료</span><small>'+rewardText(m.reward)+'</small>' : '<span class="mfail">실패</span>'); }).join('<br>');
  if (typeof metaOnVictory==='function') metaOnVictory();                  // 기록 · 돌발 임무 보상 · 업적 (js/meta.js)
  document.getElementById('b-summary').style.display = 'flex';
}
/* ---------- 임무 (전투 중) ---------- */
// 이번 전투에서 수락한 임무
function battleMissions(){ return curBattleId ? missionsFor(curBattleId).filter(id=>missionState(id)==='taken') : []; }
// 진행 : 'ok'(달성) · 'fail'(실패) · ''(아직)
function missionProgress(id){
  const c = missionDB()[id].cond, p = bState.mission || {};
  if (p[id]) return p[id];
  if (c.type==='turns')  return bState.turnCount > c.n ? 'fail' : '';
  if (c.type==='noDown') return Object.values(units).some(u=>u.side==='ally' && !u.friend && u.hp<=0) ? 'fail' : '';
  if (c.type==='keep'){ const t = [].concat(c.target); return Object.values(units).some(u=>u.side==='ally' && t.includes(u.id) && u.hp<=0) ? 'fail' : ''; }
  if (c.type==='few')    return Object.values(units).filter(u=>u.side==='ally' && !u.friend && (u.key==='hero' || isParty(u.id))).length > c.n ? 'fail' : '';
  return '';
}
// 승리했을 때 완료인지
function missionOk(id){ const c = missionDB()[id].cond, p = missionProgress(id); return p!=='fail' && ((c.type!=='talk' && c.type!=='kill') || p==='ok'); }
function renderMissionHud(){
  const el = document.getElementById('b-mission'); if (!el) return;
  el.innerHTML = battleMissions().map(id=>{ const m = missionDB()[id], p = missionProgress(id);
    return '<div class="'+p+'">임무 · '+m.goal+(p==='ok' ? ' ✓' : p==='fail' ? ' ✗ 실패' : '')+'</div>'; }).join('') + (typeof metaHudLines==='function' ? metaHudLines() : '');
}
// 이 아군이 지금 대화할 수 있는 상대 [{ id(임무), e(적 유닛) }]
function talkTargets(u){
  const out = [];
  battleMissions().forEach(id=>{
    const c = missionDB()[id].cond;
    if (c.type!=='talk' || (bState.mission||{})[id] || !(c.by || ['hero']).includes(u.id)) return;
    aliveOf('enemy').filter(e=>e.id===c.target && manhattan(e,u)===1).forEach(e=> out.push({ id, e }));
  });
  return out;
}
function doTalk(u, e, id){
  const m = missionDB()[id];
  const lines = (m.cond.talk || []).map(L=> Object.assign({}, L, { who: L.who==='by' ? u.key : L.who==='target' ? e.key : L.who }));
  u.prevPos = null;                                   // 대화한 뒤에는 이동 취소 불가
  runBattleDialog(lines, ()=>{
    bState.mission[id] = 'ok';
    bState.intro = false; document.getElementById('b-end-turn').classList.remove('hidden');
    renderMissionHud(); sfx('levelup');
    hint('임무 달성 — '+m.title+' (승리하면 보상)', 2000);
    // 대화는 행동을 쓰지 않음 → 메뉴를 다시 열어 이동 · 공격 · 무공 · 대기를 이어서 (이동 취소는 불가)
    if (u.hp>0 && !u.acted && !bState.over) setTimeout(()=>{ if (bState.turn==='ally' && !bState.over) openMenu(u); }, 350);
  });
}
// 대화 상대가 대화 전에 쓰러지거나 물러나면 실패
function missionDeathCheck(){
  let failed = null;
  let done = null;
  battleMissions().forEach(id=>{
    const c = missionDB()[id].cond;
    if ((c.type!=='talk' && c.type!=='kill') || (bState.mission||{})[id]) return;
    const all = Object.values(units).filter(e=>e.id===c.target && e.side==='enemy');
    if (!all.length || !all.every(e=>e.hp<=0)) return;
    if (c.type==='kill' && all.some(e=> !e.fled && (c.by || ['hero']).includes(e.killedBy))){ bState.mission[id] = 'ok'; done = missionDB()[id]; }
    else { bState.mission[id] = 'fail'; failed = missionDB()[id]; }
  });
  if (failed) setTimeout(()=>toast('임무 실패 — '+failed.title, 1800), 900);
  if (done){ sfx('levelup'); setTimeout(()=>hint('임무 달성 — '+done.title+' (승리하면 보상)', 2000), 900); }
  renderMissionHud();
}
document.getElementById('bs-next').addEventListener('click', ()=> leaveBattle(true));
// 전투를 마치고 다음 장면으로 (askSave : 저장할지 묻기)
function leaveBattle(askSave){
  const next = resolveNext(curBattle.victory && curBattle.victory.next);
  const hasNext = !!(next && SCENES[next]);
  const to = hasNext ? SCENES[next] : null, from = SCENES[curScene] || {};
  const newChapter = !!(to && to.chapter && to.chapter !== from.chapter);      // 전투 뒤 장이 바뀌면 검은 화면에 장 제목
  const card = document.getElementById('chapter-card');
  const go = ()=> fadeSwap(()=>{
    document.getElementById('b-summary').style.display = 'none';
    if (newChapter){ card.innerHTML = '<b>'+to.chapter+'</b><span>'+(to.title || to.place || '')+'</span>'; card.classList.add('on'); }
    if (hasNext) startScene(next); else goStoryEnd(curScene);
    if (newChapter){ storyBusy = true; clearInterval(typeTimer); storyTextSpan.textContent = ''; }
  }, ()=>{
    if (newChapter) setTimeout(()=>{ card.classList.remove('on'); setTimeout(()=>{ storyBusy = false; showLine(0); }, 650); }, 1900);
  });
  if (!askSave){ go(); return; }
  askConfirm('전투에서 승리했습니다. 저장하시겠습니까?',
    ()=> openSaveModal('save', { scene: hasNext ? next : curScene, pos: hasNext ? 'start' : 'end', onClose: go }),
    go, '저장하기', '저장 안 함');
}
// 지기로 정해진 전투 (data/battles.js 의 lossOk) : 주인공이 쓰러지거나 턴이 다 되면 게임 오버 없이 다음 장면(victory.next)으로
//   byTurn : 턴이 다 돼서 → lossOk.finisher 대사 뒤 주인공이 쓰러짐
function scriptedLoss(byTurn){
  if (bState.lossDone) return; bState.lossDone = true; bState.over = true;
  closeMenu(true); hideTerrainInfo(); clearTimeout(bState.endTimer);
  document.getElementById('b-end-turn').classList.add('hidden');
  const L = curBattle.lossOk || {}, h = units.hero;
  const fall = ()=>{
    if (h && h.hp>0){ h.hp = 0; positionToken(h); h.el.classList.add('dead'); setTimeout(()=>{ h.el.style.display = 'none'; }, 900); }
    setTimeout(()=>{ toast((h ? h.name+josa(h.name,'이','가')+' ' : '')+'쓰러졌습니다…', 1600); }, 500);
    setTimeout(()=> leaveBattle(false), 2300);
  };
  if (byTurn && L.finisher && L.finisher.length) runBattleDialog(L.finisher, fall); else fall();
}
function showResult(t){ document.getElementById('b-result-text').textContent=t; document.getElementById('b-result').style.display='flex'; }
document.getElementById('b-retry').addEventListener('click', ()=>{ restoreBattleStart(); resetBattle(false); });

// 턴 종료 버튼 → 확인 창 (아직 행동하지 않은 인물 수도 알려 줌)
document.getElementById('b-end-turn').addEventListener('click', ()=>{
  if (bState.over || bState.busy || bState.turn!=='ally' || bState.intro) return;
  const left = aliveOf('ally').filter(u=>!u.noControl && !u.acted).length;
  askConfirm('턴을 끝내겠습니까?' + (left ? '\n아직 행동하지 않은 인물이 '+left+'명 있습니다.' : ''), ()=>{
    if (bState.over || bState.busy || bState.turn!=='ally' || bState.intro) return;
    closeMenu(true); endTurn();
  }, null, '턴 종료', '취소');
});

function endTurn(){
  clearTimeout(bState.endTimer);
  bState.phase++;                                 // 턴이 바뀔 때마다 번호 증가 → 이전 예약은 무효
  clearHi(); hideTerrainInfo();
  unitMenu.classList.remove('show');
  if (bState.selected) bState.selected.el.classList.remove('selected');
  bState.selected=null;
  if (bState.turn==='ally'){
    bState.turn='enemy'; document.getElementById('b-turn-name').textContent='적 턴';
    document.getElementById('b-end-turn').classList.add('hidden');
    showBanner('적 턴');
    const ph = bState.phase;
    setTimeout(()=>{ if (bState.phase===ph) enemyTurn(); }, 500);
  } else {
    bState.turn='ally'; bState.turnCount++;
    if (bState.turnCount > curBattle.turnLimit){
      if (curBattle.lossOk){ bState.turnCount = curBattle.turnLimit; scriptedLoss(true); return; }   // 지기로 정해진 전투 : 버텨도 마지막 일격
      if ((curBattle.victory || {}).survive){                               // n턴 버티기 → 승리
        bState.over = true; bState.turnCount = curBattle.turnLimit; document.getElementById('b-turn').textContent = curBattle.turnLimit;
        toast(curBattle.turnLimit+'턴을 버텨 냈습니다!', 1600);
        setTimeout(()=>startVictorySeq(null), 1100); return;
      }
      bState.over=true; toast(curBattle.turnLimit+'턴 초과 - 패배',1400);
      setTimeout(()=>showResult('패 배'),1200); return;
    }
    document.getElementById('b-turn').textContent = bState.turnCount;
    renderMissionHud();
    document.getElementById('b-turn-name').textContent='아군 턴';
    Object.values(units).forEach(u=>{ u.acted=false; u.moved=false; u.prevPos=null; });
    const begin = ()=>{
      if (bState.over) return;
      document.getElementById('b-end-turn').classList.remove('hidden');
      showBanner('아군 턴'); allyTurnStart(); battleCheckpoint();
      const a0 = (units.hero && units.hero.hp>0) ? units.hero : aliveOf('ally')[0]; if (a0 && cam.zoom) camTo(a0);
    };
    const evs = (curBattle.events||[]).filter(e=>e.turn===bState.turnCount && !bState.fired.includes(e) && eventReady(e));
    if (evs.length){ document.getElementById('b-end-turn').classList.add('hidden'); runEvents(evs, begin); }
    else begin();
  }
}
/* ---------- 전투 이벤트 (data/battles.js 의 events) ---------- */
// 쓰러뜨린 적 수 (도망 · 퇴각은 빼고)
function enemyKills(){ return Object.values(units).filter(u=>u.side==='enemy' && u.hp<=0 && !u.fled).length; }
// 이벤트 조건 : ifKills — 그 턴에 쓰러뜨린 적이 이 수 이상이어야 일어남 (모자라면 그냥 지나감)
function eventReady(e){ return !(e.ifKills && enemyKills() < e.ifKills); }
function runEvents(list, done){
  const ev = list.shift(); if (!ev){ done(); return; }
  bState.fired.push(ev);
  runEvent(ev, ()=> runEvents(list, done));
}
function runEvent(ev, done){
  bState.intro = true;
  let arrival = null;
  if (ev.spawn){
    const made = ev.spawn.map(sp=>{ const c = freeCellNear(sp.x, sp.y); return c ? addEnemy(Object.assign({}, sp, { x:c[0], y:c[1] }), 'e'+(++bState.enemySeq)) : null; }).filter(Boolean);
    made.forEach(u=> u.el.classList.add('spawn'));
    arrival = made[0];
    if (made.length) toast('적 증원 '+made.length+'명!', 1500);
  }
  if (ev.arrive){
    const A = ev.arrive, d = UNITS[A.id], c = freeCellNear(A.x, A.y) || [A.x, A.y];
    if (d.party){                                     // 합류한 아군 : 자기 레벨 · 장비 · 수련 그대로 (이번 턴부터 바로 행동)
      if (!isParty(A.id)) joinParty(A.id, true);        // 이야기를 건너뛴 저장 등
      arrival = units[A.id] = makeAlly(A.id, c[0], c[1]);
      arrival.acted = false;
    } else if (A.control){                            // 조종할 수 있는 우군으로 참전 (이번 턴부터 바로 행동)
      arrival = units[A.id] = makeAlly(A.id, c[0], c[1], { level:resolveLevel(A.level, d.level) });
      arrival.acted = false;
    } else {                                          // 이벤트 인물 (조종 불가)
      arrival = units[A.id] = makeUnit({ key:A.id, id:A.id, x:c[0], y:c[1], side:'ally', friend:true, noControl:true,
                                         name:d.name, job:d.job, level:resolveLevel(A.level, d.level), move:d.move, faceSrc:faceOf(A.id) });
      arrival.acted = true;
    }
    arrival.el.classList.add('spawn');
  }
  // strike : 나타난 인물(by)이 적 하나를 단숨에 쓰러뜨림 — 대사의 who:'target' = 그 적 (ids 중 by 와 가장 가까운 산 적)
  const S = ev.strike, sBy = S && (S.by==='arrival' ? arrival : units[S.by]);
  const target = (S && sBy) ? aliveOf('enemy').filter(u=> (!S.ids || S.ids.includes(u.id)) && !(S.exclude||[]).includes(u.key))
                                               .sort((a,b)=> manhattan(a,sBy) - manhattan(b,sBy))[0] || null : null;
  // 대사 : who:'arrival' · 'target' 을 실제 인물로. 쓰러진 인물의 줄은 or 의 인물이 대신 (없으면 건너뜀). needTarget = 쓰러뜨릴 적이 있을 때만
  const resolve = w=> w==='arrival' ? (arrival && arrival.key) : w==='target' ? (target && target.key) : w;
  const alive = k=> !(units[k] && units[k].hp<=0);
  const mapLines = list=> (list||[]).filter(L=> !L.needTarget || target).map(L=>{
    let w = resolve(L.who); if (w && !alive(w) && L.or) w = resolve(L.or);
    if (!w || !alive(w)) return null;
    return w===L.who ? L : Object.assign({}, L, { who:w });
  }).filter(Boolean);
  const talk = mapLines(ev.talk);
  const doStrike = next=>{
    if (!target || !sBy || sBy.hp<=0 || target.hp<=0){ next(); return; }
    if (cam.zoom) camTo(target);
    const dir = target.x>=sBy.x ? 'lunge-r' : 'lunge-l';
    sBy.el.classList.add(dir);
    setTimeout(()=>{
      sBy.el.classList.remove(dir);
      const dmg = target.hp; target.hp = 0; if (target.hold) target.roused = true;
      floatNum(target, '-'+dmg, 'dmg'); sfx('hit'); positionToken(target);
      target.el.classList.add('flash','shake'); setTimeout(()=> target.el.classList.remove('flash','shake'), 320);
      target.killedBy = sBy.id; target.el.classList.add('dead'); setTimeout(()=>{ target.el.style.display = 'none'; }, 900);
      toast(sBy.name + (S.label || '의 일격!') + ' ' + target.name + josa(target.name,'이','가') + ' 쓰러졌습니다', 1500, [sBy, target]);
      setTimeout(next, 1000);
    }, 260);
  };
  const finish = ()=>{
    if (ev.goal){ bState.goalText = ev.goal; document.getElementById('b-goal').textContent = ev.goal; }
    const end = ()=>{ bState.intro = false; checkEnd(); if (!bState.over) done(); };
    const leave = ()=>{                              // leave : 그 인물이 전장을 떠남 (쓰러진 것으로 치지 않음)
      const L = ev.leave, u = L && units[L.who];
      if (u && u.hp>0){ retreatUnit(u, L.to[0], L.to[1], end, L.msg); return; }
      end();
    };
    const at = mapLines(ev.afterTalk);
    if (at.length) runBattleDialog(at, leave); else leave();
  };
  const after = ()=> doStrike(after2);
  const after2 = ()=>{
    if (ev.ultimate){ castUltimate(ev.ultimate, ()=> ev.victory ? eventVictory() : (bState.intro=false, done())); return; }
    if (ev.victory){ eventVictory(); return; }
    if (ev.flee){                                   // 그 적이 전장을 떠남 (쓰러뜨린 것으로 치지 않음)
      const u = units[ev.flee.who];
      if (u && u.hp>0){ retreatUnit(u, ev.flee.to[0], ev.flee.to[1], finish); return; }
    }
    finish();
  };
  if (arrival && cam.zoom) camTo(arrival);
  setTimeout(()=> runBattleDialog(talk, after), arrival ? 700 : 0);
}
// (x,y) 에서 가장 가까운 빈 칸 (이동 가능한 지형)
function freeCellNear(x, y){
  const seen = new Set([x+','+y]), q = [[x,y]];
  while (q.length){
    const [cx,cy] = q.shift();
    if (inBounds(cx,cy) && terrainData(cx,cy).cost<99 && !unitAt(cx,cy)) return [cx,cy];
    DIRS.forEach(([dx,dy])=>{ const k=(cx+dx)+','+(cy+dy); if (!seen.has(k) && inBounds(cx+dx,cy+dy)){ seen.add(k); q.push([cx+dx,cy+dy]); } });
  }
  return null;
}
// 이벤트 무공 (적 전원) — 무공 컷인 (data/skills.js 의 cutin) → 적 전원 피격 → 한 명이 대사 →
//   fallLine 이면 적이 모두 쓰러짐 / retreatLine 이면 모두 물러남. lineBy = 대사할 적 (쓰러졌으면 남은 적 중 첫째)
function castUltimate(ult, done){
  const caster = units[ult.by];
  playCutin(caster, ult.name, played=>{
    const foes = aliveOf('enemy');
    if (caster){ caster.el.classList.add('lunge-l'); setTimeout(()=>caster.el.classList.remove('lunge-l'), 300); }
    if (!played) showBanner(ult.name);
    sfx('skill');
    BS.classList.remove('ult-flash'); void BS.offsetWidth; BS.classList.add('ult-flash');
    foes.forEach(f=>{
      const c = bCells[f.x+','+f.y]; if (c){ c.classList.remove('skill-hit'); void c.offsetWidth; c.classList.add('skill-hit'); }
      f.el.classList.add('flash','shake');
    });
    setTimeout(()=>{
      foes.forEach(f=> f.el.classList.remove('flash','shake'));
      if (!foes.length){ done(); return; }
      const sp = (ult.lineBy && units[ult.lineBy] && units[ult.lineBy].hp>0) ? units[ult.lineBy] : foes[0];
      runBattleDialog([{ who:unitKey(sp), text:ult.fallLine || ult.retreatLine }], ()=>{
        bState.intro = true;
        if (ult.fallLine){                                   // 모두 쓰러짐
          foes.forEach(f=>{ f.el.classList.add('flash','shake'); });
          setTimeout(()=>{ foes.forEach(f=>{ f.el.classList.remove('flash','shake'); f.hp = 0; f.killedBy = caster ? caster.id : null; f.el.classList.add('dead'); }); sfx('hit'); }, 320);
          setTimeout(()=>{ foes.forEach(f=>{ f.el.style.display = 'none'; }); done(); }, 1300);
          return;
        }
        foes.forEach(f=>{ f.el.style.transition = 'opacity .8s ease, transform .8s ease'; f.el.style.opacity = '0'; f.el.style.transform = 'translateY(40px)'; });
        setTimeout(()=>{ foes.forEach(f=>{ f.el.style.display = 'none'; f.hp = 0; f.fled = true; }); done(); }, 900);
      });
    }, 1000);
  });
}
function eventVictory(){
  bState.over = true;
  startVictorySeq(null);
}

// (tx,ty) 까지의 실제 이동 비용 지도 (지형 고려, 유닛은 무시)
function pathField(t){
  const D = {}, k0 = t.x+','+t.y; D[k0] = 0;
  const open = [[0, t.x, t.y]];
  while (open.length){
    let bi = 0; for (let i=1;i<open.length;i++) if (open[i][0] < open[bi][0]) bi = i;
    const [d, x, y] = open.splice(bi,1)[0];
    if (d > D[x+','+y]) continue;
    const enter = (x===t.x && y===t.y) ? 0 : terrainData(x,y).cost;     // (x,y) 로 들어가는 비용
    DIRS.forEach(([dx,dy])=>{
      const nx = x+dx, ny = y+dy, k = nx+','+ny;
      if (!inBounds(nx,ny) || terrainData(nx,ny).cost>=99) return;
      const nd = d + enter;
      if (D[k]===undefined || nd < D[k]){ D[k] = nd; open.push([nd, nx, ny]); }
    });
  }
  return D;
}
// 적이 지금 자리에서 쓸 수 있는 가장 좋은 무공 { name, x, y, score } (없으면 null)
function enemySkillPick(e){
  let best = null;
  (e.skills || []).forEach(name=>{
    const d = SKILLS[name]; if (!d || d.area==='self' || d.area==='ally' || (e.mp||0) < d.mp) return;
    const foesIn = cells => cells.map(([x,y])=>unitAt(x,y,'ally')).filter(f=>f && !f.noControl);
    const consider = (x, y)=>{
      const list = foesIn(skillArea(name, x, y, e)); if (!list.length) return;
      const sc = list.reduce((a,f)=>{ const dm = Math.max(1, e.atk*d.power*(typeof artsDmgMul==='function' ? artsDmgMul(e, f, name) : 1) - f.def*0.5); return a + Math.min(f.hp, dm) + (dm >= f.hp ? 200 : 0) + ((e.focus||[]).includes(f.id) ? 150 : 0)
                                                 + (d.poison && !f.poison ? d.poison.dmg * d.poison.turns * 0.6 : 0); }, 0);   // 중독 : 아직 안 걸린 상대를 노림
      if (!best || sc > best.score) best = { name, x, y, score:sc };
    };
    if (dirSkill(d)) DIRS.forEach(([dx,dy])=>consider(e.x+dx, e.y+dy));
    else skillRangeCells(e, name).forEach(([x,y])=>{ if (unitAt(x,y,'ally') || d.area==='volley3') consider(x,y); });
  });
  return best;
}
// 적 대장(rank boss) 의 절기 : 컷인 그림이 있으면 먼저 연출 (data/jeolgi.js)
function enemyCast(e, name, x, y, done){
  const d = SKILLS[name] || {};
  if (isBossRank(e.rank) && d.cutin) playCutin(e, name, ()=> enemyCastNow(e, name, x, y, done));
  else enemyCastNow(e, name, x, y, done);
}
function enemyCastNow(e, name, x, y, done){
  const d = SKILLS[name];
  e.mp -= d.mp; positionToken(e);
  const area = skillArea(name, x, y, e);
  const dir = x>=e.x ? 'lunge-r' : 'lunge-l';
  e.el.classList.add(dir); showBanner(name);
  area.forEach(([cx,cy])=>{ const c = bCells[cx+','+cy]; if (c) c.classList.add('skill-area'); });
  setTimeout(()=>{
    e.el.classList.remove(dir); clearHi();
    area.forEach(([cx,cy])=>{ const c = bCells[cx+','+cy]; if (!c) return; c.classList.remove('skill-hit'); void c.offsetWidth; c.classList.add('skill-hit'); });
    const targets = area.map(([cx,cy])=>unitAt(cx,cy,'ally')).filter(t=>t && !t.noControl);
    let hits = 0, total = 0, kills = 0;
    let poisoned = 0;
    if (typeof artsSetSkill==='function') artsSetSkill(name, e);
    targets.forEach(t=>{ const r = strike(e, t, d.power, true); if (!r.miss){ hits++; total += r.dmg; if (t.hp<=0) kills++; else if (d.poison){ applyPoison(t, d.poison); poisoned++; } } });
    if (typeof artsSetSkill==='function') artsSetSkill(null);
    sfx(hits ? 'skill' : 'miss');
    toast(e.name+' — '+name+'! '+(hits ? hits+'명에게 총 '+total+' 데미지'+(kills ? ' · '+kills+'명 쓰러짐' : '')+(poisoned ? ' · 중독 ('+d.poison.turns+'턴 동안 체력 -'+d.poison.dmg+')' : '') : '모두 피했습니다'), 1700, [e].concat(targets));
    checkEnd();
    if (bState.over){ setTimeout(done, 650); return; }
    setTimeout(()=> runCounters(e, targets, ()=>{ checkEnd(); setTimeout(done, 350); }), 300);   // 맞고 살아남은 아군 · 우군의 반격
  }, 600);
}
function enemyTurn(){
  if (bState.over) return;
  poisonTick(aliveOf('enemy'));                     // 적 턴 시작 : 중독 피해
  aliveOf('enemy').forEach(u=>{                     // 적 턴 시작 : 심법 회복 (내공 · 체력)
    const p = u.passive; if (!p) return;
    if (p.mpRegen) u.mp = Math.min(u.maxMp, (u.mp||0) + p.mpRegen);
    if (p.hpRegen && u.hp < u.maxHp){ u.hp = Math.min(u.maxHp, u.hp + p.hpRegen); positionToken(u); }
  });
  const queue = aliveOf('enemy');
  const ph = bState.phase;                        // 이 적 턴의 번호
  const fields = new Map();
  const fieldOf = a=>{ if (!fields.has(a)) fields.set(a, pathField(a)); return fields.get(a); };
  (function next(){
    if (bState.over || bState.phase!==ph || bState.turn!=='enemy') return;
    const e = queue.shift();
    if (!e){ scheduleEndTurn(400); return; }
    if (e.hp<=0){ next(); return; }
    const foes = aliveOf('ally').filter(f=>!f.noControl); if (!foes.length){ next(); return; }
    // 목표 : 길로 가깝고, 때렸을 때 잘 먹히는 아군 (약한 쪽을 노림)
    const dmgTo = f=> Math.max(1, e.atk * (typeof artsDmgMul==='function' ? artsDmgMul(e, f) : 1) - f.def*0.5);   // 상성까지 쳐서
    let a = null, ad = Infinity;
    foes.forEach(f=>{ const d0 = fieldOf(f)[e.x+','+e.y]; const d = (d0===undefined ? 999+manhattan(e,f) : d0) - dmgTo(f)/5;
                      if (d < ad || (d===ad && f.hp < a.hp)){ a = f; ad = d; } });
    // focus : 먼저 노리는 인물 (살아 있는 첫 번째)
    const fz = (e.focus || []).map(id=>foes.find(f=>f.id===id)).find(Boolean); if (fz) a = fz;
    if (cam.zoom) camTo(e);
    const strikeAdj = ()=> setTimeout(()=>{
      if (bState.phase!==ph || bState.over) return;
      const sp = enemySkillPick(e);                  // 무공이 닿으면 무공부터
      if (sp){ enemyCast(e, sp.name, sp.x, sp.y, ()=> setTimeout(next, 200)); return; }
      const adj = adjacentFoes(e).filter(f=>!f.noControl).sort((p,q)=> p.hp/dmgTo(p) - q.hp/dmgTo(q));   // 빨리 쓰러뜨릴 수 있는 쪽부터
      if (adj.length){ doAttack(e, adj[0], ()=> setTimeout(next, 350)); } else next();
    }, 250);
    if (adjacentFoes(e).some(f=>!f.noControl) || enemySkillPick(e)){ strikeAdj(); return; }
    // 대기 : hold 턴 전까지는 제자리 (아군이 holdRange 칸 안에 들어오거나 한 번 맞으면 움직임)
    if (e.hold && bState.turnCount < e.hold && !e.roused){
      if (foes.some(f=> manhattan(e,f) <= (e.holdRange||4))) e.roused = true;
      else { next(); return; }
    }
    const F = fieldOf(a), reach = bfsReachable(e);
    let best = null, bestD = F[e.x+','+e.y]; if (bestD===undefined) bestD = Infinity;
    reach.forEach(k=>{ const d = F[k]; if (d!==undefined && d < bestD){ bestD = d; best = k; } });
    if (best){ const [bx,by] = best.split(',').map(Number); setTimeout(()=>moveAlong(e, bx, by, strikeAdj), cam.zoom?300:0); }
    else strikeAdj();
  })();
}

function showBanner(text){
  const el = document.getElementById('turn-banner') || (()=>{
    const d=document.createElement('div'); d.id='turn-banner';
    d.innerHTML='<div class="txt" id="turn-banner-txt"></div>';
    d.classList.add('bhud'); BS.appendChild(d); return d;
  })();
  document.getElementById('turn-banner-txt').textContent = text;
  el.classList.add('show');
  const tst = document.getElementById('b-toast');
  if (tst && tst.style.display==='block') tst.classList.add('low');   // 떠 있는 알림은 배너 아래로
  clearTimeout(showBanner._t);
  showBanner._t = setTimeout(()=> el.classList.remove('show'), 1100);
}

// avoid : 알림이 가리면 안 되는 유닛들 (공격한 쪽 · 맞은 쪽). 겹치면 그 유닛들 위나 아래로 비켜 줌
function toast(msg, ms, avoid){
  const el = document.getElementById('b-toast');
  const bn = document.getElementById('turn-banner');
  el.style.top = ''; el.style.transform = '';
  el.classList.toggle('low', !!(bn && bn.classList.contains('show')));   // 배너와 겹치지 않게
  el.textContent = msg; el.style.display='none'; void el.offsetWidth; el.style.display='block';
  if (avoid) toastAvoid(el, avoid);
  clearTimeout(toast._t);
  toast._t = setTimeout(()=> el.style.display='none', ms||1300);
}

// 대상을 고를 때의 안내 · 임무 알림 : 화면 가운데 (고른 인물을 가리면 그 위 · 아래로 비킴)
function hint(msg, ms){
  toast(msg, ms || 1800, bState && bState.selected ? [bState.selected] : null);
}
function toastAvoid(el, us){
  const host = el.offsetParent; if (!host) return;
  const H = host.getBoundingClientRect(), t = el.getBoundingClientRect();
  const rs = us.filter(u=>u && u.el && u.el.style.display!=='none').map(u=>{
    const r = u.el.getBoundingClientRect(); return { top:r.top-44, bottom:r.bottom+4, left:r.left-10, right:r.right+10 };   // 위로 떠오르는 숫자 자리까지
  });
  const hit = (a,b)=> a.left<b.right && a.right>b.left && a.top<b.bottom && a.bottom>b.top;
  if (!rs.some(r=>hit(r,t))) return;
  const top = Math.min(...rs.map(r=>r.top)), bottom = Math.max(...rs.map(r=>r.bottom));
  let y;
  if (bottom + 10 + t.height <= H.bottom - 60) y = bottom + 10;            // 유닛 아래
  else if (top - 10 - t.height >= H.top + 54) y = top - 10 - t.height;     // 유닛 위
  else return;
  el.style.top = (y - H.top)+'px'; el.style.transform = 'translateX(-50%)';
}
function showTerrainInfo(x,y){
  hidePeek();
  const t = terrainOf(x,y); const d = terrainData(x,y);
  const panel = document.getElementById('terrain-info');
  document.getElementById('ti-name').textContent = t;
  document.getElementById('ti-coord').textContent = '('+x+', '+y+')';
  document.getElementById('ti-cost').textContent = d.cost>=99 ? '불가' : d.cost;
  const px=(x-1)*B_TILE, py=(y-1)*B_TILE;
  let left = px+B_TILE+6; if (left+150>STAGE_W-4) left = px-156;
  let top = Math.max(4, Math.min(py-6, STAGE_H-94));
  panel.style.left=left+'px'; panel.style.top=top+'px';
  panel.classList.add('show'); terrainInfoKey = x+','+y;
}
function hideTerrainInfo(){ document.getElementById('terrain-info').classList.remove('show'); terrainInfoKey=null; if (typeof hidePeek==='function') hidePeek(); }

// 시작 화면 배경음 (data/assets.js 의 bgm.title 이 있을 때)
playBgm('title');
refreshContinue();
(function(){ const b = document.getElementById('boot'); if (b){ b.style.transition = 'opacity .4s'; b.style.opacity = '0'; setTimeout(()=> b.remove(), 450); } })();
