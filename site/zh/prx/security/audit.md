---
title: 审计日志
description: PRX AuditLogger 安全事件追踪系统，记录所有安全相关操作用于审计与合规。
---

# 审计日志

PRX 内置 AuditLogger 组件，持续追踪所有安全相关事件。审计日志为安全审计、合规检查和事后溯源提供不可篡改的事件记录。

## 概述

AuditLogger 拦截 PRX 运行时中的关键操作并记录为结构化审计事件，包括：

- **工具执行** -- 每次工具调用的参数、结果和耗时
- **策略决策** -- 策略引擎允许或拒绝操作的记录
- **认证事件** -- 配对、登录、Token 刷新等身份相关操作
- **配置变更** -- 运行时配置的热重载和修改记录
- **进化操作** -- 自进化系统的提案、审批和变更记录

## 事件类型

### 安全事件

| 事件 | 严重级别 | 说明 |
|------|----------|------|
| `auth.pair_request` | Info | 设备发起配对请求 |
| `auth.pair_success` | Info | 设备配对成功 |
| `auth.pair_failed` | Warn | 配对验证失败（错误码/过期） |
| `auth.token_issued` | Info | 颁发新的访问 Token |
| `auth.token_revoked` | Info | Token 被撤销 |
| `auth.unauthorized` | Warn | 未授权的 API 请求 |

### 策略事件

| 事件 | 严重级别 | 说明 |
|------|----------|------|
| `policy.allow` | Debug | 策略引擎允许操作 |
| `policy.deny` | Warn | 策略引擎拒绝操作 |
| `policy.rule_matched` | Debug | 匹配到的具体策略规则 |

### 工具事件

| 事件 | 严重级别 | 说明 |
|------|----------|------|
| `tool.execute` | Info | 工具开始执行 |
| `tool.complete` | Info | 工具执行完成 |
| `tool.error` | Error | 工具执行出错 |
| `tool.timeout` | Warn | 工具执行超时 |
| `tool.sandbox_violation` | Error | 沙箱安全违规 |

### 系统事件

| 事件 | 严重级别 | 说明 |
|------|----------|------|
| `config.reload` | Info | 配置热重载 |
| `config.changed` | Info | 配置项发生变更 |
| `evolution.proposed` | Info | 自进化提案生成 |
| `evolution.applied` | Info | 进化变更已应用 |
| `evolution.rollback` | Warn | 进化变更被回滚 |
| `session.created` | Info | Agent 会话创建 |
| `session.terminated` | Info | Agent 会话终止 |

## 日志格式

审计日志以 JSON Lines 格式存储，每行一个事件：

```json
{
  "timestamp": "2026-03-21T10:15:30.123Z",
  "event": "tool.execute",
  "severity": "info",
  "session_id": "ses_abc123",
  "user_id": "usr_def456",
  "channel": "telegram",
  "details": {
    "tool": "shell",
    "args": {"command": "ls -la /tmp"},
    "policy_result": "allow",
    "matched_rule": "allow-read-workspace"
  },
  "source_ip": "127.0.0.1",
  "trace_id": "tr_789xyz"
}
```

### 字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `timestamp` | String | ISO 8601 时间戳（UTC） |
| `event` | String | 事件类型标识符 |
| `severity` | String | 严重级别：`debug` / `info` / `warn` / `error` |
| `session_id` | String? | 关联的 Agent 会话 ID |
| `user_id` | String? | 触发事件的用户标识 |
| `channel` | String? | 消息来源渠道 |
| `details` | Object | 事件特定的详细信息 |
| `source_ip` | String? | 请求来源 IP 地址 |
| `trace_id` | String? | OpenTelemetry Trace ID（启用 OTel 时） |

## 配置

### 基础配置

```toml
[security.audit]
enabled = true
log_path = "audit.log"
```

### 完整配置

```toml
[security.audit]
enabled = true
log_path = "audit.log"
max_file_size_mb = 100
rotation = "daily"
retention_days = 90
min_severity = "info"
include_events = []
exclude_events = ["policy.allow"]
```

### 参数说明

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `enabled` | bool | `true` | 启用审计日志 |
| `log_path` | String | `"audit.log"` | 日志文件路径（相对于 PRX 数据目录） |
| `max_file_size_mb` | u64 | `100` | 单个日志文件最大大小（MB） |
| `rotation` | String | `"daily"` | 日志轮转策略：`"daily"` / `"size"` / `"none"` |
| `retention_days` | u32 | `90` | 日志保留天数，过期自动删除 |
| `min_severity` | String | `"info"` | 最低记录级别 |
| `include_events` | Vec\<String\> | `[]`（全部） | 仅记录指定事件类型（空数组 = 全部） |
| `exclude_events` | Vec\<String\> | `[]` | 排除的事件类型 |

## 查询审计记录

### CLI 查询

```bash
# 查看最近 50 条审计事件
prx audit log --tail 50

# 按事件类型过滤
prx audit log --event "tool.execute" --tail 20

# 按时间范围过滤
prx audit log --since "2026-03-20" --until "2026-03-21"

# 按严重级别过滤
prx audit log --severity warn

# 按用户过滤
prx audit log --user usr_def456

# 导出为 JSON 文件
prx audit export --since "2026-03-01" --output audit-march.json
```

### 编程查询

通过网关 API 查询审计记录：

```bash
curl -H "Authorization: Bearer <token>" \
  "http://localhost:16830/api/v1/audit?event=policy.deny&since=2026-03-20&limit=100"
```

## 合规与安全

### 日志完整性

- 审计日志采用追加模式写入，运行时不修改已有记录
- 建议将日志目录设置为只读（除 PRX 进程外）
- 生产环境建议将日志转发到外部 SIEM 系统

### 合规建议

| 要求 | 建议配置 |
|------|----------|
| 日志保留 | `retention_days = 365`（视合规要求） |
| 事件完整性 | `min_severity = "debug"`（记录所有事件） |
| 外部备份 | 使用 syslog 或 Fluentd 转发到集中日志系统 |
| 访问审计 | 将审计日志目录权限限制为 `0640` |

### 与 OpenTelemetry 集成

启用 OTel 后，审计事件会自动关联 Trace ID，便于在分布式追踪系统中查看完整调用链：

```toml
[observability]
backend = "otel"
otel_endpoint = "http://localhost:4318"

[security.audit]
enabled = true
```

## 相关文档

- [安全概览](./)
- [策略引擎](./policy-engine) -- 控制工具和数据访问的策略规则
- [威胁模型](./threat-model)
- [可观测性](/zh/prx/observability/) -- Prometheus 和 OpenTelemetry 集成
- [完整配置参考](/zh/prx/config/reference)
