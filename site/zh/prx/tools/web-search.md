---
title: 网页搜索
description: PRX 的网页搜索工具支持 DuckDuckGo（免费）和 Brave Search（需 API 密钥）两种搜索引擎后端。
---

# 网页搜索

`web_search_tool` 为 PRX Agent 提供网页搜索能力。当 Agent 需要查找最新信息、验证事实或获取外部知识时，它可以通过此工具搜索互联网并获取结构化的搜索结果。

PRX 支持两种搜索引擎后端：DuckDuckGo（免费，无需 API 密钥）和 Brave Search（需要 API 密钥，结果质量更高）。搜索工具还可以与 `web_fetch` 工具配合使用——先搜索获取相关 URL，再通过 web_fetch 提取页面的详细内容。

搜索工具需要在配置中显式启用（`web_search.enabled = true`）。为了安全性，搜索结果仅返回标题、摘要和 URL，不会自动加载页面内容。

## 配置

在 `config.toml` 中启用和配置网页搜索：

```toml
[web_search]
enabled = true

# 搜索引擎后端
provider = "duckduckgo"      # "duckduckgo"（免费）或 "brave"（需 API 密钥）

# Brave Search 配置（仅 provider = "brave" 时需要）
# brave_api_key = "BSA_xxxxxxxxxxxxxxxxxxxxxxxx"

# 搜索行为
max_results = 5              # 每次搜索返回的最大结果数
timeout_secs = 10            # 搜索请求超时
safe_search = true           # 安全搜索过滤
language = "zh-CN"           # 搜索语言偏好

# 网页获取（可选，配合搜索使用）
fetch_enabled = true         # 启用 web_fetch 工具
fetch_max_chars = 50000      # 获取页面内容的最大字符数
fetch_timeout_secs = 15      # 页面获取超时
```

### DuckDuckGo vs Brave Search

| 特性 | DuckDuckGo | Brave Search |
|------|-----------|--------------|
| 价格 | 免费 | 免费层 2000 次/月，付费计划可选 |
| API 密钥 | 不需要 | 需要 |
| 结果质量 | 良好 | 优秀 |
| 搜索速度 | 快 | 较快 |
| 隐私 | 强（不追踪） | 强（独立索引） |
| 语言支持 | 广泛 | 广泛 |
| API 限制 | 有频率限制 | 按计划限制 |
| 推荐场景 | 日常使用、零配置部署 | 高质量搜索需求、生产环境 |

## 使用方法

### web_search_tool — 搜索网页

```json
{
  "tool": "web_search_tool",
  "arguments": {
    "query": "Rust async runtime comparison 2024",
    "num_results": 5
  }
}
```

搜索结果的返回格式：

```json
{
  "results": [
    {
      "title": "Comparing Rust async runtimes: Tokio vs async-std vs smol",
      "url": "https://example.com/article",
      "snippet": "A comprehensive comparison of the three major Rust async runtimes..."
    },
    {
      "title": "Which async runtime should you use in 2024?",
      "url": "https://blog.example.com/post",
      "snippet": "Tokio remains the most popular choice, but alternatives..."
    }
  ]
}
```

### web_fetch — 获取页面内容

配合 `web_search_tool` 使用，获取搜索结果页面的详细内容：

```json
{
  "tool": "web_fetch",
  "arguments": {
    "url": "https://example.com/article"
  }
}
```

**注意**：`web_fetch` 需要满足以下条件才能使用：

1. `web_search.fetch_enabled = true`
2. 目标 URL 的域名在 `browser.allowed_domains` 中

### 典型工作流

```
用户: 查一下 Tokio 最新版本有什么新特性

Agent:
1. [调用 web_search_tool: "Tokio latest release features 2024"]
   → 获取搜索结果列表

2. [调用 web_fetch: "https://tokio.rs/blog/latest-release"]
   → 提取页面详细内容

3. 根据搜索结果和页面内容总结回答
```

## 参数

### web_search_tool 参数

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `query` | string | 是 | — | 搜索查询字符串 |
| `num_results` | integer | 否 | 配置值 | 返回结果数量（覆盖 `max_results` 配置） |
| `language` | string | 否 | 配置值 | 搜索语言偏好（如 `zh-CN`、`en-US`） |
| `region` | string | 否 | — | 搜索区域限制 |

### web_fetch 参数

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `url` | string | 是 | — | 要获取内容的页面 URL |
| `selector` | string | 否 | — | CSS 选择器，仅提取匹配元素的内容 |
| `max_chars` | integer | 否 | 配置值 | 返回内容的最大字符数 |

## Brave Search API 密钥获取

1. 访问 [Brave Search API](https://brave.com/search/api/) 注册账户
2. 创建 API 密钥
3. 在 `config.toml` 中配置：

```toml
[web_search]
provider = "brave"
brave_api_key = "BSA_xxxxxxxxxxxxxxxxxxxxxxxx"
```

或通过环境变量：

```bash
export PRX_WEB_SEARCH_BRAVE_API_KEY="BSA_xxxxxxxxxxxxxxxxxxxxxxxx"
```

## 安全性

### 搜索查询审计

所有搜索查询都记录在审计日志中，方便事后审查 Agent 的信息获取行为：

```
[2024-01-15T10:30:45Z] tool=web_search_tool query="Rust security vulnerabilities" results=5
[2024-01-15T10:30:47Z] tool=web_fetch url="https://rustsec.org/advisories" status=success chars=12345
```

### web_fetch 域名限制

`web_fetch` 工具复用 `browser.allowed_domains` 的域名白名单：

```toml
[browser]
allowed_domains = ["github.com", "docs.rs", "crates.io", "*.rust-lang.org"]
```

只有白名单中的域名才能通过 `web_fetch` 获取内容。这防止了：

- Agent 访问内部网络（SSRF 攻击）
- Agent 访问恶意网站
- 数据泄露到未授权的域名

### 安全搜索

启用 `safe_search = true` 可以过滤不安全的搜索结果，适用于需要内容过滤的部署环境。

### 信息泄露防护

搜索查询可能无意中泄露敏感信息。建议：

- 使用 `supervised` 模式审查搜索查询
- 监控审计日志中的敏感词汇
- 对包含内部项目名称或机密信息的查询设置告警

```toml
[security.tool_policy.tools]
web_search_tool = "supervised"  # 高安全环境下监督搜索
web_fetch = "allow"
```

### 速率限制

PRX 内置搜索请求的速率限制，防止因频繁搜索而触发搜索引擎的封禁：

- DuckDuckGo：自动检测和退避
- Brave Search：遵守 API 配额，超额时返回友好错误

## 相关文档

- [工具概览](/zh/prx/tools/) — 所有工具的分类参考
- [浏览器工具](/zh/prx/tools/browser/) — 全功能浏览器自动化
- [HTTP 请求](/zh/prx/tools/http-request/) — 直接 API 调用
- [安全策略](/zh/prx/security/policy-engine/) — 工具策略管道详解
