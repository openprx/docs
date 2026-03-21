---
title: OpenAI Codex
description: OpenAI Codex (GitHub Copilot OAuth2-Flow) als LLM-Anbieter in PRX konfigurieren
---

# OpenAI Codex

> Zugriff auf OpenAIs Codex-Modelle über die ChatGPT Responses API unter Verwendung des GitHub Copilot OAuth2-Authentifizierungsflows. Bietet Zugriff auf GPT-5.x Codex-Modelle mit Reasoning-Fähigkeiten und nativem Tool Calling.

## Voraussetzungen

- Ein ChatGPT Plus-, Team- oder Enterprise-Abonnement
- Ein vorhandenes Codex CLI oder GitHub Copilot OAuth2-Token, **oder** Bereitschaft, den `prx auth login`-Flow auszuführen

## Schnelleinrichtung

### 1. Authentifizieren

```bash
prx auth login --provider openai-codex
```

Dies initiiert den GitHub OAuth Device Flow und speichert Tokens in `~/.openprx/`.

### 2. Konfigurieren

```toml
[default]
provider = "openai-codex"
model = "gpt-5.3-codex"
```

### 3. Überprüfen

```bash
prx doctor models
```

## Verfügbare Modelle

| Modell | Kontext | Vision | Werkzeugnutzung | Hinweise |
|--------|---------|--------|----------|-------|
| `gpt-5.3-codex` | 128K | Ja | Ja | Neuestes Codex-Modell, höchste Fähigkeit |
| `gpt-5.2-codex` | 128K | Ja | Ja | Vorherige Generation Codex |
| `gpt-5.1-codex` | 128K | Ja | Ja | Stabile Codex-Version |
| `gpt-5.1-codex-mini` | 128K | Ja | Ja | Kleinere, schnellere Codex-Variante |
| `gpt-5-codex` | 128K | Ja | Ja | Erste Generation Codex 5 |
| `o3` | 128K | Ja | Ja | OpenAI Reasoning-Modell |
| `o4-mini` | 128K | Ja | Ja | Kleineres Reasoning-Modell |

## Konfigurationsreferenz

| Feld | Typ | Standard | Beschreibung |
|------|-----|----------|-------------|
| `model` | String | `gpt-5.3-codex` | Standard-Codex-Modell |

In der Konfiguration ist kein API-Schlüssel nötig. Die Authentifizierung wird über den in `~/.openprx/` gespeicherten OAuth-Flow behandelt.

## Funktionen

### Responses API

Im Gegensatz zum Standard-OpenAI-Anbieter, der die Chat Completions API verwendet, nutzt der Codex-Anbieter die neuere Responses API (`/codex/responses`) mit:

- SSE-Streaming mit Echtzeit-Delta-Text-Ereignissen
- Strukturierte `function_call`-Ausgabeelemente für Werkzeugnutzung
- Reasoning-Effort-Steuerung (`minimal` / `low` / `medium` / `high` / `xhigh`)
- Reasoning-Zusammenfassungen in Antwort-Metadaten

### Automatischer Reasoning-Effort

PRX passt den Reasoning-Effort automatisch basierend auf dem Modell an:

| Modell | `minimal` | `xhigh` |
|--------|-----------|---------|
| `gpt-5.2-codex` / `gpt-5.3-codex` | Begrenzt auf `low` | Erlaubt |
| `gpt-5.1` | Erlaubt | Begrenzt auf `high` |
| `gpt-5.1-codex-mini` | Begrenzt auf `medium` | Begrenzt auf `high` |

Überschreiben Sie mit der Umgebungsvariable `ZEROCLAW_CODEX_REASONING_EFFORT`.

### Natives Tool Calling

Werkzeugdefinitionen werden im Responses-API-Format mit `type: "function"`, `name`, `description` und `parameters` gesendet. Werkzeugnamen mit Punkten (z.B. `email.execute`) werden automatisch in Unterstriche umgewandelt (`email_execute`) mit einer umgekehrten Zuordnung, um Originalnamen in Ergebnissen wiederherzustellen.

### OAuth2-Token-Verwaltung

PRX verwaltet den vollständigen OAuth2-Lebenszyklus:

1. **Login**: `prx auth login --provider openai-codex` initiiert den Device-Code-Flow
2. **Token-Speicherung**: Tokens werden verschlüsselt in `~/.openprx/` gespeichert
3. **Auto-Refresh**: Abgelaufene Zugriffstoken werden automatisch mit dem gespeicherten Refresh-Token erneuert
4. **Codex CLI-Import**: Wenn Sie eine vorhandene Codex CLI-Installation haben, kann PRX dessen Tokens automatisch importieren

### Stream-Behandlung

Der Anbieter behandelt SSE-Streams mit:
- Idle-Timeout (45 Sekunden standardmäßig, konfigurierbar über `ZEROCLAW_CODEX_STREAM_IDLE_TIMEOUT_SECS`)
- Maximale Antwortgröße (4 MB)
- Ordnungsgemäße Behandlung von `[DONE]`-Markern und terminalen Antwortereignissen
- Automatische Content-Type-Erkennung (SSE vs JSON)

## Umgebungsvariablen

| Variable | Beschreibung |
|----------|-------------|
| `ZEROCLAW_CODEX_REASONING_EFFORT` | Reasoning-Effort überschreiben (`minimal` / `low` / `medium` / `high` / `xhigh`) |
| `ZEROCLAW_CODEX_STREAM_IDLE_TIMEOUT_SECS` | Stream-Idle-Timeout in Sekunden (Standard: 45, Minimum: 5) |

## Fehlerbehebung

### "OpenAI Codex auth profile not found"

Führen Sie `prx auth login --provider openai-codex` zur Authentifizierung aus. Dies erfordert ein ChatGPT-Abonnement.

### "OpenAI Codex account id not found"

Das JWT-Token enthält keine Konto-ID. Authentifizieren Sie sich erneut mit `prx auth login --provider openai-codex`.

### Stream-Timeout-Fehler

Wenn Sie `provider_response_timeout kind=stream_idle_timeout` sehen, braucht das Modell zu lange für eine Antwort. Optionen:
- Timeout erhöhen: `export ZEROCLAW_CODEX_STREAM_IDLE_TIMEOUT_SECS=120`
- Ein schnelleres Modell wie `gpt-5.1-codex-mini` verwenden

### "payload_too_large"-Fehler

Die Antwort hat 4 MB überschritten. Dies deutet normalerweise auf eine ungewöhnlich große Modellantwort hin. Versuchen Sie, Ihre Anfrage in kleinere Teile aufzuteilen.
