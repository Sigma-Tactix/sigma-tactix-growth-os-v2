# 开发者社区工具 (Developer Communities)

代码仓库、技术论坛及开发者社区的情报抓取与监控。

## 平台支持矩阵

| 平台 | 协议 / 模式 | 认证需求 | 默认状态 | 典型用途 |
| :--- | :--- | :--- | :--- | :--- |
| **GitHub** | REST API v3 / GraphQL | GITHUB_TOKEN (可选，未认证 60次/hr) | 可用 (免密轻量) | 仓库 Stars、Release 发布、Issue 讨论 |
| **V2EX** | Public JSON API / RSS | None | 开箱即用 (READY) | 中文极客、创业与独立开发话题热议 |
| **Hacker News** | Firebase REST API / Algolia | None | 开箱即用 (READY) | 全球前沿技术、Y-Combinator 创业动态 |
| **Stack Overflow** | StackExchange API v2.3 | API Key (高配额) | 开箱即用 (低频) | 技术痛点、报错趋势分析 |

## 抓取指令与示例

### 1. V2EX 热门节点动态
```bash
# 获取热门主题
curl -s "https://www.v2ex.com/api/topics/hot.json"

# 或通过 Agent Reach 提取指定帖子
agent-reach fetch "https://www.v2ex.com/t/1000000"
```

### 2. GitHub 仓库动态与 Readme
```bash
# 提取仓库最新说明与技术栈
agent-reach fetch "https://github.com/trending"
```

### 3. Hacker News 热帖
```bash
# 提取 HN 前沿文章纯净正文
agent-reach fetch "https://news.ycombinator.com/item?id=..."
```

## 注意事项
- V2EX 遵循 120 秒缓存策略，避免短时间内并发刷取相同端点。
- GitHub 建议在 `.env` 中配置 `GITHUB_TOKEN` 以解除 API 速率限制。
