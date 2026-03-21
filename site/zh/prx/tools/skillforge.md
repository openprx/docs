---
title: 技能自动发现 (Skillforge)
description: PRX Skillforge 自动发现、评估和集成来自 GitHub 和 Clawhub 的工具与技能。
---

# 技能自动发现 (Skillforge)

Skillforge 是 PRX 的技能自动发现引擎，能够从 GitHub、Clawhub 等来源自动发现适合 Agent 的工具和技能，经过适应度评估后生成集成清单。这是 PRX 自进化能力的重要组成部分。

## 概述

Skillforge 解决了 Agent 技能管理中的核心问题：

- **发现** -- 从海量开源仓库和技能市场中找到与 Agent 任务相关的工具
- **评估** -- 自动评估工具的质量、安全性和适应度
- **集成** -- 生成标准化的集成配置，一键启用新技能

### 三阶段管道

```
Scout（发现）→ Evaluate（评估）→ Integrate（集成）
```

## Scout 阶段：发现

Scout 负责从多个来源搜索潜在的工具和技能。

### 支持的来源

| 来源 | 类型 | 内容 |
|------|------|------|
| GitHub | 公开仓库 | MCP Server、CLI 工具、API Wrapper |
| Clawhub | 技能市场 | 社区维护的 PRX 兼容技能 |
| npm / PyPI | 包管理器 | MCP Server 包 |
| 本地目录 | 文件系统 | 本地开发的工具 |

### Scout 配置

```toml
[tools.skillforge.scout]
# 搜索来源
sources = ["github", "clawhub"]

# GitHub 搜索配置
[tools.skillforge.scout.github]
# 搜索关键词（自动结合 Agent 当前技能和任务上下文）
keywords = ["mcp-server", "ai-tool", "llm-tool"]

# 过滤条件
min_stars = 10
max_age_days = 365
languages = ["rust", "typescript", "python"]

# GitHub API Token（用于提高 rate limit）
token = "${GITHUB_TOKEN}"

# Clawhub 搜索配置
[tools.skillforge.scout.clawhub]
registry_url = "https://hub.clawhub.dev"
categories = ["productivity", "development", "data"]
```

### Scout 命令

```bash
# 自动搜索适合当前 Agent 的技能
prx skillforge scout

# 指定关键词搜索
prx skillforge scout --query "database migration tool"

# 指定来源
prx skillforge scout --source github --query "mcp server postgres"

# 输出 JSON 格式
prx skillforge scout --output json
```

## Evaluate 阶段：评估

对 Scout 发现的候选工具进行多维度评分。

### 评分维度

| 维度 | 权重 | 评估内容 |
|------|------|---------|
| 相关性 | 30% | 与 Agent 当前任务和技能图谱的匹配度 |
| 质量 | 25% | 代码质量、文档完整性、测试覆盖率 |
| 安全性 | 25% | 依赖审计、权限要求、已知漏洞 |
| 活跃度 | 10% | 最近提交、issue 响应、维护状态 |
| 兼容性 | 10% | MCP 协议版本、运行时要求、平台支持 |

### 适应度评分

```rust
pub struct FitnessScore {
    /// 总分 (0.0 - 1.0)
    pub total: f64,
    /// 各维度得分
    pub relevance: f64,
    pub quality: f64,
    pub security: f64,
    pub activity: f64,
    pub compatibility: f64,
    /// 风险标记
    pub risks: Vec<RiskFlag>,
    /// 推荐等级
    pub recommendation: Recommendation,
}

pub enum Recommendation {
    /// 强烈推荐，可自动集成
    StronglyRecommend,
    /// 推荐，建议人工确认
    Recommend,
    /// 中性，需要更多信息
    Neutral,
    /// 不推荐，存在风险
    NotRecommend,
    /// 阻止，存在严重安全问题
    Block,
}
```

### 评估配置

```toml
[tools.skillforge.evaluate]
# 最低总分阈值（低于此分数自动过滤）
min_fitness_score = 0.6

# 安全性最低分（安全分低于此值直接 Block）
min_security_score = 0.5

# 自动集成阈值（高于此分数可自动集成，无需人工确认）
auto_integrate_threshold = 0.85

# 权重自定义
[tools.skillforge.evaluate.weights]
relevance = 0.30
quality = 0.25
security = 0.25
activity = 0.10
compatibility = 0.10
```

### 评估命令

```bash
# 评估指定仓库
prx skillforge evaluate https://github.com/user/mcp-server-postgres

# 评估 Scout 结果
prx skillforge scout --query "code review" | prx skillforge evaluate

# 查看评估详情
prx skillforge evaluate --verbose https://github.com/user/tool
```

## Integrate 阶段：集成

对通过评估的工具生成集成配置。

### 集成清单

Skillforge 为每个通过评估的工具生成标准化的集成清单：

```toml
# 自动生成的集成清单示例
[[tools.discovered]]
name = "mcp-server-postgres"
source = "github:user/mcp-server-postgres"
version = "0.3.2"
fitness_score = 0.87
recommendation = "strongly_recommend"

[tools.discovered.config]
transport = "stdio"
command = "npx"
args = ["-y", "mcp-server-postgres"]
env = { DATABASE_URL = "${DATABASE_URL}" }

[tools.discovered.permissions]
read = true
write = true
network = true
filesystem = false
```

### 集成命令

```bash
# 查看集成清单
prx skillforge integrate --dry-run

# 执行集成（自动更新 config.toml）
prx skillforge integrate

# 集成指定工具
prx skillforge integrate mcp-server-postgres

# 回滚集成
prx skillforge rollback mcp-server-postgres
```

## 完整管道

### 一键运行

```bash
# 运行完整管道：发现 → 评估 → 集成（dry-run）
prx skillforge run

# 自动模式（高分工具自动集成）
prx skillforge run --auto

# 交互模式（逐个确认）
prx skillforge run --interactive
```

### 定期发现

```toml
[tools.skillforge.schedule]
# 定期搜索新技能
enabled = true
cron = "0 0 * * 1"  # 每周一零点

# 发现新技能时的通知
notify = true
notify_channels = ["telegram"]
```

## 参数说明

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `scout.sources` | [string] | `["github"]` | 搜索来源 |
| `scout.github.min_stars` | u32 | `10` | GitHub 最低星标数 |
| `scout.github.max_age_days` | u32 | `365` | 最大仓库年龄（天） |
| `evaluate.min_fitness_score` | f64 | `0.6` | 最低总分阈值 |
| `evaluate.min_security_score` | f64 | `0.5` | 安全性最低分 |
| `evaluate.auto_integrate_threshold` | f64 | `0.85` | 自动集成阈值 |
| `schedule.enabled` | bool | `false` | 定期发现 |
| `schedule.cron` | string | -- | cron 表达式 |

## 安全性

- **沙箱评估** -- 评估阶段在隔离环境中进行，不执行候选工具的代码
- **依赖审计** -- 自动检查候选工具的依赖树中是否存在已知漏洞
- **权限声明** -- 每个集成的工具必须显式声明所需权限
- **人工审批** -- 低于 `auto_integrate_threshold` 的工具需要人工确认
- **回滚能力** -- 所有集成操作可回滚，确保快速恢复

## 相关文档

- [工具系统概览](./)
- [MCP 工具](./mcp)
- [Shell 工具](./shell)
- [自进化系统](/zh/prx/self-evolution/)
- [安全策略](/zh/prx/security/)
