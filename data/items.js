/* =====================================================================
   물건 · 상점 · 거점 상인
   ===================================================================== */

// 물건 사전
//   type : weapon(무기) / armor(방어구) / accessory(장신구) / treasure(보물 — 심법 서책 · 보패, sub:'심법' | '보패') / consumable(소모품) / material(재료)
//   icon : 그림이 없을 때 배낭 칸에 표시할 글자
//   img  : 그림 (data/assets.js 의 item 이름) — 있으면 글자 대신 그림
//   stat : 장착 시 능력치 보너스 (atk 공격, def 방어, hit 명중, eva 회피, hp 체력, mp 내력)
//   kind : (무기만) 'bow' = 활 — 활을 쓰는 인물(data/units.js 의 weapon:'bow')만 장착. 적지 않으면 검 · 도 등 (활 쓰는 인물은 못 씀)
//   named : true = 명품 (이름난 보물 — 야명주 · 화씨벽 · 간장 · 막야 · 태아검). 이름이 금빛으로 보이고 보물 칸(4번째)에 낌. 제2장부터 전투 보상으로 하나씩
//   excl  : true = 전용 장비 (owner 의 무기 · 방어구). 대장간 '제작'으로만 얻음. 이름이 붉게 보임
const ITEM_DB = {
  // ---- 무기 · 방어구 : 인물마다 정해진 고정 장비 (data/units.js 의 gear) — 바꿔 끼지 않고 대장간에서 강화 · 승급 · 제작 ----
  '목검':   { type:'weapon',     icon:'劍', img:'wood_sword', price:60,  stat:{ atk:5 }, desc:'나무로 깎은 연습용 검.' },
  '철검':   { type:'weapon',     icon:'劍', img:'sword', price:80,  stat:{ atk:8 }, desc:'무쇠를 두드려 만든 검. 투박하지만 날이 단단하다.' },
  '활':     { type:'weapon',     icon:'弓', img:'bow', price:80,  stat:{ atk:8 }, kind:'bow', desc:'사냥꾼들이 즐겨 쓰는 활.' },
  '봉':     { type:'weapon',     icon:'棒', img:'staff', price:80,  stat:{ atk:7, eva:1 }, desc:'단단한 대나무를 깎은 봉. 개방 제자들이 즐겨 쓴다.' },
  '천옷':   { type:'armor',      icon:'衣', img:'cloth', price:100, stat:{ def:3, eva:3 }, desc:'평범한 천으로 지은 옷. 가벼워 몸놀림이 편하다.' },
  '가죽갑옷': { type:'armor',    icon:'甲', img:'leather', price:100, stat:{ def:6 }, desc:'질긴 가죽을 덧대 만든 갑옷. 무겁지만 단단하다.' },
  // ---- 전용 장비 : 보구(주황) +5 장비 + 전용 재료 → 대장간 '제작'. 강화 +7 까지 (from = 원래 장비, owner = 그 인물) ----
  '천씨 가전검': { type:'weapon', icon:'劍', img:'mk_w_t9', excl:true, from:'철검',     owner:'hero',        price:9000, desc:'천씨세가에 대대로 전해지던 검을 다시 벼려 낸 것. 천씨의 검결이 그대로 실린다.' },
  '천씨 호신의': { type:'armor',  icon:'衣', img:'mk_a_unhae', excl:true, from:'천옷',     owner:'hero',        price:9000, desc:'천잠사를 덧대 지은 천씨세가의 호신 무복.' },
  '진무검':     { type:'weapon', icon:'劍', img:'mk_w_song', excl:true, from:'철검',     owner:'cheonghwa',   price:9000, desc:'진무대제의 이름을 딴 무당의 검. 현철로 다시 벼렸다.' },
  '태극 도포':  { type:'armor',  icon:'衣', img:'mk_a_bingung', excl:true, from:'천옷',     owner:'cheonghwa',   price:9000, desc:'태극 문양을 수놓은 무당의 도포. 칼날이 미끄러진다.' },
  '낙일궁':     { type:'weapon', icon:'弓', img:'bow', excl:true, from:'활', kind:'bow', owner:'cheolmyeong', price:9000, desc:'지는 해도 떨어뜨린다는 강궁. 현철로 활채를 덧댔다.' },
  '화원 사냥복': { type:'armor', icon:'甲', img:'mk_a_scale', excl:true, from:'가죽갑옷', owner:'cheolmyeong', price:9000, desc:'화원파의 이름을 새긴 사냥꾼의 가죽옷.' },
  '녹죽봉':     { type:'weapon', icon:'棒', img:'bamboo_staff', excl:true, from:'봉',       owner:'seokun',      price:9000, desc:'푸른 대나무 빛이 도는 봉. 현철 심을 박아 넣었다.' },
  '백결의':     { type:'armor',  icon:'衣', img:'mk_cl_cloth', excl:true, from:'천옷',     owner:'seokun',      price:9000, desc:'백 번을 기운 개방의 옷. 천잠사로 기워 칼이 들지 않는다.' },
  '현철':   { type:'material', icon:'玄', img:'mk_mat1', price:3000, desc:'검은 빛이 도는 귀한 쇠. 전용 무기 제작 재료 (대장간 → 제작).' },
  '천잠사': { type:'material', icon:'蠶', img:'silk', price:3000, desc:'하늘누에가 뽑은 실. 전용 방어구 제작 재료 (대장간 → 제작).' },
  // ---- 도구 (잡화점) ----
  '금창약': { type:'consumable', icon:'藥', img:'salve', price:50,  heal:50,  desc:'상처에 바르는 금창약. 전투 중 "도구"로 쓰면 체력을 50 회복한다.' },
  '금창고': { type:'consumable', icon:'膏', img:'mk_potion_l', price:100, heal:80,  desc:'금창약을 졸여 굳힌 고약. 전투 중 "도구"로 쓰면 체력을 80 회복한다. (제2장부터 잡화점)' },
  '해독제': { type:'consumable', icon:'解', img:'bottle', price:80, cure:'poison', desc:'독을 푸는 약. 전투 중 "도구"로 쓰면 중독이 풀린다.' },
  '청심환': { type:'consumable', icon:'丸', img:'mk_potion_z', price:150, cure:'all', heal:30, desc:'마음을 맑게 하는 환약. 전투 중 "도구"로 쓰면 모든 상태 이상이 풀리고 체력을 30 회복한다. (제2장부터 잡화점)' },
  '철광석': { type:'material',   icon:'鐵', img:'iron_ore', price:120,                 desc:'대장간 재료 (샘플)' },
  '가죽끈': { type:'material',   icon:'繩', img:'leather_strap', price:30,                  desc:'잡다한 재료 (샘플)' },

  // ---- 장신구 (셋째 칸) — 23가지 : tier = 나오는 장 (보물상자) ----
  // 제1장
  '부적':       { type:'accessory', icon:'符', img:'mk_c_t9', price:200, stat:{ eva:3 }, desc:'액운을 막아 준다는 부적. 몸에 지니면 몸놀림이 가벼워진다.' },
  '옥패':       { type:'accessory', icon:'玉', img:'mk_c_jade', price:200, stat:{ def:3 }, desc:'맑은 옥을 깎아 만든 패. 몸에 지니면 마음이 가라앉아 몸이 단단해진다.' },
  '은가락지':   { type:'accessory', icon:'環', img:'mk_c_silver', price:200, stat:{ hit:3 }, desc:'가는 은실을 엮어 만든 가락지. 손끝이 정확해진다.' },
  '구리 팔찌':  { type:'accessory', icon:'鐲', img:'mk_c_ring', price:200, stat:{ atk:2, hit:1 }, desc:'두툼한 구리 팔찌. 손목을 받쳐 칼끝이 흔들리지 않는다.' },
  '수놓은 향낭': { type:'accessory', icon:'囊', img:'pouch', price:200, stat:{ hp:15 }, desc:'약초를 넣어 수놓은 향주머니. 지니면 기운이 돈다.' },
  '무당 호신부': { type:'accessory', icon:'護', img:'mk_c_songhak', price:250, stat:{ def:2, eva:2 }, desc:'장삼봉이 손수 그려 준 무당의 호신부. 몸에 지니면 몸이 가볍고 단단해진다.' },
  '매깃 노리개': { type:'accessory', icon:'羽', img:'knot', price:250, stat:{ hit:3, eva:1 }, desc:'위지렴이 사냥할 때 늘 지니던 매 깃 노리개. 지니면 눈이 밝아진다고 한다.' },
  // 제2장
  '비취 가락지': { type:'accessory', icon:'翠', img:'mk_c_shu', price:400, stat:{ hit:5, eva:2 }, desc:'맑은 비취를 깎아 만든 가락지. 손끝이 정확해지고 몸놀림이 가벼워진다.' },
  '호심경':     { type:'accessory', icon:'鏡', img:'mk_c_t6', price:400, stat:{ def:5 },        desc:'가슴에 대는 둥근 구리 거울. 급소를 지켜 준다.' },
  '금사 요대':  { type:'accessory', icon:'帶', img:'mk_b_shu', price:400, stat:{ hp:30 },        desc:'금실을 엮어 짠 허리띠. 허리를 단단히 받쳐 오래 버티게 한다.' },
  '청동 잠':    { type:'accessory', icon:'簪', img:'bronze_pin', price:400, stat:{ mp:6, eva:2 },  desc:'청동으로 만든 비녀. 머리가 맑아지고 몸이 가볍다.' },
  '호피 요대':  { type:'accessory', icon:'虎', img:'mk_b_beast', price:450, stat:{ atk:3, hp:20 }, desc:'범 가죽으로 만든 허리띠. 지니면 기세가 오른다.' },
  '산호 귀걸이': { type:'accessory', icon:'珊', img:'coral_earrings', price:450, stat:{ hit:4, mp:5 }, desc:'붉은 산호를 깎은 귀걸이. 귀가 밝아지고 기가 고요해진다.' },
  // 제3장
  '팔괘 옥패':  { type:'accessory', icon:'卦', img:'mk_c_gucheon', price:600, stat:{ def:4, eva:4 }, desc:'팔괘를 새긴 옥패. 지니면 몸이 단단해지고 발이 가벼워진다.' },
  '묵옥 반지':  { type:'accessory', icon:'墨', img:'mk_c_cheonmyeon', price:600, stat:{ atk:6 },        desc:'먹빛 옥을 깎아 만든 반지. 지니면 손에 힘이 붙는다.' },
  '백옥 잠':    { type:'accessory', icon:'簪', img:'jade_pin', price:600, stat:{ mp:12 },        desc:'흰 옥으로 만든 비녀. 머리를 맑게 해 기를 모으기 쉽다.' },
  '금강 팔찌':  { type:'accessory', icon:'剛', img:'mk_c_yeomju', price:650, stat:{ def:6, hp:20 }, desc:'금강석 가루를 입힌 팔찌. 몸이 쇠처럼 단단해진다.' },
  '자수정 노리개': { type:'accessory', icon:'紫', img:'mk_c_hongryeon', price:650, stat:{ eva:6, hit:3 }, desc:'자수정을 꿴 노리개. 지니면 발놀림이 날래진다.' },
  '용문 요대':  { type:'accessory', icon:'龍', img:'mk_b_t9', price:650, stat:{ atk:5, hp:30 }, desc:'용 무늬를 새긴 허리띠. 기세와 기력이 함께 오른다.' },
  // 제4장
  '천잠 장갑':  { type:'accessory', icon:'掌', img:'mk_wr_shu', price:900, stat:{ atk:8, hit:4 }, desc:'천잠사로 짠 장갑. 칼날을 맨손으로 잡아도 베이지 않는다.' },
  '봉황 비녀':  { type:'accessory', icon:'鳳', img:'phoenix_pin', price:900, stat:{ mp:18, eva:3 }, desc:'봉황을 새긴 비녀. 기가 맑게 차오른다.' },
  '현무 호심경': { type:'accessory', icon:'玄', img:'mk_a_hyeonmu', price:900, stat:{ def:9, hp:30 }, desc:'거북 등껍질 무늬를 새긴 호심경. 급소를 단단히 지킨다.' },
  '청룡 옥패':  { type:'accessory', icon:'靑', img:'mk_c_cheongryong', price:900, stat:{ atk:6, def:4, hit:3 }, desc:'청룡을 새긴 옥패. 지니면 기세가 넘친다.' },

  // ---- 보물 (넷째 칸) — 23가지 : 심법(서책) · 보패 · 보검 ----
  // 제1장
  '토납법 서책': { type:'treasure', sub:'심법', icon:'書', img:'book', price:150, stat:{ mp:3 }, desc:'숨을 고르고 기를 다스리는 법을 적은 서책. 지니면 내공이 조금 는다.' },
  '전뢰심법':   { type:'treasure', sub:'심법', icon:'書', img:'book', price:300, stat:{ mp:7 }, desc:'번개처럼 기를 몰아치는 심법을 적은 서책. 지니면 내공이 오른다.' },
  '팔단금 서책': { type:'treasure', sub:'심법', icon:'書', img:'book', price:200, stat:{ hp:20 }, desc:'여덟 가지 동작으로 몸을 다스리는 법을 적은 서책. 지니면 몸이 튼튼해진다.' },
  '호박 구슬':  { type:'treasure', sub:'보패', icon:'珀', img:'amber', price:200, stat:{ hit:2, mp:4 }, desc:'벌레가 든 호박 구슬. 들여다보면 마음이 가라앉는다.' },
  '은장도':     { type:'treasure', sub:'보검', icon:'刀', img:'mk_w_steel', price:200, stat:{ atk:3, eva:2 }, desc:'은으로 장식한 작은 칼. 몸에 지니는 호신용 칼.' },
  // 제2장
  '소주천 요결': { type:'treasure', sub:'심법', icon:'書', img:'book', price:450, stat:{ mp:10 }, desc:'기를 몸 안에서 작게 한 바퀴 돌리는 요령을 적은 서책. 지니면 내공이 는다.' },
  '육자결 요결': { type:'treasure', sub:'심법', icon:'書', img:'book', price:450, stat:{ mp:6, def:3 }, desc:'여섯 가지 소리로 숨을 고르는 법을 적은 서책. 몸과 기를 함께 다스린다.' },
  '청옥 인장':  { type:'treasure', sub:'보패', icon:'印', img:'mk_c_musan', price:450, stat:{ def:3, mp:6 }, desc:'청옥을 깎아 만든 도장. 지니면 마음이 굳건해진다.' },
  '산호수':     { type:'treasure', sub:'보패', icon:'珊', img:'mk_mat7', price:450, stat:{ hp:25, mp:5 }, desc:'나뭇가지 모양의 붉은 산호. 기혈을 돋운다고 한다.' },
  '호신 비수':  { type:'treasure', sub:'보검', icon:'匕', img:'mk_w_blue', price:450, stat:{ atk:5, hit:2 }, desc:'소매에 숨기는 날카로운 비수.' },
  // 제3장
  '대주천 요결': { type:'treasure', sub:'심법', icon:'書', img:'book', price:700, stat:{ mp:15 }, desc:'기를 온몸으로 크게 돌리는 요령을 적은 서책. 지니면 내공이 크게 는다.' },
  '역근경 초본': { type:'treasure', sub:'심법', icon:'書', img:'book', price:700, stat:{ def:6, hp:30 }, desc:'힘줄을 바꾼다는 공부의 앞부분만 베낀 초본. 지니면 몸이 단단해진다.' },
  '혼원공 요결': { type:'treasure', sub:'심법', icon:'書', img:'book', price:700, stat:{ mp:12, def:4 }, desc:'기를 하나로 뭉쳐 두르는 법을 적은 서책.' },
  '자금 향로':  { type:'treasure', sub:'보패', icon:'爐', img:'mk_mp_m', price:700, stat:{ mp:8, hp:20 }, desc:'자줏빛 금으로 빚은 작은 향로. 향을 피우면 기가 고요해진다.' },
  '수정 구슬':  { type:'treasure', sub:'보패', icon:'晶', img:'mk_c_bingbaek', price:700, stat:{ hit:5, eva:3 }, desc:'티 없이 맑은 수정 구슬. 눈이 밝아진다.' },
  '칠성 비수':  { type:'treasure', sub:'보검', icon:'匕', img:'mk_w_shu', price:750, stat:{ atk:8, hit:3 }, desc:'북두칠성을 새긴 비수. 던지면 빗나가지 않는다고 한다.' },
  // 제4장
  '태청 심법':  { type:'treasure', sub:'심법', icon:'書', img:'book', price:1000, stat:{ mp:20, hit:3 }, desc:'맑고 높은 기운을 다스리는 도가의 심법을 적은 서책.' },
  '태허 심결':  { type:'treasure', sub:'심법', icon:'書', img:'book', price:1000, stat:{ mp:18, def:5 }, desc:'텅 빈 데서 기를 길어 올리는 비결을 적은 서책.' },
  // 명품 (전투 보상 — 제2장부터 한 전투에 하나씩)
  '야명주': { type:'treasure', sub:'보패', icon:'珠', img:'mk_c_west', named:true, price:3000, stat:{ hit:4, mp:6 },  desc:'어둠 속에서도 달빛처럼 빛나는 구슬. 지니면 눈이 밝아지고 기가 맑아진다.' },
  '화씨벽': { type:'treasure', sub:'보패', icon:'璧', img:'mk_c_t8', named:true, price:5000, stat:{ def:4, hp:20 }, desc:'초나라 사람 변화가 두 번이나 발이 잘리면서도 바친 천하의 보옥. 지니면 몸이 굳건해진다.' },
  '간장':   { type:'treasure', sub:'보검', icon:'劍', img:'mk_w_west', named:true, price:4000, stat:{ atk:15, hit:3 }, desc:'오나라의 명장 간장이 아내 막야와 함께 벼려 낸 한 쌍의 명검 중 웅검(雄劍). 묵직하고 곧다.' },
  '막야':   { type:'treasure', sub:'보검', icon:'劍', img:'mk_w_maehwa', named:true, price:4000, stat:{ atk:13, eva:4 }, desc:'간장과 한 쌍을 이루는 자검(雌劍). 아내 막야의 이름을 땄다. 가볍고 날래다.' },
  '태아검': { type:'treasure', sub:'보검', icon:'劍', img:'mk_w_cheonmyeong', named:true, price:4500, stat:{ atk:16, hit:2 }, desc:'구야자와 간장이 함께 벼렸다는 세 자루 명검 가운데 하나. 위엄의 검이라 불린다.' },

  // ---- 표국 · 보물상자 · 전투 보상 ----
  '강화석': { type:'material', icon:'強', img:'mk_stone1', price:100, desc:'무기와 방어구를 단단하게 벼리는 돌. 대장간 "강화"에 쓴다.' },
  '승급석': { type:'material', icon:'昇', img:'mk_stone4', price:300, desc:'물건의 격을 끌어올리는 귀한 돌. 대장간 "승급"으로 무기 · 방어구의 등급을 올린다 (흔함 → 상급 → 희귀 → 보구).' },
  '보물상자': { type:'material', icon:'箱', img:'treasure_chest', price:400, desc:'표국 행렬이 사례로 받아 오거나 전투에서 거둔 상자. 열면 강화석과 장신구 · 보물 하나가 나온다.' },
  '금전상자': { type:'material', icon:'錢', img:'gold_chest', price:300, desc:'전투에서 거둔 돈궤. 열면 금이 나온다 (장이 오를수록 많이).' },
  '초급 영약': { type:'material', icon:'丹', img:'pills', price:500,  desc:'기운을 북돋는 약. 복용하면 최대 체력 · 내공이 영구히 +10 (인물마다 5개까지).' },
  '중급 영약': { type:'material', icon:'丹', img:'mk_potion_t', price:1200, desc:'귀한 약재를 달여 빚은 영약. 복용하면 최대 체력 · 내공이 영구히 +25 (인물마다 5개까지).' },
};
// 이름을 바꾼 물건 (예전 저장을 불러올 때 새 이름으로 바꿔 줌)  옛 이름 : 새 이름
const ITEM_RENAMED = { '토나법 서책':'토납법 서책', '보물':'보물상자', '영약':'초급 영약' };

const ITEM_TYPE_NAME = { weapon:'무기', armor:'방어구', accessory:'장신구', treasure:'보물', consumable:'소모품', material:'재료' };
const EQUIP_SLOTS = [['weapon','무기'], ['armor','방어구'], ['accessory','장신구'], ['treasure','보물']];
// 장비 칸 글자 (상태보기 — 초상화 왼쪽 네 칸)
const EQUIP_GLYPH = { weapon:'武', armor:'甲', accessory:'飾', treasure:'寶' };
const STAT_NAME = { atk:'공격', def:'방어', hit:'명중', eva:'회피', hp:'체력', mp:'내공' };

const BAG_SIZE = 30;          // 배낭 칸 수 (같은 물건은 한 칸에 겹쳐 보관)
const START_GOLD = 0;         // 새 게임 시작 금 (금 = 잡화점 · 대장간. 훈련장은 수련치)

// 대장간 (무기 · 방어구 — 인물마다 정해진 고정 장비)
//   이름 = [등급 ]원래 이름[ +강화]  예) 철검 · 철검 +3 · 상급 철검 +2 · 보구 천옷 +5 · 천씨 가전검 +7 (전용)
//   능력치 = 원래 능력치 × (등급 배수 statMult + 강화 단계 × perLevel)   — 철검 공격 8 : 흔함 +3 = 14 · 상급 +0 = 16 …
// 강화 : 등급마다 최대 단계 (cap) 까지. stone / gold = +1 ~ +7 로 올릴 때 드는 강화석 · 금
const ENHANCE = {
  cap:   [3, 4, 5, 5, 7],                 // 흔함 +3 · 상급 +4 · 희귀 +5 · 보구 +5 · 전용 +7
  stone: [1, 1, 2, 2, 3, 3, 4],
  gold:  [50, 80, 120, 160, 200, 300, 400],
  perLevel: 0.25,
};
// 승급 : 그 등급의 최대 강화 (need) + 승급석 · 금 → 다음 등급, 강화는 0 단계부터
//   흔함 → 상급(파랑) : +3 · 승급석 1 / 상급 → 희귀(보라) : +4 · 승급석 2 / 희귀 → 보구(주황) : +5 · 승급석 4
//   보구 +5 → 전용 (대장간 '제작' — 전용 재료 : 무기 현철 · 방어구 천잠사)
const PROMOTE = {
  names:    ['흔함', '상급', '희귀', '보구', '전용'],
  need:     [3, 4, 5],
  stone:    [1, 2, 4],
  gold:     [3000, 8000, 20000],
  statMult: [1, 2, 3.25, 4.75, 7],
};
// 전용 장비 제작 : 보구 +5 + 재료 → 전용 (강화 0 단계, +7 까지)
const CRAFT = { needGrade:3, needLv:5, gold:30000, material:{ weapon:'현철', armor:'천잠사' } };
// 영약 : 상태보기 → 배낭에서 '복용' → 그 인물의 최대 체력 · 내공이 영구히 오름 (종류마다 인물당 max 개까지)
const ELIXIRS = [
  { item:'초급 영약', stat:{ hp:10, mp:10 }, max:5 },
  { item:'중급 영약', stat:{ hp:25, mp:25 }, max:5 },
];
// 보물상자 : 배낭에서 '열기' → '보물상자를 여시겠습니까?' → 강화석(꼭) + loot 중 하나
//   stone : 꼭 함께 나오는 강화석 개수 — 장마다 (서장 · 제1장, 제2장, 제3장 …, 모자라면 마지막 값)
//   loot  : w = 장마다 나올 무게 [서장·1장, 2장, 3장 …] (모자라면 마지막 값, 0 = 그 장에서는 안 나옴). 클수록 잘 나옴
//   상자를 '여는' 때의 장을 따름 (모아 뒀다가 다음 장에서 열면 새 물건이 나올 수 있음). 표국이 가져오는 상자도 같음
const TREASURE_BOX = {
  item: '보물상자',
  stone: [2, 5, 8, 11],
  loot: [
    // 제1장 (장신구 · 보물)
    { item:'부적',        w:[3, 1, 0, 0] }, { item:'옥패',        w:[3, 1, 0, 0] }, { item:'은가락지',    w:[3, 1, 0, 0] },
    { item:'구리 팔찌',   w:[3, 1, 0, 0] }, { item:'수놓은 향낭', w:[3, 1, 0, 0] },
    { item:'토납법 서책', w:[3, 1, 0, 0] }, { item:'전뢰심법',    w:[1, 1, 0, 0] }, { item:'팔단금 서책', w:[2, 1, 0, 0] },
    { item:'호박 구슬',   w:[2, 1, 0, 0] }, { item:'은장도',      w:[2, 1, 0, 0] },
    // 제2장
    { item:'비취 가락지', w:[0, 2, 1, 0] }, { item:'호심경',      w:[0, 2, 1, 0] }, { item:'금사 요대',   w:[0, 2, 1, 0] },
    { item:'청동 잠',     w:[0, 2, 1, 0] }, { item:'호피 요대',   w:[0, 2, 1, 0] }, { item:'산호 귀걸이', w:[0, 2, 1, 0] },
    { item:'소주천 요결', w:[0, 1, 1, 0] }, { item:'육자결 요결', w:[0, 2, 1, 0] }, { item:'청옥 인장',   w:[0, 2, 1, 0] },
    { item:'산호수',      w:[0, 2, 1, 0] }, { item:'호신 비수',   w:[0, 2, 1, 0] },
    // 제3장
    { item:'팔괘 옥패',   w:[0, 0, 2, 1] }, { item:'묵옥 반지',   w:[0, 0, 2, 1] }, { item:'백옥 잠',     w:[0, 0, 2, 1] },
    { item:'금강 팔찌',   w:[0, 0, 2, 1] }, { item:'자수정 노리개', w:[0, 0, 2, 1] }, { item:'용문 요대', w:[0, 0, 2, 1] },
    { item:'대주천 요결', w:[0, 0, 1, 1] }, { item:'역근경 초본', w:[0, 0, 2, 1] }, { item:'혼원공 요결', w:[0, 0, 2, 1] },
    { item:'자금 향로',   w:[0, 0, 2, 1] }, { item:'수정 구슬',   w:[0, 0, 2, 1] }, { item:'칠성 비수',   w:[0, 0, 2, 1] },
    { item:'승급석',      w:[0, 0, 1, 1] },
    // 제4장
    { item:'천잠 장갑',   w:[0, 0, 0, 2] }, { item:'봉황 비녀',   w:[0, 0, 0, 2] }, { item:'현무 호심경', w:[0, 0, 0, 2] },
    { item:'청룡 옥패',   w:[0, 0, 0, 2] }, { item:'태청 심법',   w:[0, 0, 0, 2] }, { item:'태허 심결',   w:[0, 0, 0, 2] },
    { item:'현철',        w:[0, 0, 0, 1] }, { item:'천잠사',      w:[0, 0, 0, 1] },
  ],
};

// 금전상자 : 배낭에서 '열기' (한 개씩) 또는 '모두 열기' → 금. gold = 장마다 한 상자의 [최소, 최대] (서장 · 제1장, 제2장, 제3장, 제4장 …, 모자라면 마지막 것)
//   전투마다 받는 개수는 data/battles.js 의 BATTLE_COMMON_LOOT ('order' = 몇 번째 전투인지 — 첫 전투 1개, 두 번째 2개 …)
const GOLD_BOX = {
  item: '금전상자',
  gold: [ [100, 300], [200, 400], [300, 600], [400, 800] ],
};

// 잡화점에서 파는 물건 (가격은 ITEM_DB)
// 장마다 [제1장(서장 포함), 제2장, 제3장 …] — 모자라면 마지막 것. 무기 · 방어구는 팔지 않음 (인물마다 고정 장비)
const SHOP_STOCK = [
  ['금창약', '해독제'],
  ['금창약', '금창고', '해독제', '청심환'],
];
const SELL_RATE = 0.5;        // 판매가 = 가격 × 0.5

// 거점 상인
const NPCS = {
  smith: { title:'대장간', name:'대장장이', img:'npc.smith', line:'불 앞에서 땀 좀 흘려볼 텐가?',                menu:['제작','승급','강화'] },
  store: { title:'잡화점', name:'잡화상',   img:'npc.store', line:'어서 오시게. 필요한 게 있으면 말씀하시게.', menu:['구매','판매'] },
};
