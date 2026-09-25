# 社交网络舆情工具 (Social Media & Networks)

主流社交平台、论坛与社群的品牌声量监控与舆情捕捉。

## 平台支持矩阵

| 平台 | 采集模式 | 认证需求 | 平台状态 | 核心用途 |
| :--- | :--- | :--- | :--- | :--- |
| **X (Twitter)** | Twitter API v2 / Nitter / Scraper | Bearer Token / Cookie | 需配置 (NEEDS AUTH) | 品牌舆情、KOL 互动、突发热点 |
| **Reddit** | Reddit JSON API (.json 后缀) | Client ID + Secret / Public | 需配置 (NEEDS AUTH) | 社区深度吐槽、竞品讨论、AMA 问答 |
| **Threads** | Meta Threads API | Meta Token | 需配置 (NEEDS AUTH) | Instagram 关联生态年轻化用户动态 |
| **Bluesky** | AT Protocol (ATProto API) | Free App Password | 开箱即用 (READY) | 分布式去中心化社交圈、开发者声音 |
| **Telegram** | MTProto / Telegram Bot API | Bot Token / API ID | 可配置 | 行业社群、私域快讯与频道广播 |
| **WeChat / Weibo** | Web / 公众号 RSS | Cookie / Session | 需配置 | 中文主流舆情阵地、品牌官微公告 |

## 抓取指令与示例

### 1. Reddit 社区讨论 (免密轻量或 API)
```bash
# Agent Reach 提取 Reddit 帖子正文及高赞评论
agent-reach fetch "https://www.reddit.com/r/technology/comments/..."
```

### 2. X (Twitter) 推文捕获
```bash
# 提取推文与其上下文线索
agent-reach fetch "https://x.com/username/status/..."
```

## 舆情流水线集成 (Growth OS Social Listening)
抓取后的社交文本通过 `POST /api/workspace/agent-reach/sync-social` 端点流转：
1. 自动提取平台、作者、链接与内容
2. 调度 Gemini 分析情感极性 (`POSITIVE`, `NEUTRAL`, `NEGATIVE`, `HIGH_ALERT`)
3. 注入系统实时社交雷达看板，驱动预警机制
