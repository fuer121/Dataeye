import { NextResponse } from "next/server";
import { importNovelMappingsFromText, importSampleNovelMappings } from "@/lib/novels";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!file || typeof file.text !== "function") {
      return NextResponse.json({ error: "请上传 CSV 或 JSON 文件。" }, { status: 400 });
    }

    const fileName = file.name || "";
    const format = fileName.toLowerCase().endsWith(".json") ? "json" : "csv";
    const changedCount = importNovelMappingsFromText(await file.text(), format);
    return NextResponse.json({
      changedCount,
      message: `已导入/更新 ${changedCount} 条小说映射。`
    });
  }

  const changedCount = importSampleNovelMappings();
  return NextResponse.json({
    changedCount,
    message: `已导入/更新 ${changedCount} 条模拟小说映射。`
  });
}
