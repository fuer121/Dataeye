import { NextResponse } from "next/server";
import { importCaptureRanking } from "@/lib/capture-import";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const body = await request.json().catch(() => ({}));

  try {
    const result = importCaptureRanking({
      date: body.date || "",
      source: body.source || "",
      writeReport: true
    });
    return NextResponse.json(
      {
        source: result.source,
        rankingDate: result.rankingDate,
        insertedCount: result.insertedCount,
        skippedCount: result.skippedCount,
        candidateCount: result.candidateCount,
        captureFreshness: result.captureFreshness || null,
        message: result.message,
        preview: result.rows.slice(0, 10).map((row) => ({
          rank: row.rank,
          title: row.title,
          heatValue: row.heatValue,
          dramaType: row.dramaType,
          sourceRef: row.sourceRef
        }))
      },
      { status: result.ok ? 200 : 400 }
    );
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
