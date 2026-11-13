import { NextResponse } from "next/server";

// 2026-11-13 운영 종료: 로그인 없이 이미지 생성(유료 AI 호출)이 가능해 비용이 새는 걸 막으려고 닫음.
// 되살리려면 이 파일을 지운다.
export function middleware() {
  return NextResponse.json({ error: "운영 종료된 서비스입니다." }, { status: 410 });
}

export const config = { matcher: ["/api/((?!health).*)"] };
