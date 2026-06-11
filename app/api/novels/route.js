import { NextResponse } from "next/server";
import { deleteNovelMapping, listNovelMappings, listNovels, updateNovelMapping, upsertNovelMappings } from "@/lib/novels";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query") || "";
  return NextResponse.json({
    items: listNovelMappings(query),
    novels: listNovels(query)
  });
}

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const mappings = Array.isArray(body.mappings) ? body.mappings : [];

  if (!mappings.length) {
    return NextResponse.json({ error: "请提交 mappings 数组。" }, { status: 400 });
  }

  if (mappings.some((item) => !String(item?.novelName || "").trim() || !String(item?.dramaTitle || "").trim())) {
    return NextResponse.json({ error: "每条映射都需要 novelName 和 dramaTitle。" }, { status: 400 });
  }

  const changedCount = upsertNovelMappings(mappings);
  return NextResponse.json({ changedCount });
}

export async function PATCH(request) {
  const body = await request.json().catch(() => ({}));
  const id = Number(body.id);

  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "请提交有效的映射 id。" }, { status: 400 });
  }

  if (!String(body.novelName || "").trim() || !String(body.dramaTitle || "").trim()) {
    return NextResponse.json({ error: "请填写小说名称和短剧/漫剧名称。" }, { status: 400 });
  }

  try {
    const changedCount = updateNovelMapping(id, {
      novelName: body.novelName,
      dramaTitle: body.dramaTitle,
      relationType: body.relationType || "manual",
      sourceRef: "manual-form"
    });
    if (!changedCount) return NextResponse.json({ error: "未找到要更新的映射。" }, { status: 404 });
    return NextResponse.json({ changedCount });
  } catch (error) {
    if (String(error?.code || "").includes("SQLITE_CONSTRAINT")) {
      return NextResponse.json({ error: "该小说与短剧/漫剧映射已存在。" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message || "映射更新失败。" }, { status: 500 });
  }
}

export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const id = Number(searchParams.get("id"));

  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "请提交有效的映射 id。" }, { status: 400 });
  }

  const changedCount = deleteNovelMapping(id);
  if (!changedCount) return NextResponse.json({ error: "未找到要删除的映射。" }, { status: 404 });
  return NextResponse.json({ changedCount });
}
