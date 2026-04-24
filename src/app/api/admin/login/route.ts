import { NextResponse } from "next/server";
import { setAdminAuthed } from "@/lib/adminAuth";

export async function POST(request: Request) {
  const { password } = (await request.json()) as { password?: string };
  if (!password) {
    return NextResponse.json(
      { success: false, message: "비밀번호를 입력해주세요." },
      { status: 400 }
    );
  }
  const ok = await setAdminAuthed(password);
  if (!ok) {
    return NextResponse.json(
      { success: false, message: "비밀번호가 올바르지 않습니다." },
      { status: 401 }
    );
  }
  return NextResponse.json({ success: true });
}
