---
title: 费用追踪
description: PRX 费用追踪系统，按 provider 和 model 统计 token 用量和成本，支持预算告警。
---

# 费用追踪

PRX 内置费用追踪系统，自动记录每次 LLM 调用的 token 用量和计算成本。支持按 provider、model、agent、会话等多维度统计，帮助团队控制 AI 支出。

## 概述

费用追踪覆盖 LLM 使用的全生命周期：

- **Token 计量** -- 自动记录每次调用的 input / output / cache token 数量
- **成本计算** -- 根据配置的价格表计算每次调用的费用
- **多维聚合** -- 按 provider、model、agent、用户、时间段聚合统计
- **预算告警** -- 当费用接近或超过预算时发送通知
- **使用报告** -- 生成每日/每周/每月的使用报告

## 核心结构体

### `TokenUsage`

每次 LLM 调用产生的 token 使用记录：

```rust
pub struct TokenUsage {
    /// 输入 token 数量
    pub input_tokens: u64,
    /// 输出 token 数量
    pub output_tokens: u64,
    /// 缓存命中的 input token 数量
    pub cache_read_tokens: u64,
    /// 写入缓存的 token 数量
    pub cache_write_tokens: u64,
    /// LLM 提供商
    pub provider: String,
    /// 模型名称
    pub model: String,
    /// 调用时间
    pub timestamp: DateTime<Utc>,
    /// 关联的 agent ID
    pub agent_id: Option<String>,
    /// 关联的会话 ID
    pub session_id: Option<String>,
}
```

### `CostTracker`

累积器，负责汇总和持久化费用数据：

```rust
pub struct CostTracker {
    /// 内存中的累积费用
    accumulated: DashMap<CostKey, CostEntry>,
    /// 价格表
    pricing: PricingTable,
    /// 预算配置
    budget: Option<BudgetConfig>,
    /// 持久化后端
    store: Box<dyn CostStore>,
}

impl CostTracker {
    /// 记录一次 token 使用
    pub async fn record(&self, usage: &TokenUsage) -> Result<()>;

    /// 查询指定时间范围的费用统计
    pub async fn query(&self, filter: &CostFilter) -> Result<CostReport>;

    /// 检查预算是否超限
    pub async fn check_budget(&self) -> Result<BudgetStatus>;

    /// 重置指定时间段的统计
    pub async fn reset(&self, period: &TimePeriod) -> Result<()>;
}
```

## 配置

### 基础配置

```toml
[observability.cost]
enabled = true

# 持久化后端: "memory" | "sqlite" | "postgres"
store = "sqlite"
store_path = "~/.local/share/openprx/cost.db"

# 价格表（默认使用内置价格，可覆盖）
[observability.cost.pricing]
# 自定义模型价格（每百万 token）
[observability.cost.pricing.overrides."openai/gpt-4o"]
input = 2.50
output = 10.00
cache_read = 1.25

[observability.cost.pricing.overrides."anthropic/claude-sonnet-4-20250514"]
input = 3.00
output = 15.00
cache_read = 0.30
```

### 预算告警配置

```toml
[observability.cost.budget]
# 每日预算上限（美元）
daily_limit = 10.00

# 每月预算上限
monthly_limit = 200.00

# 告警阈值（百分比）
warn_threshold = 0.8   # 达到 80% 时告警
critical_threshold = 0.95  # 达到 95% 时严重告警

# 超预算行为: "warn" | "throttle" | "block"
on_exceed = "warn"

# 告警通知渠道
notify_channels = ["telegram", "email"]
```

### 按 Agent 预算

```toml
[observability.cost.budget.agents."research-agent"]
daily_limit = 5.00
monthly_limit = 100.00

[observability.cost.budget.agents."coding-agent"]
daily_limit = 20.00
monthly_limit = 500.00
```

## 使用方法

### CLI 命令

```bash
# 查看今日费用摘要
prx cost summary

# 查看本月费用
prx cost summary --period month

# 按 provider 分组
prx cost summary --group-by provider

# 按 model 分组
prx cost summary --group-by model

# 按 agent 分组
prx cost summary --group-by agent

# 指定时间范围
prx cost summary --from 2026-03-01 --to 2026-03-21

# 导出 CSV 报告
prx cost export --format csv --output cost-report.csv

# 导出 JSON 报告
prx cost export --format json --output cost-report.json

# 查看预算状态
prx cost budget

# 查看详细的调用级别日志
prx cost log --limit 50
```

### CLI 输出示例

```
$ prx cost summary --group-by model

Period: 2026-03-01 ~ 2026-03-21

Model                          Calls   Input Tokens   Output Tokens   Cost (USD)
─────────────────────────────────────────────────────────────────────────────────
anthropic/claude-sonnet-4-20250514        142     1,245,000       312,000       $8.43
openai/gpt-4o                  89       890,000       156,000       $3.78
anthropic/claude-haiku-3       1,023    5,120,000     1,024,000      $3.84
ollama/llama3.1                456     2,340,000       890,000       $0.00
─────────────────────────────────────────────────────────────────────────────────
Total                          1,710   9,595,000     2,382,000      $16.05

Budget: $200.00/month | Used: 8.0% | Remaining: $183.95
```

## 内置价格表

PRX 维护主流 provider 的价格表（每百万 token，单位 USD）：

| Provider | Model | Input | Output | Cache Read |
|----------|-------|-------|--------|------------|
| OpenAI | gpt-4o | $2.50 | $10.00 | $1.25 |
| OpenAI | gpt-4o-mini | $0.15 | $0.60 | $0.075 |
| Anthropic | claude-sonnet-4-20250514 | $3.00 | $15.00 | $0.30 |
| Anthropic | claude-haiku-3 | $0.25 | $1.25 | $0.03 |
| Google | gemini-2.0-flash | $0.075 | $0.30 | -- |
| 本地模型 | (Ollama 等) | $0.00 | $0.00 | $0.00 |

::: tip
价格表随 PRX 版本更新。使用 `observability.cost.pricing.overrides` 覆盖任意模型的价格。
:::

## 参数说明

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `enabled` | bool | `false` | 启用费用追踪 |
| `store` | string | `"memory"` | 持久化后端 |
| `store_path` | string | -- | SQLite 存储路径 |
| `budget.daily_limit` | f64 | -- | 每日预算上限（USD） |
| `budget.monthly_limit` | f64 | -- | 每月预算上限（USD） |
| `budget.warn_threshold` | f64 | `0.8` | 告警阈值（0-1） |
| `budget.critical_threshold` | f64 | `0.95` | 严重告警阈值（0-1） |
| `budget.on_exceed` | string | `"warn"` | 超预算行为 |
| `budget.notify_channels` | [string] | `[]` | 告警通知渠道 |

## 安全性

- **价格数据本地存储** -- 费用统计存储在本地，不发送到任何外部服务
- **敏感信息脱敏** -- 报告中不包含 prompt 内容，仅记录 token 数量
- **权限控制** -- 多用户模式下费用报告受角色权限限制
- **预算硬限制** -- `on_exceed = "block"` 模式可阻止超预算的 LLM 调用

## 相关文档

- [可观测性概览](./)
- [Prometheus 指标](./prometheus)
- [OpenTelemetry 追踪](./opentelemetry)
- [LLM Router](/zh/prx/router/)
