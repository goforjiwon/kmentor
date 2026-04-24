/**
 * 카이멘토 (KAIMentor) Google Apps Script Web App (권장 예시)
 *
 * 목적:
 * 1) 번역 로직(LanguageApp.translate, GOOGLETRANSLATE 수식 주입, 외부 번역 API) 미사용
 * 2) 전달받은 payload 원문을 시트에 그대로 기록
 * 3) 수신 직후 Logger.log(JSON.stringify(payload))로 원본 검증
 */
function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents || "{}");

    // 디버깅: 앱에서 받은 "원본" 값 확인
    Logger.log(JSON.stringify(payload));

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("applications") || ss.getActiveSheet();

    // appendRow / setValues 모두 수식 주입 없이 "값"으로만 기록
    // (주의) 절대 setFormula / GOOGLETRANSLATE / LanguageApp.translate 사용 금지
    sheet.appendRow([
      new Date(),
      payload.parentName || "",
      payload.phone || "",
      payload.grade || "",
      toText(payload.subjects),
      payload.currentLevel || "",
      payload.difficulties || "",
      payload.goal || "",
      payload.goalDate || "",
      toText(payload.childPersonality),
      payload.mentorPriority || "",
      payload.extraNote || "",
      JSON.stringify(payload),
    ]);

    return jsonResponse({ success: true });
  } catch (err) {
    Logger.log(err && err.stack ? err.stack : String(err));
    return jsonResponse({ success: false, error: String(err) });
  }
}

function toText(value) {
  if (Array.isArray(value)) {
    return value.join(", ");
  }
  return value == null ? "" : String(value);
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
