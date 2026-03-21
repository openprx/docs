---
title: 命令行 (CLI)
description: 通过终端命令行与 PRX 交互
---

# 命令行 (CLI)

> PRX 内置 CLI 渠道，提供交互式终端对话界面，是最简单的与 PRX 交互方式，默认启用。

## 前置条件

- PRX 已安装
- PRX 守护进程已运行

## 快速配置

CLI 渠道默认启用，无需额外配置。如需显式控制：

### 编辑配置

在 `~/.config/openprx/config.toml` 中：

```toml
[channels_config]
cli = true
```

### 启动对话

```bash
prx chat
```

## 配置参考

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `cli` | bool | `true` | 是否启用 CLI 渠道 |

## 使用方式

### 交互式对话

```bash
# 启动默认对话
prx chat

# 指定提供商和模型
prx chat --provider ollama --model llama3.2

# 指定系统提示词
prx chat --system "你是一个 Rust 专家"
```

### 对话中的命令

| 命令 | 说明 |
|------|------|
| `/quit` | 退出对话 |
| `/clear` | 清空对话历史 |
| `/model <name>` | 切换模型 |
| `/system <prompt>` | 修改系统提示词 |
| `/tools` | 列出可用工具 |
| `/help` | 显示帮助信息 |

按 `Ctrl+C` 中断当前请求，`Ctrl+D` 退出对话。

## 功能特性

- **零配置** — 默认启用，安装后即可使用
- **交互式 REPL** — 支持历史记录、Tab 补全
- **工具调用** — 完整的工具调用能力（Shell、浏览器、文件操作等）
- **流式输出** — 实时显示 LLM 生成的内容
- **多行输入** — 支持粘贴多行文本

## 限制

- 仅支持文本交互，不支持图片等媒体消息的直接显示
- 对话历史不跨会话持久化（但记忆系统会保存重要信息）

## 故障排除

**`prx chat` 无响应**

1. 确认守护进程正在运行：`prx status`
2. 检查是否配置了有效的 LLM 提供商
3. 查看日志：`prx daemon logs --follow`

**工具调用被拒绝**

- 检查自治级别（autonomy level）配置
- 某些高风险操作需要手动确认
