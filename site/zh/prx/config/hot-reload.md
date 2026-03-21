---
title: 热重载
description: PRX 配置热重载机制：哪些配置可以热重载，哪些需要重启。
---

# 热重载

PRX 支持在不重启守护进程的情况下动态更新部分配置项。配置变更通过原子存储（ArcSwap）生效，无需加锁，对运行中的请求无影响。

## 触发方式

### CLI 命令

```bash
prx config reload
```

### Agent 工具调用

PRX 内置 `config_reload` 工具，Agent 可以在对话中自动触发配置重载：

```
用户: 把温度调到 0.3
Agent: [调用 config_reload 工具]
       配置已重载，temperature: 0.70 -> 0.30
```

### 工作流程

```
修改 config.toml → 触发 reload → 读取并解析文件
  → 校验 TOML 格式 → 对比差异 → 原子更新内存中的配置
  → 返回变更列表
```

## 可热重载的配置项

以下配置修改后，执行 `prx config reload` 即可**立即生效**，无需重启：

### 模型参数

| 配置项 | 说明 |
|--------|------|
| `default_temperature` | 模型温度参数 |

### Agent 运行时 (`[agent]`)

| 配置项 | 说明 |
|--------|------|
| `agent.max_tool_iterations` | 单轮最大工具调用迭代数 |
| `agent.max_history_messages` | 上下文中保留的最大历史消息数 |
| `agent.parallel_tools` | 是否启用并行工具执行 |
| `agent.compact_context` | 是否启用上下文压缩 |
| `agent.read_only_tool_concurrency_window` | 只读工具并发窗口大小 |
| `agent.read_only_tool_timeout_secs` | 只读工具超时时间 |
| `agent.priority_scheduling_enabled` | 优先级调度开关 |
| `agent.low_priority_tools` | 低优先级工具列表 |
| `agent.concurrency_kill_switch_force_serial` | 并发紧急熔断开关 |
| `agent.concurrency_rollout_stage` | 并发滚动发布阶段 |
| `agent.concurrency_rollout_sample_percent` | 滚动发布采样百分比 |
| `agent.concurrency_rollout_channels` | 滚动发布渠道列表 |
| `agent.concurrency_auto_rollback_enabled` | 自动回滚开关 |
| `agent.concurrency_rollback_timeout_rate_threshold` | 超时率回滚阈值 |
| `agent.concurrency_rollback_cancel_rate_threshold` | 取消率回滚阈值 |
| `agent.concurrency_rollback_error_rate_threshold` | 错误率回滚阈值 |

### 心跳 (`[heartbeat]`)

| 配置项 | 说明 |
|--------|------|
| `heartbeat.enabled` | 心跳检测开关 |
| `heartbeat.interval_minutes` | 心跳间隔（分钟） |

### 定时任务 (`[cron]`)

| 配置项 | 说明 |
|--------|------|
| `cron.enabled` | 定时任务开关 |
| `cron.max_run_history` | 最大运行历史记录数 |

### 网页搜索 (`[web_search]`)

| 配置项 | 说明 |
|--------|------|
| `web_search.enabled` | 网页搜索工具开关 |
| `web_search.max_results` | 每次搜索最大结果数 |

## 需要重启的配置项

以下配置修改后**必须重启** PRX 才能生效：

### 提供商与认证

| 配置项 | 原因 |
|--------|------|
| `api_key` | API 客户端在启动时初始化 |
| `api_url` | Base URL 绑定到 HTTP 客户端 |
| `default_provider` | 提供商实例在启动时创建 |
| `default_model` | 模型选择与提供商实例绑定 |

### 消息渠道

| 配置项 | 原因 |
|--------|------|
| `channels_config.*` | 渠道连接（WebSocket、轮询）在启动时建立 |

所有渠道（Telegram、Discord、Slack、Signal、WhatsApp、Matrix、iMessage、Lark、DingTalk 等）的配置变更都需要重启。

### 记忆与存储

| 配置项 | 原因 |
|--------|------|
| `memory.backend` | 后端切换需要重新初始化数据库连接 |
| `memory.acl_enabled` | ACL 状态在启动时加载，热重载时会忽略此变更 |
| `storage.*` | 存储提供商在启动时初始化 |

### 安全策略

| 配置项 | 原因 |
|--------|------|
| `autonomy.*` | 安全策略在启动时编译 |

### 网关绑定

| 配置项 | 原因 |
|--------|------|
| `gateway.host` | TCP 监听地址在启动时绑定 |
| `gateway.port` | TCP 监听端口在启动时绑定 |

::: warning 网关绑定地址和端口无法热重载
修改 `gateway.host` 或 `gateway.port` 后必须完全重启 PRX。这是因为 TCP 监听器在进程启动时绑定，无法在运行时更换。
:::

## 重载行为细节

### 原子更新

PRX 使用 `ArcSwap` 进行无锁原子配置更新。重载过程中：

1. 异步读取并解析 `config.toml`
2. 逐字段对比新旧配置
3. 保留运行时路径（`config_path`、`workspace_dir`）
4. 通过 `arc_swap::ArcSwap::store()` 原子替换
5. 正在进行的请求继续使用旧配置引用，新请求使用新配置

### 变更报告

重载完成后，PRX 会报告所有检测到的变更：

```
Config reloaded from `/home/user/.openprx/config.toml`.

Changes applied:
  - temperature: 0.70 -> 0.30
  - agent.max_tool_iterations: 50 -> 100
  - web_search.enabled: false -> true
```

如果没有检测到可热重载的变更，会提示：

```
Config reloaded from `/home/user/.openprx/config.toml` -- no hot-reloadable changes detected.
```

### 错误处理

- **文件不存在**：返回错误提示，保持当前配置不变
- **TOML 语法错误**：返回解析错误信息，保持当前配置不变
- **配置路径为空**：返回错误，提示配置路径未设置

重载失败不会影响正在运行的服务，当前配置保持不变。

## 典型使用场景

### 动态调整模型温度

```bash
# 编辑配置
sed -i 's/default_temperature = 0.7/default_temperature = 0.3/' ~/.openprx/config.toml

# 热重载
prx config reload
```

### 紧急关闭并行工具

如果并行工具执行导致问题，可以通过热重载立即关闭：

```toml
# config.toml
[agent]
parallel_tools = false
concurrency_kill_switch_force_serial = true
```

```bash
prx config reload
```

### 调整搜索结果数量

```toml
# config.toml
[web_search]
max_results = 10
```

```bash
prx config reload
```
