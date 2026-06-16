import { NextResponse } from "next/server";
import { upsertWatchState } from "@/lib/rankings";

export const dynamic = "force-dynamic";

export async function PATCH(request) {
  try {
    const body = await request.json();
    const state = upsertWatchState({
      title: body.title,
      status: body.status,
      note: body.note || ""
    });

    return NextResponse.json({ item: state });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
