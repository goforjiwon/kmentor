import { redirect } from "next/navigation";
import { isAdminAuthed } from "@/lib/adminAuth";
import { supabaseAdmin, type ApplicationRow } from "@/lib/supabase";
import AdminDashboard from "./AdminDashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!(await isAdminAuthed())) {
    redirect("/admin/login");
  }

  const { data, error } = await supabaseAdmin
    .from("applications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    return (
      <div className="p-8 text-red-600">
        DB 조회 오류: {error.message}
      </div>
    );
  }

  return <AdminDashboard initialApplications={(data ?? []) as ApplicationRow[]} />;
}
