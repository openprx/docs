---
title: 事件总线
description: PRX 插件系统的发布/订阅事件总线，支持 Topic 模式匹配和插件间通信。
---

# 事件总线

PRX 插件系统内置基于 Topic 的发布/订阅事件总线，允许插件之间以及插件与宿主之间进行松耦合通信。事件总线是插件间协作的核心机制。

## 概述

事件总线提供以下能力：

- **发布/订阅** -- 插件可以发布事件到 Topic，也可以订阅感兴趣的 Topic
- **模式匹配** -- 支持精确匹配和通配符订阅
- **异步投递** -- 事件异步投递，不阻塞发布者
- **载荷传递** -- 事件可以携带 JSON 序列化的数据载荷
- **安全隔离** -- 通过权限清单控制插件可发布/订阅的 Topic

## 架构

```
┌──────────┐   publish    ┌──────────────┐   deliver   ┌──────────┐
│  插件 A  │─────────────►│              │────────────►│  插件 B  │
└──────────┘              │   事件总线    │              └──────────┘
                          │              │
┌──────────┐   publish    │  Topic 路由   │   deliver   ┌──────────┐
│  PRX 宿主│─────────────►│  模式匹配     │────────────►│  插件 C  │
└──────────┘              │  载荷验证     │              └──────────┘
                          └──────────────┘
```

## Topic 命名规范

Topic 使用点号分隔的层级命名：

```
<namespace>.<category>.<action>
```

### 系统内置 Topic

| Topic | 说明 | 发布者 |
|-------|------|--------|
| `prx.session.created` | Agent 会话创建 | 宿主 |
| `prx.session.completed` | Agent 会话完成 | 宿主 |
| `prx.message.received` | 收到用户消息 | 宿主 |
| `prx.message.sent` | Agent 回复已发送 | 宿主 |
| `prx.tool.before_execute` | 工具即将执行（可拦截） | 宿主 |
| `prx.tool.after_execute` | 工具执行完成 | 宿主 |
| `prx.config.reloaded` | 配置热重载完成 | 宿主 |
| `prx.evolution.proposed` | 自进化提案生成 | 宿主 |
| `prx.plugin.loaded` | 插件加载完成 | 宿主 |
| `prx.plugin.unloaded` | 插件卸载 | 宿主 |

### 自定义 Topic

插件可以定义自己的 Topic，建议使用插件名作为命名空间前缀：

```
myplugin.data.updated
myplugin.task.completed
myplugin.alert.triggered
```

## 订阅模式

### 精确匹配

订阅特定的完整 Topic：

```rust
// PDK 示例 (Rust)
host::subscribe("prx.session.created", on_session_created);
```

```json
{
  "subscribe": "prx.session.created"
}
```

### 单级通配符 (`+`)

匹配 Topic 层级中的单个段：

```
prx.+.created       匹配 prx.session.created, prx.channel.created
                     不匹配 prx.session.task.created
```

### 多级通配符 (`#`)

匹配 Topic 层级中的零个或多个段（仅可用在末尾）：

```
prx.session.#       匹配 prx.session.created, prx.session.completed
                     也匹配 prx.session.message.received
prx.#               匹配所有 prx 开头的 Topic
```

### 订阅模式对比

| 模式 | 示例 | 说明 |
|------|------|------|
| 精确 | `prx.session.created` | 仅匹配完全一致的 Topic |
| 单级 `+` | `prx.+.created` | `+` 替代一个层级 |
| 多级 `#` | `prx.session.#` | `#` 替代零个或多个层级 |

## 事件载荷

事件携带 JSON 格式的数据载荷：

```json
{
  "topic": "prx.tool.after_execute",
  "timestamp": "2026-03-21T10:00:00Z",
  "source": "prx-host",
  "payload": {
    "tool_name": "shell",
    "session_id": "ses_abc123",
    "duration_ms": 250,
    "exit_code": 0
  }
}
```

### 载荷字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `topic` | String | 事件 Topic |
| `timestamp` | String | 事件时间戳（ISO 8601） |
| `source` | String | 发布者标识（宿主为 `"prx-host"`，插件为插件名） |
| `payload` | Object | 事件特定的数据载荷 |

### 载荷大小限制

| 限制 | 默认值 | 说明 |
|------|--------|------|
| 单条载荷最大大小 | 64 KB | 超过将被拒绝 |
| 每秒最大事件数（每插件） | 100 | 防止事件风暴 |
| 载荷嵌套深度 | 16 层 | 防止过深嵌套 |

## 递归深度控制

为防止事件处理中的无限递归（插件 A 处理事件后发布新事件触发插件 B，插件 B 又触发插件 A），事件总线实施递归深度限制：

```toml
[plugins.event_bus]
max_recursion_depth = 8
```

当事件触发链超过最大递归深度时，新事件将被丢弃并记录警告日志。

### 递归检测机制

每个事件携带 `depth` 计数器：

1. 宿主发布的事件 `depth = 0`
2. 插件处理事件后发布新事件 `depth = parent_depth + 1`
3. `depth >= max_recursion_depth` 时拒绝发布

## 插件间通信

事件总线是插件间通信的推荐方式。插件不能直接调用其他插件的函数，但可以通过事件进行协作。

### 通信模式

**请求-响应模式**

```
插件 A ── publish "myplugin.request.analyze" ──► 事件总线 ──► 插件 B
                                                              │
插件 A ◄── deliver "myplugin.response.analyze" ◄── 事件总线 ◄─┘
```

**广播模式**

```
插件 A ── publish "shared.data.updated" ──► 事件总线 ──┬──► 插件 B
                                                       ├──► 插件 C
                                                       └──► 插件 D
```

**管道模式**

```
宿主 ─► "prx.message.received" ─► 插件 A (翻译)
                                      │
                                      ▼
                              "pipeline.translated" ─► 插件 B (审核)
                                                           │
                                                           ▼
                                                   "pipeline.approved" ─► 插件 C (处理)
```

## 配置

```toml
[plugins.event_bus]
enabled = true
max_recursion_depth = 8
max_payload_size_kb = 64
max_events_per_second = 100
dead_letter_enabled = true
dead_letter_retention_hours = 24
```

### 参数说明

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `enabled` | bool | `true` | 启用事件总线（插件系统启用时默认启用） |
| `max_recursion_depth` | usize | `8` | 事件触发链最大递归深度 |
| `max_payload_size_kb` | usize | `64` | 单条事件载荷最大大小（KB） |
| `max_events_per_second` | usize | `100` | 每个插件每秒最大发布事件数 |
| `dead_letter_enabled` | bool | `true` | 启用死信队列（投递失败的事件） |
| `dead_letter_retention_hours` | u64 | `24` | 死信保留时间（小时） |

## 权限控制

插件必须在清单中声明可发布和订阅的 Topic：

```toml
# 插件清单 (plugin.toml)
[permissions.events]
publish = ["myplugin.*"]
subscribe = ["prx.session.*", "prx.tool.after_execute", "other_plugin.data.*"]
```

未声明的 Topic 操作将被拒绝。

## 使用方法

### PDK 示例 (Rust)

```rust
use prx_pdk::prelude::*;

#[prx_plugin]
fn init() {
    // 订阅事件
    host::subscribe("prx.message.received", |event: Event| {
        let content = event.payload.get("content")
            .and_then(|v| v.as_str())
            .unwrap_or_default();

        if content.contains("alert") {
            // 发布新事件
            host::publish("myplugin.alert.triggered", json!({
                "original_message": content,
                "severity": "high"
            }));
        }
    });
}
```

### 调试事件

```bash
# 监听所有事件
prx plugin events --watch "prx.#"

# 监听特定 Topic
prx plugin events --watch "prx.tool.after_execute"

# 手动发布测试事件
prx plugin events --publish "test.ping" --payload '{"msg": "hello"}'
```

## 相关文档

- [插件系统概览](./)
- [插件架构](./architecture) -- WASM 运行时和宿主-客户边界
- [宿主函数](./host-functions) -- 插件可调用的宿主 API
- [PDK 参考](./pdk) -- 插件开发工具包
- [开发者指南](./developer-guide) -- 从零开始编写插件
