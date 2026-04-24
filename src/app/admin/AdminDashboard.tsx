"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ApplicationRow, ApplicationStatus } from "@/lib/supabase";

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  new: "🆕 신규",
  contacted: "📞 연락 완료",
  matching: "🔎 매칭 중",
  meeting_scheduled: "📅 미팅 예정",
  meeting_done: "✅ 미팅 완료",
  paid: "💰 입금 완료",
  closed: "🔒 종료",
  spam: "🚫 스팸",
};

const STATUS_COLORS: Record<ApplicationStatus, string> = {
  new: "bg-blue-100 text-blue-800",
  contacted: "bg-indigo-100 text-indigo-800",
  matching: "bg-amber-100 text-amber-800",
  meeting_scheduled: "bg-purple-100 text-purple-800",
  meeting_done: "bg-emerald-100 text-emerald-800",
  paid: "bg-green-100 text-green-800",
  closed: "bg-slate-200 text-slate-700",
  spam: "bg-red-100 text-red-800",
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function joinValues(values: string[]) {
  return values.length > 0 ? values.join(", ") : "";
}

export default function AdminDashboard({
  initialApplications,
}: {
  initialApplications: ApplicationRow[];
}) {
  const router = useRouter();
  const [apps, setApps] = useState<ApplicationRow[]>(initialApplications);
  const [filter, setFilter] = useState<ApplicationStatus | "all">("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // 30초마다 자동 새로고침 (새 신청이 오면 목록에 반영)
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/admin/applications", { cache: "no-store" });
        const json = await res.json();
        if (json.success) setApps(json.applications);
      } catch {
        // 무시
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const filtered = useMemo(() => {
    if (filter === "all") return apps;
    return apps.filter((a) => a.status === filter);
  }, [apps, filter]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: apps.length };
    apps.forEach((a) => {
      c[a.status] = (c[a.status] ?? 0) + 1;
    });
    return c;
  }, [apps]);

  async function updateStatus(id: string, status: ApplicationStatus) {
    const prev = apps;
    setApps((list) =>
      list.map((a) => (a.id === id ? { ...a, status } : a))
    );
    const res = await fetch(`/api/admin/applications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      alert("상태 변경 실패");
      setApps(prev);
    }
  }

  async function updateMemo(id: string, memo: string) {
    await fetch(`/api/admin/applications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ admin_memo: memo }),
    });
    setApps((list) =>
      list.map((a) => (a.id === id ? { ...a, admin_memo: memo } : a))
    );
  }

  async function deleteApp(id: string) {
    if (!confirm("정말 삭제하시겠어요? 되돌릴 수 없습니다.")) return;
    const res = await fetch(`/api/admin/applications/${id}`, { method: "DELETE" });
    if (res.ok) {
      setApps((list) => list.filter((a) => a.id !== id));
    } else {
      alert("삭제 실패");
    }
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-slate-900">카이멘토 관리자</span>
            <span className="text-xs text-slate-400">총 {apps.length}건</span>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="w-3.5 h-3.5 accent-blue-600"
              />
              30초 자동 새로고침
            </label>
            <button
              onClick={logout}
              className="text-xs text-slate-500 hover:text-slate-800"
            >
              로그아웃
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {/* 필터 탭 */}
        <div className="flex flex-wrap gap-2 mb-5">
          <FilterChip
            label="전체"
            count={counts.all ?? 0}
            active={filter === "all"}
            onClick={() => setFilter("all")}
          />
          {(Object.keys(STATUS_LABELS) as ApplicationStatus[]).map((s) => (
            <FilterChip
              key={s}
              label={STATUS_LABELS[s]}
              count={counts[s] ?? 0}
              active={filter === s}
              onClick={() => setFilter(s)}
            />
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-sm text-slate-500">
            해당 상태의 신청이 없습니다.
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((app) => {
              const isOpen = expanded === app.id;
              return (
                <div
                  key={app.id}
                  className="bg-white border border-slate-200 rounded-xl overflow-hidden"
                >
                  <button
                    onClick={() => setExpanded(isOpen ? null : app.id)}
                    className="w-full text-left p-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[app.status as ApplicationStatus] ?? "bg-slate-100 text-slate-700"}`}
                      >
                        {STATUS_LABELS[app.status as ApplicationStatus] ?? app.status}
                      </span>
                      <span className="text-xs text-slate-400">
                        {formatDate(app.created_at)}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <span className="font-semibold text-slate-900">
                        {app.parent_name}
                      </span>
                      <a
                        href={`tel:${app.phone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {app.phone}
                      </a>
                      <span className="text-sm text-slate-600">
                        · {app.grade}
                      </span>
                      <span className="text-sm text-slate-600">
                        · {joinValues(app.subjects)}
                      </span>
                    </div>
                  </button>

                  {isOpen && (
                    <div className="border-t border-slate-200 bg-slate-50 p-4 space-y-4">
                      <DetailRow label="현재 성적·수준" value={app.current_level} />
                      <DetailRow label="어려워하는 부분" value={app.difficulties} />
                      <DetailRow label="목표" value={app.goal} />
                      <DetailRow label="목표 시점" value={app.goal_date} />
                      <DetailRow
                        label="자녀 성향"
                        value={joinValues(app.child_personality)}
                      />
                      <DetailRow
                        label="멘토에게 바라는 점"
                        value={app.mentor_priority}
                      />
                      <DetailRow label="기타" value={app.extra_note} />

                      <div>
                        <div className="text-xs font-semibold text-slate-500 mb-1.5">
                          상태 변경
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {(Object.keys(STATUS_LABELS) as ApplicationStatus[]).map(
                            (s) => (
                              <button
                                key={s}
                                onClick={() => updateStatus(app.id, s)}
                                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                                  app.status === s
                                    ? `${STATUS_COLORS[s]} border-transparent font-semibold`
                                    : "bg-white text-slate-600 border-slate-300 hover:bg-slate-100"
                                }`}
                              >
                                {STATUS_LABELS[s]}
                              </button>
                            )
                          )}
                        </div>
                      </div>

                      <div>
                        <div className="text-xs font-semibold text-slate-500 mb-1.5">
                          운영 메모
                        </div>
                        <MemoEditor
                          initial={app.admin_memo ?? ""}
                          onSave={(memo) => updateMemo(app.id, memo)}
                        />
                      </div>

                      <div className="pt-2 border-t border-slate-200 flex justify-end">
                        <button
                          onClick={() => deleteApp(app.id)}
                          className="text-xs text-red-600 hover:text-red-800"
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

function FilterChip({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
        active
          ? "bg-slate-900 text-white border-slate-900"
          : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
      }`}
    >
      {label} <span className="opacity-60">{count}</span>
    </button>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs font-semibold text-slate-500 mb-0.5">{label}</div>
      <div className="text-sm text-slate-800 whitespace-pre-line">
        {value || <span className="text-slate-400">(미입력)</span>}
      </div>
    </div>
  );
}

function MemoEditor({
  initial,
  onSave,
}: {
  initial: string;
  onSave: (memo: string) => Promise<void> | void;
}) {
  const [memo, setMemo] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  async function save() {
    setSaving(true);
    await onSave(memo);
    setSaving(false);
    setSavedAt(Date.now());
  }

  return (
    <div>
      <textarea
        rows={3}
        value={memo}
        onChange={(e) => setMemo(e.target.value)}
        placeholder="예: 1차 연락 완료. 화요일 오후 6시 첫 미팅 예정. 김멘토에게 소개."
        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
      />
      <div className="flex items-center gap-2 mt-1.5">
        <button
          onClick={save}
          disabled={saving || memo === initial}
          className="text-xs bg-slate-900 text-white px-3 py-1.5 rounded-md font-medium disabled:opacity-40 hover:bg-slate-700"
        >
          {saving ? "저장 중..." : "메모 저장"}
        </button>
        {savedAt && !saving && (
          <span className="text-xs text-emerald-600">저장됨</span>
        )}
      </div>
    </div>
  );
}
