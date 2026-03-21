---
title: OpenRouter
description: OpenRouter als LLM-Anbieter in PRX konfigurieren
---

# OpenRouter

> Zugriff auf 200+ Modelle von mehreren Anbietern (OpenAI, Anthropic, Google, Meta, Mistral und mehr) über einen einzigen API-Schlüssel und eine vereinheitlichte Schnittstelle.

## Voraussetzungen

- Ein OpenRouter-API-Schlüssel von [openrouter.ai](https://openrouter.ai/)

## Schnelleinrichtung

### 1. API-Schlüssel erhalten

1. Registrieren Sie sich bei [openrouter.ai](https://openrouter.ai/)
2. Gehen Sie zu **Keys** in Ihrem Dashboard
3. Klicken Sie auf **Create Key** und kopieren Sie ihn (beginnt mit `sk-or-`)

### 2. Konfigurieren

```toml
[default]
provider = "openrouter"
model = "anthropic/claude-sonnet-4"

[providers.openrouter]
api_key = "${OPENROUTER_API_KEY}"
```

Oder setzen Sie die Umgebungsvariable:

```bash
export OPENROUTER_API_KEY="sk-or-..."
```

### 3. Überprüfen

```bash
prx doctor models
```

## Verfügbare Modelle

OpenRouter bietet Zugriff auf Hunderte von Modellen. Einige beliebte Optionen:

| Modell | Anbieter | Kontext | Vision | Werkzeugnutzung | Hinweise |
|--------|----------|---------|--------|----------|-------|
| `anthropic/claude-sonnet-4` | Anthropic | 200K | Ja | Ja | Claude Sonnet 4 |
| `anthropic/claude-opus-4` | Anthropic | 200K | Ja | Ja | Claude Opus 4 |
| `openai/gpt-4o` | OpenAI | 128K | Ja | Ja | GPT-4o |
| `openai/o3` | OpenAI | 128K | Ja | Ja | Reasoning-Modell |
| `google/gemini-2.5-pro` | Google | 1M | Ja | Ja | Gemini Pro |
| `google/gemini-2.5-flash` | Google | 1M | Ja | Ja | Gemini Flash |
| `meta-llama/llama-3.1-405b-instruct` | Meta | 128K | Nein | Ja | Größtes offenes Modell |
| `deepseek/deepseek-chat` | DeepSeek | 128K | Nein | Ja | DeepSeek V3 |
| `mistralai/mistral-large` | Mistral | 128K | Nein | Ja | Mistral Large |
| `x-ai/grok-2` | xAI | 128K | Nein | Ja | Grok 2 |

Die vollständige Modellliste finden Sie unter [openrouter.ai/models](https://openrouter.ai/models).

## Konfigurationsreferenz

| Feld | Typ | Standard | Beschreibung |
|------|-----|----------|-------------|
| `api_key` | String | erforderlich | OpenRouter-API-Schlüssel (`sk-or-...`) |
| `model` | String | erforderlich | Modell-ID im `provider/model`-Format |

## Funktionen

### Vereinheitlichter Multi-Anbieter-Zugriff

Mit einem einzigen OpenRouter-API-Schlüssel können Sie auf Modelle von OpenAI, Anthropic, Google, Meta, Mistral, Cohere und vielen weiteren zugreifen. Dies macht die Verwaltung mehrerer API-Schlüssel überflüssig.

### OpenAI-kompatible API

OpenRouter stellt eine OpenAI-kompatible Chat Completions API unter `https://openrouter.ai/api/v1/chat/completions` bereit. PRX sendet Anfragen mit:

- `Authorization: Bearer <key>` für die Authentifizierung
- `HTTP-Referer: https://github.com/theonlyhennygod/openprx` für die App-Identifikation
- `X-Title: OpenPRX` für die App-Namens-Zuordnung

### Natives Tool Calling

Werkzeuge werden im nativen Function-Calling-Format von OpenAI gesendet. Der Anbieter unterstützt `tool_choice: "auto"` und behandelt strukturierte Werkzeugaufruf-Antworten korrekt, einschließlich `tool_call_id`-Zuordnung für Multi-Turn-Werkzeuginteraktionen.

### Multi-Turn-Gesprächsverlauf

Der vollständige Gesprächsverlauf wird mit korrekter strukturierter Formatierung beibehalten:
- Assistentnachrichten mit Werkzeugaufrufen werden mit `tool_calls`-Arrays serialisiert
- Werkzeugergebnis-Nachrichten enthalten `tool_call_id`-Referenzen
- System-, Benutzer- und Assistentnachrichten werden direkt durchgereicht

### Verbindungsaufwärmung

Beim Start sendet PRX eine leichtgewichtige Anfrage an `https://openrouter.ai/api/v1/auth/key`, um den API-Schlüssel zu verifizieren und TLS/HTTP2-Verbindungspooling aufzubauen.

### Modell-Routing

OpenRouter unterstützt Modell-Routing und Fallback auf API-Ebene. Sie können auch PRXs eingebaute `fallback_providers` für clientseitiges Fallback verwenden:

```toml
[default]
provider = "openrouter"
model = "anthropic/claude-sonnet-4"

[reliability]
fallback_providers = ["openai"]
```

## Standardanbieter

OpenRouter ist PRXs Standardanbieter. Wenn kein `provider` in Ihrer Konfiguration angegeben ist, verwendet PRX standardmäßig OpenRouter.

## Fehlerbehebung

### "OpenRouter API key not set"

Setzen Sie die Umgebungsvariable `OPENROUTER_API_KEY` oder fügen Sie `api_key` unter `[providers.openrouter]` in Ihrer `config.toml` hinzu. Sie können auch `prx onboard` für die interaktive Einrichtung ausführen.

### 402 Payment Required

Ihr OpenRouter-Konto hat unzureichendes Guthaben. Laden Sie Guthaben unter [openrouter.ai/credits](https://openrouter.ai/credits) auf.

### Modellspezifische Fehler

Verschiedene Modelle auf OpenRouter haben unterschiedliche Fähigkeiten und Ratenlimits. Wenn ein bestimmtes Modell Fehler zurückgibt:
- Prüfen Sie, ob das Modell Tool Calling unterstützt (nicht alle tun das)
- Überprüfen Sie, ob das Modell nicht auf OpenRouter veraltet ist
- Versuchen Sie eine andere Modellvariante

### Langsame Antworten

OpenRouter leitet an den zugrunde liegenden Anbieter weiter. Die Antwortzeit hängt ab von:
- Der aktuellen Auslastung des Modellanbieters
- Ihrer geografischen Entfernung zum Anbieter
- Der Modellgröße und Kontextlänge

Erwägen Sie die Verwendung von `fallback_providers`, um bei Langsamkeit von OpenRouter auf eine direkte Anbieterverbindung auszuweichen.

### Ratenbegrenzung

OpenRouter hat eigene Ratenlimits zusätzlich zu den Limits des zugrunde liegenden Anbieters. Bei Ratenbegrenzung:
- Prüfen Sie Ihre Nutzung unter [openrouter.ai/usage](https://openrouter.ai/usage)
- Upgraden Sie Ihren Plan für höhere Limits
- Verwenden Sie PRXs Reliable-Provider-Wrapper für automatische Wiederholung mit Backoff
