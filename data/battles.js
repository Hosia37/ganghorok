/* =====================================================================
   전투
   ---------------------------------------------------------------------
   map        : 지도 번호 (지형 = data/maps/map_###.json, 그림 = data/assets.js 의 map)
   turnLimit  : 이 턴을 넘기면 패배
   goal       : 화면 왼쪽 위에 보일 승리 / 패배 조건 글
   loseIfDown : 이 인물이 쓰러지면 바로 패배 (예: ['hero'])
   allies     : 아군·우군 배치  { id:'hero' / 'cheonghwa' / 'guo' ..., x, y }
                (합류한 아군 = units.js 의 party:true, 그 외 = 우군)
   enemies    : 적 배치          { id:units.js 이름표, x, y, level(선택), hold(선택) }
                → level 을 적으면 이 전투에서만 그 레벨 (경지 · 능력치는 레벨로 자동). 우군 배치에도 적을 수 있음
                  'hero+1' 처럼 적으면 주인공 레벨 기준
                → hold:4 = 4턴 전까지 제자리에서 대기 (아군이 holdRange(기본 4)칸 안에 오거나 맞으면 움직임)
                → 대사에서는 적은 순서대로 'e1', 'e2', ... 로 부름 (증원도 이어서 번호)
   intro      : 전투 시작 전 대사 { who, text }  (who = 'hero' / 'guo' / 'e1' ...)
   events     : 정해진 턴(아군 턴 시작)에 일어나는 일
     { turn, spawn:[적 증원], talk:[대사] }        — who:'arrival' = 이번에 나타난 첫 유닛
     { turn, arrive:{id,x,y}, talk, ultimate:{ by, name, retreatLine | fallLine, lineBy }, victory:true }
     { turn, ifKills:5, talk, flee:{ who:'e1', to:[x,y] }, goal:'…', afterTalk:[…], leave:{ who, to, msg } }
                                                    — 그 턴에 적을 5명 이상 쓰러뜨렸으면 : 대사 → 그 적이 도망 → 목표 글 바꿈 → 뒤 대사
                                                      → leave 의 인물(아군 · 우군)이 전장을 떠남 (쓰러진 것으로 치지 않음)
                                                      (모자라면 그냥 지나감. 도망간 적은 쓰러뜨린 것으로 치지 않음)
     { turn, arrive, talk, strike:{ by:'arrival', ids:['cheolgeom'], label:'의 화살!' }, afterTalk }
                                                    — 대사 뒤 나타난 인물이 적 하나(ids 중 가장 가까운 산 적)를 단숨에 쓰러뜨림 → 뒤 대사
                                                      대사의 who:'target' = 그 적, or:'target' = 말할 인물이 쓰러졌으면 대신, needTarget = 쓰러뜨릴 적이 있을 때만
     spawn 에도 name · skills 등을 적을 수 있음
                                                    — 인물 등장 → 무공 (컷인) → retreatLine 이면 적 전원 퇴각 · fallLine 이면 전원 쓰러짐 (lineBy = 말하는 적) → 승리
   victory    : 승리 처리
     enemiesLeft : 적이 이 수 이하로 남으면 승리 (0 = 전멸, null = 쓰러뜨려서는 끝나지 않음)
     retreat     : 남은 적이 물러나는 연출 { line, to:[x,y] }
     talk        : 승리 후 대사
     loot        : 전리품 (배낭으로 들어감)  '목검' 또는 { item:'금창약', n:3 }
     gold        : 금전 보상
     suryeon     : 수련치 보상 (훈련장에서 씀). 전투마다 100씩 늘림 — 무당산 450 → 철검문 550 → 보복 650 → 안마당 750 → 화산 850 → 배신자 950
     exp         : 경험치 보상 (출전한 아군 모두)
     next        : 다음 장면 (data/scenes.js). { mission:'임무', done:'장면', else:'장면' } 이면 그 임무를 완료했는지에 따라 갈림
     bossDown    : 이 적('e1' 등)을 쓰러뜨리면 승리 (패퇴)
     survive     : true 면 turnLimit 턴을 버티면 승리 (넘겨도 패배가 아님)
     retreat     : { who:'e1', line, to:[x,y], all:true } — 승리 뒤 그 적이 대사를 하고 물러남, all 이면 남은 적도 모두 물러남
   배치에 더 적을 수 있는 것 (아군 · 우군 · 적) : name(이름) · skills(무공) · passive(심법 { mpRegen }) · focus(먼저 노리는 인물 id 목록, 적만)
     같은 우군을 여럿 배치하면 cheolgeom, cheolgeom_2, cheolgeom_3 … 으로 불림
   ===================================================================== */
// 모든 전투의 승리 보상에 덧붙는 전리품 (각 전투의 victory.loot 앞에). 지는 전투(lossOk)에는 붙지 않음
//   n:'order' = 이야기 순서로 몇 번째 전투인지 (첫 전투 1개, 두 번째 2개, 세 번째 3개 … — 지는 전투는 세지 않음)
//   전투 하나만 빼려면 그 전투의 victory 에 noCommonLoot:true
const BATTLE_COMMON_LOOT = [{ item:'금전상자', n:'order' }, '보물상자', { item:'금창약', n:2 }];

const BATTLES = {
  prologue: {
    name: '서장 · 무한성 앞',
    map: '001',
    turnLimit: 30,
    goal: '승리: 사파 무사 격퇴',
    allies: [                                    // 성문 앞 광장 — 쫓겨 온 주인공 앞을 곽정 · 황용이 막아섬
      { id:'hero',  x:15, y:8 },
      { id:'guo',   x:13, y:9 },
      { id:'huang', x:14, y:10 },
    ],
    enemies: [                                   // 남서쪽 저잣거리 길로 쫓아온 사파 무사
      { id:'sapa_musa', x:10, y:11 },
      { id:'sapa_musa', x:11, y:12 },
      { id:'sapa_musa', x:9,  y:11 },
      { id:'sapa_musa', x:10, y:12 },
      { id:'sapa_musa', x:8,  y:11 },
      { id:'sapa_musa', x:9,  y:12 },
    ],
    intro: [
      { who:'e1',  text:'북협! 이건 우리 교의 일이오. 교의 행사를 방해하지 마시오.' },
      { who:'e1',  text:'그 애송이를 넘기고 물러나면 피를 볼 일은 없을 거요.' },
      { who:'guo', text:'사람 하나를 떼로 쫓는 게 무슨 행사란 말이오. 쫓기는 사람을 넘길 수는 없소.' },
      { who:'huang', text:'\'교\'라… 사파 무리가 언제부터 그런 걸 칭했담? 어쨌든 우리 오라버니는 한번 나서면 끝을 보는 성미라서요.' },
      { who:'e1',  text:'흥, 잘난 대협 나셨군. 이 수를 다 감당할 수 있겠나? 쳐라!' },
    ],
    victory: {
      enemiesLeft: 1,
      retreat: { line:'크윽… 북협까지 끼어들 줄이야. 다음엔 두고 보자, 천씨!', to:[10,13] },
      talk: [
        { who:'guo',   text:'후… 다친 데는 없소, {소협|소저}?' },
        { who:'hero',  text:'덕분에 무사합니다. 두 분이 아니었다면 큰일 날 뻔했습니다.' },
        { who:'huang', text:'놈들이 순순히 물러날 것 같지는 않아요. 무당산이 멀지 않으니 장진인께 이 일을 알리러 가요.' },
        { who:'hero',  text:'마침 저도 무당파로 가던 길이었습니다. 함께 모시겠습니다.' },
      ],
      loot: [{ item:'금창약', n:2 }],       // (무기 · 방어구는 인물마다 고정 — 주인공은 처음부터 철검 · 천옷)
      gold: 200,
      suryeon: 300,
      next: 'wudang',
    },
  },

  wudang_defense: {
    name: '서장 · 무당파 산문 방어',
    map: '002',
    turnLimit: 15,
    goal: '승리: 13턴까지 산문 지키기 · 패배: 주인공이 쓰러짐',
    loseIfDown: ['hero'],
    allies: [
      { id:'hero',      x:16, y:8 },
      { id:'cheonghwa', x:16, y:9 },
    ],
    enemies: [
      { id:'sapa_gosu', x:13, y:12 },
      { id:'sapa_musa', x:13, y:11 },
      { id:'sapa_musa', x:14, y:11 },
      { id:'sapa_musa', x:13, y:13 },
      { id:'sapa_musa', x:12, y:13 },
      { id:'sapa_musa', x:12, y:14 },
      { id:'sapa_musa', x:11, y:14 },
    ],
    intro: [
      { who:'hero',      text:'청화 도장, 잘 부탁드립니다.' },
      { who:'cheonghwa', text:'저야말로요. 좁은 계단을 등지고 막으면 수가 많아도 해볼 만합니다. 사조님께서 나오실 때까지만 버팁시다.' },
      { who:'e1',        text:'하! 남은 건 애송이 둘뿐이잖아? 늙은이가 나오기 전에 산문을 짓밟아라! 총공격이다!' },
    ],
    events: [
      { turn:4, spawn:[ { id:'sapa_musa', x:10, y:19 }, { id:'sapa_musa', x:9, y:18 }, { id:'sapa_musa', x:10, y:20 } ],
        talk:[ { who:'arrival', text:'산 아래에서 지원이 왔다! 계속 밀어붙여라!' } ] },
      { turn:8, spawn:[ { id:'sapa_musa', x:9, y:17 }, { id:'sapa_musa', x:10, y:19 } ],
        talk:[ { who:'arrival', text:'애송이 둘한테 뭘 그리 꾸물대나! 한꺼번에 덮쳐라!' } ] },
      { turn:13, arrive:{ id:'zhang', x:16, y:5 },
        talk:[ { who:'zhang', text:'물러서라! 무당의 산문 앞에서 더는 소란을 허락하지 않겠다.' } ],
        // 태극혜검 (무공 컷인 taegeuk) → 사파 우두머리 '암살에 실패한 건가…!' → 사파가 모두 쓰러짐
        ultimate:{ by:'zhang', name:'태극혜검', lineBy:'e1', fallLine:'암살에 실패한 건가…!' },
        victory:true },
    ],
    victory: {
      enemiesLeft: null,
      talk: [
        { who:'zhang',     text:'잘 버텼다, 청화. 안의 자객들은 곽 대협과 황 방주가 모두 제압했네.' },
        { who:'cheonghwa', text:'사조님. {name} {소협이|소저가} 함께 버텨 준 덕분입니다.' },
        { who:'hero',      text:'아닙니다. 청화 도장께서 앞을 막아 주신 덕분입니다.' },
      ],
      loot: ['토납법 서책'],
      gold: 300,
      suryeon: 450,
      exp: 60,
      next: 'wudang_after',
    },
  },

  // 제1장 · 양양 저잣거리 — 철검문과의 시비
  cheolgeom: {
    name: '제1장 · 양양 저잣거리',
    map: '003',
    turnLimit: 17,
    goal: '승리: 철검문 문하 격퇴 · 패배: 주인공이 쓰러짐',
    loseIfDown: ['hero'],
    allies: [
      { id:'hero',      x:12, y:13 },
      { id:'cheonghwa', x:11, y:14 },
    ],
    enemies: [                                              // 모두 주인공보다 1레벨 높음
      { id:'cheolgeom_sahyeong', x:12, y:9,  level:'hero', rank:'mid' },             // 대사형 + 제자 둘이 먼저 덤빔
      { id:'cheolgeom',          x:10, y:10, level:'hero+1' },
      { id:'cheolgeom',          x:14, y:10, level:'hero+1' },
      { id:'cheolgeom',          x:8,  y:8,  level:'hero+1', hold:4 },     // 나머지 셋은 객잔 앞 · 성문 길에서 대기 (4턴부터)
      { id:'cheolgeom',          x:11, y:7,  level:'hero+1', hold:4 },
      { id:'cheolgeom',          x:16, y:7,  level:'hero+1', hold:4 },
    ],
    intro: [
      { who:'e1',        text:'둘 다 묵사발을 만들어 주마! 쳐라!' },
      { who:'cheonghwa', text:'{name} {소협|소저}, 수가 많습니다. 등을 맡기고 한 명씩 상대합시다.' },
      { who:'hero',      text:'좋습니다. 무리하지 말고, 다치면 금창약을 쓰지요.' },
    ],
    events: [
      // 3턴이 지나고 4턴 시작 : 사냥꾼(통성명 전의 위지렴)이 성문 쪽에서 나타나 우군으로 참전 (주인공보다 2레벨 높음, 조종 가능)
      //   철검문이 화원파의 잔당임을 알아봄 → 사냥꾼의 화살에 가장 가까운 문도 하나가 쓰러짐 (strike) → 전투 계속
      //   who:'target' = 화살을 맞을 그 문도 · or = 대사형이 이미 쓰러졌으면 그 문도가 대신 말함
      { turn:4, arrive:{ id:'hunter', x:18, y:5, level:'hero+2', control:true },
        talk:[ { who:'e1', or:'target', text:'웬 놈이냐! …가만, 그 활. 네놈, 화원파의 그 잔당 아니더냐?' },
               { who:'target',          text:'산에 숨어 살아 있었던 게로군. 빠져라! 이건 우리 철검문의 일이다!' },
               { who:'hunter',          text:'화원파는 이제 없소. 지금의 나는 활 한 자루로 먹고사는 사냥꾼일 뿐이오.' },
               { who:'hunter',          text:'허나 사냥꾼에게도 지킬 도리는 있지. 떼로 몰려 두 사람을 치는 꼴을 보고도 모른 척 지나칠 수는 없소.' },
               { who:'e1', or:'target', text:'건방진 놈…! 저놈부터 끝장내라!' } ],
        strike:{ by:'arrival', ids:['cheolgeom'], label:'의 화살!' },
        afterTalk:[ { who:'hunter', needTarget:true, text:'다음은 누구요?' },
                    { who:'hunter', text:'거기 두 사람! 뒤는 내 활이 맡겠소. 앞을 부탁하오!' },
                    { who:'hero',   text:'고맙습니다! 함께 몰아냅시다!' } ] },
    ],
    victory: {
      enemiesLeft: 0,
      talk: [
        { who:'hunter', text:'흥, 철검문 녀석들. 요즘 들어 저잣거리에서 부쩍 설쳐 대더니.' },
        { who:'hero',   text:'도와주셔서 감사합니다. 아까 놈들이 화원파라 하던데…' },
        { who:'hunter', text:'그 이야기는 자리를 옮겨서 합시다. 놈들 사형제가 몰려오기 전에.' },
      ],
      loot: [ { item:'금창약', n:3 } ],
      gold: 500,
      suryeon: 550,
      exp: 40,
      next: 'yangyang_after',
    },
  },

  // 제1장 · 양양 저잣거리 — 철검문의 보복 (8명). 위지렴은 산에서 내려오는 길에 3턴에 합류
  //   ※ 레벨 · 턴 · 보상은 임시
  cheolgeom_revenge: {
    name: '제1장 · 철검문의 보복',
    map: '003',
    turnLimit: 20,
    goal: '승리: 철검문 문하 8명 격퇴 · 패배: 주인공이 쓰러짐',
    loseIfDown: ['hero'],
    allies: [
      { id:'hero',      x:12, y:10 },
      { id:'cheonghwa', x:13, y:10 },
    ],
    enemies: [
      { id:'cheolgeom_sahyeong', x:17, y:6,  level:'hero', rank:'mid' },            // 성문 길 : 대사형 + 문도 둘
      { id:'cheolgeom',          x:16, y:6,  level:'hero' },
      { id:'cheolgeom',          x:18, y:5,  level:'hero' },
      { id:'cheolgeom',          x:3,  y:10,  level:'hero', hold:3 },      // 서쪽 길 : 문도 둘 — 3턴부터 (가까이 가거나 맞으면 바로)
      { id:'cheolgeom',          x:4,  y:9,  level:'hero', hold:3 },
      { id:'cheolgeom',          x:21, y:10, level:'hero', hold:5 },      // 동쪽 · 남쪽 길 : 5턴부터
      { id:'cheolgeom',          x:22, y:10, level:'hero', hold:5 },
      { id:'cheolgeom',          x:11, y:15, level:'hero', hold:5 },
    ],
    intro: [
      { who:'e1',        text:'쳐라! 한 놈도 놓치지 마라!' },
      { who:'cheonghwa', text:'{name} {소협|소저}, 사방에서 옵니다. 등을 맡기고 버티지요.' },
      { who:'hero',      text:'좋습니다. 무리하지 말고 한 명씩 상대합시다.' },
    ],
    events: [
      // 3턴 시작 : 위지렴이 성문 쪽에서 나타나 합류 (아군 — 자기 레벨 · 수련 그대로, 바로 행동)
      { turn:3, arrive:{ id:'cheolmyeong', x:18, y:4 },
        talk:[ { who:'cheolmyeong', text:'늦지 않았구려!' },
               { who:'e1',          text:'너, 너는 어제 그 화원파 잔당…!' },
               { who:'cheolmyeong', text:'어제는 사냥꾼이었지. 오늘은 화원파의 위지렴이다! 화원파의 원한, 똑똑히 받아 가라!' } ] },
    ],
    victory: {
      enemiesLeft: 0,
      talk: [
        { who:'cheolmyeong', text:'짐을 챙겨 내려오는 길에 소란이 들리더니… 역시 이놈들이었구려.' },
        { who:'hero',        text:'위지 대협이 와 주지 않았다면 위험할 뻔했습니다.' },
        { who:'cheolmyeong', text:'놈들, 이대로 물러나진 않을 거요. 다음엔 더 큰 패를 들고 올 테지.' },
      ],
      loot: [ { item:'금창약', n:3 } ],
      gold: 600,
      suryeon: 650,
      exp: 50,
      next: 'yangyang_revenge_after',   // (예전 : 대사형과 대화했으면 yangyang_revenge_talked — 임무가 '대사형 처치'로 바뀌어 지금은 늘 객잔)
    },
  },

  // 제1장 · 철검문 안마당 — 사파 간부와 배신한 문원. 간부를 물리치거나 10턴을 버티면 승리
  //   간부(절정 중기)는 7턴까지 대문 쪽에서 지켜봄 (3칸 안에 들어오거나 맞으면 움직임), 문주 → 대사형 → 철검문원(우군) 순으로 노림
  //   3턴 : 사파 무인 4명 증원 / 5턴 : 그때까지 5명 이상 쓰러뜨렸으면 간부가 도망 → 남은 적을 모두 잡으면 승리
  cheolgeom_coup: {
    name: '제1장 · 철검문 안마당',
    map: '004',
    turnLimit: 10,
    goal: '승리: 사파 간부 패퇴 또는 10턴 버티기 · 패배: 주인공이 쓰러짐',
    loseIfDown: ['hero'],
    allies: [
      { id:'hero',        x:15, y:6 },
      { id:'cheonghwa',   x:14, y:6 },
      { id:'cheolmyeong', x:16, y:5 },
      // 우군 (철검문)
      { id:'cheolgeom_munju',    x:13, y:7, level:30 },                                                   // 절정 초입 · 일운검법 · 뇌류심법
      { id:'cheolgeom_sahyeong', x:12, y:7, level:10, skills:['일운 찌르기'], passive:{ mpRegen:5 } },     // 이류 · 일운 찌르기 · 철검심법
      { id:'cheolgeom', name:'철검문원', x:11, y:8, level:'hero', skills:['일운 찌르기'] },
      { id:'cheolgeom', name:'철검문원', x:17, y:7, level:'hero', skills:['일운 찌르기'] },
      { id:'cheolgeom', name:'철검문원', x:18, y:8, level:'hero', skills:['일운 찌르기'] },
    ],
    enemies: [
      { id:'sapa_ganbu', x:13, y:12, level:45, hold:7, holdRange:3,
        focus:['cheolgeom_munju','cheolgeom_sahyeong','cheolgeom'] },                                     // e1 사파 간부 (절정 중기)
      { id:'cheolgeom_traitor', name:'배신 문원', x:12, y:12, level:'hero', skills:['일운 찌르기'] },              // e2 배신한 문원
      { id:'cheolgeom_traitor', name:'배신 문원', x:14, y:12, level:'hero', skills:['일운 찌르기'] },
      { id:'cheolgeom_traitor', name:'배신 문원', x:10, y:11, level:'hero', skills:['일운 찌르기'] },
      { id:'cheolgeom_traitor', name:'배신 문원', x:16, y:11, level:'hero', skills:['일운 찌르기'] },
      { id:'cheolgeom_traitor', name:'배신 문원', x:11, y:12, level:'hero', skills:['일운 찌르기'] },
      { id:'cheolgeom_traitor', name:'배신 문원', x:14, y:11, level:'hero', skills:['일운 찌르기'] },
      { id:'cheolgeom_traitor', name:'배신 문원', x:9,  y:10, level:'hero', skills:['일운 찌르기'] },
      { id:'cheolgeom_traitor', name:'배신 문원', x:7, y:11, level:'hero', skills:['일운 찌르기'] },
      { id:'cheolgeom_traitor', name:'배신 문원', x:12, y:11, level:'hero', skills:['일운 찌르기'] },
      { id:'cheolgeom_traitor', name:'배신 문원', x:14, y:10, level:'hero', skills:['일운 찌르기'] },
    ],
    intro: [
      { who:'e1',               text:'쓸어버려라! {천씨 놈|천씨 계집}도, 늙은 문주도 하나도 남기지 마라!' },
      { who:'e2',               text:'문주직은 오늘부로 내 것이다. 덤벼라!' },
      { who:'cheolgeom_munju',  text:'간부는 절정의 고수요. 소협들은 정면으로 맞서지 말고 문도들을 막아 주시오!' },
      { who:'hero',             text:'알겠습니다. 모두 무리하지 말고 버팁시다!' },
    ],
    events: [
      // 3턴 : 사파 무인 4명이 대문 쪽으로 증원
      { turn:3, spawn:[ { id:'sapa_musa', name:'사파 무인', x:12, y:12, level:'hero-1' },
                        { id:'sapa_musa', name:'사파 무인', x:13, y:12, level:'hero-1' },
                        { id:'sapa_musa', name:'사파 무인', x:14, y:12, level:'hero-1' },
                        { id:'sapa_musa', name:'사파 무인', x:14, y:12, level:'hero-1' } ],
        talk:[ { who:'e1',              text:'때맞춰 왔구나. 연합의 무인들이다! 철검문을 쓸어버려라!' },
               { who:'cheolgeom_munju', text:'연합의 증원이오! 대문 쪽을 막으시오!' } ] },
      // 5턴 : 그때까지 적을 5명 이상 쓰러뜨렸으면 간부가 도망 → 남은 적을 모두 쓰러뜨리면 승리
      //       (5명이 안 되면 간부는 그대로 남음 — 7턴부터 움직임)
      { turn:5, ifKills:5,
        talk:[ { who:'e1', text:'…생각보다 만만치 않군. 오늘은 이만 물러나 주지. 다음에 두고 보자!' } ],
        flee:{ who:'e1', to:[13,12] },
        goal:'승리: 남은 적 모두 격퇴 · 패배: 주인공이 쓰러짐',
        afterTalk:[ { who:'cheolgeom_munju',    text:'간부가 도망쳤소! 저놈만은 놓칠 수 없지. 내가 직접 뒤를 쫓겠소!' },
                    { who:'cheolgeom_munju',    text:'대사형, 남은 배신자들은 네게 맡기마. 소협들과 함께 하나도 남김없이 처단하라!' },
                    { who:'cheolgeom_sahyeong', text:'명을 받들겠습니다, 문주님!' } ],
        leave:{ who:'cheolgeom_munju', to:[13,12], msg:'철검문주가 간부를 쫓아 전장을 떠납니다.' } },   // 문주는 여기서 전장을 떠남
    ],
    victory: {
      enemiesLeft: 0,
      bossDown: 'e1',
      survive: true,
      retreat: { who:'e1', line:'흠… 이 정도인가. 이만 물러나겠다. 다음에는 각오해라.', to:[13,12], all:true },
      talk: [   // if:{ fled:'e1' } = 간부가 도망간 경우만 / notFled = 도망가지 않은 경우만
        { who:'cheolgeom_munju',    text:'휴… 한시름 놓았소. 모두 안으로 들어갑시다.', if:{ notFled:'e1' } },
        { who:'cheolgeom_sahyeong', text:'배신자들은 대부분 처단했습니다. 몇 놈은 담을 넘어 달아났지만… 소협들 덕분입니다.', if:{ fled:'e1' } },
        { who:'cheolgeom_munju',    text:'…놈은 끝내 놓쳤소. 하지만 철검문은 지켜 냈구려. 모두 안으로 들어갑시다.', if:{ fled:'e1' } },
      ],
      loot: ['전뢰심법'],
      gold: 600,
      suryeon: 750,
      exp: 30,
      next: 'cheolgeom_hall_talk',
    },
  },
  // 제1장 · 화산파와의 겨루기 (양양 저잣거리, 지도 003) — 주인공 · 위지렴 vs 현원 · 현적 (이류) + 화산파 문원 6 (삼류)
  //   승리 : 현원 · 현적 둘 다 제압 (bossDown 배열) → 남은 문원은 검을 거둠
  hwasan_clash: {
    name: '제1장 · 화산파와의 겨루기',
    map: '003',
    turnLimit: 12,
    goal: '승리: 현원 · 현적 제압 · 패배: 주인공이 쓰러짐',
    loseIfDown: ['hero'],
    allies: [
      { id:'hero',        x:12, y:10 },
      { id:'cheolmyeong', x:11, y:9 },
    ],
    enemies: [
      { id:'hwasan_hyeonwon',  x:17, y:9,  level:'hero-1', minLevel:10, rank:'mid', skills:['매화검법'], hold:3, holdRange:3 },   // e1 현원 (이류) — 3턴까지 지켜봄
      { id:'hwasan_hyeonjeok', x:16, y:10, level:'hero-1', minLevel:10, skills:['매화검법'] },     // e2 현적 (이류)
      { id:'hwasan_disciple', x:15, y:8,  level:'hero-1', skills:['육합권법'], hold:99, holdRange:1 },                   // e3 ~ e8 화산파 문원 (삼류)
      { id:'hwasan_disciple', x:15, y:11, level:'hero-1', skills:['육합권법'], hold:99, holdRange:1 },
      { id:'hwasan_disciple', x:16, y:7,  level:'hero-1', skills:['육합권법'], hold:99, holdRange:1 },
      { id:'hwasan_disciple', x:17, y:11, level:'hero-1', skills:['육합권법'], hold:99, holdRange:1 },
      { id:'hwasan_disciple', x:18, y:8,  level:'hero-1', skills:['육합권법'], hold:99, holdRange:1 },
      { id:'hwasan_disciple', x:18, y:10, level:'hero-1', skills:['육합권법'], hold:99, holdRange:1 },
    ],
    intro: [
      { who:'e2',          text:'화원파가 화산의 검을 배웠다 했지. 그 검, 어디 한번 받아 보겠소!' },
      { who:'e1',          text:'수행원들은 앞을 막아라. 다치게 하지는 말고!' },
      { who:'hero',        text:'위지 문주님, 현원 대협과 현적 대협 두 분만 제압하면 이 싸움은 끝납니다!' },
      { who:'cheolmyeong', text:'…알고 있소. 화원파의 검이 녹슬지 않았다는 것만 보여 주면 되오.' },
    ],
    victory: {
      bossDown: ['e1','e2'],
      retreat: { all:true, msg:'화산파 문원들이 검을 거둡니다.' },
      talk: [
        { who:'e2',          text:'…크윽. 화원파의 검, 아직 녹슬지 않았구려.' },
        { who:'e1',          text:'검을 거두십시오. 저희가 졌습니다.' },
        { who:'cheolmyeong', text:'……' },
      ],
      gold: 300,
      suryeon: 850,
      exp: 30,
      next: 'yangyang_hwasan_after',
    },
  },

  // 제1장 · 배신자들의 습격 (양양 저잣거리, 지도 003) — 철검문을 판 배신 문원 8 + 3턴에 사파 무인 4 증원
  yangyang_traitors: {
    name: '제1장 · 배신자들의 습격',
    map: '003',
    turnLimit: 15,
    goal: '승리: 적 모두 격퇴 · 패배: 주인공이 쓰러짐',
    loseIfDown: ['hero'],
    allies: [
      { id:'hero',        x:12, y:10 },
      { id:'cheonghwa',   x:13, y:10 },
      { id:'cheolmyeong', x:12, y:9 },
    ],
    enemies: [
      { id:'cheolgeom_traitor', name:'배신 문원', x:17, y:6,  level:'hero-1', skills:['일운 찌르기'] },            // e1 성문 길 : 셋이 바로 덤빔
      { id:'cheolgeom_traitor', name:'배신 문원', x:16, y:6,  level:'hero-1', skills:['일운 찌르기'] },
      { id:'cheolgeom_traitor', name:'배신 문원', x:18, y:5,  level:'hero-1', skills:['일운 찌르기'] },
      { id:'cheolgeom_traitor', name:'배신 문원', x:3,  y:10,  level:'hero-1', skills:['일운 찌르기'], hold:3 },   // 서쪽 길 : 3턴부터
      { id:'cheolgeom_traitor', name:'배신 문원', x:4,  y:9,  level:'hero-1', skills:['일운 찌르기'], hold:3 },
      { id:'cheolgeom_traitor', name:'배신 문원', x:21, y:10, level:'hero-1', skills:['일운 찌르기'], hold:5 },   // 동쪽 · 남쪽 길 : 5턴부터
      { id:'cheolgeom_traitor', name:'배신 문원', x:22, y:10, level:'hero-1', skills:['일운 찌르기'], hold:5 },
      { id:'cheolgeom_traitor', name:'배신 문원', x:11, y:15, level:'hero-1', skills:['일운 찌르기'], hold:5 },
    ],
    intro: [],
    events: [
      // 3턴 : 남쪽 골목에서 사파 무인 4명 증원
      { turn:3, spawn:[ { id:'sapa_musa', name:'사파 무인', x:9,  y:16, level:'hero-2' },
                        { id:'sapa_musa', name:'사파 무인', x:10, y:16, level:'hero-2' },
                        { id:'sapa_musa', name:'사파 무인', x:12, y:16, level:'hero-2' },
                        { id:'sapa_musa', name:'사파 무인', x:13, y:16, level:'hero-2' } ] },
      // 6턴 : 성문 길로 배신 문원 4명이 더 몰려옴
      { turn:6, spawn:[ { id:'cheolgeom_traitor', name:'배신 문원', x:17, y:5, level:'hero-1', skills:['일운 찌르기'] },
                        { id:'cheolgeom_traitor', name:'배신 문원', x:16, y:5, level:'hero-1', skills:['일운 찌르기'] },
                        { id:'cheolgeom_traitor', name:'배신 문원', x:18, y:6, level:'hero-1', skills:['일운 찌르기'] },
                        { id:'cheolgeom_traitor', name:'배신 문원', x:15, y:6, level:'hero-1', skills:['일운 찌르기'] } ] },
    ],
    victory: {
      enemiesLeft: 0,
      gold: 600,
      suryeon: 950,
      exp: 30,
      next: 'yangyang_traitors_after',
    },
  },

  // 양양성 밖 산길 — 황용의 물건을 들고 절강으로 가다 산적 · 사파 무인에게 막힘 (지도 005)
  //   장면 yangyang_errand 의 끝 화면에서 '출정' → 장면 mountain_path (산길 대화) → 대화가 끝나면 바로 이 전투
  mountain_bandits: {
    name: '제1장 · 산길의 습격',
    map: '005',
    turnLimit: 20,
    goal: '승리: 적 모두 격퇴 · 패배: 주인공이 쓰러짐',
    loseIfDown: ['hero'],
    allies: [                                   // 고개 마당 오른쪽 (오른쪽 망루 앞)
      { id:'hero',        x:19, y:10 },
      { id:'cheonghwa',   x:18, y:11 },
      { id:'cheolmyeong', x:20, y:9 },
    ],
    enemies: [
      { id:'bandit_chief',    x:7,  y:5,  level:'hero', rank:'mid', hold:4, holdRange:4 },                 // e1 산적 두목 : 북쪽 고갯길을 막고 4턴까지 지켜봄
      { id:'mountain_bandit', x:14, y:10, level:'hero-1' },                                     // 고개 마당 : 셋이 바로 덤빔
      { id:'mountain_bandit', x:15, y:10, level:'hero-1' },
      { id:'mountain_bandit', x:13, y:12, level:'hero-1' },
      { id:'mountain_bandit', x:11, y:8,  level:'hero-1', hold:2 },                             // 마당 안쪽 : 2턴부터
      { id:'mountain_bandit', x:10, y:10, level:'hero-1', hold:2 },
      { id:'mountain_bandit', x:6,  y:9,  level:'hero-1', hold:3 },                             // 서쪽 망루 옆 : 3턴부터
      { id:'sapa_musa', name:'사파 무인', x:12, y:7, level:'hero-1', hold:2 },                  // 오른쪽 망루 아래
      { id:'sapa_musa', name:'사파 무인', x:13, y:7, level:'hero-1', hold:2 },
      { id:'sapa_musa', name:'사파 무인', x:6,  y:6, level:'hero-1', hold:4 },                  // 두목 곁
      { id:'sapa_musa', name:'사파 무인', x:10,  y:3, level:'hero-1', hold:4 },
    ],
    intro: [],            // 산길 대화(장면 mountain_path)에서 바로 이어짐
    events: [
      // 4턴 : 올라온 산길 쪽(뒤)에서 산적 셋이 길을 막음
      { turn:4, spawn:[ { id:'mountain_bandit', x:18, y:14, level:'hero-1' },
                        { id:'mountain_bandit', x:18, y:14, level:'hero-1' },
                        { id:'mountain_bandit', x:22, y:9, level:'hero-1' } ] },
      // 5턴 : 오른쪽 망루에서 사파 무인 둘이 내려옴
      { turn:5, spawn:[ { id:'sapa_musa', name:'사파 무인', x:16, y:7, level:'hero-1' },
                        { id:'sapa_musa', name:'사파 무인', x:16, y:8, level:'hero-1' } ] },
    ],
    victory: {
      enemiesLeft: 0,
      gold: 700,
      suryeon: 1050,
      exp: 30,
      next: 'zhejiang_road',   // 제2장
    },
  },

  // ---- 제2장 · 적룡채 토벌 (지도 006 — 적룡채 안마당) ----
  //   장면 zhejiang_road 끝 → 출정 → 이 전투 → 승리 뒤 jeokryong_inside
  //   아군은 오른쪽 산채 문 · 나무다리로 들어옴. 채주는 본채 계단 앞에서 지켜보다 4턴부터 (가까이 가거나 맞으면 바로)
  jeokryong_raid: {
    name: '제2장 · 적룡채 토벌',
    map: '006',
    turnLimit: 20,
    goal: '승리: 적룡채주 제압 · 패배: 주인공이 쓰러짐',
    loseIfDown: ['hero'],
    allies: [                                   // 나무다리 위 (산채 문을 막 지난 자리)
      { id:'hero',        x:19, y:10 },
      { id:'cheonghwa',   x:20, y:9 },
      { id:'cheolmyeong', x:21, y:7 },
    ],
    enemies: [
      { id:'jeokryong_chief', x:7, y:5, level:'hero-1', rank:'boss', hold:4, holdRange:4 },            // e1 적룡채주 : 본채 계단 앞
      { id:'mountain_bandit', x:15, y:9,  level:'hero-1' },                                // 안마당 : 둘이 바로 덤빔
      { id:'mountain_bandit', x:15, y:7,  level:'hero-1' },
      { id:'mountain_bandit', x:13, y:10, level:'hero-1', hold:2 },
      { id:'mountain_bandit', x:12, y:8,  level:'hero-1', hold:2 },                        // 안마당 가운데 : 2턴부터
      { id:'mountain_bandit', x:11, y:6,  level:'hero-1', hold:2 },
      { id:'mountain_bandit', x:10, y:9,  level:'hero-1', hold:3 },                        // 모닥불 옆 : 3턴부터
      { id:'bandit_archer',   x:13, y:5,  level:'hero-1', hold:3 },                        // 오두막 앞 궁수 : 3턴부터
      { id:'bandit_archer',   x:17, y:4,  level:'hero-1', hold:3 },                        // 망루 아래 궁수
      { id:'mountain_bandit', x:7,  y:6,  level:'hero-1', hold:4 },                        // 채주 곁
      { id:'mountain_bandit', x:9,  y:6,  level:'hero-1', hold:4 },
    ],
    intro: [
      { who:'e2',          text:'침입자다! 채주님께 알려라!' },
      { who:'e1',          text:'감히 적룡채에 발을 들여? 고개를 지키던 놈들은 다 뭘 하고 있었느냐!' },
      { who:'hero',        text:'길을 막고 사람들을 턴 값은 치르셔야겠소.' },
    ],
    events: [
      // 3턴 : 본채에서 산적들이 뛰어나옴
      { turn:3, spawn:[ { id:'mountain_bandit', x:7,  y:5, level:'hero-1' },
                        { id:'mountain_bandit', x:9,  y:5, level:'hero-1' },
                        { id:'mountain_bandit', x:12, y:4, level:'hero-1' } ] },
      // 5턴 : 산채 문 쪽(뒤)에서 고개를 지키던 산적들이 돌아옴
      { turn:5, spawn:[ { id:'mountain_bandit', x:21, y:7, level:'hero-1' },
                        { id:'mountain_bandit', x:21, y:7, level:'hero-1' } ] },
    ],
    victory: {
      bossDown: 'e1',
      retreat: { who:'e1', line:'크윽… 내가 졌다.', all:true, msg:'산적들이 무기를 내려놓습니다.' },   // 채주가 먼저 말하고 → 남은 산적들이 무기를 내려놓음
      loot: ['보물상자', '초급 영약', '야명주'],      // 제2장부터 : 영약 + 명품 하나
      gold: 800,
      suryeon: 1150,
      exp: 30,
      next: 'jeokryong_inside',
    },
  },

  // ---- 제2장 · 개방 분타 습격 (지도 007 — 절강 개방 분타 앞마당) ----
  //   장면 zhejiang_branch 끝 → 출정 → 이 전투 → 승리 뒤 gaebang_after
  //   사도결이 다리 · 부두로 쳐들어옴. 우군(조종) : 석운 · 진소연 · 마대호
  gaebang_defense: {
    name: '제2장 · 개방 분타 습격',
    map: '007',
    turnLimit: 20,
    goal: '승리: 사도결 제압 · 패배: 주인공이 쓰러짐',
    loseIfDown: ['hero'],
    allies: [                                   // 본당 계단 아래 앞마당
      { id:'hero',        x:15, y:8 },
      { id:'cheonghwa',   x:14, y:9 },
      { id:'cheolmyeong', x:16, y:7 },
      { id:'seokun',      x:13, y:8, level:'hero+1', friend:true },   // 합류 전 — 우군
      { id:'jinsoyeon',   x:12, y:7, level:'hero' },
      { id:'madaeho',     x:14, y:7, level:'hero-1' },
    ],
    enemies: [
      { id:'sado_gyeol', x:17, y:12, level:'hero', rank:'boss', hold:3, holdRange:3 },                              // e1 사도결 : 다리 위에서 3턴까지 지켜봄
      { id:'sapa_musa', name:'천교 무인', x:17, y:11, level:'hero-1', skills:['천교 도법'] },            // 다리로 넘어온 무리 : 바로 덤빔
      { id:'sapa_musa', name:'천교 무인', x:18, y:9, level:'hero-1', skills:['천교 도법'] },
      { id:'sapa_musa', name:'천교 무인', x:20, y:9, level:'hero-1', skills:['천교 도법'], hold:2 },
      { id:'sapa_musa', name:'천교 무인', x:19, y:9, level:'hero-1', skills:['천교 도법'], hold:2 },
      { id:'sapa_musa', name:'천교 무인', x:2,  y:8,  level:'hero-1', skills:['천교 도법'], hold:2 },   // 왼쪽 부두로 배를 대고 올라온 무리 : 2턴부터
      { id:'sapa_musa', name:'천교 무인', x:3,  y:9,  level:'hero-1', skills:['천교 도법'], hold:2 },
      { id:'sapa_musa', name:'천교 무인', x:3,  y:8,  level:'hero-1', skills:['천교 도법'], hold:2 },
      { id:'sapa_musa', name:'천교 무인', x:4,  y:9,  level:'hero-1', skills:['천교 도법'], hold:2 },
      { id:'sapa_musa', name:'천교 무인', x:10, y:11, level:'hero-1', skills:['천교 도법'] },            // 남쪽 담장 틈
      { id:'sapa_musa', name:'천교 무인', x:8,  y:10, level:'hero-1', skills:['천교 도법'] },
    ],
    intro: [
      { who:'e1',          text:'거지 소굴에 쥐새끼들까지 숨어들었구나. {천씨 놈|천씨 계집}도, 거지들도 하나도 남기지 마라!' },
      { who:'cheolmyeong', text:'저자가 구후의 오른팔이오?' },
      { who:'e1',          text:'구후 님께서 너희 목을 원하신다. 순순히 내놓으면 고통은 짧게 해 주지.' },
      { who:'jinsoyeon',   text:'남의 분타 앞마당에서 큰소리라니, 간도 크네요.' },
    ],
    events: [
      // 3턴 : 왼쪽 부두에 배가 또 닿음
      { turn:3, spawn:[ { id:'sapa_musa', name:'천교 무인', x:2, y:8,  level:'hero-1', skills:['천교 도법'] },
                        { id:'sapa_musa', name:'천교 무인', x:2, y:8, level:'hero-1', skills:['천교 도법'] },
                        { id:'sapa_musa', name:'천교 무인', x:2, y:8, level:'hero-1', skills:['천교 도법'] },
                        { id:'sapa_musa', name:'천교 무인', x:3, y:9, level:'hero-1', skills:['천교 도법'] } ] },
    ],
    victory: {
      bossDown: 'e1',
      retreat: { who:'e1', line:'크윽… 거지들이 이 정도일 줄이야. 물러난다!', all:true, msg:'남은 무리가 포구 쪽으로 달아납니다.' },
      loot: ['초급 영약', '간장'],
      gold: 900,
      suryeon: 1250,
      exp: 30,
      next: 'gaebang_after',
    },
  },

  // ---- 제2장 · 사파 연합 절강 지부 (지도 008 — 다리를 건너 지부 안마당) ----
  //   장면 gaebang_after 끝 → 출정 → 장면 sapa_branch_front (지부 앞 대화) → 바로 이 전투 → 승리 뒤 sapa_branch_after
  sapa_branch_raid: {
    name: '제2장 · 사파 연합 절강 지부',
    map: '008',
    turnLimit: 22,
    goal: '승리: 사도결 제압 · 패배: 주인공이 쓰러짐',
    loseIfDown: ['hero'],
    allies: [                                   // 남쪽 다리 위 (개방은 석운 · 진소연 둘만)
      { id:'hero',        x:10, y:11 },
      { id:'cheonghwa',   x:9,  y:11 },
      { id:'cheolmyeong', x:8,  y:11 },
      { id:'seokun',      x:11, y:11, level:'hero+1', friend:true },  // 합류 전 — 우군
      { id:'jinsoyeon',   x:9,  y:10, level:'hero' },
    ],
    enemies: [
      { id:'sado_gyeol', x:14, y:5, level:'hero', rank:'boss', hold:4, holdRange:4 },                               // e1 사도결 : 본당 계단 앞, 4턴까지 지켜봄
      { id:'sapa_musa', name:'천교 무인', x:11, y:9,  level:'hero-1', skills:['천교 도법'] },            // 다리 머리 : 바로 덤빔
      { id:'sapa_musa', name:'천교 무인', x:12, y:9,  level:'hero-1', skills:['천교 도법'] },
      { id:'sapa_musa', name:'천교 무인', x:14, y:10, level:'hero-1', skills:['천교 도법'] },
      { id:'sapa_musa', name:'천교 무인', x:10, y:7,  level:'hero-1', skills:['천교 도법'], hold:2 },   // 안마당 : 2턴부터
      { id:'sapa_musa', name:'천교 무인', x:12, y:7,  level:'hero-1', skills:['천교 도법'], hold:2 },
      { id:'sapa_musa', name:'천교 무인', x:16, y:8,  level:'hero-1', skills:['천교 도법'], hold:2 },
      { id:'sapa_musa', name:'천교 무인', x:17, y:9,  level:'hero-1', skills:['천교 도법'], hold:2 },
      { id:'sapa_musa', name:'천교 무인', x:12, y:6,  level:'hero-1', skills:['천교 도법'], hold:3 },   // 본당 앞 : 3턴부터
      { id:'sapa_musa', name:'천교 무인', x:16, y:6,  level:'hero-1', skills:['천교 도법'], hold:3 },
      { id:'cheongyo_archer', x:8,  y:5, level:'hero-1', hold:2 },                                      // 궁수 : 망루 아래
      { id:'cheongyo_archer', x:17, y:6, level:'hero-1', hold:2 },
      { id:'cheongyo_archer', x:19, y:9, level:'hero-1', hold:2 },
    ],
    intro: [],            // 지부 앞 대화(장면 sapa_branch_front)에서 바로 이어짐
    events: [
      // 2턴 : 왼쪽 부두에 배가 닿음
      { turn:2, spawn:[ { id:'sapa_musa', name:'천교 무인', x:4, y:9, level:'hero-1', skills:['천교 도법'] },
                        { id:'sapa_musa', name:'천교 무인', x:4, y:9, level:'hero-1', skills:['천교 도법'] } ] },
      // 5턴 : 다리 아래 배에서 뒤를 침
      { turn:5, spawn:[ { id:'sapa_musa', name:'천교 무인', x:5, y:10, level:'hero-1', skills:['천교 도법'] },
                        { id:'sapa_musa', name:'천교 무인', x:6, y:10, level:'hero-1', skills:['천교 도법'] } ] },
    ],
    victory: {
      bossDown: 'e1',
      retreat: { who:'e1', line:'크윽… 구후 님… 대계는… 이미 움직이기 시작했다…', all:true, msg:'남은 천교 무인들이 무기를 내던집니다.' },
      loot: ['초급 영약', '막야'],
      gold: 1000,
      suryeon: 1350,
      exp: 30,
      next: 'sapa_branch_after',
    },
  },

  // ---- 제2장 · 낭야성 저잣거리 (지도 003 양양 저잣거리를 임시로 빌려 씀) ----
  //   장면 nangya_inn (객잔) — 녹림 두목이 주인공을 알아봄 → 대화가 끝나면 바로 이 전투 → 승리 뒤 nangya_market_after
  nangya_market: {
    name: '제2장 · 저잣거리의 안민회',
    map: '003',
    turnLimit: 18,
    goal: '승리: 녹림 두목 제압 · 패배: 주인공이 쓰러짐',
    loseIfDown: ['hero'],
    allies: [                                   // 객잔 앞 거리
      { id:'hero',        x:12, y:10 },
      { id:'cheonghwa',   x:13, y:10 },
      { id:'cheolmyeong', x:12, y:9 },
      { id:'seokun',      x:13, y:9 },
    ],
    enemies: [
      { id:'nokrim_boss', x:17, y:5, level:'hero+1', rank:'mid', hold:4, holdRange:3 },                       // e1 녹림 두목 : 성문 길 안쪽, 4턴부터 (3칸 안에 들어오거나 맞으면 바로)
      { id:'nokrim', x:16, y:7, level:'hero-1' },                                                  // 성문 길 : 바로 덤빔
      { id:'nokrim', x:18, y:7, level:'hero-1' },
      { id:'nokrim', x:16, y:6, level:'hero-1' },
      { id:'nokrim', x:3,  y:10, level:'hero-1', hold:2 },                                          // 서쪽 길 : 2턴부터
      { id:'nokrim', x:4,  y:9, level:'hero-1', hold:2 },
      { id:'nokrim', x:19, y:9, level:'hero-1', hold:3 },                                         // 동쪽 · 남쪽 길 : 3턴부터
      { id:'nokrim', x:11, y:14, level:'hero-1', hold:3 },
      { id:'nokrim', x:13, y:14, level:'hero-1', hold:3 },
      { id:'nokrim_archer', x:16, y:5, level:'hero-1', hold:2 },                                   // 궁수 : 한 칸 띄운 적만
      { id:'nokrim_archer', x:8,  y:7, level:'hero-1', hold:2 },
    ],
    intro: [
      { who:'e1', text:'{천씨 놈|천씨 계집}의 목만 가져가면 된다! 나머지는 덤이다!' },
      { who:'seokun', text:'녹림 놈들이 거리 한복판에서 칼을 빼 드네. {소협|소저}, 두목부터 잡읍시다!' },
    ],
    events: [
      // 3턴 : 남쪽 골목에서 녹림도 3
      { turn:3, spawn:[ { id:'nokrim', x:9,  y:16, level:'hero-1' },
                        { id:'nokrim', x:10, y:16, level:'hero-1' },
                        { id:'nokrim', x:12, y:16, level:'hero-1' } ] },
    ],
    victory: {
      bossDown: 'e1',
      retreat: { who:'e1', line:'크윽… 그, 그만! 항복이오, 항복!', all:true, msg:'남은 녹림도들이 무기를 내던집니다.' },
      loot: ['초급 영약', '화씨벽'],
      gold: 1000,
      suryeon: 1400,
      exp: 30,
      next: 'nangya_market_after',
    },
  },

  // ---- 제3장 · 저잣거리의 마인 (지도 010 안휘성 저잣거리) — 주인공 혼자 ----
  anhui_majin: {
    name: '제3장 · 저잣거리의 마인',
    map: '010',
    turnLimit: 15,
    goal: '승리: 마인 모두 격퇴 · 패배: 주인공이 쓰러짐',
    loseIfDown: ['hero'],
    allies: [
      { id:'hero', x:13, y:9 },                  // 저잣거리 광장 한가운데 — 혼자
    ],
    enemies: [
      { id:'majin', x:16, y:8,  level:'hero-1' },                 // 바로 덤빔 넷
      { id:'majin', x:10, y:10, level:'hero-1' },
      { id:'majin', x:20, y:10, level:'hero-1' },
      { id:'majin', x:16, y:6,  level:'hero-1' },
      { id:'majin', x:5,  y:9,  level:'hero-1', hold:2 },         // 서쪽 돌다리 건너 : 2턴부터
      { id:'majin', x:5,  y:8,  level:'hero-1', hold:2 },
      { id:'majin', x:22, y:10, level:'hero-1', hold:3 },         // 동쪽 물길 · 남쪽 골목 : 3턴부터
      { id:'majin', x:21, y:11, level:'hero-1', hold:3 },
    ],
    intro: [
      { who:'e1', text:'크르르… 피… 피를…!' },
      { who:'hero', text:'기혈이 거꾸로 뒤틀려 있다… 제갈 가주님과 같은 기운이다. 한 놈도 더는 사람을 해치게 두지 않겠다!' },
    ],
    events: [
      // 4턴 : 성문 계단 아래에서 마인 셋
      { turn:4, spawn:[ { id:'majin', x:17, y:5, level:'hero-1' },
                        { id:'majin', x:18, y:5, level:'hero-1' },
                        { id:'majin', x:18, y:6, level:'hero-1' } ] },
    ],
    victory: {
      enemiesLeft: 0,
      loot: ['중급 영약', '태아검'],
      gold: 1100,
      suryeon: 1500,
      exp: 30,
      next: 'anhui_majin_after',
    },
  },

  // ---- 제2장 · 가주전의 암살자 (지도 009 제갈세가 가주 침소) — 지게 되는 전투 ----
  //   장면 jegal_house (가주전) → 대화가 끝나면 정비 없이 바로 이 전투. 주인공 혼자
  //   lossOk : 주인공이 쓰러지면 게임 오버 없이 다음 장면(victory.next). 턴이 다 되면 finisher 대사 뒤 주인공이 쓰러짐
  jegal_assassins: {
    name: '제2장 · 가주전의 암살자',
    map: '009',
    turnLimit: 4,
    goal: '홀로 암살자 셋을 상대하라',
    loseIfDown: ['hero'],
    lossOk: {
      finisher: [ { who:'e1', text:'…제법 버티는군. 허나 여기까지다.' } ],
    },
    allies: [
      { id:'hero', x:17, y:7 },                           // 침상 앞 (가주를 살피던 자리)
    ],
    enemies: [
      { id:'assassin', x:14, y:7,  level:'hero+1' },     // e1 : 왼쪽 (발코니 쪽)
      { id:'assassin', x:20, y:8,  level:'hero+1' },     //      오른쪽 (병풍 뒤)
      { id:'assassin', x:17, y:11, level:'hero+1', hold:2, holdRange:1 },   // 아래 (2턴부터)
    ],
    intro: [],
    events: [],
    victory: {
      exp: 0,
      next: 'jegal_hall_after',
    },
  },
};
