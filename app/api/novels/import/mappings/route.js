import { NextResponse } from "next/server";
import { importNovelMappingsWorkbookFromBuffer } from "@/lib/novels";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json({ error: "请上传映射 Excel 文件。" }, { status: 400 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!file || typeof file.arrayBuffer !== "function") {
    return NextResponse.json({ error: "请上传映射 Excel 文件。" }, { status: 400 });
  }

  const fileName = file.name || "";
  const lowerName = fileName.toLowerCase();
  const supportedExtensions = [".xlsx", ".xls"];
  if (!supportedExtensions.some((extension) => lowerName.endsWith(extension))) {
    return NextResponse.json({ error: "仅支持 .xlsx 或 .xls 映射文件。" }, { status: 400 });
  }

  try {
    const result = importNovelMappingsWorkbookFromBuffer(Buffer.from(await file.arrayBuffer()), fileName);
    return NextResponse.json({
      ...result,
      message: [
        `已导入映射：有效 ${result.validRows} 行，`,
        `新建小说 ${result.createdNovelCount} 个，`,
        `复用小说 ${result.existingNovelCount} 个，`,
        `写入映射 ${result.mappingChangedCount} 条，`,
        `跳过 ${result.skippedCount} 行。`
      ].join("")
    });
  } catch (error) {
    return NextResponse.json({ error: error.message || "映射 Excel 导入失败。" }, { status: 500 });
  }
}
