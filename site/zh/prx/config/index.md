---
title: 配置概述
description: PRX 配置系统：TOML 文件结构、配置节、编辑方式与热重载。
---

# 配置概述

PRX 使用 TOML 格式的配置文件管理所有运行时行为。配置系统支持分层加载、环境变量覆盖、密钥加密存储和运行时热重载。

## 配置文件位置

PRX 的配置文件存储在用户目录下：

```
~/.openprx/
  config.toml          # 主配置文件
  workspace/           # 工作区目录（记忆、日志等）
  active_workspace.toml # 活跃工作区指针（可选）
```

**解析优先级（从高到低）：**

1. `OPENPRX_CONFIG_DIR` 环境变量 - 完全覆盖配置目录
2. `OPENPRX_WORKSPACE` 环境变量 - 指定工作区路径
3. `active_workspace.toml` 标记文件 - 持久化的工作区切换
4. `~/.openprx/config.toml` - 默认位置

## TOML 格式说明

PRX 使用 [TOML v1.0](https://toml.io/cn/) 作为配置格式。TOML 语法简洁、类型明确，适合机器解析和人工编辑。

```toml
# 字符串
default_provider = "anthropic"

# 数值
default_temperature = 0.7

# 布尔值
[router]
enabled = true

# 数组
[channels_config.telegram]
allowed_users = ["12345678", "username"]

# 嵌套表
[memory]
backend = "sqlite"
auto_save = true
```

## 主要配置节

PRX 配置文件由以下主要节组成：

| 配置节 | 说明 | 文档 |
|--------|------|------|
| 顶层字段 | `default_provider`、`default_model`、`default_temperature`、`api_key` | [完整参考](/zh/prx/config/reference) |
| `[gateway]` | 网关服务器：主机、端口、配对认证、速率限制 | [完整参考](/zh/prx/config/reference#gateway) |
| `[channels_config]` | 消息渠道：Telegram、Discord、Slack、WhatsApp 等 | [完整参考](/zh/prx/config/reference#channels-config) |
| `[memory]` | 记忆后端：SQLite/Markdown/PostgreSQL、嵌入向量、清理策略 | [完整参考](/zh/prx/config/reference#memory) |
| `[router]` | LLM 路由器：启发式权重、KNN、Automix | [完整参考](/zh/prx/config/reference#router) |
| `[security]` | 安全策略：沙箱、资源限制、审计日志、工具策略 | [完整参考](/zh/prx/config/reference#security) |
| `[observability]` | 可观测性：日志、Prometheus、OpenTelemetry | [完整参考](/zh/prx/config/reference#observability) |
| `[mcp]` | Model Context Protocol：外部 MCP 服务器集成 | [完整参考](/zh/prx/config/reference#mcp) |
| `[browser]` | 浏览器自动化：后端选择、域名白名单 | [完整参考](/zh/prx/config/reference#browser) |
| `[web_search]` | 网页搜索：搜索引擎、结果数量限制 | [完整参考](/zh/prx/config/reference#web-search) |
| `[xin]` | 心 - 自主任务引擎：定时调度、并发控制 | [完整参考](/zh/prx/config/reference#xin) |
| `[agent]` | Agent 运行时：工具迭代上限、历史消息、并行执行 | [完整参考](/zh/prx/config/reference#agent) |
| `[autonomy]` | 自主权控制：作用域规则、工具白/黑名单 | [完整参考](/zh/prx/config/reference#autonomy) |
| `[reliability]` | 可靠性：重试次数、备用提供商链 | [完整参考](/zh/prx/config/reference#reliability) |
| `[cost]` | 成本控制：预算上限、费用追踪 | [完整参考](/zh/prx/config/reference#cost) |
| `[proxy]` | 代理设置：HTTP/HTTPS/SOCKS5 出站代理 | [完整参考](/zh/prx/config/reference#proxy) |

## 编辑方式

### 交互式向导

首次使用推荐通过引导向导完成配置，它会交互式引导你选择提供商、设置 API Key、配置渠道：

```bash
prx onboard
```

### CLI 命令

使用 `prx config` 子命令查看和修改配置：

```bash
# 查看当前配置
prx config show

# 设置单个字段
prx config set default_provider anthropic
prx config set default_temperature 0.5

# 重载配置（热重载）
prx config reload
```

### 直接编辑

用任意文本编辑器打开配置文件：

```bash
# 使用默认编辑器
$EDITOR ~/.openprx/config.toml

# 或者直接编辑
nano ~/.openprx/config.toml
vim ~/.openprx/config.toml
```

## Schema 导出

PRX 支持导出 JSON Schema，可用于编辑器自动补全和校验：

```bash
prx config schema > openprx-schema.json
```

在 VS Code 中配置 TOML 语言服务器（如 Even Better TOML）关联此 Schema，即可获得智能提示。

## 热重载

PRX 支持部分配置项的运行时热重载，无需重启守护进程。修改 `config.toml` 后，通过以下方式触发重载：

```bash
prx config reload
```

或让 Agent 调用内置的 `config_reload` 工具。

**可热重载的配置项：**
- `default_temperature`
- `agent.*`（工具迭代上限、历史消息、并行工具、上下文压缩等）
- `heartbeat.enabled`、`heartbeat.interval_minutes`
- `cron.enabled`、`cron.max_run_history`
- `web_search.enabled`、`web_search.max_results`

**需要重启的配置项：**
- `api_key`、`api_url`、`default_provider`、`default_model`
- `channels_config`（所有消息渠道配置）
- `memory`、`storage`（后端切换）
- `autonomy`（安全策略）
- `gateway.host`、`gateway.port`

详见 [热重载](/zh/prx/config/hot-reload) 和 [环境变量](/zh/prx/config/environment)。

## 密钥加密

PRX 使用 ChaCha20-Poly1305 对配置文件中的敏感字段进行加密存储：

```toml
[secrets]
encrypt = true
```

启用后，`api_key`、`bot_token` 等敏感字段在写入 `config.toml` 时会自动加密，运行时自动解密。密钥文件存储在 `~/.openprx/` 目录下。

## 最小配置示例

以下是一个最小可用的配置文件：

```toml
default_provider = "anthropic"
default_model = "claude-sonnet-4-6"
api_key = "sk-ant-..."

[channels_config.telegram]
bot_token = "123456:ABC-DEF..."
allowed_users = ["your_telegram_id"]
```

这将启动一个连接 Anthropic Claude 的 Telegram 机器人。
