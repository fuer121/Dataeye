import { NextResponse } from "next/server";
import { collectorErrorPayload } from "@/lib/collectors/errors";
import { assertCollectedEntries, collectRanking, normalizeCollectRequest } from "@/lib/collectors";
import { applyLocalEnvForSource } from "@/lib/runtime-env";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  let collectRequest;

  try {
    collectRequest = normalizeCollectRequest({ ...body, mode: "live" });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const source = collectRequest.sources[0];
  applyLocalEnvForSource(source);

  try {
    const entries = await collectRanking({
      source,
      rankingDate: collectRequest.rankingDate,
      mode: "live",
      rankType: collectRequest.rankType,
      period: collectRequest.period
    });
    assertCollectedEntries({ entries, mode: "live", source });

    return NextResponse.json({
      source,
      rankingDate: collectRequest.rankingDate,
      rankType: collectRequest.rankType,
      period: collectRequest.period,
      count: entries.length,
      preview: entries.slice(0, 10).map((entry) => ({
        rankType: entry.rankType,
        rankTypeName: entry.rankTypeName,
        rankPeriod: entry.rankPeriod,
        periodValue: entry.periodValue,
        rank: entry.rank,
        title: entry.title,
        heatValue: entry.heatValue,
        dramaType: entry.dramaType,
        sourceRef: entry.sourceRef
      }))
    });
  } catch (error) {
    return NextResponse.json(collectorErrorPayload(error), { status: 502 });
  }
}
