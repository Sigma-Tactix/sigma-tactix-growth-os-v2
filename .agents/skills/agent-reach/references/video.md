# 视频与流媒体工具 (Video & Streaming Platforms)

视频平台字幕提取、元数据采集及音视频内容理解。

## 平台支持矩阵

| 平台 | 协议 / 模式 | 底层工具 | 认证需求 | 典型用途 |
| :--- | :--- | :--- | :--- | :--- |
| **YouTube** | yt-dlp / Jina Subtitle API | `yt-dlp` | None (公开视频) | 视频简介、实时字幕、观点提炼 |
| **Bilibili** | Web Scraper / API | Jina / Sessdata | 可选 Cookie (高清/专属) | 中文科技评测、教程、B站弹幕分析 |
| **TikTok / Douyin**| OpenGraph / Scraper API | Scraper | None / Proxy | 短视频文案、爆款选题与音乐流行分析 |

## 抓取指令与示例

### 1. YouTube 视频字幕与元数据
```bash
# 获取视频纯净文字稿与摘要
agent-reach fetch "https://www.youtube.com/watch?v=..."

# 本地依赖检测
which yt-dlp
```

### 2. 视频内容结构化提炼
抓取返回的视频文本通常可无缝送入 Gemini 2.5 Flash 进行深度分段：
- 核心论点 (Core Takeaways)
- 时间戳索引 (Key Timestamps)
- 产品与品牌推荐提及 (Brand Mentions)

## 注意事项
- `yt-dlp` 需保持较新版本以应对 YouTube 防爬规则升级。
- 私密视频或会员限定内容需在环境配置中挂载 Cookie。
