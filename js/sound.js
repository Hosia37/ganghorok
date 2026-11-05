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
function sfx(name){
  const vol = SOUND.mute ? 0 : SOUND.sfx;
  if (vol <= 0 || !SFX_PATCH[name]) return;
  const ac = audioCtx(); if (!ac) return;
  const out = ac.createGain(); out.gain.value = vol * 0.6; out.connect(ac.destination);
  try{ SFX_PATCH[name](ac, out, ac.currentTime + 0.005); }catch(e){}
}

/* ---------- 배경음 (data/assets.js 의 bgm : title / story / battle) ---------- */
let bgmEl = null, bgmKey = null;
function playBgm(key){
  bgmKey = key;
  const src = (typeof asset === 'function') ? asset('bgm.'+key) : '';
  if (!src){ if (bgmEl) bgmEl.pause(); return; }          // 파일이 없으면 조용히
  if (!bgmEl){ bgmEl = new Audio(); bgmEl.loop = true; }
  if (bgmEl.dataset.src !== src){ bgmEl.src = src; bgmEl.dataset.src = src; }
  applyBgmVolume();
  bgmEl.play().catch(()=>{});                              // 모바일은 첫 터치 뒤에 재생됨
}
function applyBgmVolume(){ if (bgmEl) bgmEl.volume = SOUND.mute ? 0 : SOUND.bgm; }

// 모바일은 사용자가 한 번 눌러야 소리가 나므로, 누를 때마다 소리 장치를 깨움
window.addEventListener('pointerdown', ()=>{
  audioCtx();
  if (bgmEl && bgmEl.paused && bgmKey && bgmEl.dataset.src) bgmEl.play().catch(()=>{});
}, { passive:true });
