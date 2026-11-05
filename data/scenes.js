/* =====================================================================
   이야기
   ---------------------------------------------------------------------
   대사 한 줄 : { who:'guo', text:'...' }
     who  : 'hero'(주인공) 또는 data/units.js 의 인물 이름표(guo, huang, zhang ...)
            'enemy' 는 화면에 없는 사람 (name 을 같이 적기)
     text : {name} 은 주인공 이름으로 바뀜 ({name}은 · {name}이 · {name}을 · {name}과 는 받침에 맞춰 바뀜)
            {소협|소저} 처럼 쓰면 남자 주인공(천명우)일 때 앞, 여자 주인공(천명화)일 때 뒤
     (선택) textM / textF : 남자 / 여자 주인공일 때 text 대신 이 대사
     (선택) only  : 'm' 이면 남자 주인공일 때만, 'f' 면 여자 주인공일 때만 나오는 줄 (이 줄에 bg · cast 를 적지 않기)
     (선택) name  : 이름표에 보일 이름을 직접 정할 때
     (선택) bg    : 이 줄에서 배경 전환 (data/assets.js 의 bg 이름)
     (선택) cast  : 이 줄부터 화면에 서는 인물
     (선택) shake : true 면 화면이 흔들림
     (선택) join  : 이 줄에서 아군으로 합류하는 인물 (data/units.js 의 party:true 인물)
     (선택) give  : 이 줄에서 받는 물건 { item:'금창약', n:5 } → 배낭으로
   who:'narr' 은 서술(나레이션) — 이름표 없이 글만 나옴
   ===================================================================== */

// 오프닝 — '이야기를 시작하기' 를 누르면 영상이 나오고, 끝나면(또는 건너뛰기) 캐릭터 선택
//   video : 오프닝 영상 — data/assets.js 의 video 이름 (mp4 · 16:9 — 화면 비율이 달라도 자막이 잘리지 않게 전체를 보여 줌, 남는 곳은 검게)
//   still : 캐릭터 선택 화면 뒤에 깔릴 그림 (data/assets.js 의 bg 이름 — 영상 끝 장면)
//   video 를 '' 로 비우면 영상 없이 바로 캐릭터 선택
const OPENING = { video:'video.opening', still:'opening_end' };

// 캐릭터 생성 뒤 첫 장면
const FIRST_SCENE = 'prologue';

// 장면
//   bg / cast : 시작 배경과 인물      script : 대사
//   end       : 대사가 끝난 뒤 배경과 인물 (초상화를 눌러 말을 거는 화면)
//   npcs      : 대사가 끝난 뒤 서 있는 인물 { id, x, y(배경 기준 %), line }
//               give:{ item:'금창약', n:3 } (또는 gold) 를 적으면 처음 말을 걸 때 한 번만 줌, after = 받은 뒤의 대사
//   sortie    : '출정' 을 누르면 시작할 전투 (data/battles.js), 없으면 null
//   sortieScene : (선택) '출정' 을 누르면 전투 전에 먼저 보여 줄 장면 (그 장면에 fight 를 적어 두면 대화 뒤 바로 전투)
//   fight     : (선택) 대사가 끝나면 끝 화면 없이 바로 시작할 전투
//   next      : 대사가 끝나면 전투 없이 바로 이어질 장면 (이때 end / npcs / sortie 는 쓰지 않음)
//   unlock    : 이 장면을 마치면 열리는 것 — 'hub' = 거점 버튼
//   title     : 장(chapter)이 바뀔 때 검은 화면에 장 제목과 함께 보일 글
const SCENES = {
  // ================= 서장 =================
  // 무한성 저잣거리 : 사파에게 쫓겨 다니던 주인공이 곽정 · 황용을 만남 (이름 · 천씨라는 건 아직 숨김) → 서장 전투
  prologue: {
    chapter:'서장', place:'무한성 저잣거리',
    bg:'story_inn', cast:['hero','guo','huang'],
    script: [
      { who:'huang', text:'정 오라버니, 저기 좀 봐요. 누가 쫓기듯 뛰어오는데요?' },
      { who:'hero',  shake:true, text:'헉… 헉… 길을 좀 비켜 주시오! 사파 놈들이 뒤를 쫓고 있소!' },
      { who:'guo',   text:'진정하시오. 다친 데는 없소? 나는 곽정이라 하오.' },
      { who:'huang', text:'저는 황용이에요. 사파가 대낮에 사람을 쫓다니… 대체 무슨 일이에요?' },
      { who:'hero',  text:'…사정이 있어 놈들에게 쫓겨 다니는 몸입니다. 무당파를 찾아가던 길에, 무한성 앞에서 또 놈들과 마주쳤습니다.' },
      { who:'hero',  text:'두 분까지 휘말리게 할 수는 없습니다. 어서 길을 비켜 주십시오.' },
      { who:'guo',   text:'쫓기는 사람을 두고 길을 비킬 수는 없소. 사정은 놈들을 물린 뒤에 들어도 늦지 않소.' },
      { who:'huang', text:'사파가 무한성까지 내려왔다니… 소문보다 일이 훨씬 커요, 오라버니.' },
      { who:'guo',   text:'{소협은|소저는} 내 뒤에 서시오.' },
      { who:'hero',  text:'아닙니다. 쫓겨 온 것도 제 일이니, 저도 함께 싸우겠습니다.' },
      { who:'huang', text:'호호, 기개는 좋네요. 대신 무리하지 말아요. 놈들이 오고 있어요!' },
    ],
    end: { bg:'story_inn', cast:['hero','guo','huang'] },
    npcs: [
      { id:'guo',   x:53, y:71, line:'사파가 한데 뭉친다는 소문을 듣고 살피러 나왔는데, 생각보다 일이 크구려.' },
      { id:'huang', x:63, y:71, line:'개방 제자들 말로는 강남 곳곳이 이런 형편이래요. 자, 금창약 세 개 받아 둬요. 맨몸으로 싸우다 다치면 큰일이니까.',
        give:{ item:'금창약', n:3 }, after:'일단 눈앞의 놈들부터 정리해요. 다치면 아까 준 금창약 아끼지 말고 써요.' },
    ],
    sortie: 'prologue',
  },

  // 무당산 오르는 길 (곽정 · 황용이 주인공이 천씨세가 사람임을 알고 놀람) → 무당파 산문 (장삼봉) → 사파 습격 · 청화 합류 → 무당파 산문 방어
  wudang: {
    chapter:'서장', place:'무당산 무당파',
    bg:'wudang_path', cast:['hero','guo','huang'],
    script: [
      { who:'guo',   text:'이제 사정을 들어도 되겠소? 아까 도망치던 놈이 {소협을|소저를} \'천씨\'라 부르던데.' },
      { who:'hero',  text:'…두 분께는 더 숨길 수 없겠군요. 저는 양양 천씨세가의 {name}이라 합니다.' },
      { who:'guo',   shake:true, text:'천씨세가라니…! 양양의 그 천씨세가 말이오?' },
      { who:'huang', text:'십 년 전 양양이 짓밟힐 때 함께 멸문했다던… 살아남은 분이 계셨군요.' },
      { who:'hero',  text:'몽골군이 양양을 덮쳤을 때 가문이 무너졌습니다. {누이 명화|오라버니 명우}도 그날… 가전 무공을 이은 사람은 이제 저 하나뿐입니다.' },
      { who:'hero',  text:'그런데 몇 해 전부터 사파가 천씨의 남은 핏줄을 찾아다니며 죽이고 있습니다. 그 뒤로는 이곳저곳을 떠돌며 숨어 지냈습니다.' },
      { who:'huang', text:'멸문한 세가의 생존자를 이제 와서 쫓는다고요? 사파가 대체 무엇 때문에…' },
      { who:'hero',  textM:'저도 모릅니다. 하지만 언젠가 반드시 알아내고 말 겁니다.',
                     textF:'저도 모릅니다. 지금은… 살아남는 것밖에 할 수 있는 게 없었습니다.' },
      { who:'hero',  text:'선친께서 생전에 장진인과 연이 있으셨습니다. 어려울 때 꼭 찾아뵈라 하셔서 무당으로 가던 길이었습니다.' },
      { who:'guo',   text:'그랬구려. 우리도 사파의 일로 장진인을 뵈러 가던 참이오. 우리가 곁에 있는 동안은 놈들도 함부로 덤비지 못할 거요. 함께 서두릅시다.' },
      // ---- 무당파 산문 ----
      { bg:'wudang_gate', cast:['hero','zhang','guo','huang'],
        who:'zhang', text:'허허, 곽 대협과 황 방주가 아니신가. 먼 길 오셨구려.' },
      { who:'guo',   text:'진인, 그간 강녕하셨습니까. 오는 길에 사파에게 쫓기던 {소협을|소저를} 만나 함께 왔습니다.' },
      { who:'hero',  text:'천씨세가의 {name}, 진인을 뵙습니다.' },
      { who:'zhang', text:'천씨라… 자네 부친의 검을 기억하네. 양양의 비보에 마음이 무거웠는데, 이리 살아 있었구먼.' },
      { who:'guo',   text:'진인, 놈들은 천씨의 생존자를 찾아 죽이려 하고 있었습니다.' },
      { who:'zhang', text:'멸문한 가문의 핏줄까지… 무슨 원한이 그리 깊을꼬.' },
      { who:'huang', text:'진인, 강남의 사파들이 한데 뭉치고 있어요. 저희도 오는 길에 그 무리와 부딪혔고요.' },
      { who:'zhang', text:'이 늙은이도 그 기척을 느끼고 있었네. 아무래도 놈들의 눈이 이 산을 향하고 있는 듯하이.' },
      { who:'enemy', name:'사파 무사', shake:true, text:'무당의 늙은이는 나와라! 오늘 이 산문을 피로 물들여 주마!' },
      { who:'guo',   text:'벌써 여기까지 쫓아왔단 말인가!' },
      { who:'zhang', text:'산문 앞에서 소란이라… 무당의 손님을 건드린 대가를 치르게 해 주지.' },
      // ---- 청화 등장 ----
      { cast:['hero','zhang','guo','huang','cheonghwa'], join:'cheonghwa',
        who:'cheonghwa', text:'사조님, 큰일입니다! 경내에 자객들이 숨어들었습니다!' },
      { who:'zhang',     text:'청화야, 진정하고 말해 보거라.' },
      { who:'cheonghwa', text:'장로님들께서 막고 계시지만 자객들의 솜씨가 예사롭지 않습니다. 원군이 필요합니다.' },
      { who:'guo',       text:'안팎으로 한꺼번에 치고 들어왔군. 진인, 안의 자객은 저희가 맡겠습니다.' },
      { who:'huang',     text:'산문 밖은 수만 많지 대부분 졸개예요. 청화 도장과 {name} {소협이라면|소저라면} 버틸 수 있을 거예요.' },
      { who:'zhang',     text:'좋네. 청화, 산문은 네게 맡기마. {name} {소협과|소저와} 함께 지키고 있거라. 이 늙은이도 안을 수습하는 대로 나오겠네.' },
      { who:'cheonghwa', text:'명을 받들겠습니다, 사조님.' },
      { who:'huang', give:{ item:'금창약', n:5 },
        text:'잠깐만요. 오는 길에 챙긴 금창약 다섯 개예요. 다치면 아끼지 말고 써요.' },
      { who:'hero',      text:'고맙습니다, 황 방주님. 요긴하게 쓰겠습니다.' },
      { cast:['hero','cheonghwa'],
        who:'cheonghwa', text:'{name} {소협|소저}, 무당의 일에 휘말리게 해 드려 송구합니다.' },
      { who:'hero',      text:'선친과 연이 닿은 곳의 일입니다. 산문은 함께 지키지요, 청화 도장.' },
    ],
    end: { bg:'wudang_gate', cast:['hero','cheonghwa'] },
    npcs: [
      { id:'cheonghwa', x:53, y:62, give:{ item:'무당 호신부' },
        line:'사조님께서 손수 그려 주신 호신부입니다. 산문을 지키는 동안 몸에 지니십시오.',
        after:'사파 무리가 산문 계단 아래까지 올라왔습니다. 채비가 되면 출발하시지요.' },
    ],
    sortie: 'wudang_defense',
  },

  // 무당파 방어전이 끝난 뒤 → 전각 안에서 대책 논의 → 곽정 · 황용 · 장삼봉과 헤어짐 → 제1장 양양으로
  wudang_after: {
    chapter:'서장', place:'무당파 전각',
    bg:'wudang_gate', cast:['hero','zhang','guo','huang','cheonghwa'],
    script: [
      { who:'guo',       text:'산문을 지켜 냈구려. 두 사람 모두 수고 많았소.' },
      { who:'huang',     text:'자객과 산문 공격이 한꺼번에 들이닥쳤어요. 처음부터 짜고 온 거예요.' },
      { who:'zhang',     text:'사파가 이토록 손발을 맞추다니… 누군가 뒤에서 판을 짜고 있는 게야.' },
      { who:'zhang',     text:'바람이 차구먼. 서서 나눌 이야기가 아닌 듯하니, 모두 안으로 들게.' },
      // ---- 무당파 전각 안 ----
      { bg:'wudang_hall',
        who:'narr',      text:'일행은 장삼봉을 따라 전각 안으로 들어섰다. 처마 너머로 눈 덮인 봉우리가 내려다보였다.' },
      { who:'cheonghwa', text:'사조님, 붙잡은 자객들의 옷깃 안쪽에 모두 같은 문양이 수놓아져 있었습니다. 처음 보는 문양입니다.' },
      { who:'zhang',     text:'흩어져 있던 사파가 한 깃발 아래 모이고 있다는 뜻이겠지.' },
      { who:'huang',     text:'개방 쪽 소식도 같아요. 강남 곳곳에서 사파 문파들이 사람을 모으고 있대요.' },
      { who:'guo',       text:'한 문파씩 따로 막아서는 당해 낼 수 없소. 정파도 힘을 모아야 하오.' },
      { who:'zhang',     text:'옳은 말이네. 구파일방과 오대세가에 기별을 넣어 한자리에 모이도록 하지.' },
      { who:'huang',     text:'모일 곳은 남궁세가가 좋겠어요. 안휘의 남궁세가라면 어느 문파든 오가기 편하니까요.' },
      { who:'zhang',     text:'좋네. 석 달 뒤, 남궁세가에서 만나세. 그때까지 각자 사파의 움직임을 살펴 두게.' },
      { who:'guo',       text:'저는 용아와 함께 개방 형제들을 모아 길목을 살피겠소.' },
      { who:'guo', give:{ gold:500, item:'금창약', n:7 },
        text:'{name} {소협|소저}, 금 오백과 금창약 일곱 개요. 얼마 안 되지만 이걸로 채비해서, 석 달 뒤 남궁세가에서 봅시다.' },
      { who:'hero',      text:'이렇게까지 챙겨 주시다니… 감사히 받겠습니다.' },
      { who:'huang',     text:'{name} {소협|소저}, 몸조심해요. 다음에 볼 때는 더 강해져 있길 바랄게요.' },
      { who:'hero',      text:'두 분도 부디 무탈하십시오. 석 달 뒤 남궁세가에서 뵙겠습니다.' },
      { cast:['hero','zhang','cheonghwa'],
        who:'narr',      text:'곽정과 황용은 그날로 무당산을 내려갔다.' },
      { who:'zhang',     text:'{name} {소협은|소저는} 이제 어디로 갈 셈인가?' },
      { who:'hero',      text:'고향인 양양으로 먼저 가 보려 합니다. 사파가 강남을 휘젓고 있다면 양양도 무사하지는 않을 테니까요.' },
      { who:'zhang',     text:'그렇다면 청화를 데려가게. 산 밖의 강호를 제 눈으로 보고 배우는 것도 수련이지.' },
      { who:'cheonghwa', text:'사조님…! 정말 산을 내려가도 되겠습니까?' },
      { who:'zhang',     text:'허허, 대사형이 산문만 지켜서야 쓰겠느냐. {name} {소협을|소저를} 잘 돕고, 석 달 뒤 남궁세가에서 다시 보자꾸나.' },
      { who:'cheonghwa', text:'명을 받들겠습니다. {name} {소협|소저}, 앞으로 잘 부탁드립니다.' },
      { who:'hero',      text:'제가 더 잘 부탁드립니다, 청화 도장.' },
    ],
    next: 'yangyang',
  },

  // ================= 제1장 · 양양 =================
  // 양양 도착 → 천씨 장원 (지금의 거처) → 저잣거리 조사 → 양양 문파와 시비 → 거점 열림
  //   ※ '철검문' 은 임시 이름 — 고치려면 data/units.js 의 철검문 이름과 대사 속 '철검문' 을 바꾸기
  yangyang: {
    chapter:'제1장', title:'양양', place:'양양',
    bg:'yangyang_road', cast:['hero','cheonghwa'],
    script: [
      { who:'narr',      text:'무당산을 내려온 두 사람은 열흘 남짓 길을 재촉해 양양에 닿았다.' },
      // ---- 천씨 장원 ----
      { bg:'yangyang_manor',
        who:'hero',      text:'몇 해 만에 돌아왔습니다. 여기가 제 고향, 천씨세가의 장원입니다.' },
      { who:'cheonghwa', text:'생각보다 큰 장원이군요. 성벽 바로 안쪽이라 강까지 훤히 내려다보입니다.' },
      { who:'hero',      text:'제가 놈들을 피해 떠도는 동안, 남은 식솔들이 성주님의 도움을 받아 지켜 온 곳입니다. 예전의 천씨세가에 비하면 초라하지요.' },
      { who:'cheonghwa', text:'초라하다니요. 이만한 터를 지켜 내신 분들이 대단하십니다.' },
      { who:'hero',      text:'이제는 청화 도장도 곁에 계시니, 더는 숨어 지내지 않겠습니다.' },
      { who:'hero',      text:'이곳을 발판 삼아 움직이려 합니다. 먼저 사파의 규합이 양양까지 뻗쳤는지 알아봐야겠습니다.' },
      { who:'cheonghwa', text:'좋습니다. 사람이 모이는 저잣거리부터 살펴보시지요. 소문은 늘 그곳에서 먼저 돕니다.' },
      // ---- 양양 저잣거리 ----
      { bg:'yangyang_market',
        who:'narr',      text:'두 사람은 장원을 나서 양양 저잣거리로 향했다.' },
      { who:'hero',      text:'요즘 들어 낯선 무인들이 부쩍 늘었다는군요. 객잔마다 칼 찬 사람들로 가득하답니다.' },
      { who:'cheonghwa', text:'사파의 무리라면 저렇게 드러내 놓고 다니지는 않을 텐데요…' },
      // ---- 철검문 등장 (왼쪽 카드 = 철검문, 오른쪽 = 일행) ----
      { cast:['cheolgeom','hero','cheonghwa'],
        who:'cheolgeom', shake:true, text:'어이, 거기! 방금 우리 문파 얘기를 하던 게 너희냐?' },
      { who:'hero',      text:'그런 적 없소. 길을 묻고 있었을 뿐이오.' },
      { who:'cheolgeom', text:'도복을 보니 무당파 애송이로군. 양양은 우리 철검문의 땅이다. 남의 땅에서 기웃거리지 말고 썩 꺼져라!' },
      { who:'cheonghwa', text:'말씀이 지나치십니다. 저희는 시비를 걸 생각이 없습니다.' },
      { cast:['cheolgeom_sahyeong','hero','cheonghwa'],
        who:'cheolgeom_sahyeong', shake:true, text:'시비는 이미 붙었다. 칼을 뽑아라! 양양에서 누가 주인인지 똑똑히 알려 주마!' },
      { who:'hero',      text:'…피할 수는 없겠군요. 청화 도장, 채비하시지요.' },
    ],
    end: { bg:'yangyang_market', cast:['hero','cheonghwa'] },
    npcs: [
      { id:'cheonghwa', x:70, y:64, line:'철검문… 양양 토박이 문파인 듯합니다. 거점에서 채비를 단단히 하고 나서지요.' },
    ],
    unlock: 'hub',   // 이 장면을 마치면 거점 버튼이 열림 (훈련장 · 잡화점 · 대장간)
    sortie: 'cheolgeom',   // 양양 저잣거리 — 철검문과의 시비
  },

  // 철검문 전투 뒤 → 취현객잔에서 통성명 : 사냥꾼 = 화원파 문주 위지렴 → 위지렴 합류
  yangyang_after: {
    chapter:'제1장', place:'양양 취현객잔',
    bg:'yangyang_inn', cast:['hunter','hero','cheonghwa'],
    script: [
      { who:'narr',      text:'세 사람은 소란을 뒤로하고 저잣거리 끝의 취현객잔으로 자리를 옮겼다.' },
      { who:'hunter',    text:'철검문 녀석들, 원래부터 저렇게 막돼먹진 않았소. 요 몇 해 사이에 딴 문파가 된 것처럼 굴더군.' },
      { who:'cheonghwa', text:'몇 해 사이라면… 사파가 뭉치기 시작한 무렵과 겹칩니다.' },
      { who:'hero',      text:'양양에서도 무언가 일이 벌어지고 있다는 뜻이겠군요.' },
      { who:'hunter',    text:'보아하니 두 사람, 그 일을 캐러 온 모양이구려. 이야기가 길어질 듯하니 우선 통성명부터 합시다.' },
      // ---- 통성명 : 이름표가 '사냥꾼' → '위지렴' ----
      { cast:['cheolmyeong','hero','cheonghwa'],
        who:'cheolmyeong', text:'나는 위지렴이라 하오. 아까 놈들이 떠든 대로… 한때는 화원파의 문주였소.' },
      { who:'cheonghwa',   text:'화원파라면… 화산파의 속가 문파가 아닙니까?' },
      { who:'cheolmyeong', text:'잘 아는구려. 화산의 무공을 이어받은 작은 문파였소. 철검문에 멸문당하기 전까지는.' },
      { who:'hero',        text:'멸문이라니…!' },
      { who:'cheolmyeong', text:'근래 사파가 한데 뭉친다는 소문은 들었을 거요. 그 틈을 타 철검문이 세를 불리더니, 기어이 사파 연합의 간부 자리를 꿰찼소.' },
      { who:'cheolmyeong', text:'그 뒤로는 거칠 것이 없었지. 이 근방 정파의 군소 문파들을 하나씩 무자비하게 짓밟아 멸문시켰소.' },
      { who:'cheolmyeong', text:'화원파도 그중 하나였소. 사제들은 모두 쓰러지고… 살아남은 건 나 하나뿐이오.' },
      { who:'cheonghwa',   text:'…그런 일이 있었군요.' },
      { who:'hero',        text:'제 이름은 {name}, 양양 천씨세가의 후인입니다. 저희 가문도 한 번 무너진 적이 있어, 그 심정을 조금은 압니다.' },
      { who:'cheonghwa',   text:'무당파의 청화라 합니다. 사조님의 허락을 받아 {name} {소협과|소저와} 함께 사파의 움직임을 살피고 있습니다.' },
      { who:'hero',        text:'철검문이 사파 연합의 간부라면, 놈들을 파고들 때 사파 규합의 실마리가 잡힐 겁니다. 저희는 철검문을 조사할 생각입니다.' },
      { who:'cheolmyeong', text:'철검문을 조사한다고…?' },
      { who:'cheolmyeong', text:'그렇다면 나도 함께 가겠소. 혼자서는 놈들의 산문 앞에도 가 보지 못했지만, 셋이라면 이야기가 다르지.' },
      { who:'hero', join:'cheolmyeong',
                           text:'든든합니다. 잘 부탁드립니다, 위지 문주님.' },
      { who:'cheolmyeong', text:'문주라니, 이제 지킬 문파도 없는 몸이오. 그냥 위지렴이라 부르시오. 화원파의 원한, 이번에야말로 풀어야겠소.' },
    ],
    next: 'yangyang_trail',
  },

  // 저잣거리 → 철검문 대사형을 따라 관아로 (엿듣기) → 철검문 산문 → 장원으로 돌아와 의논 → 위지렴은 산으로
  yangyang_trail: {
    chapter:'제1장', place:'양양 관아',
    bg:'yangyang_market', cast:['hero','cheonghwa','cheolmyeong'],
    script: [
      { who:'narr',        text:'객잔을 나선 세 사람은 다시 저잣거리로 향했다.' },
      { who:'hero',        text:'그럼 우선 철검문부터 조사해 봅시다. 놈들이 양양에서 무슨 짓을 하고 다니는지부터 알아야겠습니다.' },
      { who:'cheolmyeong', text:'철검문 놈들은 저잣거리 상인들에게서 자릿세를 뜯소. 상인들 입만 열게 하면 뭐라도 나올 거요.' },
      { who:'cheonghwa',   text:'잠깐만요. 저기 저 사람… 아까 그 철검문 대사형 아닙니까?' },
      { who:'hero',        text:'혼자서 어딘가로 바삐 가는군요. 저쪽은… 관아 방향인데.' },
      { who:'cheolmyeong', text:'냄새가 나는군. 들키지 않게 뒤를 밟아 봅시다.' },
      // ---- 관아 : 담장 그늘에서 엿듣기 ----
      { bg:'yangyang_office', cast:['yangyang_official','cheolgeom_sahyeong'],
        who:'narr',        text:'대사형은 거리낌 없이 관아 앞마당으로 들어섰다. 세 사람은 담장 그늘에 몸을 숨기고 귀를 기울였다.' },
      { who:'yangyang_official',   text:'오, 철검문의 대사형 아닌가. 이 시각에 웬일인가?' },
      { who:'cheolgeom_sahyeong',  text:'나리, 이번 달 몫입니다. 문주께서 각별히 안부를 여쭈라 하셨습니다.' },
      { who:'yangyang_official',   text:'허허, 철검문은 늘 셈이 정확해서 좋단 말이야.' },
      { who:'cheolgeom_sahyeong',  text:'그리고… 아까 저잣거리에서 소란이 좀 있었습니다. 그 일도 잘 좀 부탁드립니다.' },
      { who:'yangyang_official',   text:'걱정 말게. 그런 소란은 처음부터 없었던 걸로 하지.' },
      { who:'cheolgeom_sahyeong',  text:'역시 나리십니다. 그럼 소인은 이만.' },
      { cast:['hero','cheonghwa','cheolmyeong'],
        who:'narr',        text:'대사형은 관원에게 허리를 깊이 숙이고는 관아를 빠져나갔다.' },
      { who:'hero',        text:'…관아와 손을 잡고 있었군요. 관의 비호를 등에 업고 세를 불린 겁니다.' },
      { who:'cheonghwa',   text:'그래서 군소 문파들이 짓밟혀도 누구 하나 나서지 못했던 거군요.' },
      { who:'cheolmyeong', text:'화원파가 무너지던 날에도 관아는 끝내 움직이지 않았소. 이제야 그 까닭을 알겠구려.' },
      { who:'hero',        text:'철검문의 본거지도 봐 둬야겠습니다. 가 봅시다.' },
      // ---- 철검문 산문 ----
      { bg:'cheolgeom_gate',
        who:'narr',        text:'양양성 밖 북쪽 산자락. 눈 덮인 봉우리를 등지고 철검문의 산문이 버티고 서 있었다.' },
      { who:'cheonghwa',   text:'이게… 양양의 일개 문파라고요? 웬만한 대문파 못지않은 규모입니다.' },
      { who:'cheolmyeong', text:'불과 몇 해 전만 해도 이 절반도 되지 않았소. 짓밟은 문파들의 땅과 재물을 삼켜 이만큼 불어난 거요.' },
      { who:'hero',        text:'산문을 지키는 문도만 해도 저만큼이니, 안에는 훨씬 많겠군요. 지금 셋이서 들이쳤다가는 개죽음입니다.' },
      { who:'hero',        text:'일단 돌아가서 대책을 세웁시다.' },
      // ---- 천씨 장원 (거점) ----
      { bg:'yangyang_manor',
        who:'narr',        text:'장원으로 돌아온 세 사람은 밤이 깊도록 머리를 맞댔다.' },
      { who:'hero',        text:'철검문과 관아, 그리고 사파 연합… 모두 한 줄로 엮여 있는 게 분명합니다.' },
      { who:'cheonghwa',   text:'관아가 뒤를 봐주는 이상, 섣불리 칼을 뽑았다가는 우리가 먼저 죄인이 되겠군요.' },
      { who:'cheolmyeong', text:'그렇다면 누구도 덮을 수 없는 증좌가 필요하겠소.' },
      { who:'cheolmyeong', text:'나는 산속 거처에 가서 짐을 정리해 내려오겠소. 활과 화살도 넉넉히 챙겨 와야겠고.' },
      { who:'hero',        text:'알겠습니다. 저희는 내일도 저잣거리에서 탐문을 이어 가겠습니다.' },
      { who:'cheolmyeong', text:'몸조심하시오. 철검문 놈들은 받은 건 반드시 되갚는 족속이오.' },
    ],
    next: 'yangyang_ambush',
  },

  // 다음 날 저잣거리 탐문 → 철검문 8명이 어제 일을 갚으러 옴 (위지렴은 산에 가 있음)
  yangyang_ambush: {
    chapter:'제1장', place:'양양 저잣거리',
    bg:'yangyang_market', cast:['hero','cheonghwa'],
    script: [
      { who:'narr',      text:'다음 날. 두 사람은 다시 저잣거리로 나가 탐문을 이어 갔다.' },
      { who:'hero',      text:'상인들이 하나같이 입을 다무는군요. 철검문 이야기만 꺼내면 고개를 돌립니다.' },
      { who:'cheonghwa', text:'관아까지 한편이니 겁이 날 만도 하지요…' },
      { who:'npc', name:'상인', shake:true,
                         text:'이, 이보시오! 어서 피하시오! 철검문 사람들이 여덟이나 몰려와서 어제 소란을 피운 사람들을 찾고 있소!' },
      { cast:['cheolgeom_sahyeong','hero','cheonghwa'],
        who:'cheolgeom_sahyeong', shake:true, text:'찾았다! 어제 우리 철검문을 욕보인 놈들이 너희렷다!' },
      { who:'cheolgeom_sahyeong', text:'어제의 빚은 오늘 몇 곱절로 갚아 주마. 이번엔 여덟이다. 어디 한번 버텨 봐라!' },
      { who:'cheonghwa', text:'여덟 명… 위지 대협도 없는데요.' },
      { who:'hero',      text:'물러설 곳은 없습니다. 위지 대협이 돌아올 때까지 버텨 봅시다!' },
    ],
    end: { bg:'yangyang_market', cast:['hero','cheonghwa'] },
    npcs: [
      { id:'cheonghwa', x:70, y:64, line:'수가 많습니다. 거점에서 채비를 단단히 하고 나서지요. 위지 대협의 수련도 미리 해 두면 좋겠습니다.' },
    ],
    sortie: 'cheolgeom_revenge',   // 양양 저잣거리 — 철검문의 보복
  },

  // 철검문의 보복을 물리친 뒤 — 집무실 임무 '철검문의 사정' 결과로 갈림
  //   임무 완료 (전투 중 대사형과 대화함) → yangyang_revenge_talked (저잣거리)
  //   못 함                              → yangyang_revenge_after  (객잔 : 위지렴에게 철검문이 커진 배경을 들음)
  //   둘 다 → cheolgeom_visit (철검문으로)
  yangyang_revenge_talked: {
    chapter:'제1장', place:'양양 저잣거리',
    bg:'yangyang_market', cast:['hero','cheonghwa','cheolmyeong'],
    script: [
      { who:'narr',        text:'철검문 문도들은 쓰러진 동료들을 들쳐 업고 허둥지둥 저잣거리를 빠져나갔다.' },
      { who:'hero',        text:'싸우는 중에 그 대사형과 이야기를 나눴습니다. 철검문이 왜 저렇게 변했는지, 이제 알 것 같습니다.' },
      { who:'cheonghwa',   text:'무슨 이야기를 들으셨습니까?' },
      { who:'hero',        text:'사파 연합이 문도들의 가족을 볼모로 잡고, 철검문주를 억지로 끌어들였다고 합니다.' },
      { who:'cheolmyeong', text:'…그랬단 말이오? 화원파를 짓밟은 칼끝 뒤에도 결국 연합이 있었던 거로군.' },
      { who:'cheonghwa',   text:'그렇다면 철검문도 연합에 짓밟힌 쪽인 셈이군요.' },
      { who:'hero',        text:'그 대사형과 다시 이야기해 보고 싶습니다. 칼을 섞을 일만 있는 게 아닐지도 모릅니다.' },
      { who:'cheolmyeong', text:'…좋소. 원한은 원한이지만, 진짜 원수는 따로 있는 듯하니. 철검문으로 갑시다.' },
    ],
    next: 'cheolgeom_visit',
  },
  yangyang_revenge_after: {
    chapter:'제1장', place:'양양 취현객잔',
    bg:'yangyang_inn', cast:['cheolmyeong','hero','cheonghwa'],
    script: [
      { who:'narr',        text:'철검문 문도들이 물러간 뒤, 세 사람은 취현객잔으로 자리를 옮겼다.' },
      { who:'cheonghwa',   text:'철검문이 어떻게 그리 짧은 사이에 세를 불렸는지, 아무래도 이상합니다.' },
      { who:'hero',        text:'위지 대협, 철검문에 대해 더 아시는 게 있습니까?' },
      { who:'cheolmyeong', text:'…몇 해 전까지만 해도 철검문은 양양 사람들을 지키던 문파였소. 문주도 의리 있는 사람이라 이름이 높았지.' },
      { who:'cheolmyeong', text:'그런데 사파 연합의 사자가 다녀간 뒤로 모든 게 달라졌소. 문도들 집안에 흉사가 잇따르더니, 문주가 갑자기 연합의 손을 잡았지.' },
      { who:'cheolmyeong', text:'그 뒤로 연합에서 돈과 무기가 흘러들었고, 관아까지 매수해 이 근방 군소 문파를 하나씩 삼켰소. 그렇게 비정상적으로 커진 거요.' },
      { who:'hero',        text:'문주가 갑자기 변했다… 무언가 사정이 있었던 건 아닐까요.' },
      { who:'cheonghwa',   text:'오늘 무리를 이끌던 그 대사형이라면 알고 있을지도 모르겠습니다.' },
      { who:'hero',        text:'철검문으로 가서 그 대사형을 찾아봅시다. 싸우러 가는 게 아니라, 이야기를 하러요.' },
      { who:'cheolmyeong', text:'…좋소. 대신 놈들이 먼저 칼을 뽑으면 나도 가만있지 않겠소.' },
    ],
    next: 'cheolgeom_visit',
  },

  // 철검문 방문 : 산문 (대사형) → 안마당 → 철검문 전경 → 문주전 (문주의 고백) → 연합 간부가 찾아옴
  cheolgeom_visit: {
    chapter:'제1장', place:'철검문',
    bg:'cheolgeom_gate', cast:['hero','cheonghwa','cheolmyeong'],
    script: [
      { who:'narr',        text:'이튿날, 세 사람은 다시 철검문의 산문 앞에 섰다.' },
      { cast:['cheolgeom_sahyeong','hero','cheonghwa','cheolmyeong'],
        who:'cheolgeom_sahyeong', shake:true, text:'너희는…! 어제 그놈들이 여기까지 무슨 일이냐!' },
      { who:'hero',        text:'싸우러 온 게 아닙니다. 오해를 풀고 싶어 찾아왔습니다.' },
      { who:'hero',        text:'저는 양양 천씨세가에서 왔습니다. 이름은 {name}입니다.' },
      { who:'cheolgeom_sahyeong', text:'천씨…? 방금 천씨세가라고 했소?' },
      { who:'cheolgeom_sahyeong', text:'…잠시, 잠시 여기서 기다리시오!' },
      { cast:['hero','cheonghwa','cheolmyeong'],
        who:'narr',        text:'대사형은 황급히 산문 안으로 사라졌다. 한참이 지나서야 그가 다시 모습을 드러냈다.' },
      { cast:['cheolgeom_sahyeong','hero','cheonghwa','cheolmyeong'],
        who:'cheolgeom_sahyeong', text:'문주님께서 들어오라 허락하셨소. 따라오시오.' },
      // ---- 안마당 ----
      { bg:'cheolgeom_court',
        who:'narr',        text:'대사형을 따라 산문을 지나자 넓은 안마당이 펼쳐졌다.' },
      { who:'cheolgeom_sahyeong', text:'다 망해 버린 세가에 후인이 살아 있다는 말은 처음 듣소.' },
      { who:'cheolgeom_sahyeong', text:'예전 천씨세가는 우리 철검문과 우호를 맺은 문파였지. 문주님께서도 늘 천씨를 존중하셨소.' },
      { who:'cheolgeom_sahyeong', text:'어제 우리가 그렇게 당한 것도 이제야 이해가 되는군. 천씨의 검이었으니.' },
      { who:'cheolgeom_sahyeong', text:'…다 왔소.' },
      // ---- 철검문 전경 ----
      { bg:'cheolgeom_overview',
        who:'cheolgeom_sahyeong', text:'저 다리를 건너면 문주전이오.' },
      { who:'cheonghwa',   text:'바깥에서 본 것보다 훨씬 넓군요… 이 정도면 웬만한 대문파 못지않습니다.' },
      { who:'cheolmyeong', text:'연무장에 무기고, 전망대까지… 이 많은 걸 몇 해 만에 갖췄단 말이오?' },
      { who:'hero',        text:'……이게 양양의 한 문파라니.' },
      { who:'narr',        text:'세 사람은 철검문의 세에 한동안 말을 잇지 못했다.' },
      // ---- 문주전 ----
      { bg:'cheolgeom_hall', cast:['cheolgeom_munju','hero','cheonghwa','cheolmyeong'],
        who:'narr',        text:'문주전 안. 거대한 검이 새겨진 벽 앞에 철검문주가 서 있었다.' },
      { who:'cheolgeom_munju', text:'천씨세가의 후인이라… 그 얼굴을 보니 정말이구려. 선대 천 가주의 눈매를 꼭 닮았소.' },
      { who:'hero',        text:'천씨세가의 {name}, 문주님을 뵙습니다.' },
      { who:'cheolgeom_munju', text:'나는 천씨세가에 큰 은혜를 입은 사람이오. 젊은 시절 목숨을 건진 것도, 이 철검문을 세울 수 있었던 것도 선대 가주 덕분이었지.' },
      { who:'cheolgeom_munju', text:'그런 은인의 후인에게 우리 문도들이 칼을 들이댔다니… 면목이 없소. 어제의 소란은 이 철검문주가 사죄하리다.' },
      { who:'hero',        text:'고개를 드십시오. 저희도 철검문에 무슨 사정이 있는지 알고 싶어 찾아왔습니다.' },
      { who:'cheolgeom_munju', text:'…그대에게라면 털어놓아도 되겠지.' },
      { who:'cheolgeom_munju', text:'몇 해 전, 사파 연합이 찾아와 손을 잡자 하더군. 거절했더니 문도들의 가족이 하나둘 사라졌소.' },
      { who:'cheolgeom_munju', text:'연합의 손을 잡고 나서야 가족들이 돌아왔지. …내 부친만 빼고. 놈들은 본보기라며 부친을 해쳤소.' },
      { who:'cheolgeom_munju', text:'그 뒤로는 시키는 대로… 관아에 돈을 바치고, 이웃 문파를 짓밟았소. 남은 문도들의 가족까지 잃을 수는 없었으니.' },
      { who:'cheolgeom_munju', text:'화원파의 일도… 모두 내 명으로 한 일이오. 변명하지 않겠소.' },
      { who:'cheolmyeong', text:'……' },
      { who:'npc', name:'철검문원', shake:true, text:'문주님! 크, 큰일 났습니다! 사파 연합의 간부가 찾아왔습니다!' },
      { who:'cheolgeom_munju', text:'연합의 간부가…? 내가 직접 나가 맞이하겠다.' },
    ],
    next: 'cheolgeom_coup',
  },

  // 안마당 : 사파 간부 — 문주 추방 선언 → 배신한 문원 → 철검문 안마당 전투
  cheolgeom_coup: {
    chapter:'제1장', place:'철검문 안마당',
    bg:'cheolgeom_court', cast:['sapa_ganbu','cheolgeom_munju','hero','cheonghwa','cheolmyeong'],
    script: [
      { who:'narr',        text:'안마당에는 검은 모피 장포를 두른 사내가 창을 비껴든 채 서 있었다.' },
      { who:'cheolgeom_munju', text:'연합의 간부께서 이 누추한 곳까지 어인 일이시오.' },
      { who:'sapa_ganbu',  shake:true, text:'흥. 그 빌어먹을 천씨를 감싼 놈이 바로 너라면서?' },
      { who:'sapa_ganbu',  text:'오늘부로 너는 간부 자격을 박탈한다. 동시에 연합에서 추방이다!' },
      { who:'cheolgeom_munju', text:'그 말을 대체 어디서…!' },
      { who:'narr',        text:'간부의 등 뒤에 낯익은 얼굴 하나가 서 있었다.' },
      { who:'cheolgeom_munju', shake:true, text:'네 이놈…! 네가 연합에 고해바쳤구나!' },
      { cast:['cheolgeom_traitor','cheolgeom_munju','hero','cheonghwa','cheolmyeong'],
        who:'cheolgeom_traitor', text:'소리치지 마시지요. 저자가 천씨란 것을 듣고 간부님께 아뢰었더니, 저더러 문주직을 맡으라 하시더군요.' },
      { who:'cheolgeom_traitor', text:'그러니 자네는 이제 철검문에서 나가 주셔야겠습니다.' },
      { cast:['sapa_ganbu','cheolgeom_munju','hero','cheonghwa','cheolmyeong'],
        who:'sapa_ganbu',  text:'들었느냐? 순순히 물러나면 목숨만은 붙여 주마. 거역하면 천씨 놈들과 함께 여기서 끝이다!' },
      { who:'cheolgeom_munju', shake:true, text:'내 아버지를 살해한 것도 모자라, 이제는 나까지 죽이려 함이냐!' },
      { who:'cheolgeom_munju', text:'더 이상 너희 뜻대로 이용당하지 않겠다! 철검문 전원, 검을 뽑아라!' },
      // ---- 배신한 문원들의 속내 ----
      { cast:['cheolgeom_traitor','cheolgeom_munju','hero','cheonghwa','cheolmyeong'],
        who:'cheolgeom_traitor', text:'검을 뽑으라고? 하하, 아직도 모르시는군. 우리가 왜 문주님을 등졌는지.' },
      { who:'cheolgeom_traitor', text:'젊은 우리는 연합에 들어가 그 뜻을 따를 거다. 전통이 밥을 먹여 주는 것도 아닌데, 대세를 따라야지!' },
      { who:'cheolgeom_traitor', shake:true, text:'그러니 그만 죽어라!' },
      { cast:['sapa_ganbu','cheolgeom_munju','hero','cheonghwa','cheolmyeong'],
        who:'hero',        text:'문주님, 저희도 함께 싸우겠습니다!' },
    ],
    end: { bg:'cheolgeom_court', cast:['hero','cheonghwa','cheolmyeong'] },
    npcs: [
      { id:'cheolgeom_munju', x:30, y:66, give:{ skill:'일운검법 · 초식' },
        line:'천 가주께 입은 은혜를 이렇게라도 갚게 해 주게. 철검문 검법의 첫 초식이오. 천씨의 검과 결이 비슷하니 금방 손에 붙을 거요.',
        after:'간부는 절정의 고수요. 정면으로 맞서지 말고 버티시오. 놈은 내가 상대하겠소.' },
      { id:'cheonghwa',       x:70, y:64, line:'간부를 쓰러뜨리지 못해도 열 턴만 버티면 됩니다. 문도들부터 막지요.' },
    ],
    sortie: 'cheolgeom_coup',   // 철검문 안마당 — 사파 간부 · 배신한 문원
  },

  // 전투 뒤 문주전 : 위지렴에게 사과 → 위지렴의 다짐 → 문주가 주인공(천명우 / 천명화)을 알아봄 → 사파 연합 이야기
  //   → yangyang_hwasan (이튿날 저잣거리 · 화산파) → yangyang_lord (성주실 · 화산파 소개) → yangyang_heart (저잣거리 · 객잔 : 위지렴의 속사정)
  //   → yangyang_lord_trial (다음 날 · 관원 심문)
  cheolgeom_hall_talk: {
    chapter:'제1장', place:'철검문 문주전',
    bg:'cheolgeom_hall', cast:['cheolgeom_munju','hero','cheonghwa','cheolmyeong'],
    script: [
      { who:'narr',            text:'배신자들 대부분이 처단되고 몇은 달아났지만, 철검문에도 겨우 고요가 찾아왔다.' },
      { who:'narr',            text:'문주전으로 돌아오자, 문주는 무거운 한숨을 내쉬었다.' },
      { who:'cheolgeom_munju', text:'덕분에 철검문이 무너지지 않았소. 천씨세가에 또 한 번 빚을 졌구려.' },
      // ---- 위지렴에게 사과 ----
      { cast:['cheolgeom_munju','cheolmyeong','hero','cheonghwa'],
        who:'cheolgeom_munju', text:'…그리고 위지 문주.' },
      { who:'cheolgeom_munju', text:'연합 간부의 자리에서 받은 명이었다 해도, 화원파를 짓밟은 건 이 철검문이었소. 그 칼끝을 내 입으로 명했지.' },
      { who:'cheolgeom_munju', text:'무슨 말로도 갚을 수 없다는 걸 아오. 그래도 고개를 숙이겠소. …미안하오.' },
      { who:'cheolmyeong',     text:'……' },
      { who:'cheolmyeong',     text:'그 사과를 받기엔 너무 많은 세월이 흘렀소. 원망도, 칼을 갈던 밤도… 이제는 다 닳아 버렸지.' },
      { who:'cheolmyeong',     text:'다만 죽은 사제들과 남은 식솔들에게는 알려야겠소. 그날의 칼을 쥐여 준 자가 누구였는지.' },
      { who:'cheolmyeong',     shake:true, text:'원수는 사파 연합의 간부요. 화원파의 이름을 걸고, 놈에게 반드시 그 값을 치르게 하겠소.' },
      { who:'cheolgeom_munju', text:'…그 길에 이 철검문이 힘을 보태게 해 주시오. 그것이 내가 할 수 있는 유일한 속죄일 테니.' },
      { who:'cheolmyeong',     text:'…마음대로 하시오.' },
      // ---- 문주가 주인공을 알아봄 (남 : 천명우 · 여 : 천명화) ----
      { cast:['cheolgeom_munju','hero','cheonghwa','cheolmyeong'],
        who:'cheolgeom_munju', text:'아까는 경황이 없어 제대로 반기지도 못했구나. {명우|명화}라 했지…' },
      { who:'cheolgeom_munju', shake:true, text:'정말… 정말 네가 그 {명우|명화}냐!' },
      { who:'hero',            text:'…예, 문주님. 그 {명우|명화}입니다.' },
      { who:'cheolgeom_munju', text:'허허… 몰라보게 컸구나. 어릴 적 천가에 들를 때마다 마당을 휘젓고 다니던 그 꼬마가…' },
      { who:'cheolgeom_munju', textM:'가주님도, 어린 명화도… 참으로 안타깝구나. 그때 아무 힘도 되어 드리지 못한 게 지금껏 한이다.',
                               textF:'가주님도, 명우도… 참으로 안타깝구나. 그때 아무 힘도 되어 드리지 못한 게 지금껏 한이다.' },
      { who:'hero',            textM:'지난 일이라 하기엔… 아직 잊히지 않습니다. 그래도 이렇게 다시 뵈니 반갑습니다, 문주님.',
                               textF:'지난 일입니다, 문주님. 이렇게 다시 뵌 것만으로도 충분합니다.' },
      { who:'cheolgeom_munju', text:'…그래. 그렇다면 내가 아는 것을 모두 일러 주마. 사파 연합에 대해서.' },
      // ---- 사파 연합 ----
      { who:'cheolgeom_munju', text:'연합은 몇 해 전, 흩어져 있던 사파의 문파들이 하나로 뭉치며 생겨났다. 맹주가 누구인지는 간부들조차 모른다더구나.' },
      { who:'cheolgeom_munju', text:'간부들은 저마다 맡은 땅이 있다. 관아에 돈을 먹이고, 정파의 작은 문파부터 하나씩 삼키지. 겁을 주고, 가족을 볼모로 잡고… 우리에게 그랬듯이.' },
      { who:'cheolgeom_munju', text:'오늘 그 간부가 양양을 맡은 자다. 놈이 관아의 누구와 손을 잡았는지는 나도 다 알지 못한다.' },
      { who:'hero',            text:'관아라면… 짚이는 사람이 있습니다.' },
      { who:'cheonghwa',       text:'대사형이 뇌물을 바치던 그 관원 말이군요.' },
      { who:'cheolgeom_munju', text:'조심하거라, {명우|명화}야. 연합은 오늘 일을 결코 잊지 않을 게다.' },
    ],
    next: 'yangyang_hwasan',
  },

  // 이튿날 저잣거리 : 화산파가 조사하러 옴 → 위지렴의 분노 → 칼을 뽑음 → 화산파와 겨루기 (전투)
  yangyang_hwasan: {
    chapter:'제1장', place:'양양 저잣거리',
    bg:'yangyang_market', cast:['hero','cheonghwa'],
    script: [
      { who:'narr',             text:'이튿날, 저잣거리에는 낯선 소문이 돌고 있었다. 화산파의 무인들이 양양에 조사를 나왔다는 것이었다.' },
      { who:'cheonghwa',        text:'저쪽을 보십시오. 위지 대협이 누군가와 이야기를 나누고 있습니다.' },
      { who:'hero',             text:'붉은 깃발… 화산파로군요. 가 봅시다.' },
      { cast:['hwasan_hyeonwon','hwasan_hyeonjeok','hero','cheolmyeong'],
        who:'hero',             text:'안녕하십니까. 위지 문주님, 무슨 일이 있으십니까?' },
      { who:'cheolmyeong',      shake:true, text:'화원파가 멸문할 때는 그림자도 비치지 않던 이들이, 이제 와서 찾아왔다는군.' },
      { who:'cheolmyeong',      text:'사제들이 쓰러질 때 그렇게 기다렸던 화산의 검이… 다 끝난 뒤에야 나타났소.' },
      { who:'hwasan_hyeonjeok', text:'말이 지나치구려. 화산이 그동안 손 놓고 앉아만 있었던 줄 아시오?' },
      { who:'cheolmyeong',      shake:true, text:'지금 와서 무슨 낯으로 화산의 이름을 입에 올리는 거냐! 화원파가 배운 화산의 검이 어떤 것이었는지, 직접 보여 주마!' },
      { who:'narr',             text:'위지렴이 허리의 검을 뽑아 들었다. 화산파 수행원들이 일제히 검자루에 손을 얹었다.' },
      { who:'hwasan_hyeonjeok', text:'좋소. 말로는 안 될 모양이니, 검으로 받겠소!' },
      { who:'hwasan_hyeonwon',  text:'현적! …어쩔 수 없군요. 수행원들은 다치지 않게 제압만 하라!' },
      { who:'hero',             text:'(이대로 두면 누군가 크게 다친다… 빨리 끝내야 해.)' },
      { cast:['hero','cheonghwa','cheolmyeong'],
        who:'hero',             text:'청화 도장, 구경꾼들을 물려 주십시오! 저는 위지 문주님 곁에 서겠습니다.' },
      { who:'cheonghwa',        text:'알겠습니다. 두 분 모두 무리하지 마십시오!' },
    ],
    end: { bg:'yangyang_market', cast:['hwasan_hyeonwon','hwasan_hyeonjeok','hero','cheolmyeong'] },
    npcs: [
      { id:'cheonghwa',   x:70, y:64, line:'구경꾼들은 제가 물리겠습니다. 현원 · 현적 두 사람만 제압하면 싸움은 끝날 겁니다.' },
    ],
    sortie: 'hwasan_clash',   // 양양 저잣거리 — 화산파와의 겨루기
  },

  // 겨루기 뒤 : 현원 · 현적 소개 → 화산의 사정 · 사죄 → 위지렴은 자리를 뜸 → 성주를 뵈러
  yangyang_hwasan_after: {
    chapter:'제1장', place:'양양 저잣거리',
    bg:'yangyang_market', cast:['hwasan_hyeonwon','hwasan_hyeonjeok','hero','cheolmyeong'],
    script: [
      { who:'narr',             text:'검을 거둔 화산파의 두 사람이 정중히 포권했다.' },
      { who:'hwasan_hyeonwon',  text:'…{소협|소저}께서는 처음 뵙겠습니다. 화산파의 현원이라 합니다.' },
      { who:'hwasan_hyeonjeok', text:'같은 문하의 현적이오.' },
      { who:'hero',             text:'양양 천씨세가의 {name}입니다.' },
      { who:'hwasan_hyeonwon',  text:'변명처럼 들리겠지만, 그 무렵 화산에도 일이 있었습니다. 산문 밖으로 사람을 낼 형편이 못 되었지요.' },
      { who:'hwasan_hyeonjeok', text:'그렇다고 화원파의 죽음이 가벼워지는 건 아니오. 먼저 간 이들에게는… 화산의 이름으로 사죄하겠소.' },
      { who:'hwasan_hyeonwon',  text:'늦었지만, 이제는 저희가 돕겠습니다. 사파 연합의 일이라면 화산도 더는 두고 볼 수 없습니다.' },
      { who:'cheolmyeong',      text:'……' },
      { who:'cheolmyeong',      text:'…생각을 좀 정리해야겠소. 먼저 가겠소.' },
      { cast:['hwasan_hyeonwon','hwasan_hyeonjeok','hero','cheonghwa'],
        who:'narr',             text:'위지렴은 돌아보지 않고 인파 속으로 사라졌다.' },
      { who:'hero',             text:'(위지 문주님도 속이 복잡하시겠지. 당분간은 그냥 두자.)' },
      { who:'hero',             text:'두 분, 괜찮으시다면 함께 성주님을 뵈러 가시지요. 양양의 일이라면 성주님께도 아뢰어야 합니다.' },
      { who:'hwasan_hyeonwon',  text:'좋습니다. 저희도 인사를 드려야 하던 참이었습니다.' },
    ],
    next: 'yangyang_lord',
  },

  // 양양성 성주실 : 성주와의 재회 → 지난 도움에 감사 → 화산파 소개 (사파 조사에 합류) → 관원 이야기 → 성주의 분노
  yangyang_lord: {
    chapter:'제1장', place:'양양성 성주실',
    bg:'yangyang_lord_hall', cast:['yangyang_lord','hero','hwasan_hyeonwon','hwasan_hyeonjeok'],
    script: [
      { who:'narr',             text:'잠시 후, 일행은 양양성 성주실을 찾았다.' },
      { who:'hero',             text:'성주님, 그동안 강녕하셨습니까.' },
      { who:'yangyang_lord',    text:'응? 이게 누구냐… 허허, 사고뭉치가 다 커서 제 발로 찾아왔군!' },
      { who:'yangyang_lord',    text:'얼굴 좀 보자. 그래, 이제 제법 가주 티가 나는구나.' },
      { who:'yangyang_lord',    text:'사파가 천씨의 핏줄을 쫓는다는 소문에 얼마나 마음을 졸였는지 모른다.' },
      { who:'hero',             text:'제가 떠도는 동안 성주님께서 식솔들을 돌봐 주셨다고 들었습니다. 늘 감사드리고 있었습니다.' },
      { who:'yangyang_lord',    text:'아니다. 내가 자네 아버지께 입은 도움에 비하면 그건 아무것도 아니야.' },
      { who:'yangyang_lord',    text:'게다가 양양이 지금껏 버틴 것은 북협께서 성의 방어를 맡아 주신 덕이지. 나 혼자였다면 어림도 없었을 게다.' },
      { who:'yangyang_lord',    text:'그래, 함께 온 이분들은 누구냐?' },
      { who:'hero',             text:'화산파의 현원 대협과 현적 대협이십니다. 양양에 뿌리내린 사파를 조사하러 오셨다가, 저희와 함께 사파 조사에 힘을 보태기로 하셨습니다.' },
      { who:'hwasan_hyeonwon',  text:'화산파의 현원입니다. 성주님을 뵙습니다.' },
      { who:'hwasan_hyeonjeok', text:'현적이오. 사파 연합의 일이라면 화산도 남의 일이 아니라서 말이오.' },
      { who:'yangyang_lord',    text:'화산에서까지… 사파 놈들이 어지간히 설치는 모양이구려. 이리 나서 주니 고맙소.' },
      { who:'yangyang_lord',    text:'양양에 머무는 동안 필요한 것이 있으면 언제든 관아에 일러 두시오. 성주의 이름으로 돕겠소.' },
      { who:'hwasan_hyeonwon',  text:'감사합니다. 성 안팎의 사정을 살피는 데 큰 힘이 되겠습니다.' },
      { who:'hero',             text:'성주님, 그 일로 여쭐 것이 있습니다.' },
      { who:'hero',             text:'사파 연합의 간부가 이곳 관아의 관원과 안면을 트고, 양양을 제집처럼 여기며 권세를 부렸습니다. 알고 계셨습니까?' },
      { who:'yangyang_lord',    shake:true, text:'뭐라? 내 성의 관원이 사파 놈들과 붙어먹었단 말이냐!' },
      { who:'hero',             text:'그 관원에게 직접 물어볼 것이 있습니다.' },
      { who:'yangyang_lord',    text:'괘씸한 것… 당장 잡아들이라 이르마. 내일 다시 찾아오너라. 내 앞에서 똑똑히 묻게 해 주겠다.' },
    ],
    next: 'yangyang_heart',
  },

  // 저잣거리 : 화산파도 따로 조사하기로 · 위지렴의 일은 주인공이 맡음 → 객잔 : 위지렴의 속사정
  yangyang_heart: {
    chapter:'제1장', place:'양양 저잣거리',
    bg:'yangyang_market', cast:['hwasan_hyeonwon','hwasan_hyeonjeok','hero','cheonghwa'],
    script: [
      { who:'narr',             text:'성주실을 나선 일행은 다시 저잣거리로 돌아왔다.' },
      { who:'hwasan_hyeonwon',  text:'관원의 일은 성주님께 맡기면 되겠군요. 알겠습니다. 저희는 저희대로 성 밖을 돌며 사파의 흔적을 쫓아보겠습니다.' },
      { who:'hwasan_hyeonjeok', text:'우리도 우리 쪽에서 조사해 보겠소. 무언가 걸리면 바로 알리리다.' },
      { who:'hero',             text:'도와주셔서 감사합니다. 화산파가 함께해 주시니 든든합니다.' },
      { who:'hero',             text:'그리고… 위지 문주님 일은 제게 맡겨 주십시오. 지금 두 분이 찾아가시면 오히려 마음을 더 닫으실 겁니다.' },
      { who:'hwasan_hyeonwon',  text:'…부탁드리겠습니다. 저희로서는 할 수 없는 일이겠지요.' },
      { who:'hwasan_hyeonjeok', text:'위지 문주에게 전해 주시오. 화산은 화원파를 잊은 적이 없다고.' },
      { cast:['hero','cheonghwa'],
        who:'narr',             text:'현원과 현적은 가볍게 포권하고는 인파 속으로 사라졌다.' },
      { who:'cheonghwa',        text:'위지 대협께 가 보실 겁니까?' },
      { who:'hero',             text:'네. 혼자 두기엔 오늘 하루가 너무 무거우셨을 겁니다.' },
      // ---- 취현객잔 : 위지렴의 속사정 ----
      { bg:'yangyang_inn', cast:['cheolmyeong','hero','cheonghwa'],
        who:'narr',             text:'해 질 녘, 위지렴은 취현객잔 구석 자리에서 홀로 술잔을 기울이고 있었다.' },
      { who:'hero',             text:'위지 문주님, 여기 계셨군요.' },
      { who:'cheolmyeong',      text:'…{name} {소협이구려|소저구려}. 보기 흉한 꼴을 보였소. 화산 사람들 앞에서 그렇게 언성을 높일 생각은 없었는데.' },
      { who:'hero',             text:'괜찮습니다. 속에 담아 두신 이야기가 있으시면… 들려주시겠습니까?' },
      { who:'cheolmyeong',      text:'……' },
      { who:'cheolmyeong',      text:'나도 알고 있소. 그 무렵 화산도 사파의 습격을 받았다는 걸. 산문 하나 지키기도 벅찼겠지. 머리로는… 다 이해하오.' },
      { who:'cheolmyeong',      text:'하지만 화원파는 평생을 화산의 이름 아래 바쳤소. 사부님도, 나도, 사제들도. 화산의 검을 이어받았다는 것을 무엇보다 자랑으로 여겼지.' },
      { who:'cheolmyeong',      text:'그런데 막상 무너지던 날, 우리는 뒤로 밀렸소. 지켜야 할 것들 가운데 맨 끝에 있었던 거요. …그게 서운했을 뿐이오.' },
      { who:'cheolmyeong',      text:'…아니, 결국은 약했던 내 탓이오. 문주라는 자가 제 문파 하나 지키지 못하고, 남의 손만 기다렸으니.' },
      { who:'cheonghwa',        text:'위지 대협…' },
      { who:'hero',             text:'약하셨던 게 아닙니다. 혼자 버티기엔 상대가 너무 컸을 뿐입니다. 그리고 이제는 혼자가 아니시잖습니까.' },
      { who:'hero',             text:'화산파 분들이 전해 달라더군요. 화산은 화원파를 잊은 적이 없다고.' },
      { who:'cheolmyeong',      text:'…허. 젊은 가주에게 위로를 다 받는구려.' },
      { who:'cheolmyeong',      text:'고맙소. 털어놓고 나니 조금은 가볍구려. 내일 성주실에는 나도 가겠소. 그 관원 놈이 무슨 말을 하는지 똑똑히 들어야겠으니.' },
    ],
    next: 'yangyang_lord_trial',
  },

  // 다음 날 성주실 : 곽정과 재회 (곽정은 먼저 자리를 뜸) → 관원 심문 : 천교 · 구후 · 천씨세가 (10년 전) · 화원파 (4년 전)
  yangyang_lord_trial: {
    chapter:'제1장', place:'양양성 성주실',
    bg:'yangyang_lord_hall', cast:['yangyang_lord','hero','cheonghwa','cheolmyeong'],
    script: [
      { who:'narr',             text:'다음 날, 세 사람은 다시 성주실을 찾았다. 위지렴의 얼굴은 어제보다 한결 가벼워 보였다.' },
      { cast:['guo','hero','cheonghwa','cheolmyeong'],
        who:'guo',              text:'{name} {소협|소저}! 무당산 이후로 처음이구려. 성주께 {소협|소저} 이야기를 듣고 기다리고 있었소.' },
      { who:'hero',             text:'곽 대협! 성주님께 말씀은 들었지만, 이렇게 다시 뵈니 반갑습니다.' },
      { who:'guo',              text:'철검문의 일은 들었소. 소협들이 큰일을 해냈구려.' },
      { who:'guo',              text:'나는 성벽을 둘러볼 일이 있어 먼저 일어나야겠소. 저녁엔 취현객잔에 있을 테니, 무슨 일이 있거든 찾아오시오.' },
      { cast:['yangyang_lord','hero','cheonghwa','cheolmyeong'],
        who:'narr',             text:'곽정이 자리를 뜨고 얼마 지나지 않아, 성주실 문이 열리며 포박된 관원 하나가 끌려 들어왔다.' },
      { cast:['yangyang_lord','yangyang_official','hero','cheonghwa','cheolmyeong'],
        who:'yangyang_official', shake:true, text:'서, 성주님! 이게 대체 무슨 일입니까요!' },
      { who:'yangyang_lord',    text:'무슨 일인지는 네가 더 잘 알 텐데. 사파 연합의 간부와 무슨 거래를 했는지, 숨김없이 고하라.' },
      { who:'yangyang_official', text:'그, 그건… 소인은 그저 시키는 대로 했을 뿐입니다요!' },
      { who:'yangyang_lord',    shake:true, text:'시키는 대로? 누가 무엇을 시켰단 말이냐!' },
      { who:'yangyang_official', text:'간부 나리께서… 이곳에 사파 사람들이 자리 잡을 수 있게 눈만 좀 감아 달라고… 소인은 그저 길을 터 준 것밖에 없습니다요!' },
      { who:'yangyang_official', text:'정말입니다요! 그 이상은 아무것도 모릅니다요!' },
      { who:'hero',             text:'(눈만 감아 줬다… 그 눈 감은 사이에 몇 문파가 무너졌는지 이자는 알고나 있을까.)' },
      // ---- 심문 이어서 : 천교 · 구후 · 천씨세가 · 화원파 ----
      { who:'hero',             text:'아직 끝나지 않았습니다. 그 간부라는 자가 누구입니까?' },
      { who:'yangyang_lord',    shake:true, text:'들었느냐! 그 간부란 놈이 누구인지 고하라!' },
      { who:'yangyang_official', text:'그, 그분은… 스스로를 \'천교(天敎)\'라 부르는 곳의 사람입니다요. 바깥에서는 사파 연합이라들 하지만…' },
      { who:'yangyang_official', text:'천교에는 간부가 일곱 있는데, 그중 하나인 자기, 구후가\n이 양양 지부를 맡았다며… 소인에게 은자를 쥐여 주셨습니다요.' },
      { who:'yangyang_official', text:'철검문에 지시를 내려 두었으니, 앞으로 일은 모두 그 문파를 통해 처리하라 하셨고요…' },
      { who:'hero',             text:'그자와 손을 잡은 게 언제부터입니까.' },
      { who:'yangyang_official', text:'…십 년 전입니다요. 처음 받은 명은… 천씨세가부터 없애라는 것이었습니다요.' },
      { who:'yangyang_official', text:'양양에서 제일가는 세가였지만 오대세가에는 끼지 못해 뒤를 봐줄 곳이 없으니… 먼저 쳐내기 좋다고…' },
      { who:'hero', only:'m', shake:true, text:'(…천씨세가를! 그날 명화가… 누이가 쓰러진 게 처음부터 노리고 한 짓이었다고?!)' },
      { who:'hero', only:'f',   text:'(…천씨세가를. 그날 오라버니가 쓰러진 게… 처음부터 노리고 한 짓이었다고?)' },
      { who:'hero',             textM:'(…지금껏 남은 핏줄을 쫓은 것도 같은 놈들 짓이었나.)',
                                textF:'(지금껏 천씨의 핏줄을 쫓던 것도… 같은 자들이었구나.)' },
      { who:'cheolmyeong',      text:'화원파는. 화원파는 어찌 된 거냐.' },
      { who:'yangyang_official', text:'화, 화원파는 그 뒤에 생긴 작은 문파라 거슬릴 것도 없었습니다요. 그런데 그 문주가 하필… 저희가 거래하는 자리를 보고 말아서…' },
      { who:'yangyang_official', text:'그래서 없애라 하셨습니다요. 그게… 사 년 전입니다요.' },
      { who:'cheolmyeong',      text:'…거래? 설마 그 밤, 네놈과 그 사내, 그리고 철검문주의 아비. 셋이 모여 있던 그 자리를 말하는 거냐.' },
      { who:'yangyang_official', text:'…마, 맞습니다요.' },
      { who:'cheolmyeong',      shake:true, text:'고작 그딴 것 때문에… 그 시답잖은 이유 하나로 화원파를 쓸어버렸단 말이냐!' },
      { who:'narr',             text:'위지렴의 주먹이 관원을 향해 내리꽂혔다—' },
      { who:'yangyang_lord',    shake:true, text:'멈추게!' },
      { who:'narr',             text:'성주가 급히 두 사람 사이를 막아섰다.' },
      { who:'yangyang_lord',    text:'진정하게, 위지 문주. 자네 마음을 내 모르지 않네. 허나 이자는 내일 처형될 걸세. 그러니 안심하게.' },
      { who:'cheolmyeong',      text:'……' },
      { cast:['yangyang_lord','hero','cheonghwa','cheolmyeong'],
        who:'narr',             text:'관원이 끌려 나가자, 성주실에는 무거운 침묵이 내려앉았다.' },
      { who:'hero',             textM:'(원흉은 천교, 그리고 구후. 십 년 전부터 숨어 움직이던 놈들이라면… 반드시 찾아내 그 값을 치르게 하겠다.)',
                                text:'(원흉은 천교, 그리고 구후… 천교는 근래 생긴 연합이라 했지만, 십 년 전부터라면… 곽 대협께서 강호를 누비시던 그 무렵부터 이미 숨어 움직이던 세력이었다는 건가.)' },
      { who:'hero',             text:'성주님, 오늘 일은 감사드립니다. 먼저 물러가겠습니다.' },
      { who:'hero',             text:'청화 도장, 위지 문주님. 급히 가 볼 데가 있어 먼저 일어나겠습니다.' },
      { who:'cheonghwa',        text:'알겠습니다. 조심해서 다녀오십시오.' },
    ],
    next: 'yangyang_guo_inn',
  },

  // 취현객잔 (해 질 녘) : 곽정에게 천교 · 구후를 물음 → 백타산 · 합마공 · 뱀독 → 황용 : 사해용왕 · 해남파 → 하루가 저묾
  yangyang_guo_inn: {
    chapter:'제1장', place:'양양 취현객잔',
    bg:'yangyang_inn', cast:['guo','hero'],
    script: [
      { who:'narr',             text:'해 질 녘, 취현객잔.' },
      { who:'hero',             text:'곽 대협.' },
      { who:'guo',              text:'{name} {소협|소저}, 오셨구려. 표정을 보니 심문에서 무언가 나온 모양이오.' },
      { who:'hero',             text:'여쭐 것이 있습니다. 혹시 \'천교\'라는 곳이나 \'구후\'라는 이름을 들어 보신 적이 있으십니까?' },
      { who:'guo',              text:'천교라… 처음 듣소. 하지만 구후라는 이름은…' },
      { who:'guo',              text:'십삼 년 전 화산논검이 열리기 전까지, 나는 서독 구양봉에게 꽤나 시달렸소. 그자에게 뒤틀린 구음진경을 일러 준 뒤로는 소식이 끊겼지만.' },
      { who:'guo',              text:'그 무렵 들은 이야기가 있소. 구양봉의 백타산에 구후라는 장로가 있다고.' },
      { who:'hero',             text:'철검문에서 그 간부와 맞섰을 때, 놈은 창을 썼습니다. 그런데 기를 모을 때면 두꺼비처럼 몸을 웅크렸고, 창끝에서 비린 독 냄새가 났습니다.' },
      { who:'guo',              text:'두꺼비처럼 웅크리는 자세에 뱀독이라… 합마공이오. 틀림없이 백타산의 무공이지. 창으로 정체를 숨겼던 게로군.' },
      { who:'guo',              text:'합마공은 웅크렸다가 한 번에 터뜨리는 무공이오. 놈이 몸을 낮추거든 절대 정면에 서지 마시오.' },
      { who:'guo',              text:'그런데 {소협|소저}, 그렇다면 그 천교라는 곳이… 그때부터 이미 숨어 움직이고 있었단 말이오?' },
      { who:'hero',             text:'그럴지도 모릅니다. 놈들이 처음 받은 명이 십 년 전, 저희 천씨세가를 없애는 일이었다고 했으니까요.' },
      { who:'hero', only:'m',   text:'…그날 제 누이도 그놈들 손에 죽었습니다.' },
      { who:'guo',  only:'m',   text:'…그랬구려. 소협, 원수를 쫓더라도 혼자 움직이지는 마시오. 놈들은 십 년을 숨어 지낸 자들이오.' },
      { cast:['guo','hero','huang'],
        who:'huang',            text:'둘이서 무슨 얘기를 그렇게 심각하게 하고 있어요?' },
      { who:'narr',             text:'성주실에서 들은 이야기를 다시 들려주자, 황용의 눈빛이 가라앉았다.' },
      { who:'huang',            text:'천교… 개방에도 그 이름이 몇 번 흘러들었어요. 그 안에 \'사해용왕\'이라 불리는 자가 있고, 백타산의 후인도 한 사람 있다고요.' },
      { who:'huang',            text:'구후라는 자가 아마 그 백타산의 후인일 거예요. 게다가 요즘은 해남파까지 천교에 합류했다는 소문이에요.' },
      { who:'guo',              text:'일이 생각보다 크구려… 남궁가에도 일러 두겠소.' },
      { who:'guo',              text:'자, 어려운 이야기는 이쯤 하고 일단 식사부터 합시다. 배가 고프면 좋은 생각도 안 나는 법이오.' },
      { who:'huang',            text:'정말, 오라버니는 이럴 때도 밥 얘기예요? …뭐, 틀린 말은 아니지만요.' },
      { who:'narr',             text:'그렇게 하루가 저물었다.' },
    ],
    next: 'yangyang_traitors',
  },

  // 이튿날 저잣거리 : 구후를 더 캐러 나섬 → 철검문 배신자들의 습격 → 전투
  yangyang_traitors: {
    chapter:'제1장', place:'양양 저잣거리',
    bg:'yangyang_market', cast:['hero','cheonghwa','cheolmyeong'],
    script: [
      { who:'narr',             text:'이튿날, 양양 저잣거리.' },
      { who:'hero',             text:'(구후… 놈에 대해 조금 더 알아봐야겠다. 철검문과 관아 말고도 손을 뻗은 곳이 있을 거야.)' },
      { who:'cheolmyeong',      text:'관원 놈이 한 말이 아직도 귀에 쟁쟁하오. 구후를 쫓는다면 나도 가겠소.' },
      { cast:['cheolgeom_traitor','hero','cheonghwa','cheolmyeong'],
        who:'cheolgeom_traitor', shake:true, text:'거기 서라! 우리 간부님의 뒤를 캔다는 놈이 네놈이냐!' },
      { who:'cheolgeom_traitor', text:'철검문에서 목숨 건진 걸 운으로 알아야지. 오늘은 그 운도 끝이다!' },
      { who:'cheolmyeong',      text:'철검문을 팔아넘긴 놈들이 아직도 양양을 활보하고 있었군.' },
      { who:'hero',             text:'마침 잘됐습니다. 구후에 대해 물어볼 게 많았거든요.' },
      { who:'cheolgeom_traitor', text:'주둥이만 살았구나. 쳐라!' },
    ],
    end: { bg:'yangyang_market', cast:['cheolgeom_traitor','hero','cheonghwa','cheolmyeong'] },
    npcs: [
      { id:'cheonghwa',   x:70, y:64, line:'배신자들이 흩어지기 전에 막아야 합니다. 거점에서 채비를 단단히 하고 나서지요.' },
      { id:'cheolmyeong', x:30, y:66, give:{ item:'매깃 노리개' },
        line:'사냥할 때 늘 지니던 매 깃 노리개요. 눈이 밝아진다는 말이 있지. 가져가시오.',
        after:'놈들을 쓰러뜨리면 구후의 행방도 캐낼 수 있을 거요.' },
    ],
    sortie: 'yangyang_traitors',   // 양양 저잣거리 — 철검문 배신자들의 습격
  },

  // 배신자들을 물리친 뒤 : 달아나려던 배신 문원 하나를 붙잡음 → 성주실 심문
  yangyang_traitors_after: {
    chapter:'제1장', place:'양양 저잣거리',
    bg:'yangyang_market', cast:['cheolgeom_traitor','hero','cheonghwa','cheolmyeong'],
    script: [
      { who:'narr',              text:'싸움이 끝나자, 쓰러져 있던 배신 문원 하나가 비틀거리며 골목으로 몸을 빼려 했다.' },
      { who:'cheolmyeong', shake:true, text:'어딜 가느냐!' },
      { who:'cheolgeom_traitor', text:'노, 놓아라! 나는 아무것도 모른다!' },
      { who:'hero',              text:'아는지 모르는지는 성주님 앞에서 가려 봅시다.' },
      { who:'narr',              text:'세 사람은 배신 문원을 포박해 성주실로 끌고 갔다.' },
    ],
    next: 'yangyang_traitor_trial',
  },

  // 성주실 : 곽정 · 황용 앞에서 심문 → 한수상단 → 성주가 곽정에게 영패를 내줌
  yangyang_traitor_trial: {
    chapter:'제1장', place:'양양성 성주실',
    bg:'yangyang_lord_hall', cast:['cheolgeom_traitor','yangyang_lord','guo','huang','hero'],
    script: [
      { who:'narr',              text:'소식을 들은 곽정과 황용도 성주실로 달려왔다.' },
      { who:'yangyang_lord',     text:'네 이놈. 천교가 양양에서 무엇을 꾸미는지, 아는 대로 고하라.' },
      { who:'cheolgeom_traitor', text:'소, 소인은 아무것도 모릅니다. 시키는 대로 칼을 들었을 뿐입니다.' },
      { who:'guo',               text:'저잣거리 한복판에서 사람을 해치려 들고서, 아무것도 모른다는 말이오?' },
      { who:'hero',              text:'누구의 명으로 저희를 노렸는지, 그것만이라도 말하시오.' },
      { who:'cheolgeom_traitor', text:'정말… 정말 모릅니다. 위에서 내려온 말을 전해 들었을 뿐이라…' },
      { who:'huang',             text:'그럼 하나만 물을게요. 양양성 바로 옆에 자리 잡은 상인 무리, 한수상단. 혹시 거기서 온 건가요?' },
      { who:'narr',              text:'배신 문원의 이마에 식은땀이 맺혔다.' },
      { who:'cheolgeom_traitor', text:'그, 그건… 소인은… 그러니까…' },
      { who:'huang',             text:'대답은 됐어요. 얼굴에 다 쓰여 있으니까.' },
      { who:'huang',             text:'오라버니, 그 상단을 조사해 봐야겠어요. 요즘 드나드는 짐이 부쩍 늘었다는 말이 개방에도 들어왔거든요.' },
      { who:'guo',               text:'알겠소. 내가 직접 가 보리다.' },
      { who:'yangyang_lord',     text:'…본래 관과 무림은 서로의 일에 손대지 않는 법이네. 관무불가침이라 하지.' },
      { who:'yangyang_lord',     text:'허나 성벽 바로 곁에서 이런 일이 벌어진다면 양양성의 안위가 걸린 일이야. 그대로 둘 수는 없지.' },
      { who:'yangyang_lord',     text:'곽 대협, 내 영패를 드리겠소. 상단을 조사하는 데 성주의 권한을 마음껏 쓰시오.' },
      { who:'guo',               text:'감사합니다, 성주님.' },
      { cast:['guo','huang','hero','cheonghwa','cheolmyeong'],
        who:'hero',              text:'그럼 두 분이 상단을 살피시는 동안, 저희는 철검문에 다녀오겠습니다. 문주님께도 알려 드려야 할 것 같습니다.' },
      { who:'cheonghwa',         text:'…{name} {소협|소저}. 철검문에 가기 전에, 잠시 이야기를 나눌 수 있겠습니까?' },
      { who:'hero',              text:'저 말입니까? …알겠습니다.' },
    ],
    next: 'yangyang_inn_cheonghwa',
  },

  // 취현객잔 : 청화가 주인공을 걱정함 → 위지렴이 끼어들어 셋이 오랜만에 쉼
  yangyang_inn_cheonghwa: {
    chapter:'제1장', place:'양양 취현객잔',
    bg:'yangyang_inn', cast:['cheonghwa','hero'],
    script: [
      { who:'narr',        text:'해 질 녘, 취현객잔. 청화는 한참 동안 찻잔만 만지작거렸다.' },
      { who:'hero',        text:'청화 도장, 하실 말씀이라는 게…' },
      { who:'cheonghwa',   text:'{name} {소협|소저}. 괜찮으십니까?' },
      { who:'cheonghwa',   text:'십 년 전의 일이 어떤 것이었는지 저는 다 알지 못합니다. 하지만 {소협|소저}에게는 가문이 무너진 큰일이었을 텐데…' },
      // 남 (천명우) : 원수에 대한 분노
      { who:'cheonghwa',   only:'m', text:'관원의 입에서 그 이야기가 나올 때, 소협의 눈빛이 무서울 정도였습니다. 그게 걱정이 되었습니다.' },
      { who:'hero',        only:'m', text:'…그날 부모님도, 세가의 무인들도 쓰러졌습니다. 누이 명화는… 아직 어렸습니다.' },
      { who:'hero',        only:'m', text:'십 년을 잊으려 했지만, 놈들의 이름을 듣는 순간 모두 되살아나더군요.' },
      { who:'hero',        only:'m', text:'구후, 그놈만은 제 손으로 끝을 내야겠습니다.' },
      { who:'cheonghwa',   only:'m', text:'…원한을 품는 것을 탓하지는 않겠습니다. 다만 원한에 먹히지는 마십시오.' },
      { who:'cheonghwa',   only:'m', text:'소협이 무너지면, 명화 소저도 슬퍼하실 겁니다.' },
      { who:'hero',        only:'m', text:'…명심하겠습니다, 청화 도장.' },
      // 여 (천명화) : 살아남는 것이 먼저
      { who:'cheonghwa',   only:'f', text:'관원의 입에서 그 이야기가 나올 때도, 소저는 너무 담담하셨습니다. 그게 오히려 걱정이 되었습니다.' },
      { who:'hero',        only:'f', text:'…십 년이라는 세월은 감정도 무디게 만들더군요.' },
      { who:'hero',        only:'f', text:'그날 부모님도, 오라버니도, 세가의 어른들도 쓰러지면서 제게 부탁을 했습니다.' },
      { who:'hero',        only:'f', text:'살아 달라고요. 원수를 갚아 달라는 말은… 아무도 하지 않았습니다.' },
      { who:'hero',        only:'f', text:'살아 있어야 기회도 있는 법이지요. 그러니 괜찮습니다, 청화 도장.' },
      { who:'cheonghwa',   only:'f', text:'…그렇군요.' },
      { who:'cheonghwa',   textM:'위지 대협도, 소협도 그런 일을 겪고도 앞을 보고 계신 걸 보면… 저도 깨닫는 게 많습니다.',
                           text:'위지 대협도, 소저도 그런 일을 겪고도 마음을 다스리고 계신 걸 보면… 저도 깨닫는 게 많습니다.' },
      { who:'cheonghwa',   text:'사조님께서 왜 저더러 산을 내려가라 하셨는지, 이제야 조금 알 것 같습니다. 저도 더 강해져야겠습니다.' },
      { cast:['cheolmyeong','hero','cheonghwa'],
        who:'cheolmyeong', text:'둘이서 무슨 이야기를 그리 진지하게 하고 있소? 나도 좀 끼워 주시오.' },
      { who:'cheolmyeong', text:'술 한 잔 정도는 내가 사리다.' },
      { who:'cheonghwa',   text:'위지 대협! 마침 잘 오셨습니다.' },
      { who:'narr',        text:'세 사람은 오랜만에 느긋하게 웃고 떠들었다. 그렇게 하루가 저물었다.' },
    ],
    next: 'cheolgeom_revisit',
  },

  // 철검문 문주전 : 조사 내용을 나누고, 철검문은 정비 뒤 천교와 전쟁을 치르기로
  cheolgeom_revisit: {
    chapter:'제1장', place:'철검문 문주전',
    bg:'cheolgeom_hall', cast:['cheolgeom_munju','hero','cheonghwa','cheolmyeong'],
    script: [
      { who:'narr',            text:'이튿날, 세 사람은 철검문을 찾았다.' },
      { who:'hero',            text:'문주님, 그간 알아낸 것을 전해 드리러 왔습니다.' },
      { who:'narr',            text:'관원의 자백과 천교, 구후, 그리고 한수상단에 대한 이야기를 차례로 들려주었다.' },
      { who:'cheolgeom_munju', text:'천교… 그리고 구후라. 우리를 이 꼴로 만든 자들의 이름을 이제야 알았구려.' },
      { who:'hero',            text:'철검문은 좀 어떻습니까?' },
      { who:'cheolgeom_munju', text:'문도 절반이 배신해 떠났소. 세가 많이 줄었지.' },
      { who:'cheolgeom_munju', text:'허나 괜찮소. 남은 문도들이 단단하고, 새 문도들도 곧 들어올 거요.' },
      { who:'cheolgeom_munju', text:'정비가 끝나면 철검문은 천교와 전쟁을 치를 생각이오. 더는 숨지 않겠소.' },
      { who:'cheolmyeong',     text:'…그 싸움, 화원파의 몫도 남겨 두시오.' },
      { who:'hero',            text:'저희도 힘닿는 데까지 돕겠습니다.' },
      { who:'cheolgeom_munju', text:'고맙소. 천씨세가와 다시 어깨를 나란히 하게 되다니… 선대 가주께서도 기뻐하실 거요.' },
      { bg:'yangyang_manor', cast:['hero','cheonghwa','cheolmyeong'],
        who:'narr',            text:'세가로 돌아와서는 다가올 싸움에 대비해 수련에 힘을 쏟았다.' },
    ],
    next: 'yangyang_errand',
  },

  // 천씨세가 장원 : 황용의 부탁 — 절강성 개방 분타에 물건을 전해 달라. 채비 → 출정 (= 산길 장면 → 전투)
  yangyang_errand: {
    chapter:'제1장', place:'양양 천씨 장원',
    bg:'yangyang_manor', cast:['huang','hero'],
    script: [
      { who:'narr',  text:'다음 날, 천씨세가 장원에 황용이 찾아왔다.' },
      { who:'huang', text:'{name} {소협|소저}, 갑자기 찾아와서 미안해요. 급히 부탁할 일이 생겼어요.' },
      { who:'hero',  text:'황 방주님께서 직접 오시다니요. 무슨 일입니까?' },
      { who:'huang', text:'이 물건을 절강성의 개방 분타에 전해 줬으면 해요.' },
      { who:'huang', text:'오라버니와 저는 상단 일로 양양을 비울 수 없고, 개방 제자들에게 맡기기엔 길이 너무 험해요.' },
      { who:'huang', text:'안에 든 게 뭔지는 묻지 말아 줘요. 다만 아주 중요한 물건이에요.' },
      { who:'hero',  text:'알겠습니다. 반드시 전하겠습니다.' },
      { cast:['hero','cheonghwa','cheolmyeong'],
        who:'narr',  text:'청화와 위지렴을 불러, 길 떠날 채비를 마쳤다.' },
    ],
    end: { bg:'yangyang_manor', cast:['hero','cheonghwa','cheolmyeong'] },
    npcs: [
      { id:'cheonghwa',   x:74, y:60, line:'먼 길입니다. 거점에서 채비를 단단히 하고 나서지요.' },
      { id:'cheolmyeong', x:26, y:62, give:{ item:'해독제', n:2 },
        line:'구후가 뱀독을 쓴다지 않았소. 산에서 쓰던 해독제요. 넉넉히 챙겨 가시오.',
        after:'절강까지는 산을 몇 개 넘어야 하오. 화살은 넉넉히 챙겨 두었소.' },
    ],
    // 떠나기 전 들르기 : 장원 → 양양성 성주실 (성주 · 곽정) → 철검문 문주전 (문주 · 대사형) → 취현객잔 (황용 : 낙영신검장) → 장원
    go: ['lord'], homeBtn:'장원으로',
    places: {
      lord: { name:'양양성 성주실', btn:'양양성으로', bg:'yangyang_lord_hall', go:['cheolgeom', 'home'],
        npcs: [
          { id:'yangyang_lord', x:31, y:54,
            talk: [
              { who:'yangyang_lord', text:'절강까지 간다고? 허허, 사고뭉치가 이제는 개방 심부름까지 하는구나.' },
              { who:'hero',          text:'황 방주님의 부탁입니다. 금방 다녀오겠습니다.' },
              { who:'yangyang_lord', text:'장원은 걱정 말거라. 네가 없는 동안 내가 살펴 두마.' },
              { who:'yangyang_lord', text:'그리고… 이번엔 꼭 살아서 돌아오너라. 십 년을 기다린 식솔들이 있다는 걸 잊지 말고.' },
            ],
            line:'장원은 걱정 말거라. 네가 없는 동안 내가 살펴 두마.',
            after:'영패는 곽 대협께 드렸으니, 상단 일은 그분께 맡기고 너는 네 길을 가거라.' },
          { id:'guo', x:69, y:56,
            talk: [
              { who:'guo',  text:'왔구려, {name} {소협|소저}. 용아의 부탁을 들어주었다지.' },
              { who:'guo',  text:'한수상단은 아직 꼬리를 잡지 못했소. 드나드는 짐은 많은데 장부는 깨끗하더군. 누군가 미리 손을 써 둔 게요.' },
              { who:'hero', text:'천교의 손길이 거기까지 닿아 있는 걸까요.' },
              { who:'guo',  text:'그럴지도 모르오. 양양은 내가 지킬 테니, {소협은|소저는} 길 위의 일만 생각하시오.' },
            ],
            line:'양양은 내가 지킬 테니, 길 위의 일만 생각하시오.',
            after:'사파는 앞보다 뒤를 노리오. 쉴 때일수록 등 뒤를 살피시오.' },
        ] },
      cheolgeom: { name:'철검문 문주전', btn:'철검문으로', bg:'cheolgeom_hall', go:['inn', 'home'],
        npcs: [
          { id:'cheolgeom_munju', x:31, y:54,
            talk: [
              { who:'cheolgeom_munju', text:'{명우|명화}야, 먼 길을 떠난다고 들었다.' },
              { who:'hero',            text:'예, 절강까지 다녀오려 합니다.' },
              { who:'cheolgeom_munju', text:'내가 연합에 몸담았을 적에, 양양 간부와 절강 쪽이 서신을 자주 주고받는다는 말을 들었다. 가는 길목마다 놈들의 눈이 있을 게다.' },
              { who:'cheolgeom_munju', text:'철검문은 정비를 서두르마. 네가 돌아올 즈음엔 다시 검을 들 수 있게 해 두겠다.' },
            ],
            line:'철검문은 정비를 서두르마.',
            after:'몸조심하거라. 선대 가주께 두 번 죄를 지을 수는 없다.' },
          { id:'cheolgeom_sahyeong', x:69, y:57,
            talk: [
              { who:'cheolgeom_sahyeong', text:'천 {소협|소저}. 저잣거리에서 처음 칼을 맞댄 게 엊그제 같은데… 그때 일은 지금 생각해도 낯이 뜨겁소.' },
              { who:'hero',               text:'지난 일입니다. 지금은 같은 편 아닙니까.' },
              { who:'cheolgeom_sahyeong', text:'하하, 그리 말해 주니 고맙소. 요즘 새로 들어온 문도들을 가르치고 있소. 다시는 연합 따위에 흔들리지 않게.' },
              { who:'cheolgeom_sahyeong', text:'돌아오면 한 수 겨뤄 주시오. 이번엔 쉽게 지지 않을 테니.' },
            ],
            line:'돌아오면 한 수 겨뤄 주시오.',
            after:'문도들이 천씨의 검 이야기를 하도 물어서, 요즘 내가 진땀을 빼고 있소.' },
        ] },
      inn: { name:'양양 취현객잔', btn:'객잔으로', bg:'yangyang_inn', go:['home'],
        npcs: [
          { id:'huang', x:33, y:56, give:{ skill:'낙영신검장 · 기초' },
            talk: [
              { who:'huang', text:'어머, 여기까지 찾아왔네요. 떠나기 전에 한 번 더 보고 싶었는데 잘됐어요.' },
              { who:'hero',  text:'방주님, 아까 그 물건 말입니다만…' },
              { who:'huang', text:'역시 궁금했죠? 미안해요. 다 말해 줄 수는 없어요.' },
              { who:'huang', text:'이것만 알아 둬요. 그건 원래 천교가 쥐고 있던 걸 개방이 빼낸 물건이에요. 놈들은 무슨 수를 써서라도 되찾으려 할 거예요.' },
              { who:'huang', text:'그리고 절대 열어 보지 말아요. 열어 본 사람을 천교가 그냥 두지 않을 테니까.' },
              { who:'huang', text:'길에서 누가 보따리를 노리면… 물건보다 {소협|소저} 목숨이 먼저예요. 물건은 다시 찾으면 되지만 사람은 그렇지 않으니까.' },
              { who:'huang', text:'빈손으로 보내긴 섭섭하니 하나 가르쳐 줄게요. 도화도의 장법, 낙영신검장. 기초뿐이지만 {소협이라면|소저라면} 금방 익힐 거예요.', give:true },
            ],
            line:'물건보다 {소협|소저} 목숨이 먼저예요.',
            after:'절강 분타의 노 장로에게 안부 전해 줘요. 고집은 세도 믿을 만한 분이에요.' },
        ] },
    },
    sortie: 'mountain_bandits',        // 출정 → 아래 산길 장면 → 대화가 끝나면 바로 전투
    sortieScene: 'mountain_path',
  },

  // 양양성 밖 산길 : 출정을 누르면 나오는 장면. 대화가 끝나면 바로 전투(fight)
  mountain_path: {
    chapter:'제1장', place:'양양성 밖 산길',
    bg:'mountain_path', cast:['hero','cheonghwa','cheolmyeong'],
    script: [
      { who:'narr',        text:'양양성을 나선 세 사람은 동남쪽으로 이어진 산길에 올랐다.' },
      { who:'cheolmyeong', text:'무슨 물건인지는 몰라도, 황 방주가 직접 맡길 정도면 가벼운 물건은 아니겠구려.' },
      { who:'cheonghwa',   text:'그러니 더 조심해서 가야겠습니다. 노리는 눈이 없으리란 법도 없으니까요.' },
      { who:'hero',        text:'맞습니다. 산을 넘을 때까지는 경계를 늦추지 맙시다.' },
      { cast:['bandit_chief','hero','cheonghwa','cheolmyeong'],
        who:'bandit_chief', shake:true, text:'거기 서라! 이 고개를 넘으려면 통행세를 내야지!' },
      { who:'enemy', name:'사파 무인', text:'보따리가 꽤 귀해 보이는데? 그것째 두고 가면 목숨은 살려 주마.' },
      { who:'hero',        text:'이 길에 통행세가 있다는 말은 처음 듣는군. 낼 생각 없소.' },
      { who:'bandit_chief', text:'말로 해서는 안 되겠군. 얘들아, 쳐라!' },
    ],
    fight: 'mountain_bandits',         // 대화가 끝나면 끝 화면 없이 바로 전투
    // (전투에서 진 뒤 이야기로 돌아올 때를 위한 끝 화면)
    end: { bg:'mountain_path', cast:['hero','cheonghwa','cheolmyeong'] },
    npcs: [],
    sortie: 'mountain_bandits',
  },

  // ================= 제2장 =================
  // 산길 고개 (산적 전투 직후) : 붙잡은 산적 — 녹림 적룡채가 길목을 틀어쥐고 있음 → 적룡채를 치기로
  zhejiang_road: {
    chapter:'제2장', title:'절강으로 가는 길', place:'양양성 밖 산길',
    bg:'mountain_path', cast:['hero','cheonghwa','cheolmyeong'],
    script: [
      { who:'narr',        text:'산적들이 흩어져 달아나고, 미처 도망치지 못한 산적 하나가 바닥에 주저앉았다.' },
      { cast:['mountain_bandit','hero','cheonghwa','cheolmyeong'],
        who:'cheolmyeong', text:'이놈, 어느 산채 놈이냐. 바른대로 말해라.' },
      { who:'mountain_bandit', text:'저, 적룡채요! 녹림의 적룡채…' },
      { who:'cheonghwa',   text:'녹림이라면 산채들의 무리 아닙니까? 그런 이들이 어째서 사파 무인과 함께…' },
      { who:'mountain_bandit', text:'우, 우리도 시킨 대로 했을 뿐이오! 그 보따리를 든 자들을 막으라고…' },
      { who:'hero',        text:'누가 시켰단 말이오?' },
      { who:'mountain_bandit', text:'그건 채주님만 아시오. 소인은 정말 모르오!' },
      { who:'mountain_bandit', text:'이 앞 고갯길은 우리 적룡채가 지키고 있소. 지나가는 자는 모조리 뒤져서 통행세를 받고…' },
      { who:'cheolmyeong', text:'길목을 틀어쥐고 오가는 사람들을 털고 있었다는 말이군.' },
      { who:'cheonghwa',   text:'절강으로 가려면 이 길밖에 없습니다. 돌아가면 며칠은 더 걸릴 겁니다.' },
      { who:'hero',        text:'어차피 지나가야 할 길이라면… 적룡채를 칩시다. 보따리를 노린 자가 누구인지도 채주에게 직접 묻겠습니다.' },
      { who:'cheolmyeong', text:'좋소. 산채라면 활 쏠 자리도 많겠군.' },
      { bg:'jeokryong_gate', cast:['hero','cheonghwa','cheolmyeong'],
        who:'narr',        text:'세 사람은 적룡채가 진을 친 고갯길 깊숙이 발을 들였다. 붉은 깃발 너머로 산채의 본채가 버티고 서 있었다.' },
    ],
    end: { bg:'jeokryong_gate', cast:['hero','cheonghwa','cheolmyeong'] },
    npcs: [
      { id:'cheonghwa',   x:74, y:62, line:'채주만 꺾으면 나머지는 흩어질 겁니다. 거점에서 채비를 단단히 하고 나서지요.' },
      { id:'cheolmyeong', x:24, y:64, line:'망루에 궁수가 있을 거요. 활은 활로 상대하겠소.' },
    ],
    sortie: 'jeokryong_raid',      // 적룡채 토벌 (지도 006) → 승리 뒤 jeokryong_inside
  },

  // 적룡채 안마당 : 채주와 대화 — 녹림 72채, 구후의 의뢰 → 적룡채는 천씨세가의 사람이 됨
  jeokryong_inside: {
    chapter:'제2장', place:'녹림 적룡채',
    bg:'jeokryong_yard', cast:['jeokryong_chief','hero','cheonghwa','cheolmyeong'],
    script: [
      { who:'jeokryong_chief', text:'죽일 테면 죽여라. 산적 노릇 하다 칼에 죽는 것도 팔자지.' },
      { who:'hero',        text:'목숨을 받으러 온 게 아니오. 묻고 싶은 게 있어서 왔소.' },
      { who:'hero',        text:'녹림의 산채가 어째서 사파 무인들과 함께 길을 막고 있었소?' },
      { who:'jeokryong_chief', text:'…녹림 칠십이채라는 말, 들어 봤겠지.' },
      { who:'jeokryong_chief', text:'얼마 전 녹림 대채주가 천교에 들어갔다. 쉰 개 산채가 대채주를 따라 천교에 입교했지.' },
      { who:'jeokryong_chief', text:'나머지 스물두 채는… 버려졌다. 쓸모없다고.' },
      { who:'cheonghwa',   text:'그럼 적룡채도…' },
      { who:'jeokryong_chief', text:'그래. 버려진 스물두 채를 내가 이끌고 이 길목에 자리를 잡았다. 먹고는 살아야 했으니까.' },
      { who:'cheolmyeong', text:'그래서 오가는 사람들을 털었단 말이오? 굶는다고 남의 것을 빼앗아도 된다는 법은 없소.' },
      { who:'jeokryong_chief', text:'…할 말이 없군.' },
      { who:'hero',        text:'사파 무인들은요? 저희 보따리를 노린 건 누구의 뜻이었소?' },
      { who:'jeokryong_chief', text:'며칠 전 사파 놈들이 찾아왔지. 구후라는 자의 심부름이라더군.' },
      { who:'jeokryong_chief', text:'개방 거지 대장이 가져간 물건을 되찾아야 한다고, 그 보따리를 든 자들이 이 길을 지날 테니 막아 달라 했다. 은자도 두둑이 쥐여 주고.' },
      { who:'hero',        text:'(구후… 여기까지 손을 뻗고 있었나.)' },
      { who:'cheonghwa',   text:'그렇다면 이 물건은 천교에게도 중요한 것이란 뜻이군요.' },
      { who:'jeokryong_chief', text:'천교라면 나도 이를 갈고 있다. 우리를 버린 대채주도, 그놈이 고개를 숙인 천교도.' },
      { who:'jeokryong_chief', text:'목숨을 살려 준 빚은 반드시 갚겠다.' },
      { who:'hero',        text:'그렇다면 오늘부터 약탈은 그만두시오.' },
      { who:'hero',        text:'적룡채 사람들을 데리고 양양성의 천씨세가로 가시오. 세가의 돈으로 장사를 하든, 낭인으로 살든 길을 열어 드리리다.' },
      { who:'hero',        text:'이 패를 가져가면 세가 사람들이 도울 거요.' },
      { who:'jeokryong_chief', text:'…산적 떼를 거두겠다는 거요? 허, 별난 사람을 다 보는군.' },
      { who:'jeokryong_chief', text:'좋소. 오늘부터 적룡채는 천씨세가의 사람이오. 부르면 언제든 달려가리다.' },
    ],
    next: 'jeokryong_gate',
  },

  // 적룡채 문 앞 : 일이 끝나고 절강으로 서두름
  jeokryong_gate: {
    chapter:'제2장', place:'녹림 적룡채',
    bg:'jeokryong_gate', cast:['hero','cheonghwa','cheolmyeong'],
    script: [
      { who:'narr',        text:'적룡채 사람들이 짐을 꾸리기 시작했다. 세 사람은 산채 문 앞에서 잠시 걸음을 멈췄다.' },
      { who:'cheonghwa',   text:'생각보다 시간을 많이 썼습니다. 황 방주님께서 급한 일이라 하셨으니 서둘러야겠습니다.' },
      { who:'cheolmyeong', text:'구후가 사람까지 사서 노린 물건이오. 다음엔 또 어떤 놈들이 길을 막을지 모르오.' },
      { who:'hero',        text:'쉬지 않고 가도 열흘은 넘게 걸릴 겁니다. 서두릅시다.' },
      { who:'narr',        text:'세 사람은 적룡채를 뒤로하고 절강을 향해 걸음을 재촉했다.' },
    ],
    next: 'cheongyo_meeting',
  },

  // 천교 회의실 (사파 연합 절강 지부의 안채) : 사도결이 구후에게 실패를 보고 → 구후는 본교로, 절강 지부는 사도결에게
  cheongyo_meeting: {
    chapter:'제2장', place:'사파 연합 절강 지부',
    bg:'cheongyo_hall', cast:['sapa_ganbu','sado_gyeol'],
    script: [
      { who:'narr',       text:'같은 무렵, 절강. 사파 연합 절강 지부의 깊은 안채.' },
      { who:'narr',       text:'절강 지부장이 죽은 뒤, 구후는 지부를 수습하러 양양에서 이곳까지 와 있었다.' },
      { who:'sado_gyeol', text:'구후 님, 송구합니다. 적룡채가 일을 그르쳤습니다.' },
      { who:'sapa_ganbu', name:'구후', text:'…그 산적 놈들이?' },
      { who:'sado_gyeol', text:'보따리를 든 자들이 오히려 적룡채를 쳐부쉈고, 채주까지 그쪽에 붙었다 합니다.' },
      { who:'sado_gyeol', text:'이대로라면 열흘 남짓이면 절강에 당도할 겁니다.' },
      { who:'sapa_ganbu', name:'구후', text:'{천씨 놈|천씨 계집}이로군. 양양에서부터 끈질기게도 따라붙는구나.' },
      { who:'sado_gyeol', text:'어찌할까요? 분타에 닿기 전에 길목에서 끊어 낼까요?' },
      { who:'sapa_ganbu', name:'구후', text:'늦었다. 개방에서 이미 지원을 내보냈을 게다.' },
      { who:'sapa_ganbu', name:'구후', text:'대신 그 물건이 무엇인지 알게 된 놈들은 하나도 살려 둘 수 없다.' },
      { who:'sapa_ganbu', name:'구후', text:'나는 대계를 위해 본교에 다녀와야 한다.' },
      { who:'sapa_ganbu', name:'구후', text:'양양 지부와 절강 지부를 하나로 묶었으니, 교에 직접 아뢰어야 할 일이다.' },
      { who:'sapa_ganbu', name:'구후', text:'그동안 절강 지부는 네가 맡아라. 그리고 그놈들을 죽여라.' },
      { who:'sado_gyeol', text:'명을 받들겠습니다. 절강 땅을 밟은 걸 후회하게 해 드리지요.' },
      { who:'sapa_ganbu', name:'구후', text:'실패는 한 번으로 족하다. 두 번은 없다.' },
      { who:'narr',       text:'그날 밤, 구후는 절강 지부를 떠났다.' },
    ],
    next: 'zhejiang_branch',
  },

  // 절강 저잣거리 → 개방 분타 : 황용이 먼저 보낸 석운 · 진소연 → 노유각에게 물건 전달 → 구후의 무리 소식 → 사도결의 습격
  zhejiang_branch: {
    chapter:'제2장', place:'절강 개방 분타',
    bg:'zhejiang_street', cast:['hero','cheonghwa','cheolmyeong'],
    script: [
      { who:'narr',      text:'한편, 보름 남짓 길을 서둘러 절강성에 당도한 일행은 개방 분타를 찾았다.' },
      { bg:'gaebang_branch_out', cast:['seokun','jinsoyeon','hero','cheonghwa','cheolmyeong'],
        who:'seokun',    text:'거기, 혹시 양양 천씨세가에서 오신 분들이오?' },
      { who:'hero',      text:'그렇습니다만… 누구신지?' },
      { who:'seokun',    text:'하하, 역시! 사부님 말씀대로 딱 보름 만이군. 나는 석운이오. 다들 소걸개라고 부르지.' },
      { who:'jinsoyeon', text:'사형, 처음 뵙는 분들 앞에서 또 그 별호예요? …진소연이에요. 저희 둘 다 황 방주님의 제자랍니다.' },
      { who:'cheonghwa', text:'황 방주님의 제자분들이셨군요.' },
      { who:'seokun',    text:'사부님께서 걱정이 많으셨거든. 물건이 무사히 닿는지 보고 오라고 우리를 먼저 보내셨소.' },
      { who:'jinsoyeon', text:'장로님께서 안에서 기다리세요. 들어가시죠.' },
      { bg:'gaebang_branch', cast:['noyugak','hero','cheonghwa','cheolmyeong'],
        who:'noyugak',   text:'황 방주님께서 보내신 분들이오? 먼 길 오느라 고생 많았소.' },
      { who:'hero',      text:'양양 천씨세가의 {name}입니다. 이 물건을 전해 드리라 하셨습니다.' },
      { who:'noyugak',   text:'…확실히 받았소. 방주님께는 잘 받았다고 기별을 넣으리다.' },
      { who:'hero',      text:'오는 길에 들은 이야기가 있습니다. 구후라는 자가 이 물건을 노리고 있습니다.' },
      { who:'noyugak',   text:'구후가…? 알겠소. 단단히 지키리다. 오늘은 객잔에 방을 잡아 두었으니 쉬시오.' },
      { who:'narr',      text:'세 사람이 분타를 나서려는 그때였다.' },
      { who:'noyugak', shake:true, text:'잠깐! 소협들, 잠시 기다리시오!' },
      { who:'noyugak',   text:'방금 제자들에게서 소식이 들어왔소. 구후의 무리가 절강 근처에 자리를 잡고 있다 하오.' },
      { who:'noyugak',   text:'바닷가 포구에 낯선 무인들이 드나든다는 보고요. 겉으로는 \'사파 연합 절강 지부\'라는 간판까지 내걸었다는구려.' },
      { who:'cheolmyeong', text:'화원파를 쓸어버리라 명한 놈이… 바로 코앞에 있다는 말이오?' },
      { who:'hero',      text:'직접 가서 확인해 보겠습니다. 놈들이 무엇을 꾸미는지 알아내야 합니다.' },
      { who:'cheonghwa', text:'함께 가겠습니다.' },
      { who:'noyugak',   text:'조심하시오. 구후는 백타산의 독공을 쓰는 자요.' },
      { who:'narr', shake:true, text:'그때, 분타 바깥에서 고함이 터져 나왔다.' },
      { cast:['madaeho','noyugak','seokun','jinsoyeon','hero'],
        who:'madaeho',   text:'장로님! 사파 연합 놈들이 분타로 몰려옵니다! 앞장선 놈은 검은 두건을 쓴 칼잡이입니다!' },
      { who:'noyugak',   text:'흑건도 사도결… 구후의 오른팔이 직접 나섰구먼.' },
      { who:'jinsoyeon', text:'물건을 되찾으러 온 거예요. 아니면… 이분들을 노리고.' },
      { who:'noyugak',   text:'물건은 이 늙은이가 안에서 지키겠네. 석운, 소연! 소협들을 도와 놈들을 막아라!' },
      { who:'seokun',    text:'맡겨만 주십쇼. 사부님께 배운 봉법, 오늘 제대로 써먹겠습니다.' },
      { who:'hero',      text:'저희를 쫓아온 자들입니다. 저희가 앞에 서겠습니다.' },
    ],
    end: { bg:'gaebang_branch_out', cast:['hero','cheonghwa','cheolmyeong'] },
    npcs: [
      { id:'seokun',    x:72, y:66, line:'다리 쪽 놈들은 내가 맡지. 왼쪽 부두로도 배가 들어올 거요. 채비는 서두르쇼!' },
      { id:'jinsoyeon', x:28, y:68, give:{ skill:'탄지신통 · 기초' },
        line:'사부님께 배운 탄지신통의 요령이에요. 손가락으로 기를 튕기는 법만 살짝 알려 드릴게요. 사형한테는 비밀이에요!',
        after:'저는 뒤에서 탄지신통으로 거들게요. 두 칸 떨어진 적까지 닿아요.' },
    ],
    sortie: 'gaebang_defense',      // 개방 분타 습격 (지도 007) → 승리 뒤 gaebang_after
  },

  // 분타 앞마당 (전투 뒤) : 사도결은 달아남 → 갈 영감 '구후는 이미 배를 타고 떠났다' → 지부를 치기로
  gaebang_after: {
    chapter:'제2장', place:'절강 개방 분타',
    bg:'gaebang_branch_out', cast:['seokun','jinsoyeon','hero','cheonghwa','cheolmyeong'],
    script: [
      { who:'narr',      text:'사도결은 남은 무리를 이끌고 포구 쪽으로 달아났다.' },
      { who:'seokun',    text:'쳇, 놓쳤군. 도망치는 발 하나는 빠른 놈이야.' },
      { cast:['noyugak','seokun','jinsoyeon','hero','cheolmyeong'],
        who:'noyugak',   text:'다친 사람은 없나?' },
      { who:'hero',      text:'다들 무사합니다. 장로님, 물건은요?' },
      { who:'noyugak',   text:'걱정 말게. 털끝 하나 건드리지 못했네.' },
      { who:'jinsoyeon', text:'분타까지 쳐들어왔다는 건, 이제 숨을 생각도 없다는 뜻이에요.' },
      { cast:['galyeong','noyugak','hero','cheonghwa','cheolmyeong'],
        who:'galyeong',  text:'장로님, 포구를 살피고 왔습니다. 놈들 지부의 연합 깃발 뒤로 천교의 깃발이 걸려 있더이다.' },
      { who:'galyeong',  text:'그리고 구후란 자는 열흘쯤 전에 이미 배를 타고 떠났다 하오.' },
      { who:'cheolmyeong', text:'…놈이 이미 떠났다고? 또 한발 늦었단 말이오.' },
      { who:'hero',      text:'그렇다면 지금 지부를 지키는 건 사도결뿐이겠군요.' },
      { who:'noyugak',   text:'놈이 숨을 고르기 전에 치는 게 좋겠네. 석운이와 소연이를 데려가게. 나머지 제자들은 분타를 지켜야 하니.' },
      { cast:['wangi','noyugak','hero','cheonghwa','cheolmyeong'],
        who:'wangi',     text:'포구 뒷길은 이 왕이가 훤하지요. 길잡이는 맡겨 주십쇼!' },
      { who:'cheolmyeong', text:'좋소. 구후가 없다면 그 오른팔부터 꺾어 놓겠소. 놈도 언제까지 숨어 있지는 못할 테니.' },
      { who:'hero',      text:'해가 지기 전에 끝냅시다.' },
    ],
    end: { bg:'gaebang_branch_out', cast:['hero','cheonghwa','cheolmyeong'] },
    npcs: [
      { id:'galyeong', x:72, y:66, give:{ item:'초급 영약' },
        line:'포구 약재상에게서 얻은 귀한 약이오. 늙은이보다는 젊은 사람이 먹어야지.',
        after:'지부 앞은 다리 하나로만 이어져 있소. 망루에 활 든 놈들이 있으니 다리 위에서 오래 머물지 마시오.' },
      { id:'wangi',    x:28, y:68, give:{ item:'금창약', n:2 },
        line:'길잡이 몫이오! 다리 위에서 다치면 이거라도 바르쇼.',
        after:'왼쪽 부두랑 다리 밑에도 배가 숨어 있을 거요. 뒤도 조심하쇼!' },
    ],
    sortie: 'sapa_branch_raid',        // 출정 → 아래 지부 앞 장면 → 대화가 끝나면 바로 전투
    sortieScene: 'sapa_branch_front',
  },

  // 사파 연합 절강 지부 앞 : 출정을 누르면 나오는 장면. 대화가 끝나면 바로 전투(fight)
  sapa_branch_front: {
    chapter:'제2장', place:'사파 연합 절강 지부',
    bg:'sapa_branch_zhejiang', cast:['hero','cheonghwa','cheolmyeong','seokun','jinsoyeon'],
    script: [
      { who:'narr',      text:'해 질 녘, 포구. \'사파 연합 절강 지부\'라는 현판 아래로 검은 깃발들이 나부꼈다.' },
      { who:'jinsoyeon', text:'겉으로는 연합 지부인데, 깃발마다 天 자가 박혀 있네요.' },
      { cast:['sado_gyeol','hero','cheonghwa','cheolmyeong','jinsoyeon'],
        who:'sado_gyeol', shake:true, text:'제 발로 찾아왔군. 쫓아갈 수고를 덜었다.' },
      { who:'hero',      text:'구후는 어디 있소?' },
      { who:'sado_gyeol', text:'그분은 너희 따위를 상대할 시간이 없으시다. 너희는 여기서 끝이다!' },
    ],
    fight: 'sapa_branch_raid',         // 대화가 끝나면 끝 화면 없이 바로 전투
    end: { bg:'sapa_branch_zhejiang', cast:['hero','cheonghwa','cheolmyeong'] },
    npcs: [],
    sortie: 'sapa_branch_raid',
  },

  // 지부 안마당 (전투 뒤) : 사도결을 사로잡음 → 분타로 데려가 심문
  sapa_branch_after: {
    chapter:'제2장', place:'사파 연합 절강 지부',
    bg:'sapa_branch_yard', cast:['sado_gyeol','seokun','jinsoyeon','hero','cheolmyeong'],
    script: [
      { who:'narr',       text:'사도결이 무릎을 꿇자, 남은 천교 무인들은 무기를 내던졌다.' },
      { who:'seokun',     text:'이번엔 못 도망가지. 소연아, 포승줄!' },
      { who:'jinsoyeon',  text:'혈도부터 짚어 둘게요. 내공을 못 쓰게요.' },
      { who:'hero',       text:'대계라니, 무슨 말이오?' },
      { who:'sado_gyeol', text:'흐흐… 곧 알게 될 거다. 양양도, 절강도… 그저 시작일 뿐이니.' },
      { cast:['cheolmyeong','sado_gyeol','cheonghwa','hero','seokun'],
        who:'cheolmyeong', shake:true, text:'시작이라고? 화원파를 쓸어버린 것도 네놈들에겐 시작에 불과했단 말이냐!' },
      { who:'cheonghwa',  text:'위지 대협, 참으십시오. 여기서 해치우면 아무것도 알아낼 수 없습니다.' },
      { who:'hero',       text:'분타로 데려갑시다. 장로님 앞에서 제대로 묻겠습니다.' },
    ],
    next: 'gaebang_interrogation',
  },

  // 개방 분타 안 (그날 밤) : 사도결 심문 → 남궁세가 모임을 아는 눈치 → 진소연 · 마대호 · 갈 영감이 안휘 남궁세가로 호송
  //   → 황용의 서신 (제갈세가에 들러 남궁세가로 함께 와 달라) → 석운 합류 → 절강의 사파 연합 해체를 노유각에게 부탁 → 구후 장면
  gaebang_interrogation: {
    chapter:'제2장', place:'절강 개방 분타',
    bg:'gaebang_branch', cast:['noyugak','sado_gyeol','hero','cheonghwa','cheolmyeong'],
    script: [
      { who:'narr',       text:'그날 밤, 개방 분타. 사도결은 기둥에 묶인 채 노유각 앞에 꿇어앉았다.' },
      { who:'noyugak',    text:'흑건도, 구후는 어디로 갔나?' },
      { who:'sado_gyeol', text:'본교로 가셨지. 어디인지는 알아도 말해 줄 생각은 없다.' },
      { who:'noyugak',    text:'황 방주의 물건은 왜 노렸나?' },
      { who:'sado_gyeol', text:'나는 명을 따랐을 뿐. 그게 무엇인지는 구후 님만 아신다.' },
      { who:'hero',       text:'대계란 무엇이오? 양양과 절강이 시작이라 했소.' },
      { who:'sado_gyeol', text:'흐흐… 정파 놈들이 한자리에 모인다지? 그날을 기다리는 게 너희만은 아니다.' },
      { who:'cheonghwa', shake:true, text:'…남궁세가의 모임을 알고 있단 말입니까?' },
      { who:'narr',       text:'사도결은 히죽 웃을 뿐, 그 뒤로는 입을 굳게 다물었다.' },
      { cast:['jinsoyeon','seokun','noyugak','sado_gyeol','hero'],
        who:'jinsoyeon',  text:'더는 입을 열 것 같지 않네요.' },
      { who:'noyugak',    text:'이자는 안휘의 남궁세가로 보내야겠네. 곧 정파의 어른들이 그곳에 모이시니, 그분들 앞에서 다시 캐물어야지.' },
      { who:'noyugak',    text:'소연, 마대호, 갈 영감. 너희가 이자를 남궁세가까지 데려가거라. 방주님께도 오늘 일을 직접 아뢰고.' },
      { who:'jinsoyeon',  text:'네, 장로님. 이번엔 털끝 하나 못 빠져나가게 할게요.' },
      { cast:['cheolmyeong','noyugak','seokun','jinsoyeon','hero'],
        who:'cheolmyeong', text:'…놈들이 그 모임을 노린다면, 남궁세가도 안전하지만은 않겠구려.' },
      { cast:['noyugak','hero','cheonghwa','cheolmyeong','seokun'],
        who:'noyugak',    text:'참, {소협|소저}. 방주님께서 {소협|소저}에게 따로 전해 달라 맡기신 서신이 있소.' },
      { cast:['huang','hero','cheonghwa','cheolmyeong','seokun'],
        who:'huang', name:'황용의 서신', text:'{name} {소협|소저}, 물건이 무사히 닿았다면 그 길로 제갈세가에 들러 주세요.' },
      { who:'huang', name:'황용의 서신', text:'가주님과 이번 일을 의논하고, 남궁세가 모임에 함께 와 달라 전해 주었으면 해요.' },
      { cast:['noyugak','hero','cheonghwa','cheolmyeong','seokun'],
        who:'cheonghwa',  text:'제갈세가라면 지모로 이름난 세가입니다. 힘을 보태 준다면 큰 힘이 되겠군요.' },
      { who:'noyugak',    text:'길이 멀 테니 석운이를 데려가게. 넉살은 좋아도 봉 하나는 쓸 만하네.' },
      { who:'seokun', join:'seokun', text:'헤헤, 장로님도 참. {소협|소저}, 잘 부탁하오!' },
      { who:'hero',       text:'든든합니다. 장로님, 떠나기 전에 한 가지 부탁이 있습니다.' },
      { who:'hero',       text:'절강에 남은 사파 연합을 흩어 주십시오. 그대로 두면 또 다른 사도결이 나올 겁니다.' },
      { who:'noyugak',    text:'걱정 말게. 남은 놈들은 개방이 맡아 깨끗이 해체하겠네.' },
      { bg:'gaebang_branch_out', cast:['hero','cheonghwa','cheolmyeong','seokun'],
        who:'narr',       text:'이튿날 새벽, 진소연 일행은 사도결을 끌고 안휘로, {name} 일행은 석운과 함께 제갈세가로 길을 떠났다.' },
    ],
    next: 'guhu_road',
  },

  // 본교로 가는 길의 사파 연합 지부 (산속) : 구후가 절강 · 양양 소식을 듣고 노발대발 → 본교로
  guhu_road: {
    chapter:'제2장', place:'본교로 가는 길',
    bg:'sapa_branch_gate', cast:['sapa_ganbu'],
    script: [
      { who:'narr',       text:'같은 무렵, 본교로 향하던 구후는 길목의 연합 지부에 머물고 있었다.' },
      { bg:'sapa_branch_court',
        who:'narr',       text:'그때, 전령 하나가 숨을 헐떡이며 뛰어들었다.' },
      { who:'npc', name:'천교 전령', text:'구후 님, 절강에서 급보입니다! 절강 지부가 무너졌습니다!' },
      { who:'npc', name:'천교 전령', text:'사도결 님은 개방에 사로잡히고, 남은 무리는 개방이 모조리 흩어 버렸다 합니다.' },
      { who:'sapa_ganbu', name:'구후', shake:true, text:'뭐라?! 사도결이… 그 애송이들에게?!' },
      { who:'sapa_ganbu', name:'구후', text:'{천씨 놈|천씨 계집}… 양양에서도, 적룡채에서도, 이번에도 또!' },
      { who:'narr',       text:'분이 가라앉기도 전에 또 다른 전령이 달려왔다.' },
      { who:'npc', name:'천교 전령', text:'양양에서도 소식입니다! 곽정과 성주가 손을 잡고 거점을 들쑤셔… 양양의 연합도 해체되었습니다.' },
      { who:'sapa_ganbu', name:'구후', shake:true, text:'양양과 절강을 하나로 묶은 지 얼마나 되었다고… 둘 다 잃었단 말이냐!' },
      { who:'sapa_ganbu', name:'구후', text:'이대로 본교에 아뢰면 무슨 꼴을 당할지…' },
      { who:'sapa_ganbu', name:'구후', text:'허나 돌아가지 않을 수도 없지. {천씨 놈|천씨 계집}, 다음에 만나면 합마공으로 뼈까지 부숴 주마.' },
      { who:'narr',       text:'구후는 이를 갈며 본교로 걸음을 돌렸다.' },
    ],
    next: 'nangya_arrival',
  },

  // ===================================================================
  //  제2장 (이어서) · 낭야성 (산동) — 제갈세가. 제3장은 남궁세가에 도착하면서
  //  그림이 아직 없어 배경은 임시 (data/assets.js 의 nangya_street · jegal_* — 다른 그림을 흐리게 깔고 글자를 박음)
  // ===================================================================
  // 낭야성 도착 → 제갈세가 정문에서 문전박대
  nangya_arrival: {
    chapter:'제2장', place:'낭야성',
    bg:'nangya_outskirts', cast:['hero','cheonghwa','cheolmyeong','seokun'],
    script: [
      { who:'narr',       text:'열흘 남짓 뒤, 일행은 제갈세가가 자리한 낭야성에 당도했다.' },
      { bg:'nangya_gate',
        who:'seokun',     text:'여기가 낭야성이오. 성 안에서는 제갈 소리만 들어도 다들 고개를 숙인다지.' },
      { bg:'nangya_street',
        who:'seokun',     text:'저기 저 커다란 장원이 제갈세가요. 문턱 높기로 소문난 곳이지.' },
      { bg:'jegal_gate',
        who:'hero',       text:'양양 천씨세가의 {name}이라 합니다. 가주님을 뵙고자 왔습니다.' },
      { who:'npc', name:'제갈세가 문지기', text:'가주님께서는 지금 아무도 만나지 않으십니다. 돌아가시오.' },
      { who:'cheonghwa',  text:'무당파의 청화입니다. 급한 일이니 말씀만이라도 전해 주시겠습니까?' },
      { who:'npc', name:'제갈세가 문지기', shake:true, text:'누구든 들이지 말라는 명이오. 돌아가시오!' },
      { who:'narr',       text:'대문이 쾅 닫혔다.' },
      { who:'seokun',     text:'서신을 꺼낼 틈도 안 주는군. 일단 객잔에 짐을 풀고 방법을 찾아봅시다.' },
    ],
    next: 'nangya_inn',
  },

  // 낭야성 객잔 : 제갈 가주가 쓰러졌다는 소문 → 안민회(녹림)가 보호세를 외침 → 녹림 두목이 주인공을 알아봄 → 바로 전투
  nangya_inn: {
    chapter:'제2장', place:'낭야성 객잔',
    bg:'nangya_inn', cast:['hero','cheonghwa','cheolmyeong','seokun'],
    script: [
      { who:'narr',       text:'저녁 무렵, 객잔은 손님들로 북적였다.' },
      { who:'npc', name:'손님 갑', text:'들었나? 제갈 가주님께서 알 수 없는 병으로 쓰러지셨다더군.' },
      { who:'npc', name:'손님 을', text:'벌써 보름째라지? 이름난 의원은 다 불렀는데 병명조차 모른다나.' },
      { who:'npc', name:'손님 갑', text:'소가주님도 손을 쓸 수 없다니, 안타까운 일이야.' },
      { who:'npc', name:'손님 을', text:'가주님이 저리 되시면 이제 이 성은 누가 지키나…' },
      { cast:['nokrim_boss','hero','cheonghwa','cheolmyeong','seokun'],
        who:'nokrim_boss', shake:true, text:'누가 지키긴! 우리가 있지 않으냐!' },
      { who:'nokrim_boss', text:'이 성은 이제 우리 안민회가 지킨다! 보호세만 꼬박꼬박 내면 아무 걱정 없을 거다!' },
      { who:'seokun',     text:'…저놈들 녹림이잖아? 녹림 놈들이 여기까지 와 있어?' },
      { who:'narr',       text:'겁을 먹은 손님들이 하나둘 자리를 떴다. 어느새 객잔에는 일행만 남았다.' },
      { who:'cheolmyeong', text:'우리도 조용히 나갑시다. 괜히 소란 피울 것 없소.' },
      { who:'nokrim_boss', text:'거기, 잠깐! …그 얼굴, 어디서 봤는데.' },
      { who:'nokrim_boss', shake:true, text:'너, 위에서 내려온 수배서의 {천씨 놈|천씨 계집} 아니냐?!' },
      { who:'nokrim_boss', text:'이게 웬 횡재냐! 얘들아, 놈을 잡아라!' },
      { who:'hero',       text:'조용히 지나가긴 글렀군요. 밖으로!' },
    ],
    fight: 'nangya_market',            // 대화가 끝나면 끝 화면 없이 바로 전투 (지도 003 임시)
    end: { bg:'nangya_street', cast:['hero','cheonghwa','cheolmyeong','seokun'] },
    npcs: [],
    sortie: 'nangya_market',
  },

  // 저잣거리 (전투 뒤) : 녹림 두목 심문 — 표행 · 위에서 내려온 명 · 제갈세가와의 다툼 → 풀어 줌
  nangya_market_after: {
    chapter:'제2장', place:'낭야성 저잣거리',
    bg:'nangya_street', cast:['nokrim_boss','hero','cheonghwa','cheolmyeong','seokun'],
    script: [
      { who:'narr',        text:'두목이 무릎을 꿇자 녹림도들은 무기를 내던졌다.' },
      { who:'cheolmyeong', text:'녹림이 왜 이 성까지 와서 보호세를 걷는 거냐?' },
      { who:'nokrim_boss', text:'우, 우리는 표행도 하오! 장사하는 사람들이란 말이오!' },
      { who:'seokun',      text:'산적질하던 놈들이 표국 흉내를 낸다고?' },
      { who:'nokrim_boss', text:'위에서 명이 내려왔소. 이 성에 자리를 잡고 제갈세가와의 다툼에서 이기라고…' },
      { who:'cheonghwa',   text:'제갈세가와 무엇을 다툰다는 겁니까?' },
      { who:'nokrim_boss', text:'자, 자세한 건 채주님이 아시오! 우리 같은 졸개가 뭘 알겠소. 제발 풀어 주시오!' },
      { who:'hero',        text:'…풀어 주겠소. 대신 다시 보호세를 걷다 눈에 띄면 그때는 용서하지 않겠소.' },
      { who:'narr',        text:'녹림도들은 허겁지겁 달아났다.' },
    ],
    next: 'nangya_inn_night',
  },

  // 객잔 (밤) : 대책 논의 → 소가주 제갈윤이 사과하러 찾아옴
  nangya_inn_night: {
    chapter:'제2장', place:'낭야성 객잔',
    bg:'nangya_inn', cast:['hero','cheonghwa','cheolmyeong','seokun'],
    script: [
      { who:'narr',       text:'일행은 객잔으로 돌아와 머리를 맞댔다.' },
      { who:'cheonghwa',  text:'가주가 쓰러진 틈을 타 녹림이 성을 차지하려 듭니다. 우연이라기엔 때가 너무 잘 맞습니다.' },
      { who:'seokun',     text:'어떻게든 가주를 만나야 할 텐데, 문턱부터 막혔으니…' },
      { who:'narr',       text:'그때, 객잔 문이 열리며 한 젊은이가 들어섰다.' },
      { cast:['jegal_yun','hero','cheonghwa','cheolmyeong','seokun'],
        who:'jegal_yun',  text:'천씨세가의 {name} {소협이|소저가} 묵고 계신 곳이 여기입니까?' },
      { who:'hero',       text:'제가 {name}입니다만…' },
      { who:'jegal_yun',  text:'제갈세가의 소가주, 제갈윤이라 합니다.' },
      { who:'jegal_yun',  text:'낮에 황 방주님의 손님이신 줄도 모르고 문전박대를 했습니다. 부디 용서해 주십시오.' },
      { who:'jegal_yun',  text:'저잣거리에서 녹림도를 물리친 분들이 있다기에 알아보았습니다. 개방의 소걸개와 함께라 하여 혹시나 했지요.' },
      { who:'hero',       text:'황 방주님의 서신을 가지고 왔습니다. 가주님을 뵐 수 있겠습니까?' },
      { who:'jegal_yun',  text:'…아버님은 말씀을 나누실 수 없는 처지입니다. 그래도 안으로 드시지요.' },
    ],
    next: 'jegal_house',
  },

  // 제갈세가 → 가주전 : 주인공 혼자 들어감 → 마공을 알아챔 → 암살자 습격 (정비 없이 바로 전투 — 지는 전투)
  jegal_house: {
    chapter:'제2장', place:'제갈세가',
    bg:'jegal_hall', cast:['jegal_yun','hero','cheonghwa','cheolmyeong','seokun'],
    script: [
      { who:'narr',       text:'일행은 제갈윤을 따라 세가 안, 가주전으로 들어섰다.' },
      { who:'jegal_yun',  text:'아버님께서는 보름 전 갑자기 쓰러지신 뒤로 깨어나지 못하고 계십니다.' },
      { who:'hero',       text:'녹림이 때맞춰 성에 들어온 걸 보면, 그냥 병이 아닐지도 모릅니다. 제가 한번 뵈어도 되겠습니까?' },
      { who:'jegal_yun',  text:'아버님 침소에는 한 분만 드실 수 있습니다. 세가의 법도라서요.' },
      { who:'cheolmyeong', text:'우리는 여기서 기다리겠소.' },
      { bg:'jegal_bedroom', cast:['jegal_hwi','hero'],
        who:'narr',       text:'가주전 깊은 곳의 침소. 제갈 가주가 핏기 없는 얼굴로 누워 있었다.' },
      { who:'hero',       text:'맥이… 이상하다. 기혈이 거꾸로 뒤틀려 있다. 이건 병이 아니야.' },
      { who:'hero',       text:'마공이다. 누군가 가주님께 마공을 쓴 거야.' },
      { who:'hero',       text:'서둘러 알려야—' },
      { who:'narr', shake:true, text:'돌아서는 순간, 서늘한 살기가 등 뒤를 덮쳤다.' },
      { cast:['assassin','hero'],
        who:'assassin',   text:'…보지 말아야 할 것을 보았군.' },
    ],
    fight: 'jegal_assassins',          // 정비 없이 바로 전투 (주인공 혼자 · 지게 되는 전투, 지도 009 가주 침소)
    end: { bg:'jegal_bedroom', cast:['hero'] },
    npcs: [],
    sortie: 'jegal_assassins',
  },

  // 가주전 (전투 뒤) : 일행 · 제갈윤이 달려옴 → 주인공이 정체를 말하려다 쓰러짐
  jegal_hall_after: {
    chapter:'제2장', place:'제갈세가 가주 침소',
    bg:'jegal_bedroom', cast:['hero','cheonghwa','cheolmyeong','jegal_yun','seokun'],
    script: [
      { who:'narr', shake:true, text:'{name}은 끝내 무릎을 꿇었다. 소란이 일자 암살자들은 그림자처럼 사라졌다.' },
      { who:'cheonghwa',  text:'{name} {소협|소저}!' },
      { who:'jegal_yun',  text:'가주전에서 무슨 일이…!' },
      { who:'cheolmyeong', text:'정신 차리시오!' },
      { who:'hero',       text:'…알았습니다… 가주님을 해친 자들의 정체를… 그건…' },
      { who:'narr',       text:'말을 다 잇지 못한 채, {name}은 정신을 잃었다.' },
    ],
    next: 'jegal_wake',
  },

  // 사흘 뒤 (세가 객방) : 깨어나 말하려는데 가주가 숨을 거둠 → 세가에서 내보냄
  jegal_wake: {
    chapter:'제2장', place:'제갈세가 객방',
    bg:'jegal_guestroom', cast:['hero','cheonghwa','cheolmyeong','seokun'],
    script: [
      { who:'narr',       text:'사흘 뒤.' },
      { who:'cheonghwa',  text:'깨어나셨군요! 사흘이나 깨어나지 못하셔서…' },
      { who:'hero',       text:'사흘이나…? 소가주님께 드릴 말씀이 있습니다. 가주님은—' },
      { who:'narr', shake:true, text:'그때, 세가 안에 곡소리가 울려 퍼졌다.' },
      { who:'npc', name:'세가 하인', text:'가주님께서… 가주님께서 돌아가셨습니다!' },
      { cast:['jegal_yun','hero','cheonghwa','cheolmyeong','seokun'],
        who:'jegal_yun',  text:'…아버님.' },
      { who:'jegal_yun',  text:'{소협|소저}, 죄송합니다. 지금 세가는 경황이 없습니다. 장례를 마치면 다시 모시겠습니다.' },
      { who:'hero',       text:'소가주님, 꼭 드려야 할 말씀이—' },
      { who:'npc', name:'세가 무사', text:'소가주님의 명이오. 오늘은 돌아가 주시오.' },
    ],
    next: 'nangya_inn_end',
  },

  // 객잔 : 일행에게만 털어놓음 → 남궁세가로
  nangya_inn_end: {
    chapter:'제2장', place:'낭야성 객잔',
    bg:'nangya_inn', cast:['hero','cheonghwa','cheolmyeong','seokun'],
    script: [
      { who:'narr',       text:'일행은 하는 수 없이 객잔으로 돌아왔다.' },
      { who:'seokun',     text:'대체 가주전에서 무얼 본 거요?' },
      { who:'hero',       text:'가주님은 병이 아니었습니다. 마공에 당하신 겁니다.' },
      { who:'hero',       text:'저를 습격한 암살자들… 그 기운이 가주님을 해친 마공과 같았습니다.' },
      { who:'hero',       text:'게다가 놈들은 세가 깊은 가주전의 길을 훤히 알고 있었습니다. 세가 안에 놈들과 통하는 자가 있습니다.' },
      { who:'cheonghwa',  text:'…세가에 말해도 쉽게 믿어 주지 않겠군요.' },
      { who:'cheolmyeong', text:'장례 중인 세가에 함부로 들이밀 수도 없소.' },
      { who:'hero',       text:'남궁세가로 갑시다. 정파의 어른들께 이 일을 알려야 합니다.' },
      { who:'seokun',     text:'사매랑 사도결 놈도 거기 있을 테니, 마침 잘됐군.' },
    ],
    next: 'anhui_road',
  },

  // ===================================================================
  //  제2장 끝 · 남궁세가로 가는 길 → 제3장 · 정파의 회합 (안휘성 · 남궁세가)
  // ===================================================================
  // 안휘로 가는 고갯길 : 석 달의 약속 · 제갈세가 · 남궁세가 이야기
  anhui_road: {
    chapter:'제2장', place:'안휘로 가는 길',
    bg:'anhui_outskirts', cast:['hero','cheonghwa','cheolmyeong','seokun'],
    script: [
      { who:'narr',        text:'낭야성을 떠난 지 여드레. 일행은 안휘로 넘어가는 고갯길을 걷고 있었다.' },
      { who:'seokun',      text:'이 고개만 넘으면 안휘요. 남궁세가까지는 반나절이면 닿을 거요.' },
      { who:'cheonghwa',   text:'사조님과 약속한 석 달이 거의 찼군요. 무당산에서 헤어진 게 엊그제 같은데.' },
      { who:'cheolmyeong', text:'그 석 달 동안 참 많은 일이 있었소. 철검문, 적룡채, 절강… 그리고 제갈세가까지.' },
      { who:'hero',        textM:'…제갈 가주님을 끝내 구하지 못했습니다. 눈앞에서 놈들을 놓쳤습니다.',
                           textF:'…제갈 가주님을 끝내 구하지 못했습니다. 조금만 더 일찍 닿았더라면.' },
      { who:'cheonghwa',   text:'{소협|소저} 탓이 아닙니다. 마공을 알아챈 것도, 암살자를 막아선 것도 {소협|소저}였습니다.' },
      { who:'seokun',      text:'그나저나 어른들이 그 이야기를 믿어 줄지 걱정이오. 증좌가 하나도 없으니.' },
      { who:'cheolmyeong', text:'사도결이 있지 않소. 놈은 남궁세가 모임을 알고 있었소.' },
      { who:'hero',        text:'그날을 기다리는 게 정파만이 아니라고 했지요. 어른들께 반드시 알려야 합니다.' },
      { who:'seokun',      text:'헤헤, 그러려면 일단 문 앞에서 쫓겨나지 말아야지. 남궁세가 문턱은 제갈세가보다 더 높다던데.' },
      { who:'cheonghwa',   text:'…설마 또 문전박대를 당하겠습니까.' },
      { who:'seokun',      text:'제왕검가라는 별명이 괜히 붙은 게 아니오. 가 보면 아실 거요.' },
    ],
    next: 'anhui_arrival',
  },

  // ================= 제3장 · 정파의 회합 =================
  // 안휘성 저잣거리 : 소림사 → 화산파 → 화북팽가가 차례로 지나감
  anhui_arrival: {
    chapter:'제3장', title:'정파의 회합', place:'안휘성 저잣거리',
    bg:'anhui_street', cast:['hero','cheonghwa','cheolmyeong','seokun'],
    script: [
      { who:'narr',        text:'안휘성. 남궁세가가 자리한 성 안은 여느 때와 달리 술렁이고 있었다.' },
      { who:'seokun',      text:'사람이 왜 이리 많아? 장날도 아닌데.' },
      { who:'narr',        text:'그때 길 저편에서 낮은 목탁 소리가 들려왔다. 사람들이 하나둘 길을 비켰다.' },
      // ---- 소림사 ----
      { cast:['mujin','baekun','hero','cheonghwa','seokun'],
        who:'narr',        text:'누런 가사를 걸친 승려들이 줄지어 걸어왔다. 맨 앞 노승의 걸음은 느렸지만 흔들림이 없었다.' },
      { who:'seokun',      text:'소림사요! 앞의 분이 방장 무진 대사, 그 옆 노인은… 태상장로 백운 노사로군. 저 어른이 산문 밖에 나오는 건 몇십 년 만이라던데.' },
      { who:'baekun',      text:'무당의 도포로군. 장 진인은 강녕하신가?' },
      { who:'cheonghwa',   text:'예, 노사님. 떠나올 때 무탈하셨습니다.' },
      { who:'baekun',      text:'허허, 그 늙은이가 우리를 다 불러 모았으니 이번엔 얼굴 좀 보겠구먼. 곽정이 녀석도 왔다지? 북협이니 뭐니 해도 내 눈엔 아직 우직한 몽골 소년이야.' },
      { who:'mujin',       text:'아미타불. 태상장로님, 가시지요.' },
      // ---- 화산파 ----
      { cast:['hwasan_munju','hwasan_hyeonwon','hwasan_hyeonjeok','hero','cheolmyeong'],
        who:'narr',        text:'소림의 행렬이 지나가자, 이번엔 반대편에서 \'華山\' 두 글자를 새긴 깃발이 나타났다.' },
      { who:'seokun',      text:'화산파요. 화산을 연 육소평 조사가 전진칠자의 마지막 제자였다지. 지금 문주 청송진인은 그 수제자고.' },
      { who:'hwasan_hyeonjeok', text:'어? 저기, 양양의 그 {소협|소저} 아니오!' },
      { who:'hwasan_hyeonwon',  text:'사부님, 양양에서 말씀드린 천씨세가의 {name} {소협|소저}입니다. 그리고 이분이…' },
      { who:'hwasan_munju', text:'…자네가 화원파의 위지 문주인가.' },
      { who:'cheolmyeong', text:'…화원파의 마지막 문주, 위지렴이오.' },
      { who:'hwasan_munju', text:'사 년 전 화원파가 무너질 때 화산은 끝내 가지 못했네. 문주인 내 허물이야. 미안하네.' },
      { who:'cheolmyeong', text:'…제자분들께 이미 들었소. 화산은 화원파를 잊은 적이 없다고.' },
      { who:'hwasan_munju', text:'잊지 않았네. 앞으로도 잊지 않을 걸세.' },
      { who:'cheolmyeong', text:'…그거면 됐소.' },
      { who:'hwasan_hyeonjeok', text:'위지 대협, 이번엔 칼 뽑지 마시오. 사부님 앞이오.' },
      { who:'hwasan_munju', text:'곽 대협도 이미 성에 와 계시네. 곧 마주칠 걸세.' },
      // ---- 화북팽가 ----
      { cast:['paeng_cheonho','paeng_soho','hero','seokun','cheonghwa'],
        who:'narr',        text:'화산의 일행이 떠나자마자, 말발굽 소리와 함께 우렁찬 웃음소리가 거리를 뒤흔들었다.' },
      { who:'paeng_cheonho', shake:true, text:'하하하! 길을 비켜라! 화북팽가가 납신다!' },
      { who:'seokun',      text:'화북팽가… 도 하나로 하북을 휘어잡은 팽가요. 큰 칼을 멘 분이 가주 팽천호, 별호는 광도.' },
      { who:'paeng_cheonho', text:'사파 놈들이 설친다기에 칼이 근질근질해서 한달음에 달려왔다! 어디 있느냐, 사파 놈들!' },
      { who:'paeng_soho',  text:'아버님, 여긴 저잣거리입니다. 사파 대신 장사꾼들이 놀라 달아나잖습니까.' },
      { who:'paeng_soho',  text:'이봐, 거기 개방 형씨! 이 근처에 좋은 술집 아시오?' },
      { who:'seokun',      text:'헤헤, 술이라면 개방이 빠삭하지.' },
      { who:'paeng_soho',  only:'f', text:'오, 이런 곳에 이런 소저가? 팽가의 소가주 팽소호요. 이름을 여쭤도 되겠소?' },
      { who:'hero',        only:'f', text:'천씨세가의 {name}입니다. 길을 막고 계십니다만.' },
      { who:'paeng_soho',  only:'f', text:'하하, 이거 단단히 혼났군!' },
      { who:'paeng_cheonho', text:'소호! 쓸데없는 소리 말고 따라와라! 남궁 영감이 기다린다!' },
      { cast:['hero','cheonghwa','cheolmyeong','seokun'],
        who:'cheonghwa',   text:'…정파에도 참 여러 분이 계시는군요.' },
      { who:'cheolmyeong', text:'저 정도 기세면 사파도 한 번은 움찔하겠소.' },
    ],
    next: 'anhui_guo',
  },

  // 저잣거리 : 곽정과 다시 만남 → 제갈 가주의 죽음을 알림 → 함께 남궁세가로
  anhui_guo: {
    chapter:'제3장', place:'안휘성 저잣거리',
    bg:'anhui_street', cast:['guo','hero','cheonghwa','cheolmyeong','seokun'],
    script: [
      { who:'guo',         text:'{name} {소협|소저}! 청화 도장, 위지 대협도 무사했구려.' },
      { who:'hero',        text:'곽 대협! 석 달 만에 뵙습니다.' },
      { who:'guo',         text:'석운이도 왔구나. 네 사부가 걱정 많이 하더라. 사고 치지 말라고.' },
      { who:'seokun',      text:'헤헤… 사부님은요?' },
      { who:'guo',         text:'용아는 양양에 남았소. 상단 일이 아직 끝나지 않아서. 개방 몫은 내가 듣고 가기로 했지.' },
      { who:'guo',         text:'그런데 제갈세가와 함께 오는 줄 알았는데, 어찌 너희만 왔소?' },
      { who:'hero',        text:'…제갈 가주님께서 돌아가셨습니다.' },
      { who:'guo', shake:true, text:'무어라?' },
      { who:'hero',        text:'병이 아니라 마공이었습니다. 가주님 침소에서 암살자들과 마주쳤습니다.' },
      { who:'hero',        text:'놈들은 침소로 드는 길을 훤히 알고 있었습니다. 세가 안에 놈들과 통하는 자가 있습니다.' },
      { who:'guo',         text:'…제갈 가주까지. 사도결이 말한 \'대계\'가 이것이었나.' },
      { who:'guo',         text:'이 일은 어른들 앞에서 직접 말씀드리시오. 오늘 저녁 남궁세가 가주전에 모두 모이기로 했소. 같이 갑시다.' },
    ],
    next: 'namgung_gate',
  },

  // 남궁세가 정문 : 진소연 · 사도결 소식 → 소가주 남궁진 · 남궁설
  namgung_gate: {
    chapter:'제3장', place:'남궁세가 정문',
    bg:'namgung_gate', cast:['guo','hero','cheonghwa','cheolmyeong','seokun'],
    script: [
      { who:'narr',        text:'남궁세가. 높은 담장 위로 \'南\' 자 깃발이 바람에 펄럭였다.' },
      { cast:['jinsoyeon','seokun','hero','guo','cheonghwa'],
        who:'jinsoyeon',   text:'사형! {소협|소저}! 사도결은 지하 뇌옥에 가뒀어요. 아직도 입을 다물고 있지만요.' },
      { who:'seokun',      text:'사매! 고생했다.' },
      { cast:['namgung_jin','guo','hero','cheonghwa','cheolmyeong'],
        who:'namgung_jin', text:'곽 대협, 어서 오십시오. 아버님께서 기다리고 계십니다. …그런데 이분들은?' },
      { who:'guo',         text:'양양 천씨세가의 가주와 그 일행이오. 이번 모임에 함께할 사람들이오.' },
      { who:'namgung_jin', text:'천씨세가… 십 년 전에 문을 닫은 세가로 알고 있습니다만.' },
      { who:'hero',        text:'문은 닫혔어도 사람은 남았습니다.' },
      { who:'namgung_jin', text:'…그렇군요. 실례했습니다. 남궁세가의 소가주, 남궁진입니다.' },
      { cast:['namgung_seol','namgung_jin','hero','cheonghwa','cheolmyeong'],
        who:'namgung_seol', text:'오라버니, 말씀이 너무 딱딱하세요. 남궁설이에요. 먼 길 오시느라 고생 많으셨죠?' },
      { who:'namgung_seol', textM:'천씨세가의 가주가 이렇게 젊은 분일 줄은 몰랐네요.',
                            textF:'가주라길래 수염 난 어른인 줄 알았는데, 저랑 나이도 비슷하시겠네요.' },
      { who:'namgung_jin', text:'설아. 손님들께서 쉬셔야 한다.' },
      { who:'namgung_jin', text:'회의는 저녁 무렵 가주전에서 열립니다. 그때 모시러 오겠습니다.' },
    ],
    next: 'namgung_hall',
  },

  // 남궁세가 가주전 : 대책 회의 → 정도연합 · 수장 곽정 · 천교 토벌
  namgung_hall: {
    chapter:'제3장', place:'남궁세가 가주전',
    bg:'namgung_hall', cast:['namgung_wi','mujin','baekun','hwasan_munju','paeng_cheonho'],
    script: [
      { who:'narr',          text:'해 질 무렵, 남궁세가 가주전. 소림의 무진 대사와 백운 노사, 화산의 청송진인, 화북팽가의 팽천호, 북협 곽정이 둘러앉았다.' },
      { who:'narr',          text:'상석에는 남궁세가의 가주, 제왕검 남궁위가 앉아 있었다.' },
      { who:'namgung_wi',    text:'먼 길 오시느라 수고들 하셨소. 정파의 어른들이 이 남궁의 집에 모이니 감회가 새롭구려.' },
      { who:'paeng_cheonho', text:'감회는 됐고! 장 진인은 아직이오? 사람을 불러 놓고 제일 늦는구먼!' },
      { who:'narr',          text:'그때 가주전의 문이 소리 없이 열렸다.' },
      { cast:['zhang','mujin','baekun','cheonghwa','hero'],
        who:'zhang',         text:'허허, 늙으면 걸음이 느려지는 법이지. 다들 오랜만일세.' },
      { who:'mujin',         text:'아미타불. 장 진인, 강녕하셨습니까.' },
      { who:'baekun',        text:'이 늙은이, 그 얼굴 보러 소림에서 여기까지 왔소이다.' },
      { who:'zhang',         text:'허허, 백운 자네도 아직 정정하구먼. …청화야, 얼굴이 좀 탔구나. 산 밖 바람이 어떻더냐.' },
      { who:'cheonghwa',     text:'…많이 배웠습니다, 사조님.' },
      { who:'zhang',         text:'그래. 그럼 시작하지. 곽 대협, 그동안 살핀 것을 들려주게.' },
      { cast:['guo','namgung_wi','hero','cheolmyeong','cheonghwa'],
        who:'guo',           text:'양양과 절강의 사파 연합은 해체했습니다. 허나 그 위에 \'천교\'가 있습니다. 간부가 일곱이고, 구후라는 자가 그중 하나입니다.' },
      { who:'guo',           text:'그 일에는 이 젊은이들의 공이 컸습니다. 천씨세가의 {name}과 그 일행입니다.' },
      { who:'namgung_wi',    text:'천씨? 그 무너진 천씨세가 말이오? 이런 자리에 몰락한 세가의 애송이가 낄 자리가 있던가.' },
      { who:'cheolmyeong', shake:true, text:'뭐라…!' },
      { who:'hero',          text:'위지 대협. …몰락한 세가의 애송이라도, 보고 온 것은 말씀드릴 수 있습니다.' },
      { who:'hero',          text:'제갈 가주님께서 돌아가셨습니다.' },
      { cast:['paeng_cheonho','namgung_wi','hero','baekun','hwasan_munju'],
        who:'narr',          text:'가주전이 순식간에 얼어붙었다.' },
      { who:'paeng_cheonho', shake:true, text:'제갈 영감이?!' },
      { who:'hero',          text:'마공이었습니다. 기혈이 거꾸로 뒤틀려 있었고, 그 자리에서 암살자 셋에게 습격을 받았습니다.' },
      { who:'hero',          text:'놈들은 침소로 드는 길을 알고 있었습니다. 제갈세가 안에 천교와 통하는 자가 있습니다.' },
      { who:'baekun',        text:'…기혈을 거꾸로 뒤트는 수법이라. 이 늙은이가 젊을 적에 딱 한 번 본 적이 있소. 다시는 보고 싶지 않았던 것이지.' },
      { cast:['mujin','baekun','hero','hwasan_munju','paeng_cheonho'],
        who:'mujin',         text:'태상장로님, 그것이 무엇입니까?' },
      { who:'baekun',        text:'지금 입에 올릴 것은 못 되네. 확인할 것이 있으니, 때가 되면 말하겠네.' },
      { who:'hwasan_munju',  text:'사도결이라는 자가 말했다지요. 정파가 모이는 날을 기다리는 게 우리만이 아니라고.' },
      { who:'paeng_cheonho', text:'오라 하시오! 한꺼번에 몰려오면 팽가의 칼로 한꺼번에 쓸어 주지!' },
      { cast:['namgung_wi','guo','zhang','hero','paeng_cheonho'],
        who:'namgung_wi',    text:'남궁의 담을 넘을 자는 천하에 없소. 사도결이란 놈도 남궁의 뇌옥에서 사흘이면 입을 열 게요.' },
      { who:'guo',           text:'각 문파가 따로 움직여서는 제갈세가처럼 하나씩 당할 뿐입니다. 힘을 하나로 모아야 합니다.' },
      // ---- 연합의 이름 · 수장 · 천교 토벌 ----
      { who:'zhang',         text:'옳은 말이네. 그럼 이름부터 정하세. 정파가 바른 길을 지키려 모였으니… \'정도연합\'이라 하면 어떻겠나.' },
      { cast:['mujin','hwasan_munju','zhang','namgung_wi','paeng_cheonho'],
        who:'mujin',         text:'아미타불. 좋은 이름입니다.' },
      { who:'hwasan_munju',  text:'그렇다면 연합을 이끌 사람도 정해야겠지요. 손발이 맞지 않으면 모인 뜻이 없습니다.' },
      { who:'namgung_wi',    text:'옳소. 그 일은 이 회의를 연 남궁이 맡겠소.' },
      { who:'paeng_cheonho', text:'하! 남궁 영감, 속셈이 그거였소? 팽가는 남의 깃발 아래 서는 법이 없소!' },
      { who:'namgung_wi',    text:'그럼 팽가가 이끌겠다는 말이오? 칼밖에 모르는 집안이?' },
      { who:'paeng_cheonho', shake:true, text:'뭐라?!' },
      { who:'zhang',         text:'허허, 두 분 다 그만들 하게. …내 생각엔 곽 대협이 좋겠네. 양양을 지켜 온 북협이라면 누구도 마다하지 않을 게야.' },
      { cast:['guo','baekun','zhang','mujin','hwasan_munju'],
        who:'guo',           text:'진인, 저는 양양을 지켜야 하는 몸입니다. 그런 자리는…' },
      { who:'baekun',        text:'이 녀석아, 양양을 지키는 일도 결국 천하를 지키는 일 아니더냐. 맡거라.' },
      { who:'mujin',         text:'소림은 곽 대협을 따르겠습니다.' },
      { who:'hwasan_munju',  text:'화산도 같은 뜻입니다.' },
      { cast:['paeng_cheonho','namgung_wi','guo','zhang','hero'],
        who:'paeng_cheonho', text:'곽 대협이라면 팽가도 군말 없소!' },
      { who:'namgung_wi',    text:'……좋소. 다만 연합의 본진은 이 남궁세가에 두겠소.' },
      { who:'zhang',         text:'그리하세.' },
      { who:'guo',           text:'…무거운 짐을 받았습니다. 힘이 닿는 데까지 해 보겠습니다.' },
      { who:'guo',           text:'그럼 연합의 첫 일을 정하겠습니다. 천교를 칩니다. 제갈세가의 일까지 더는 두고 볼 수 없습니다.' },
      { who:'guo',           text:'개방은 용아가 맡아 천교 본교의 행방을 쫓을 겁니다. 본교를 찾는 대로 각 문파의 정예를 모아 토벌에 나서겠습니다.' },
      { who:'paeng_cheonho', text:'그 말을 기다렸소! 팽가의 칼은 언제든 준비돼 있소!' },
      { cast:['zhang','hero','cheonghwa','cheolmyeong','seokun'],
        who:'zhang',         text:'{name} {소협|소저}, 잘 버텨 주었네. 제갈세가의 일은 자네가 아니었으면 묻혔을 게야.' },
      { who:'hero',          textM:'…아직 아무것도 끝나지 않았습니다. 놈들을 끝까지 쫓겠습니다.',
                             textF:'살아서 여기까지 왔으니, 이제부터 갚아 나가겠습니다.' },
      { cast:['namgung_wi','hero','zhang','guo','cheonghwa'],
        who:'narr',          text:'남궁위의 차가운 눈길이 {name}에게 잠시 머물렀다.' },
    ],
    next: 'namgung_alarm',
  },

  // 가주전 (회의가 끝날 무렵) : 성 곳곳에 마인 → 문파마다 흩어짐 → 주인공이 홀로 저잣거리로
  namgung_alarm: {
    chapter:'제3장', place:'남궁세가 가주전',
    bg:'namgung_hall', cast:['namgung_wi','hero','zhang','guo','cheonghwa'],
    script: [
      { who:'narr',          text:'그렇게 회의가 마무리되려던 그때, 가주전 밖이 소란스러워졌다.' },
      { cast:['namgung_guard','hero','namgung_wi','zhang','guo'],
        who:'namgung_guard', shake:true, text:'가주님! 큰일 났습니다! 성 안 곳곳에 마인들이 나타났습니다!' },
      { who:'namgung_wi',    text:'마인이라니?' },
      { who:'namgung_guard', text:'눈이 시뻘겋고, 사람을 닥치는 대로 해치고 있습니다! 동문, 서문, 저잣거리까지…!' },
      { cast:['baekun','hwasan_munju','namgung_wi','hero','paeng_cheonho'],
        who:'baekun',        text:'…역시. 그 수법이 다시 세상에 나왔군.' },
      { who:'hwasan_munju',  text:'사도결이 말한 \'그날\'이 바로 오늘이었던 겁니다.' },
      { cast:['namgung_wi','namgung_jin','paeng_cheonho','paeng_soho','hero'],
        who:'namgung_wi',    text:'진아, 남궁의 무사들을 이끌고 동문으로 가거라!' },
      { who:'namgung_jin',   text:'예, 아버님!' },
      { who:'paeng_cheonho', text:'서문은 팽가가 맡겠소! 소호, 따라와라!' },
      { who:'paeng_soho',    text:'하하, 술보다 이쪽이 더 당기는군요!' },
      { cast:['mujin','hwasan_munju','guo','hero','zhang'],
        who:'mujin',         text:'소림은 남쪽 거리의 백성들을 지키겠습니다.' },
      { who:'hwasan_munju',  text:'화산은 북쪽을 맡지요.' },
      { cast:['hero','cheonghwa','cheolmyeong','seokun','guo'],
        who:'hero',          text:'저잣거리는 제가 맡겠습니다. 혼자 가겠습니다.' },
      { who:'cheonghwa', shake:true, text:'혼자서라니요! 위험합니다, {소협|소저}!' },
      { who:'hero',          text:'모두 흩어져야 할 때입니다. 이 소동이 놈들의 눈속임이라면, 노리는 건 뇌옥의 사도결일지도 모릅니다.' },
      { who:'hero',          text:'청화 도장, 위지 대협, 석운 소협. 세가와 뇌옥을 지켜 주십시오.' },
      { who:'cheolmyeong',   text:'…알겠소. 대신 꼭 살아서 돌아오시오.' },
      { who:'seokun',        text:'헤헤, 마인 놈들한테 우리 몫도 좀 남겨 두시오!' },
      { who:'guo',           text:'몸조심하시오, {name} {소협|소저}.' },
      { cast:['namgung_wi','hero'],
        who:'namgung_wi',    text:'흥. 애송이가 제법이군. 어디 천씨의 검이 얼마나 하는지 보지.' },
      { bg:'anhui_street', cast:['hero'],
        who:'narr',          text:'{name}은 검을 쥐고 저잣거리로 내달렸다.' },
    ],
    end: { bg:'anhui_street', cast:['hero'] },
    npcs: [],
    sortie: 'anhui_majin',             // 출정 → 아래 저잣거리 장면 → 대화가 끝나면 바로 전투 (주인공 혼자)
    sortieScene: 'anhui_market_majin',
  },

  // 안휘성 저잣거리 : 출정을 누르면 나오는 장면. 마인들이 사람들을 덮침 → 바로 전투
  anhui_market_majin: {
    chapter:'제3장', place:'안휘성 저잣거리',
    bg:'anhui_street', cast:['hero'],
    script: [
      { who:'narr',  text:'저잣거리는 아수라장이었다. 뒤집힌 좌판 사이로 사람들이 비명을 지르며 달아났다.' },
      { cast:['majin','hero'],
        who:'narr',  text:'눈이 시뻘건 자들이 짐승처럼 울부짖으며 사람들을 덮치고 있었다.' },
      { who:'majin', text:'크르르… 피… 피를…' },
      { who:'hero',  text:'모두 객잔 안으로 피하시오! 이놈들은 내가 맡겠소!' },
      { who:'hero',  text:'자, 이쪽이다!' },
    ],
    fight: 'anhui_majin',              // 대화가 끝나면 끝 화면 없이 바로 전투 (지도 003 임시)
    end: { bg:'anhui_street', cast:['hero'] },
    npcs: [],
    sortie: 'anhui_majin',
  },

  // 저잣거리 (전투 뒤) — 임시 : 다음 이야기 흐름을 받으면 이어 쓰기
  anhui_majin_after: {
    chapter:'제3장', place:'안휘성 저잣거리',
    bg:'anhui_street', cast:['hero'],
    script: [
      { who:'narr',  text:'마지막 마인이 쓰러지자, 저잣거리에 무거운 정적이 내려앉았다.' },
      { who:'hero',  text:'…사람이었다. 기혈이 거꾸로 뒤틀린 채로.' },
      { who:'hero',  textM:'천교 놈들… 사람을 이렇게까지 만들다니.',
                     textF:'…살아남은 사람들부터 돌봐야 해.' },
      { who:'narr',  text:'멀리 남궁세가 쪽에서는 아직도 쇳소리가 그치지 않고 있었다.' },
    ],
    end: { bg:'anhui_street', cast:['hero'] },
    npcs: [],
    sortie: null,                      // 다음 전투는 아직 없음
  },
};
