---
title: ვებ ძიება
description: Search the web via DuckDuckGo (free, no API key) or Brave Search (API key required) with configurable result limits and timeouts.
---

# Web Search

The `web_search_tool` enables PRX agents to search the web for current information. It supports two search providers -- DuckDuckGo (free, no API key required) and Brave Search (requires an API key) -- and returns structured search results that the agent can use to answer questions about recent events, look up documentation, or research topics.

Web search is feature-gated and requires `web_search.enabled = true` in the configuration. When enabled, PRX also optionally registers the `web_fetch` tool for extracting full page content from URLs found in search results.

The combination of `web_search_tool` and `web_fetch` gives agents a complete web research pipeline: search for relevant pages, then fetch and extract content from the most promising results.

## კონფიგურაცია

```toml
[web_search]
enabled = true
provider = "duckduckgo"      # "duckduckgo" (free) or "brave" (API key required)
max_results = 5              # Maximum results per search (1-10)
timeout_secs = 10            # Request timeout in seconds

# Brave Search (requires API key)
# provider = "brave"
# brave_api_key = "BSA-xxxxxxxxxxxx"

# Web fetch (page content extraction)
fetch_enabled = true         # Enable the web_fetch tool
fetch_max_chars = 50000      # Maximum characters returned by web_fetch
```

### Provider Comparison

| Feature | DuckDuckGo | Brave Search |
|---------|-----------|-------------|
| Cost | Free | Free tier (2000 queries/month), paid plans available |
| API key | Not required | Required (`brave_api_key`) |
| Result quality | Good for general queries | Higher quality, better structured |
| Rate limits | Implicit (may throttle) | Explicit (based on plan) |
| Privacy | Privacy-focused | Privacy-focused |
| Structured data | Basic (title, URL, snippet) | Rich (title, URL, snippet, extra descriptions) |

### Choosing a Provider

- **DuckDuckGo** is the default and works out of the box with no configuration beyond `enabled = true`. It is suitable for most use cases and does not require any account or API key.
- **Brave Search** provides higher-quality results and richer metadata. Use it when search quality is critical or when you need the `web_fetch` tool for reliable content extraction.

## გამოყენება

### web_search_tool

The search tool returns a list of results with titles, URLs, and snippets:

```json
{
  "name": "web_search_tool",
  "arguments": {
    "query": "Rust async runtime comparison tokio vs async-std 2026",
    "max_results": 5
  }
}
```

**Example response:**

```json
{
  "success": true,
  "output": "1. Comparing Tokio and async-std in 2026 - https://blog.example.com/rust-async\n   Snippet: A detailed comparison of the two main Rust async runtimes...\n\n2. Tokio documentation - https://docs.rs/tokio\n   Snippet: Tokio is an asynchronous runtime for Rust...\n\n..."
}
```

### web_fetch

After finding relevant URLs via search, the agent can fetch and extract content:

```json
{
  "name": "web_fetch",
  "arguments": {
    "url": "https://blog.example.com/rust-async"
  }
}
```

The `web_fetch` tool:

1. Validates the URL domain against `browser.allowed_domains`
2. Fetches the page content
3. Extracts readable text (stripping HTML, scripts, styles)
4. Truncates to `fetch_max_chars`
5. Returns the extracted content

::: warning
`web_fetch` requires both `web_search.fetch_enabled = true` **and** `browser.allowed_domains` to be set. The fetched URL must match one of the allowed domains.
:::

## Parameters

### web_search_tool Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `query` | `string` | Yes | -- | The search query string |
| `max_results` | `integer` | No | Config value (`5`) | Maximum number of results to return (1-10) |

**Returns:**

| Field | Type | Description |
|-------|------|-------------|
| `success` | `bool` | `true` if the search completed |
| `output` | `string` | Formatted search results with titles, URLs, and snippets |
| `error` | `string?` | Error message if the search failed (timeout, provider error, etc.) |

### web_fetch Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `url` | `string` | Yes | -- | The URL to fetch and extract content from |

**Returns:**

| Field | Type | Description |
|-------|------|-------------|
| `success` | `bool` | `true` if the page was fetched and parsed |
| `output` | `string` | Extracted text content, truncated to `fetch_max_chars` |
| `error` | `string?` | Error message if the fetch failed (domain not allowed, timeout, etc.) |

## Typical Research Workflow

A complete web research workflow typically follows this pattern:

1. **Search**: The agent uses `web_search_tool` to find relevant pages
2. **Evaluate**: The agent reviews search snippets to identify the most relevant results
3. **Fetch**: The agent uses `web_fetch` to extract full content from selected pages
4. **Synthesize**: The agent combines information from multiple sources into a response

```
Agent thinking: The user asked about the latest Rust release features.
  1. [web_search_tool] query="Rust 1.82 release features changelog"
  2. [reviews results, selects top 2 URLs]
  3. [web_fetch] url="https://blog.rust-lang.org/2026/..."
  4. [web_fetch] url="https://releases.rs/docs/1.82.0/"
  5. [synthesizes response from fetched content]
```

## უსაფრთხოება

### Provider Credentials

- **DuckDuckGo**: No credentials required. Queries are sent to DuckDuckGo's API endpoints.
- **Brave Search**: The `brave_api_key` is stored in the configuration file. Use PRX's encrypted secrets store to protect it:

```toml
[web_search]
brave_api_key = "enc:xxxxxxxxxxxxx"  # Encrypted with ChaCha20-Poly1305
```

### Domain Restrictions for web_fetch

The `web_fetch` tool respects the `browser.allowed_domains` list. This prevents the agent from fetching content from arbitrary URLs, which could:

- Expose the agent to malicious content (prompt injection via web pages)
- Trigger server-side request forgery (SSRF) if the agent fetches internal URLs
- Leak information through DNS or HTTP requests to attacker-controlled domains

```toml
[browser]
allowed_domains = ["docs.rs", "crates.io", "github.com", "*.rust-lang.org"]
```

### Timeout Protection

Both search and fetch operations have configurable timeouts to prevent hanging on slow or unresponsive servers:

- `web_search.timeout_secs` (default: 10 seconds) -- search query timeout
- Network-level timeouts apply to `web_fetch` as well

### Content Size Limits

The `fetch_max_chars` setting (default: 50,000 characters) prevents memory exhaustion from extremely large web pages. Content beyond this limit is truncated.

### Policy Engine

Web search tools pass through the security policy engine:

```toml
[security.tool_policy.tools]
web_search_tool = "allow"
web_fetch = "supervised"     # Require approval before fetching
```

## დაკავშირებული

- [HTTP Request](/ka/prx/tools/http-request) -- programmatic HTTP requests to APIs
- [Browser Tool](/ka/prx/tools/browser) -- full browser automation for JavaScript-heavy sites
- [Configuration Reference](/ka/prx/config/reference) -- `[web_search]` and `[browser]` fields
- [Secrets Management](/ka/prx/security/secrets) -- encrypted storage for API keys
- [Tools Overview](/ka/prx/tools/) -- all tools and registry system
