---
title: prx skills — 技能管理
description: 管理 OpenPRX 用户自定义技能，支持从 Git 仓库或本地路径安装。
---

# prx skills

管理用户自定义技能（Skills）。技能是可复用的能力单元，扩展 Agent 的行为和知识。

## 用法

```bash
prx skills <COMMAND>
```

## 子命令

| 子命令 | 说明 |
|--------|------|
| `list` | 列出所有已安装的技能 |
| `install <SOURCE>` | 从 Git URL 或本地路径安装技能 |
| `remove <NAME>` | 删除已安装的技能 |

## prx skills list

列出所有已安装的技能及其状态信息。

```bash
prx skills list
```

## prx skills install

从 Git 仓库（HTTPS/SSH）或本地路径安装技能。

```bash
prx skills install <SOURCE>
```

### 参数

| 参数 | 说明 |
|------|------|
| `SOURCE` | Git URL（HTTPS 或 SSH）或本地目录路径 |

### 示例

#### 从 HTTPS Git 仓库安装

```bash
prx skills install https://github.com/openprx/skill-web-search.git
```

#### 从 SSH Git 仓库安装

```bash
prx skills install git@github.com:openprx/skill-code-review.git
```

#### 从本地路径安装

```bash
prx skills install /path/to/my-custom-skill
```

## prx skills remove

删除已安装的技能。

```bash
prx skills remove <NAME>
```

### 参数

| 参数 | 说明 |
|------|------|
| `NAME` | 技能名称（通过 `prx skills list` 查看） |

### 示例

```bash
prx skills remove web-search
```

## 技能与插件的区别

| 特性 | 技能（Skills） | 插件（Plugins） |
|------|---------------|-----------------|
| 运行方式 | 脚本/配置 | WASM 沙箱 |
| 安装来源 | Git/本地路径 | 编译的 .wasm 文件 |
| 安全隔离 | 依赖文件系统权限 | WASM 沙箱隔离 |
| 开发难度 | 低（配置/脚本） | 中（需编译为 WASM） |
| 适用场景 | 自定义工作流/提示词 | 高安全性/高性能扩展 |

## 相关链接

- [插件 (WASM)](../plugins/) — WebAssembly 插件开发指南
- [工具](../tools/) — 内置工具文档
- [prx agent](./agent) — Agent 交互（使用已安装的技能）
