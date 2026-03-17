# Google Apps Script 배포 후 테스트 체크리스트

1. Apps Script를 웹 앱으로 재배포합니다.
2. 프론트 신청 폼에서 한글 자유 텍스트(예: "함수 그래프가 어려워요. 개념부터 다시 잡고 싶어요")를 입력해 제출합니다.
3. Apps Script 실행 로그에서 `Logger.log(JSON.stringify(payload))` 출력값이 입력값과 동일한지 확인합니다.
4. Google Sheet 저장 행에서 동일 문자열이 변형 없이 저장되었는지 확인합니다.
5. 영문 번역/수식(`=GOOGLETRANSLATE(...)`)이 삽입되지 않았는지 확인합니다.
