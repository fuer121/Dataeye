import { NextResponse } from "next/server";
import { listCollectionRuns, normalizeRunFilters } from "@/lib/rankings";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { searchParams } = new URL(request.url);

  try {
    const filters = normalizeRunFilters({
      date: searchParams.get("date") || "",
      source: searchParams.get("source") || "all",
      mode: searchParams.get("mode") || "all"
    });
    return NextResponse.json({ items: listCollectionRuns(filters) });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
