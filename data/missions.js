/* =====================================================================
   집무실 임무 (서브 임무)
   ---------------------------------------------------------------------
   전투마다 임무를 걸어 둠 → 거점 · 집무실에서 '수락' → 그 전투에서 조건을 채우고 승리하면
   정산 화면에서 자동으로 완료 + 보상. 조건을 못 채우고 이기면 실패 (다시 받을 수 없음)
   수락하지 않고 출정하면 그 임무는 지나감

   임무 하나
     battle : 이 임무가 걸린 전투 (data/battles.js 의 이름표)
              — 이야기 끝 화면의 '출정' 이 이 전투일 때 집무실에 뜸
     kind   : 집무실 목록에 보일 짧은 종류 (대화 · 속전 · 무사 …)
     title  : 임무 이름
     desc   : 집무실에서 보일 설명
     goal   : 전투 화면 왼쪽 위에 보일 짧은 글
     cond   : 조건 (아래 셋 중 하나)
       { type:'talk', target:'cheolgeom_sahyeong', by:['hero'], talk:[대사] }
            → by 의 인물이 target 바로 옆(상하좌우)에서 '대화' 명령 (그 인물의 행동 1번).
              target 이 쓰러지기 전에 해야 함. talk 의 who : 'by' = 말을 건 아군, 'target' = 상대
       { type:'kill', target:'cheolgeom_sahyeong', by:['hero'] }
            → target 을 by 의 인물이 직접 쓰러뜨림 (마지막 일격 — 반격 포함). 다른 인물이 쓰러뜨리면 실패
       { type:'turns', n:10 }    → n턴 안에 승리
       { type:'noDown' }         → 아군이 아무도 쓰러지지 않고 승리
       { type:'keep', target:'seolran' }      → 그 인물(우군도 됨, ['a','b'] 처럼 여럿도)이 쓰러지지 않고 승리
       { type:'few', n:5 }       → 고정 인물을 포함해 n명 이하로 출전해서 승리 (출전 편성에서 인원 줄이기 — 편성 창에 표시)
     reward : { gold:300, suryeon:100, item:'금창약', n:2, exp:20 }   — 금 · 수련치 · 물건 · 경험치(출전한 아군 모두). 필요한 것만 적기

   ※ 이름 · 대사 · 보상은 모두 임시
   ===================================================================== */
const MISSIONS = {
  // 제1장 · 철검문의 보복 — 주인공이 직접 대사형을 쓰러뜨리기
  cheolgeom_talk: {
    battle: 'cheolgeom_revenge',
    kind:   '처치',
    title:  '무리를 이끄는 자',
    desc:   '철검문이 어제 일을 갚겠다며 몰려왔다. 무리를 이끄는 대사형을 직접 쓰러뜨려 놈들의 기세를 꺾자.',
    goal:   '주인공이 대사형 처치',
    cond:   { type:'kill', target:'cheolgeom_sahyeong', by:['hero'] },
    reward: { gold:500, suryeon:250 },
  },

  // 제1장 · 철검문 안마당 (임시 — 조건 · 보상은 바꾸기 쉬움)
  cheolgeom_swift: {
    battle: 'cheolgeom_coup',
    kind:   '속전',
    title:  '연합의 간부를 몰아내라',
    desc:   '간부가 직접 창을 들기 전에 끝내야 한다. 절정의 고수인 문주님의 검이라면 간부와 겨뤄 볼 만하다.',
    goal:   '6턴 안에 승리',
    cond:   { type:'turns', n:6 },
    reward: { gold:300, suryeon:250 },
  },

  /* v118 : 제2장 ~ 최종장 전투마다 하나씩 (임무 이름 · 설명 · 보상은 임시 — 고치기 쉬움) */
  // ---- 제2장 ----
  jr_dawn: {
    battle: 'jeokryong_raid',
    kind:   '속전',
    title:  '날이 밝기 전에',
    desc:   '산채가 잠에서 깨어 산길을 막기 전에 적룡채를 끝내야 한다. 채주가 도망칠 틈을 주지 말자.',
    goal:   '8턴 안에 승리',
    cond:   { type:'turns', n:8 },
    reward: { gold:400, suryeon:150, item:'강화석', n:2 },
  },
  gb_seokun: {
    battle: 'gaebang_defense',
    kind:   '보호',
    title:  '후개를 지켜라',
    desc:   '분타를 지키는 개방의 젊은 후개 석운. 사도결의 칼이 그를 노린다 — 쓰러지게 두지 말자.',
    goal:   '석운 지키기',
    cond:   { type:'keep', target:'seokun' },
    reward: { gold:400, suryeon:150 },
  },
  sb_sado: {
    battle: 'sapa_branch_raid',
    kind:   '처치',
    title:  '흑건과의 결착',
    desc:   '두 번이나 놓친 흑건 사도결. 이번에는 대주가 직접 그의 칼을 꺾는다.',
    goal:   '주인공이 사도결 처치',
    cond:   { type:'kill', target:'sado_gyeol', by:['hero'] },
    reward: { gold:450, suryeon:200, item:'승급석', n:1 },
  },
  nm_market: {
    battle: 'nangya_market',
    kind:   '무사',
    title:  '장 서는 날',
    desc:   '저잣거리 한복판이다. 성화대가 쓰러지는 모습을 사람들에게 보이지 말자.',
    goal:   '아무도 쓰러지지 않기',
    cond:   { type:'noDown' },
    reward: { gold:450, suryeon:200 },
  },

  // ---- 제3장 ----
  ng_seol: {
    battle: 'namgung_garden',
    kind:   '보호',
    title:  '남궁의 딸',
    desc:   '혈하대가 후원까지 들이쳤다. 홀로 검을 든 남궁설 소저를 지켜야 한다.',
    goal:   '남궁설 지키기',
    cond:   { type:'keep', target:'namgung_seol' },
    reward: { gold:600, suryeon:250, item:'강화석', n:3 },
  },
  th_sado: {
    battle: 'taihu_raid',
    kind:   '처치',
    title:  '세 번째는 없다',
    desc:   '태호 수채에 사도결이 숨어 있다. 이번에는 대주의 손으로 끝을 본다.',
    goal:   '주인공이 사도결 처치',
    cond:   { type:'kill', target:'sado_gyeol', by:['hero'] },
    reward: { gold:600, suryeon:250 },
  },
  sh_pass: {
    battle: 'samhyeop_pass',
    kind:   '속전',
    title:  '잔도가 무너지기 전에',
    desc:   '낡은 잔도는 오래 버티지 못한다. 무산 검마를 서둘러 꺾고 협곡을 건너자.',
    goal:   '6턴 안에 승리',
    cond:   { type:'turns', n:6 },
    reward: { gold:650, suryeon:250, item:'승급석', n:1 },
  },

  // ---- 제4장 ----
  dk_soso: {
    battle: 'dokrim',
    kind:   '보호',
    title:  '당가의 소저',
    desc:   '만독림 깊은 곳까지 길을 안내한 당소소. 독인들이 그녀부터 노린다.',
    goal:   '당소소 지키기',
    cond:   { type:'keep', target:'dangsoso' },
    reward: { gold:800, suryeon:400, item:'강화석', n:3 },
  },
  bp_hunter: {
    battle: 'beast_palace',
    kind:   '처치',
    title:  '사냥꾼의 화살',
    desc:   '야수궁주의 맹수들은 사냥꾼의 눈을 속이지 못한다. 위지렴의 화살로 궁주를 쓰러뜨리자.',
    goal:   '위지렴이 야수궁주 처치',
    cond:   { type:'kill', target:'yasu_gungju', by:['cheolmyeong'] },
    reward: { gold:800, suryeon:400 },
  },
  qc_nun: {
    battle: 'qingcheng_back',
    kind:   '보호',
    title:  '아미의 비구니',
    desc:   '시강시 사이를 홀로 지나온 아미의 정심. 그녀가 쓰러지면 청성의 일도 알 길이 없다.',
    goal:   '정심 지키기',
    cond:   { type:'keep', target:'jeongsim' },
    reward: { gold:850, suryeon:450, item:'중급 영약', n:1 },
  },
  bb_none: {
    battle: 'blood_branch',
    kind:   '무사',
    title:  '한 사람도 잃지 않는다',
    desc:   '혈교 분타는 피의 안개 속이다. 성화대는 한 사람도 그 안개에 두고 오지 않는다.',
    goal:   '아무도 쓰러지지 않기',
    cond:   { type:'noDown' },
    reward: { gold:900, suryeon:450, item:'승급석', n:1 },
  },

  // ---- 제5장 ----
  kd_duel: {
    battle: 'kunlun_duel',
    kind:   '처치',
    title:  '비무는 대주가',
    desc:   '곤륜의 검룡이 청한 비무다. 대주가 직접 검을 맞대어 꺾어야 곤륜이 인정한다.',
    goal:   '주인공이 하운을 꺾기',
    cond:   { type:'kill', target:'haun', by:['hero'] },
    reward: { gold:1000, suryeon:550, item:'강화석', n:4 },
  },
  bs_sand: {
    battle: 'black_sand',
    kind:   '속전',
    title:  '모래바람이 일기 전에',
    desc:   '흑사보에 모래바람이 불면 길을 잃는다. 흑사왕을 서둘러 꺾자.',
    goal:   '6턴 안에 승리',
    cond:   { type:'turns', n:6 },
    reward: { gold:1000, suryeon:550 },
  },
  hr_twins: {
    battle: 'hwasan_rescue',
    kind:   '보호',
    title:  '화산의 두 제자',
    desc:   '연화봉에 고립된 현원 · 현적. 구하러 왔다가 잃으면 아무 소용이 없다.',
    goal:   '현원 · 현적 지키기',
    cond:   { type:'keep', target:['hwasan_hyeonwon', 'hwasan_hyeonjeok'] },
    reward: { gold:1050, suryeon:600, item:'중급 영약', n:1 },
  },
  lg_few: {
    battle: 'left_guardian',
    kind:   '소수',
    title:  '소수 정예',
    desc:   '마교 외성은 눈이 많다. 다섯 이하의 정예만으로 좌호법의 외성을 뚫는다.',
    goal:   '5명 이하로 출전',
    cond:   { type:'few', n:5 },
    reward: { gold:1100, suryeon:600, item:'승급석', n:1 },
  },

  // ---- 제6장 ----
  po_paeng: {
    battle: 'paeng_outer',
    kind:   '보호',
    title:  '하북팽가의 가주',
    desc:   '혈마대가 노리는 것은 가주 팽천호의 목이다. 가주를 지켜 팽가의 힘을 얻자.',
    goal:   '팽천호 지키기',
    cond:   { type:'keep', target:'paeng_cheonho' },
    reward: { gold:1200, suryeon:700, item:'강화석', n:4 },
  },
  gl_steppe: {
    battle: 'grassland',
    kind:   '속전',
    title:  '초원의 바람',
    desc:   '명적 기병은 시간이 갈수록 불어난다. 흑랑칸을 서둘러 꺾자.',
    goal:   '6턴 안에 승리',
    cond:   { type:'turns', n:6 },
    reward: { gold:1200, suryeon:700 },
  },
  io_seolran: {
    battle: 'ice_outer',
    kind:   '보호',
    title:  '빙궁의 길잡이',
    desc:   '외궁의 길을 아는 이는 설란뿐이다. 그녀를 잃으면 내궁에 닿을 수 없다.',
    goal:   '설란 지키기',
    cond:   { type:'keep', target:'seolran' },
    reward: { gold:1250, suryeon:750, item:'중급 영약', n:1 },
  },
  ii_ice: {
    battle: 'ice_inner',
    kind:   '처치',
    title:  '빙궁의 일은 빙궁의 손으로',
    desc:   '빙궁을 배신한 호법 냉무혼. 설란이 직접 그 죄를 묻게 하자.',
    goal:   '설란이 냉무혼 처치',
    cond:   { type:'kill', target:'naengmuhon', by:['seolran'] },
    reward: { gold:1300, suryeon:750, item:'승급석', n:1 },
  },

  // ---- 제7장 ----
  yr_ferry: {
    battle: 'yellow_river',
    kind:   '속전',
    title:  '나루를 지켜라',
    desc:   '천교 선봉이 황하를 건너면 중원이 흔들린다. 나루에서 바로 막아 낸다.',
    goal:   '5턴 안에 승리',
    cond:   { type:'turns', n:5 },
    reward: { gold:1400, suryeon:850, item:'강화석', n:5 },
  },
  bk_giant: {
    battle: 'bukmang',
    kind:   '처치',
    title:  '타구봉으로',
    desc:   '고분을 지키는 시혈 거인. 개방의 타구봉이 그 뼈를 부순다.',
    goal:   '석운이 시혈 거인 처치',
    cond:   { type:'kill', target:'corpse_giant', by:['seokun'] },
    reward: { gold:1400, suryeon:850 },
  },
  lu_none: {
    battle: 'luoyang_under',
    kind:   '무사',
    title:  '어둠 속에서',
    desc:   '빛이 들지 않는 지하수로다. 서로의 등을 지키며 한 사람도 잃지 말자.',
    goal:   '아무도 쓰러지지 않기',
    cond:   { type:'noDown' },
    reward: { gold:1450, suryeon:900, item:'중급 영약', n:1 },
  },
  tg_few: {
    battle: 'taihang',
    kind:   '소수',
    title:  '요새에 숨어들다',
    desc:   '태항산 요새는 대군을 보면 문을 닫는다. 여섯 이하로 숨어들어 현무천왕을 친다.',
    goal:   '6명 이하로 출전',
    cond:   { type:'few', n:6 },
    reward: { gold:1500, suryeon:900, item:'승급석', n:1 },
  },

  // ---- 제8장 ----
  pi_isle: {
    battle: 'pirate_isle',
    kind:   '속전',
    title:  '물이 차기 전에',
    desc:   '해적섬의 갯벌은 물때가 되면 잠긴다. 해룡왕을 서둘러 꺾자.',
    goal:   '5턴 안에 승리',
    cond:   { type:'turns', n:5 },
    reward: { gold:1600, suryeon:1000, item:'강화석', n:5 },
  },
  wm_baraka: {
    battle: 'wuxi_man',
    kind:   '보호',
    title:  '만동의 친구',
    desc:   '만동왕을 깨울 수 있는 것은 바라카의 목소리뿐이다. 그를 지켜야 한다.',
    goal:   '바라카 지키기',
    cond:   { type:'keep', target:'baraka' },
    reward: { gold:1600, suryeon:1000 },
  },
  bs2_none: {
    battle: 'blood_sea',
    kind:   '무사',
    title:  '혈해를 건너다',
    desc:   '붉은 바다는 쓰러진 자를 삼킨다. 아무도 혈해에 남기지 말자.',
    goal:   '아무도 쓰러지지 않기',
    cond:   { type:'noDown' },
    reward: { gold:1650, suryeon:1050, item:'중급 영약', n:1 },
  },
  bp2_end: {
    battle: 'blood_palace',
    kind:   '처치',
    title:  '혈교의 끝',
    desc:   '세가를 무너뜨린 피의 시작, 혈교주 혈천마. 대주의 검으로 끝을 낸다.',
    goal:   '주인공이 혈천마 처치',
    cond:   { type:'kill', target:'hyeolcheonma', by:['hero'] },
    reward: { gold:1700, suryeon:1100, item:'승급석', n:2 },
  },

  // ---- 제9장 ----
  jg_beast: {
    battle: 'jungle',
    kind:   '처치',
    title:  '짐승은 짐승의 말로',
    desc:   '흑표왕 묵아의 짐승들은 야수궁의 조련사를 안다. 바라카가 직접 묵아를 꺾게 하자.',
    goal:   '바라카가 묵아 처치',
    cond:   { type:'kill', target:'muka', by:['baraka'] },
    reward: { gold:1800, suryeon:1150, item:'강화석', n:6 },
  },
  dr_ridge: {
    battle: 'demon_ridge',
    kind:   '속전',
    title:  '협곡의 비무',
    desc:   '천마령주가 청한 비무다. 오래 끌면 마교의 증원이 협곡을 메운다.',
    goal:   '5턴 안에 승리',
    cond:   { type:'turns', n:5 },
    reward: { gold:1800, suryeon:1150 },
  },
  dh_none: {
    battle: 'demon_hq',
    kind:   '무사',
    title:  '총단을 지나',
    desc:   '마교 총단 한가운데다. 쓰러지는 순간 다시 일어설 수 없다 — 아무도 쓰러지지 말자.',
    goal:   '아무도 쓰러지지 않기',
    cond:   { type:'noDown' },
    reward: { gold:1850, suryeon:1200, item:'중급 영약', n:1 },
  },
  dh2_monk: {
    battle: 'demon_hall',
    kind:   '처치',
    title:  '마를 꺾되 사람은 살린다',
    desc:   '천마 독고천을 꺾는 것은 소림의 권이어야 한다. 혜공의 금강항마권으로.',
    goal:   '혜공이 독고천 처치',
    cond:   { type:'kill', target:'dokgocheon', by:['hyegong'] },
    reward: { gold:1900, suryeon:1250, item:'승급석', n:2 },
  },

  // ---- 제10장 ----
  zs_fleet: {
    battle: 'zhoushan',
    kind:   '속전',
    title:  '함대가 모이기 전에',
    desc:   '천교 함대가 군도에 모이면 바다가 막힌다. 함대장을 서둘러 꺾자.',
    goal:   '8턴 안에 승리',
    cond:   { type:'turns', n:8 },
    reward: { gold:2000, suryeon:1300, item:'강화석', n:6 },
  },
  ps_few: {
    battle: 'penglai_shore',
    kind:   '소수',
    title:  '신기루를 뚫다',
    desc:   '봉래의 해안은 많은 발소리를 삼킨다. 여섯 이하로 청룡천왕의 해안을 뚫는다.',
    goal:   '6명 이하로 출전',
    cond:   { type:'few', n:6 },
    reward: { gold:2000, suryeon:1300 },
  },
  pp_namgung: {
    battle: 'penglai_palace',
    kind:   '처치',
    title:  '제왕의 한 칼',
    desc:   '백호천왕 상관혁의 권을 꺾는 것은 남궁 가주의 검이어야 한다.',
    goal:   '남궁진이 상관혁 처치',
    cond:   { type:'kill', target:'sanggwanhyeok', by:['namgung_jin'] },
    reward: { gold:2100, suryeon:1350, item:'중급 영약', n:1 },
  },
  tt_none: {
    battle: 'tianming_terrace',
    kind:   '무사',
    title:  '천명대에 오르다',
    desc:   '하늘에 닿는 천명대. 지도를 되찾을 때까지 아무도 쓰러지지 말자.',
    goal:   '아무도 쓰러지지 않기',
    cond:   { type:'noDown' },
    reward: { gold:2200, suryeon:1400, item:'승급석', n:2 },
  },

  // ---- 최종장 ----
  iw_seolran: {
    battle: 'ice_wall',
    kind:   '처치',
    title:  '빙궁의 검으로',
    desc:   '천주봉의 빙벽을 지키는 냉천. 북해빙궁의 설란이 그 얼음을 가른다.',
    goal:   '설란이 냉천 처치',
    cond:   { type:'kill', target:'naengcheon', by:['seolran'] },
    reward: { gold:2400, suryeon:1500, item:'강화석', n:8 },
  },
  cp_mumyeong: {
    battle: 'cloud_path',
    kind:   '보호',
    title:  '이름 없는 검',
    desc:   '운해 잔도에서 길을 연 무명. 그가 쓰러지면 구천궁으로 가는 길도 끊긴다.',
    goal:   '무명 지키기',
    cond:   { type:'keep', target:'mumyeong' },
    reward: { gold:2400, suryeon:1500, item:'중급 영약', n:1 },
  },
  op_few: {
    battle: 'outer_palace',
    kind:   '소수',
    title:  '외전 돌파',
    desc:   '외전 금위는 대군을 보면 문을 닫는다. 여덟 이하의 정예로 외전을 뚫는다.',
    goal:   '8명 이하로 출전',
    cond:   { type:'few', n:8 },
    reward: { gold:2500, suryeon:1500, item:'승급석', n:2 },
  },
};
