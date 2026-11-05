/* =====================================================================
   소리
   - 효과음 : 파일 없이 브라우저에서 바로 만들어 내는 소리 (타격 · 회피 · 무공 · 회복 · 레벨업 · 버튼)
   - 배경음 : data/assets.js 의 bgm 에 음악 파일 경로를 적으면 화면에 맞춰 반복 재생
   - 설정(배경음 · 효과음 크기, 음소거)은 이 브라우저에 저장됨
   ===================================================================== */
const SOUND_KEY = 'ganghorok_settings_v1';
const SOUND = { bgm:0.6, sfx:0.8, mute:false, cutin:true };   // cutin : 무공 연출(컷인) 켜기
(function(){ try{ Object.assign(SOUND, JSON.parse(localStorage.getItem(SOUND_KEY) || '{}')); }catch(e){} })();
function saveSoundSettings(){ try{ localStorage.setItem(SOUND_KEY, JSON.stringify(SOUND)); }catch(e){} }

/* ---------- 효과음 ---------- */
let AC = null, noiseBuf = null;
function audioCtx(){
  if (!AC){
    const C = window.AudioContext || window.webkitAudioContext; if (!C) return null;
    try{ AC = new C(); }catch(e){ return null; }
  }
  if (AC.state === 'suspended') AC.resume().catch(()=>{});
  return AC;
}
function noiseBuffer(ac){
  if (noiseBuf) return noiseBuf;
  noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
  const d = noiseBuf.getChannelData(0); for (let i=0;i<d.length;i++) d[i] = Math.random()*2-1;
  return noiseBuf;
}
// 음 하나 : 주파수 f0 → f1 로 미끄러지며 dur 초 동안 사라짐
function sTone(ac, out, t, f0, f1, dur, type, peak){
  const o = ac.createOscillator(), g = ac.createGain();
  o.type = type || 'sine';
  o.frequency.setValueAtTime(f0, t); if (f1 && f1!==f0) o.frequency.exponentialRampToValueAtTime(f1, t+dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t+0.01); g.gain.exponentialRampToValueAtTime(0.0001, t+dur);
  o.connect(g); g.connect(out); o.start(t); o.stop(t+dur+0.02);
}
// 잡음 : 필터 주파수 f0 → f1
function sNoise(ac, out, t, dur, ftype, f0, f1, q, peak){
  const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
  s.buffer = noiseBuffer(ac);
  f.type = ftype; f.Q.value = q || 1;
  f.frequency.setValueAtTime(f0, t); if (f1 && f1!==f0) f.frequency.exponentialRampToValueAtTime(f1, t+dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t+0.008); g.gain.exponentialRampToValueAtTime(0.0001, t+dur);
  s.connect(f); f.connect(g); g.connect(out); s.start(t); s.stop(t+dur+0.02);
}
const SFX_PATCH = {
  hit:   (ac,o,t)=>{ sNoise(ac,o,t,0.13,'bandpass',2200,900,1.2,0.9); sTone(ac,o,t,150,55,0.16,'sine',0.9); },
  miss:  (ac,o,t)=>{ sNoise(ac,o,t,0.24,'bandpass',500,2600,2.5,0.45); },
  skill: (ac,o,t)=>{ sNoise(ac,o,t,0.42,'lowpass',3200,300,0.8,1.0); sTone(ac,o,t,120,40,0.45,'triangle',1.0); sTone(ac,o,t+0.05,90,35,0.5,'sine',0.7); },
  cutin: (ac,o,t)=>{ sNoise(ac,o,t,0.34,'bandpass',500,3600,1.4,0.6); sTone(ac,o,t+0.02,180,720,0.26,'sawtooth',0.10); sTone(ac,o,t+0.16,1320,1180,0.42,'sine',0.14); },
  heal:  (ac,o,t)=>{ sTone(ac,o,t,660,660,0.22,'sine',0.35); sTone(ac,o,t+0.09,990,990,0.3,'sine',0.3); },
  levelup:(ac,o,t)=>{ [523,659,784,1047].forEach((f,i)=> sTone(ac,o,t+i*0.085,f,f,0.24,'triangle',0.32)); },
  click: (ac,o,t)=>{ sTone(ac,o,t,880,620,0.05,'sine',0.18); },
};
// ---------- 효과음 파일 (data/assets.js 의 sfx — 처음 누를 때 한꺼번에 풀어 둠) ----------
const SFX_BUF = {}, SFX_LAST = {};
let sfxLoading = false;
function loadSfx(){
  if (sfxLoading || typeof ASSETS === 'undefined' || !ASSETS.sfx) return;
  const ac = audioCtx(); if (!ac) return;
  sfxLoading = true;
  Object.keys(ASSETS.sfx).forEach(k=>{
    const src = ASSETS.sfx[k]; if (!src) return;
    fetch(src).then(r=> r.arrayBuffer()).then(b=> new Promise((ok, no)=> ac.decodeAudioData(b, ok, no))).then(buf=>{ SFX_BUF[k] = buf; }).catch(()=>{});
  });
}
// 파일이 아직 없을 때 대신 낼 소리 (위의 합성음)
const SFX_FALLBACK = { atk_geom:'miss', atk_do:'miss', atk_gwon:'miss', atk_gung:'miss', atk_jang:'miss', hit_blade:'hit', hit_blunt:'hit', hit_heavy:'hit',
  block:'hit', guard:'heal', poison:'miss', cure:'heal', down:'hit', realm:'levelup', coin:'click', item:'heal', equip:'click', forge:'levelup',
  chest:'levelup', alarm:'skill', achieve:'levelup', mission:'levelup', save:'heal', select:'cutin', confirm:'click', turn_ally:'click', turn_enemy:'hit' };
// sfx(이름, { vol, rate, delay }) — rate 를 안 주면 전투 소리는 조금씩 높낮이를 달리 (같은 소리가 덜 지겹게)
function sfx(name, o){
  o = o || {};
  const vol = SOUND.mute ? 0 : SOUND.sfx * (o.vol || 1);
  if (vol <= 0) return;
  const ac = audioCtx(); if (!ac) return;
  if (!sfxLoading) loadSfx();
  const now = ac.currentTime;
  if (SFX_LAST[name] && now - SFX_LAST[name] < 0.045) return;          // 같은 소리가 한꺼번에 겹치지 않게
  SFX_LAST[name] = now;
  const buf = SFX_BUF[name];
  if (buf){
    const src = ac.createBufferSource(), g = ac.createGain();
    src.buffer = buf;
    src.playbackRate.value = o.rate || (/^(atk_|hit|miss|step|down|block)/.test(name) ? 0.94 + Math.random()*0.12 : 1);
    g.gain.value = vol; src.connect(g); g.connect(ac.destination);
    try { src.start(now + (o.delay || 0)); } catch (e) {}
    return;
  }
  const alt = SFX_PATCH[name] ? name : SFX_FALLBACK[name];
  if (!alt || !SFX_PATCH[alt]) return;
  const out = ac.createGain(); out.gain.value = vol * 0.6; out.connect(ac.destination);
  try{ SFX_PATCH[alt](ac, out, now + 0.005 + (o.delay || 0)); }catch(e){}
}

// 전투 소리 (상성 유리 · 큰 피해는 묵직하게) — 무기 갈래(js/arts.js 의 unitWpn : do 도 · geom 검 · gwon 권장 · gung 원거리 · jang 장병)마다 다르게
function sfxWpn(u){ try { return (typeof unitWpn === 'function') ? unitWpn(u) : 'geom'; } catch (e) { return 'geom'; } }
function sfxSwing(atk){ sfx('atk_' + sfxWpn(atk), { vol:0.8 }); }
function sfxImpact(atk, def, dmg, guard, o){
  o = o || {};
  const w = sfxWpn(atk), mx = (def && def.maxHp) || 100;
  const kind = (o.heavy || dmg >= mx * 0.35) ? 'hit_heavy' : (w === 'gwon' || w === 'jang') ? 'hit_blunt' : (w === 'gung') ? 'hit' : 'hit_blade';
  sfx(kind, { delay:o.delay || 0 });
  if (guard) sfx('block', { delay:(o.delay || 0) + 0.03, vol:0.8 });           // 방어 무공으로 막아 냄
}
// 무공 : 기운 소리 + 맞는 소리
function sfxSkillHit(u, hits, kills){
  sfx(hits ? 'skill' : 'miss');
  if (hits) sfxImpact(u, null, 0, 0, { delay:0.14, heavy: kills > 0 || hits >= 3 });
}

/* ---------- 배경음 (data/music.js 의 MUSIC 이 장면 · 전투마다 곡을 정함) ----------
   playBgm(곡 이름) — 지금 곡을 천천히 줄이고 새 곡을 천천히 키움 (같은 곡이면 그대로)
   playJingle(이름) — 배경음을 멈추고 짧은 곡을 한 번 (승리 · 패배 · 장 전환) */
const BGM_FADE = 900;
let bgmEl = null, bgmKey = null, bgmTimer = null, jingleEl = null;
const bgmPool = [];
function bgmTarget(){ return SOUND.mute ? 0 : SOUND.bgm; }
function fadeAudio(el, to, ms, done){
  const from = el.volume, t0 = performance.now();
  const step = ()=>{ const k = Math.min(1, (performance.now() - t0) / ms);
    try { el.volume = Math.max(0, Math.min(1, from + (to - from) * k)); } catch (e) {}
    if (k < 1) el._fade = requestAnimationFrame(step); else if (done) done(); };
  cancelAnimationFrame(el._fade); step();
}
function resolveBgm(key){
  if (typeof MUSIC === 'undefined') return key;
  if (key === 'story') return sceneTrack(typeof curScene !== 'undefined' ? curScene : null);
  if (key === 'battle') return battleTrack(typeof curBattleId !== 'undefined' ? curBattleId : null);   // curBattleId : js/engine.js
  return key;
}
function sceneTrack(id){
  if (typeof MUSIC === 'undefined') return 'story';
  const sc = (typeof SCENES !== 'undefined' && SCENES[id]) || {};
  return sc.bgm || MUSIC.scene[id] || MUSIC.chapter[sc.chapter] || 'road';
}
function battleTrack(id){
  if (typeof MUSIC === 'undefined') return 'battle';
  const B = (typeof BATTLES !== 'undefined' && BATTLES[id]) || {};
  return B.bgm || MUSIC.battle[id] || ((B.victory || {}).bossDown ? 'battle_boss' : 'battle');
}
function playBgm(key){
  key = key ? resolveBgm(key) : null;
  stopJingle();
  const src = (key && typeof asset === 'function') ? asset('bgm.'+key) : '';
  if (key === bgmKey && bgmEl && src && bgmEl.dataset.src === src){            // 같은 곡 : 계속
    if (bgmEl.paused) bgmEl.play().catch(()=>{});
    fadeAudio(bgmEl, bgmTarget(), 300); return;
  }
  const old = bgmEl;
  if (old){ fadeAudio(old, 0, BGM_FADE, ()=>{ old.pause(); }); }
  bgmKey = key; bgmEl = null;
  if (!src) return;                                                           // 곡이 없으면 조용히
  let el = bgmPool.find(a=> a !== old && a.paused) || null;
  if (!el){ el = new Audio(); el.loop = true; el.preload = 'auto'; bgmPool.push(el); }
  if (el.dataset.src !== src){ el.src = src; el.dataset.src = src; }
  try { el.currentTime = 0; } catch (e) {}
  el.volume = 0; bgmEl = el;
  el.play().then(()=> fadeAudio(el, bgmTarget(), BGM_FADE)).catch(()=>{});  // 모바일은 첫 터치 뒤에 재생됨
}
function playSceneBgm(id){
  const card = document.getElementById('chapter-card');
  const go = ()=> playBgm(sceneTrack(id));
  if (card && card.classList.contains('on')){ clearTimeout(bgmTimer); bgmTimer = setTimeout(go, 2300); }   // 장 제목이 떠 있는 동안은 장 전환 곡
  else go();
}
function playBattleBgm(id){ playBgm(battleTrack(id)); }
function playJingle(key){
  const src = (typeof asset === 'function') ? asset('bgm.'+key) : '';
  if (bgmEl){ const o = bgmEl; fadeAudio(o, 0, 350, ()=> o.pause()); }
  bgmEl = null; bgmKey = null; clearTimeout(bgmTimer);
  if (!src || bgmTarget() <= 0) return;
  if (!jingleEl){ jingleEl = new Audio(); jingleEl.preload = 'auto'; }
  if (jingleEl.dataset.src !== src){ jingleEl.src = src; jingleEl.dataset.src = src; }
  try { jingleEl.currentTime = 0; } catch (e) {}
  jingleEl.volume = bgmTarget(); jingleEl.play().catch(()=>{});
}
function stopJingle(){ if (jingleEl && !jingleEl.paused){ const j = jingleEl; fadeAudio(j, 0, 250, ()=> j.pause()); } }
function applyBgmVolume(){ if (bgmEl) { cancelAnimationFrame(bgmEl._fade); bgmEl.volume = bgmTarget(); } }

// 모바일은 사용자가 한 번 눌러야 소리가 나므로, 누를 때마다 소리 장치를 깨움
window.addEventListener('pointerdown', ()=>{
  audioCtx(); loadSfx();
  if (bgmEl && bgmEl.paused && bgmKey && bgmEl.dataset.src) bgmEl.play().then(()=> fadeAudio(bgmEl, bgmTarget(), 400)).catch(()=>{});
}, { passive:true });
