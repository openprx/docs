---
title: 规则引擎概述
description: PRX-WAF 规则引擎的工作原理。基于 YAML 的声明式规则、多种规则来源、偏执级别、热重载和 16 阶段检测流水线。
---

# 规则引擎

PRX-WAF 使用声明式的 YAML 规则引擎来检测和拦截 Web 攻击。规则描述了要检查什么、如何匹配以及采取什么动作。引擎在 16 个顺序检测阶段中对每个传入请求逐一评估所有启用的规则。

## 规则工作原理

每条规则由四个核心组件构成：

1. **字段（Field）** —— 检查请求的哪个部分（路径、查询参数、请求体、请求头等）
2. **操作符（Operator）** —— 如何进行匹配（正则、包含、SQL 注入检测等）
3. **值（Value）** —— 要匹配的模式或阈值
4. **动作（Action）** —— 匹配时采取的操作（拦截、记录、放行）

```yaml
- id: "CUSTOM-001"
  name: "Block admin path from external IPs"
  category: "access-control"
  severity: "high"
  field: "path"
  operator: "regex"
  value: "(?i)^/admin"
  action: "block"
```

## 规则来源

PRX-WAF 内置 398 条规则，分为四个类别：

| 来源 | 文件数 | 规则数 | 说明 |
|------|--------|--------|------|
| OWASP CRS | 21 | 310 | OWASP ModSecurity Core Rule Set v4（转换为 YAML） |
| ModSecurity | 4 | 46 | 社区规则：IP 信誉、DoS、数据泄露 |
| CVE 补丁 | 7 | 39 | 针对 Log4Shell、Spring4Shell、MOVEit 等的虚拟补丁 |
| 自定义 | 1 | 3 | 应用特定规则的示例模板 |

此外，PRX-WAF 还包含 10+ 个编译到二进制中的内置检测器：

- SQL 注入（libinjection + 正则）
- 跨站脚本（libinjection + 正则）
- 远程代码执行 / 命令注入
- 本地/远程文件包含
- 服务端请求伪造（SSRF）
- 路径/目录遍历
- 扫描器检测（Nmap、Nikto 等）
- Bot 检测（恶意爬虫、AI 爬虫、无头浏览器）
- 协议违规检测
- 敏感词检测（Aho-Corasick 多模式匹配）

## 规则格式

PRX-WAF 支持三种规则文件格式：

| 格式 | 扩展名 | 说明 |
|------|--------|------|
| YAML | `.yaml`、`.yml` | PRX-WAF 原生格式（推荐） |
| ModSecurity | `.conf` | SecRule 指令（基础子集：ARGS、REQUEST_HEADERS、REQUEST_URI、REQUEST_BODY） |
| JSON | `.json` | 规则对象的 JSON 数组 |

完整模式参考请查看 [YAML 语法](./yaml-syntax)。

## 偏执级别

每条规则声明一个偏执级别（1-4），控制匹配的激进程度。级别越高，捕获的攻击越多，但误报风险也越高。

| 级别 | 名称 | 说明 | 误报风险 |
|------|------|------|----------|
| 1 | 默认 | 高置信度规则，生产环境安全 | 极低 |
| 2 | 推荐 | 更广覆盖范围，轻微误报风险 | 低 |
| 3 | 激进 | 广泛启发式检测，需要调优 | 中等 |
| 4 | 最大 | 所有规则，包括推测性模式 | 高 |

::: tip
生产环境从偏执级别 1 开始。监控日志，调优排除项，然后逐步启用更高级别。
:::

## 热重载

PRX-WAF 监控 `rules/` 目录的文件变化，当文件被创建、修改或删除时自动重载规则。变更在配置的防抖窗口内生效（默认：500ms）。

也可以手动触发重载：

```bash
# 通过 CLI
prx-waf rules reload

# 通过 SIGHUP（仅 Unix）
kill -HUP $(pgrep prx-waf)
```

规则重载是原子性的 —— 旧规则集继续处理流量，直到新规则集完全编译就绪。

## 目录结构

```
rules/
├── owasp-crs/          # OWASP CRS v4（21 个文件，310 条规则）
│   ├── sqli.yaml       # SQL 注入（CRS 942xxx）
│   ├── xss.yaml        # 跨站脚本（CRS 941xxx）
│   ├── rce.yaml        # 远程代码执行（CRS 932xxx）
│   └── ...
├── modsecurity/        # ModSecurity 社区规则
├── cve-patches/        # CVE 虚拟补丁（Log4Shell、Spring4Shell 等）
├── custom/             # 你的应用特定规则
└── tools/              # 规则验证和同步工具
```

## 下一步

- [YAML 语法](./yaml-syntax) —— 完整规则模式参考
- [内置规则](./builtin-rules) —— OWASP CRS 和 CVE 补丁的详细覆盖范围
- [自定义规则](./custom-rules) —— 编写自定义检测规则
