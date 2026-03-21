---
title: prx chat — 富终端对话
description: 启动富终端交互式对话，支持流式输出、工具执行展示和会话历史管理。
---

# prx chat

启动富终端交互式对话。支持流式响应、工具执行过程实时显示和会话历史持久化。使用完整的 Agent 管道：记忆检索、LLM 路由、内置工具和所有已配置的提供商。

## 用法

```bash
prx chat [OPTIONS]
```

## 选项

| 参数 | 缩写 | 默认值 | 说明 |
|------|------|--------|------|
| `--provider <NAME>` | `-p` | 配置文件值 | 指定 LLM 提供商 |
| `--model <ID>` | — | 配置文件值 | 指定模型 ID |
| `--temperature <FLOAT>` | `-t` | `0.7` | 采样温度，范围 0.0 - 2.0 |
| `--plain` | — | `false` | 纯文本输出，禁用 ANSI 转义序列（适合管道输出） |
| `--session <ID>` | `-s` | — | 恢复指定会话（传 `last` 恢复最近一次会话） |
| `--list-sessions` | — | `false` | 列出所有已保存的会话后退出 |

## 示例

### 开始新对话

```bash
prx chat
```

### 使用本地模型

```bash
prx chat -p ollama --model llama3.3
```

### 使用 Anthropic Claude

```bash
prx chat -p anthropic
```

### 纯文本模式

```bash
prx chat --plain
```

禁用所有 ANSI 颜色和格式化，适合将输出通过管道传递给其他程序。

### 恢复上一次会话

```bash
prx chat --session last
```

### 恢复指定会话

```bash
prx chat --session abc123
```

### 查看所有历史会话

```bash
prx chat --list-sessions
```

列出所有已保存的会话 ID 和摘要信息后退出，不进入对话。

## 会话管理

`prx chat` 会自动保存每次对话的完整历史记录。会话数据存储在工作区目录下。

- 使用 `--session last` 快速恢复最近一次对话的上下文
- 使用 `--session <ID>` 恢复指定的历史会话
- 使用 `--list-sessions` 查看所有可恢复的会话

恢复会话后，之前的对话上下文（包括工具调用结果）会被完整加载，可以继续之前的讨论。

## 流式输出

默认情况下，`prx chat` 使用流式输出，LLM 的响应会逐 token 显示在终端。工具调用的过程也会实时展示，包括：

- 工具名称和参数
- 执行状态（运行中/完成/失败）
- 工具返回结果

使用 `--plain` 可禁用所有富文本格式化。

## 相关链接

- [prx agent](./agent) — 轻量级单轮交互
- [LLM 提供商](../providers/) — 支持的提供商列表
- [工具](../tools/) — 内置工具文档
- [记忆系统](../memory/) — 会话记忆与持久化
