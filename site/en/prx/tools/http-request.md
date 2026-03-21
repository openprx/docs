---
title: HTTP Request
description: Make HTTP requests to APIs with domain allowlisting, configurable response size limits, and timeout enforcement.
---

# HTTP Request

The `http_request` tool enables PRX agents to make direct HTTP requests to external APIs. It is designed for structured API interactions -- fetching JSON data, calling REST endpoints, posting webhooks -- rather than general web browsing. The tool enforces a deny-by-default domain policy: only domains explicitly listed in `allowed_domains` are reachable.

HTTP request is feature-gated and requires `http_request.enabled = true` in the configuration. Unlike the browser tool which renders web pages, the HTTP request tool works at the protocol level, making it faster and more suitable for API integrations.

The tool supports all standard HTTP methods (GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS), custom headers, request bodies, and configurable timeouts. Response bodies are captured up to a configurable maximum size to prevent memory exhaustion.

## Configuration

```toml
[http_request]
enabled = true
allowed_domains = [
  "api.github.com",
  "api.openai.com",
  "api.anthropic.com",
  "httpbin.org"
]
max_response_size = 1000000   # Maximum response body size in bytes (1 MB)
timeout_secs = 30             # Request timeout in seconds
```

### Domain Allowlist

The `allowed_domains` list is the primary security control for the HTTP request tool. Only requests to domains in this list are permitted. Domain matching rules:

| Pattern | Example | Matches |
|---------|---------|---------|
| Exact domain | `"api.github.com"` | `api.github.com` only |
| Wildcard subdomain | `"*.github.com"` | `api.github.com`, `raw.github.com`, etc. |
| Top-level domain | `"github.com"` | `github.com` only (not subdomains by default) |

::: warning
An empty `allowed_domains` list means no HTTP requests are allowed, even if the tool is enabled. This is the secure default.
:::

## Usage

### GET Request

Fetch data from a REST API:

```json
{
  "name": "http_request",
  "arguments": {
    "method": "GET",
    "url": "https://api.github.com/repos/openprx/prx/releases/latest",
    "headers": {
      "Accept": "application/vnd.github+json",
      "Authorization": "Bearer ghp_xxxxxxxxxxxx"
    }
  }
}
```

### POST Request

Send data to an API endpoint:

```json
{
  "name": "http_request",
  "arguments": {
    "method": "POST",
    "url": "https://api.example.com/webhooks",
    "headers": {
      "Content-Type": "application/json"
    },
    "body": "{\"event\": \"task_completed\", \"data\": {\"task_id\": 42}}"
  }
}
```

### PUT Request

Update a resource:

```json
{
  "name": "http_request",
  "arguments": {
    "method": "PUT",
    "url": "https://api.example.com/config/settings",
    "headers": {
      "Content-Type": "application/json",
      "Authorization": "Bearer token-here"
    },
    "body": "{\"theme\": \"dark\", \"language\": \"en\"}"
  }
}
```

### DELETE Request

Remove a resource:

```json
{
  "name": "http_request",
  "arguments": {
    "method": "DELETE",
    "url": "https://api.example.com/items/42",
    "headers": {
      "Authorization": "Bearer token-here"
    }
  }
}
```

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `method` | `string` | No | `"GET"` | HTTP method: `"GET"`, `"POST"`, `"PUT"`, `"PATCH"`, `"DELETE"`, `"HEAD"`, `"OPTIONS"` |
| `url` | `string` | Yes | -- | The full URL to request. Must be HTTPS or HTTP. Domain must be in `allowed_domains`. |
| `headers` | `object` | No | `{}` | Key-value map of HTTP headers to include in the request |
| `body` | `string` | No | -- | Request body (for POST, PUT, PATCH methods) |
| `timeout_secs` | `integer` | No | Config value (`30`) | Per-request timeout override in seconds |

**Returns:**

| Field | Type | Description |
|-------|------|-------------|
| `success` | `bool` | `true` if the request completed (even for non-2xx status codes) |
| `output` | `string` | Response body (text), truncated to `max_response_size`. Includes status code and headers in structured output. |
| `error` | `string?` | Error message if the request failed (domain blocked, timeout, connection error) |

### Response Format

The tool returns a structured output containing:

```
Status: 200 OK
Content-Type: application/json

{
  "name": "prx",
  "version": "0.8.0",
  ...
}
```

For non-text responses (binary data), the tool reports the response size and content type without including the body.

## Common Patterns

### API Integration

The HTTP request tool is commonly used to integrate with external services:

```
Agent thinking: The user wants to check the CI status of their PR.
  1. [http_request] GET https://api.github.com/repos/owner/repo/pulls/42/checks
  2. [parses JSON response]
  3. [reports status to user]
```

### Webhook Delivery

Send notifications to external systems:

```
Agent thinking: Task completed, need to notify the webhook.
  1. [http_request] POST https://hooks.slack.com/services/T.../B.../xxx
     body: {"text": "Task #42 completed successfully"}
```

### Data Fetching

Retrieve structured data for analysis:

```
Agent thinking: Need to look up package metadata.
  1. [http_request] GET https://crates.io/api/v1/crates/tokio
  2. [extracts version, download count, dependencies]
```

## Security

### Deny-by-Default

The HTTP request tool uses a deny-by-default security model. If a domain is not explicitly listed in `allowed_domains`, the request is blocked before any network connection is made. This prevents:

- **Server-Side Request Forgery (SSRF)**: The agent cannot make requests to internal network addresses (`localhost`, `10.x.x.x`, `192.168.x.x`) unless explicitly allowed
- **Data exfiltration**: The agent cannot send data to arbitrary external servers
- **DNS rebinding**: The domain is checked at request time, not just at DNS resolution

### Credential Handling

The HTTP request tool does not automatically inject credentials. If the agent needs to authenticate with an API, it must include authentication headers explicitly in the tool call arguments. This means:

- API keys are visible in the tool call (and audit log)
- The agent can only use credentials it has been given or retrieved from memory
- Credential leakage to unauthorized domains is prevented by the domain allowlist

Consider using the `[security.tool_policy]` to mark `http_request` as supervised for sensitive API calls:

```toml
[security.tool_policy.tools]
http_request = "supervised"
```

### Response Size Limits

The `max_response_size` setting (default: 1 MB) prevents memory exhaustion from unexpectedly large responses. Responses exceeding this limit are truncated and a note is appended to the output.

### Timeout Protection

The `timeout_secs` setting (default: 30 seconds) prevents the agent from hanging on slow or unresponsive servers. Timeouts are enforced at the connection level.

### Proxy Support

When `[proxy]` is configured, HTTP requests route through the configured proxy:

```toml
[proxy]
enabled = true
https_proxy = "socks5://127.0.0.1:1080"
no_proxy = ["localhost", "127.0.0.1"]
```

### Audit Logging

All HTTP requests are logged to the audit log when enabled, including:

- Request method and URL
- Request headers (with sensitive values redacted)
- Response status code
- Response size
- Success/failure status

## Related

- [Web Search](/en/prx/tools/web-search) -- search the web and fetch page content
- [Browser Tool](/en/prx/tools/browser) -- full browser automation for web pages
- [MCP Integration](/en/prx/tools/mcp) -- connect to external tools via MCP protocol
- [Configuration Reference](/en/prx/config/reference) -- `[http_request]` configuration fields
- [Proxy Configuration](/en/prx/config/reference#proxy) -- outbound proxy settings
- [Tools Overview](/en/prx/tools/) -- all tools and registry system
