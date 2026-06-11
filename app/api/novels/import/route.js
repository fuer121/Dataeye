import { NextResponse } from "next/server";
import { importNovelLibraryFromBuffer, importNovelLibraryFromText } from "@/lib/novels";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!file || typeof file.arrayBuffer !== "function") {
      return NextResponse.json({ error: "请上传 Excel、CSV 或 JSON 文件。" }, { status: 400 });
    }

    const fileName = file.name || "";
    const lowerName = fileName.toLowerCase();
    const supportedExtensions = [".xlsx", ".xls", ".csv", ".json"];
    if (!supportedExtensions.some((extension) => lowerName.endsWith(extension))) {
      return NextResponse.json({ error: "仅支持 .xlsx、.xls、.csv 或 .json 文件。" }, { status: 400 });
    }

    const result =
      lowerName.endsWith(".xlsx") || lowerName.endsWith(".xls")
        ? importNovelLibraryFromBuffer(Buffer.from(await file.arrayBuffer()), fileName)
        : importNovelLibraryFromText(await file.text(), lowerName.endsWith(".json") ? "json" : "csv", `file-import:${fileName}`);

    return NextResponse.json({
      ...result,
      message: [
        `已导入小说库：新增 ${result.insertedCount} 条，更新 ${result.updatedCount} 条，跳过 ${result.skippedCount} 条。`,
        result.mappingChangedCount ? `同步映射 ${result.mappingChangedCount} 条。` : ""
      ]
        .filter(Boolean)
        .join("")
    });
  }

  return NextResponse.json({ error: "请上传 Excel、CSV 或 JSON 文件。" }, { status: 400 });
}
