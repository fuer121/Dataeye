import { NextResponse } from "next/server";
import { listRankingEntries, normalizeRankingFilters } from "@/lib/rankings";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { searchParams } = new URL(request.url);

  try {
    const filters = normalizeRankingFilters({
      date: searchParams.get("date") || "",
      source: searchParams.get("source") || "all",
      match: searchParams.get("match") || "all",
      dataKind: searchParams.get("dataKind") || "all",
      rankType: searchParams.get("rankType") || "all",
      rankPeriod: searchParams.get("rankPeriod") || "all",
      periodValue: searchParams.get("periodValue") || ""
    });
    return NextResponse.json({ items: listRankingEntries(filters) });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
