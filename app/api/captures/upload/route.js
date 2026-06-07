import { NextResponse } from "next/server";
import { saveCaptureUploadWithAnalysis } from "@/lib/capture-upload";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const form = await request.formData();
  const file = form.get("file");

  if (!file || typeof file.text !== "function") {
    return NextResponse.json({ error: "请上传 HAR、JSON、txt 或 cURL 抓包文件。" }, { status: 400 });
  }

  try {
    const result = saveCaptureUploadWithAnalysis({
      fileName: file.name || "capture.har",
      content: await file.text()
    });

    return NextResponse.json({
      fileName: result.fileName,
      size: result.size,
      message: `已保存抓包文件 ${result.fileName}。`,
      pipeline: result.pipeline
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
