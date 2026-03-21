---
title: 快速上手
description: 运行 OpenPR 并在 5 分钟内创建第一个工作区、项目和 Issue。
---

# 快速上手

本指南将引导你设置 OpenPR 并创建第一个工作区、项目和 Issue。假设你已经完成了 [安装](./installation)。

## 第一步：启动 OpenPR

如果尚未启动，运行服务：

```bash
cd openpr
docker-compose up -d
```

等待所有服务就绪：

```bash
docker-compose ps
```

## 第二步：注册管理员账号

在浏览器中打开 http://localhost:3000，点击 **注册** 创建账号。

::: tip 首个用户即管理员
第一个注册的用户自动获得 **admin** 角色。该用户可以管理所有工作区、项目和系统设置。
:::

## 第三步：创建工作区

登录后，创建第一个工作区：

1. 在仪表盘点击 **创建工作区**。
2. 输入名称（如"我的团队"）和标识（如"my-team"）。
3. 点击 **创建**。

工作区是所有项目和成员的顶级容器。

## 第四步：创建项目

在工作区内：

1. 点击 **新建项目**。
2. 输入名称（如"后端 API"）和项目键（如"API"）。项目键用作 Issue 标识符的前缀（如 API-1、API-2）。
3. 点击 **创建**。

## 第五步：创建 Issue

进入项目并创建 Issue：

1. 点击 **新建 Issue**。
2. 输入标题和描述。
3. 设置状态（backlog、todo、in_progress 或 done）。
4. 可选设置优先级（low、medium、high、urgent）、负责人和标签。
5. 点击 **创建**。

Issue 也可以通过 API 或 MCP 服务器创建：

```bash
# 通过 REST API 创建 Issue
curl -X POST http://localhost:8080/api/projects/<project_id>/issues \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_token>" \
  -d '{
    "title": "搭建 CI 流水线",
    "state": "todo",
    "priority": "high"
  }'
```

## 第六步：使用看板面板

进入项目的 **面板** 视图。Issue 按状态组织在列中：

| 列 | 状态 | 说明 |
|----|------|------|
| Backlog | `backlog` | 想法和未来工作 |
| To Do | `todo` | 当前周期计划 |
| In Progress | `in_progress` | 正在进行中 |
| Done | `done` | 已完成 |

拖放 Issue 在列之间移动以更新状态。

## 第七步：邀请团队成员

进入 **工作区设置** > **成员**：

1. 点击 **邀请成员**。
2. 输入邮箱地址。
3. 选择角色：**Owner**、**Admin** 或 **Member**。

| 角色 | 权限 |
|------|------|
| Owner | 完全访问，可删除工作区 |
| Admin | 管理项目、成员、设置 |
| Member | 创建和管理 Issue、评论 |

## 第八步：连接 AI 助手（可选）

配置 MCP 服务器让 AI 助手管理你的项目：

1. 进入 **工作区设置** > **Bot Token**。
2. 创建新的 Bot Token，它将有 `opr_` 前缀。
3. 用该 Token 配置你的 AI 助手。

Claude Desktop 配置示例：

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

AI 助手现在可以通过 34 个 MCP 工具列出项目、创建 Issue、管理 Sprint 等。

## 下一步

- [工作区管理](../workspace/) -- 了解工作区组织和成员角色
- [Issue 与工作流](../issues/) -- 深入了解 Issue 跟踪和状态管理
- [Sprint 计划](../issues/sprints) -- 设置 Sprint 周期
- [治理中心](../governance/) -- 启用提案、投票和信任分
- [API 参考](../api/) -- 与外部工具集成
- [MCP 服务器](../mcp-server/) -- AI 助手的完整 MCP 工具参考
