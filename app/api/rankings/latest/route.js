import { NextResponse } from "next/server";
import { getLatestPeriodValue, getLatestRankingDate, normalizeRankingFilters } from "@/lib/rankings";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { searchParams } = new URL(request.url);

  try {
    const filters = normalizeRankingFilters({
      source: searchParams.get("source") || "all",
      dataKind: searchParams.get("dataKind") || "all",
      rankType: searchParams.get("rankType") || "all",
      rankPeriod: searchParams.get("rankPeriod") || "all"
    });
    const date = getLatestRankingDate(filters);
    const periodValue = getLatestPeriodValue(filters);

    return NextResponse.json({
      date: filters.source === "native" ? periodValue || date : date,
      periodValue: filters.source === "native" ? periodValue || date : ""
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
