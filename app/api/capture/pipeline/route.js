import { NextResponse } from "next/server";
import { runCapturePipeline, toSafeCapturePipelinePayload } from "@/lib/capture-pipeline-runner";

export const dynamic = "force-dynamic";

export async function POST() {
  const result = runCapturePipeline({
    source: "dataeye",
    loginEnvFile: ".env.local.dataeye"
  });

  return NextResponse.json(toSafeCapturePipelinePayload(result), { status: result.status === 0 ? 200 : 500 });
}
