# 抓包材料目录整理规范

更新时间：2026-06-08

## 当前判断

`captures/` 目前保存了多批 Charles、Proxyman、cURL 文件，文件都在根目录，短期可用，但长期不利于判断来源、日期、周期和用途。

已调整脚本能力：`npm run capture:*`、`npm run dataeye:refresh-login` 等通过 `listCaptureFiles()` 读取材料的脚本，现在支持递归扫描 `captures/` 子目录。因此后续可以按目录归档，不必把所有 HAR 都堆在根目录。

## 推荐目录结构

```text
captures/
  dataeye/
    2026-06-07/
      day/
      week/
      month/
    2026-06-08/
      day/
      week/
      month/
  hongguo/
    pending/
  archive/
```

## 推荐命名

DataEye 列表请求：

```text
dataeye-motionComic-rankType-0-day-2026-06-07-proxyman.har
dataeye-motionComic-rankType-1-week-2026-06-01_2026-06-07-proxyman.har
dataeye-motionComic-rankType-2-month-2026-06-proxyman.har
```

DataEye 日期/榜期请求：

```text
dataeye-motionComicDate-rankType-0-proxyman.har
```

cURL：

```text
dataeye-motionComic-rankType-0-day-2026-06-07.curl
```

## 放置规则

| 类型 | 放置位置 | 说明 |
| --- | --- | --- |
| DataEye 日榜 | `captures/dataeye/<date>/day/` | 包含 `day=<YYYY-MM-DD>` 的 `motionComic` 请求 |
| DataEye 周榜 | `captures/dataeye/<date>/week/` | 包含 `week=<榜期>` 的 `motionComic` 请求 |
| DataEye 月榜 | `captures/dataeye/<date>/month/` | 包含 `month=<榜期>` 的 `motionComic` 请求 |
| DataEye 榜期接口 | 同日期目录下对应周期目录或 `captures/dataeye/<date>/` | `motionComicDate?rankType=N` |
| 红果待分析 | `captures/hongguo/pending/` | 红果 live 仍暂停，先只存证据 |
| 旧材料 | `captures/archive/` | 不再作为 fresh 登录态首选 |

## 敏感信息规则

- `captures/` 已被 `.gitignore` 忽略，HAR 和 cURL 默认不提交。
- 文档报告只能展示掩码后的 Cookie、Authorization、authentication、token、user id。
- `.env.local.dataeye` 只保存在本机，不提交。

## 迁移建议

当前已有根目录文件先不移动，避免影响最近一次问题追溯。建议后续单独开一个整理任务：

1. 先运行 `npm test`，确认递归读取能力通过。
2. 按来源和日期创建子目录。
3. 移动旧 HAR/cURL。
4. 运行 `npm run capture:analyze -- --source dataeye`，确认候选请求数量不下降。
5. 再运行 `npm run dataeye:refresh-login`，确认仍能选中最新 fresh 目标请求。

## 不做的事

- 不把 HAR 纳入 Git。
- 不在文件名里写完整 Cookie、Token、openid、unionid、手机号或设备 ID。
- 不把旧抓包材料删除；只归档。
