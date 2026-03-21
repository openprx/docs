---
title: 成员与权限
description: 管理 OpenPR 工作区成员、角色和 Bot Token。基于角色的访问控制，包含 Owner、Admin 和 Member 三个级别。
---

# 成员与权限

OpenPR 使用基于角色的访问控制（RBAC），以工作区为范围。每个工作区成员有一个角色，决定其权限。

## 角色

| 角色 | 说明 | 权限 |
|------|------|------|
| **Owner** | 工作区创建者或被提升为 Owner | 完全访问：删除工作区、管理所有设置、提升/降级成员 |
| **Admin** | 工作区管理员 | 管理项目、成员（Owner 除外）、设置、治理配置 |
| **Member** | 普通团队成员 | 创建和管理 Issue、评论、标签；参与治理 |

## 邀请成员

进入 **工作区设置** > **成员** > **邀请**：

1. 输入用户的邮箱地址。
2. 选择角色（Owner、Admin 或 Member）。
3. 点击 **邀请**。

被邀请的用户必须有 OpenPR 账号。如果没有，需要先注册。

## 管理成员

在成员列表中，你可以：

- **更改角色** -- 提升或降级成员（Admin 不能更改 Owner 角色）。
- **移除** -- 从工作区移除成员。

## 用户类型

OpenPR 支持两种实体类型：

| 类型 | 说明 | 创建方式 |
|------|------|----------|
| `human` | 普通人类用户 | 用户注册 |
| `bot` | Bot/AI 账户 | 创建 Bot Token |

Bot 用户在生成 Bot Token 时自动创建。它们会出现在活动流和审计日志中，显示其名称。

## Bot Token

Bot Token 使 AI 助手和外部工具能够通过 MCP 服务器和 API 进行认证。每个 Token：

- 有 `opr_` 前缀。
- 限定在一个工作区范围内。
- 创建对应的 `bot_mcp` 用户实体。
- 支持工作区成员可用的所有读写操作。

### 创建 Bot Token

进入 **工作区设置** > **Bot Token** > **创建**：

1. 输入显示名称（如"Claude 助手"）。
2. 点击 **创建**。
3. 立即复制 Token——之后将不再显示。

### 使用 Bot Token

Bot Token 用于 MCP 服务器配置：

```bash
# 环境变量
OPENPR_BOT_TOKEN=opr_your_token_here
```

或在 API 请求中：

```bash
curl -H "Authorization: Bearer opr_your_token_here" \
  http://localhost:8080/api/workspaces/<workspace_id>/projects
```

## API 参考

```bash
# 列出工作区成员
curl -H "Authorization: Bearer <token>" \
  http://localhost:8080/api/workspaces/<workspace_id>/members

# 列出 Bot Token
curl -H "Authorization: Bearer <token>" \
  http://localhost:8080/api/workspaces/<workspace_id>/bots
```

## MCP 工具

| 工具 | 说明 |
|------|------|
| `members.list` | 列出所有工作区成员及其角色 |

## 下一步

- [工作区管理](./index) -- 工作区配置
- [MCP 服务器](../mcp-server/) -- 使用 Bot Token 配置 AI 助手
