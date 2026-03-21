---
title: 文件操作
description: PRX 的 file_read 和 file_write 工具提供安全的文件读写能力，支持路径验证和记忆 ACL 访问控制。
---

# 文件操作

`file_read` 和 `file_write` 是 PRX 的核心工具，与 `shell` 一起组成 `default_tools()` 集合，始终可用且无需额外配置。它们为 Agent 提供结构化的文件读写能力，比通过 shell 执行 `cat` 或 `echo` 更安全、更可控。

文件操作工具内置路径验证，防止目录遍历攻击和非法文件访问。当启用记忆 ACL 时，`file_read` 会自动阻止对记忆 Markdown 文件的直接读取，强制 Agent 通过记忆工具的访问控制机制来获取记忆内容。

这两个工具的设计目标是为 LLM 提供一个安全、高效、可审计的文件系统接口。所有操作都经过安全策略层检查，支持审计日志和监督模式。

## 配置

文件操作工具作为核心工具始终启用，但可以通过安全策略控制其行为：

```toml
# 工具策略控制
[security.tool_policy.tools]
file_read = "allow"       # "allow" | "deny" | "supervised"
file_write = "supervised" # 写操作建议使用监督模式

# 记忆 ACL（影响 file_read 行为）
[memory]
acl_enabled = true        # 启用后 file_read 阻止访问记忆文件
```

委托 Agent 的文件权限控制：

```toml
[agents.code_reviewer]
provider = "anthropic"
model = "claude-sonnet-4-20250514"
allowed_tools = ["file_read"]  # 仅允许读取，禁止写入
```

## 使用方法

### file_read — 读取文件

Agent 通过 JSON 结构调用 file_read：

```json
{
  "tool": "file_read",
  "arguments": {
    "path": "/home/user/projects/src/main.rs",
    "encoding": "utf-8"
  }
}
```

典型交互场景：

```
用户: 看看 main.rs 的内容

Agent: 我来读取 main.rs 的内容。
[调用 file_read: /home/user/projects/src/main.rs]
文件内容如下：

fn main() {
    println!("Hello, PRX!");
}
```

### file_write — 写入文件

```json
{
  "tool": "file_write",
  "arguments": {
    "path": "/home/user/projects/src/config.rs",
    "content": "pub const VERSION: &str = \"1.0.0\";\n",
    "create_dirs": true
  }
}
```

写入操作示例：

```
用户: 创建一个新的配置文件

Agent: 我来创建配置文件。
[调用 file_write: /home/user/projects/config/app.toml]
已成功创建配置文件 config/app.toml。
```

## 参数

### file_read 参数

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `path` | string | 是 | — | 要读取的文件路径（绝对路径或相对于工作目录） |
| `encoding` | string | 否 | `"utf-8"` | 文件编码 |
| `line_start` | integer | 否 | — | 起始行号（从 1 开始），用于读取大文件的部分内容 |
| `line_end` | integer | 否 | — | 结束行号，与 `line_start` 配合使用 |

### file_write 参数

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `path` | string | 是 | — | 要写入的文件路径 |
| `content` | string | 是 | — | 要写入的内容 |
| `create_dirs` | boolean | 否 | `false` | 是否自动创建不存在的父目录 |
| `append` | boolean | 否 | `false` | 是否追加到文件末尾而非覆盖 |
| `encoding` | string | 否 | `"utf-8"` | 文件编码 |

## 路径验证

文件操作工具对所有路径执行严格验证：

### 验证规则

1. **路径规范化** — 解析 `..`、`.`、符号链接等，获取真实绝对路径
2. **目录遍历检查** — 确保规范化后的路径未逃逸出允许的范围
3. **权限检查** — 验证 PRX 进程是否有对应的读/写权限
4. **存在性检查** — `file_read` 要求文件存在；`file_write` 在 `create_dirs = false` 时要求父目录存在

### 被阻止的路径模式

以下路径模式会被自动拒绝：

```
/etc/shadow               # 系统敏感文件
/proc/self/environ        # 进程环境变量
../../etc/passwd          # 目录遍历
/dev/sda                  # 设备文件
```

## 记忆 ACL 集成

当 `memory.acl_enabled = true` 时，`file_read` 工具会执行额外的访问控制：

```
file_read 请求
  │
  ├─ 路径验证
  │
  ├─ ACL 检查：路径是否指向记忆 Markdown 文件？
  │     是 → 拒绝访问，返回错误
  │     否 → 继续执行
  │
  └─ 读取文件并返回内容
```

记忆文件（通常存储在 `~/.prx/memory/` 下的 `.md` 文件）包含 Agent 的长期记忆数据。ACL 机制确保 Agent 只能通过 `memory_get`、`memory_search` 等专用工具访问记忆，而不能绕过访问控制直接读取原始文件。

这防止了以下攻击场景：

- Agent 通过 `file_read` 直接读取其他 Agent 的私有记忆
- 恶意 prompt 诱导 Agent 读取并泄露记忆内容
- 绕过记忆搜索的访问权限限制

## 安全性

### 安全策略集成

每次文件操作都通过 `SecurityPolicy` 层：

```toml
[security.tool_policy.tools]
file_read = "allow"         # 读操作通常可以放开
file_write = "supervised"   # 写操作建议监督审批
```

### 写入风险控制

`file_write` 工具存在以下安全风险需要注意：

| 风险 | 说明 | 缓解措施 |
|------|------|----------|
| 覆盖重要文件 | LLM 可能覆盖配置或代码文件 | 使用 `supervised` 模式 |
| 写入可执行文件 | LLM 可能创建恶意脚本 | 配合沙箱使用 |
| 磁盘空间耗尽 | 写入大量数据 | 资源限制配置 |
| 路径遍历写入 | 写入系统目录 | 路径验证规则 |

### 审计日志

所有文件操作都会记录在 PRX 的审计日志中：

```
[2024-01-15T10:30:45Z] tool=file_read path=/home/user/src/main.rs status=success bytes=1024
[2024-01-15T10:30:47Z] tool=file_write path=/home/user/src/config.rs status=success bytes=256
[2024-01-15T10:30:50Z] tool=file_read path=/home/user/.prx/memory/core.md status=denied reason=acl
```

### 委托 Agent 权限隔离

对于委托 Agent，建议仅授予必要的文件操作权限：

```toml
# 只读 Agent — 仅用于代码审查
[agents.reviewer]
allowed_tools = ["file_read"]

# 全功能 Agent — 需要读写
[agents.developer]
allowed_tools = ["file_read", "file_write", "shell"]
```

## 相关文档

- [工具概览](/zh/prx/tools/) — 所有工具的分类参考
- [记忆工具](/zh/prx/tools/memory/) — 记忆存储、检索和 ACL 机制
- [Shell 命令执行](/zh/prx/tools/shell/) — Shell 工具的沙箱配置
- [安全策略](/zh/prx/security/policy-engine/) — 工具策略管道详解
