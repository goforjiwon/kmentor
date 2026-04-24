import { NextResponse } from "next/server";
import { clearAdminAuth } from "@/lib/adminAuth";

export async function POST() {
  await clearAdminAuth();
  return NextResponse.json({ success: true });
}
