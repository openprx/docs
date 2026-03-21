---
title: Markdown 记忆后端
description: 基于文件的 Markdown 记忆存储，适合版本控制和单用户场景。
---

# Markdown 记忆后端

Markdown 后端将记忆以结构化的 Markdown 文件形式存储在磁盘上。这是最简单的后端，适合需要记忆可读且可版本控制的单用户 CLI 场景。

## 概述

记忆以 Markdown 文件组织在可配置的目录中。每个记忆条目是文件内的一个章节，按主题或日期分组。格式设计为既可机器解析又可人工阅读。

## 文件结构

```
~/.local/share/openprx/memory/
  ├── facts.md          # 提取的关键事实
  ├── preferences.md    # 用户偏好
  ├── projects/
  │   ├── project-a.md  # 项目特定记忆
  │   └── project-b.md
  └── archive/
      └── 2026-02.md    # 归档的旧记忆
```

## 配置

```toml
[memory]
backend = "markdown"

[memory.markdown]
directory = "~/.local/share/openprx/memory"
max_file_size_kb = 512
auto_archive_days = 30
```

## 搜索

Markdown 后端使用简单的全文 grep 进行回忆。虽然不如语义搜索精确，但速度快且无需额外依赖。

## 限制

- 不支持语义相似度搜索
- 线性扫描检索（大型记忆存储时较慢）
- 没有文件锁定时并发写入不安全

## 相关页面

- [记忆系统概览](./)
- [SQLite 后端](./sqlite) -- 更结构化的存储
- [记忆维护](./hygiene)
