import { NextResponse } from "next/server";
import { importFeishuNovelMappings } from "@/lib/feishu-novel-import";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const result = await importFeishuNovelMappings();

    return NextResponse.json({
      ...result,
      message: `已从飞书导入/更新 ${result.changedCount} 条小说映射。`
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error.message
      },
      { status: 400 }
    );
  }
}
