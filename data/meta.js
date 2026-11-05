/* =====================================================================
   업적 · 도감 · 돌발 임무 · 기연 · 끝 화면 대화(물건 · 무공 전수)  (v122)
   ---------------------------------------------------------------------
   엔진 쪽은 js/meta.js. 여기는 내용만 — 이름 · 대사 · 보상은 모두 바꾸기 쉬움
   ===================================================================== */

/* ---------- 새 무공 (기연 · 전수로 배움) ---------- */
Object.assign(SKILLS, {
  '타구봉법 · 봉자결': { range:2, area:'line2', power:1.6, mp:18, desc:'직진 2칸 · 길을 막아 둘을 한꺼번에 치는 타구봉법의 결 (노유각에게 배움)' },
  '태극권 · 운수':     { range:1, area:'sweep3', power:1.6, mp:20, desc:'앞쪽 가로 3칸 · 구름이 손을 따라 흐르듯 밀어내는 태극권 (장삼봉에게 배움)' },
  '낙영신검장 · 오화': { range:3, minRange:2, area:'volley3', power:1.5, mp:24, desc:'2~3칸 앞 가로 3칸 · 다섯 송이 꽃잎이 한꺼번에 지는 도화도의 장법 (황용에게 배움)' },
  '반야장':            { range:1, area:'single', power:2.0, mp:26, desc:'1칸 단일 · 지혜로 마를 누르는 소림 반야당의 장법 (백운에게 배움)' },
  '매화 연환전':       { range:4, minRange:2, area:'single', power:1.9, mp:22, desc:'2~4칸 단일 · 매화검리를 이어 쏘는 화살 — 꽃이 지기 전에 다음 꽃이 핀다 (청송진인에게 배움)' },
});

/* ---------- 끝 화면 대화 : 장면의 끝 화면(출정 전)에 인물을 더함 ----------
   META_NPCS[장면] = [ 인물, … ] — 인물 적는 법은 data/scenes.js 의 npcs 와 같음 (talk · give · after)
   cond  : 이 조건일 때만 나타남 (아래 metaCond) — 조건을 못 채우면 아예 보이지 않음
   kiyeon : 기연 이름표 — 있으면 '緣' 표시 · 처음 말을 걸면 기연 도감에 남고 업적 · 다회차 점수에 셈
     cond 의 종류 : { mission:'임무 id' } 완료 · { member:'인물 id' } 합류 · { realm:['인물 id','절정 초입'] } 그 경지 이상
                    { kiyeon:n } 기연을 n번 이상 만남 · { level:n } 주인공 레벨 이상  (여럿을 적으면 모두) */
const META_NPCS = {
  // ---- 기연 ----
  ng_return: [
    { id:'noyugak', x:34, y:64, kiyeon:'ky_hugae', cond:{ mission:'gb_seokun' },
      talk:[
        { who:'noyugak', text:'방주 심부름으로 남궁세가까지 왔네. 자네가 천씨의 아이로군. 절강 분타에서 우리 후개를 지켜 줬다지.' },
        { who:'hero',    text:'석운이 먼저 앞을 막았습니다. 저는 등을 맡았을 뿐입니다.' },
        { who:'noyugak', text:'허허, 겸손하기는. 석운아, 이리 와 보거라. 방주께서 네게 아직 안 보여 주신 결이 하나 있다.' },
        { who:'seokun',  text:'장로님, 그거… 봉자결 말이오?' },
        { who:'noyugak', text:'막을 봉(封) 자다. 길을 막고 둘을 한꺼번에 치는 결이지. 지킬 줄 아는 놈한테만 가르친다.', give:true },
      ],
      give:{ skill:'타구봉법 · 봉자결', to:'seokun', item:'초급 영약' },
      after:'후개를 잘 부탁하네. 장난이 심해도 속은 깊은 놈이야.' },
  ],
  ng_after: [
    { id:'namgung_wi', x:34, y:64, kiyeon:'ky_changgung', cond:{ mission:'ng_seol' },
      talk:[
        { who:'namgung_wi',   text:'후원에서 설이를 지켜 주었다 들었네. 남궁이 진 빚이 하나 더 늘었군.' },
        { who:'hero',         text:'남궁 소저의 검이 먼저였습니다. 저희는 곁에 있었을 뿐입니다.' },
        { who:'namgung_wi',   text:'설아. 네 오라비에게만 가르치던 검이다. 이제 너도 받거라.' },
        { who:'namgung_seol', text:'…아버님. 창궁무애검을, 제게요?' },
        { who:'namgung_wi',   text:'하늘에 끝이 없듯, 지킬 것이 있는 검에도 끝이 없다. 그것만 잊지 마라.', give:true },
      ],
      give:{ skill:'창궁무애검', to:'namgung_seol' },
      after:'설이를 부탁하네. 고집은 제 어미를 닮았지.' },
  ],
  ml_arrival: [
    { id:'zhang', x:34, y:64, kiyeon:'ky_taegeuk', cond:{ member:'cheonghwa', realm:['cheonghwa','절정 초입'] },
      talk:[
        { who:'zhang',     text:'청화야. 숭산까지 오느라 고생이 많았구나.' },
        { who:'cheonghwa', text:'사조님! 무당을 떠나 이곳까지 어인 일로…' },
        { who:'zhang',     text:'늙은이도 가끔은 산을 내려온다. 네 검이 얼마나 자랐는지 보고 싶었다.' },
        { who:'zhang',     text:'검이 막히거든 손을 써라. 구름이 손을 따라 흐르듯 — 운수(雲手)다. 이것도 태극이다.', give:true },
        { who:'cheonghwa', text:'…명심하겠습니다, 사조님.' },
      ],
      give:{ skill:'태극권 · 운수', to:'cheonghwa' },
      after:'{name} {소협|소저}. 청화를 부탁하네. 저 아이는 남을 먼저 생각해서 탈이야.' },
  ],
  lk_arrival: [
    { id:'huang', x:34, y:64, kiyeon:'ky_ohwa', cond:{ member:'seokun', mission:'bk_giant' },
      talk:[
        { who:'huang',  text:'북망산에서 석운이가 시혈 거인을 혼자 꺾었다며? 우리 후개, 이제 제법인데.' },
        { who:'seokun', text:'방주님! 혼자는 아니었소. 대주가 등을 받쳐 줘서…' },
        { who:'huang',  text:'그 대주한테 할 말이 있어서 왔어. {name}, 예전에 가르쳐 준 낙영신검장 기억하죠?' },
        { who:'hero',   text:'꽃잎이 겹쳐 밀려가던 그 장법 말씀이시지요.' },
        { who:'huang',  text:'그건 기초였고요. 이번엔 다섯 송이가 한꺼번에 지는 걸 보여 줄게요. 잘 봐요, 두 번은 안 해요.', give:true },
      ],
      give:{ skill:'낙영신검장 · 오화', to:'hero' },
      after:'정 오라버니한테는 제가 왔었다고 말하지 마요. 또 걱정하니까.' },
  ],
  tl_arrival: [
    { id:'baekun', x:34, y:64, kiyeon:'ky_banya', cond:{ member:'hyegong', realm:['hyegong','절정 중기'] },
      talk:[
        { who:'baekun',  text:'혜공. 남소림까지 왔구나. 네 권에서 살기가 많이 빠졌다.' },
        { who:'hyegong', text:'태상장로님…! 숭산을 비우고 어찌 이 먼 데까지.' },
        { who:'baekun',  text:'사십 년 전 내가 보고도 막지 못한 일이 이제 끝나려 한다. 늙은이 몫을 하러 왔지.' },
        { who:'baekun',  text:'반야장이다. 마를 누르는 것은 힘이 아니라 지혜라는 장법이지. 네 손이라면 쓸 수 있다.', give:true },
        { who:'hyegong', text:'…받들겠습니다.' },
      ],
      give:{ skill:'반야장', to:'hyegong' },
      after:'{name} 대주. 천무극을 만나거든… 그도 한때는 사람을 지키려던 이였다는 것만 기억해 주게.' },
  ],
  nb_arrival: [
    { id:'hwasan_munju', x:34, y:64, kiyeon:'ky_maehwa', cond:{ mission:'hr_twins' },
      talk:[
        { who:'hwasan_munju', text:'연화봉에서 현원과 현적을 살려 준 은혜를 아직 갚지 못했구려.' },
        { who:'hero',         text:'두 분이 이제 성화대와 함께 가니, 그걸로 충분합니다.' },
        { who:'hwasan_munju', text:'허허. 위 문주, 이리 오시오. 매화낙영전을 넘어선 수가 하나 있소.' },
        { who:'cheolmyeong',  text:'진인께서 또 가르쳐 주신다면야 마다할 리 없지요.' },
        { who:'hwasan_munju', text:'꽃이 지기 전에 다음 꽃이 피게 하시오. 매화 연환전 — 화살이 끊기지 않는 법이오.', give:true },
      ],
      give:{ skill:'매화 연환전', to:'cheolmyeong' },
      after:'화산의 쌍검을 부탁하오. 둘 다 아직 철이 없소.' },
  ],
  yc_night: [
    { id:'zhang', x:34, y:64, kiyeon:'ky_taea', cond:{ kiyeon:4 },
      talk:[
        { who:'zhang', text:'곤륜의 눈이 차구나. {name}, 잠시 이 늙은이와 걷세.' },
        { who:'hero',  text:'진인께서 여기까지… 원정에 함께하시는 겁니까?' },
        { who:'zhang', text:'아니. 이것을 주러 왔네. 구야자와 간장이 함께 벼렸다는 태아검 — 무당이 백 년을 맡아 둔 검일세.' },
        { who:'zhang', text:'자네는 가는 곳마다 사람을 만나 무언가를 이어받았지. 그런 이의 손에 있어야 할 검이야.', give:true },
        { who:'hero',  text:'…반드시 돌려드리러 무당에 가겠습니다.' },
      ],
      give:{ item:'태아검' },
      after:'검은 사람을 베려고 있는 게 아닐세. 그 말만 기억하게.' },
  ],

  // ---- 끝 화면 대화 : 물건 · 무공 전수 (조건 없음) ----
  cd_night: [
    { id:'hyegong', x:34, y:64,
      talk:[
        { who:'hyegong', text:'대주. 주먹 쓰는 법을 하나 알려 드리리다. 칼을 놓쳤을 때 쓸 만할 거요.' },
        { who:'hero',    text:'소림의 권법을요? 함부로 배워도 되는 겁니까?' },
        { who:'hyegong', text:'나한권은 소림 제자라면 맨 처음 배우는 권이오. 처음이 곧 끝이라 했소.', give:true },
      ],
      give:{ skill:'나한권', to:'hero' },
      after:'주먹은 마지막에 쓰는 거요. 그 전에 사람을 살릴 길을 먼저 찾으시오.' },
  ],
  kl_after: [
    { id:'dangsoso', x:34, y:64,
      talk:[
        { who:'dangsoso', text:'사막은 전갈 천지래요. 독에 물리면 이거 바로 쓰세요.' },
        { who:'hero',     text:'당가의 해독제를 이렇게 많이… 고맙소.' },
        { who:'dangsoso', text:'독을 만드는 집이니까 푸는 것도 우리가 제일 잘해요. 대신 하나는 저 주셔야 해요.', give:true },
      ],
      give:{ items:[ { item:'해독제', n:3 }, '청심환' ] },
      after:'사막 전갈 독은 사흘 가요. 안 풀리면 저한테 오세요.' },
  ],
  bo_arrival: [
    { id:'jeongsim', x:34, y:64,
      talk:[
        { who:'jeongsim',  text:'청화 소저, 앞에서 늘 맞는 걸 보면 마음이 쓰여요. 관음수를 알려 드릴게요.' },
        { who:'cheonghwa', text:'아미의 치유술을… 제가 배워도 되나요?' },
        { who:'jeongsim',  text:'남을 낫게 하는 손은 누가 가져도 좋은 손이에요. 자, 숨을 이렇게.', give:true },
      ],
      give:{ skill:'관음수', to:'cheonghwa' },
      after:'다쳤을 때는 자기부터 낫게 하세요. 그래야 남도 지켜요.' },
  ],
  gbt_arrival: [
    { id:'jegal_yun', x:34, y:64,
      talk:[
        { who:'jegal_yun', text:'대주, 숙부께서 이걸 대주께 드리라 하셨습니다. 팔괘를 새긴 옥패입니다.' },
        { who:'hero',      text:'제갈 군사께서? 받아도 되는 겁니까.' },
        { who:'jegal_yun', text:'무덤에 들어가는 이에게는 길을 잃지 않을 부적이 필요하다고 하셨지요. 숙부다운 말씀입니다.', give:true },
      ],
      give:{ item:'팔괘 옥패' },
      after:'북망산의 길은 제가 외워 두었습니다. 걱정 마십시오.' },
  ],
  gz_arrival: [
    { id:'seolran', x:34, y:64,
      talk:[
        { who:'seolran', text:'남쪽은 덥네요. 빙궁에서 가져온 것 중에 이게 제일 시원해요.' },
        { who:'hero',    text:'흰 옥으로 만든 비녀로군요.' },
        { who:'seolran', text:'궁주님이 길 떠날 때 주신 거예요. 기가 맑아진대요. 저보다 {name} {소협|소저}께 필요할 것 같아요.', give:true },
      ],
      give:{ item:'백옥 잠' },
      after:'바다는 처음이에요. 얼음보다 넓네요.' },
  ],
  mc_arrival: [
    { id:'hyegong', x:34, y:64,
      talk:[
        { who:'hyegong', text:'총단 앞이오. 소림에서 챙겨 온 승급석이 둘 있소. 대장간에 맡기시오.' },
        { who:'hero',    text:'귀한 것을 어찌…' },
        { who:'hyegong', text:'돌은 쓰라고 있는 거요. 마교 놈들 칼보다 우리 칼이 무뎌서야 되겠소.', give:true },
      ],
      give:{ item:'승급석', n:2 },
      after:'천마전까지 가면 물러설 곳이 없소. 준비를 단단히 하시오.' },
  ],
  bg_arrival: [
    { id:'namgung_jin', x:34, y:64,
      talk:[
        { who:'namgung_jin',  text:'설아, 이리 와. 아버님이 가르치다 만 걸 마저 가르쳐 주마.' },
        { who:'namgung_seol', text:'오라버니… 제왕검형을요?' },
        { who:'namgung_jin',  text:'세 칸 앞까지 한 줄로 베는 남궁의 검이다. 너라면 오라비보다 잘 쓸 거다.', give:true },
      ],
      give:{ skill:'제왕검형', to:'namgung_seol' },
      after:'남궁의 검은 둘이 쓸 때 더 강하다. 아버님 말씀이었지.' },
  ],
  th_arrival: [
    { id:'haun', x:34, y:64,
      talk:[
        { who:'haun', text:'천명대 앞이군. 곤륜에서 겨룬 빚을 아직 못 갚았지.' },
        { who:'hero', text:'빚이라니요. 그때 저도 많이 배웠습니다.' },
        { who:'haun', text:'그러니 이번엔 내가 가르쳐 주지. 운룡대팔식 — 세 칸을 한 줄로 꿰는 곤륜의 검이다.', give:true },
      ],
      give:{ skill:'운룡대팔식', to:'hero' },
      after:'다음에 겨룰 때는 이걸로 나를 이겨 봐라.' },
  ],
  cg_meet: [
    { id:'cheonghwa', x:34, y:64,
      talk:[
        { who:'cheonghwa', text:'{name} {소협|소저}. 무당을 떠날 때부터 드리려던 게 있어요.' },
        { who:'hero',      text:'자수정 노리개… 청화 소저 것이 아니오?' },
        { who:'cheonghwa', text:'이제 마지막이니까요. 끝까지 같이 가겠다는 약속이에요.', give:true },
      ],
      give:{ item:'자수정 노리개' },
      after:'다 끝나면… 무당에 같이 가요. 사조님께 인사드려야죠.' },
  ],
};

/* ---------- 돌발 임무 : 전투 중간에 생기는 작은 목표 (수락 없이 저절로) ----------
   BQUESTS[전투] = [ … ]   — 승리하면 보상 (지면 다시하기에서 처음부터)
   chest : 보물상자 — at:[x,y] 를 적지 않으면 지도에서 아군과 떨어진 샛길 칸에 저절로 놓임
           hidden:true = 아군이 3칸 안에 들어와야 보임 / until:n = n턴이 지나면 사라짐 (없으면 끝까지)
           아군이 그 칸에서 이동을 마치면 엶
   hunt  : 그 턴(turn) 에 적 쪽 끝에서 이름 있는 강적(중간보스)이 나타남 — until 턴까지 쓰러뜨리면 성공, 넘기면 달아남
           base = 바탕이 될 적 (능력 · 얼굴), level = 레벨 */
const BQUESTS = {
  jeokryong_raid:  [ { id:'bq_jr_chest',  kind:'chest', title:'적룡채가 숨긴 재물', hidden:true, reward:{ item:'은장도', gold:300 } } ],
  nangya_market:   [ { id:'bq_nm_hunt',   kind:'hunt',  title:'녹림 쌍도객', base:'nokrim', level:'hero+1', turn:3, until:7,
                       talk:[ { who:'arrival', text:'두목이 밀린다고? 쌍도객이 왔다, 저잣거리를 뒤집어 놓겠다!' } ], reward:{ item:'강화석', n:3, gold:300 } } ],
  namgung_garden:  [ { id:'bq_ng_chest',  kind:'chest', title:'후원 석등 아래의 상자', hidden:true, reward:{ item:'호박 구슬' } } ],
  taihu_raid:      [ { id:'bq_th_chest',  kind:'chest', title:'수채의 금고', until:8, reward:{ item:'산호 귀걸이', gold:400 } } ],
  samhyeop_pass:   [ { id:'bq_sh_hunt',   kind:'hunt',  title:'협곡의 외눈 흑곰', base:'canyon_bear', level:'hero+2', turn:3, until:7,
                       talk:[ { who:'arrival', text:'(잔도가 흔들릴 만큼 큰 외눈 흑곰이 바위 뒤에서 걸어 나온다!)' } ], reward:{ item:'금사 요대' } } ],
  beast_palace:    [ { id:'bq_bp_chest',  kind:'chest', title:'야수궁의 공물', hidden:true, reward:{ item:'호피 요대' } } ],
  black_sand:      [ { id:'bq_bs_chest',  kind:'chest', title:'모래에 묻힌 상단의 짐', until:8, reward:{ item:'청옥 인장', gold:500 } } ],
  left_guardian:   [ { id:'bq_lg_hunt',   kind:'hunt',  title:'마교 척후장', base:'demon_scout', level:'hero+2', turn:4, until:8,
                       talk:[ { who:'arrival', text:'외성에 쥐가 들었다. 척후장이 직접 목을 거두마.' } ], reward:{ item:'팔괘 옥패', gold:500 } } ],
  grassland:       [ { id:'bq_gl_hunt',   kind:'hunt',  title:'백랑기 천부장', base:'steppe_rider', level:'hero+2', turn:3, until:7,
                       talk:[ { who:'arrival', text:'흑랑칸의 초원에 발을 들였으면 값을 치러야지! 백랑기, 돌격!' } ], reward:{ item:'용문 요대' } } ],
  ice_inner:       [ { id:'bq_ii_chest',  kind:'chest', title:'얼음 속의 함', hidden:true, reward:{ item:'수정 구슬' } } ],
  bukmang:         [ { id:'bq_bk_chest',  kind:'chest', title:'고분의 부장품', hidden:true, reward:{ item:'자금 향로', gold:600 } } ],
  luoyang_under:   [ { id:'bq_lu_hunt',   kind:'hunt',  title:'수로의 독사', base:'canal_assassin', level:'hero+2', turn:3, until:7,
                       talk:[ { who:'arrival', text:'물 밑에서 기다린 보람이 있군. 독사의 이빨을 맛봐라.' } ], reward:{ item:'묵옥 반지' } } ],
  pirate_isle:     [ { id:'bq_pi_chest',  kind:'chest', title:'해적의 보물', until:7, reward:{ item:'산호수', items:[ '승급석' ] } } ],
  blood_sea:       [ { id:'bq_bs2_hunt',  kind:'hunt',  title:'혈무 귀영 수령', base:'blood_ghost', level:'hero+2', turn:3, until:7,
                       talk:[ { who:'arrival', text:'붉은 안개가 짙어진다… 귀영의 수령이 너희 피를 받으러 왔다.' } ], reward:{ item:'봉황 비녀' } } ],
  jungle:          [ { id:'bq_jg_chest',  kind:'chest', title:'밀림 속 사당', hidden:true, reward:{ item:'칠성 비수' } } ],
  demon_hq:        [ { id:'bq_dq_hunt',   kind:'hunt',  title:'장로원 집법자', base:'elder_disciple', level:'hero+2', turn:4, until:8,
                       talk:[ { who:'arrival', text:'총단을 더럽힌 죄, 장로원이 직접 묻겠다.' } ], reward:{ item:'태허 심결' } } ],
  zhoushan:        [ { id:'bq_zs_chest',  kind:'chest', title:'왜구의 약탈품', until:8, reward:{ item:'야명주' } } ],
  penglai_palace:  [ { id:'bq_pp_chest',  kind:'chest', title:'선궁의 단약 함', hidden:true, reward:{ item:'태청 심법', items:[ '중급 영약' ] } } ],
  tianming_terrace:[ { id:'bq_tt_hunt',   kind:'hunt',  title:'천명 금강 수좌', base:'fate_vajra', level:'hero+3', turn:4, until:8,
                       talk:[ { who:'arrival', text:'천명대의 계단은 하늘로 이어진다. 오를 자격은 내가 정한다.' } ], reward:{ item:'화씨벽' } } ],
  cloud_path:      [ { id:'bq_cp_chest',  kind:'chest', title:'운해에 꽂힌 옛 검', hidden:true, reward:{ item:'간장' } } ],
  outer_palace:    [ { id:'bq_op_hunt',   kind:'hunt',  title:'검귀 수장', base:'sword_ghost', level:'hero+3', turn:3, until:7,
                       talk:[ { who:'arrival', text:'외전의 검귀들은 내가 길렀다. 너희 검으로 나를 넘어 봐라.' } ], reward:{ item:'막야' } } ],
};

/* ---------- 업적 ----------
   need : { kind, n } — kind 는 아래 (js/meta.js 의 achValue)
     wins 승리 · kills 처치 (아군 모두) · heroKills 주인공 처치 · bossKills 대장 처치 · noDownWins 아무도 안 쓰러진 승리 · maxHit 한 방 피해
     realm 주인공 경지 (n = 경지 이름) · jeolgi 익힌 절기 수 · missions 집무실 임무 완료 · bq 돌발 임무 · kiyeon 기연 · bonds 인연
     dex 보물 도감 · party 합류한 동료 · cleared 엔딩 · allIn 천명전 출전 인원 · fewFinal 천명전을 n명 이하로 승리 · craft 전용 장비
   reward : 받는 것 (data/scenes.js 의 give 와 같음) — 없어도 됨 */
const ACHIEVEMENTS = [
  // 전투
  { id:'a_win1',    cat:'전투', name:'첫 승리',           need:{ kind:'wins', n:1 },        desc:'전투에서 처음 이김', reward:{ gold:200 } },
  { id:'a_win15',   cat:'전투', name:'열다섯 번의 승전',  need:{ kind:'wins', n:15 },       desc:'전투 15번 승리', reward:{ gold:1000 } },
  { id:'a_win30',   cat:'전투', name:'백전의 대열',       need:{ kind:'wins', n:30 },       desc:'전투 30번 승리', reward:{ item:'승급석' } },
  { id:'a_win45',   cat:'전투', name:'강호를 가로지르다', need:{ kind:'wins', n:45 },       desc:'전투 45번 승리', reward:{ item:'중급 영약' } },
  { id:'a_kill100', cat:'전투', name:'백인참',            need:{ kind:'kills', n:100 },     desc:'적 100명 쓰러뜨림 (아군 모두)', reward:{ item:'강화석', n:5 } },
  { id:'a_kill300', cat:'전투', name:'삼백인참',          need:{ kind:'kills', n:300 },     desc:'적 300명 쓰러뜨림', reward:{ item:'승급석' } },
  { id:'a_kill600', cat:'전투', name:'천하의 적',         need:{ kind:'kills', n:600 },     desc:'적 600명 쓰러뜨림', reward:{ item:'승급석', n:2 } },
  { id:'a_hero100', cat:'전투', name:'대주의 검',         need:{ kind:'heroKills', n:100 }, desc:'주인공이 직접 100명 쓰러뜨림', reward:{ suryeon:2000 } },
  { id:'a_hero250', cat:'전투', name:'작은 별의 검',      need:{ kind:'heroKills', n:250 }, desc:'주인공이 직접 250명 쓰러뜨림', reward:{ suryeon:5000 } },
  { id:'a_boss10',  cat:'전투', name:'대장 사냥꾼',       need:{ kind:'bossKills', n:10 },  desc:'적 대장 · 중간보스 10명 쓰러뜨림', reward:{ gold:2000 } },
  { id:'a_boss30',  cat:'전투', name:'군웅을 꺾다',       need:{ kind:'bossKills', n:30 },  desc:'적 대장 · 중간보스 30명 쓰러뜨림', reward:{ item:'중급 영약' } },
  { id:'a_nodown10',cat:'전투', name:'한 사람도 잃지 않는다', need:{ kind:'noDownWins', n:10 }, desc:'아군이 아무도 쓰러지지 않고 10번 승리', reward:{ item:'금강 팔찌' } },
  { id:'a_hit5k',   cat:'전투', name:'일격',              need:{ kind:'maxHit', n:5000 },   desc:'한 번에 5,000 이상 피해', reward:{ gold:1000 } },
  { id:'a_hit20k',  cat:'전투', name:'일격필살',          need:{ kind:'maxHit', n:20000 },  desc:'한 번에 20,000 이상 피해', reward:{ gold:3000 } },
  // 성장
  { id:'a_r_iryu',  cat:'성장', name:'이류',              need:{ kind:'realm', n:'이류' },       desc:'주인공 이류 경지', reward:{ gold:300 } },
  { id:'a_r_ilryu', cat:'성장', name:'일류',              need:{ kind:'realm', n:'일류' },       desc:'주인공 일류 경지', reward:{ suryeon:1000 } },
  { id:'a_r_jc',    cat:'성장', name:'절정의 문턱',       need:{ kind:'realm', n:'절정 초입' },  desc:'주인공 절정 초입', reward:{ suryeon:2000 } },
  { id:'a_r_jk',    cat:'성장', name:'절정의 끝',         need:{ kind:'realm', n:'절정 극' },    desc:'주인공 절정 극', reward:{ suryeon:4000 } },
  { id:'a_r_cj',    cat:'성장', name:'초절정',            need:{ kind:'realm', n:'초절정 초입' }, desc:'주인공 초절정 초입', reward:{ item:'승급석', n:2 } },
  { id:'a_jeolgi9', cat:'성장', name:'절기의 무리',       need:{ kind:'jeolgi', n:9 },      desc:'아군이 절기 9가지 익힘', reward:{ gold:2000 } },
  { id:'a_jeolgi18',cat:'성장', name:'열여덟 절기',       need:{ kind:'jeolgi', n:18 },     desc:'아군이 절기 18가지를 모두 익힘', reward:{ item:'중급 영약', n:2 } },
  { id:'a_craft',   cat:'성장', name:'나만의 무기',       need:{ kind:'craft', n:1 },       desc:'대장간에서 전용 장비를 만듦', reward:{ gold:3000 } },
  { id:'a_party',   cat:'성장', name:'성화대 완성',       need:{ kind:'party', n:17 },      desc:'동료 17명 모두 합류', reward:{ gold:5000 } },
  // 임무 · 기연
  { id:'a_mis10',   cat:'임무', name:'믿을 만한 대주',    need:{ kind:'missions', n:10 },   desc:'집무실 임무 10개 완료', reward:{ gold:1500 } },
  { id:'a_mis25',   cat:'임무', name:'강호의 해결사',     need:{ kind:'missions', n:25 },   desc:'집무실 임무 25개 완료', reward:{ item:'승급석' } },
  { id:'a_misall',  cat:'임무', name:'집무실의 주인',     need:{ kind:'missions', n:'all' },desc:'집무실 임무를 모두 완료', reward:{ item:'중급 영약', n:2 } },
  { id:'a_bq5',     cat:'임무', name:'눈 밝은 대주',      need:{ kind:'bq', n:5 },          desc:'돌발 임무 5개 성공', reward:{ gold:1500 } },
  { id:'a_bqall',   cat:'임무', name:'놓친 것은 없다',    need:{ kind:'bq', n:'all' },       desc:'돌발 임무를 모두 성공', reward:{ item:'승급석', n:2 } },
  { id:'a_ky3',     cat:'임무', name:'인연이 닿다',       need:{ kind:'kiyeon', n:3 },      desc:'기연 3번 만남', reward:{ suryeon:2000 } },
  { id:'a_kyall',   cat:'임무', name:'천하의 기연',       need:{ kind:'kiyeon', n:'all' },  desc:'기연을 모두 만남', reward:{ suryeon:6000 } },
  // 수집
  { id:'a_bond8',   cat:'수집', name:'함께 가는 길',      need:{ kind:'bonds', n:8 },       desc:'인연 8개 맺음', reward:{ gold:1500 } },
  { id:'a_bondall', cat:'수집', name:'모든 인연',         need:{ kind:'bonds', n:'all' },   desc:'인연을 모두 맺음', reward:{ item:'중급 영약' } },
  { id:'a_dex15',   cat:'수집', name:'수집가',            need:{ kind:'dex', n:15 },        desc:'보물 도감 15칸', reward:{ gold:1500 } },
  { id:'a_dex30',   cat:'수집', name:'보물 감정가',       need:{ kind:'dex', n:30 },        desc:'보물 도감 30칸', reward:{ item:'승급석' } },
  { id:'a_dexall',  cat:'수집', name:'천하의 보물',       need:{ kind:'dex', n:'all' },     desc:'보물 도감을 모두 채움', reward:{ gold:10000 } },
  // 이야기
  { id:'a_clear',   cat:'이야기', name:'작은 별',          need:{ kind:'cleared', n:1 },     desc:'엔딩을 봄 (1회차 클리어)' },
  { id:'a_allin',   cat:'이야기', name:'모두 함께',         need:{ kind:'allIn', n:17 },      desc:'천명전에 17명 모두 데리고 승리' },
  { id:'a_few',     cat:'이야기', name:'여덟 개의 불씨',    need:{ kind:'fewFinal', n:8 },    desc:'천명전을 8명 이하로 승리' },
];
