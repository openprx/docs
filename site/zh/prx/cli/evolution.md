---
title: prx evolution — 自进化操作
description: 管理 OpenPRX 三层自进化系统，包括状态查看、历史记录、配置检查和手动触发。
---

# prx evolution

自进化仪表盘和操作入口。OpenPRX 的三层自进化系统包括：

- **L1 记忆进化** — 自动整理、归纳和优化长期记忆
- **L2 提示词进化** — 根据对话效果自动调优系统提示词
- **L3 策略进化** — 自主发现并优化行为策略，带安全回滚

## 用法

```bash
prx evolution [--json] <COMMAND>
```

## 全局选项

| 参数 | 缩写 | 默认值 | 说明 |
|------|------|--------|------|
| `--json` | — | `false` | 输出机器可读的 JSON 格式 |

## 子命令

| 子命令 | 说明 |
|--------|------|
| `status` | 显示进化运行时状态仪表盘 |
| `history` | 显示进化历史记录 |
| `digest` | 显示指定日期的每日摘要 |
| `config` | 显示当前进化配置 |
| `trigger` | 手动触发一次进化循环 |

## prx evolution status

显示进化系统的运行时状态，包括运行模式、数据进度、最近的进化循环、熔断器状态和层冻结状态。

```bash
prx evolution status
```

输出包含：

- **Mode** — 当前运行模式
- **DecisionLog** — 决策日志数量 / 阈值
- **MemoryAccess** — 记忆访问日志数量 / 阈值
- **CircuitBreaker** — 熔断器状态（Closed/Open/HalfOpen）
- **Recent Cycles** — 最近 3 次进化循环的时间、层级、变更类型和结果
- **Layer Freeze** — 各层是否处于冻结状态

### JSON 输出

```bash
prx evolution status --json
```

## prx evolution history

显示进化历史记录，从 JSONL 日志中读取。

```bash
prx evolution history [OPTIONS]
```

### 选项

| 参数 | 缩写 | 默认值 | 说明 |
|------|------|--------|------|
| `--limit <N>` | — | `20` | 最多显示的记录数 |

### 示例

```bash
# 显示最近 20 条记录（默认）
prx evolution history

# 显示最近 50 条
prx evolution history --limit 50

# JSON 格式输出
prx evolution history --json
```

## prx evolution digest

显示指定日期的每日进化摘要。

```bash
prx evolution digest [OPTIONS]
```

### 选项

| 参数 | 缩写 | 默认值 | 说明 |
|------|------|--------|------|
| `--date <YYYY-MM-DD>` | — | 今天 (UTC) | 目标日期 |

### 示例

```bash
# 查看今天的摘要
prx evolution digest

# 查看指定日期
prx evolution digest --date 2025-03-15
```

## prx evolution config

显示当前解析后的进化配置（来自 `evolution_config.toml`）。

```bash
prx evolution config
```

配置文件查找顺序：

1. 环境变量 `OPENPRX_EVOLUTION_CONFIG` 指定的路径
2. `<workspace>/evolution_config.toml`
3. `./evolution_config.toml`
4. `./config/evolution_config.toml`

如果配置文件不存在，显示默认配置。

## prx evolution trigger

手动触发一次进化循环。

```bash
prx evolution trigger [OPTIONS]
```

### 选项

| 参数 | 缩写 | 默认值 | 说明 |
|------|------|--------|------|
| `--layer <LAYER>` | — | `L1` | 进化层级：`L1`（记忆）/ `L2`（提示词）/ `L3`（策略） |

### 示例

```bash
# 触发 L1 记忆进化（默认）
prx evolution trigger

# 触发 L2 提示词进化
prx evolution trigger --layer L2

# 触发 L3 策略进化并输出 JSON
prx evolution trigger --layer L3 --json
```

触发后输出包含：

- **config** — 使用的配置文件路径
- **layer** — 执行的进化层级
- **id** — 实验 ID
- **shadow** — 是否在影子模式下运行
- **rolled** — 是否发生了回滚
- **errors** — 错误信息（如有）

## 安全机制

### 熔断器

当连续进化失败次数达到阈值时，熔断器自动打开（Open），冻结所有进化层。冷却时间过后进入半开（HalfOpen）状态，允许试探性进化。

### 回滚

每次进化变更都会记录快照。如果变更导致回归（Regressed），系统会自动回滚到变更前的状态。

### 影子模式

新的进化变更可以先在影子模式下运行，评估效果后再正式应用。

## 相关链接

- [自进化系统](../self-evolution/) — L1/L2/L3 三层自进化详解
- [prx daemon](./daemon) — 守护进程（自动运行进化循环）
- [配置参考](../config/) — evolution_config.toml 配置项
