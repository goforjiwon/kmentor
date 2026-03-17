import { NextResponse } from "next/server";
import { sendApplicationEmail, type ApplicationPayload } from "@/lib/email";

const SHEETS_WEBHOOK_URL =
  "https://script.google.com/macros/s/AKfycbyidUcRODADemH6Waa_FE6ThQLIc98ck5p6tZ0J5XA-wcGWEsegsTc9pidPhf_J5tykIw/exec";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ApplicationPayload;

    // 필수 필드 검증
    if (!body.parentName || !body.phone || !body.grade) {
      return NextResponse.json(
        { success: false, message: "필수 항목을 입력해주세요." },
        { status: 400 }
      );
    }

    // Google Sheets 웹훅으로 전송
    const sheetsRes = await fetch(SHEETS_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!sheetsRes.ok) {
      throw new Error(`Sheets 웹훅 오류: ${sheetsRes.status}`);
    }

    const json = (await sheetsRes.json()) as { success: boolean; error?: string };

    if (!json.success) {
      throw new Error(json.error ?? "Sheets 저장 실패");
    }

    try {
      await sendApplicationEmail(body);
    } catch (err) {
      console.error("이메일 전송 오류:", err);
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("신청 처리 오류:", error);
    return NextResponse.json(
      { success: false, message: "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요." },
      { status: 500 }
    );
  }
}
