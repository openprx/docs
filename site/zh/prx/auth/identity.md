---
title: 身份管理
description: PRX 工作区和用户作用域的身份管理系统，支持多租户身份上下文和身份传播。
---

# 身份管理

PRX 的身份管理系统为多租户环境提供完整的身份上下文支持。从单用户 CLI 到多工作区服务器部署，身份系统确保每个操作都有明确的执行者归属和权限边界。

## 概述

身份管理覆盖以下核心场景：

- **身份解析** -- 确定每个请求的执行者身份（人类用户、Bot、API Key）
- **作用域隔离** -- 工作区级别的数据和配置隔离
- **身份传播** -- 在 Agent 调用链中传递身份上下文
- **用户画像** -- 记录用户偏好和行为特征，用于个性化响应

## 身份模型

### `Identity` 结构体

```rust
pub struct Identity {
    /// 用户唯一标识
    pub user_id: Uuid,
    /// 显示名称
    pub display_name: String,
    /// 身份类型
    pub entity_type: EntityType,
    /// 当前工作区
    pub workspace_id: Option<Uuid>,
    /// 工作区角色
    pub workspace_role: Option<WorkspaceRole>,
    /// 认证方式
    pub auth_method: AuthMethod,
    /// 用户画像
    pub profile: UserProfile,
}
```

### 身份类型

```rust
pub enum EntityType {
    /// 人类用户
    Human,
    /// Bot / 自动化代理
    Bot,
    /// Service Account（系统间调用）
    Service,
}
```

### 工作区角色

```rust
pub enum WorkspaceRole {
    /// 工作区所有者：完全控制
    Owner,
    /// 管理员：管理成员和配置
    Admin,
    /// 普通成员：使用 Agent 和工具
    Member,
    /// 访客：只读权限
    Guest,
}
```

## 作用域模型

PRX 使用层级化的作用域模型隔离数据和配置：

```
Global (系统级)
  └─ Workspace (工作区级)
       └─ Project (项目级)
            └─ User (用户级)
```

### 作用域继承

配置和权限沿作用域链向下继承，下级可覆盖上级：

```toml
# Global 级别默认配置
[identity.defaults]
entity_type = "human"
default_role = "member"

# 工作区级别覆盖
[identity.workspace."team-alpha"]
default_role = "member"
allow_bot_creation = true
max_members = 50

# 项目级别覆盖
[identity.workspace."team-alpha".project."api-backend"]
allowed_tools = ["git", "shell", "file"]
```

## 配置

### 基础配置

```toml
[auth.identity]
# 身份提供商: "local" | "oauth2" | "ldap"
provider = "local"

# 会话超时（秒）
session_timeout = 86400  # 24 小时

# 允许的身份类型
allowed_entity_types = ["human", "bot"]

# 是否允许匿名访问
allow_anonymous = false
```

### 多租户配置

```toml
[auth.identity.multitenancy]
# 启用多租户模式
enabled = true

# 工作区创建策略: "open" | "invite_only" | "admin_only"
workspace_creation = "admin_only"

# 用户最多加入的工作区数
max_workspaces_per_user = 10

# 工作区间数据隔离级别: "strict" | "shared_tools"
isolation = "strict"
```

### 身份传播配置

```toml
[auth.identity.propagation]
# 在工具调用中传递身份信息
enabled = true

# 传播方式: "header" | "env" | "context"
method = "header"

# 传播的字段
fields = ["user_id", "workspace_id", "role"]

# HTTP Header 名称前缀
header_prefix = "X-PRX-Identity-"
```

## 身份传播

当 Agent 调用工具或子 Agent 时，身份上下文沿调用链传播：

### 传播链路

```
用户请求 (Identity: alice@team-alpha, role: admin)
  │
  ├─ Agent 处理 (携带 alice 身份)
  │    │
  │    ├─ 调用 shell.execute
  │    │   → X-PRX-Identity-User: alice
  │    │   → X-PRX-Identity-Workspace: team-alpha
  │    │   → X-PRX-Identity-Role: admin
  │    │
  │    ├─ 调用 Sub-Agent
  │    │   → 子 Agent 继承 alice 身份
  │    │   → 权限受父 Agent 限制
  │    │
  │    └─ 调用 MCP Server
  │        → 通过 env 或 header 传递身份
  │
  └─ 审计日志记录 actor=alice
```

### 身份降级

子 Agent 和工具调用的权限不能超过发起者：

```rust
pub struct PropagatedIdentity {
    /// 原始身份
    pub original: Identity,
    /// 有效权限（可能被降级）
    pub effective_permissions: Permissions,
    /// 传播深度
    pub depth: u32,
    /// 传播链路追踪
    pub trace: Vec<String>,
}
```

## 用户画像

用户画像记录个性化信息，帮助 Agent 提供更好的响应：

### `UserProfile` 结构体

```rust
pub struct UserProfile {
    /// 偏好语言
    pub language: String,
    /// 时区
    pub timezone: String,
    /// 沟通风格偏好: "concise" | "detailed" | "technical"
    pub communication_style: String,
    /// 技术栈标签
    pub tech_stack: Vec<String>,
    /// 自定义偏好
    pub preferences: HashMap<String, serde_json::Value>,
    /// 最后活跃时间
    pub last_active: DateTime<Utc>,
}
```

### 画像配置

```toml
[auth.identity.profile]
# 启用用户画像
enabled = true

# 画像存储后端（跟随 memory backend）
store = "auto"

# 自动学习用户偏好
auto_learn = true

# 画像数据保留天数
retention_days = 365
```

### CLI 管理

```bash
# 查看当前身份
prx identity whoami

# 查看用户画像
prx identity profile

# 更新画像
prx identity profile set language zh
prx identity profile set timezone "Asia/Shanghai"
prx identity profile set communication_style technical

# 切换工作区
prx identity switch-workspace team-beta

# 列出工作区成员
prx identity members

# 邀请成员
prx identity invite user@example.com --role member

# 创建 Bot 身份
prx identity create-bot --name "ci-bot" --workspace team-alpha
```

## 参数说明

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `provider` | string | `"local"` | 身份提供商 |
| `session_timeout` | u64 | `86400` | 会话超时秒数 |
| `allow_anonymous` | bool | `false` | 允许匿名访问 |
| `multitenancy.enabled` | bool | `false` | 启用多租户 |
| `multitenancy.workspace_creation` | string | `"admin_only"` | 工作区创建策略 |
| `multitenancy.isolation` | string | `"strict"` | 数据隔离级别 |
| `propagation.enabled` | bool | `true` | 启用身份传播 |
| `propagation.method` | string | `"header"` | 传播方式 |
| `profile.enabled` | bool | `true` | 启用用户画像 |
| `profile.auto_learn` | bool | `true` | 自动学习偏好 |
| `profile.retention_days` | u32 | `365` | 画像保留天数 |

## 安全性

- **作用域隔离** -- `strict` 模式下工作区间数据完全隔离，包括记忆、工具配置和会话历史
- **身份不可伪造** -- 身份信息由服务端签发，Agent 和工具无法篡改传播中的身份
- **最小权限** -- 身份传播自动降级，子调用权限不超过父调用
- **审计追踪** -- 所有身份相关操作（登录、切换工作区、权限变更）记录在审计日志
- **画像隐私** -- 用户画像数据本地存储，不发送到外部服务
- **Bot 隔离** -- Bot 身份与人类用户分离管理，权限独立配置

## 与 OAuth2 集成

身份管理系统与 OAuth2 认证无缝集成：

```toml
[auth.identity]
provider = "oauth2"

[auth.oauth2]
# 参见 /zh/prx/auth/oauth2 获取完整配置
issuer = "https://auth.example.com"
```

当使用 OAuth2 时，外部 IdP 提供的用户信息自动映射为 PRX Identity。

## 相关文档

- [认证系统概览](/zh/prx/auth/)
- [OAuth2 认证](/zh/prx/auth/oauth2)
- [用户配置文件](/zh/prx/auth/profiles)
- [安全策略](/zh/prx/security/)
- [审批工作流](/zh/prx/security/approval)
