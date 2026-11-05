/* =====================================================================
   절기 — 인물마다 하나씩 이야기 속에서 익히는 큰 무공 · 적 대장 절기 컷인
   - 이 파일은 장면 · 전투 · 새 인물 · 무공 · 수련도를 한곳에 모아 둔 것 (data/scenes.js · battles.js · units.js 와 같은 적는 법)
   ===================================================================== */
Object.assign(SKILLS, {
  '천씨검법 · 유성':{ range:3, area:'line3', power:1.9, mp:30, cutin:'cheonsi_yuseong', cutinPos:'50% 12%', desc:'직진 3칸 · 별똥별처럼 꿰뚫는 천씨 검보의 마지막 장 — 아버지가 남긴 검' },
  '성화요원':{ range:4, area:'line4', power:2.6, mp:60, cutin:'seonghwa_yowon', cutinPos:'50% 20%', desc:'직진 4칸 · 작은 불씨 하나가 들판을 태운다 — 천씨검법의 끝 초식 (星火燎原)' },
  '태극검 · 만류귀종':{ range:1, area:'sweep3', power:2.2, mp:45, cutin:'taegeuk_geom', cutinPos:'50% 10%', desc:'앞쪽 가로 3칸 · 모든 물줄기가 바다로 돌아가듯 — 장삼봉이 청화에게 맡긴 한 수' },
  '매화낙영전':{
    range:4,
    minRange:2,
    area:'volley3',
    power:2.0,
    mp:40,
    cutin:'maehwa_jeon',
    cutinPos:'50% 15%',
    desc:'2~4칸 앞 가로 3칸 · 화산의 매화검리를 화살에 실어, 꽃잎 지듯 쏟아붓는다',
  },
  '항룡유회':{ range:3, area:'line3', power:2.2, mp:45, cutin:'hangryong_yuhoe', cutinPos:'50% 12%', desc:'직진 3칸 · 항룡십팔장의 첫 초식 — 황 방주가 후개에게 맡긴 장법' },
  '제왕검형 · 비룡':{ range:3, area:'line3', power:2.0, mp:40, cutin:'jewang_biryong', cutinPos:'50% 0%', desc:'직진 3칸 · 제왕검형 셋째 초식 — 날아오르는 용처럼 찌르고 베는 검' },
  '팔진도 · 귀문':{
    range:3,
    minRange:2,
    area:'volley3',
    power:1.9,
    mp:45,
    cutin:'paljin_gwimun',
    cutinPos:'50% 5%',
    desc:'2~3칸 앞 가로 3칸 · 제갈세가 팔진도의 마지막 문 — 들어온 적은 길을 잃는다',
  },
  '금강항마권':{ range:1, area:'sweep3', power:2.3, mp:45, cutin:'geumgang_hangma', cutinPos:'50% 5%', desc:'앞쪽 가로 3칸 · 마를 꺾되 사람은 살리는 소림의 권' },
  '폭우이화침':{
    range:3,
    minRange:2,
    area:'volley3',
    power:1.9,
    mp:45,
    poison:{ turns:3, dmg:24 },
    cutin:'pogu_ihwa',
    cutinPos:'50% 5%',
    desc:'2~3칸 앞 가로 3칸 · 소나기처럼 쏟아지는 당가의 비전 암기 — 3턴 중독',
  },
  '관음천수':{ range:2, area:'ally', heal:0.6, mp:40, cutin:'gwaneum_cheonsu', cutinPos:'50% 5%', desc:'2칸 안 아군 하나 · 체력 60% 회복 — 천 개의 손으로 상처를 어루만지는 아미의 심법' },
  '태을검 · 귀일':{ range:3, area:'line3', power:2.1, mp:45, cutin:'taeeul_gwiil', cutinPos:'50% 6%', desc:'직진 3칸 · 서른여섯 검로를 하나로 거둬 꿰뚫는 종남의 검' },
  '빙백신장 · 설화':{ range:1, area:'sweep3', power:2.2, mp:45, cutin:'bingbaek_seolhwa', cutinPos:'50% 0%', desc:'앞쪽 가로 3칸 · 눈꽃이 흩날리는 북해빙궁의 장법' },
  '백수군무':{ range:2, area:'line2', power:2.2, mp:45, cutin:'baeksu_gunmu', cutinPos:'50% 15%', desc:'직진 2칸 · 짐승들이 한꺼번에 덮치는 야수궁의 조련술' },
  '광도난무':{ range:1, area:'sweep3', power:2.4, mp:50, cutin:'gwangdo_nanmu', cutinPos:'50% 5%', desc:'앞쪽 가로 3칸 · 미친 듯 휘몰아치는 팽가의 도' },
  '제왕일검':{ range:1, area:'single', power:2.7, mp:50, cutin:'jewang_ilgeom', cutinPos:'50% 5%', desc:'1칸 단일 · 남궁 가주의 검 — 한 칼에 끝낸다' },
  '매화만개':{ range:1, area:'sweep3', power:2.2, mp:45, cutin:'maehwa_mangae', cutinPos:'50% 12%', desc:'앞쪽 가로 3칸 · 스물네 갈래 매화가 한꺼번에 피어나는 화산의 검' },
  '광풍매화':{ range:3, area:'line3', power:2.2, mp:45, cutin:'gwangpung_maehwa', cutinPos:'50% 5%', desc:'직진 3칸 · 매화 꽃잎을 휘몰아 꿰뚫는 거친 검' },
  '운룡삼현':{ range:4, area:'line4', power:2.3, mp:50, cutin:'unryong_samhyeon', cutinPos:'50% 8%', desc:'직진 4칸 · 구름 속 용이 세 번 모습을 드러내는 곤륜의 검' },
});
if (SKILLS['천명귀일']) Object.assign(SKILLS['천명귀일'], { cutin:'cheonmyeong_gwiil', cutinPos:'50% 13%' });
if (SKILLS['구천 뇌인']) Object.assign(SKILLS['구천 뇌인'], { cutin:'gucheon_noein', cutinPos:'50% 5%' });
if (SKILLS['주작 화염']) Object.assign(SKILLS['주작 화염'], { cutin:'jujak_hwayeom', cutinPos:'50% 0%' });
if (SKILLS['혈천마공']) Object.assign(SKILLS['혈천마공'], { cutin:'hyeolcheon_magong', cutinPos:'50% 0%' });
if (SKILLS['천마신공']) Object.assign(SKILLS['천마신공'], { cutin:'cheonma_singong', cutinPos:'50% 0%' });
if (SKILLS['합마공']) Object.assign(SKILLS['합마공'], { cutin:'hapmagong', cutinPos:'50% 0%' });
// 장면
Object.assign(SCENES, {
});
// 전투
Object.assign(BATTLES, {
});
