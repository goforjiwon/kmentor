export type ApplicationPayload = {
  parentName: string;
  phone: string;
  grade: string;
  subjects: string[];
  currentLevel: string;
  difficulties: string;
  goal: string;
  goalDate: string;
  childPersonality: string[];
  mentorPriority: string;
  extraNote: string;
};

const RESEND_API_URL = "https://api.resend.com/emails";
const EMAIL_TO = "goforjiwon@gmail.com";
const EMAIL_SUBJECT = "[KMentor] 신규 신청";

const SUBJECT_LABELS: Record<string, string> = {
  math: "수학",
  science: "과학",
};

const PERSONALITY_LABELS: Record<string, string> = {
  introverted: "내성적인 편",
  extroverted: "외향적인 편",
  easily_tired: "쉽게 지치는 편",
  perfectionist: "완벽주의 성향",
  talkative: "말이 많은 편",
  quiet: "조용한 편",
};

const MENTOR_PRIORITY_LABELS: Record<string, string> = {
  concept: "수학·과학 개념 설명·문제풀이",
  routine: "공부 방법·루틴 잡기",
  motivation: "멘탈 관리·동기 부여",
  career: "진로·대학(이공계) 이야기",
};

function toLabel(values: string[], labels: Record<string, string>) {
  return values.map((value) => labels[value] ?? value).join(", ");
}

function emptyFallback(value: string) {
  return value.trim() || "(미입력)";
}

function makeTextBody(payload: ApplicationPayload) {
  return [
    "KMentor 신규 신청이 접수되었습니다.",
    "",
    `- 학부모님 성함: ${emptyFallback(payload.parentName)}`,
    `- 연락처: ${emptyFallback(payload.phone)}`,
    `- 학년: ${emptyFallback(payload.grade)}`,
    `- 도움이 필요한 과목: ${toLabel(payload.subjects, SUBJECT_LABELS) || "(미선택)"}`,
    `- 현재 성적·수준: ${emptyFallback(payload.currentLevel)}`,
    `- 어려워하는 부분: ${emptyFallback(payload.difficulties)}`,
    `- 목표: ${emptyFallback(payload.goal)}`,
    `- 목표 시점: ${emptyFallback(payload.goalDate)}`,
    `- 자녀 성향: ${toLabel(payload.childPersonality, PERSONALITY_LABELS) || "(미선택)"}`,
    `- 멘토에게 바라는 점: ${MENTOR_PRIORITY_LABELS[payload.mentorPriority] ?? payload.mentorPriority ?? "(미선택)"}`,
    `- 기타 참고사항: ${emptyFallback(payload.extraNote)}`,
  ].join("\n");
}

function makeHtmlBody(payload: ApplicationPayload) {
  const rows = [
    ["학부모님 성함", emptyFallback(payload.parentName)],
    ["연락처", emptyFallback(payload.phone)],
    ["학년", emptyFallback(payload.grade)],
    ["도움이 필요한 과목", toLabel(payload.subjects, SUBJECT_LABELS) || "(미선택)"],
    ["현재 성적·수준", emptyFallback(payload.currentLevel)],
    ["어려워하는 부분", emptyFallback(payload.difficulties)],
    ["목표", emptyFallback(payload.goal)],
    ["목표 시점", emptyFallback(payload.goalDate)],
    ["자녀 성향", toLabel(payload.childPersonality, PERSONALITY_LABELS) || "(미선택)"],
    ["멘토에게 바라는 점", MENTOR_PRIORITY_LABELS[payload.mentorPriority] ?? payload.mentorPriority ?? "(미선택)"],
    ["기타 참고사항", emptyFallback(payload.extraNote)],
  ];

  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a;">
      <h2 style="margin-bottom: 16px;">KMentor 신규 신청</h2>
      <table style="border-collapse: collapse; width: 100%; max-width: 720px;">
        ${rows
          .map(
            ([label, value]) => `
              <tr>
                <th style="text-align: left; vertical-align: top; border: 1px solid #cbd5e1; padding: 8px; width: 180px; background: #f8fafc;">${label}</th>
                <td style="border: 1px solid #cbd5e1; padding: 8px; white-space: pre-line;">${value}</td>
              </tr>
            `
          )
          .join("")}
      </table>
    </div>
  `;
}

export async function sendApplicationEmail(payload: ApplicationPayload) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.APPLICATION_EMAIL_FROM;

  if (!resendApiKey) {
    throw new Error("RESEND_API_KEY가 설정되지 않았습니다.");
  }

  if (!fromEmail) {
    throw new Error("APPLICATION_EMAIL_FROM이 설정되지 않았습니다.");
  }

  const res = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${resendApiKey}`,
    },
    body: JSON.stringify({
      from: fromEmail,
      to: EMAIL_TO,
      subject: EMAIL_SUBJECT,
      text: makeTextBody(payload),
      html: makeHtmlBody(payload),
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Resend API 오류(${res.status}): ${errorText}`);
  }
}
