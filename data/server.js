/* =====================================================================
   서버 저장 (Firebase — 구글 계정 로그인 + Firestore)
   ---------------------------------------------------------------------
   - Firebase 콘솔 → 프로젝트 설정 → 내 앱(웹) 의 firebaseConfig 값을 아래 firebase 칸에 그대로 붙여 넣기
   - 비워 두면(null) 서버 저장 기능은 숨겨지고, 지금처럼 이 브라우저에만 저장
   - 서버 저장은 웹 주소(https://…)로 접속했을 때만 동작. html 파일을 직접 열면 지금처럼 브라우저 저장
   - apiKey 등은 공개돼도 괜찮은 값. 남의 저장을 못 건드리게 막는 건 Firestore 규칙 (README 의 '서버 저장')
   - 저장 위치 : users/{로그인한 사람 uid}/saves/s0 ~ s14  (저장 칸 하나 = 문서 하나)
   ===================================================================== */
const SERVER = {
  firebase: {
    apiKey: 'AIzaSyASqbFOAYV1T8WIqu52X6fMlHog3YmpovU',
    authDomain: 'ganghorok.firebaseapp.com',
    projectId: 'ganghorok',
    storageBucket: 'ganghorok.firebasestorage.app',
    messagingSenderId: '915548095774',
    appId: '1:915548095774:web:f22b46fabf59e0e2d2350f',
  },
  // 예)
  // firebase: {
  //   apiKey: 'AIza…',
  //   authDomain: 'ganghorok.firebaseapp.com',
  //   projectId: 'ganghorok',
  //   storageBucket: 'ganghorok.firebasestorage.app',
  //   messagingSenderId: '1234567890',
  //   appId: '1:1234567890:web:abcdef',
  // },
  sdkVersion: '12.18.0',    // Firebase JS SDK 버전 (www.gstatic.com/firebasejs/버전/…)
};
