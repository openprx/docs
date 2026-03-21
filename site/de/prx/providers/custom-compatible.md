---
title: Custom Compatible
description: Jeden OpenAI-kompatiblen API-Endpunkt als LLM-Anbieter in PRX konfigurieren
---

# Custom Compatible

> PRX mit jeder LLM-API verbinden, die dem OpenAI Chat Completions-Format folgt. Funktioniert mit LiteLLM, vLLM, Groq, Mistral, xAI, Venice, Vercel AI, Cloudflare AI, HuggingFace Inference und jedem anderen OpenAI-kompatiblen Dienst.

## Voraussetzungen

- Eine laufende LLM-API, die das OpenAI Chat Completions-Format implementiert (`/v1/chat/completions` oder `/chat/completions`)
- Ein API-Schlüssel (falls vom Dienst benötigt)

## Schnelleinrichtung

### 1. Endpunkt identifizieren

Bestimmen Sie die Basis-URL und Authentifizierungsmethode Ihrer API. Zum Beispiel:

- Groq: `https://api.groq.com/openai/v1`
- Mistral: `https://api.mistral.ai/v1`
- xAI: `https://api.x.ai/v1`
- Lokales vLLM: `http://localhost:8000/v1`
- LiteLLM-Proxy: `http://localhost:4000`

### 2. Konfigurieren

```toml
[default]
provider = "compatible"
model = "your-model-name"

[providers.compatible]
api_key = "${YOUR_API_KEY}"
api_url = "https://api.your-provider.com/v1"
```

### 3. Überprüfen

```bash
prx doctor models
```

## Eingebaute kompatible Anbieter

PRX enthält vorkonfigurierte Aliase für beliebte OpenAI-kompatible Dienste:

| Anbietername | Aliase | Basis-URL | Auth-Stil |
|--------------|---------|----------|------------|
| Venice | `venice` | `https://api.venice.ai` | Bearer |
| Vercel AI | `vercel`, `vercel-ai` | `https://api.vercel.ai` | Bearer |
| Cloudflare AI | `cloudflare`, `cloudflare-ai` | `https://gateway.ai.cloudflare.com/v1` | Bearer |
| Groq | `groq` | `https://api.groq.com/openai/v1` | Bearer |
| Mistral | `mistral` | `https://api.mistral.ai/v1` | Bearer |
| xAI | `xai`, `grok` | `https://api.x.ai/v1` | Bearer |
| Qianfan | `qianfan`, `baidu` | `https://aip.baidubce.com` | Bearer |
| Synthetic | `synthetic` | `https://api.synthetic.com` | Bearer |
| OpenCode Zen | `opencode`, `opencode-zen` | `https://opencode.ai/zen/v1` | Bearer |
| LiteLLM | `litellm`, `lite-llm` | konfigurierbar | Bearer |
| vLLM | `vllm`, `v-llm` | konfigurierbar | Bearer |
| HuggingFace | `huggingface`, `hf` | konfigurierbar | Bearer |

## Konfigurationsreferenz

| Feld | Typ | Standard | Beschreibung |
|------|-----|----------|-------------|
| `api_key` | String | optional | API-Authentifizierungsschlüssel |
| `api_url` | String | erforderlich | Basis-URL des API-Endpunkts |
| `model` | String | erforderlich | Modellname/-ID |
| `auth_style` | String | `"bearer"` | Authentifizierungs-Header-Stil (siehe unten) |

### Authentifizierungsstile

| Stil | Header-Format | Verwendung |
|------|---------------|-------|
| `bearer` | `Authorization: Bearer <key>` | Die meisten Anbieter (Standard) |
| `x-api-key` | `x-api-key: <key>` | Einige chinesische Anbieter |
| `custom` | Benutzerdefinierter Header-Name | Spezialfälle |

## Funktionen

### Automatische Endpunkt-Erkennung

PRX hängt automatisch `/chat/completions` an Ihre Basis-URL an. Sie müssen den Endpunktpfad nicht einschließen:

```toml
# Correct - PRX appends /chat/completions
api_url = "https://api.groq.com/openai/v1"

# Also correct - explicit path works too
api_url = "https://api.groq.com/openai/v1/chat/completions"
```

### Responses API-Fallback

Für Anbieter, die OpenAIs neuere Responses API unterstützen, kann PRX auf `/v1/responses` zurückfallen, wenn `/v1/chat/completions` einen 404 zurückgibt. Dies ist standardmäßig aktiviert, kann aber für Anbieter deaktiviert werden, die es nicht unterstützen (z.B. GLM/Zhipu).

### Natives Tool Calling

Werkzeuge werden im Standard-Function-Calling-Format von OpenAI gesendet:

```json
{
  "type": "function",
  "function": {
    "name": "tool_name",
    "description": "Tool description",
    "parameters": { "type": "object", "properties": {...} }
  }
}
```

Der Anbieter unterstützt `tool_choice: "auto"` und deserialisiert strukturierte `tool_calls`-Antworten korrekt.

### Vision-Unterstützung

Für visionsfähige Modelle werden in Nachrichten eingebettete Bilder als `[IMAGE:data:image/png;base64,...]`-Marker automatisch in das OpenAI-Vision-Format mit `image_url`-Inhaltsblöcken konvertiert.

### Streaming-Unterstützung

Der kompatible Anbieter unterstützt SSE-Streaming für Echtzeit-Token-Zustellung. Stream-Ereignisse werden inkrementell geparst mit Unterstützung für:
- `delta.content`-Textblöcke
- `delta.tool_calls` für inkrementelle Werkzeugaufruf-Konstruktion
- `[DONE]`-Marker-Erkennung
- Ordnungsgemäße Timeout-Behandlung

### System-Nachrichten-Zusammenführung

Einige Anbieter (z.B. MiniMax) lehnen `role: system`-Nachrichten ab. PRX kann automatisch System-Nachrichteninhalt mit der ersten Benutzernachricht zusammenführen. Dies ist standardmäßig für bekannte inkompatible Anbieter aktiviert.

### HTTP/1.1-Erzwungener Modus

Einige Anbieter (insbesondere DashScope/Qwen) erfordern HTTP/1.1 statt HTTP/2. PRX erkennt diese Endpunkte automatisch und erzwingt HTTP/1.1 für Verbindungszuverlässigkeit.

### Reasoning-Content-Fallback

Für Reasoning-Modelle, die die Ausgabe in `reasoning_content` statt `content` zurückgeben, fällt PRX automatisch zurück, um den Reasoning-Text zu extrahieren.

## Erweiterte Konfiguration

### Lokaler LLM-Server (vLLM, llama.cpp usw.)

```toml
[default]
provider = "compatible"
model = "meta-llama/Llama-3.1-8B-Instruct"

[providers.compatible]
api_url = "http://localhost:8000/v1"
# No api_key needed for local servers
```

### LiteLLM-Proxy

```toml
[default]
provider = "litellm"
model = "gpt-4o"

[providers.litellm]
api_key = "${LITELLM_API_KEY}"
api_url = "http://localhost:4000"
```

### Mehrere benutzerdefinierte Anbieter

Verwenden Sie den Modell-Router, um mehrere kompatible Anbieter zu konfigurieren:

```toml
[default]
provider = "openrouter"
model = "anthropic/claude-sonnet-4"

[[model_routes]]
pattern = "groq/*"
provider = "compatible"
api_url = "https://api.groq.com/openai/v1"
api_key = "${GROQ_API_KEY}"

[[model_routes]]
pattern = "mistral/*"
provider = "compatible"
api_url = "https://api.mistral.ai/v1"
api_key = "${MISTRAL_API_KEY}"
```

## Fehlerbehebung

### Verbindung abgelehnt

Stellen Sie sicher, dass der API-Endpunkt erreichbar ist:
```bash
curl -v https://api.your-provider.com/v1/models
```

### 401 Unauthorized

- Überprüfen Sie, dass Ihr API-Schlüssel korrekt ist
- Prüfen Sie, ob der Authentifizierungsstil Ihrem Anbieter entspricht (Bearer vs x-api-key)
- Einige Anbieter erfordern zusätzliche Header; verwenden Sie einen benannten Anbieter-Alias, wenn verfügbar

### "role: system" abgelehnt

Wenn Ihr Anbieter System-Nachrichten nicht unterstützt, sollte PRX dies automatisch für bekannte Anbieter behandeln. Für benutzerdefinierte Endpunkte ist dies eine Anbieter-Einschränkung. Workaround: Systeminstruktionen in die erste Benutzernachricht einbinden.

### Streaming funktioniert nicht

Nicht alle OpenAI-kompatiblen APIs unterstützen Streaming. Wenn Streaming fehlschlägt, fällt PRX automatisch auf Nicht-Streaming-Modus zurück.

### Modell nicht gefunden

Überprüfen Sie den exakten Modellnamen/-ID, den Ihr Anbieter erwartet. Verschiedene Anbieter verwenden unterschiedliche Namenskonventionen:
- Groq: `llama-3.3-70b-versatile`
- Mistral: `mistral-large-latest`
- xAI: `grok-2`

Prüfen Sie die Dokumentation Ihres Anbieters für die korrekten Modell-Identifikatoren.
