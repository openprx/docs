---
title: 自定义规则
description: 为 PRX-WAF 编写自定义检测规则。包含访问控制、Bot 拦截、限速和应用特定防护的分步指南和示例。
---

# 自定义规则

PRX-WAF 使编写针对特定应用的自定义检测规则变得简单。自定义规则以 YAML 格式编写，放置在 `rules/custom/` 目录中。

## 入门

1. 在 `rules/custom/` 中创建新的 YAML 文件：

```bash
cp rules/custom/example.yaml rules/custom/myapp.yaml
```

2. 按照 [YAML 规则模式](./yaml-syntax)编辑文件。

3. 部署前验证：

```bash
python rules/tools/validate.py rules/custom/myapp.yaml
```

4. 规则会自动热重载，或手动触发重载：

```bash
prx-waf rules reload
```

## 示例：拦截内部路径访问

阻止外部访问内部 API 端点：

```yaml
version: "1.0"
description: "Block access to internal paths"

rules:
  - id: "CUSTOM-ACCESS-001"
    name: "Block internal API endpoints"
    category: "access-control"
    severity: "high"
    paranoia: 1
    field: "path"
    operator: "regex"
    value: "(?i)^/(internal|_debug|_profiler|actuator)/"
    action: "block"
    tags: ["custom", "access-control"]
```

## 示例：检测可疑 User-Agent

记录来自自动化工具的请求以便监控：

```yaml
  - id: "CUSTOM-BOT-001"
    name: "Log suspicious automated tool user-agents"
    category: "scanner"
    severity: "medium"
    paranoia: 2
    field: "user_agent"
    operator: "regex"
    value: "(?i)(masscan|zgrab|python-requests/|go-http-client|curl/)"
    action: "log"
    tags: ["custom", "bot", "scanner"]
```

## 示例：查询参数限速

拦截包含过多查询参数的请求（常见于 DoS 攻击）：

```yaml
  - id: "CUSTOM-DOS-001"
    name: "Block excessive query parameters"
    category: "dos"
    severity: "medium"
    paranoia: 1
    field: "query_arg_count"
    operator: "gt"
    value: "50"
    action: "block"
    tags: ["custom", "dos"]
```

## 示例：拦截特定文件扩展名

阻止访问备份文件或配置文件：

```yaml
  - id: "CUSTOM-FILE-001"
    name: "Block access to backup and config files"
    category: "access-control"
    severity: "high"
    paranoia: 1
    field: "path"
    operator: "regex"
    value: "(?i)\\.(bak|backup|old|orig|sql|tar|gz|zip|7z|rar|conf|env|ini|log)$"
    action: "block"
    tags: ["custom", "access-control", "file-extension"]
```

## 示例：CVE 虚拟补丁

为特定漏洞快速创建虚拟补丁：

```yaml
  - id: "CUSTOM-CVE-001"
    name: "Virtual patch for MyApp RCE (CVE-2026-XXXXX)"
    category: "rce"
    severity: "critical"
    paranoia: 1
    field: "body"
    operator: "regex"
    value: "(?i)\\$\\{jndi:(ldap|rmi|dns)://[^}]+\\}"
    action: "block"
    tags: ["custom", "cve", "rce"]
    reference: "https://nvd.nist.gov/vuln/detail/CVE-2026-XXXXX"
```

## 使用 Rhai 脚本实现复杂逻辑

对于需要超越模式匹配的规则，PRX-WAF 在第 12 阶段支持 Rhai 脚本：

```rhai
// rules/custom/scripts/geo-block.rhai
// 维护期间拦截特定国家的请求
fn check(ctx) {
    let path = ctx.path;
    let country = ctx.geo_country;

    if path.starts_with("/maintenance") && country != "US" {
        return block("Maintenance mode: US-only access");
    }

    allow()
}
```

::: info
Rhai 脚本在沙箱环境中运行，无法访问文件系统、网络或请求上下文之外的任何系统资源。
:::

## 最佳实践

1. **先用 `action: log`** —— 在拦截之前先监控，以尽早发现误报。

2. **使用精确的正则锚点** —— 使用 `^` 和 `$` 防止导致误报的部分匹配。

3. **设置适当的偏执级别** —— 如果规则可能匹配合法流量，设为偏执级别 2 或 3 而非在级别 1 拦截。

4. **使用非捕获组** —— 使用 `(?:...)` 替代 `(...)` 以提高清晰度和性能。

5. **添加描述性标签** —— 标签出现在管理界面中，有助于过滤安全事件。

6. **包含参考链接** —— 添加 `reference` URL 链接到相关 CVE、OWASP 文章或内部文档。

7. **测试正则表达式** —— 部署前验证正则模式：

```bash
python3 -c "import re; re.compile('your_pattern')"
```

8. **部署前验证** —— 始终运行验证器：

```bash
python rules/tools/validate.py rules/custom/
```

## 通过 CLI 导入

也可以通过 CLI 从文件或 URL 导入规则：

```bash
# 从本地文件导入
prx-waf rules import /path/to/rules.yaml

# 从 URL 导入
prx-waf rules import https://example.com/rules/custom.yaml

# 验证规则文件
prx-waf rules validate /path/to/rules.yaml
```

## 导入 ModSecurity 规则

将现有的 ModSecurity `.conf` 规则转换为 PRX-WAF YAML 格式：

```bash
python rules/tools/modsec2yaml.py input.conf output.yaml
```

::: warning
ModSecurity 转换器支持 SecRule 指令的基础子集（ARGS、REQUEST_HEADERS、REQUEST_URI、REQUEST_BODY）。带有链式或 Lua 脚本的复杂 ModSecurity 规则不受支持，需要手动重写。
:::

## 下一步

- [YAML 语法](./yaml-syntax) —— 完整规则模式参考
- [内置规则](./builtin-rules) —— 编写新规则前先查看现有规则
- [规则引擎概述](./index) —— 了解规则如何在流水线中被评估
