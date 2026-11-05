/* =====================================================================
   이미지 목록
   - 그림을 바꾸려면 assets 폴더에 파일을 넣고 여기 경로만 바꾸면 됩니다.
   - 다른 데이터 파일에서는 'bg.story_inn', 'face.guo' 처럼 "분류.이름" 으로 부릅니다.
   - 그림이 아직 없으면 '@bg.hub' 처럼 적어 다른 그림을 빌려 쓸 수 있습니다 (임시). 그림을 구하면 경로로 바꾸기만 하면 됩니다.
   ===================================================================== */
const ASSETS = {
  // 배경 (이야기 장면, 시작 화면 등)
  bg: {
    title:       'assets/backgrounds/title.webp?h=1e9e8cd1d6',        // 시작 화면
    intro_army:  'assets/backgrounds/intro_army.webp?h=7d9b5dbdf3',   // 서사 - 군대 행렬 (예전 서사 — 지금은 안 씀)
    opening_end: 'assets/backgrounds/opening_end.webp?h=13e51c0fd8',  // 오프닝 영상 끝 장면 — 캐릭터 선택 화면 뒤
    story_inn:   'assets/backgrounds/story_inn.avif?h=1a0bccdb37',    // 무한성 저잣거리 (객잔 앞)
    wudang_path: 'assets/backgrounds/wudang_path.avif?h=590b44e57f',  // 무당산 오르는 길
    wudang_gate: 'assets/backgrounds/wudang_gate.avif?h=3a6facecdd',  // 무당파 산문
    wudang_hall: 'assets/backgrounds/wudang_hall.avif?h=051a6b8370',  // 무당파 전각 안
    hub:         'assets/backgrounds/hub.avif?h=51416b9bb4',          // 거점 (양양 천씨 장원)
    // ---- 제1장 양양 (road 는 임시로 다른 그림을 빌려 씀) ----
    yangyang_road:   'assets/backgrounds/yangyang_road.avif?h=fd0f83dacb',   // 무당산을 떠나 양양으로 (임시)
    yangyang_manor:  'assets/backgrounds/yangyang_manor.avif?h=2ce6e0ca84',           // 양양 천씨 장원 (거점 그림)
    yangyang_market: 'assets/backgrounds/yangyang_market.avif?h=289cce5299',   // 양양성 거리 (저잣거리)
    yangyang_inn:    'assets/backgrounds/yangyang_inn.avif?h=67376f26fc',      // 양양 취현객잔 안
    yangyang_office: 'assets/backgrounds/yangyang_office.avif?h=52ecf5f91e',   // 양양 관아 (현아)
    cheolgeom_gate:  'assets/backgrounds/cheolgeom_gate.avif?h=1c8f1c4fca',    // 철검문 산문
    cheolgeom_court: 'assets/backgrounds/cheolgeom_court.avif?h=c6100951f2',   // 철검문 안마당 (전투 지도 004 와 같은 그림)
    cheolgeom_overview: 'assets/backgrounds/cheolgeom_overview.avif?h=692ce7c113',   // 철검문 전경 (본관 · 연무장 · 대문 …)
    cheolgeom_hall:  'assets/backgrounds/cheolgeom_hall.avif?h=710f4f6da0',    // 철검문 문주전 안
    yangyang_lord_hall: 'assets/backgrounds/yangyang_lord_hall.avif?h=36546f7901',   // 양양성 성주실
    mountain_path:   'assets/backgrounds/mountain_path.avif?h=5f63d04caf',     // 양양성 밖 산길 (절강으로 가는 길)
    // ---- 제2장 ----
    jeokryong_gate:  'assets/backgrounds/jeokryong_gate.avif?h=57b5dacfd5',    // 녹림 적룡채 전경 (붉은 깃발 · 본채 계단) — 들어갈 때 · 떠날 때
    jeokryong_yard:  'assets/backgrounds/jeokryong_yard.avif?h=fe78da7f4a',                                 // 적룡채 안마당 (전장 지도 006 그림을 그대로)
    // 사파 연합 지부 (산속, 원래 현판 글씨 그대로) — 구후가 본교로 가는 길에 머문 지부
    sapa_branch_gate:  'assets/backgrounds/sapa_branch_gate.avif?h=0c6471b661',    // 지부 문 · 산속 전경
    sapa_branch_court: 'assets/backgrounds/sapa_branch_court.avif?h=1e2bacf9da',   // 지부 안마당
    gaebang_branch:  'assets/backgrounds/gaebang_branch.avif?h=e79d277bd3',  // 절강 개방 분타 안 (丐幇分舵)
    gaebang_branch_out: 'assets/backgrounds/gaebang_branch_out.avif?h=6d6a2bf401',   // 절강 개방 분타 밖
    cheongyo_hall:   'assets/backgrounds/cheongyo_hall.avif?h=25682e6cad',     // 천교 회의실 (사파 연합 절강 지부의 안채 — 天教 깃발)
    sapa_branch_zhejiang: 'assets/backgrounds/sapa_branch_zhejiang.avif?h=2a09709d15',   // 사파 연합 절강 지부 겉모습 (邪派聯盟 浙江支部, 포구)
    sapa_branch_yard: 'assets/backgrounds/sapa_branch_yard.avif?h=cbdec2fc56',                                // 사파 연합 절강 지부 안마당 (전장 지도 008 그림을 그대로)
    zhejiang_street: 'assets/backgrounds/zhejiang_street.avif?h=6eac366f03',   // 절강 저잣거리 (江南布莊 · 酒肆, 운하)
    // ---- 제2장 낭야성 · 제갈세가 ----
    nangya_outskirts:'assets/backgrounds/nangya_outskirts.avif?h=6fbbe101fe',  // 낭야성 근처 길 (멀리 성문)
    nangya_gate:     'assets/backgrounds/nangya_gate.avif?h=816680346d',       // 낭야성 정문 (현판 琅琊城)
    nangya_street:   'assets/backgrounds/nangya_street.avif?h=403c3e5a34',     // 낭야성 거리 (書肆 · 筆墨紙硯, 멀리 성문)
    nangya_inn:      'assets/backgrounds/nangya_inn.avif?h=880e267d53',        // 낭야성 객잔 (客栈, 물가 · 멀리 성문)
    jegal_gate:      'assets/backgrounds/jegal_gate.avif?h=785918b6de',        // 제갈세가 정문 (諸葛世家)
    jegal_hall:      'assets/backgrounds/jegal_hall.avif?h=a42ef75950',        // 제갈세가 가주전 (諸葛世家 현판)
    jegal_bedroom:   'assets/backgrounds/jegal_bedroom.avif?h=627e7b79c6',     // 제갈세가 가주 침소
    jegal_guestroom: 'assets/backgrounds/jegal_guestroom.avif?h=6e34eb2bd1',   // 제갈세가 객방
    // ---- 안휘 · 남궁세가 (제2장 끝 · 제3장) ----
    anhui_outskirts: 'assets/backgrounds/anhui_outskirts.avif?h=ced437819c',   // 안휘 근처 길 (돌다리 · 멀리 성)
    anhui_street:    'assets/backgrounds/anhui_street.avif?h=4d86cd62c5',      // 안휘 저잣거리 (徽墨 · 文房四宝 · 茶行 · 酒)
    namgung_gate:    'assets/backgrounds/namgung_gate.avif?h=606278eced',      // 남궁세가 정문 (南宮世家)
    namgung_hall:    'assets/backgrounds/namgung_hall.avif?h=e120e5e43e',      // 남궁세가 가주전
    // ---- 엔딩 ----
    ending_lanterns:   'assets/backgrounds/ending_lanterns.avif?h=d852ebad33',     // 엔딩 · 작은 별 (양양 천씨세가 사당 · 연등 두 개 · 성화대) — 남자 주인공
    ending_lanterns_f: 'assets/backgrounds/ending_lanterns_f.avif?h=7d03e9ccb7',   // 같은 장면 — 여자 주인공 (배경 이름 뒤 _f 가 있으면 여자 주인공일 때 그 그림)
    // ---- 성화대 거점 (제4장 성도 본진 · 엔딩 뒤) ----
    hub_seonghwa: 'assets/backgrounds/hub_seonghwa.avif?h=a8d56ca13d',   // 성화대 본진 — 본채(집무실) · 연무장(훈련장) · 대장간 · 잡화 창고 · 표국 수레
  },
  // 전투 지도 그림 (지형 속성은 data/maps/map_###.json)
  map: {
    '001': 'assets/maps/map_001.avif?h=61a86567c8',   // 서장 · 무한성 저잣거리 — 성문 앞 광장 · 물길 (24 × 14칸)
    '002': 'assets/maps/map_002.avif?h=c95a1314b7',   // 무당산 산문 앞
    '003': 'assets/maps/map_003.avif?h=827ca7939e',   // 양양 저잣거리 (24 × 16칸)
    '004': 'assets/maps/map_004.avif?h=04916b60c3',   // 철검문 안마당 (24 × 14칸)
    '005': 'assets/maps/map_005.avif?h=3ccb08485d',   // 양양성 밖 산길 고개 (24 × 14칸)
    '006': 'assets/maps/map_006.avif?h=cc84f72d3c',   // 녹림 적룡채 안마당 (24 × 14칸)
    '007': 'assets/maps/map_007.avif?h=da194dca46',   // 절강 개방 분타 앞마당 (24 × 14칸)
    '008': 'assets/maps/map_008.avif?h=2f0e9066d8',   // 사파 연합 절강 지부 (천교) — 다리 · 안마당 (24 × 14칸)
    '009': 'assets/maps/map_009.avif?h=6217edf6e0',   // 제갈세가 가주 침소 (24 × 14칸)
    '010': 'assets/maps/map_010.avif?h=f88731ae0a',   // 안휘성 저잣거리 — 성문 · 돌다리 · 물길 (24 × 14칸)
  },
  // 이야기 장면 전신 카드
  card: {
    hero_m: 'assets/characters/hero_m_card.webp?h=81adcf5a79',
    hero_f: 'assets/characters/hero_f_card.webp?h=54f8f9c28a',
    guo:    'assets/characters/guo_card.webp?h=8c70be9733',
    huang:  'assets/characters/huang_card.webp?h=c7fa992186',
    zhang:  'assets/characters/zhang_card.webp?h=a377d01c3f',
    cheonghwa: 'assets/characters/cheonghwa_card.webp?h=4030f7f593',
    hunter:    'assets/characters/hunter_card.webp?h=efc878f497',
    cheolgeom_sahyeong: 'assets/characters/cheolgeom_sahyeong_card.webp?h=b6d4fb6d78',   // 철검문 대사형
    cheolgeom_traitor:  'assets/characters/cheolgeom_traitor_card.webp?h=2a74a892b2',    // 철검문 배신 문원
    cheolgeom:          'assets/characters/cheolgeom_card.webp?h=9b03d9d546',            // 철검문 문도
    munju:              'assets/characters/munju_card.webp?h=08fc5afa4a',                // 철검문주
    ganbu:              'assets/characters/ganbu_card.webp?h=437929b46b',                // 사파 간부
    yangyang_lord:      'assets/characters/yangyang_lord_card.webp?h=d6710d389b',        // 양양 성주
    hwasan_hyeonwon:    'assets/characters/hwasan_hyeonwon_card.webp?h=6913a2adbd',      // 화산파 현원
    hwasan_hyeonjeok:   'assets/characters/hwasan_hyeonjeok_card.webp?h=725adc595d',     // 화산파 현적
    hwasan_disciple:    'assets/characters/hwasan_disciple_card.webp?h=f0ab6b87e9',      // 화산파 문원 (수행원)
    yangyang_official:  'assets/characters/yangyang_official_card.webp?h=74357b447f',    // 양양 관아 관원
    bandit:             'assets/characters/bandit_card.webp?h=b62e68a96d',               // 적룡채 산적
    jeokryong_chief:    'assets/characters/jeokryong_chief_card.webp?h=470222a996',      // 적룡채주
    sado_gyeol:         'assets/characters/sado_gyeol_card.webp?h=28778217ea',           // 천교 사도결 (흑건도)
    noyugak:            'assets/characters/noyugak_card.webp?h=8d6868e62b',         // 개방 장로 노유각 (절강 분타주)
    seokun:             'assets/characters/seokun_card.webp?h=4e6acc5fed',          // 개방 소걸개 석운 (황용의 수제자)
    jinsoyeon:          'assets/characters/jinsoyeon_card.webp?h=2d2bd78116',       // 개방 진소연 (황용의 수제자)
    madaeho:            'assets/characters/madaeho_card.webp?h=f0424c2270',         // 개방 오결 제자 마대호
    galyeong:           'assets/characters/galyeong_card.webp?h=6de9ac29a2',        // 개방 칠결 제자 갈 영감
    wangi:              'assets/characters/wangi_card.webp?h=f735db1e82',           // 개방 삼결 제자 왕이
    jegal_yun:          'assets/characters/jegal_yun_card.webp?h=3ac608f4e6',       // 제갈세가 소가주 제갈윤
    jegal_hwi:          'assets/characters/jegal_hwi_card.webp?h=3ce55df6e0',       // 제갈세가 가주 제갈휘
    assassin:           'assets/characters/assassin_card.webp?h=014030b4a7',        // 정체불명의 암살자 (임시 — 글자만)
    // 제3장 · 정파의 회합
    namgung_wi:         'assets/characters/namgung_wi_card.webp?h=e356f4fe4c',      // 남궁세가 가주 남궁위 (제왕검)
    namgung_jin:        'assets/characters/namgung_jin_card.webp?h=11825e7a30',     // 남궁세가 소가주 남궁진
    namgung_seol:       'assets/characters/namgung_seol_card.webp?h=178966b828',    // 남궁세가 가주의 딸 남궁설
    hwasan_munju:       'assets/characters/hwasan_munju_card.webp?h=8940b03546',    // 화산파 문주 청송진인
    paeng_cheonho:      'assets/characters/paeng_cheonho_card.webp?h=4f42dc6813',   // 화북팽가 가주 팽천호 (광도)
    paeng_soho:         'assets/characters/paeng_soho_card.webp?h=2e89bd935e',      // 화북팽가 소가주 팽소호
    baekun:             'assets/characters/baekun_card.webp?h=edd46ef0a2',          // 소림사 태상장로 백운 노사
    mujin:              'assets/characters/mujin_card.webp?h=34eb30ab13',           // 소림사 방장 무진 대사
    majin:              'assets/characters/majin_card.webp?h=01305b15c0',           // 마인 (임시 — 글자만)
    // ---- v115 새 그림 (조연 · 적 대장) ----
    binggung_lord: 'assets/characters/binggung_lord_card.avif?h=94e93d5b28',   // 북해빙궁주
    saho: 'assets/characters/saho_card.avif?h=5df449ec4a',   // 만동왕 사호
    namgung_guard: 'assets/characters/namgung_guard_card.avif?h=60cd6d1c42',   // 남궁세가 무사
    yasu_gungju: 'assets/characters/yasu_gungju_card.avif?h=f8c03ff012',   // 남만야수궁주
    heukrangkan: 'assets/characters/heukrangkan_card.avif?h=ad65290bd9',   // 흑랑칸
    myohyeolrang: 'assets/characters/myohyeolrang_card.avif?h=83927e3bb7',   // 묘혈랑
    musan_shaman: 'assets/characters/musan_shaman_card.avif?h=90fc485eea',   // 무산 무녀
  },
  // 얼굴 (전투 토큰, 대화창, 저장 목록 등)
  face: {
    hero_m: 'assets/characters/hero_m_face.webp?h=740a7be4d4',
    hero_f: 'assets/characters/hero_f_face.webp?h=c3e8e8cde0',
    guo:    'assets/characters/guo_face.webp?h=e79ce5f552',
    huang:  'assets/characters/huang_face.webp?h=f47202bcda',
    zhang:  'assets/characters/zhang_face.webp?h=b149752630',
    sapa:   'assets/characters/sapa_face.webp?h=647cc82013',
    cheonghwa: 'assets/characters/cheonghwa_face.webp?h=9d35311c81',
    hunter:    'assets/characters/hunter_face.webp?h=7e396213d1',
    cheolgeom_sahyeong: 'assets/characters/cheolgeom_sahyeong_face.webp?h=de3f87d2dc',   // 철검문 대사형
    cheolgeom_traitor:  'assets/characters/cheolgeom_traitor_face.webp?h=1bc0b07111',    // 철검문 배신 문원
    cheolgeom:          'assets/characters/cheolgeom_face.webp?h=1ca73f38cd',            // 철검문 문도
    munju:              'assets/characters/munju_face.webp?h=cc6ee5e095',                // 철검문주
    ganbu:              'assets/characters/ganbu_face.webp?h=751ebc23c9',                // 사파 간부
    yangyang_lord:      'assets/characters/yangyang_lord_face.webp?h=e6b631347a',        // 양양 성주
    hwasan_hyeonwon:    'assets/characters/hwasan_hyeonwon_face.webp?h=f7af7dcc87',      // 화산파 현원
    hwasan_hyeonjeok:   'assets/characters/hwasan_hyeonjeok_face.webp?h=d978da8bf9',     // 화산파 현적
    hwasan_disciple:    'assets/characters/hwasan_disciple_face.webp?h=198e4858e2',      // 화산파 문원 (수행원)
    yangyang_official:  'assets/characters/yangyang_official_face.webp?h=5cf70bef94',    // 양양 관아 관원
    bandit:             'assets/characters/bandit_face.webp?h=cd3cea39b0',               // 적룡채 산적
    jeokryong_chief:    'assets/characters/jeokryong_chief_face.webp?h=09cc8f4954',      // 적룡채주
    sado_gyeol:         'assets/characters/sado_gyeol_face.webp?h=e7f99cee68',           // 천교 사도결 (흑건도)
    noyugak:            'assets/characters/noyugak_face.webp?h=2490c63a74',         // 개방 장로 노유각 (절강 분타주)
    seokun:             'assets/characters/seokun_face.webp?h=2a86812a07',          // 개방 소걸개 석운 (황용의 수제자)
    jinsoyeon:          'assets/characters/jinsoyeon_face.webp?h=08713a8dbd',       // 개방 진소연 (황용의 수제자)
    madaeho:            'assets/characters/madaeho_face.webp?h=d48781ac09',         // 개방 오결 제자 마대호
    galyeong:           'assets/characters/galyeong_face.webp?h=77ab4fe2ab',        // 개방 칠결 제자 갈 영감
    wangi:              'assets/characters/wangi_face.webp?h=1202c0572b',           // 개방 삼결 제자 왕이
    jegal_yun:          'assets/characters/jegal_yun_face.webp?h=1db989d7b1',       // 제갈윤
    jegal_hwi:          'assets/characters/jegal_hwi_face.webp?h=4336e9863a',       // 제갈휘
    assassin:           'assets/characters/assassin_face.webp?h=78c28df423',        // 암살자 (임시)
    namgung_wi:         'assets/characters/namgung_wi_face.webp?h=06b49c2e1f',      // 남궁위
    namgung_jin:        'assets/characters/namgung_jin_face.webp?h=5de3830347',     // 남궁진
    namgung_seol:       'assets/characters/namgung_seol_face.webp?h=d8e2036617',    // 남궁설
    hwasan_munju:       'assets/characters/hwasan_munju_face.webp?h=5a37e1f11b',    // 청송진인
    paeng_cheonho:      'assets/characters/paeng_cheonho_face.webp?h=dfa0845cda',   // 팽천호
    paeng_soho:         'assets/characters/paeng_soho_face.webp?h=9f889540fd',      // 팽소호
    baekun:             'assets/characters/baekun_face.webp?h=668035291d',          // 백운 노사
    mujin:              'assets/characters/mujin_face.webp?h=345ffb6d87',           // 무진 대사
    majin:              'assets/characters/majin_face.webp?h=9ba2ab3209',           // 마인 (임시)
    // ---- v115 새 그림 (조연 · 적 대장) ----
    binggung_lord: 'assets/characters/binggung_lord_face.avif?h=9c38cf6672',   // 북해빙궁주
    saho: 'assets/characters/saho_face.avif?h=fe4047a709',   // 만동왕 사호
    namgung_guard: 'assets/characters/namgung_guard_face.avif?h=f9ce0746dc',   // 남궁세가 무사
    yasu_gungju: 'assets/characters/yasu_gungju_face.avif?h=8818906496',   // 남만야수궁주
    heukrangkan: 'assets/characters/heukrangkan_face.avif?h=ee80d92c6f',   // 흑랑칸
    myohyeolrang: 'assets/characters/myohyeolrang_face.avif?h=8a65627de3',   // 묘혈랑
    musan_shaman: 'assets/characters/musan_shaman_face.avif?h=66566661ff',   // 무산 무녀
  },
  // 영상 — 오프닝 (data/scenes.js 의 OPENING 이 'video.opening' 으로 부름)
  video: {
    opening: 'assets/video/opening.mp4?h=9478136862',   // 오프닝 (천씨세가의 밤 → 강호록) · 26초
  },
  // 배경음 (v127) — 어느 장면 · 전투에 어떤 곡을 쓸지는 data/music.js. 곡은 tools/music/tracks.py 로 만듦 (고쟁 · 적 · 이호 · 북 등을 합성)
  //   같은 이름으로 mp3 를 덮어쓰면 그 곡이 바뀜
  bgm: {
    title:         'assets/bgm/title.mp3?h=08111ebaf2',   // 시작 화면 · 캐릭터 선택
    road:          'assets/bgm/road.mp3?h=73c62114fc',   // 강호의 길 (낮의 여정)
    town:          'assets/bgm/town.mp3?h=bc9798a0f8',   // 저잣거리 · 객잔 · 거점
    tension:       'assets/bgm/tension.mp3?h=4fc50aec6b',   // 음모 · 긴장
    sorrow:        'assets/bgm/sorrow.mp3?h=3cc01822a0',   // 이별 · 슬픔
    night:         'assets/bgm/night.mp3?h=07a777bd57',   // 밤
    resolve:       'assets/bgm/resolve.mp3?h=5419c3600a',   // 결의 · 회합
    sacred:        'assets/bgm/sacred.mp3?h=e1aebae704',   // 산문 · 장엄
    west:          'assets/bgm/west.mp3?h=6736e79c3b',   // 서역 · 사막
    north:         'assets/bgm/north.mp3?h=e3755fcf49',   // 북방 · 설원
    south:         'assets/bgm/south.mp3?h=d860420c53',   // 남방 · 밀림
    sea:           'assets/bgm/sea.mp3?h=f0b96c17e7',   // 바다 · 항구
    villain:       'assets/bgm/villain.mp3?h=50c1be8418',   // 천교 · 악의 본산
    ending:        'assets/bgm/ending.mp3?h=8f87dffd6c',   // 엔딩
    battle:        'assets/bgm/battle.mp3?h=e03623d96e',   // 보통 전투
    battle_boss:   'assets/bgm/battle_boss.mp3?h=cc9d38c758',   // 강적
    battle_crisis: 'assets/bgm/battle_crisis.mp3?h=89a7afa06e',   // 위기 · 방어
    battle_duel:   'assets/bgm/battle_duel.mp3?h=896e4b179a',   // 비무
    battle_demon:  'assets/bgm/battle_demon.mp3?h=f7d39611fa',   // 악의 본산 전투
    battle_final:  'assets/bgm/battle_final.mp3?h=ce87dd0faf',   // 최종 결전
    win:           'assets/bgm/win.mp3?h=88b8c6f29f',   // 승리 (짧은 곡)
    lose:          'assets/bgm/lose.mp3?h=c00bdf808d',   // 패배 (짧은 곡)
    chapter:       'assets/bgm/chapter.mp3?h=d2b2846c98',   // 장이 바뀔 때 (짧은 곡)
    story:  '@bgm.road',   // (예전 이름) 이야기 · battle 은 아래
  },
  // 효과음 (v127) — tools/music/sfx.py 로 만듦. 이름은 js/sound.js 의 sfx('이름')
  sfx: {
    achieve:     'assets/sfx/achieve.mp3?h=674bf38609',   // 업적 · 기연
    alarm:       'assets/sfx/alarm.mp3?h=89b2a7fe8e',   // 강적 나타남
    atk_do:      'assets/sfx/atk_do.mp3?h=635b99bc63',   // 도 휘두름
    atk_geom:    'assets/sfx/atk_geom.mp3?h=71272edb4d',   // 검 휘두름
    atk_gung:    'assets/sfx/atk_gung.mp3?h=9184e16b89',   // 활 · 암기
    atk_gwon:    'assets/sfx/atk_gwon.mp3?h=9118fead0a',   // 권장
    atk_jang:    'assets/sfx/atk_jang.mp3?h=9382bdac34',   // 봉 · 창 · 채찍
    block:       'assets/sfx/block.mp3?h=c1c4cd8ed4',   // 막음
    chest:       'assets/sfx/chest.mp3?h=cfaa4f4674',   // 상자
    click:       'assets/sfx/click.mp3?h=4911d5c660',   // 단추
    close:       'assets/sfx/close.mp3?h=1600cc01b9',   // 창 닫기
    coin:        'assets/sfx/coin.mp3?h=55e22b9278',   // 금
    confirm:     'assets/sfx/confirm.mp3?h=9bcb0174c4',   // 확인
    cure:        'assets/sfx/cure.mp3?h=f4b69013ad',   // 해독
    cutin:       'assets/sfx/cutin.mp3?h=ddeea52901',   // 컷인
    down:        'assets/sfx/down.mp3?h=542efd4679',   // 쓰러짐
    equip:       'assets/sfx/equip.mp3?h=164ef7ab60',   // 장비
    error:       'assets/sfx/error.mp3?h=123f5366a8',   // 안 됨
    forge:       'assets/sfx/forge.mp3?h=c474f252ed',   // 강화 · 승급
    guard:       'assets/sfx/guard.mp3?h=aaa57726dd',   // 방어 무공
    heal:        'assets/sfx/heal.mp3?h=589cb4ddc2',   // 회복
    hit:         'assets/sfx/hit.mp3?h=2c02db1342',   // 맞음
    hit_blade:   'assets/sfx/hit_blade.mp3?h=f8f4b0fa8f',   // 베임
    hit_blunt:   'assets/sfx/hit_blunt.mp3?h=9a5d9751bd',   // 둔기 · 주먹에 맞음
    hit_heavy:   'assets/sfx/hit_heavy.mp3?h=8d7350c540',   // 크게 맞음
    item:        'assets/sfx/item.mp3?h=9f80e57bed',   // 물건 얻음
    levelup:     'assets/sfx/levelup.mp3?h=08cb2cba8c',   // 레벨 업
    miss:        'assets/sfx/miss.mp3?h=6c68dbe381',   // 빗나감
    mission:     'assets/sfx/mission.mp3?h=a8680a72a6',   // 임무 달성
    open:        'assets/sfx/open.mp3?h=653dbce1d3',   // 창 열기
    poison:      'assets/sfx/poison.mp3?h=103668ba66',   // 중독
    realm:       'assets/sfx/realm.mp3?h=04f87b3920',   // 경지 상승
    save:        'assets/sfx/save.mp3?h=cce3cd6dda',   // 저장
    select:      'assets/sfx/select.mp3?h=48f340c003',   // 캐릭터 고름
    skill:       'assets/sfx/skill.mp3?h=ee84677405',   // 무공
    step:        'assets/sfx/step.mp3?h=3e6fc317d6',   // 이동
    turn_ally:   'assets/sfx/turn_ally.mp3?h=b43b7d3e69',   // 아군 턴
    turn_enemy:  'assets/sfx/turn_enemy.mp3?h=759786a3c5',   // 적 턴
  },

  // 물건 그림 (배낭 · 잡화점 · 장비 칸). data/items.js 의 img 에 이 이름을 적음 — 그림이 없는 물건은 글자 아이콘
  item: {
    sword:   'assets/items/sword.webp?h=3a2c3b152d',     // 철검
    wood_sword: 'assets/items/wood_sword.webp?h=fe3451cd06',   // 목검 (철검 그림을 나무색으로 바꾼 임시 그림)
    bow:     'assets/items/bow.webp?h=9c3a338958',       // 활
    cloth:   'assets/items/cloth.webp?h=0100d1c8d0',     // 천옷
    leather: 'assets/items/leather.webp?h=330550a47f',   // 가죽갑옷
    book:    'assets/items/book.webp?h=62bd258b04',      // 토납법 서책 · 전뢰심법
    salve:   'assets/items/salve.webp?h=a5f8845d7e',     // 금창약 (연고 단지)
    bottle:  'assets/items/bottle.webp?h=5afa9646c2',    // 해독제 (청자 병)
    herb:    'assets/items/herb.webp?h=ab751cb688',      // 약초 묶음 (아직 쓰는 물건 없음)
    pills:   'assets/items/pills.webp?h=f5353647c4',     // 환약 상자 (초급 영약)
    // ---- 먹빛강호에서 가져온 아이콘 (192px → 128px, 모서리를 부드럽게 지움) ----
    mk_c_t9: 'assets/items/mk_c_t9.webp?h=4a01334c89',   // 부적 (먹빛강호 천외 패)
    mk_c_jade: 'assets/items/mk_c_jade.webp?h=5a28d471db',   // 옥패 (먹빛강호 청옥패)
    mk_c_silver: 'assets/items/mk_c_silver.webp?h=9c04246c71',   // 은가락지 (먹빛강호 은가락지)
    mk_c_ring: 'assets/items/mk_c_ring.webp?h=ba3f8d7aba',   // 구리 팔찌 (먹빛강호 구리 가락지)
    mk_c_songhak: 'assets/items/mk_c_songhak.webp?h=cac1bc0c25',   // 무당 호신부 (먹빛강호 송학 옥패)
    mk_c_shu: 'assets/items/mk_c_shu.webp?h=d17675c3e2',   // 비취 가락지 (먹빛강호 비취 가락지)
    mk_c_t6: 'assets/items/mk_c_t6.webp?h=d0b9fdcbed',   // 호심경 (먹빛강호 자금 패)
    mk_b_shu: 'assets/items/mk_b_shu.webp?h=d8a0a54183',   // 금사 요대 (먹빛강호 금사 요대)
    mk_b_beast: 'assets/items/mk_b_beast.webp?h=d6881f7f93',   // 호피 요대 (먹빛강호 수왕 요대)
    mk_c_gucheon: 'assets/items/mk_c_gucheon.webp?h=430dbc0ead',   // 팔괘 옥패 (먹빛강호 구천 옥패)
    mk_c_cheonmyeon: 'assets/items/mk_c_cheonmyeon.webp?h=fcb59784f1',   // 묵옥 반지 (먹빛강호 천면 가락지)
    mk_c_yeomju: 'assets/items/mk_c_yeomju.webp?h=ab45c77eb7',   // 금강 팔찌 (먹빛강호 금강 염주)
    mk_c_hongryeon: 'assets/items/mk_c_hongryeon.webp?h=da5470347d',   // 자수정 노리개 (먹빛강호 홍련패)
    mk_b_t9: 'assets/items/mk_b_t9.webp?h=25f30105ae',   // 용문 요대 (먹빛강호 천외 요대)
    mk_wr_shu: 'assets/items/mk_wr_shu.webp?h=a2056f737a',   // 천잠 장갑 (먹빛강호 촉금 호완)
    mk_a_hyeonmu: 'assets/items/mk_a_hyeonmu.webp?h=ae8b43e128',   // 현무 호심경 (먹빛강호 현무갑)
    mk_c_cheongryong: 'assets/items/mk_c_cheongryong.webp?h=071e998758',   // 청룡 옥패 (먹빛강호 청룡주)
    mk_w_steel: 'assets/items/mk_w_steel.webp?h=e86dbd53b6',   // 은장도 (먹빛강호 청강검)
    mk_c_musan: 'assets/items/mk_c_musan.webp?h=c49c35975d',   // 청옥 인장 (먹빛강호 무산 옥패)
    mk_mat7: 'assets/items/mk_mat7.webp?h=e81ba5e939',   // 산호수 (먹빛강호 혈옥)
    mk_w_blue: 'assets/items/mk_w_blue.webp?h=050e44bc5d',   // 호신 비수 (먹빛강호 청풍검)
    mk_mp_m: 'assets/items/mk_mp_m.webp?h=6994f5a109',   // 자금 향로 (먹빛강호 자소단)
    mk_c_bingbaek: 'assets/items/mk_c_bingbaek.webp?h=a87bcc6446',   // 수정 구슬 (먹빛강호 빙백주)
    mk_w_shu: 'assets/items/mk_w_shu.webp?h=a663f2d7a1',   // 칠성 비수 (먹빛강호 촉강검)
    mk_c_west: 'assets/items/mk_c_west.webp?h=b9ae84f2e6',   // 야명주 (먹빛강호 야명주 패)
    mk_c_t8: 'assets/items/mk_c_t8.webp?h=42858c1750',   // 화씨벽 (먹빛강호 해심 패)
    mk_w_west: 'assets/items/mk_w_west.webp?h=ae51241402',   // 간장 (먹빛강호 흑철중검)
    mk_w_maehwa: 'assets/items/mk_w_maehwa.webp?h=71ea24135b',   // 막야 (먹빛강호 매화검)
    mk_w_cheonmyeong: 'assets/items/mk_w_cheonmyeong.webp?h=a2a67c23c5',   // 태아검 (먹빛강호 천명검)
    mk_stone1: 'assets/items/mk_stone1.webp?h=77ef4556b6',   // 강화석 (먹빛강호 stone1)
    mk_stone4: 'assets/items/mk_stone4.webp?h=f372d9a34d',   // 승급석 (먹빛강호 stone4)
    mk_mat1: 'assets/items/mk_mat1.webp?h=fea520a0f6',   // 현철 (먹빛강호 흑철)
    mk_potion_l: 'assets/items/mk_potion_l.webp?h=2d9a5a519e',   // 금창고 (먹빛강호 회생단)
    mk_potion_z: 'assets/items/mk_potion_z.webp?h=90a7fc6f63',   // 청심환 (먹빛강호 천년설삼환)
    mk_potion_t: 'assets/items/mk_potion_t.webp?h=bc17564937',   // 중급 영약 (먹빛강호 태청단)
    mk_w_t9: 'assets/items/mk_w_t9.webp?h=aeaf34878c',   // 천씨 가전검 (먹빛강호 천외검)
    mk_w_song: 'assets/items/mk_w_song.webp?h=edb709d979',   // 진무검 (먹빛강호 송문고검)
    mk_a_unhae: 'assets/items/mk_a_unhae.webp?h=ccd99e0f58',   // 천씨 호신의 (먹빛강호 운해 선의)
    mk_a_bingung: 'assets/items/mk_a_bingung.webp?h=02e8a06645',   // 태극 도포 (먹빛강호 빙궁 선의)
    mk_a_scale: 'assets/items/mk_a_scale.webp?h=5135165277',   // 화원 사냥복 (먹빛강호 어린갑)
    mk_cl_cloth: 'assets/items/mk_cl_cloth.webp?h=4449773b7d',   // 백결의 (먹빛강호 무명 피풍)
    // ---- v115 새 그림 ----
    staff: 'assets/items/staff.avif?h=b4008b06d1',   // 봉
    bamboo_staff: 'assets/items/bamboo_staff.avif?h=3daaa9615a',   // 녹죽봉
    iron_fan: 'assets/items/iron_fan.avif?h=7f9cad6df6',   // 철선
    monk_staff: 'assets/items/monk_staff.avif?h=ae0acfda14',   // 선장
    throwing_blade: 'assets/items/throwing_blade.avif?h=56f4e48e9e',   // 비도
    saber: 'assets/items/saber.avif?h=d4de565cf6',   // 박도
    whip: 'assets/items/whip.avif?h=d1782198e8',   // 채찍
    silk: 'assets/items/silk.avif?h=f9d7bc97f9',   // 천잠사
    iron_ore: 'assets/items/iron_ore.avif?h=c0063a6274',   // 철광석
    leather_strap: 'assets/items/leather_strap.avif?h=852fbea0ac',   // 가죽끈
    pouch: 'assets/items/pouch.avif?h=964e69e4f4',   // 수놓은 향낭
    knot: 'assets/items/knot.avif?h=de062222d2',   // 매깃 노리개
    bronze_pin: 'assets/items/bronze_pin.avif?h=735571486e',   // 청동 잠
    coral_earrings: 'assets/items/coral_earrings.avif?h=27edae5fcd',   // 산호 귀걸이
    jade_pin: 'assets/items/jade_pin.avif?h=33cfeefb62',   // 백옥 잠
    phoenix_pin: 'assets/items/phoenix_pin.avif?h=0ecbe84034',   // 봉황 비녀
    amber: 'assets/items/amber.avif?h=0dd8ea730f',   // 호박 구슬
    treasure_chest: 'assets/items/treasure_chest.avif?h=67257ac0e6',   // 보물상자
    gold_chest: 'assets/items/gold_chest.avif?h=ce74c37c62',   // 금전상자
  },
  // 무공 연출 (컷인) — data/skills.js 의 cutin 에 이 이름을 적음. 가로로 긴 그림 (3:2 정도)
  //   여자 주인공용은 이름 뒤에 _f (예: cheonsi_geom_f) — 없으면 여자 주인공일 때는 컷인 없이 이름 띠만
  cutin: {
    cheonsi_geom: 'assets/cutins/cheonsi_geom.avif?h=ec5e80c37c',   // 천씨검법 (주인공)
    cheonsi_geom_f: 'assets/cutins/cheonsi_geom_f.avif?h=28d617dd69',   // 천씨검법 (여자 주인공)
    yukhap_gwon:  'assets/cutins/yukhap_gwon.avif?h=84bae9ae4a',    // 육합권법 (위지렴)
    mudang_jang:  'assets/cutins/mudang_jang.avif?h=f1492c3de5',    // 무당장권 (청화)
    hwawon_singung: 'assets/cutins/hwawon_singung.avif?h=1df28bf13a',   // 화원신궁 (위지렴)
    hangryong:    'assets/cutins/hangryong.avif?h=034e3545c7',      // 황룡십팔장 (곽정)
    tagu:         'assets/cutins/tagu.avif?h=30f2d94628',           // 타구봉법 (황용)
    taegeuk:      'assets/cutins/taegeuk.avif?h=1ad116d3b3',        // 태극혜검 (장삼봉)
    // v119 절기 컷인 (data/jeolgi.js) — 주인공은 남/여 (_f) 따로
    cheonsi_yuseong:   'assets/cutins/cheonsi_yuseong.avif?h=c06acadbd4',   // 천씨검법 · 유성 (주인공 남)
    cheonsi_yuseong_f: 'assets/cutins/cheonsi_yuseong_f.avif?h=c81d3b099b',   // 천씨검법 · 유성 (주인공 여)
    seonghwa_yowon:    'assets/cutins/seonghwa_yowon.avif?h=1fa1a013e2',   // 성화요원 (주인공 남)
    seonghwa_yowon_f:  'assets/cutins/seonghwa_yowon_f.avif?h=94eb036848',   // 성화요원 (주인공 여)
    taegeuk_geom:      'assets/cutins/taegeuk_geom.avif?h=a087181176',   // 태극검 · 만류귀종 (청화)
    maehwa_jeon:       'assets/cutins/maehwa_jeon.avif?h=ea8741e859',   // 매화낙영전 (위지렴)
    hangryong_yuhoe:   'assets/cutins/hangryong_yuhoe.avif?h=28d19f6871',   // 항룡유회 (석운)
    jewang_biryong:    'assets/cutins/jewang_biryong.avif?h=4e3c23d175',   // 제왕검형 · 비룡 (남궁설)
    paljin_gwimun:     'assets/cutins/paljin_gwimun.avif?h=cabf0fb153',   // 팔진도 · 귀문 (제갈윤)
    geumgang_hangma:   'assets/cutins/geumgang_hangma.avif?h=e375e71149',   // 금강항마권 (혜공)
    pogu_ihwa:         'assets/cutins/pogu_ihwa.avif?h=2a9e0dfd95',   // 폭우이화침 (당소소)
    gwaneum_cheonsu:   'assets/cutins/gwaneum_cheonsu.avif?h=7b193a8aef',   // 관음천수 (정심)
    taeeul_gwiil:      'assets/cutins/taeeul_gwiil.avif?h=ba06eccecf',   // 태을검 · 귀일 (현도)
    bingbaek_seolhwa:  'assets/cutins/bingbaek_seolhwa.avif?h=49f6f35967',   // 빙백신장 · 설화 (설란)
    baeksu_gunmu:      'assets/cutins/baeksu_gunmu.avif?h=cb6dbbf7da',   // 백수군무 (바라카)
    gwangdo_nanmu:     'assets/cutins/gwangdo_nanmu.avif?h=7727f30ee9',   // 광도난무 (팽소호)
    jewang_ilgeom:     'assets/cutins/jewang_ilgeom.avif?h=bcc735241f',   // 제왕일검 (남궁진)
    maehwa_mangae:     'assets/cutins/maehwa_mangae.avif?h=a01ac01154',   // 매화만개 (현원)
    gwangpung_maehwa:  'assets/cutins/gwangpung_maehwa.avif?h=1b7cb294f3',   // 광풍매화 (현적)
    unryong_samhyeon:  'assets/cutins/unryong_samhyeon.avif?h=bdf01f9689',   // 운룡삼현 (하운)
    cheonmyeong_gwiil: 'assets/cutins/cheonmyeong_gwiil.avif?h=78b5f458ed',   // 천명귀일 (천명)
    gucheon_noein:     'assets/cutins/gucheon_noein.avif?h=98945fb11d',   // 구천 뇌인 (태허)
    jujak_hwayeom:     'assets/cutins/jujak_hwayeom.avif?h=9bbbc9c605',   // 주작 화염 (하란설)
    hyeolcheon_magong: 'assets/cutins/hyeolcheon_magong.avif?h=73c207c042',   // 혈천마공 (혈천마)
    cheonma_singong:   'assets/cutins/cheonma_singong.avif?h=d61cece077',   // 천마신공 (독고천)
    hapmagong:         'assets/cutins/hapmagong.avif?h=a33194cde2',   // 합마공 (구후)
  },
  // 거점 상인
  npc: {
    smith: 'assets/npcs/smith.webp?h=c2b933ae8d',
    store: 'assets/npcs/store.webp?h=c0966af0b9',
  },
};

// 컷인 그림의 얼굴 자리 [가로 %, 세로 %] (그림 왼쪽 위 = 0, 0) — 화면 비율이 달라도 얼굴이 띠 안에 보이도록 맞춤
//   (없으면 data/skills.js 의 cutinPos 를 그대로 씀) · 새 컷인을 넣으면 얼굴 가운데를 재어 적기
const CUTIN_FACE = {
  cheonsi_geom:[62,22], cheonsi_geom_f:[65,25], yukhap_gwon:[47,15], mudang_jang:[52,21], hwawon_singung:[35,24],
  hangryong:[38,24], tagu:[56,26], taegeuk:[60,9],
  cheonsi_yuseong:[44,23], cheonsi_yuseong_f:[61,24], seonghwa_yowon:[32,25], seonghwa_yowon_f:[25,28],
  taegeuk_geom:[37,14], maehwa_jeon:[22,22], hangryong_yuhoe:[25,21], jewang_biryong:[46,24], paljin_gwimun:[52,13],
  geumgang_hangma:[38,16], pogu_ihwa:[37,17], gwaneum_cheonsu:[52,17], taeeul_gwiil:[31,18], bingbaek_seolhwa:[38,20],
  baeksu_gunmu:[34,15], gwangdo_nanmu:[61,15], jewang_ilgeom:[52,14], maehwa_mangae:[68,19], gwangpung_maehwa:[37,20],
  unryong_samhyeon:[56,22], cheonmyeong_gwiil:[44,16], gucheon_noein:[37,13], jujak_hwayeom:[41,23],
  hyeolcheon_magong:[44,12], cheonma_singong:[54,15], hapmagong:[57,25],
};
