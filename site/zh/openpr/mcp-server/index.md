---
title: MCP 服务器
description: OpenPR 内置 MCP 服务器，提供 34 个工具，支持 HTTP、stdio 和 SSE 三种传输协议。将 Claude、Codex、Cursor 等 AI 助手与项目管理集成。
---

# MCP 服务器

OpenPR 内置 **MCP (Model Context Protocol) 服务器**，提供 34 个工具让 AI 助手管理项目、Issue、Sprint、标签、评论、提案和文件。服务器同时支持三种传输协议。

## 传输协议

| 协议 | 使用场景 | 端点 |
|------|----------|------|
| **HTTP** | Web 集成、OpenClaw 插件 | `POST /mcp/rpc` |
| **stdio** | Claude Desktop、Codex、本地 CLI | stdin/stdout JSON-RPC |
| **SSE** | 流式客户端、实时 UI | `GET /sse` + `POST /messages` |

::: tip 多协议
HTTP 模式下，三种协议在同一端口上可用：`/mcp/rpc`（HTTP）、`/sse` + `/messages`（SSE）和 `/health`（健康检查）。
:::

## 配置

### 环境变量

| 变量 | 必需 | 说明 | 示例 |
|------|------|------|------|
| `OPENPR_API_URL` | 是 | API 服务器基础 URL | `http://localhost:3000` |
| `OPENPR_BOT_TOKEN` | 是 | `opr_` 前缀的 Bot Token | `opr_abc123...` |
| `OPENPR_WORKSPACE_ID` | 是 | 默认工作区 UUID | `e5166fd1-...` |

### Claude Desktop / Cursor / Codex（stdio）

添加到 MCP 客户端配置：

```json
{
  "mcpServers": {
    "openpr": {
      "command": "/path/to/mcp-server",
      "args": ["--transport", "stdio"],
      "env": {
        "OPENPR_API_URL": "http://localhost:3000",
        "OPENPR_BOT_TOKEN": "opr_your_token_here",
        "OPENPR_WORKSPACE_ID": "your-workspace-uuid"
      }
    }
  }
}
```

### HTTP 模式

```bash
# 启动 MCP 服务器
./target/release/mcp-server --transport http --bind-addr 0.0.0.0:8090

# 验证
curl -X POST http://localhost:8090/mcp/rpc \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

### SSE 模式

```bash
# 1. 连接 SSE 流（返回会话端点）
curl -N -H "Accept: text/event-stream" http://localhost:8090/sse
# -> event: endpoint
# -> data: /messages?session_id=<uuid>

# 2. POST 请求到返回的端点
curl -X POST "http://localhost:8090/messages?session_id=<uuid>" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"projects.list","arguments":{}}}'
# -> 响应通过 SSE 流返回，event: message
```

### Docker Compose

```yaml
mcp-server:
  build:
    context: .
    dockerfile: Dockerfile.prebuilt
    args:
      APP_BIN: mcp-server
  environment:
    - OPENPR_API_URL=http://api:8080
    - OPENPR_BOT_TOKEN=opr_your_token
    - OPENPR_WORKSPACE_ID=your-workspace-uuid
  ports:
    - "8090:8090"
  command: ["./mcp-server", "--transport", "http", "--bind-addr", "0.0.0.0:8090"]
```

## 工具参考（34 个工具）

### 项目 (5)

| 工具 | 必需参数 | 说明 |
|------|----------|------|
| `projects.list` | -- | 列出工作区所有项目 |
| `projects.get` | `project_id` | 获取项目详情及 Issue 统计 |
| `projects.create` | `key`, `name` | 创建项目 |
| `projects.update` | `project_id` | 更新名称/描述 |
| `projects.delete` | `project_id` | 删除项目 |

### 工作项 / Issue (11)

| 工具 | 必需参数 | 说明 |
|------|----------|------|
| `work_items.list` | `project_id` | 列出项目中的 Issue |
| `work_items.get` | `work_item_id` | 通过 UUID 获取 Issue |
| `work_items.get_by_identifier` | `identifier` | 通过标识符获取（如 `API-42`） |
| `work_items.create` | `project_id`, `title` | 创建 Issue（可选 state、priority、description、assignee_id、due_at、attachments） |
| `work_items.update` | `work_item_id` | 更新任意字段 |
| `work_items.delete` | `work_item_id` | 删除 Issue |
| `work_items.search` | `query` | 跨所有项目全文搜索 |
| `work_items.add_label` | `work_item_id`, `label_id` | 添加一个标签 |
| `work_items.add_labels` | `work_item_id`, `label_ids` | 添加多个标签 |
| `work_items.remove_label` | `work_item_id`, `label_id` | 移除标签 |
| `work_items.list_labels` | `work_item_id` | 列出 Issue 上的标签 |

### 评论 (3)

| 工具 | 必需参数 | 说明 |
|------|----------|------|
| `comments.create` | `work_item_id`, `content` | 创建评论（可选附件） |
| `comments.list` | `work_item_id` | 列出 Issue 评论 |
| `comments.delete` | `comment_id` | 删除评论 |

### 文件 (1)

| 工具 | 必需参数 | 说明 |
|------|----------|------|
| `files.upload` | `filename`, `content_base64` | 上传文件（base64），返回 URL 和文件名 |

### 标签 (5)

| 工具 | 必需参数 | 说明 |
|------|----------|------|
| `labels.list` | -- | 列出所有工作区标签 |
| `labels.list_by_project` | `project_id` | 列出项目标签 |
| `labels.create` | `name`, `color` | 创建标签（颜色：十六进制，如 `#2563eb`） |
| `labels.update` | `label_id` | 更新名称/颜色/描述 |
| `labels.delete` | `label_id` | 删除标签 |

### Sprint (4)

| 工具 | 必需参数 | 说明 |
|------|----------|------|
| `sprints.list` | `project_id` | 列出项目中的 Sprint |
| `sprints.create` | `project_id`, `name` | 创建 Sprint（可选 start_date、end_date） |
| `sprints.update` | `sprint_id` | 更新名称/日期/状态 |
| `sprints.delete` | `sprint_id` | 删除 Sprint |

### 提案 (3)

| 工具 | 必需参数 | 说明 |
|------|----------|------|
| `proposals.list` | `project_id` | 列出提案（可选状态筛选） |
| `proposals.get` | `proposal_id` | 获取提案详情 |
| `proposals.create` | `project_id`, `title`, `description` | 创建治理提案 |

### 成员与搜索 (2)

| 工具 | 必需参数 | 说明 |
|------|----------|------|
| `members.list` | -- | 列出工作区成员和角色 |
| `search.all` | `query` | 跨项目、Issue、评论全局搜索 |

## 响应格式

所有 MCP 工具响应遵循以下结构：

### 成功

```json
{
  "code": 0,
  "message": "success",
  "data": { ... }
}
```

### 错误

```json
{
  "code": 400,
  "message": "错误描述"
}
```

## Bot Token 认证

MCP 服务器通过 **Bot Token**（前缀 `opr_`）认证。在 **工作区设置** > **Bot Token** 中创建。

每个 Bot Token：
- 有显示名称（出现在活动流中）
- 限定在一个工作区范围内
- 创建 `bot_mcp` 用户实体以保证审计追踪完整性
- 支持工作区成员可用的所有读写操作

## 代理集成

对于编码代理，OpenPR 提供：

- **AGENTS.md**（`apps/mcp-server/AGENTS.md`）-- 代理的工作流模式和工具示例。
- **技能包**（`skills/openpr-mcp/SKILL.md`）-- 带工作流模板和脚本的治理技能。

推荐代理工作流：
1. 加载 `AGENTS.md` 了解工具语义。
2. 使用 `tools/list` 在运行时枚举可用工具。
3. 遵循工作流模式：搜索 -> 创建 -> 标签 -> 评论。

## 下一步

- [API 概述](../api/) -- REST API 参考
- [成员与权限](../workspace/members) -- Bot Token 管理
- [配置](../configuration/) -- 所有环境变量
