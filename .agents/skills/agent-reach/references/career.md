# 职场与招聘工具 (Career & Talent Reach)

职业社交与招聘平台数据检索与抓取指南。

## 平台支持矩阵

| 平台 | 协议 / 模式 | 认证需求 | 典型用途 |
| :--- | :--- | :--- | :--- |
| **LinkedIn** | Headless Browser / Cookie Session | LI_AT Cookie / Session | 公司主页、招聘岗位、人才画像监控 |
| **Upwork** | Public Job RSS / GraphQL API | Optional Token | 自由职业需求分析、全球时薪基准 |
| **Indeed / Glassdoor** | Jina Reader / Scraper API | None / API Key | 薪资区间、员工评价、招聘热度 |

## 抓取指令与示例

### 1. LinkedIn 岗位与公司情报
```bash
# 通过 Agent Reach / Jina 提取公开招聘页面
agent-reach fetch "https://www.linkedin.com/jobs/view/..."
```

### 2. Upwork 需求趋势
```bash
# 抓取 Upwork 技能订阅 RSS
agent-reach fetch "https://www.upwork.com/ab/feed/jobs/rss?q=fullstack"
```

## 注意事项
- LinkedIn 对频繁未认证请求有严格风控（429 / Authwall）。生产环境建议通过 Headless Session 或合规数据源接入。
- 薪资与岗位描述文本可直接送入 Gemini 进行归一化结构提取。
