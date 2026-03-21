---
title: Browser Tool
description: Full browser automation with pluggable backends for web navigation, form interaction, screenshots, and domain-restricted browsing.
---

# Browser Tool

The browser tool provides PRX agents with full web automation capabilities -- navigating pages, filling forms, clicking elements, extracting content, and capturing screenshots. It uses a pluggable backend architecture supporting three automation engines and enforces domain restrictions to prevent unrestricted web access.

Browser tools are feature-gated and require `browser.enabled = true` in the configuration. When enabled, PRX registers `browser` and `browser_open` in the tool registry. The browser tool supports complex multi-step web workflows, while `browser_open` provides a simpler interface for opening a URL and extracting its content.

PRX also includes vision-related tools (`screenshot`, `image`, `image_info`) that complement the browser tool for visual tasks. Screenshots captured by the browser tool can be passed to vision-capable LLMs for visual reasoning.

## Configuration

```toml
[browser]
enabled = true
backend = "agent_browser"       # "agent_browser" | "rust_native" | "computer_use"
allowed_domains = ["github.com", "docs.rs", "*.openprx.dev", "stackoverflow.com"]
session_name = "default"        # Named browser session for persistent state
```

### Backend Options

| Backend | Description | Dependencies | Best For |
|---------|------------|-------------|----------|
| `agent_browser` | Calls the `agent-browser` CLI, an external headless browser tool | `agent-browser` binary in PATH | General web automation, JavaScript-heavy sites |
| `rust_native` | Built-in Rust browser implementation using headless Chrome/Chromium | Chromium installed | Lightweight automation, no external dependencies |
| `computer_use` | Computer-use sidecar for full desktop interaction | Anthropic computer-use sidecar | OS-level interactions, complex GUI workflows |

### Domain Restrictions

The `allowed_domains` list controls which domains the browser can access. Domain matching supports:

- **Exact match**: `"github.com"` matches only `github.com`
- **Subdomain wildcard**: `"*.openprx.dev"` matches `docs.openprx.dev`, `api.openprx.dev`, etc.
- **No wildcard**: An empty list blocks all browser navigation

```toml
[browser]
allowed_domains = [
  "github.com",
  "*.github.com",
  "docs.rs",
  "crates.io",
  "stackoverflow.com",
  "*.openprx.dev"
]
```

## Usage

### browser Tool

The main `browser` tool supports multiple actions for complex web workflows:

**Navigate to a URL:**

```json
{
  "name": "browser",
  "arguments": {
    "action": "navigate",
    "url": "https://github.com/openprx/prx"
  }
}
```

**Fill a form field:**

```json
{
  "name": "browser",
  "arguments": {
    "action": "fill",
    "selector": "#search-input",
    "value": "PRX documentation"
  }
}
```

**Click an element:**

```json
{
  "name": "browser",
  "arguments": {
    "action": "click",
    "selector": "button[type='submit']"
  }
}
```

**Take a screenshot:**

```json
{
  "name": "browser",
  "arguments": {
    "action": "screenshot"
  }
}
```

**Extract page content:**

```json
{
  "name": "browser",
  "arguments": {
    "action": "content"
  }
}
```

### browser_open Tool

A simplified tool for opening a URL and returning its content:

```json
{
  "name": "browser_open",
  "arguments": {
    "url": "https://docs.rs/tokio/latest/tokio/"
  }
}
```

### Multi-Step Workflow Example

A typical research workflow might chain multiple browser actions:

1. Navigate to a search engine
2. Fill the search box with a query
3. Click the search button
4. Extract results from the page
5. Navigate to a relevant result
6. Extract the detailed content
7. Take a screenshot for visual reference

## Parameters

### browser Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `action` | `string` | Yes | -- | Action to perform: `"navigate"`, `"fill"`, `"click"`, `"screenshot"`, `"content"`, `"scroll"`, `"wait"`, `"back"`, `"forward"` |
| `url` | `string` | Conditional | -- | URL to navigate to (required for `"navigate"` action) |
| `selector` | `string` | Conditional | -- | CSS selector for the target element (required for `"fill"`, `"click"`) |
| `value` | `string` | Conditional | -- | Value to fill (required for `"fill"` action) |
| `timeout_ms` | `integer` | No | `30000` | Maximum wait time for the action to complete |

### browser_open Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `url` | `string` | Yes | -- | URL to open and extract content from |

### Vision Tool Parameters

**screenshot:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `target` | `string` | No | `"screen"` | What to capture: `"screen"` or a window identifier |

**image:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `action` | `string` | Yes | -- | Image operation: `"resize"`, `"crop"`, `"convert"` |
| `path` | `string` | Yes | -- | Path to the image file |

**image_info:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `path` | `string` | Yes | -- | Path to the image file to inspect |

## Backend Details

### agent-browser

The `agent_browser` backend delegates to the external `agent-browser` CLI tool, which provides a headless Chrome-based automation environment. Communication happens over stdio with JSON-RPC messages.

Advantages:
- Full JavaScript execution
- Cookie and session persistence
- Extension support

### rust_native

The `rust_native` backend uses Rust bindings to control a local Chromium/Chrome installation directly. It communicates via the Chrome DevTools Protocol (CDP).

Advantages:
- No external binary dependency (beyond Chromium)
- Lower latency than spawning a subprocess
- Tighter integration with PRX internals

### computer_use

The `computer_use` backend leverages Anthropic's computer-use sidecar to perform OS-level interactions including mouse movement, keyboard input, and screen capture. This goes beyond browser automation to full desktop control.

Advantages:
- Can interact with native applications, not just browsers
- Supports complex GUI workflows
- Handles popups, file dialogs, and system prompts

## Security

### Domain Allowlist

The browser tool enforces a strict domain allowlist. Before navigating to any URL:

1. The URL is parsed and the hostname is extracted
2. The hostname is checked against `allowed_domains`
3. If no match is found, the navigation is blocked and an error is returned

This prevents the agent from accessing arbitrary websites, which could expose it to malicious content or trigger unintended actions on authenticated sessions.

### Session Isolation

Browser sessions are isolated by name. Different agent sessions or sub-agents can use separate browser contexts to prevent state leakage (cookies, localStorage, session data).

### Content Extraction Limits

Page content extraction is subject to the `web_search.fetch_max_chars` limit to prevent memory exhaustion from excessively large pages.

### Policy Engine

Browser tool calls pass through the security policy engine. The tool can be denied entirely, or supervised to require approval for each navigation:

```toml
[security.tool_policy.tools]
browser = "supervised"
browser_open = "allow"
```

### Credential Safety

The browser tool does not inject credentials or authentication tokens into browser sessions. If the agent needs to authenticate on a website, it must use the browser tool to fill login forms explicitly, which is subject to supervision policies.

## Related

- [Web Search](/en/prx/tools/web-search) -- search the web without browser automation
- [HTTP Request](/en/prx/tools/http-request) -- programmatic HTTP requests to APIs
- [Shell Execution](/en/prx/tools/shell) -- alternative for CLI-based web interactions (curl, wget)
- [Security Sandbox](/en/prx/security/sandbox) -- process isolation for tool execution
- [Configuration Reference](/en/prx/config/reference) -- `[browser]` configuration fields
- [Tools Overview](/en/prx/tools/) -- all tools and registry system
