---
title: prx agent — Agent 交互
description: 启动 AI Agent 循环，支持交互式会话和单轮消息查询模式。
---

# prx agent

启动 AI Agent 循环。默认进入交互式会话，使用 `--message` 可发送单轮查询后立即退出。

## 用法

```bash
prx agent [OPTIONS]
```

## 选项

| 参数 | 缩写 | 默认值 | 说明 |
|------|------|--------|------|
| `--message <TEXT>` | `-m` | — | 单轮消息模式，发送后不进入交互 |
| `--provider <NAME>` | `-p` | 配置文件值 | 指定 LLM 提供商（openrouter/anthropic/openai/openai-codex/ollama 等） |
| `--model <ID>` | — | 配置文件值 | 指定模型 ID |
| `--temperature <FLOAT>` | `-t` | `0.7` | 采样温度，范围 0.0 - 2.0 |

## 示例

### 交互式会话

```bash
prx agent
```

进入交互式 Agent 循环，可连续发送消息，输入 `exit` 或 `Ctrl+C` 退出。

### 单轮查询

```bash
prx agent -m "总结今天的系统日志"
```

发送单条消息，获取回复后自动退出。适合脚本调用和管道操作。

### 指定提供商和模型

```bash
prx agent -p anthropic --model claude-sonnet-4-20250514
```

### 调整温度

```bash
prx agent -t 0.0 -m "精确计算 2^32 的值"
```

温度设为 0 可获取最确定性的回复。

### 配合管道使用

```bash
cat error.log | prx agent -m "分析这个错误日志，找出根因"
```

## 工作原理

`prx agent` 使用完整的 Agent 管道处理每条消息：

1. 加载配置和记忆系统
2. 根据 `--provider` 和 `--model` 选择 LLM（未指定时使用配置默认值）
3. 执行 Agent 循环：记忆检索 -> LLM 推理 -> 工具调用 -> 结果返回
4. 交互模式下循环等待输入；单轮模式下输出后退出

## 与 prx chat 的区别

| 特性 | `prx agent` | `prx chat` |
|------|-------------|------------|
| 流式输出 | 否 | 是 |
| 会话持久化 | 否 | 是（可恢复历史会话） |
| ANSI 富文本 | 基础 | 丰富（工具执行展示等） |
| 单轮模式 | 支持 (`-m`) | 不支持 |
| 适用场景 | 脚本/自动化/快速查询 | 人机交互/长对话 |

## 相关链接

- [prx chat](./chat) — 富终端对话
- [prx daemon](./daemon) — 守护进程（后台运行 Agent）
- [LLM 提供商](../providers/) — 支持的提供商列表
