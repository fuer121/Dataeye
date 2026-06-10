import { NextResponse } from "next/server";
import { importNativeRankings } from "@/lib/native-rankings";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const body = await request.json().catch(() => ({}));

  try {
    const result = importNativeRankings({
      exportDate: body.exportDate,
      rankingDate: body.date || body.rankingDate
    });
    return NextResponse.json({
      message: `站内原生短剧导入完成：新增 ${result.insertedCount} 条，跳过 ${result.skippedCount} 条。`,
      ...result
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
