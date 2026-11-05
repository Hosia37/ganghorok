/* =====================================================================
   무공 칸 · 무공 진화 · 상성  (v123) — 내용 : data/arts.js
   engine.js 는 typeof 로 확인하고 부름 (이 파일이 없어도 예전처럼 돌아감)
   ===================================================================== */

/* ---------------- 1. 상성 ---------------- */
function wpnOk(w){ return typeof WPN !== 'undefined' && !!WPN[w]; }
function wpnOfItem(name){
  if (!name || typeof ITEM_WPN === 'undefined') return null;
  const base = itemParse(name).base, it = ITEM_DB[base] || {};
  return ITEM_WPN[base] || (it.from && ITEM_WPN[it.from]) || (it.kind==='bow' ? 'gung' : null);
}
// 표에 없는 인물 : 무공 → 사거리 → 이름 · 직함 순으로 짐작
const WPN_GUESS = [
  ['gung', /비수|독침|뇌인|화염|주술|섭혼|독무|화우|혈고술|술$/],
  ['do',   /도법|도$|일도|막칼/],
  ['jang', /창법|창$|봉법|봉$|곤법|작살|돌격|채찍/],
  ['gwon', /권$|권법|장$|장법|조$|발톱|수인|고독|마공|신공|붕산/],
  ['geom', /검|섬영살/],
];
const WPN_GUESS_NAME = [
  ['gung', /궁수|궁노|궁기|술사|무녀|방사|법사|신녀|요녀|천녀|사제|시술|주술/],
  ['jang', /기병|창병|작살|수비병|철갑/],
  ['do',   /산적|녹림|도객|도부|칼잡이|수적|해적|마적|강도|낭인/],
  ['gwon', /강시|독인|거인|역사|석상|철인|곰|표$|흑표|승냥이|빙랑|설호|구렁이|지네|두꺼비|학$|해태|귀어|큰뱀|원숭이|요괴|고충|라마/],
  ['geom', /검/],
];
function wpnGuess(id){
  const d = (typeof UNITS !== 'undefined' && UNITS[id]) || {};
  for (const s of (d.skills || [])){
    if (typeof SKILL_WPN !== 'undefined' && SKILL_WPN[s]) return SKILL_WPN[s];
    for (const [w, re] of WPN_GUESS) if (re.test(s)) return w;
  }
  if ((d.range||1) >= 2 || d.weapon==='bow') return 'gung';
  const nm = (d.name||'') + ' ' + (d.job||'');
  for (const [w, re] of WPN_GUESS_NAME) if (re.test(nm)) return w;
  return 'geom';
}
function unitWpnId(id){
  if (!id) return 'geom';
  const base = String(id).replace(/^bq_/, '');
  const d = (typeof UNITS !== 'undefined' && UNITS[id]) || {};
  if (id==='hero' || d.party){
    const g = id==='hero' ? ((typeof HERO_DEFAULT !== 'undefined' && HERO_DEFAULT.gear) || {}) : (d.gear || {});
    const w = wpnOfItem(g.weapon); if (w) return w;
  }
  if (typeof UNIT_WPN !== 'undefined' && UNIT_WPN[id]) return UNIT_WPN[id];
  return wpnGuess(id);
}
function unitWpn(u){
  if (!u) return 'geom';
  if (!u._wpn || !wpnOk(u._wpn)) u._wpn = unitWpnId(u.id || u.key);
  return u._wpn;
}
function skillWpn(name, u){
  const d = (typeof SKILLS !== 'undefined' && SKILLS[name]) || {};
  return (typeof SKILL_WPN !== 'undefined' && SKILL_WPN[name]) || ((d.minRange||1) >= 2 ? 'gung' : unitWpn(u));
}
function wpnMatch(aw, dw){
  if (!wpnOk(aw) || !wpnOk(dw)) return null;
  if (WPN[aw].beats === dw) return 'adv';
  if (WPN[dw].beats === aw) return 'dis';
  return null;
}
let artsAtkWpn = null;          // 무공으로 치는 동안 : 그 무공의 갈래 (castSkill · enemyCastNow 가 정하고 끝나면 비움)
function artsSetSkill(name, u){ artsAtkWpn = name ? skillWpn(name, u) : null; }
// strike 가 부름 : { kind:'adv'|'dis', dmg, hit, label } 또는 null
function artsMatch(atk, def){
  if (typeof MATCHUP === 'undefined') return null;
  const k = wpnMatch(artsAtkWpn || unitWpn(atk), unitWpn(def)); if (!k) return null;
  const M = MATCHUP[k] || {}; return { kind:k, dmg:M.dmg || 1, hit:M.hit || 0, label: k==='adv' ? '상성 유리' : '상성 불리' };
}
// 적 AI : 상성까지 친 피해 배율
function artsDmgMul(atk, def, skill){
  if (typeof MATCHUP === 'undefined') return 1;
  const k = wpnMatch(skill ? skillWpn(skill, atk) : unitWpn(atk), unitWpn(def));
  return k ? ((MATCHUP[k] || {}).dmg || 1) : 1;
}
function wpnTag(w, extra){ return wpnOk(w) ? '<i class="wg w-'+w+(extra ? ' '+extra : '')+'" title="'+WPN[w].name+'">'+WPN[w].g+'</i>' : ''; }
// 인물 토큰 왼쪽 위의 작은 무기 글자
function artsTokenBadge(cfg){ const w = unitWpn(cfg); return wpnOk(w) ? '<i class="wpn w-'+w+'">'+WPN[w].g+'</i><i class="mu"></i>' : ''; }
function artsPeekTag(u){ const w = unitWpn(u); return wpnOk(w) ? wpnTag(w)+'<span class="job">'+WPN[w].name+'</span>' : ''; }
function artsSkillTag(name, u){
  const d = SKILLS[name] || {}; if (d.area==='self' || d.area==='ally') return '';
  return wpnTag(skillWpn(name, u));
}
// 대상 고르기 : 적 위에 ▲ 유리 · ▼ 불리 (아군을 고르면 일반 공격, 무공을 고르면 그 무공의 갈래로)
function artsMarks(u, skill){
  if (typeof units === 'undefined') return;
  Object.values(units).forEach(o=>{ if (o.el) o.el.classList.remove('mu-adv','mu-dis'); });
  if (!u || u.side!=='ally' || u.noControl) return;
  const d = skill ? (SKILLS[skill] || {}) : null;
  if (d && (d.area==='self' || d.area==='ally')) return;
  const aw = skill ? skillWpn(skill, u) : unitWpn(u);
  aliveOf('enemy').forEach(o=>{ const k = wpnMatch(aw, unitWpn(o)); if (k && o.el) o.el.classList.add('mu-'+k); });
}

/* ---------------- 2. 동료 무공 : 세 갈래 진화 ---------------- */
function artsDef(id){ return (typeof ARTS_LINES !== 'undefined' && ARTS_LINES[id]) || null; }
function artsEvolveRealms(id){ const L = artsDef(id); return (L && L.evolve) || (typeof ARTS_EVOLVE !== 'undefined' ? ARTS_EVOLVE : []); }
function artsLineOf(id, skill){ const L = artsDef(id); return L ? L.lines.findIndex(st=> st.includes(skill)) : -1; }
// 훈련장 판(ri)에서 기본 무공(base) 자리의 무공 — 진화 경지의 판이면 { skill:상승, evo:기본 }, 그 뒤 판은 { skill:상승 } (숙련)
function artsBoardSkill(id, ri, base){
  const L = artsDef(id); if (!L) return null;
  const li = L.lines.findIndex(st=> st[0]===base); if (li < 0) return null;
  const st = L.lines[li], er = REALMS.indexOf(artsEvolveRealms(id)[li]);
  if (er < 0 || !st[1] || !SKILLS[st[1]]) return null;
  if (ri === er) return { skill:st[1], evo:st[0] };
  if (ri > er)  return { skill:st[1] };
  return null;
}
function artsLineTop(L, li, have){ let t = -1; L.lines[li].forEach((s,i)=>{ if (have.has(s)) t = i; }); return t; }
// 숙련(n성)은 갈래로 이어짐 : 앞 단계 무공의 숙련을 지금 무공에 모두 더함
function artsMasteryCarry(id, m){
  const L = artsDef(id); if (!L) return m;
  const have = new Set(memberSkillsAll(id));
  L.lines.forEach((st, li)=>{
    const t = artsLineTop(L, li, have); if (t < 0) return;
    const top = st[t], o = { power:0, guard:0, heal:0, star:1 };
    st.forEach(s=>{ const x = m[s]; if (!x) return; o.power += x.power||0; o.guard += x.guard||0; o.heal += x.heal||0; o.star += (x.star||1) - 1; });
    st.forEach(s=>{ if (s !== top) delete m[s]; });
    m[top] = o;
  });
  return m;
}

// 이야기에서 받은 심법 (data/arts.js 의 SIMBEOP) : treeEffects 가 부름
function artsSimbeop(id){ const st = memberState(id); return ((st && st.simbeop) || []).filter(n=> typeof SIMBEOP !== 'undefined' && SIMBEOP[n]); }
function artsSimbeopEffects(id, e){
  artsSimbeop(id).forEach(n=>{ const ef = SIMBEOP[n].effect || {}; for (const k in ef) e[k] = (e[k]||0) + ef[k]; });
  return e;
}

/* ---------------- 3. 주인공 무공 칸 ---------------- */
function isJeolgi(s){ return typeof JEOLGI !== 'undefined' && JEOLGI.includes(s); }
function heroArts(){
  if (!HERO.arts || typeof HERO.arts !== 'object') HERO.arts = { slots:[], jeolgi:null };
  const A = HERO.arts, n = (typeof HERO_ARTS !== 'undefined' ? HERO_ARTS.slots : 3);
  if (!Array.isArray(A.slots)) A.slots = [];
  while (A.slots.length < n) A.slots.push(null);
  A.slots.length = n;
  return A;
}
// 처음 채울 때의 순서 : 범위 공격 → 단일 공격 → 회복 → 방어 (위력 큰 것부터)
function artsAutoOrder(list){
  const ms = treeMastery('hero');
  const sc = s=>{ const d = SKILLS[s] || {}; const p = (d.power || 0) + ((ms[s] && ms[s].power) || 0) + (ms[s] ? 0.01 : 0);   // 숙련 있는 무공 먼저
    return d.area==='ally' ? 150 : d.area==='self' ? 100 : (areaSkill(d) ? 300 : 200) + p*100; };
  const sorted = list.slice().sort((a,b)=> sc(b) - sc(a));
  const area = sorted.find(s=> areaSkill(SKILLS[s]||{})), single = sorted.find(s=> (SKILLS[s]||{}).area==='single');
  return Array.from(new Set([area, single].filter(Boolean).concat(sorted)));
}
// 칸 정리 : 안 배운 무공은 빼고 · 겹치지 않게 · 빈 칸은 배운 무공으로 채움
function heroArtsFix(all){
  const A = heroArts();
  all = all || memberSkillsAll('hero');
  const arts = all.filter(s=> !isJeolgi(s)), jl = all.filter(isJeolgi);
  const used = new Set();
  A.slots = A.slots.map(s=> (s && arts.includes(s) && !used.has(s)) ? (used.add(s), s) : null);
  if (A.jeolgi && !jl.includes(A.jeolgi)) A.jeolgi = null;
  const order = A.slots.every(s=> !s) ? artsAutoOrder(arts) : arts;
  A.slots = A.slots.map(s=>{ if (s) return s; const c = order.find(x=> !used.has(x)); if (c){ used.add(c); return c; } return null; });
  if (!A.jeolgi && jl.length) A.jeolgi = jl[jl.length-1];
  return A;
}
function heroArtsActive(all){ const A = heroArtsFix(all); return A.slots.filter(Boolean).concat(A.jeolgi ? [A.jeolgi] : []); }
// 전투에 가지고 나가는 무공 (engine.js 의 memberSkills 가 부름)
function artsActive(id){
  const all = memberSkillsAll(id);
  if (id==='hero') return heroArtsActive(all);
  const L = artsDef(id); if (!L) return all;
  const have = new Set(all), out = [];
  L.lines.forEach((st, li)=>{ const t = artsLineTop(L, li, have); if (t >= 0) out.push(st[t]); });
  if (L.jeolgi && have.has(L.jeolgi)) out.push(L.jeolgi);
  return out;
}
// 무공을 새로 익힌 뒤 (수련도 · 대사 · 끝 화면 대화) : 주인공 칸이 꽉 찼으면 알려 줌
function artsAfterLearn(id, skill){
  if (id!=='hero' || !skill || !SKILLS[skill]) return;
  const before = heroArts(), had = before.slots.filter(Boolean).concat(before.jeolgi ? [before.jeolgi] : []);
  if (isJeolgi(skill) && before.jeolgi && before.jeolgi !== skill){          // 새 절기는 바로 절기 칸에 (예전 절기는 목록에 남음)
    const old = before.jeolgi; before.jeolgi = skill;
    setTimeout(()=> showToast('절기 칸 : 「'+old+'」 → 「'+skill+'」 — 상태 → 무공에서 다시 바꿀 수 있습니다'), 900);
    return;
  }
  const A = heroArtsFix();
  const on = A.slots.includes(skill) || A.jeolgi===skill;
  if (!on && !had.includes(skill)) setTimeout(()=> showToast('새 무공 「'+skill+'」 — 무공 칸이 꽉 찼습니다. 상태 → 무공에서 바꿔 넣을 수 있습니다'), 900);
}
// 예전 저장 맞추기 : 기연에서 받았어야 할 비전 · 바뀐 이름
function artsOnLoad(){
  const met = (PLAYER.meta && PLAYER.meta.kiyeon) || {};
  if (typeof META_NPCS !== 'undefined') Object.keys(META_NPCS).forEach(sc=> META_NPCS[sc].forEach(n=>{
    const g = n.give; if (!n.kiyeon || !met[n.kiyeon] || !g || !g.skill) return;
    const to = g.to || 'hero', st = memberState(to); if (!st || !isParty(to)) return;
    st.learned = st.learned || []; if (!st.learned.includes(g.skill)) st.learned.push(g.skill);
  }));
  const RENAME = { namgung_seol:{ '제왕검형':'제왕검형 · 사식' } };
  Object.keys(RENAME).forEach(id=>{ const st = memberState(id); if (!st || !st.learned) return;
    st.learned = st.learned.map(s=> RENAME[id][s] || s); });
  if (isParty('hero')) heroArtsFix();
}

/* ---------------- 4. 상태 → 무공 탭 · 무공 칸 창 ---------------- */
let arSel = null;                 // 고른 칸 : 0 · 1 · 2 · 'j'
function arSkillLine(s, ms){
  const d = SKILLS[s] || {};
  return '<small>'+skillText(d, ms && ms[s])+'</small>';
}
function arSkillName(s, ms){ const m = ms && ms[s]; return s + (m && m.star > 1 ? ' <em class="star">'+m.star+'성</em>' : ''); }
function artsHeroHtml(){
  const A = heroArtsFix(), all = memberSkillsAll('hero'), ms = treeMastery('hero');
  const slot = (k, s, label)=>'<div class="ar-slot'+(k==='j' ? ' jl' : '')+(arSel===k ? ' sel' : '')+(s ? '' : ' empty')+'" data-slot="'+k+'">'+
      '<em>'+label+'</em>'+(s ? '<b>'+artsSkillTag(s, { id:'hero' })+arSkillName(s, ms)+'</b>'+arSkillLine(s, ms) : '<b>비어 있음</b><small>'+(k==='j' ? '절기를 익히면 넣을 수 있음' : '아래에서 무공을 고르세요')+'</small>')+'</div>';
  let h = '<div class="ar-head"><span>무공 칸</span><small>전투에는 이 넷만 · 칸 → 무공 순으로 눌러 바꿈</small></div>';
  h += '<div class="ar-slots">'+A.slots.map((s,i)=> slot(i, s, '무공 '+(i+1))).join('')+slot('j', A.jeolgi, '절기')+'</div>';
  h += '<div class="ar-head"><span>익힌 무공 <small>'+all.length+'개</small></span><small class="'+(arSel===null ? '' : 'pick')+'">'+(arSel===null ? '바꿀 칸을 먼저 누르세요' : (arSel==='j' ? '절기 칸에 넣을 절기를 누르세요' : '무공 '+(arSel+1)+' 칸에 넣을 무공을 누르세요'))+'</small></div>';
  h += '<div class="ar-list">'+all.map(s=>{
    const on = A.slots.includes(s) || A.jeolgi===s, jl = isJeolgi(s);
    const ok = arSel===null ? true : (arSel==='j' ? jl : !jl);
    return '<div class="ar-sk'+(on ? ' on' : '')+(jl ? ' jl' : '')+(ok ? '' : ' off')+'" data-sk="'+s+'"><b>'+artsSkillTag(s, { id:'hero' })+arSkillName(s, ms)+(jl ? ' <em class="jt">절기</em>' : '')+(on ? ' <em class="eq">장착</em>' : '')+'</b>'+arSkillLine(s, ms)+'</div>';
  }).join('')+'</div>';
  return h;
}
function artsMemberHtml(id){
  const L = artsDef(id); if (!L) return null;
  const have = new Set(memberSkillsAll(id)), ms = treeMastery(id), er = artsEvolveRealms(id), ri = realmIndex(memberRealm(id));
  const NM = typeof ARTS_LINE_NAMES !== 'undefined' ? ARTS_LINE_NAMES : ['공격','범위','호신'];
  let h = '<div class="ar-head"><span>무공 갈래</span><small>경지에 오르면 훈련장 「진화」 칸 · 비전은 기연으로</small></div>';
  L.lines.forEach((st, li)=>{
    const t = artsLineTop(L, li, have);
    const chips = st.map((s,i)=>{
      const cls = i===t ? 'cur' : (i < t ? 'past' : 'next');
      const hint = i===1 && t < 1 ? '<small>'+(er[li] || '')+'</small>' : (i===2 && t < 2 ? '<small>기연</small>' : '');
      const nm = (i===2 && t < 2) ? '비전 ???' : s;
      return '<span class="ar-st '+cls+(i===2 ? ' secret' : '')+'">'+(i===t ? artsSkillTag(s, { id }) : '')+nm+hint+'</span>';
    }).join('<i class="ar-arr">›</i>');
    h += '<div class="ar-line"><em>'+(NM[li] || '')+'</em><div class="ar-chips">'+chips+'</div>'+
         (t >= 0 ? '<div class="ar-cur"><b>'+arSkillName(st[t], ms)+'</b>'+arSkillLine(st[t], ms)+'</div>' : '<div class="ar-cur none">아직 익히지 않음 — 훈련장에서 기본 무공을 해금</div>')+'</div>';
  });
  const J = L.jeolgi, hasJ = J && have.has(J);
  h += '<div class="ar-line jl"><em>절기</em><div class="ar-cur'+(hasJ ? '' : ' none')+'">'+(hasJ ? '<b>'+artsSkillTag(J, { id })+J+'</b>'+arSkillLine(J, ms) : '이야기 속에서 익힘')+'</div></div>';
  return h;
}
function artsTabHtml(m){
  const id = m.key; if (!isParty(id)) return null;
  let wpn;
  const passive = ()=>{ const pas = unlockedNodes(id).filter(n=>n.type==='passive').map(n=>n.name), sb = artsSimbeop(id);
    const n = pas.length + sb.length; if (!n) return '';
    return '<div class="sk-card passive"><b>심법 <em>'+n+'개</em></b><small>'+nodeEffectText({ effect:treeEffects(id) })+'<br>'+
           sb.map(x=> '<span class="ar-sb">'+x+'</span>').join(' · ')+(sb.length && pas.length ? ' · ' : '')+pas.join(' · ')+'</small>'+
           sb.map(x=> '<small class="ar-sbd">'+x+' — '+SIMBEOP[x].desc.split(' — ')[1]+' · '+nodeEffectText({ effect:SIMBEOP[x].effect })+'</small>').join('')+'</div>'; };
  const lose = wpnOk(wpn = unitWpnId(id)) ? WPN_ORDER.find(k=> WPN[k].beats===wpn) : null;
  const wl = wpnOk(wpn) ? '<div class="ar-wpn">'+wpnTag(wpn)+'<b>'+WPN[wpn].name+'</b><small>'+wpnTag(WPN[wpn].beats)+WPN[WPN[wpn].beats].name+'에 강함 · '+wpnTag(lose)+WPN[lose].name+'에 약함</small></div>' : '';
  const body = id==='hero' ? artsHeroHtml() : artsMemberHtml(id);
  if (body === null) return null;
  return '<div class="ar-wrap">'+wl+body+passive()+'</div>';
}
function bindArtsTab(m, rerender){
  const root = document.getElementById('sd-tabbody');
  artsBindIn(root, m.key, rerender);
}
function artsBindIn(root, id, rerender){
  if (id!=='hero' || !root) return;
  root.querySelectorAll('.ar-slot').forEach(el=> el.onclick = ()=>{ const k = el.dataset.slot==='j' ? 'j' : +el.dataset.slot; arSel = (arSel===k) ? null : k; sfx('click'); rerender(); });
  root.querySelectorAll('.ar-sk').forEach(el=> el.onclick = ()=>{
    const s = el.dataset.sk, A = heroArts(), jl = isJeolgi(s);
    let k = arSel;
    if (k===null){ if (jl) k = 'j'; else { const e = A.slots.indexOf(null); if (e < 0){ showToast('바꿀 칸을 먼저 누르세요'); return; } k = e; } }
    if (k==='j'){ if (!jl){ showToast('절기 칸에는 절기만 넣을 수 있습니다'); return; } A.jeolgi = s; }
    else {
      if (jl){ showToast('절기는 절기 칸에 넣습니다'); return; }
      const j = A.slots.indexOf(s);
      if (j >= 0 && j !== k){ A.slots[j] = A.slots[k]; }     // 이미 다른 칸에 있으면 서로 바꿈
      A.slots[k] = s;
    }
    sfx('click');
    arSel = null; rerender();
  });
}
// 출전 편성 등에서 여는 무공 칸 창
function openArtsModal(){
  let el = document.getElementById('arts-modal');
  if (!el){
    el = document.createElement('div'); el.id = 'arts-modal';
    el.innerHTML = '<div class="st-box" id="ar-box"><div class="of-head"><span class="st-title">무공 칸</span><span id="ar-sub"></span></div><div id="ar-body"></div>'+
                   '<div class="st-foot"><div class="top-btn" id="ar-close">닫기</div></div></div>';
    const host = (document.getElementById('meta-modal') || {}).parentNode || document.body; host.appendChild(el);
    el.querySelector('#ar-close').onclick = ()=>{ el.style.display = 'none'; arSel = null; if (typeof renderSortie==='function' && document.getElementById('sortie-modal').style.display==='flex') renderSortie(); };
  }
  arSel = null;
  const render = ()=>{ const b = el.querySelector('#ar-body'); b.innerHTML = '<div class="ar-wrap">'+artsHeroHtml()+'</div>'; artsBindIn(b, 'hero', render); };
  el.querySelector('#ar-sub').textContent = nameOf('hero')+' · 이번 전투에 가지고 나갈 무공';
  render(); el.style.display = 'flex';
}

/* ---------------- 5. 출전 편성 : 적의 무기 · 주인공 무공 칸 ---------------- */
function artsFoeSummary(bid){
  const B = (typeof BATTLES !== 'undefined' && BATTLES[bid]) || {}, cnt = {};
  (B.enemies || []).forEach(e=>{ const w = unitWpnId(e.id); cnt[w] = (cnt[w]||0) + 1; });
  const keys = WPN_ORDER.filter(k=> cnt[k]); if (!keys.length) return '';
  const counter = w=> WPN_ORDER.find(k=> WPN[k].beats===w);
  return '<span class="lbl">적의 무기</span> '+keys.map(k=> wpnTag(k)+WPN[k].name+' '+cnt[k]).join(' · ')+
         ' <span class="hint">→ '+keys.slice().sort((a,b)=> cnt[b]-cnt[a]).slice(0,2).map(k=> WPN[k].name+'에는 '+wpnTag(counter(k))+WPN[counter(k)].name).join(' · ')+'</span>';
}
function artsSortieDecor(){
  const sb = document.getElementById('sp-box'); if (!sb || typeof spBattle === 'undefined') return;
  let foe = document.getElementById('sp-foe');
  if (!foe){ foe = document.createElement('div'); foe.id = 'sp-foe'; const crowd = document.getElementById('sp-crowd'); crowd.parentNode.insertBefore(foe, crowd); }
  foe.innerHTML = artsFoeSummary(spBattle);
  sb.querySelectorAll('.sp-card').forEach(c=>{ if (c.querySelector('.wg')) return; const w = unitWpnId(c.dataset.id); const nm = c.querySelector('.nm'); if (nm) nm.insertAdjacentHTML('afterbegin', wpnTag(w)); });
  let btn = document.getElementById('sp-arts');
  if (!btn){ btn = document.createElement('div'); btn.className = 'top-btn sp-small'; btn.id = 'sp-arts'; btn.textContent = '무공 칸';
    const go = document.getElementById('sp-go'); go.parentNode.insertBefore(btn, go); btn.onclick = ()=>{ sfx('click'); openArtsModal(); }; }
}

/* ---------------- 6. 도움말 : 상성 · 무공 칸 · 진화 ---------------- */
function artsCycleHtml(){
  const cells = WPN_ORDER.map(k=> '<span class="cy w-'+k+'">'+WPN[k].g+'<small>'+WPN[k].name+'</small></span>').join('<i>→</i>');
  return '<div class="ar-cycle">'+cells+'<i>→</i><span class="cy w-'+WPN_ORDER[0]+'">'+WPN[WPN_ORDER[0]].g+'<small>'+WPN[WPN_ORDER[0]].name+'</small></span></div>';
}
if (typeof TIPS !== 'undefined'){
  TIPS.arts = [
    { t:'상성', d: artsCycleHtml() + '화살표 앞쪽이 이깁니다. 유리하면 <b>피해 +'+Math.round((MATCHUP.adv.dmg-1)*100)+'% · 명중 +'+MATCHUP.adv.hit+'</b>, 불리하면 그 반대.<br>'+
        '인물 동그라미 왼쪽 위의 글자가 그 인물의 무기입니다. 공격 · 무공을 고르면 적 위에 <b class="up">▲</b> 유리 · <b class="dn">▼</b> 불리가 뜹니다.' },
    { t:'무공의 결', d:'일반 공격과 반격은 무기를 따르고, 무공은 그 무공의 결을 따릅니다.<br>검을 든 인물도 <b>나한권 · 면장</b> 같은 권장 무공은 권(拳)으로, <b>탄지신통 · 화살 · 암기</b>처럼 멀리 쏘는 무공은 원거리(弓)로 칩니다.<br>무공 목록의 글자로 확인할 수 있습니다.' },
    { t:'무공 칸 · 진화', d:'<b>주인공</b>은 익힌 무공 중 <b>무공 3칸 + 절기 1칸</b>만 전투에 가지고 나갑니다. 거점 상태 → 무공, 또는 출전 편성의 <b>무공 칸</b>에서 바꿉니다.<br>'+
        '<b>동료</b>는 공격 · 범위 · 호신 세 갈래 + 절기. '+ (typeof ARTS_EVOLVE!=='undefined' ? ARTS_EVOLVE.join(' · ') : '') +'에 오르면 차례로 훈련장 판에 「진화」 칸이 생기고, 기연을 만나면 비전으로 한 번 더 오릅니다.' },
  ];
}
function artsOnBattleStart(){
  if (typeof tipSeen==='function' && tipSeen('battle') && !tipSeen('arts')) setTimeout(()=>{ if (!bState.over && document.getElementById('tip-modal').style.display!=='flex') showTips('arts'); }, 600);
}
(function(){
  const b = document.getElementById('set-arts'); if (b) b.addEventListener('click', ()=>{ if (typeof closeSettings==='function') closeSettings(); showTips('arts'); });
})();
// 보드 캐시 비우기 (진화 칸이 들어간 판으로 다시 만듦)
if (typeof _boardCache !== 'undefined') for (const k in _boardCache) delete _boardCache[k];
