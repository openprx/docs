---
title: YAML 规则语法
description: PRX-WAF YAML 规则格式的完整参考。模式定义、字段参考、操作符参考、动作参考和带注释的示例。
---

# YAML 规则语法

本页面文档化了 PRX-WAF 使用的完整 YAML 规则模式。每个规则文件都遵循此结构。

## 文件结构

每个 YAML 规则文件包含顶级元数据部分和规则列表：

```yaml
version: "1.0"                     # 模式版本（必填）
description: "简短描述"             # 人类可读的标签（必填）
source: "OWASP CRS v4.25.0"       # 规则来源（可选）
license: "Apache-2.0"             # SPDX 许可证标识（可选）

rules:
  - <rule>
  - <rule>
```

## 规则模式

`rules` 列表中的每条规则包含以下字段：

```yaml
- id: "CRS-942100"              # 唯一字符串 ID（必填）
  name: "SQL injection attack"  # 简短描述（必填）
  category: "sqli"              # 类别标签（必填）
  severity: "critical"          # 严重级别（必填）
  paranoia: 1                   # 偏执级别 1-4（可选，默认：1）
  field: "all"                  # 要检查的请求字段（必填）
  operator: "regex"             # 匹配操作符（必填）
  value: "(?i)select.+from"     # 模式或阈值（必填）
  action: "block"               # 匹配时的动作（必填）
  tags:                         # 字符串标签（可选）
    - "owasp-crs"
    - "sqli"
  crs_id: 942100                # 原始 CRS 数字 ID（可选）
  reference: "https://..."      # CVE 或文档链接（可选）
```

### 必填字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | `string` | 所有规则文件中的唯一标识。格式：`<PREFIX>-<CATEGORY>-<NNN>` |
| `name` | `string` | 简短的人类可读描述（最长约 120 个字符） |
| `category` | `string` | 用于过滤和报告的类别标签 |
| `severity` | `string` | 可选值：`critical`、`high`、`medium`、`low`、`info`、`notice`、`warning`、`error`、`unknown` |
| `field` | `string` | 要检查请求的哪个部分（见字段参考） |
| `operator` | `string` | 如何匹配值（见操作符参考） |
| `value` | `string` | 模式、阈值或词表文件名 |
| `action` | `string` | 规则匹配时执行的动作（见动作参考） |

### 可选字段

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `paranoia` | `integer` | `1` | 偏执级别 1-4 |
| `tags` | `string[]` | `[]` | 用于过滤和仪表板显示的标签 |
| `crs_id` | `integer` | -- | 原始 OWASP CRS 数字 ID |
| `reference` | `string` | -- | CVE、OWASP 文章或说明文档的 URL |

## 字段参考

`field` 值决定检查 HTTP 请求的哪个部分：

| 字段 | 检查内容 |
|------|----------|
| `path` | 请求 URI 路径（不含查询字符串） |
| `query` | 查询字符串（所有参数，已解码） |
| `body` | 请求体（已解码） |
| `headers` | 所有请求头（名称: 值对） |
| `user_agent` | 仅 User-Agent 请求头 |
| `cookies` | 请求 Cookie |
| `method` | HTTP 方法（GET、POST、PUT 等） |
| `content_type` | Content-Type 请求头 |
| `content_length` | Content-Length 值（用于数值比较） |
| `path_length` | URI 路径长度（用于数值比较） |
| `query_arg_count` | 查询参数数量（用于数值比较） |
| `all` | 以上所有字段的组合 |

## 操作符参考

`operator` 值决定如何将 `value` 与被检查字段进行匹配：

| 操作符 | 说明 | 值格式 |
|--------|------|--------|
| `regex` | PCRE 兼容正则表达式 | 正则模式 |
| `contains` | 字段包含字面量字符串 | 字面量字符串 |
| `equals` | 字段值完全匹配（区分大小写） | 字面量字符串 |
| `not_in` | 字段值不在列表中 | 逗号分隔列表 |
| `gt` | 字段值（数值）大于 | 数字字符串 |
| `lt` | 字段值（数值）小于 | 数字字符串 |
| `ge` | 字段值（数值）大于或等于 | 数字字符串 |
| `le` | 字段值（数值）小于或等于 | 数字字符串 |
| `detect_sqli` | 通过 libinjection 检测 SQL 注入 | `"true"` 或 `""` |
| `detect_xss` | 通过 libinjection 检测 XSS | `"true"` 或 `""` |
| `pm_from_file` | 从词表文件进行短语匹配 | `owasp-crs/data/` 中的文件名 |
| `pm` | 内联列表短语匹配 | 逗号分隔的短语 |

## 动作参考

`action` 值决定规则匹配后的行为：

| 动作 | 说明 |
|------|------|
| `block` | 以 403 Forbidden 响应拒绝请求 |
| `log` | 允许请求但记录匹配结果（监控模式） |
| `allow` | 明确放行请求（覆盖其他规则） |
| `deny` | `block` 的别名 |
| `redirect` | 重定向请求（引擎特定配置） |
| `drop` | 静默丢弃连接 |

::: tip
新规则建议先使用 `action: log` 监控误报情况，再切换为 `action: block`。
:::

## ID 命名空间约定

规则 ID 应遵循已建立的前缀约定：

| 目录 | ID 前缀 | 示例 |
|------|---------|------|
| `owasp-crs/` | `CRS-<number>` | `CRS-942100` |
| `modsecurity/` | `MODSEC-<CATEGORY>-<NNN>` | `MODSEC-IP-001` |
| `cve-patches/` | `CVE-<YEAR>-<SHORT>-<NNN>` | `CVE-2021-LOG4J-001` |
| `custom/` | `CUSTOM-<CATEGORY>-<NNN>` | `CUSTOM-API-001` |

## 完整示例

```yaml
version: "1.0"
description: "应用特定的访问控制规则"
source: "custom"
license: "Apache-2.0"

rules:
  - id: "CUSTOM-API-001"
    name: "Block access to internal admin API"
    category: "access-control"
    severity: "high"
    paranoia: 1
    field: "path"
    operator: "regex"
    value: "(?i)^/internal/"
    action: "block"
    tags: ["custom", "access-control"]

  - id: "CUSTOM-BOT-001"
    name: "Log suspicious automated tool user-agents"
    category: "scanner"
    severity: "medium"
    paranoia: 2
    field: "user_agent"
    operator: "regex"
    value: "(?i)(masscan|zgrab|python-requests/|go-http-client)"
    action: "log"
    tags: ["custom", "bot", "scanner"]

  - id: "CUSTOM-RATE-001"
    name: "Block requests with excessive query parameters"
    category: "dos"
    severity: "medium"
    paranoia: 1
    field: "query_arg_count"
    operator: "gt"
    value: "50"
    action: "block"
    tags: ["custom", "dos"]
```

## 规则验证

部署前请验证规则文件：

```bash
# 验证所有规则
python rules/tools/validate.py rules/

# 验证特定文件
python rules/tools/validate.py rules/custom/myapp.yaml
```

验证器检查以下内容：
- 必填字段是否存在
- 所有文件中是否有重复的规则 ID
- 严重级别和动作值是否有效
- 偏执级别是否在 1-4 范围内
- 正则表达式是否能正确编译
- 数值操作符是否用于了字符串值

## 下一步

- [内置规则](./builtin-rules) —— 浏览 OWASP CRS 和 CVE 补丁规则
- [自定义规则](./custom-rules) —— 分步编写自定义规则
- [规则引擎概述](./index) —— 检测流水线如何处理规则
