/* =====================================================================
   훈련장 (거점) — 수련도
   ---------------------------------------------------------------------
   가운데 초상화 → 큰 원 세 개 (공격 · 방어 · 내력) → 각 원에서 노드가 이어짐.
   앞 노드를 해금해야 다음 노드를 해금할 수 있음 (수련치 + 레벨 조건).
   정비(전투와 전투 사이) 한 번에 인물마다 TRAIN_PER_BREAK 번까지만 해금 — 전투에서 이기면 다시 채워짐

   노드 한 개
     id     : 이 인물 안에서 겹치지 않는 이름표
     branch : 'atk' (공격) / 'def' (방어) / 'nei' (내력)
     type   : 'stat'    = 능력치가 오름
              'skill'   = 무공을 배움 (무공 내용은 data/skills.js)
              'passive' = 심법 · 패시브 (전투 중 늘 적용)
     name   : 보일 이름
     stat   : 오르는 능력치  { atk 공격, def 방어, hit 명중, eva 회피, hp 체력, mp 내공 }
     skill  : 배우는 무공 이름 (type:'skill')
     effect : 패시브 효과 (type:'passive')
                mpRegen    : 아군 턴마다 내공 회복
                hpRegen    : 아군 턴마다 체력 회복
                counterPow : 반격 위력 증가 (0.3 = +30%)
                dmgCut     : 받는 피해 감소 (0.1 = -10%)
     req    : 먼저 해금해야 하는 노드 id (적지 않으면 같은 가지의 바로 앞 노드, 첫 노드는 큰 원)
     level  : 필요 레벨
     cost   : 수련치 (전투에서 얻는 재화 — 금과 따로). 삼류 판 15칸 합계 1,500
     pos    : (선택) 화면 위치 [x, y] — 가로 1000 · 세로 500 기준. 적지 않으면 자동 배치

   ※ 노드 이름 · 무공 이름 · 숫자는 모두 임시 — 자유롭게 고치기

   경지 상승 : 지금 경지의 판(15칸)을 모두 채우고, 다음 경지 레벨(data/growth.js)이 되면
              훈련장에서 '경지 상승' → 다음 경지의 판이 열림
   ===================================================================== */
const TRAIN_PER_BREAK = 5;   // 정비 한 번에 인물마다 해금할 수 있는 노드 수

const TREE_BRANCHES = {
  atk: { name:'공격', color:'#e0604a', icon:'攻' },
  def: { name:'방어', color:'#4a90d9', icon:'防' },
  nei: { name:'내력', color:'#4cc2a0', icon:'氣' },
};

const TRAIN_TREE = {
  // ---------------- 주인공 — 천씨세가 ----------------
  hero: [
    // 공격
    { id:'a1', branch:'atk', type:'stat',    name:'근력 단련',       stat:{ atk:2 },        level:1, cost:30 },
    { id:'a2', branch:'atk', type:'skill',   name:'천씨검법',        skill:'천씨검법',       level:1, cost:80 },
    { id:'a3', branch:'atk', type:'stat',    name:'검세 연마',       stat:{ atk:3 },        level:3, cost:50 },
    { id:'a4', branch:'atk', type:'stat',    name:'날카로운 칼끝',   stat:{ hit:4 },        level:4, cost:70 },
    { id:'a5', branch:'atk', type:'skill',   name:'천씨검법 · 일섬', skill:'천씨검법 · 일섬', level:4, cost:220 },
    // 방어
    { id:'d1', branch:'def', type:'stat',    name:'체력 단련',       stat:{ hp:15 },        level:1, cost:30 },
    { id:'d2', branch:'def', type:'stat',    name:'보법 연마',       stat:{ eva:3 },        level:2, cost:50 },
    { id:'d3', branch:'def', type:'skill',   name:'천씨 호신검',     skill:'천씨 호신검',     level:3, cost:80 },
    { id:'d4', branch:'def', type:'stat',    name:'철골',            stat:{ def:4 },        level:4, cost:80 },
    { id:'d5', branch:'def', type:'passive', name:'반격의 묘',       effect:{ counterPow:0.3 }, level:5, cost:160 },
    // 내력
    { id:'n1', branch:'nei', type:'stat',    name:'토납',            stat:{ mp:8 },         level:1, cost:30 },
    { id:'n2', branch:'nei', type:'passive', name:'천씨심법 · 초식', effect:{ mpRegen:4 },  level:2, cost:80 },
    { id:'n3', branch:'nei', type:'skill',   name:'운기요상',        skill:'운기요상',       level:3, cost:70 },   // 회복 무공
    { id:'n4', branch:'nei', type:'passive', name:'천씨심법 · 운기', effect:{ hpRegen:6 },  level:5, cost:140 },
    { id:'n5', branch:'nei', type:'passive', name:'천씨심법 · 대성', effect:{ dmgCut:0.1 }, stat:{ mp:10 }, level:8, cost:330 },
  ],

  // ---------------- 청화 — 무당파 ----------------
  cheonghwa: [
    // 공격
    { id:'a1', branch:'atk', type:'stat',    name:'근력 단련',       stat:{ atk:2 },        level:1, cost:30 },
    { id:'a2', branch:'atk', type:'skill',   name:'무당장권',        skill:'무당장권',       level:1, cost:80 },
    { id:'a3', branch:'atk', type:'stat',    name:'검세 연마',       stat:{ atk:3 },        level:3, cost:50 },
    { id:'a4', branch:'atk', type:'stat',    name:'날카로운 칼끝',   stat:{ hit:4 },        level:4, cost:70 },
    { id:'a5', branch:'atk', type:'skill',   name:'양의검법',        skill:'양의검법',       level:4, cost:220 },
    // 방어
    { id:'d1', branch:'def', type:'stat',    name:'체력 단련',       stat:{ hp:15 },        level:1, cost:30 },
    { id:'d2', branch:'def', type:'stat',    name:'제운종',          stat:{ eva:3 },        level:2, cost:50 },
    { id:'d3', branch:'def', type:'skill',   name:'태극권',          skill:'태극권',         level:3, cost:80 },
    { id:'d4', branch:'def', type:'stat',    name:'철골',            stat:{ def:4 },        level:4, cost:80 },
    { id:'d5', branch:'def', type:'passive', name:'이유제강',        effect:{ counterPow:0.3 }, level:5, cost:160 },
    // 내력
    { id:'n1', branch:'nei', type:'stat',    name:'토납',            stat:{ mp:8 },         level:1, cost:30 },
    { id:'n2', branch:'nei', type:'passive', name:'무당심법',        effect:{ mpRegen:4 },  level:2, cost:80 },
    { id:'n3', branch:'nei', type:'stat',    name:'기혈 순환',       stat:{ hp:10, mp:5 },  level:3, cost:70 },
    { id:'n4', branch:'nei', type:'passive', name:'순양무극공',      effect:{ hpRegen:6 },  level:5, cost:140 },
    { id:'n5', branch:'nei', type:'passive', name:'태극심법',        effect:{ dmgCut:0.1 }, stat:{ mp:10 }, level:8, cost:330 },
  ],

  // ---------------- 위지렴 — 화원파 (화산파 속가) · 일반 공격은 활, 무공은 화산파 기초 무공 ----------------
  //   합류할 때 a1 · a2 (육합권법) 는 이미 익힘 (data/units.js 의 startTree)
  cheolmyeong: [
    // 공격
    { id:'a1', branch:'atk', type:'stat',    name:'강궁 단련',       stat:{ atk:2 },        level:1, cost:30 },
    { id:'a2', branch:'atk', type:'skill',   name:'육합권법',        skill:'육합권법',       level:1, cost:80 },
    { id:'a3', branch:'atk', type:'stat',    name:'시위 당기기',     stat:{ atk:3 },        level:3, cost:50 },
    { id:'a4', branch:'atk', type:'stat',    name:'매의 눈',         stat:{ hit:5 },        level:4, cost:70 },
    { id:'a5', branch:'atk', type:'skill',   name:'화원신궁',        skill:'화원신궁',       level:4, cost:220 },
    // 방어
    { id:'d1', branch:'def', type:'stat',    name:'체력 단련',       stat:{ hp:15 },        level:1, cost:30 },
    { id:'d2', branch:'def', type:'stat',    name:'매화보법',        stat:{ eva:3 },        level:2, cost:50 },
    { id:'d3', branch:'def', type:'skill',   name:'화산 호신검',     skill:'화산 호신검',     level:3, cost:80 },
    { id:'d4', branch:'def', type:'stat',    name:'철골',            stat:{ def:4 },        level:4, cost:80 },
    { id:'d5', branch:'def', type:'stat',    name:'사냥꾼의 감',     stat:{ eva:4, def:2 }, level:5, cost:160 },
    // 내력
    { id:'n1', branch:'nei', type:'stat',    name:'토납',            stat:{ mp:8 },         level:1, cost:30 },
    { id:'n2', branch:'nei', type:'passive', name:'화산심법 · 초식', effect:{ mpRegen:4 },  level:2, cost:80 },
    { id:'n3', branch:'nei', type:'stat',    name:'기혈 순환',       stat:{ hp:10, mp:5 },  level:3, cost:70 },
    { id:'n4', branch:'nei', type:'passive', name:'화산심법 · 운기', effect:{ hpRegen:6 },  level:5, cost:140 },
    { id:'n5', branch:'nei', type:'passive', name:'자하신공 · 입문', effect:{ dmgCut:0.1 }, stat:{ mp:10 }, level:8, cost:330 },
  ],

  // ---------------- 석운 — 개방 후개 (소걸개) · 봉법 ----------------
  //   이류로 합류 → 이 삼류 판은 합류할 때 모두 익힌 채 (data/units.js 의 startTree)
  seokun: [
    // 공격
    { id:'a1', branch:'atk', type:'stat',    name:'근력 단련',         stat:{ atk:2 },        level:1, cost:30 },
    { id:'a2', branch:'atk', type:'skill',   name:'타구봉법 · 반자결', skill:'타구봉법 · 반자결', level:1, cost:80 },
    { id:'a3', branch:'atk', type:'stat',    name:'봉세 연마',         stat:{ atk:3 },        level:3, cost:50 },
    { id:'a4', branch:'atk', type:'stat',    name:'날카로운 봉끝',     stat:{ hit:4 },        level:4, cost:70 },
    { id:'a5', branch:'atk', type:'skill',   name:'타구봉법 · 전자결', skill:'타구봉법 · 전자결', level:4, cost:220 },
    // 방어
    { id:'d1', branch:'def', type:'stat',    name:'체력 단련',         stat:{ hp:15 },        level:1, cost:30 },
    { id:'d2', branch:'def', type:'stat',    name:'걸개 보법',         stat:{ eva:3 },        level:2, cost:50 },
    { id:'d3', branch:'def', type:'skill',   name:'타구봉법 · 봉자결', skill:'타구봉법 · 봉자결', level:3, cost:80 },
    { id:'d4', branch:'def', type:'stat',    name:'철골',              stat:{ def:4 },        level:4, cost:80 },
    { id:'d5', branch:'def', type:'passive', name:'반격의 묘',         effect:{ counterPow:0.3 }, level:5, cost:160 },
    // 내력
    { id:'n1', branch:'nei', type:'stat',    name:'토납',              stat:{ mp:8 },         level:1, cost:30 },
    { id:'n2', branch:'nei', type:'passive', name:'개방 심법',         effect:{ mpRegen:4 },  level:2, cost:80 },
    { id:'n3', branch:'nei', type:'stat',    name:'기혈 순환',         stat:{ hp:10, mp:5 },  level:3, cost:70 },
    { id:'n4', branch:'nei', type:'passive', name:'개방 심법 · 운기',  effect:{ hpRegen:6 },  level:5, cost:140 },
    { id:'n5', branch:'nei', type:'passive', name:'개방 심법 · 대성',  effect:{ dmgCut:0.1 }, stat:{ mp:10 }, level:8, cost:330 },
  ],
};

/* ---------------------------------------------------------------------
   이류부터의 판 — 위의 삼류 판(TRAIN_TREE)을 바탕으로 자동으로 만들어짐
     stat : 능력치 노드 · 심법 회복량 배율 (삼류 = 1)
     cost : 비용(수련치) 배율
   자동으로 바뀌는 것
     - 능력치 노드 : 오르는 양 × stat
     - 무공 노드   : 'n성' 숙련 노드가 됨 → 그 무공의 위력이 오름 (방어 무공은 방어 증가)
     - 심법 노드   : 턴마다 회복 × stat/2, 반격 +10%, 받는 피해 -2%
     - 필요 레벨   : 그 경지의 레벨 구간에 맞춰 나눠짐
   --------------------------------------------------------------------- */
const REALM_BOARD = {
  '이류':        { stat:2.5,  cost:3  },
  '일류':        { stat:5,    cost:6  },
  '절정 초입':   { stat:7.5,  cost:10 },
  '절정 중기':   { stat:10,   cost:14 },
  '절정 극':     { stat:12.5, cost:19 },
  '초절정 초입': { stat:15,   cost:25 },
  '초절정 중기': { stat:17.5, cost:32 },
  '초절정 극':   { stat:20,   cost:40 },
  '화경':        { stat:25,   cost:50 },
  '현경':        { stat:30,   cost:62 },
  '생사경':      { stat:35,   cost:75 },
};
// 무공 숙련 노드 한 개가 올려 주는 양 — single : 단일 무공 위력, line3 : 직진 무공 위력, guard : 방어 무공 (× stat 배율), heal : 회복 무공 (+5%)
//   (v117 : 0.25 · 0.2 → 0.1 · 0.08 — 경지마다 쌓이면 후반 대장이 한 방에 쓰러져서 낮춤)
const MASTERY = { single:0.1, line3:0.08, guard:6, heal:0.05 };
// 명중 · 회피 노드는 경지 배율(stat)을 이만큼만 받음 — 1 = 다른 능력치처럼 다 받음, 0 = 경지와 상관없이 처음 값
//   (다 받으면 후반에 회피가 너무 쌓여 적이 거의 못 맞힘 : 절정 극 회피 +117 → 적 명중 5%)
const HIT_EVA_SCALE = 0;
// 뒤처진 동료 따라잡기 : 주인공보다 경지가 gap 단계 넘게 낮은 동료는 주인공이 경지에 오를 때 (주인공 경지 - gap) 까지 저절로 올라옴
//   그 아래 경지의 판은 모두 채워지고 레벨은 그 경지 첫 레벨 이상이 됨 — 지금 경지의 판은 직접 수련 (null 이면 끔)
const CATCH_UP = { gap:1 };

// 직접 짠 판 (선택) — 이 경지만 자동 대신 이 판을 씀. 노드 적는 법은 위 TRAIN_TREE 와 같음
//   예) TRAIN_TREE_REALM.hero = { '이류': [ { id:'a1', branch:'atk', type:'stat', name:'…', stat:{atk:5}, level:10, cost:300 }, … ] };
const TRAIN_TREE_REALM = {};
