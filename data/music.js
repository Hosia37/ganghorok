/* =====================================================================
   배경음 배정 (v127) — 장면 · 전투마다 어떤 곡을 틀지
   ---------------------------------------------------------------------
   곡 파일은 data/assets.js 의 bgm 에 (이름 → assets/bgm/이름.mp3)
     title   시작 화면 · 캐릭터 선택         road    강호의 길 (낮의 여정)
     town    저잣거리 · 객잔 · 거점           tension 음모 · 긴장 · 조사
     sorrow  이별 · 슬픔 · 회상              night   밤 · 다짐 · 속마음
     resolve 결의 · 회합 · 출정              sacred  산문 · 장엄 · 계승
     west    서역 · 사막                     north   북방 · 초원 · 설원
     south   남방 · 밀림                     sea     바다 · 항구
     villain 천교 · 악의 본산               ending  엔딩
     battle 보통 전투 · battle_boss 강적 · battle_crisis 위기 · 방어 · battle_duel 비무
     battle_demon 악의 본산 · battle_final 최종 결전
     짧은 곡 : win 승리 · lose 패배 · chapter 장이 바뀔 때
   장면 대사 줄에 bgm:'sacred' 처럼 적으면 그 줄부터 곡이 바뀜
   여기 없는 장면은 장(chapter) 기본값 → 'road', 없는 전투는 우두머리 전투면 battle_boss · 아니면 battle
   ===================================================================== */
const MUSIC = {
  scene: {
    // 서장
    prologue:'tension', wudang:'sacred', wudang_after:'sacred',
    // 제1장 양양
    yangyang:'town', yangyang_after:'town', yangyang_trail:'tension', yangyang_ambush:'tension', yangyang_revenge_after:'town', yangyang_revenge_talked:'town',
    cheolgeom_visit:'tension', cheolgeom_coup:'tension', cheolgeom_hall_talk:'road', yangyang_hwasan:'town', yangyang_hwasan_after:'town',
    yangyang_lord:'resolve', yangyang_heart:'road', yangyang_lord_trial:'tension', yangyang_guo_inn:'tension', yangyang_traitors:'tension',
    yangyang_traitors_after:'tension', yangyang_traitor_trial:'tension', yangyang_inn_cheonghwa:'night', cheolgeom_revisit:'tension',
    yangyang_errand:'road', mountain_path:'road',
    // 제2장 절강 · 낭야
    zhejiang_road:'road', jeokryong_inside:'tension', jeokryong_gate:'road', cheongyo_meeting:'villain', zhejiang_branch:'road',
    gaebang_after:'road', sapa_branch_front:'tension', sapa_branch_after:'tension', gaebang_interrogation:'tension', guhu_road:'villain',
    nangya_arrival:'town', nangya_inn:'town', nangya_market_after:'town', nangya_inn_night:'night', jegal_house:'sacred',
    jegal_hall_after:'sorrow', jegal_wake:'sorrow', nangya_inn_end:'road', anhui_road:'road',
    // 제3장 남궁세가
    anhui_arrival:'tension', anhui_guo:'town', namgung_gate:'resolve', namgung_hall:'resolve', namgung_alarm:'tension',
    anhui_market_majin:'tension', anhui_majin_after:'sorrow', ng_return:'tension', ng_after:'night', taihu_after:'sea',
    ch3_end:'resolve', tg_ch3:'villain',
    // 제4장 촉 · 남만
    sd_arrival:'town', dokrim_after:'town', cd_night:'night', bp_after:'south', qc_after:'sacred', ch4_end:'tension', tg_ch4:'villain',
    // 제5장 서역 · 화산
    lz_arrival:'west', kl_after:'sacred', ds_night:'night', hs_arrival:'tension', hs_after:'sorrow', hs_night:'night', hs_heir:'sacred',
    ch5_end:'tension',
    // 제6장 북해
    pg_arrival:'north', mb_arrival:'north', cw_night:'night', bo_arrival:'north', bi_arrival:'north', ch6_end:'north',
    // 제7장 무림맹 · 낙양
    ml_arrival:'resolve', ml_camp:'night', gbt_arrival:'town', tg_ch7a:'villain', lk_memory:'sorrow', lk_arrival:'tension',
    lk_after:'sorrow', ty_arrival:'tension', ch7_end:'resolve', tg_ch7b:'villain',
    // 제8장 남해 · 혈교
    gz_arrival:'sea', ship_night:'sorrow', hn_arrival:'sea', wm_after:'south', hx_after:'villain', ch8_end:'resolve', tg_ch8:'villain',
    // 제9장 십만대산 · 마교
    nn_arrival:'south', tl_arrival:'sacred', ridge_night:'night', mc_arrival:'tension', tmd_arrival:'villain', ch9_end:'resolve', tg_ch9:'villain',
    // 제10장 봉래 · 천교
    nb_arrival:'sea', nb_night:'night', bt_arrival:'sacred', bg_arrival:'tension', th_arrival:'villain', ch10_end:'resolve', tg_ch10:'villain',
    // 최종장
    yc_arrival:'north', yc_night:'night', cg_meet:'sacred', gw_arrival:'villain', jt_before:'villain', ending:'ending',
  },
  chapter: { '서장':'road', '제1장':'town', '제2장':'road', '제3장':'resolve', '제4장':'road', '제5장':'west', '제6장':'north',
             '제7장':'resolve', '제8장':'sea', '제9장':'south', '제10장':'sea', '최종장':'north' },
  battle: {
    prologue:'battle', wudang_defense:'battle_crisis', cheolgeom:'battle', cheolgeom_revenge:'battle', cheolgeom_coup:'battle_boss',
    hwasan_clash:'battle_duel', yangyang_traitors:'battle', mountain_bandits:'battle', jeokryong_raid:'battle_boss',
    gaebang_defense:'battle_crisis', sapa_branch_raid:'battle_boss', nangya_market:'battle', jegal_assassins:'battle_crisis',
    anhui_majin:'battle_crisis', namgung_garden:'battle_boss', taihu_raid:'battle', samhyeop_pass:'battle_boss',
    dokrim:'battle_boss', beast_palace:'battle_boss', qingcheng_back:'battle_demon', blood_branch:'battle_demon',
    kunlun_duel:'battle_duel', black_sand:'battle_boss', hwasan_rescue:'battle_boss', left_guardian:'battle_demon',
    paeng_outer:'battle_boss', grassland:'battle_boss', ice_outer:'battle_boss', ice_inner:'battle_boss',
    yellow_river:'battle_boss', bukmang:'battle_demon', luoyang_under:'battle_boss', taihang:'battle_boss',
    pirate_isle:'battle', wuxi_man:'battle_boss', blood_sea:'battle_demon', blood_palace:'battle_demon',
    jungle:'battle', demon_ridge:'battle_boss', demon_hq:'battle_demon', demon_hall:'battle_demon',
    zhoushan:'battle', penglai_shore:'battle_boss', penglai_palace:'battle_demon', tianming_terrace:'battle_demon',
    ice_wall:'battle_boss', cloud_path:'battle_boss', outer_palace:'battle_demon', final:'battle_final',
  },
  hub:'town',          // 거점
  title:'title',       // 시작 화면 · 캐릭터 선택
  endingScreen:'ending',
};
