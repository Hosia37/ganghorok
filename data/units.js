/* =====================================================================
   등장인물
   - 주인공 : 시작할 때 이름 · 모습을 정하고, 경험치로 레벨이 오름
   - party:true  : 아군 (합류하면 레벨이 오르고 장비를 낌, 상태보기에 나옴). level 은 합류할 때의 레벨
                   level:'hero+2' 처럼 적으면 합류할 때 주인공 레벨 기준
                   startTree : 합류할 때 이미 익힌 수련도 노드 (data/training.js 의 id)
                   weapon:'bow' : 활을 쓰는 인물 — 무기는 활(data/items.js 의 kind:'bow')만 장착
   - 그 외 인물  : level 고정 (우군 · 적). 경지와 능력치는 레벨로 자동 계산 (data/growth.js)
                   전투마다 레벨을 바꾸려면 data/battles.js 의 배치에 level 을 적기
   - face / card 는 data/assets.js 의 이름, title 은 칭호
   - range / minRange : 일반 공격이 닿는 거리 (없으면 1 = 붙어 있는 적만)
   - passive : (우군 · 적) 심법 { mpRegen: 턴마다 내공 회복, hpRegen: 체력 회복 }, passiveName : 심법 이름 (설명용)
       활 = range:2, minRange:2 → 한 칸 띄운 적만 쏨 (대각선 포함), 붙어 있는 적은 못 치고 반격도 못 함
   ===================================================================== */

// 주인공 기본값
const HERO_DEFAULT = { job:'무인', move:4, skills:[], gear:{ weapon:'철검', armor:'천옷' } };
// gear : 인물마다 정해진 무기 · 방어구 (바꿔 끼지 않고 대장간에서 강화 · 승급 · 제작). 합류할 때 저절로 장착
//   합류 때 등급 : gearGrade 를 적으면 그 등급, 없으면 제2장부터 합류하는 아군은 상급(파랑) — data/items.js 의 PROMOTE
// 주인공은 이름이 정해져 있음 — 시작할 때 고른 모습(m 남 / f 여)에 따라
//   stat : 처음부터 붙는 능력치 (atk 공격, mp 내력 …)   story : 고르는 화면에 보이는 짧은 사연
const HERO_LOOKS = {
  m: { name:'천명우', stat:{ atk:8 }, trait:'공격형', attrRec:[2,1,1], story:'어린 시절 세가가 멸문할 때 누이 명화를 잃었다. 원수를 잊지 않는다.' },
  f: { name:'천명화', stat:{ mp:8 },  trait:'내력형', attrRec:[1,2,1], story:'어린 시절 세가가 멸문할 때 오라버니 명우를 잃었다. 세가 어른들의 당부대로, 살아남는 것이 먼저다.' },
};
// 인물 특성 (trait) : 레벨 능력치에 붙는 보정 — mult = 곱하기 (hp 체력, mp 내력, atk 공격, def 방어), add = 더하기 (hit 명중, eva 회피 …)
//   인물마다 data 의 trait:{ name, mult, add } 로 적음. 상태 화면 '열전' 탭에 보임
// 적 대장 등급 (rank) : 전투 배치(data/battles.js)의 적에 rank:'mid' (중간보스) / 'boss' (보스) 를 적으면 아래 보정이 붙음
const UNIT_RANKS = {
  mid:  { label:'중간보스', mult:{ hp:1.5 } },
  boss: { label:'보스',     mult:{ hp:2, def:1.1 } },
  final:{ label:'최종 보스', mult:{ hp:3.2, def:1.15 } },   // 최종장 천명
};

// 능력 점수 '추천' 비율 [무력, 내력, 신법] — 아군 인물의 attrRec (주인공은 위 HERO_LOOKS)

/* 인연 (상태보기 → 인연 · 전투에서 저절로 발동)
   members : 인연을 맺은 인물 · from : 이 장면이 끝나면 맺어짐 (null = 아직 없음 — '???' 로 보임)
   when : 'adj' = 다른 인연 인물이 바로 옆(상하좌우)에 있으면 · 'deploy' = 모두 출전해 살아 있으면
   eff  : 인물마다 { dmgCut:받는 피해 감소, atkPct:공격 %, hit:명중, eva:회피, regenPct:아군 턴 시작 체력 회복 %, foe:{ faction, pct } } — all 은 모두에게 */
// 출전 편성 — 제4장 무력대 출범부터. 전투(data/battles.js)에 picks:[{x,y},{x,y}] 를 적으면 출발 전에 편성 창
//   fixed : 늘 나가는 인물 (전투의 allies 에 자리를 적음) · pick : 아군 중에서 더 고르는 인원 (picks 의 자리에 순서대로)
// 출전 편성 : fixed = 늘 나가는 인물 · 고를 수 있는 자리는 전투의 picks 자리 수 (다 채우지 않아도 출전 가능)
//   base : 밸런스 기준 인원 (고정 포함) — 이보다 많이 데려가면 crowd 만큼 적 체력이 오름 (1명마다 hp +7% · 대장 boss +9%)
//   max : 이만큼까지만 셈 (최종장 전원 출전처럼 많이 데려가도 적 체력은 +6명 몫까지만)
//   전투마다 base:6 처럼 바꿀 수 있음. pick:'all' = 최종장처럼 자리 수만큼 모두 (기본은 전원 선택)
const SORTIE = { fixed:['hero','cheonghwa','cheolmyeong'], pick:2, base:5, crowd:{ hp:0.07, boss:0.09, max:6 } };

const BONDS = [
  { id:'wudang_promise', name:'무당산의 약속',   members:['hero','cheonghwa'],                from:'wudang_after',           when:'adj',
    eff:{ all:{ dmgCut:0.10 } },                                  text:'서로 받는 피해 -10%' },
  { id:'same_foe',       name:'같은 원수',       members:['hero','cheolmyeong'],              from:'cheolgeom_hall_talk',    when:'deploy',
    eff:{ all:{ foe:{ faction:'천교', pct:0.10 } } },             text:'천교 무리에게 주는 피해 +10%' },
  { id:'inn_cup',        name:'취현객잔의 술잔', members:['hero','cheonghwa','cheolmyeong'], from:'yangyang_inn_cheonghwa', when:'deploy',
    eff:{ all:{ atkPct:0.05, regenPct:0.03 } },                   text:'셋 모두 공격 +5% · 아군 턴 시작에 체력 3% 회복' },
  { id:'beggar_cheon',   name:'소걸개와 천씨',   members:['hero','seokun'],                   from:'gaebang_interrogation',  when:'adj',
    eff:{ seokun:{ eva:5 }, hero:{ hit:5 } },                     text:'석운 회피 +5 · 주인공 명중 +5' },
  { id:'gaebang_sib',    name:'개방의 사형매',   members:['seokun','jinsoyeon'],              from:null,                     when:'adj',
    eff:{},                                                       text:'' },
];
// 적의 소속 (인연 '같은 원수' 같은 효과에 씀) — 천교에 든 무리
const UNIT_FACTION = { sapa_musa:'천교', sapa_gosu:'천교', guhu:'천교', sapa_ganbu:'천교', sado_gyeol:'천교', cheongyo_archer:'천교',
                       cheolgeom_traitor:'천교', nokrim_boss:'천교', nokrim:'천교', nokrim_archer:'천교' };

const UNITS = {
  // ---- 아군 (합류 인물) ----
  cheonghwa: { name:'청화', job:'무당파 2대제자', title:'대사형', level:3, move:4, skills:[], face:'cheonghwa', card:'cheonghwa', attrRec:[1,2,1], gear:{ weapon:'철검', armor:'천옷' }, party:true,  // 삼류
               trait:{ name:'방어형 · 앞을 막음', mult:{ hp:1.1, def:1.1, atk:0.95 } } },
  // 위지렴 — 화원파(화산파 속가) 문주. 문파가 멸문한 뒤 산에서 사냥꾼으로 지냄. 일반 공격은 활(한 칸 띄운 적만), 무공은 화산파 기초 무공(육합권법 등 — 붙은 적)
  cheolmyeong: { name:'위지렴', job:'화원파 문주', title:'사냥꾼', level:'hero+2', move:5, range:2, minRange:2, weapon:'bow', skills:[], face:'hunter', card:'hunter', attrRec:[2,0,2], gear:{ weapon:'활', armor:'가죽갑옷' }, party:true,
                 trait:{ name:'궁수 · 멀리서', mult:{ atk:1.05, hp:0.9, def:0.9 }, add:{ hit:5 } },
                 startTree:['a1','a2'] },   // 합류할 때 육합권법은 이미 익힘

  // ---- 우군 (플레이어가 조종, 레벨 고정, 경험치 없음) ----
  guo:   { name:'곽정', job:'북협',      level:170, move:4, skills:['황룡십팔장'], face:'guo',   card:'guo'   },  // 화경
  huang: { name:'황용', job:'개방 방주', level:100, move:5, skills:['타구봉법'],   face:'huang', card:'huang' },  // 초절정 중기
  hunter:{ name:'사냥꾼', job:'궁수', level:1, move:5, range:2, minRange:2, face:'hunter', card:'hunter' },   // 통성명 전의 위지렴 (철검문 전투 우군 · 레벨은 전투에서 정함). 통성명 뒤로는 cheolmyeong

  // ---- 적 ----
  sapa_musa: { name:'사파 무사', job:'무인', level:2, move:4, face:'sapa' },  // 삼류
  sapa_gosu: { name:'사파 두목', job:'무인', level:3, move:4, face:'sapa' },  // 삼류
  // ---- 녹림 적룡채 (산길의 습격 · 적룡채 토벌) ----
  mountain_bandit: { name:'산적',      job:'적룡채 산적', level:1, move:4, face:'bandit', card:'bandit', foe:true, skills:['난도질'] },   // 레벨은 전투에서 정함
  bandit_chief:    { name:'산적 두목', job:'적룡채 두목', level:1, move:4, face:'bandit', card:'bandit', foe:true, skills:['개산도법'] },
  bandit_archer:   { name:'산적 궁수', job:'적룡채 산적', level:1, move:4, range:2, minRange:2, face:'bandit', card:'bandit', foe:true },   // 활 : 한 칸 띄운 적만
  // ---- 천교 ----
  guhu:            { name:'구후', job:'천교 간부 · 백타산 장로', level:45, move:4, skills:['합마공', '독사장'], passive:{ mpRegen:15 }, passiveName:'연단운기술',
                     face:'ganbu', card:'ganbu', foe:true },   // 정체를 드러낸 구후 (다음에 싸울 때). 철검문 안마당의 '사파 간부'(sapa_ganbu)와 같은 사람
  sado_gyeol:      { name:'사도결', job:'천교 절강 지부 부지부장', title:'흑건도', level:1, move:4, face:'sado_gyeol', card:'sado_gyeol', foe:true,
                     skills:['흑풍도법', '단혼일도'], passive:{ mpRegen:10 }, passiveName:'흑건심법',
                     trait:{ name:'흑건 · 날랜 칼잡이', add:{ eva:5 } } },   // 구후의 오른팔 (레벨은 전투에서 정함)
  cheongyo_archer: { name:'천교 궁수', job:'천교 무인', level:1, move:4, range:2, minRange:2, face:'sapa', foe:true },   // 활 : 한 칸 띄운 적만

  // ---- 개방 절강 분타 (우군 — 전투에서 조종) ----
  noyugak:   { name:'노유각', job:'개방 장로', title:'절강 분타주', level:60, move:4, face:'noyugak', card:'noyugak' },   // 원작의 개방 장로. 이번에는 분타 안에서 물건을 지킴
  // 석운 — 절강 분타 전투 두 번은 우군(data/battles.js 에 friend:true), 사도결 심문 뒤 아군으로 합류 (이류 · 주인공 +1, Lv10 ~ 20)
  //   합류할 때 삼류 수련도(data/training.js 의 seokun)는 모두 익힌 채 → 이류 판부터
  seokun:    { name:'석운',   job:'개방 후개', title:'소걸개', level:'hero+1', joinRealm:'이류', move:5, skills:['타구봉법 · 반자결'], face:'seokun', card:'seokun', attrRec:[1,1,2], gear:{ weapon:'봉', armor:'천옷' }, gearGrade:1, party:true,
               trait:{ name:'기동형 · 날렵함', mult:{ def:0.95 }, add:{ eva:5 } },
               startTree:['a1','a2','a3','a4','a5','d1','d2','d3','d4','d5','n1','n2','n3','n4','n5'] },     // 황용의 수제자 · 다음 방주감
  jinsoyeon: { name:'진소연', job:'황 방주의 제자', level:1, move:5, skills:['탄지신통'], face:'jinsoyeon', card:'jinsoyeon' },                 // 황용의 수제자 · 석운의 사매
  madaeho:   { name:'마대호', job:'개방 오결 제자', level:1, move:4, skills:['취팔선봉'], face:'madaeho', card:'madaeho' },                       // 분타의 행동대장
  galyeong:  { name:'갈 영감', job:'개방 칠결 제자', level:1, move:4, skills:['연환봉'], face:'galyeong', card:'galyeong' },                    // 포구 정찰
  wangi:     { name:'왕이',   job:'개방 삼결 제자', level:1, move:5, face:'wangi', card:'wangi' },                                                // 포구 길잡이
  // ---- 제2장 낭야성 : 안민회(= 천교 아래로 들어간 녹림) · 제갈세가 · 암살자 ----
  nokrim_boss:   { name:'녹림 두목', job:'안민회 두목', level:1, move:4, face:'bandit', card:'bandit', foe:true, skills:['개산도법', '난도질'] },   // 레벨은 전투에서 정함
  nokrim:        { name:'녹림도',    job:'안민회 무리', level:1, move:4, face:'bandit', card:'bandit', foe:true, skills:['난도질'] },
  nokrim_archer: { name:'녹림 궁수', job:'안민회 무리', level:1, move:4, range:2, minRange:2, face:'bandit', card:'bandit', foe:true },
  assassin:      { name:'암살자',    job:'정체불명', level:1, move:5, face:'assassin', card:'assassin', foe:true,
                   skills:['혈영비수', '섬영살'], passive:{ mpRegen:12 }, passiveName:'알 수 없는 심법' },   // 가주전 : 주인공이 지게 되는 전투 (레벨은 전투에서 정함)
  jegal_yun:     { name:'제갈윤',    job:'제갈세가 소가주', level:1, move:4, face:'jegal_yun', card:'jegal_yun' },
  jegal_hwi:     { name:'제갈휘',    job:'제갈세가 가주', level:1, move:4, face:'jegal_hwi', card:'jegal_hwi' },
  // 제3장 · 정파의 회합 (남궁세가) — 지금은 이야기에만. 레벨은 전투에 나올 때 쓸 임시 값
  namgung_wi:    { name:'남궁위',    job:'남궁세가 가주',   level:110, move:4, face:'namgung_wi',    card:'namgung_wi' },     // 별호 제왕검 · 오만함
  namgung_jin:   { name:'남궁진',    job:'남궁세가 소가주', level:35,  move:4, face:'namgung_jin',   card:'namgung_jin' },    // 차갑고 깍듯함
  namgung_seol:  { name:'남궁설',    job:'남궁세가 아가씨', level:25,  move:5, face:'namgung_seol',  card:'namgung_seol' },   // 살가움
  hwasan_munju:  { name:'청송진인',  job:'화산파 문주',     level:100, move:4, skills:['매화검법'], face:'hwasan_munju', card:'hwasan_munju' },   // 개파조사 육소평의 제자 · 현원 · 현적의 사부
  paeng_cheonho: { name:'팽천호',    job:'화북팽가 가주',   level:100, move:4, face:'paeng_cheonho', card:'paeng_cheonho' },  // 별호 광도 · 호탕함
  paeng_soho:    { name:'팽소호',    job:'화북팽가 소가주', level:30,  move:4, face:'paeng_soho',    card:'paeng_soho' },     // 술 좋아하는 한량
  baekun:        { name:'백운',      job:'소림사 태상장로', level:150, move:4, face:'baekun',        card:'baekun' },         // 속가 출신 태상장로 · 곽정과 안면
  mujin:         { name:'무진',      job:'소림사 방장',     level:130, move:4, face:'mujin',         card:'mujin' },
  // 마인 : 마공에 먹혀 제정신을 잃은 자 (제3장 안휘성). 그림은 임시 (글자만)
  majin:         { name:'마인',      job:'마공에 먹힌 자',  level:1,   move:4, face:'majin', card:'majin', foe:true, skills:['마혈조'],
                   trait:{ name:'마공 · 아픔을 모름', mult:{ hp:1.2, def:0.85 } } },
  jeokryong_chief: { name:'적룡채주',  job:'녹림 적룡채주', level:1, move:4, face:'jeokryong_chief', card:'jeokryong_chief', foe:true,
                     skills:['적룡파산권', '개산도법'], passive:{ mpRegen:10, counterPow:0.3 }, passiveName:'녹림심법',
                     trait:{ name:'녹림의 괴력 · 반격 +30%' } },
  // foe:true = 이야기 장면에서 이름표가 붉게 (적)
  cheolgeom_sahyeong: { name:'철검문 대사형', job:'철검문 문하', level:1, move:4, face:'cheolgeom_sahyeong', card:'cheolgeom_sahyeong', foe:true },   // 레벨은 전투에서 정함 (주인공 +1)
  cheolgeom:          { name:'철검문 문도', job:'철검문 문하', level:1, move:4, face:'cheolgeom', card:'cheolgeom', foe:true },
  cheolgeom_traitor:  { name:'배신 문원',   job:'철검문 배신자', level:1, move:4, face:'cheolgeom_traitor', card:'cheolgeom_traitor', foe:true },   // 연합에 붙은 철검문원 (철검문 안마당)

  // ---- 철검문 · 사파 연합 (제1장 철검문) ----
  cheolgeom_munju: { name:'철검문주', job:'철검문 문주', level:30, move:4, skills:['일운검법'], passive:{ mpRegen:30 }, passiveName:'뇌류심법',
                     face:'munju', card:'munju' },                                   // 절정 초입 · 뇌류심법 (턴마다 내공 +30)
  sapa_ganbu:      { name:'사파 간부', job:'사파 연합 간부', level:45, move:4, skills:['전사창법 · 찌르기'], passive:{ mpRegen:15 }, passiveName:'연단운기술',
                     face:'ganbu', card:'ganbu', foe:true },                          // 절정 중기 · 연단운기술 (턴마다 내공 +15)

  // ---- 이야기에만 나오는 인물 ----
  yangyang_lord:     { name:'양양 성주', job:'양양성 성주', level:1, move:4, face:'yangyang_lord', card:'yangyang_lord' },
  hwasan_hyeonwon:   { name:'현원', job:'화산파 제자', level:1, move:4, face:'hwasan_hyeonwon', card:'hwasan_hyeonwon' },     // 차분한 쪽
  hwasan_disciple:   { name:'화산파 문원', job:'화산파 제자 (수행원)', level:1, move:4, face:'hwasan_disciple', card:'hwasan_disciple' },
  hwasan_hyeonjeok:  { name:'현적', job:'화산파 제자', level:1, move:4, face:'hwasan_hyeonjeok', card:'hwasan_hyeonjeok' },   // 거친 쪽 (얼굴의 칼자국)
  yangyang_official: { name:'관원', job:'양양 관아 관원', level:1, move:4, face:'yangyang_official', card:'yangyang_official', foe:true },   // 사파 간부의 뇌물을 받던 관원
  namgung_guard: { name:'남궁세가 무사', job:'남궁세가', level:1, move:4, face:'namgung_guard', card:'namgung_guard' },   // 가주전에 마인 소식을 알리는 무사 (v115 그림)
  zhang: { name:'장삼봉', job:'무당파 진인', level:300, move:5, skills:['태극혜검'], face:'zhang', card:'zhang' },   // 생사경
};
