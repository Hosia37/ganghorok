/* =====================================================================
   기록 (거점 → 집무실 → 인물 · 세력)
   ---------------------------------------------------------------------
   - 이야기가 진행되면 저절로 채워짐. 쪽지(note) 하나 = 한 줄 기록
       from : 이 장면이 끝나면 (또는 다음 장면으로 넘어가면) 보임 — data/scenes.js 의 장면 이름
       text : 기록 내용 ({name} = 주인공 이름)
       name : (선택) 이 쪽지부터 이름이 바뀜 (예: '사파 간부' → '구후')
   - 새로 보이는 쪽지가 생기면 화면 가운데에 '기록이 갱신되었습니다' 알림, 집무실에 ! 표시
   - 인물 : face = 얼굴 그림 (data/units.js 의 인물 id, 주인공은 'hero')
   - 세력 : icon = 동그라미 안 글자
   - 새 인물 · 세력을 넣거나 쪽지를 덧붙이면 그대로 반영됨 (순서 = 목록 순서)
   ===================================================================== */
const CODEX = {
  people: [
    { id:'hero', face:'hero', name:'{name}', tag:'천씨세가',
      notes: [
        { from:'prologue',            text:'천씨세가의 후인. 사파에게 쫓겨 다니다 무당파를 찾아가던 길에, 무한성 앞에서 곽정 · 황용을 만났다.' },
        { from:'wudang',              text:'십 년 전 몽골군이 양양을 덮쳤을 때 가문이 무너졌다. {누이 명화|오라버니 명우}도 그날 잃었다. 가전 무공을 이은 사람은 이제 혼자뿐이다.' },
        { from:'wudang',              text:'몇 해 전부터 사파가 천씨의 남은 핏줄을 찾아 죽이려 해, 이곳저곳을 떠돌며 숨어 지냈다.' },
        { from:'yangyang',            text:'몇 해 만에 양양으로 돌아왔다. 떠도는 동안 남은 식솔들이 성주의 도움으로 장원을 지켜 왔다. 이제는 숨지 않기로 했다.' },
        { from:'cheolgeom_hall_talk', text:'철검문주가 어린 시절의 {name}을 알아보았다. 천씨세가의 마지막 핏줄이자 가주다.' },
        { from:'yangyang_lord_trial', text:'천씨세가의 멸문이 천교가 내린 첫 명령이었음을 알게 되었다.' },
        { from:'yangyang_inn_cheonghwa', textM:'누이를 앗아 간 원수를 잊지 않았다. 구후만은 제 손으로 끝내겠다고 했다. 청화는 원한에 먹히지 말라고 당부했다.',
                                         text:'가문이 무너질 때 식솔들은 원수를 갚아 달라는 대신 살아 달라고 부탁했다. 살아 있어야 기회도 있다고 여긴다.' },
      ] },
    { id:'cheonghwa', face:'cheonghwa', name:'청화', tag:'무당파',
      notes: [
        { from:'wudang',       text:'무당파 2대제자이자 대사형. 장삼봉을 사조님이라 부른다.' },
        { from:'wudang_after', text:'장삼봉의 허락을 받아 산을 내려와, {name}과 함께 사파의 움직임을 살핀다.' },
        { from:'yangyang_inn_cheonghwa', text:'아픔을 겪고도 마음을 다스리는 {name}과 위지렴을 보며, 사조가 산을 내려가라 한 뜻을 깨닫고 더 강해지기로 했다.' },
      ] },
    { id:'cheolmyeong', face:'cheolmyeong', name:'위지렴', tag:'화원파',
      notes: [
        { from:'yangyang_after',      text:'화산파의 속가 화원파의 문주였다. 철검문에 멸문당한 뒤 산에서 사냥꾼으로 지냈다. 화원파의 원한을 풀기 위해 일행에 합류했다.' },
        { from:'cheolgeom_hall_talk', text:'철검문주의 사과를 받고, 진짜 원수는 사파 연합의 간부라며 복수를 다짐했다.' },
        { from:'yangyang_heart',      text:'화원파가 무너질 때 오지 않은 화산파에 서운함을 품고 있지만, 결국은 약했던 자신의 탓이라 여긴다.' },
        { from:'anhui_arrival',       text:'안휘에서 화산파 문주 청송진인의 사과를 받았다. \'그거면 됐다\'고 했다.' },
        { from:'yangyang_lord_trial', text:'4년 전 관원 · 구후 · 철검문주의 아버지가 거래하던 자리를 본 탓에 화원파가 멸문당했음을 알게 되었다.' },
      ] },
    { id:'guo', face:'guo', name:'곽정', tag:'북협 · 개방',
      notes: [
        { from:'prologue',         text:'북협. 무한성 앞에서 사파에게 쫓기던 {name}을 구해 주었다.' },
        { from:'wudang_after',     text:'개방 형제들과 사파의 길목을 살피며, 석 달 뒤 남궁세가에서 다시 만나기로 했다.' },
        { from:'yangyang_lord',    text:'양양성의 방어를 맡아 지금껏 성을 지켜 왔다.' },
        { from:'yangyang_guo_inn', text:'십삼 년 전 화산논검 전까지 서독 구양봉에게 시달렸다. 백타산의 장로 구후의 이름을 들은 적이 있다.' },
        { from:'yangyang_traitor_trial', text:'성주의 영패를 받아 황용과 함께 한수상단을 조사하기로 했다.' },
        { from:'namgung_hall',           text:'남궁세가의 회의에서 정도연합의 수장으로 뽑혔다. 연합의 첫 일로 천교 토벌을 정했다.' },
      ] },
    { id:'huang', face:'huang', name:'황용', tag:'개방',
      notes: [
        { from:'prologue',         text:'곽정과 함께 다니는 여협. 눈치가 빠르고 말솜씨가 좋다.' },
        { from:'wudang',           text:'개방의 방주. 장삼봉은 그를 황 방주라 부른다.' },
        { from:'yangyang_guo_inn', text:'천교에 \'사해용왕\'이라는 자와 백타산의 후인이 있고, 해남파까지 합류했다는 소식을 전했다.' },
        { from:'yangyang_traitor_trial', text:'사로잡은 배신 문원의 낯빛만 보고 한수상단과의 끈을 알아챘다.' },
        { from:'yangyang_errand',        text:'절강성 개방 분타에 전할 중요한 물건을 {name} 일행에게 맡겼다.' },
        { from:'jeokryong_inside',       text:'황용이 맡긴 물건은 구후가 \'되찾아야 한다\'며 노리는 것이었다.' },
        { from:'gaebang_interrogation',  text:'절강 분타에 서신을 남겨, {name}에게 제갈세가에 들러 남궁세가 모임에 함께 와 달라 청해 줄 것을 부탁했다.' },
      ] },
    { id:'zhang', face:'zhang', name:'장삼봉', tag:'무당파',
      notes: [
        { from:'wudang',       text:'무당파의 진인. {name}의 선친과 연이 있어, 그 검을 기억하고 있다.' },
        { from:'wudang_after', text:'사파의 규합을 경계해, 구파일방과 오대세가를 석 달 뒤 남궁세가로 불러 모으기로 했다.' },
        { from:'namgung_hall', text:'남궁세가의 회의에서 정파의 연합에 \'정도연합\'이라는 이름을 붙이고, 곽정을 수장으로 천거했다.' },
      ] },
    { id:'cheolgeom_sahyeong', face:'cheolgeom_sahyeong', name:'철검문 대사형', tag:'철검문',
      notes: [
        { from:'yangyang',         text:'철검문 무리를 이끄는 대사형. 저잣거리에서 일행과 시비가 붙었다.' },
        { from:'yangyang_trail',   text:'관아의 관원에게 철검문의 뇌물을 바치고, 저잣거리의 소란을 덮어 달라 청했다.' },
        { from:'cheolgeom_coup',   text:'문주의 편에 서서, 연합에 붙은 배신자들과 싸웠다.' },
      ] },
    { id:'cheolgeom_munju', face:'cheolgeom_munju', name:'철검문주', tag:'철검문',
      notes: [
        { from:'cheolgeom_visit',     text:'철검문의 문주. 젊은 시절 천씨세가에 목숨을 빚졌다. 사파 연합의 협박에 굴복해 연합의 간부가 되었고, 본보기로 부친을 잃었다.' },
        { from:'cheolgeom_coup',      text:'천씨를 감쌌다는 이유로 연합에서 추방되자, 배신한 문원들과 연합의 간부에게 맞서 검을 뽑았다.' },
        { from:'cheolgeom_hall_talk', text:'화원파의 일을 위지렴에게 사죄했다. 어린 시절의 {name}을 기억하고 있다.' },
        { from:'yangyang_lord_trial', text:'관원의 말에 따르면, 4년 전 그의 아버지가 구후 · 관원과 거래하던 자리에 있었다. 문주는 아직 이 사실을 모른다.' },
        { from:'cheolgeom_revisit',   text:'문도 절반이 배신해 세가 줄었지만, 정비를 마치면 천교와 전쟁을 치르겠다고 했다.' },
      ] },
    { id:'sapa_ganbu', face:'sapa_ganbu', name:'사파 간부', tag:'천교',
      notes: [
        { from:'cheolgeom_coup',      text:'사파 연합의 간부. 창을 쓰는 절정의 고수. 천씨를 감쌌다며 철검문주를 추방하러 왔다가 철검문 안마당에서 물러났다.' },
        { from:'yangyang_lord_trial', name:'구후', text:'천교의 간부 일곱 중 하나로, 양양 지부를 맡은 구후. 십 년 전 천씨세가를, 사 년 전 화원파를 없애라 명했다.' },
        { from:'yangyang_guo_inn',    text:'철검문에서는 창으로 정체를 숨겼지만, 기를 모으는 자세와 독 냄새로 보아 합마공과 뱀독을 쓰는 백타산의 장로이자 구양봉의 후인으로 보인다.' },
        { from:'jeokryong_inside',    text:'사파 무인들을 보내 적룡채에 은자를 쥐여 주고, 황용의 물건을 든 일행을 막게 했다.' },
        { from:'zhejiang_branch',     text:'그 무리가 절강 바닷가 포구에 자리를 잡고 있다고 한다.' },
        { from:'cheongyo_meeting',    text:'절강 지부장이 죽자 지부를 수습하러 절강에 와 있었다. 양양 지부와 절강 지부를 하나로 묶은 일을 아뢰러 본교로 떠나며, 절강 지부를 사도결에게 맡겼다.' },
        { from:'gaebang_after',       text:'{name} 일행이 절강에 닿기 열흘쯤 전, 이미 배를 타고 절강을 떠났다.' },
        { from:'guhu_road',           text:'본교로 가던 길에 절강 지부가 무너지고 양양의 연합까지 해체되었다는 소식을 듣고 노발대발했다. 이를 갈며 본교로 돌아갔다.' },
      ] },
    { id:'yangyang_lord', face:'yangyang_lord', name:'양양 성주', tag:'양양성',
      notes: [
        { from:'yangyang_lord',       text:'양양성의 성주. {name}의 선친에게 입은 은혜를 갚고자 그동안 물자를 보내 장원을 도왔다. 어린 {name}을 사고뭉치로 기억한다.' },
        { from:'yangyang_lord_trial', text:'사파와 내통한 관원을 잡아들여 직접 심문했다.' },
        { from:'yangyang_traitor_trial', text:'관과 무림은 서로 간섭하지 않는다는 관례를 넘어, 양양성의 안위를 위해 곽정에게 영패를 내주었다.' },
      ] },
    { id:'hwasan_hyeonwon', face:'hwasan_hyeonwon', name:'현원', tag:'화산파',
      notes: [
        { from:'yangyang_hwasan',       text:'사파 연합을 조사하러 양양에 내려온 화산파의 제자. 차분하고 예의 바르다.' },
        { from:'yangyang_hwasan_after', text:'화원파가 무너질 때 오지 못한 것을 사죄하고, 이제는 돕겠다고 했다.' },
        { from:'yangyang_lord',         text:'{name} 일행과 함께 사파 조사에 합류했다.' },
      ] },
    { id:'hwasan_hyeonjeok', face:'hwasan_hyeonjeok', name:'현적', tag:'화산파',
      notes: [
        { from:'yangyang_hwasan',       text:'현원과 같은 문하의 화산파 제자. 말과 검이 거칠고 곧다.' },
        { from:'yangyang_hwasan_after', text:'먼저 간 화원파 사람들에게 화산의 이름으로 사죄했다.' },
        { from:'yangyang_heart',        text:'"화산은 화원파를 잊은 적이 없다"는 말을 위지렴에게 전해 달라 부탁했다.' },
        { from:'anhui_arrival',         text:'사부 청송진인을 모시고 안휘의 모임에 왔다.' },
      ] },
    { id:'noyugak', face:'noyugak', name:'노유각', tag:'개방',
      notes: [
        { from:'zhejiang_branch', text:'개방의 장로. 절강 분타를 맡고 있다. 황용의 물건을 받아 분타 안에서 지켰다.' },
        { from:'gaebang_interrogation', text:'사로잡은 사도결을 심문한 뒤, 정파의 어른들 앞에서 다시 캐묻도록 남궁세가로 보냈다.' },
        { from:'gaebang_interrogation', text:'{name}의 부탁을 받아, 절강에 남은 사파 연합을 개방이 맡아 해체하기로 했다.' },
      ] },
    { id:'seokun', face:'seokun', name:'석운', tag:'개방',
      notes: [
        { from:'zhejiang_branch', text:'별호는 소걸개. 황용의 수제자로, 개방의 다음 방주감으로 꼽힌다. 넉살 좋고 장난스럽지만 봉을 잡으면 달라진다.' },
        { from:'zhejiang_branch', text:'물건이 무사히 닿는지 보라는 황용의 명으로 사매 진소연과 함께 먼저 절강에 와 있었다.' },
        { from:'gaebang_interrogation', text:'노유각의 말에 따라 {name} 일행과 함께 제갈세가로 길을 떠났다.' },
      ] },
    { id:'jinsoyeon', face:'jinsoyeon', name:'진소연', tag:'개방',
      notes: [
        { from:'zhejiang_branch', text:'황용의 수제자이자 석운의 사매. 사부를 닮아 눈치 빠르고 말이 야무지다. 도화도의 탄지신통을 쓴다.' },
        { from:'gaebang_interrogation', text:'마대호 · 갈 영감과 함께 사도결을 남궁세가로 데려갔다.' },
      ] },
    { id:'sado_gyeol', face:'sado_gyeol', name:'사도결', tag:'천교',
      notes: [
        { from:'cheongyo_meeting', text:'별호는 흑건도. 구후의 오른팔로, 구후가 본교에 간 사이 절강 지부를 맡았다. {name} 일행을 죽이라는 명을 받았다.' },
        { from:'gaebang_after',     text:'직접 무리를 이끌고 개방 절강 분타를 습격했다가, 패하고 포구의 지부로 달아났다.' },
        { from:'sapa_branch_after', text:'사파 연합 절강 지부에서 {name} 일행에게 사로잡혔다. \'대계는 이미 움직이기 시작했다\'는 말을 남겼다.' },
        { from:'gaebang_interrogation', text:'개방 분타에서 심문을 받았지만, 구후의 행방도 물건의 정체도 털어놓지 않았다. 정파가 남궁세가에 모이는 일을 알고 있는 눈치였다.' },
        { from:'gaebang_interrogation', text:'진소연 일행에게 끌려 안휘의 남궁세가로 보내졌다.' },
        { from:'namgung_gate',          text:'남궁세가의 지하 뇌옥에 갇혔다. 아직도 입을 다물고 있다.' },
      ] },
    { id:'jegal_hwi', face:'jegal_hwi', name:'제갈휘', tag:'제갈세가',
      notes: [
        { from:'nangya_inn',       text:'제갈세가의 가주. 보름 전 알 수 없는 병으로 쓰러져 깨어나지 못했다.' },
        { from:'jegal_house',      text:'{name}은 가주가 병이 아니라 마공에 당한 것임을 알아챘다.' },
        { from:'jegal_wake',       text:'끝내 숨을 거두었다.' },
      ] },
    { id:'jegal_yun', face:'jegal_yun', name:'제갈윤', tag:'제갈세가',
      notes: [
        { from:'nangya_inn_night', text:'제갈세가의 소가주. 황 방주의 손님을 문전박대했다며 몸소 객잔을 찾아와 사과했다.' },
        { from:'jegal_wake',       text:'아버지를 잃고, 장례를 이유로 {name} 일행을 세가 밖으로 내보냈다.' },
      ] },
    { id:'jeokryong_chief', face:'jeokryong_chief', name:'적룡채주', tag:'녹림 · 적룡채',
      notes: [
        { from:'jeokryong_inside', text:'녹림 적룡채의 채주. 천교에 버려진 스물두 채를 이끌고 양양과 절강을 잇는 길목에서 약탈했다.' },
        { from:'jeokryong_inside', text:'구후의 심부름꾼에게 은자를 받고 황용의 물건을 든 일행을 막으려 했다. {name}에게 진 뒤 적룡채를 이끌고 천씨세가의 사람이 되었다.' },
      ] },
    { id:'namgung_wi', face:'namgung_wi', name:'남궁위', tag:'남궁세가',
      notes: [
        { from:'namgung_hall',  text:'남궁세가의 가주. 별호는 제왕검. 몰락한 천씨세가를 애송이라 깔보았다.' },
        { from:'namgung_hall',  text:'연합을 이끌겠다고 나섰다가 곽정이 수장으로 뽑히자, 연합의 본진을 남궁세가에 두는 것으로 물러섰다.' },
      ] },
    { id:'namgung_jin', face:'namgung_jin', name:'남궁진', tag:'남궁세가',
      notes: [
        { from:'namgung_gate',  text:'남궁세가의 소가주. 깍듯하지만 차갑다. 천씨세가를 \'문을 닫은 세가\'로 알고 있었다.' },
      ] },
    { id:'namgung_seol', face:'namgung_seol', name:'남궁설', tag:'남궁세가',
      notes: [
        { from:'namgung_gate',  text:'남궁위의 딸이자 남궁진의 누이. 오라비와 달리 살갑다.' },
      ] },
    { id:'hwasan_munju', face:'hwasan_munju', name:'청송진인', tag:'화산파',
      notes: [
        { from:'anhui_arrival', text:'화산파의 문주. 화산을 연 육소평 조사의 수제자이며, 현원 · 현적의 사부다.' },
        { from:'anhui_arrival', text:'화원파가 무너질 때 가지 못한 것을 문주의 허물이라며 위지렴에게 사과했다.' },
      ] },
    { id:'paeng_cheonho', face:'paeng_cheonho', name:'팽천호', tag:'화북팽가',
      notes: [
        { from:'anhui_arrival', text:'화북팽가의 가주. 별호는 광도. 호탕하고 성미가 급하다.' },
        { from:'namgung_hall',  text:'남궁위가 연합을 이끌겠다고 하자 \'팽가는 남의 깃발 아래 서지 않는다\'며 맞섰다. 곽정이라면 따르겠다고 했다.' },
      ] },
    { id:'paeng_soho', face:'paeng_soho', name:'팽소호', tag:'화북팽가',
      notes: [
        { from:'anhui_arrival', text:'화북팽가의 소가주. 팽천호의 아들. 술을 좋아하는 한량이다.' },
      ] },
    { id:'baekun', face:'baekun', name:'백운', tag:'소림사',
      notes: [
        { from:'anhui_arrival', text:'소림사의 태상장로. 몇십 년 만에 산문 밖으로 나왔다. 장삼봉과 오랜 벗이고, 곽정을 어릴 적부터 알았다.' },
        { from:'namgung_hall',  text:'기혈을 거꾸로 뒤트는 마공을 젊을 적에 한 번 본 적이 있다고 했다. 무엇인지는 아직 말하지 않았다.' },
      ] },
    { id:'mujin', face:'mujin', name:'무진', tag:'소림사',
      notes: [
        { from:'anhui_arrival', text:'소림사의 방장. 태상장로 백운과 함께 안휘의 모임에 왔다.' },
      ] },
    { id:'yangyang_official', face:'yangyang_official', name:'관원', tag:'양양 관아',
      notes: [
        { from:'yangyang_trail',      text:'양양 관아의 관원. 철검문의 뇌물을 받고 저잣거리의 소란을 덮어 주었다.' },
        { from:'yangyang_lord_trial', text:'십 년 전부터 구후와 손잡고, 사파가 양양에 자리 잡도록 눈을 감아 주었다. 처형을 앞두고 있다.' },
      ] },
  ],
  factions: [
    { id:'cheonssi', icon:'家', name:'천씨세가',
      notes: [
        { from:'wudang',              text:'양양의 무가. 십 년 전 몽골군이 양양을 덮쳤을 때 무너졌다. 몇 해 전부터 사파가 남은 핏줄을 쫓고 있다.' },
        { from:'yangyang',            text:'남은 식솔들이 성주의 도움으로 양양의 장원을 지켜 왔다. 지금의 거점이다.' },
        { from:'yangyang_lord_trial', text:'양양 제일의 세가였지만 오대세가에 들지 못해 뒤를 봐줄 곳이 없었고, 그래서 천교의 첫 표적이 되었다.' },
      ] },
    { id:'mudang', icon:'武', name:'무당파',
      notes: [
        { from:'wudang',       text:'장삼봉이 이끄는 정파의 대문파. 산문 밖의 공격과 경내의 자객을 한꺼번에 맞았다.' },
        { from:'wudang_after', text:'붙잡은 자객들의 옷깃에 처음 보는 같은 문양이 수놓아져 있었다.' },
      ] },
    { id:'gaebang', icon:'丐', name:'개방',
      notes: [
        { from:'wudang_after',     text:'황용이 방주로 있는 문파. 강남 곳곳에서 사파가 사람을 모은다는 소식을 모으고 있다.' },
        { from:'yangyang_guo_inn', text:'천교라는 이름이 개방에도 몇 번 흘러들었다.' },
        { from:'yangyang_errand',  text:'절강성에 분타가 있다. 황용이 그곳에 전할 물건을 {name} 일행에게 맡겼다.' },
        { from:'zhejiang_branch',  text:'절강 분타에 황용의 물건을 전했다. 분타주가 구후 무리의 소식을 알려 주었다.' },
        { from:'gaebang_after',    text:'절강 분타가 사도결의 습격을 받았지만, {name} 일행과 석운 · 진소연이 막아 냈다.' },
        { from:'gaebang_interrogation', text:'사로잡은 사도결을 진소연 · 마대호 · 갈 영감이 안휘의 남궁세가로 호송했다. 절강에 남은 사파 연합은 개방이 맡아 해체하기로 했다.' },
      ] },
    { id:'cheolgeom', icon:'鐵', name:'철검문',
      notes: [
        { from:'yangyang',            text:'양양의 문파. 저잣거리에서 자릿세를 뜯으며 위세를 부린다.' },
        { from:'yangyang_after',      text:'몇 해 사이에 세를 불려 사파 연합의 간부 자리를 꿰찼고, 이웃 군소 문파들을 짓밟았다.' },
        { from:'yangyang_trail',      text:'관아에 뇌물을 바쳐 비호를 받고 있다.' },
        { from:'cheolgeom_visit',     text:'사파 연합이 문도들의 가족을 볼모로 잡아 억지로 끌어들인 것이었다.' },
        { from:'cheolgeom_coup',      text:'문원 일부가 연합에 붙어 배신했으나, 문주가 연합과 갈라서며 배신자 대부분을 처단했다. 몇은 달아났다.' },
        { from:'cheolgeom_revisit',   text:'문도 절반이 배신해 떠났다. 새 문도를 받아 정비한 뒤 천교와 싸울 생각이다.' },
      ] },
    { id:'hwawon', icon:'花', name:'화원파',
      notes: [
        { from:'yangyang_after',      text:'화산파의 속가 문파. 위지렴이 문주였다. 철검문에 멸문당했다.' },
        { from:'yangyang_lord_trial', text:'사 년 전, 문주 위지렴이 구후의 거래 자리를 목격한 탓에 멸문당했다.' },
      ] },
    { id:'hwasan', icon:'華', name:'화산파',
      notes: [
        { from:'yangyang_hwasan',       text:'화원파의 본산. 현원과 현적이 사파 연합을 조사하러 양양에 왔다.' },
        { from:'yangyang_hwasan_after', text:'화원파가 무너지던 무렵, 화산도 일이 있어 산문 밖으로 사람을 낼 수 없었다.' },
        { from:'yangyang_heart',        text:'그 무렵 화산 역시 사파의 습격을 받았다고 한다.' },
        { from:'anhui_arrival',         text:'전진칠자의 마지막 제자 육소평이 화산에 연 문파. 지금 문주는 그의 수제자 청송진인이다.' },
      ] },
    { id:'cheongyo', icon:'敎', name:'사파 연합',
      notes: [
        { from:'prologue',            text:'무한성 앞에서 천씨세가의 생존자를 쫓던 사파 무리. 스스로 \'우리 교\'라 했다.' },
        { from:'wudang_after',        text:'흩어져 있던 사파가 한 깃발 아래 모이고 있다. 누군가 뒤에서 판을 짜고 있다.' },
        { from:'yangyang_after',      text:'양양에서는 철검문이 연합의 간부 자리를 차지하고 있다.' },
        { from:'cheolgeom_hall_talk', text:'몇 해 전 생겨났으며, 맹주가 누구인지는 간부들조차 모른다. 간부마다 맡은 땅이 있어 관아를 매수하고, 정파의 작은 문파부터 하나씩 삼킨다.' },
        { from:'yangyang_lord_trial', name:'천교 (사파 연합)', text:'스스로를 천교(天敎)라 부른다. 간부는 일곱. 근래 생긴 연합이라지만, 이미 십 년 전부터 숨어서 움직이던 세력이었다.' },
        { from:'yangyang_guo_inn',    text:'\'사해용왕\'이라 불리는 자와 백타산의 후인이 있고, 해남파까지 합류했다고 한다.' },
        { from:'cheongyo_meeting',    text:'절강에 지부가 있다. 겉으로는 \'사파 연합 절강 지부\'를 내걸었지만, 안에는 천교의 깃발이 걸려 있다.' },
        { from:'sapa_branch_after',   text:'절강 지부가 {name} 일행과 개방에 무너졌다. 사도결은 \'대계\'가 이미 움직이기 시작했다고 했다.' },
        { from:'gaebang_interrogation', text:'사로잡힌 사도결의 말로 보아, 정파가 남궁세가에 모이는 일을 이미 알고 있는 듯하다.' },
        { from:'guhu_road',             text:'양양과 절강의 연합이 모두 해체되었다.' },
        { from:'namgung_alarm',         text:'정도연합이 생긴 날, 안휘성 곳곳에 눈이 시뻘건 마인들이 나타났다. 제갈 가주를 해친 마공과 같은 뿌리로 보인다.' },
      ] },
    { id:'baektasan', icon:'駝', name:'백타산',
      notes: [
        { from:'yangyang_guo_inn', text:'서독 구양봉의 문파. 장로 구후가 있었다. 합마공과 뱀독을 쓴다.' },
      ] },
    { id:'haenam', icon:'海', name:'해남파',
      notes: [
        { from:'yangyang_guo_inn', text:'천교에 합류했다는 소문이 있다.' },
      ] },
    { id:'namgung', icon:'南', name:'남궁세가',
      notes: [
        { from:'wudang_after',     text:'안휘의 세가. 정파가 석 달 뒤 이곳에 모이기로 했다.' },
        { from:'yangyang_guo_inn', text:'곽정이 천교의 일을 알리기로 했다.' },
        { from:'gaebang_interrogation', text:'개방이 사로잡은 사도결을 이곳으로 보냈다. 천교가 이곳의 모임을 노리고 있을지도 모른다.' },
        { from:'namgung_gate',          text:'\'제왕검가\'라 불린다. 가주 남궁위, 소가주 남궁진, 딸 남궁설.' },
        { from:'namgung_hall',          text:'정도연합의 본진이 되었다.' },
      ] },
    { id:'shaolin', icon:'少', name:'소림사',
      notes: [
        { from:'anhui_arrival', text:'정파의 큰 기둥. 방장 무진 대사와 태상장로 백운 노사가 안휘의 모임에 왔다.' },
      ] },
    { id:'paeng', icon:'彭', name:'화북팽가',
      notes: [
        { from:'anhui_arrival', text:'도 하나로 하북을 휘어잡은 세가. 가주 팽천호와 소가주 팽소호가 왔다.' },
      ] },
    { id:'jeongdo', icon:'正', name:'정도연합',
      notes: [
        { from:'namgung_hall',  text:'남궁세가에 모인 정파가 손잡은 연합. 이름은 장삼봉이 지었고, 수장은 곽정, 본진은 남궁세가.' },
        { from:'namgung_hall',  text:'첫 일은 천교 토벌. 개방이 천교 본교의 행방을 쫓고, 찾는 대로 각 문파의 정예가 모인다.' },
        { from:'namgung_alarm', text:'연합이 생긴 바로 그날, 안휘성 곳곳에 마인들이 나타났다.' },
      ] },
    { id:'nokrim', icon:'林', name:'녹림 · 적룡채',
      notes: [
        { from:'zhejiang_road',    text:'산채들의 무리, 녹림. 그중 적룡채가 양양과 절강을 잇는 길목을 틀어쥐고 통행세를 뜯었다.' },
        { from:'jeokryong_inside', text:'녹림 대채주가 천교에 들어가며 쉰 채가 따라 입교했고, 스물두 채는 버려졌다. 버려진 산채들을 이끈 것이 적룡채다.' },
        { from:'jeokryong_inside', text:'{name}에게 져서 약탈을 그만두고 천씨세가의 사람이 되었다. 부르면 언제든 달려오겠다고 약속했다.' },
        { from:'nangya_inn',          name:'녹림', text:'천교에 들어간 녹림은 산동 낭야성에서 \'안민회\'라는 이름을 내걸고 보호세를 걷는다.' },
        { from:'nangya_market_after', text:'안민회는 표행도 한다. 위에서 \'제갈세가와의 다툼에서 이기라\'는 명이 내려왔다고 한다. 자세한 것은 채주가 안다.' },
      ] },
    { id:'jegal', icon:'諸', name:'제갈세가',
      notes: [
        { from:'gaebang_interrogation', text:'산동 낭야성의 세가. 지모로 이름난 가문이다. 황용이 남궁세가 모임에 함께 와 달라 청하려 한다.' },
        { from:'nangya_inn',            text:'가주가 보름 전 알 수 없는 병으로 쓰러졌다. 그 틈에 안민회가 성을 넘보고 있다.' },
        { from:'nangya_inn_end',        text:'가주 제갈휘는 마공에 당해 끝내 숨을 거두었다. 가주전의 길을 아는 암살자들로 보아, 세가 안에 천교와 통하는 자가 있는 듯하다.' },
        { from:'namgung_hall',          text:'가주의 죽음과 세가 안의 내통자 이야기가 정파의 어른들에게 알려졌다.' },
      ] },
    { id:'hansu', icon:'商', name:'한수상단',
      notes: [
        { from:'yangyang_traitor_trial', text:'양양성 바로 옆에 자리 잡은 상인 무리. 요즘 드나드는 짐이 부쩍 늘었다. 사로잡은 배신 문원이 이 이름에 식은땀을 흘렸다. 곽정과 황용이 조사에 나섰다.' },
      ] },
    { id:'yangyang', icon:'襄', name:'양양성',
      notes: [
        { from:'yangyang_lord',       text:'성주가 다스리고, 북협 곽정이 성의 방어를 맡고 있다.' },
        { from:'yangyang_lord_trial', text:'관아의 관원이 십 년 전부터 사파와 내통해 왔다.' },
        { from:'yangyang_traitor_trial', text:'관무불가침의 관례를 넘어, 성주가 한수상단 조사에 영패를 내주었다.' },
      ] },
  ],
};

/* =====================================================================
   열전 (상태 화면 '열전' 탭 · 집무실 기록 · 인물의 맨 위)
   - 키 : 인물 id (주인공은 'hero', 구후는 기록의 id 'sapa_ganbu')
   - alias : 별호 · text : 열전 ({name} = 주인공 이름, textM / textF = 남 / 여 주인공일 때)
   - from : (선택) 이 장면을 지나야 기록에 열전이 보임 (정체가 드러나기 전에 보이지 않게)
   ===================================================================== */
const BIOS = {
  hero: { alias:'천씨의 검',
    textM:'양양 천씨세가의 마지막 핏줄이자 가주. 십 년 전 몽골군이 양양을 덮친 난리 속에 가문과 누이 명화를 잃었다. 그 뒤로 천씨의 핏줄을 쫓는 사파를 피해 떠돌며 가전 검법을 홀로 갈고닦았다. 말수는 적지만, 원수의 이름 앞에서는 눈빛이 달라진다.',
    textF:'양양 천씨세가의 마지막 핏줄이자 가주. 십 년 전 몽골군이 양양을 덮친 난리 속에 가문과 오라버니 명우를 잃었다. 식솔들은 원수를 갚아 달라는 대신 살아 달라고 했고, 그 당부대로 몸을 숨기며 내공을 다져 왔다. 차분하지만 한번 정한 일은 끝까지 해낸다.' },
  cheonghwa: { alias:'무당 대사형',
    text:'장삼봉을 사조로 모시는 무당파 2대제자이자 대사형. 사조의 허락을 받아 산을 내려와 {name}과 함께 사파를 쫓는다. 예의 바르고 고지식하지만, 동료가 위태로우면 누구보다 먼저 앞을 막는다.' },
  cheolmyeong: { alias:'화원파 문주',
    text:'화산파 속가 화원파의 마지막 문주. 사 년 전 문파가 멸문한 뒤 산에서 사냥꾼으로 숨어 지냈다. 사냥으로 다진 활 솜씨로 일행의 뒤를 받친다. 겉으로는 무뚝뚝하나 정이 깊다.' },
  seokun: { alias:'소걸개',
    text:'황용의 수제자이자 개방의 다음 방주감. 넉살과 장난기가 넘치지만 봉을 잡으면 사람이 달라진다. 개방의 날랜 몸놀림으로 적진을 휘젓는다.' },
  sapa_ganbu: { alias:'백타산 장로 · 천교 간부', from:'yangyang_guo_inn',
    text:'서독 구양봉의 백타산에서 장로를 지낸 자. 천교 일곱 간부 중 하나로 양양 지부를 맡아 천씨세가와 화원파의 멸문을 명했다. 창으로 정체를 숨기지만, 합마공과 뱀독을 쓴다.' },
  sado_gyeol: { alias:'흑건도', from:'sapa_branch_after',
    text:'검은 두건을 쓴 구후의 오른팔. 구후가 본교로 간 사이 절강 지부를 맡아 개방 분타를 덮쳤다가, 지부에서 {name} 일행에게 사로잡혔다. 휘몰아치는 도법이 날래다.' },
  jeokryong_chief: { alias:'녹림 적룡채주', from:'jeokryong_inside',
    text:'천교에 버려진 녹림 스물두 채를 이끈 사내. 바위도 부수는 괴력으로 맞받아친다. {name}에게 진 뒤 적룡채를 이끌고 천씨세가의 사람이 되었다.' },
};
