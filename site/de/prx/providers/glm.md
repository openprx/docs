---
title: GLM (Zhipu AI)
description: GLM und verwandte chinesische KI-Anbieter (Minimax, Moonshot, Qwen, Z.AI) in PRX konfigurieren
---

# GLM (Zhipu AI)

> Zugriff auf Zhipu GLM-Modelle und eine Familie chinesischer KI-Anbieter über eine vereinheitlichte Konfiguration. Enthält Aliase für Minimax, Moonshot (Kimi), Qwen (DashScope) und Z.AI.

## Voraussetzungen

- Ein Zhipu AI API-Schlüssel von [open.bigmodel.cn](https://open.bigmodel.cn/) (für GLM-Modelle), **oder**
- API-Schlüssel für den jeweiligen Anbieter, den Sie nutzen möchten (Minimax, Moonshot, Qwen usw.)

## Schnelleinrichtung

### 1. API-Schlüssel erhalten

1. Registrieren Sie sich bei [open.bigmodel.cn](https://open.bigmodel.cn/)
2. Navigieren Sie zum API-Keys-Bereich
3. Erstellen Sie einen neuen Schlüssel (Format: `id.secret`)

### 2. Konfigurieren

```toml
[default]
provider = "glm"
model = "glm-4-plus"

[providers.glm]
api_key = "${GLM_API_KEY}"
```

Oder setzen Sie die Umgebungsvariable:

```bash
export GLM_API_KEY="abc123.secretXYZ"
```

### 3. Überprüfen

```bash
prx doctor models
```

## Verfügbare Modelle

### GLM-Modelle

| Modell | Kontext | Vision | Werkzeugnutzung | Hinweise |
|--------|---------|--------|----------|-------|
| `glm-4-plus` | 128K | Ja | Ja | Leistungsfähigstes GLM-Modell |
| `glm-4` | 128K | Ja | Ja | Standard GLM-4 |
| `glm-4-flash` | 128K | Ja | Ja | Schnell und kosteneffektiv |
| `glm-4v` | 128K | Ja | Ja | Vision-optimiert |

### Aliased-Anbieter

PRX unterstützt auch diese Anbieter als Aliase, die über die OpenAI-kompatible Schnittstelle geroutet werden:

| Anbieter | Aliasnamen | Basis-URL | Schlüsselmodelle |
|----------|-------------|----------|------------|
| **Minimax** | `minimax`, `minimax-intl`, `minimax-cn` | `api.minimax.io/v1` (intl), `api.minimaxi.com/v1` (CN) | `MiniMax-Text-01`, `abab6.5s` |
| **Moonshot** | `moonshot`, `kimi`, `moonshot-intl`, `kimi-cn` | `api.moonshot.ai/v1` (intl), `api.moonshot.cn/v1` (CN) | `moonshot-v1-128k`, `moonshot-v1-32k` |
| **Qwen** | `qwen`, `dashscope`, `qwen-intl`, `qwen-us` | `dashscope.aliyuncs.com` (CN), `dashscope-intl.aliyuncs.com` (intl) | `qwen-max`, `qwen-plus`, `qwen-turbo` |
| **Z.AI** | `zai`, `z.ai`, `zai-cn` | `api.z.ai/api/coding/paas/v4` (global), `open.bigmodel.cn/api/coding/paas/v4` (CN) | Z.AI Coding-Modelle |

## Konfigurationsreferenz

### GLM (Nativer Anbieter)

| Feld | Typ | Standard | Beschreibung |
|------|-----|----------|-------------|
| `api_key` | String | erforderlich | GLM-API-Schlüssel im `id.secret`-Format |
| `model` | String | erforderlich | GLM-Modellname |

### Aliased-Anbieter (OpenAI-kompatibel)

| Feld | Typ | Standard | Beschreibung |
|------|-----|----------|-------------|
| `api_key` | String | erforderlich | Anbieterspezifischer API-Schlüssel |
| `api_url` | String | automatisch erkannt | Überschreibung der Standard-Basis-URL |
| `model` | String | erforderlich | Modellname |

## Funktionen

### JWT-Authentifizierung

GLM verwendet JWT-basierte Authentifizierung anstelle einfacher API-Schlüssel. PRX führt automatisch folgende Schritte durch:

1. Aufteilen des API-Schlüssels in `id`- und `secret`-Komponenten
2. Generierung eines JWT-Tokens mit:
   - Header: `{"alg":"HS256","typ":"JWT","sign_type":"SIGN"}`
   - Payload: `{"api_key":"<id>","exp":<expiry_ms>,"timestamp":<now_ms>}`
   - Signatur: HMAC-SHA256 mit dem Geheimschlüssel
3. Caching des JWT für 3 Minuten (Token läuft nach 3,5 Minuten ab)
4. Senden als `Authorization: Bearer <jwt>`

### Regionale Endpunkte

Die meisten Aliased-Anbieter bieten sowohl internationale als auch Festlandchina-Endpunkte:

```toml
# International (default for most)
provider = "moonshot-intl"

# China mainland
provider = "moonshot-cn"

# Explicit regional variants
provider = "qwen-us"      # US region
provider = "qwen-intl"    # International
provider = "qwen-cn"      # China mainland
```

### Minimax OAuth-Unterstützung

Minimax unterstützt OAuth-Token-Authentifizierung:

```bash
export MINIMAX_OAUTH_TOKEN="..."
export MINIMAX_OAUTH_REFRESH_TOKEN="..."
```

Setzen Sie `provider = "minimax-oauth"` oder `provider = "minimax-oauth-cn"`, um OAuth statt API-Schlüssel-Authentifizierung zu verwenden.

### Qwen OAuth- und Coding-Modi

Qwen bietet zusätzliche Zugriffsmodi:

- **Qwen OAuth**: `provider = "qwen-oauth"` oder `provider = "qwen-code"` für OAuth-basierten Zugriff
- **Qwen Coding**: `provider = "qwen-coding"` oder `provider = "dashscope-coding"` für den Coding-spezialisierten API-Endpunkt

## Anbieter-Aliase-Referenz

| Alias | Löst auf zu | Endpunkt |
|-------|-------------|----------|
| `glm`, `zhipu`, `glm-global`, `zhipu-global` | GLM (global) | `api.z.ai/api/paas/v4` |
| `glm-cn`, `zhipu-cn`, `bigmodel` | GLM (CN) | `open.bigmodel.cn/api/paas/v4` |
| `minimax`, `minimax-intl`, `minimax-global` | MiniMax (intl) | `api.minimax.io/v1` |
| `minimax-cn`, `minimaxi` | MiniMax (CN) | `api.minimaxi.com/v1` |
| `moonshot`, `kimi`, `moonshot-cn`, `kimi-cn` | Moonshot (CN) | `api.moonshot.cn/v1` |
| `moonshot-intl`, `kimi-intl`, `kimi-global` | Moonshot (intl) | `api.moonshot.ai/v1` |
| `qwen`, `dashscope`, `qwen-cn` | Qwen (CN) | `dashscope.aliyuncs.com` |
| `qwen-intl`, `dashscope-intl` | Qwen (intl) | `dashscope-intl.aliyuncs.com` |
| `qwen-us`, `dashscope-us` | Qwen (US) | `dashscope-us.aliyuncs.com` |
| `zai`, `z.ai` | Z.AI (global) | `api.z.ai/api/coding/paas/v4` |
| `zai-cn`, `z.ai-cn` | Z.AI (CN) | `open.bigmodel.cn/api/coding/paas/v4` |

## Fehlerbehebung

### "GLM API key not set or invalid format"

Der GLM-API-Schlüssel muss im `id.secret`-Format vorliegen (enthält genau einen Punkt). Überprüfen Sie Ihr Schlüsselformat:
```
abc123.secretXYZ  # correct
abc123secretXYZ   # wrong - missing dot
```

### JWT-Generierung schlägt fehl

Stellen Sie sicher, dass Ihre Systemuhr genau ist. JWT-Tokens enthalten einen Zeitstempel und laufen nach 3,5 Minuten ab.

### MiniMax "role: system" abgelehnt

MiniMax akzeptiert keine `role: system`-Nachrichten. PRX führt automatisch den System-Nachrichteninhalt mit der ersten Benutzernachricht zusammen, wenn MiniMax-Anbieter verwendet werden.

### Qwen/DashScope-Timeout

Qwens DashScope-API erfordert HTTP/1.1 (nicht HTTP/2). PRX erzwingt automatisch HTTP/1.1 für DashScope-Endpunkte. Wenn Sie Timeouts erleben, stellen Sie sicher, dass Ihr Netzwerk HTTP/1.1-Verbindungen zulässt.

### Regionale Endpunkt-Fehler

Wenn Sie Verbindungsfehler erhalten, versuchen Sie zwischen regionalen Endpunkten zu wechseln:
- China-Benutzer: `*-cn`-Varianten verwenden
- Internationale Benutzer: `*-intl`- oder Basisvarianten verwenden
- US-basierte Benutzer: `qwen-us` für Qwen versuchen
