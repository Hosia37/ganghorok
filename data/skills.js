/* =====================================================================
   무공
   - range : 시전 거리(칸)
   - minRange : (선택) 이보다 가까운 적은 못 침 — 활 무공 = minRange:2
   - area  : 'line3' = 상하좌우 중 고른 방향으로 직진 3칸 / 'line2' = 직진 2칸 / 'single' = range 안의 적 1명
             'sweep3' = 앞쪽 가로 3칸 베기 (바로 앞 칸과 그 양옆)
             'volley3' = 원거리 가로 3칸 — minRange~range 칸 떨어진 칸을 골라, 그 칸과 양옆(쏘는 방향과 가로) 3칸
             'self'  = 자신에게 쓰는 방어 무공 → guard:{ def:12 } 이면 다음 아군 턴까지 방어 +12
             'ally'  = 회복 무공 → range 안의 자신 · 아군 1명. heal:0.3 = 대상 최대 체력의 30% 회복
   - 훈련장에서 배우는 무공은 data/training.js 의 TRAIN_TREE 노드(type:'skill')에 적기
   - power : 위력 (공격 × 배수)
   - mp    : 내공 소모
   - cutin : (선택) 쓸 때 화면을 가로지르는 연출 그림 — data/assets.js 의 cutin 이름
             cutinPos : 그림에서 보일 자리 (가로 세로 %, 예 '50% 30%' — 세로 숫자가 작을수록 그림 위쪽)
   ※ 공격 무공도 일반 공격처럼, 맞고 살아남은 적이 사거리 안이면 반격함 (data/growth.js 의 COUNTER)
   ===================================================================== */
const SKILLS = {
  '황룡십팔장': { range:3, area:'line3',  power:5, mp:200, desc:'직진 3칸 범위', cutin:'hangryong', cutinPos:'50% 50%' },
  '타구봉법':   { range:1, area:'single', power:2, mp:200, desc:'1칸 단일', cutin:'tagu', cutinPos:'50% 50%' },
  '태극혜검':   { range:1, area:'sweep3', power:5, mp:200, desc:'앞쪽 가로 3칸 · 태극의 원을 그리며 베어 내는 장삼봉의 검', cutin:'taegeuk', cutinPos:'50% 50%' },

  // ---- 훈련장에서 배우는 무공 (임시) ----
  '천씨검법':        { range:1, area:'single', power:1.6, mp:10, desc:'1칸 단일 · 천씨세가의 가전 검법', cutin:'cheonsi_geom', cutinPos:'50% 50%' },
  '천씨검법 · 일섬': { range:3, area:'line3',  power:1.3, mp:20, desc:'직진 3칸 범위 · 한 줄기로 꿰뚫는 검' },
  '무당장권':        { range:1, area:'single', power:1.5, mp:8,  desc:'1칸 단일 · 무당의 기본 권법', cutin:'mudang_jang', cutinPos:'50% 50%' },
  '양의검법':        { range:3, area:'line3',  power:1.3, mp:18, desc:'직진 3칸 범위 · 음양 두 기운이 어우러진 검' },
  // 위지렴 — 화산파 기초 무공 (화원파는 화산파 속가) · 화원파의 궁술
  '육합권법':        { range:1, area:'single', power:1.6, mp:10, desc:'1칸 단일 · 화산파의 기초 권법', cutin:'yukhap_gwon', cutinPos:'50% 25%' },
  '화원신궁':        { range:3, minRange:2, area:'volley3', power:1.3, mp:20, desc:'2~3칸 앞 가로 3칸 · 화원파의 궁술, 세 대의 화살을 한꺼번에 날림', cutin:'hwawon_singung', cutinPos:'50% 50%' },
  // 방어 무공 (자신)
  '천씨 호신검':     { range:0, area:'self', guard:{ def:12 }, mp:8, desc:'자신 · 다음 턴까지 방어 +12' },
  '태극권':          { range:0, area:'self', guard:{ def:12 }, mp:8, desc:'자신 · 다음 턴까지 방어 +12' },
  '화산 호신검':     { range:0, area:'self', guard:{ def:12 }, mp:8, desc:'자신 · 다음 턴까지 방어 +12' },
  // ---- 화산파 (현원 · 현적이 씀) ----
  '매화검법':        { range:3, area:'line3',  power:1.3, mp:20, desc:'직진 3칸 범위 · 매화가 흩날리듯 몰아치는 화산의 검' },
  // ---- 철검문 · 사파 연합 (우군 · 적이 씀) ----
  '일운검법':          { range:1, area:'sweep3', power:5,   mp:40, desc:'앞쪽 가로 3칸 베기 · 철검문주의 검법' },
  '일운 찌르기':       { range:1, area:'single', power:1.5, mp:12, desc:'1칸 단일 · 철검문의 찌르기' },
  '전사창법 · 찌르기': { range:2, area:'line2',  power:5,   mp:30, desc:'직진 2칸 찌르기 · 사파 간부의 창법' },
  '개산도법':          { range:1, area:'sweep3', power:1.4, mp:20, desc:'앞쪽 가로 3칸 베기 · 산적 두목의 큰 칼' },
  '난도질':            { range:1, area:'single', power:1.5, mp:12, desc:'1칸 단일 · 산적의 막칼' },
  // 구후 (천교 간부 · 백타산 장로) 의 본래 무공 — 철검문 안마당에서는 정체를 숨기려고 창법(전사창법)만 썼음
  '합마공':            { range:4, area:'line4',  power:2.0, mp:40, desc:'직진 4칸 범위 · 두꺼비처럼 웅크렸다 한 번에 터뜨리는 백타산의 공' },
  '독사장':            { range:1, area:'single', power:1.5, mp:20, poison:{ turns:3, dmg:23 }, desc:'1칸 단일 · 뱀독을 실은 장법 — 맞으면 3턴 동안 중독 (턴마다 체력 -23)' },
  // 천교 사도결 (흑건도)
  '흑풍도법':          { range:1, area:'sweep3', power:1.6, mp:25, desc:'앞쪽 가로 3칸 베기 · 검은 바람처럼 휘몰아치는 사도결의 도법' },
  '단혼일도':          { range:1, area:'single', power:2.0, mp:30, desc:'1칸 단일 · 혼을 끊는 한칼' },
  '천교 도법':         { range:1, area:'single', power:1.5, mp:12, desc:'1칸 단일 · 천교 무인들의 칼' },
  // 개방 (절강 분타)
  '타구봉법 · 반자결': { range:1, area:'single', power:1.8, mp:15, desc:'1칸 단일 · 상대의 발을 걸어 넘어뜨리는 타구봉법의 결 (석운)' },
  '탄지신통':          { range:3, minRange:2, area:'single', power:1.4, mp:12, desc:'2~3칸 원거리 단일 · 손가락으로 기를 튕겨 날리는 도화도의 절기 (진소연)' },
  '취팔선봉':          { range:1, area:'single', power:1.5, mp:10, desc:'1칸 단일 · 술 취한 듯 흔들리는 봉법 (마대호)' },
  '연환봉':            { range:2, area:'line2',  power:1.3, mp:12, desc:'직진 2칸 · 봉을 잇달아 내지름 (갈 영감)' },
  // 출정 전 대화로 배우는 무공 (data/scenes.js 의 끝 화면 인물 give.skill)
  '일운검법 · 초식':   { range:1, area:'sweep3', power:1.3, mp:22, desc:'앞쪽 가로 3칸 베기 · 철검문 검법의 첫 초식 (철검문주에게 배움)' },
  '낙영신검장 · 기초': { range:2, area:'line2', power:1.4, mp:14, desc:'직진 2칸 · 꽃잎이 흩날리듯 겹쳐 밀려가는 도화도의 장법 (황용에게 배움)' },
  '탄지신통 · 기초':   { range:3, minRange:2, area:'single', power:1.1, mp:10, desc:'2~3칸 원거리 단일 · 손가락으로 기를 튕기는 요령 (진소연에게 배움)' },
  // 석운 (아군 — 수련도)
  '타구봉법 · 전자결': { range:1, area:'sweep3', power:1.4, mp:22, desc:'앞쪽 가로 3칸 · 봉을 휘감아 돌리는 타구봉법의 결 (석운)' },
  '타구봉법 · 봉자결': { range:0, area:'self', guard:{ def:12 }, mp:8, desc:'자신 · 다음 턴까지 방어 +12 — 봉으로 길을 막는 결' },
  // 정체불명의 암살자 (가주전)
  '혈영비수':          { range:3, minRange:2, area:'single', power:1.3, mp:15, desc:'2~3칸 원거리 단일 · 핏빛 그림자처럼 날아드는 비수' },
  '마혈조':            { range:1, area:'single', power:1.4, mp:10, desc:'1칸 단일 · 핏빛으로 물든 손톱으로 할퀴는 마인의 일격' },
  '섬영살':            { range:1, area:'single', power:1.6, mp:20, desc:'1칸 단일 · 그림자처럼 파고드는 일격' },
  '적룡파산권':        { range:1, area:'single', power:2.2, mp:25, desc:'1칸 단일 · 쇠장갑으로 바위도 깨뜨리는 적룡채주의 주먹' },
  // 회복 무공 (아군)
  '운기요상':        { range:1, area:'ally', heal:0.3, mp:12, desc:'자신 · 옆 아군 · 체력 30% 회복 — 내공으로 기혈을 다스려 상처를 치료' },
};
