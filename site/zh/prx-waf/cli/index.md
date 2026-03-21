---
title: CLI 命令参考
description: PRX-WAF 所有 CLI 命令和子命令的完整参考。服务管理、规则操作、CrowdSec 集成和 Bot 检测。
---

# CLI 命令参考

`prx-waf` 命令行接口提供服务管理、规则操作、CrowdSec 集成和 Bot 检测等命令。

## 全局选项

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `-c, --config <FILE>` | `configs/default.toml` | TOML 配置文件路径 |

```bash
prx-waf -c /etc/prx-waf/config.toml <COMMAND>
```

## 服务命令

| 命令 | 说明 |
|------|------|
| `prx-waf run` | 启动反向代理 + 管理 API（持续运行） |
| `prx-waf migrate` | 仅运行数据库迁移 |
| `prx-waf seed-admin` | 创建默认管理员用户（admin/admin） |

```bash
# 启动服务
prx-waf -c configs/default.toml run

# 首次启动前运行迁移
prx-waf -c configs/default.toml migrate

# 创建管理员用户
prx-waf -c configs/default.toml seed-admin
```

::: tip
首次设置时，先运行 `migrate` 和 `seed-admin`，再运行 `run`。后续启动只需 `run` —— 迁移会自动检查。
:::

## 规则管理

管理检测规则的命令。所有规则命令操作配置的规则目录。

| 命令 | 说明 |
|------|------|
| `prx-waf rules list` | 列出所有已加载规则 |
| `prx-waf rules list --category <CAT>` | 按类别过滤规则 |
| `prx-waf rules list --source <SRC>` | 按来源过滤规则 |
| `prx-waf rules info <RULE-ID>` | 显示规则详细信息 |
| `prx-waf rules enable <RULE-ID>` | 启用已禁用的规则 |
| `prx-waf rules disable <RULE-ID>` | 禁用规则 |
| `prx-waf rules reload` | 从磁盘热重载所有规则 |
| `prx-waf rules validate <PATH>` | 验证规则文件的正确性 |
| `prx-waf rules import <PATH\|URL>` | 从文件或 URL 导入规则 |
| `prx-waf rules export [--format yaml]` | 导出当前规则集 |
| `prx-waf rules update` | 从远程源获取最新规则 |
| `prx-waf rules search <QUERY>` | 按名称或描述搜索规则 |
| `prx-waf rules stats` | 显示规则统计 |

### 示例

```bash
# 列出所有 SQL 注入规则
prx-waf rules list --category sqli

# 列出 OWASP CRS 规则
prx-waf rules list --source owasp

# 显示特定规则的详情
prx-waf rules info CRS-942100

# 禁用产生误报的规则
prx-waf rules disable CRS-942100

# 编辑规则后热重载
prx-waf rules reload

# 部署前验证自定义规则
prx-waf rules validate rules/custom/myapp.yaml

# 从 URL 导入规则
prx-waf rules import https://example.com/rules/custom.yaml

# 导出所有规则为 YAML
prx-waf rules export --format yaml > all-rules.yaml

# 查看统计
prx-waf rules stats
```

## 规则源管理

管理远程规则源的命令。

| 命令 | 说明 |
|------|------|
| `prx-waf sources list` | 列出已配置的规则源 |
| `prx-waf sources add <NAME> <URL>` | 添加远程规则源 |
| `prx-waf sources remove <NAME>` | 移除规则源 |
| `prx-waf sources update [NAME]` | 从特定源（或所有源）获取最新规则 |
| `prx-waf sources sync` | 同步所有远程源 |

### 示例

```bash
# 列出所有源
prx-waf sources list

# 添加自定义源
prx-waf sources add my-rules https://example.com/rules/latest.yaml

# 同步所有源
prx-waf sources sync

# 更新特定源
prx-waf sources update owasp-crs
```

## CrowdSec 集成

管理 CrowdSec 威胁情报集成的命令。

| 命令 | 说明 |
|------|------|
| `prx-waf crowdsec status` | 显示 CrowdSec 集成状态 |
| `prx-waf crowdsec decisions` | 列出来自 LAPI 的活跃决策 |
| `prx-waf crowdsec test` | 测试 LAPI 连接 |
| `prx-waf crowdsec setup` | 交互式 CrowdSec 设置向导 |

### 示例

```bash
# 检查集成状态
prx-waf crowdsec status

# 列出活跃的拦截/验证码决策
prx-waf crowdsec decisions

# 测试到 CrowdSec LAPI 的连接
prx-waf crowdsec test

# 运行设置向导
prx-waf crowdsec setup
```

## Bot 检测

管理 Bot 检测规则的命令。

| 命令 | 说明 |
|------|------|
| `prx-waf bot list` | 列出已知的 Bot 签名 |
| `prx-waf bot add <PATTERN> [--action ACTION]` | 添加 Bot 检测模式 |
| `prx-waf bot remove <PATTERN>` | 移除 Bot 检测模式 |
| `prx-waf bot test <USER-AGENT>` | 测试 User-Agent 是否匹配 Bot 规则 |

### 示例

```bash
# 列出所有 Bot 签名
prx-waf bot list

# 添加新的 Bot 模式
prx-waf bot add "(?i)my-bad-bot" --action block

# 以仅记录模式添加 Bot 模式
prx-waf bot add "(?i)suspicious-crawler" --action log

# 测试 User-Agent 字符串
prx-waf bot test "Mozilla/5.0 (compatible; Googlebot/2.1)"

# 移除 Bot 模式
prx-waf bot remove "(?i)my-bad-bot"
```

## 常用流程

### 首次设置

```bash
# 1. 运行迁移
prx-waf -c configs/default.toml migrate

# 2. 创建管理员用户
prx-waf -c configs/default.toml seed-admin

# 3. 启动服务
prx-waf -c configs/default.toml run
```

### 规则维护流程

```bash
# 1. 检查上游规则更新
prx-waf rules update

# 2. 更新后验证
prx-waf rules validate rules/

# 3. 查看变更
prx-waf rules stats

# 4. 热重载
prx-waf rules reload
```

## 下一步

- [快速开始](../getting-started/quickstart) —— 开始使用 PRX-WAF
- [规则引擎](../rules/) —— 了解检测流水线
- [配置参考](../configuration/reference) —— 所有配置项
