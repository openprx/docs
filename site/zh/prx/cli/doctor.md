---
title: prx doctor — 诊断检查
description: 运行 OpenPRX 系统诊断，检查配置、渠道、提供商和模型可用性。
---

# prx doctor

运行系统诊断检查。不带子命令时执行全局诊断；使用 `models` 子命令可专门检查模型可用性。

## 用法

```bash
prx doctor [COMMAND]
```

## 子命令

| 子命令 | 说明 |
|--------|------|
| （无） | 运行全局诊断检查 |
| `models` | 探测各提供商的模型目录并报告可用性 |

## prx doctor（全局诊断）

运行全面的系统诊断，包括：

- 配置文件完整性检查
- 守护进程状态
- 调度器状态
- 渠道连接健康度
- 记忆后端连通性
- 依赖项检查

```bash
prx doctor
```

## prx doctor models

探测各 LLM 提供商的模型目录，报告每个模型的可用性状态。

```bash
prx doctor models [OPTIONS]
```

### 选项

| 参数 | 缩写 | 默认值 | 说明 |
|------|------|--------|------|
| `--provider <NAME>` | — | 所有提供商 | 仅探测指定提供商 |
| `--use-cache` | — | `false` | 优先使用已缓存的目录（跳过实时刷新） |

### 示例

```bash
# 探测所有已配置提供商的模型
prx doctor models

# 仅探测 Anthropic
prx doctor models --provider anthropic

# 使用缓存（更快，但可能不是最新）
prx doctor models --use-cache
```

### 输出说明

`prx doctor models` 会为每个提供商列出：

- 提供商名称和 API 端点
- 可用模型列表
- 每个模型的状态（available/unavailable/rate-limited）
- 缓存时间（如使用缓存）

## 典型工作流

```bash
# 1. 运行全局诊断
prx doctor

# 2. 如果模型相关问题，深入检查
prx doctor models

# 3. 如果渠道相关问题，使用渠道诊断
prx channel doctor

# 4. 如果仍有问题，查看详细日志
RUST_LOG=debug prx doctor
```

## 相关链接

- [prx channel doctor](./channel) — 渠道健康检查
- [prx status](./index#prx-status) — 系统状态概览
- [故障排除](../troubleshooting/) — 常见问题排查指南
