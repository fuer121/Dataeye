import { NextResponse } from "next/server";
import { runCollection } from "@/lib/collection";
import { normalizeCollectRequest } from "@/lib/collectors";
import { applyLocalEnvForSource } from "@/lib/runtime-env";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  let result;

  if (body.mode === "live" && body.confirmedPreview !== true) {
    return NextResponse.json(
      { error: "真实采集落库前需要先完成预检，并在请求中显式传入 confirmedPreview=true。" },
      { status: 400 }
    );
  }

  try {
    if (body.mode === "live") {
      const collectRequest = normalizeCollectRequest(body);
      applyLocalEnvForSource(collectRequest.sources[0]);
    }
    result = await runCollection(body);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ runs: result.runs }, { status: result.failed ? 207 : 200 });
}
