---
title: 审批工作流
description: PRX 监督式工具调用的审批流程，确保高风险操作经过人工确认。
---

# 审批工作流

PRX 提供完整的工具调用审批工作流，在 Agent 执行高风险或敏感操作前要求人工确认。这是 PRX "Human-in-the-Loop" 安全理念的核心实现。

## 概述

审批工作流确保 Agent 不会在无人监督下执行危险操作：

- **请求** -- Agent 判断需要调用受保护的工具时，生成审批请求
- **等待** -- 工具调用暂停，等待审批者响应
- **决策** -- 审批者批准或拒绝请求，附加可选说明
- **执行** -- 批准后工具调用继续执行；拒绝后 Agent 收到反馈并调整策略

### 流程图

```
Agent 请求工具调用
  │
  ├─ 工具策略检查
  │   ├─ "auto_approve" → 直接执行
  │   ├─ "always_deny" → 直接拒绝
  │   └─ "require_approval" → 进入审批流程
  │
  ├─ 创建 ApprovalRequest
  │   ├─ 记录工具名、参数、上下文
  │   └─ 发送通知到审批渠道
  │
  ├─ 等待审批
  │   ├─ 审批者批准 → 执行工具调用
  │   ├─ 审批者拒绝 → 返回拒绝原因给 Agent
  │   └─ 超时 → 执行默认策略
  │
  └─ 记录审计日志
```

## 核心结构体

### `ApprovalRequest`

```rust
pub struct ApprovalRequest {
    /// 请求 ID
    pub id: Uuid,
    /// 请求的工具名称
    pub tool_name: String,
    /// 工具调用参数
    pub arguments: serde_json::Value,
    /// Agent 提供的调用理由
    pub reason: String,
    /// 关联的会话 ID
    pub session_id: String,
    /// 请求时间
    pub requested_at: DateTime<Utc>,
    /// 超时时间
    pub expires_at: DateTime<Utc>,
    /// 风险等级
    pub risk_level: RiskLevel,
    /// 上下文摘要（最近几轮对话）
    pub context_summary: String,
}
```

### `ApprovalDecision`

```rust
pub enum ApprovalDecision {
    /// 批准执行
    Approved {
        approver: String,
        comment: Option<String>,
        decided_at: DateTime<Utc>,
    },
    /// 拒绝执行
    Rejected {
        approver: String,
        reason: String,
        decided_at: DateTime<Utc>,
    },
    /// 超时未处理
    TimedOut {
        expired_at: DateTime<Utc>,
    },
}
```

### 风险等级

```rust
pub enum RiskLevel {
    /// 低风险：文件读取、信息查询
    Low,
    /// 中风险：文件修改、API 调用
    Medium,
    /// 高风险：系统命令、数据删除
    High,
    /// 关键：不可逆操作、生产环境变更
    Critical,
}
```

## 配置

### 基础配置

```toml
[security.approval]
# 启用审批工作流
enabled = true

# 默认策略: "auto_approve" | "require_approval" | "always_deny"
default_policy = "require_approval"

# 审批超时（秒）
timeout = 300  # 5 分钟

# 超时默认行为: "deny" | "approve"
on_timeout = "deny"
```

### 工具级策略

为不同工具设置不同的审批策略：

```toml
# 读取类工具 — 自动批准
[security.approval.tools."file.read"]
policy = "auto_approve"

[security.approval.tools."web_search"]
policy = "auto_approve"

[security.approval.tools."memory.recall"]
policy = "auto_approve"

# 写入类工具 — 需要审批
[security.approval.tools."file.write"]
policy = "require_approval"
risk_level = "medium"

[security.approval.tools."git.commit"]
policy = "require_approval"
risk_level = "medium"

# 执行类工具 — 高风险审批
[security.approval.tools."shell.execute"]
policy = "require_approval"
risk_level = "high"
timeout = 600  # 更长的审批窗口

# 危险操作 — 始终拒绝
[security.approval.tools."shell.execute_as_root"]
policy = "always_deny"
```

### 基于模式的策略

使用通配符匹配工具名称：

```toml
# 所有读取操作自动批准
[security.approval.patterns."*.read"]
policy = "auto_approve"

# 所有删除操作需要审批
[security.approval.patterns."*.delete"]
policy = "require_approval"
risk_level = "critical"

# 所有第三方插件工具需要审批
[security.approval.patterns."plugins.*"]
policy = "require_approval"
risk_level = "high"
```

### 通知配置

```toml
[security.approval.notification]
# 审批通知渠道
channels = ["telegram", "cli"]

# 通知消息模板
[security.approval.notification.template]
title = "PRX 审批请求"
# 可用变量: {tool_name}, {risk_level}, {reason}, {session_id}, {expires_in}
body = """
工具: {tool_name}
风险: {risk_level}
原因: {reason}
会话: {session_id}
过期: {expires_in}
"""
```

## 使用方法

### CLI 审批

当 Agent 在 CLI 模式下运行时，审批请求直接在终端交互：

```
[APPROVAL REQUIRED] shell.execute
Risk: high
Command: git push origin main --force
Reason: User requested force push to update remote branch

(a)pprove / (r)eject / (d)etail? > a
[APPROVED] Executing shell.execute...
```

### 远程审批

通过配置的消息渠道（如 Telegram）接收审批通知：

```
PRX 审批请求 #a1b2c3

工具: shell.execute
风险: HIGH
命令: rm -rf /tmp/build-cache/*
原因: 清理构建缓存以释放磁盘空间
会话: session-xyz
过期: 5 分钟

回复 /approve a1b2c3 或 /reject a1b2c3 <原因>
```

### CLI 管理命令

```bash
# 列出待审批请求
prx approval list

# 批准请求
prx approval approve <request-id>

# 拒绝请求
prx approval reject <request-id> --reason "操作风险过高"

# 查看审批历史
prx approval history --limit 50

# 查看特定会话的审批记录
prx approval history --session <session-id>
```

## 审批链

对于关键操作，可配置多级审批：

```toml
[security.approval.chains."production_deploy"]
# 需要至少 2 人批准
required_approvals = 2

# 审批者列表
approvers = ["admin", "lead"]

# 任一人可否决
any_can_reject = true

# 链式超时
timeout = 1800  # 30 分钟
```

## 参数说明

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `enabled` | bool | `false` | 启用审批工作流 |
| `default_policy` | string | `"require_approval"` | 默认审批策略 |
| `timeout` | u64 | `300` | 审批超时秒数 |
| `on_timeout` | string | `"deny"` | 超时默认行为 |
| `tools.<name>.policy` | string | -- | 工具级审批策略 |
| `tools.<name>.risk_level` | string | `"medium"` | 工具风险等级 |
| `notification.channels` | [string] | `["cli"]` | 通知渠道 |
| `chains.<name>.required_approvals` | u32 | `1` | 所需审批人数 |

## 安全性

- **不可绕过** -- 审批流程在 Agent runtime 层强制执行，Agent prompt 无法跳过
- **审计日志** -- 所有审批请求和决策都记录在审计日志中，支持事后审查
- **超时安全** -- 默认超时行为为 "deny"，避免无人值守时自动通过
- **上下文可见** -- 审批者可查看完整的调用上下文和 Agent 理由
- **参数检查** -- 审批者可查看工具调用的完整参数，而非仅工具名称
- **防重放** -- 每个审批请求有唯一 ID 和有效期，防止重复使用旧审批

## 最佳实践

1. **分层策略** -- 只读操作自动批准，写入操作按风险分级审批
2. **合理超时** -- 根据工具的紧急程度设置不同的超时时间
3. **多渠道通知** -- 配置多个通知渠道，确保审批者能及时收到请求
4. **定期审查** -- 定期审查审批历史，优化策略配置
5. **信任升级** -- 随着对特定工具的信任建立，逐步放宽审批要求

## 相关文档

- [安全策略概览](/zh/prx/security/)
- [策略引擎](/zh/prx/security/policy-engine)
- [安全沙箱](/zh/prx/security/sandbox)
- [威胁模型](/zh/prx/security/threat-model)
- [Agent 循环](/zh/prx/agent/loop)
