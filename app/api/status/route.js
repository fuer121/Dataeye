import { NextResponse } from "next/server";
import { getMvpStatus } from "@/lib/mvp-status";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(getMvpStatus());
}
