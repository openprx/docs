---
title: prx config — 配置管理
description: 管理 OpenPRX 配置，支持 JSON Schema 导出、配置文件拆分和合并。
---

# prx config

管理 OpenPRX 配置文件。支持导出完整的 JSON Schema、将单一配置文件拆分为模块化片段，以及将片段合并回单一文件。

## 用法

```bash
prx config <COMMAND>
```

## 子命令

| 子命令 | 说明 |
|--------|------|
| `schema` | 将完整的配置 JSON Schema 输出到 stdout |
| `split` | 将 config.toml 拆分为 config.d/*.toml 片段文件 |
| `merge` | 将 config.d/*.toml 片段合并回单一 config.toml |

## prx config schema

输出 OpenPRX 配置文件的完整 JSON Schema。Schema 文档化了每个可用的配置键、类型和默认值。

```bash
prx config schema
```

### 示例

```bash
# 打印到终端
prx config schema

# 保存为文件
prx config schema > schema.json

# 配合 jq 查看特定字段
prx config schema | jq '.properties.gateway'
```

输出的 JSON Schema 可用于编辑器的自动补全和校验（如 VS Code + TOML 插件）。

## prx config split

将单一的 `config.toml` 文件拆分为 `config.d/` 目录下的多个 TOML 片段文件。每个顶级配置节（如 `gateway`、`memory`、`autonomy`）会生成一个独立文件。

```bash
prx config split [OPTIONS]
```

### 选项

| 参数 | 缩写 | 默认值 | 说明 |
|------|------|--------|------|
| `--dry-run` | — | `false` | 仅预览生成的文件内容，不实际写入 |

### 示例

```bash
# 预览拆分结果
prx config split --dry-run

# 执行拆分
prx config split
```

拆分后的目录结构示例：

```
~/.openprx/
  config.toml          # 保留基础配置
  config.d/
    gateway.toml       # 网关配置
    memory.toml        # 记忆配置
    autonomy.toml      # 自治/安全配置
    channels.toml      # 渠道配置
    ...
```

### 使用场景

- **团队协作** — 不同成员管理不同的配置片段
- **版本控制** — 更细粒度的 diff 和合并
- **环境差异** — 通过替换特定片段适配不同环境

## prx config merge

将 `config.d/` 目录下的所有 TOML 片段文件合并回单一的 `config.toml`。

```bash
prx config merge
```

### 示例

```bash
prx config merge
```

合并完成后输出目标文件路径。

## 配置加载顺序

OpenPRX 加载配置的优先级（从低到高）：

1. 内置默认值
2. `config.toml` 主配置文件
3. `config.d/*.toml` 片段文件（按文件名字母顺序）
4. 环境变量覆盖

## 相关链接

- [配置参考](../config/) — 完整配置项文档
- [prx onboard](./onboard) — 通过向导生成初始配置
- [prx doctor](./doctor) — 配置健康检查
