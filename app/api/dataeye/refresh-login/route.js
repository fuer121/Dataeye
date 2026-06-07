import { NextResponse } from "next/server";
import { refreshDataEyeLogin, toSafeDataEyeLoginRefreshPayload } from "@/lib/dataeye-login-refresh";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const result = refreshDataEyeLogin({
    date: typeof body.date === "string" ? body.date : "",
    skipPreview: body.skipPreview === true,
    allowStaleCapture: false
  });

  return NextResponse.json(toSafeDataEyeLoginRefreshPayload(result), { status: result.ok ? 200 : 409 });
}
