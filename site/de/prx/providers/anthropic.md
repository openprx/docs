---
title: Anthropic
description: Anthropic Claude als LLM-Anbieter in PRX konfigurieren
---

# Anthropic

> Zugriff auf Claude-Modelle (Opus, Sonnet, Haiku) über die Anthropic Messages API mit nativer Werkzeugnutzung, Vision, Prompt-Caching und OAuth-Token-Auto-Refresh.

## Voraussetzungen

- Ein Anthropic-API-Schlüssel von [console.anthropic.com](https://console.anthropic.com/), **oder**
- Ein Claude Code OAuth-Token (automatisch erkannt aus `~/.claude/.credentials.json`)

## Schnelleinrichtung

### 1. API-Schlüssel erhalten

1. Registrieren Sie sich bei [console.anthropic.com](https://console.anthropic.com/)
2. Navigieren Sie zu **API Keys** im Dashboard
3. Klicken Sie auf **Create Key** und kopieren Sie den Schlüssel (beginnt mit `sk-ant-`)

### 2. Konfigurieren

```toml
[default]
provider = "anthropic"
model = "claude-sonnet-4-20250514"

[providers.anthropic]
api_key = "${ANTHROPIC_API_KEY}"
```

Oder setzen Sie die Umgebungsvariable:

```bash
export ANTHROPIC_API_KEY="sk-ant-..."
```

### 3. Überprüfen

```bash
prx doctor models
```

## Verfügbare Modelle

| Modell | Kontext | Vision | Werkzeugnutzung | Hinweise |
|--------|---------|--------|----------|-------|
| `claude-opus-4-20250514` | 200K | Ja | Ja | Leistungsfähigstes, am besten für komplexe Schlussfolgerungen |
| `claude-sonnet-4-20250514` | 200K | Ja | Ja | Beste Balance zwischen Geschwindigkeit und Fähigkeit |
| `claude-haiku-3-5-20241022` | 200K | Ja | Ja | Schnellstes, kosteneffektivstes |
| `claude-sonnet-4-6` | 200K | Ja | Ja | Neueste Sonnet-Version |
| `claude-opus-4-6` | 200K | Ja | Ja | Neueste Opus-Version |

## Konfigurationsreferenz

| Feld | Typ | Standard | Beschreibung |
|------|-----|----------|-------------|
| `api_key` | String | erforderlich | Anthropic-API-Schlüssel (`sk-ant-...`) oder OAuth-Token |
| `api_url` | String | `https://api.anthropic.com` | Benutzerdefinierte API-Basis-URL (für Proxys) |
| `model` | String | `claude-sonnet-4-20250514` | Standardmäßig zu verwendendes Modell |

## Funktionen

### Natives Tool Calling

PRX sendet Werkzeugdefinitionen im nativen Anthropic-Format mit `input_schema`, wodurch verlustbehaftete OpenAI-zu-Anthropic-Formatkonvertierung vermieden wird. Werkzeugergebnisse werden korrekt als `tool_result`-Inhaltsblöcke verpackt.

### Vision (Bildanalyse)

In Nachrichten eingebettete Bilder als `[IMAGE:data:image/png;base64,...]`-Marker werden automatisch in Anthropics native `image`-Inhaltsblöcke mit korrektem `media_type` und `source_type` konvertiert. Bilder bis zu 20 MB werden unterstützt (eine Warnung wird bei Payloads über dieser Größe protokolliert).

### Prompt-Caching

PRX wendet automatisch Anthropics ephemeres Prompt-Caching an, um Kosten und Latenz zu reduzieren:

- **System-Prompts** größer als ~1024 Tokens (3 KB) erhalten einen `cache_control`-Block
- **Gespräche** mit mehr als 4 Nicht-System-Nachrichten haben die letzte Nachricht gecacht
- **Werkzeugdefinitionen** haben das letzte Werkzeug mit `cache_control: ephemeral` markiert

Keine Konfiguration erforderlich; Caching wird transparent angewendet.

### OAuth-Token-Auto-Refresh

Bei Verwendung von Claude Code-Anmeldedaten führt PRX automatisch folgende Schritte durch:

1. Erkennt gecachte OAuth-Tokens aus `~/.claude/.credentials.json`
2. Erneuert Tokens proaktiv 90 Sekunden vor Ablauf
3. Wiederholt bei 401-Antworten mit einem frischen Token
4. Speichert erneuerte Anmeldedaten zurück auf die Festplatte

Das bedeutet, dass `prx` eine bestehende Claude Code-Anmeldung ohne zusätzliche Konfiguration nutzen kann.

### Claude Code-Integration

PRX erkennt folgende Anthropic-Authentifizierungsquellen:

| Quelle | Erkennung |
|--------|-----------|
| Direkter API-Schlüssel | `sk-ant-api-...`-Präfix, gesendet über `x-api-key`-Header |
| OAuth-Setup-Token | `sk-ant-oat01-...`-Präfix, gesendet über `Authorization: Bearer` mit `anthropic-beta`-Header |
| Claude Code gecachte Anmeldedaten | `~/.claude/.credentials.json` mit `access_token` + `refresh_token` |
| Umgebungsvariable | `ANTHROPIC_API_KEY` |

### Benutzerdefinierte Basis-URL

Um über einen Proxy oder alternativen Endpunkt zu routen:

```toml
[providers.anthropic]
api_key = "${ANTHROPIC_API_KEY}"
api_url = "https://my-proxy.example.com"
```

## Anbieter-Aliase

Die folgenden Namen werden alle zum Anthropic-Anbieter aufgelöst:

- `anthropic`
- `claude-code`
- `claude-cli`

## Fehlerbehebung

### "Anthropic credentials not set"

PRX konnte keine Authentifizierung finden. Stellen Sie sicher, dass eine der folgenden Optionen konfiguriert ist:

1. `ANTHROPIC_API_KEY`-Umgebungsvariable
2. `api_key` in `config.toml` unter `[providers.anthropic]`
3. Eine gültige `~/.claude/.credentials.json` von Claude Code

### 401 Unauthorized

- **API-Schlüssel**: Überprüfen Sie, dass er mit `sk-ant-api-` beginnt und nicht abgelaufen ist
- **OAuth-Token**: Führen Sie `prx auth login --provider anthropic` zur Neuauthentifizierung aus, oder starten Sie Claude Code neu, um das Token zu erneuern
- **Proxy-Problem**: Wenn Sie eine benutzerdefinierte `api_url` verwenden, bestätigen Sie, dass der Proxy den `x-api-key`- oder `Authorization`-Header korrekt weiterleitet

### Bild-Payload zu groß

Anthropic empfiehlt Bilder unter 20 MB in base64-kodierter Form. Verkleinern oder komprimieren Sie große Bilder vor dem Senden.

### Prompt-Caching funktioniert nicht

Caching ist automatisch, erfordert aber:
- System-Prompt > 3 KB, um System-Level-Caching auszulösen
- Mehr als 4 Nicht-System-Nachrichten, um Gesprächs-Caching auszulösen
- API-Version `2023-06-01` (automatisch von PRX gesetzt)
