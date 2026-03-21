# CLI 命令参考

OpenPR 在 `openpr-mcp` 二进制文件中内置了命令行界面。除了运行 MCP 服务器外，它还提供了直接在终端中管理项目、工作项、评论、标签、Sprint 等功能的命令。

## 安装

CLI 作为 `mcp-server` crate 的一部分提供。构建后，二进制文件名为 `openpr-mcp`。

```bash
cargo build --release -p mcp-server
```

## 全局参数

以下参数适用于所有命令：

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `--api-url <URL>` | API 服务器地址 | `http://localhost:8080` |
| `--bot-token <TOKEN>` | 认证令牌（`opr_` 前缀） | -- |
| `--workspace-id <UUID>` | 操作所在的工作区上下文 | -- |
| `--format json\|table` | 输出格式 | `table` |

也可以通过环境变量设置：

```bash
export OPENPR_API_URL=http://localhost:8080
export OPENPR_BOT_TOKEN=opr_your_token_here
export OPENPR_WORKSPACE_ID=your-workspace-uuid
```

## 命令

### serve -- 启动 MCP 服务器

运行 MCP 服务器，用于 AI 工具集成。

```bash
# HTTP 传输（默认）
openpr-mcp serve --transport http --port 8090

# Stdio 传输（用于直接集成）
openpr-mcp serve --transport stdio
```

### projects -- 项目管理

```bash
# 列出工作区中的所有项目
openpr-mcp projects list --format table

# 获取特定项目的详情
openpr-mcp projects get <project_id>

# 创建新项目
openpr-mcp projects create --name "我的项目" --key "MP"
```

### work-items -- 工作项管理

```bash
# 使用过滤器列出工作项
openpr-mcp work-items list --project-id <id> --state todo
openpr-mcp work-items list --project-id <id> --state in_progress --assignee-id <user_id>

# 获取特定工作项
openpr-mcp work-items get <id>

# 创建工作项
openpr-mcp work-items create --project-id <id> --title "修复 Bug" --state todo
openpr-mcp work-items create --project-id <id> --title "新功能" --state backlog --priority high

# 更新工作项
openpr-mcp work-items update <id> --state in_progress --assignee-id <user_id>
openpr-mcp work-items update <id> --state done --priority low

# 按文本搜索工作项
openpr-mcp work-items search --query "认证"
```

### comments -- 评论管理

```bash
# 列出工作项的评论
openpr-mcp comments list --work-item-id <id>

# 添加评论
openpr-mcp comments create --work-item-id <id> --content "已在 commit abc123 中修复"
```

### labels -- 标签管理

```bash
# 列出工作区级别的标签
openpr-mcp labels list --workspace

# 列出项目级别的标签
openpr-mcp labels list --project-id <id>
```

### sprints -- Sprint 管理

```bash
# 列出项目的 Sprint
openpr-mcp sprints list --project-id <id>
```

### search -- 全局搜索

```bash
# 跨所有实体搜索
openpr-mcp search --query "bug"
```

### files -- 文件附件

```bash
# 上传文件到工作项
openpr-mcp files upload --work-item-id <id> --path ./screenshot.png
```

## 使用示例

### 典型工作流

```bash
# 设置认证信息
export OPENPR_API_URL=https://openpr.example.com
export OPENPR_BOT_TOKEN=opr_abc123
export OPENPR_WORKSPACE_ID=550e8400-e29b-41d4-a716-446655440000

# 列出项目
openpr-mcp projects list

# 查看项目的待办工作项
openpr-mcp work-items list --project-id <id> --state todo --format table

# 领取工作项
openpr-mcp work-items update <item_id> --state in_progress --assignee-id <your_user_id>

# 完成后添加评论
openpr-mcp comments create --work-item-id <item_id> --content "已完成，见 PR #42。"

# 标记为完成
openpr-mcp work-items update <item_id> --state done
```

### JSON 输出用于脚本

使用 `--format json` 获取机器可读的输出，适合通过管道传递给 `jq` 或其他工具：

```bash
# 以 JSON 格式获取所有进行中的工作项
openpr-mcp work-items list --project-id <id> --state in_progress --format json

# 按状态统计工作项数量
openpr-mcp work-items list --project-id <id> --format json | jq '.[] | .state' | sort | uniq -c
```

## 参见

- [MCP 服务器](../mcp-server/) -- 面向 AI 代理的 MCP 工具集成
- [API 参考](../api/) -- 完整的 REST API 文档
- [工作流状态](../issues/workflow) -- Issue 状态管理与自定义工作流
