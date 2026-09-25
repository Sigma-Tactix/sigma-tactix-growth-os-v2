# 财经与市场情报工具 (Finance & Market Intelligence)

全球金融资产、财报披露及加密市场资讯监测。

## 平台支持矩阵

| 平台 | 模式 / 数据源 | 认证需求 | 默认状态 | 典型用途 |
| :--- | :--- | :--- | :--- | :--- |
| **Yahoo Finance** | Yahoo Query API / HTML | None | 开箱即用 (READY) | 实时股票代码行情、财务报表、分析师评级 |
| **SEC EDGAR** | SEC Public REST API | User-Agent Header | 开箱即用 (READY) | 美股 10-K 年报、10-Q 季报、8-K 重大事件 |
| **CoinMarketCap / CoinGecko** | Public Market API | Free API Key (可选) | 开箱即用 | 加密货币价格波动、链上异动监控 |
| **财联社 / Bloomberg** | RSS / Jina Reader | None / Subscription | 部分可用 | 全球宏观快讯、美联储决议突发跟踪 |

## 抓取指令与示例

### 1. 美股上市公司财报速读
```bash
# 提取最新财报网页正文
agent-reach fetch "https://www.sec.gov/edgar/browse/?CIK=..."
```

### 2. Yahoo Finance 资讯抓取
```bash
# 提取行情新闻快讯
agent-reach fetch "https://finance.yahoo.com/quote/NVDA"
```

## 注意事项
- SEC EDGAR 强制要求请求头包含规范的 `User-Agent: Sample Company Name AdminContact@domain.com`，否则会触发 403 限流。
- 股市高频数据需遵守交易所延迟规则（通常公开源有 15 分钟延时）。
