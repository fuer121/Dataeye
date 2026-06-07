import { nowIso } from "../date.js";

const sourceNames = {
  dataeye: "DataEye / 剧查查",
  hongguo: "红果"
};

const data = {
  dataeye: [
    ["重生后我成了漫画女主", "986.4万", "重生逆袭"],
    ["捡到战神夫君后我爆红了", "912.8万", "古风甜宠"],
    ["玄门小祖宗", "877.1万", "玄学爽文"],
    ["豪门千金归来", "821.0万", "都市情感"],
    ["末世囤货日记", "796.5万", "末世冒险"]
  ],
  hongguo: [
    ["读心夫人不好惹", "102.3万", "都市甜宠"],
    ["玄门小祖宗", "98.7万", "玄学爽文"],
    ["穿成反派后我洗白了", "91.2万", "穿书逆袭"],
    ["重生后我成了漫画女主", "86.9万", "重生逆袭"],
    ["顾少的契约漫剧", "80.1万", "豪门情感"]
  ]
};

export async function collectSampleRanking({ source, rankingDate }) {
  const rows = data[source];
  if (!rows) {
    throw new Error(`模拟采集器不支持来源：${source}`);
  }

  return rows.map(([title, heatValue, dramaType], index) => ({
    source,
    dataKind: "sample",
    rankingDate,
    rank: index + 1,
    title,
    heatValue,
    dramaType,
    sourceRef: `${source}:sample:${rankingDate}`,
    collectedAt: nowIso(),
    rawPayload: {
      sourceName: sourceNames[source],
      mode: "sample"
    }
  }));
}
