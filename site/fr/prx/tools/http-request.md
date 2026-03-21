---
title: Requetes HTTP
description: Make HTTP requests to APIs with domain allowlisting, configurable response size limits, and application des delais d'attente.
---

# HTTP Request

The `http_request` tool permet aux agents PRX de effectuer des requetes HTTP directes vers des API externes. It est concu pour structured API interactions -- fetching JSON data, calling REST endpoints, posting webhooks -- plutot que general web browsing. L'outil applique a deny-by-default domain policy: only domains explicitly liste dans `allowed_domains` are reachable.

L'outil HTTP request est protege par un feature gate et necessite `http_request.enabled = true` dans la configuration. Unlike the browser tool which renders web pages, the HTTP request tool works au protocol level, making it faster and more suitable for API integrations.

L'outil supports all standard HTTP methods (GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS), custom headers, request bodies, and configurable timeouts. Response bodies sont captures jusqu'a a configurable maximum size pour empecher memory exhaustion.

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

The `allowed_domains` list est le principal security control pour le HTTP request tool. Only requests to domains in this list are permitted. Domain matching rules:

| Pattern | Example | Matches |
|---------|---------|---------|
| Exact domain | `"api.github.com"` | `api.github.com` only |
| Wildcard subdomain | `"*.github.com"` | `api.github.com`, `raw.github.com`, etc. |
| Top-level domain | `"github.com"` | `github.com` only (not subdomains par defaut) |

::: warning
Une liste `allowed_domains` vide signifie qu'aucune requete HTTP n'est autorisee, meme si l'outil est active. This is the secure default.
:::

## Utilisation

### GET Request

Fetch data depuis un REST API:

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

## Parametres

| Parametre | Type | Requis | Defaut | Description |
|-----------|------|----------|---------|-------------|
| `method` | `string` | Non | `"GET"` | HTTP method: `"GET"`, `"POST"`, `"PUT"`, `"PATCH"`, `"DELETE"`, `"HEAD"`, `"OPTIONS"` |
| `url` | `string` | Oui | -- | The full URL to request. Must be HTTPS or HTTP. Domain doit etre in `allowed_domains`. |
| `headers` | `object` | Non | `{}` | Key-value map of HTTP headers to include in la requete |
| `body` | `string` | Non | -- | Request body (for POST, PUT, PATCH methods) |
| `timeout_secs` | `integer` | Non | Config value (`30`) | Per-request timeout override in seconds |

**Retours:**

| Champ | Type | Description |
|-------|------|-------------|
| `success` | `bool` | `true` if la requete completed (even for non-2xx status codes) |
| `output` | `string` | Response body (text), tronque to `max_response_size`. Includes status code and headers in structured output. |
| `error` | `string?` | Error message if la requete failed (domain blocked, timeout, connectien cas d'erreur) |

### Response Format

L'outil retours a structured output containing:

```
Status: 200 OK
Content-Type: application/json

{
  "name": "prx",
  "version": "0.8.0",
  ...
}
```

For non-text responses (binary data), l'outil reports la reponse size and content type without including the body.

## Common Patterns

### API Integration

The HTTP request tool est couramment utilise pour s'integrer avec des services externes:

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

## Securite

### Deny-by-Defaut

The HTTP request tool uses a deny-by-default security model. Si un domain is pas explicitement liste dans `allowed_domains`, la requete est bloque before any network connection is made. Cela empeche:

- **Server-Side Request Forgery (SSRF)**: L'agent ne peut pas make requests to internal network addresses (`localhost`, `10.x.x.x`, `192.168.x.x`) unless explicitly allowed
- **Data exfiltration**: L'agent ne peut pas send data to arbitrary external servers
- **DNS rebinding**: Le domaine est verifie au moment de la requete, pas seulement a la resolution DNS

### Credential Handling

The HTTP request tool ne fait pcomme unutomatically inject credentials. If l'agent doit authenticate avec unn API, it doit inclure authentication headers explicitly in l'outil call arguments. Cela signifie:

- API keys are visible in l'outil call (and journal d'audit)
- L'agent ne peut que use credentials it a ete given or retrieved depuis la memoire
- Credential leakage to unauthorized domains is prevented par le domain allowlist

Consider en utilisant le `[security.tool_policy]` to mark `http_request` as supervised for sensitive API calls:

```toml
[security.tool_policy.tools]
http_request = "supervised"
```

### Response Size Limites

The `max_response_size` setting (par defaut : 1 MB) empeche memory exhaustion from unexpectedly large responses. Responses exceeding this limit are tronque et a note is appended to la sortie.

### Timeout Protection

The `timeout_secs` setting (par defaut : 30 seconds) empeche l'agent from hanging on slow ou unresponsive servers. Timeouts are enforced at la connexion level.

### Proxy Support

When `[proxy]` is configured, HTTP requests route via le configured proxy:

```toml
[proxy]
enabled = true
https_proxy = "socks5://127.0.0.1:1080"
no_proxy = ["localhost", "127.0.0.1"]
```

### Journalisation d'audit

All HTTP requests sont journalises vers le journal d'audit lorsqu'active, incluant :

- Request method and URL
- Request headers (avec les valeurs sensibles expurgees)
- Response status code
- Response size
- Success/failure status

## Voir aussi

- [Web Search](/fr/prx/tools/web-search) -- search the web and fetch page content
- [Browser Tool](/fr/prx/tools/browser) -- full browser automation for web pages
- [MCP Integration](/fr/prx/tools/mcp) -- connect to external tools via MCP protocol
- [Configuration Reference](/fr/prx/config/reference) -- `[http_request]` configuration fields
- [Proxy Configuration](/fr/prx/config/reference#proxy) -- outbound proxy settings
- [Tools Overview](/fr/prx/tools/) -- tous les outils et systeme de registre
