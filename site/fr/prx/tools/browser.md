---
title: Browser Tool
description: Full browser automation with pluggable backends for web navigation, form interaction, screenshots, and domain-restricted browsing.
---

# Browser Tool

L'outil navigateur fournit aux agents PRX des capacites completes d'automatisation web -- navigating pages, filling forms, clicking elements, extracting content, and capturing screenshots. It uses a pluggable backend architecture supporting three automation engines and applique domain restrictions pour empecher unrestricted web access.

Les outils navigateur sont proteges par un feature gate et necessitent `browser.enabled = true` dans la configuration. Lorsqu'active, PRX registers `browser` et `browser_open` in le registre d'outils. The browser tool supports complex multi-step web workflows, tandis que `browser_open` provides a simpler interface for opening a URL et extracting its content.

PRX also includes vision-related tools (`screenshot`, `image`, `image_info`) that complement the browser tool for visual tasks. Screenshots captured par le browser tool peut etre passed to vision-capable LLMs for visual reasoning.

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

### Restrictions de domaine

La liste `allowed_domains` controle quels domaines le navigateur peut acceder. La correspondance de domaine prend en charge:

- **Exact match**: `"github.com"` matches only `github.com`
- **Subdomain wildcard**: `"*.openprx.dev"` matches `docs.openprx.dev`, `api.openprx.dev`, etc.
- **Non wildcard**: An empty list bloque all browser navigation

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

## Utilisation

### browser Tool

The main `browser` tool supports multiple actions for complex web workflows:

**Navigate vers un URL:**

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

A simplified tool for opening a URL and retouring its content:

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

1. Navigate vers un search engine
2. Fill the search box avec un query
3. Click the search button
4. Extract results depuis le page
5. Navigate vers un relevant result
6. Extract the detailed content
7. Take a screenshot for visual reference

## Parametres

### browser Parameters

| Parametre | Type | Requis | Defaut | Description |
|-----------|------|----------|---------|-------------|
| `action` | `string` | Oui | -- | Action to perform: `"navigate"`, `"fill"`, `"click"`, `"screenshot"`, `"content"`, `"scroll"`, `"wait"`, `"back"`, `"forward"` |
| `url` | `string` | Conditional | -- | URL to navigate to (required for `"navigate"` action) |
| `selector` | `string` | Conditional | -- | CSS selector pour le target element (required for `"fill"`, `"click"`) |
| `value` | `string` | Conditional | -- | Valeur to fill (required for `"fill"` action) |
| `timeout_ms` | `integer` | Non | `30000` | Maximum wait time pour le action to complete |

### browser_open Parameters

| Parametre | Type | Requis | Defaut | Description |
|-----------|------|----------|---------|-------------|
| `url` | `string` | Oui | -- | URL to open and extract content from |

### Vision Tool Parameters

**screenshot:**

| Parametre | Type | Requis | Defaut | Description |
|-----------|------|----------|---------|-------------|
| `target` | `string` | Non | `"screen"` | What to capture: `"screen"` ou un window identifier |

**image:**

| Parametre | Type | Requis | Defaut | Description |
|-----------|------|----------|---------|-------------|
| `action` | `string` | Oui | -- | Image operation: `"resize"`, `"crop"`, `"convert"` |
| `path` | `string` | Oui | -- | Path vers le image file |

**image_info:**

| Parametre | Type | Requis | Defaut | Description |
|-----------|------|----------|---------|-------------|
| `path` | `string` | Oui | -- | Path vers le image file to inspect |

## Backend Details

### agent-browser

Le backend `agent_browser` delegue au `agent-browser` CLI tool, which provides a headless Chrome-based automation environment. Communication happens over stdio with JSON-RPC messages.

Advantages:
- Full JavaScript execution
- Cookie and session persistence
- Extension support

### rust_native

The `rust_native` backend uses Rust bindings to control a local Chromium/Chrome installation directly. It communique via the Chrome DevTools Protocol (CDP).

Advantages:
- Non external binary dependency (beyond Chromium)
- Lower latency than lancement de a subprocess
- Tighter integration with PRX internals

### computer_use

Le backend `computer_use` exploite le sidecar computer-use d'Anthropic pour effectuer des interactions au niveau du systeme d'exploitation including mouse movement, keyboard input, and screen capture. This goes beyond browser automation to full desktop control.

Advantages:
- Can interact with native applications, not just browsers
- Supports complex GUI workflows
- Handles popups, file dialogs, and system prompts

## Securite

### Domain Allowlist

The browser tool applique a strict domain allowlist. Before navigating to any URL:

1. L'URL est analysee et le nom d'hote est extrait
2. L'hotename est verifie par rapport a `allowed_domains`
3. Si aucun match is found, the navigation est bloque and an error is retournes

Cela empeche l'agent depuis unccessing arbitrary websites, which could expose it to malicious content ou trigger unintended actions on authenticated sessions.

### Session Isolation

Browser sessions sont isoles by name. Different session d'agents or sub-agents can use separate browser contexts pour empecher state leakage (cookies, localStorage, session data).

### Content Extraction Limites

Page content extraction est soumis a the `web_search.fetch_max_chars` limit pour empecher memory exhaustion from excessively large pages.

### Moteur de politiques

Browser appels d'outils pass via le moteur de politiques de securite. L'outil peut etre denied entirely, or supervised to require approval for each navigation:

```toml
[security.tool_policy.tools]
browser = "supervised"
browser_open = "allow"
```

### Credential Safety

The browser tool ne fait pas inject credentials ou authentication tokens into browser sessions. If l'agent doit authenticate sur un website, it must use the browser tool to fill login forms explicitly, which est soumis a supervision policies.

## Voir aussi

- [Web Search](/fr/prx/tools/web-search) -- search the web without browser automation
- [HTTP Request](/fr/prx/tools/http-request) -- programmatic HTTP requests to APIs
- [Shell Execution](/fr/prx/tools/shell) -- alternative for CLI-based web interactions (curl, wget)
- [Security Sandbox](/fr/prx/security/sandbox) -- process isolation for execution d'outil
- [Configuration Reference](/fr/prx/config/reference) -- `[browser]` configuration fields
- [Tools Overview](/fr/prx/tools/) -- tous les outils et systeme de registre
