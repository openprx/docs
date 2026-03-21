---
title: OpenAI
description: OpenAI als LLM-Anbieter in PRX konfigurieren
---

# OpenAI

> Zugriff auf GPT-Modelle über die OpenAI Chat Completions API mit nativem Function Calling, Vision und Unterstützung für Reasoning-Modelle.

## Voraussetzungen

- Ein OpenAI-API-Schlüssel von [platform.openai.com](https://platform.openai.com/)

## Schnelleinrichtung

### 1. API-Schlüssel erhalten

1. Registrieren Sie sich bei [platform.openai.com](https://platform.openai.com/)
2. Navigieren Sie zu **API Keys** in der linken Seitenleiste
3. Klicken Sie auf **Create new secret key** und kopieren Sie ihn (beginnt mit `sk-`)

### 2. Konfigurieren

```toml
[default]
provider = "openai"
model = "gpt-4o"

[providers.openai]
api_key = "${OPENAI_API_KEY}"
```

Oder setzen Sie die Umgebungsvariable:

```bash
export OPENAI_API_KEY="sk-..."
```

### 3. Überprüfen

```bash
prx doctor models
```

## Verfügbare Modelle

| Modell | Kontext | Vision | Werkzeugnutzung | Hinweise |
|--------|---------|--------|----------|-------|
| `gpt-4o` | 128K | Ja | Ja | Bestes Allzweck-Modell |
| `gpt-4o-mini` | 128K | Ja | Ja | Kleiner, schneller, günstiger |
| `gpt-4-turbo` | 128K | Ja | Ja | Vorherige Generation Flaggschiff |
| `o3` | 128K | Ja | Ja | Reasoning-Modell |
| `o4-mini` | 128K | Ja | Ja | Kleineres Reasoning-Modell |
| `gpt-4` | 8K | Nein | Ja | Original GPT-4 |

## Konfigurationsreferenz

| Feld | Typ | Standard | Beschreibung |
|------|-----|----------|-------------|
| `api_key` | String | erforderlich | OpenAI-API-Schlüssel (`sk-...`) |
| `api_url` | String | `https://api.openai.com/v1` | Benutzerdefinierte API-Basis-URL |
| `model` | String | `gpt-4o` | Standardmäßig zu verwendendes Modell |

## Funktionen

### Natives Function Calling

PRX sendet Werkzeuge im nativen OpenAI `function`-Format. Werkzeugdefinitionen umfassen `name`, `description` und `parameters` (JSON Schema). Der Anbieter unterstützt `tool_choice: "auto"` für automatische Werkzeugauswahl.

### Vision

Visionsfähige Modelle (GPT-4o, GPT-4o-mini) können Bilder analysieren, die im Gespräch enthalten sind. Bilder werden inline über das Standard-Nachrichtenformat gesendet.

### Reasoning-Modell-Unterstützung

Für Reasoning-Modelle (o1, o3, o4-mini) behandelt PRX automatisch den `reasoning_content`-Fallback. Wenn das Modell die Ausgabe in `reasoning_content` statt `content` zurückgibt, extrahiert PRX den Reasoning-Text transparent.

### Multi-Turn-Gespräche

Der vollständige Gesprächsverlauf wird beibehalten und an die API gesendet, einschließlich System-Prompts, Benutzernachrichten, Assistentenantworten und Werkzeugaufruf-/Ergebnispaaren im nativen strukturierten Format von OpenAI.

### Benutzerdefinierte Basis-URL

Für die Nutzung eines Proxys, Azure OpenAI oder eines OpenAI-kompatiblen Endpunkts:

```toml
[providers.openai]
api_key = "${OPENAI_API_KEY}"
api_url = "https://my-proxy.example.com/v1"
```

### Verbindungsaufwärmung

Beim Start sendet PRX eine leichtgewichtige `GET /models`-Anfrage, um TLS und HTTP/2-Verbindungspooling aufzubauen und die Latenz bei der ersten echten Anfrage zu reduzieren.

## Fehlerbehebung

### "OpenAI API key not set"

Setzen Sie die Umgebungsvariable `OPENAI_API_KEY` oder fügen Sie `api_key` zu `[providers.openai]` in Ihrer `config.toml` hinzu.

### 429 Rate Limit

OpenAI erzwingt Token- und Anfragelimits pro Minute. Lösungen:
- Warten und wiederholen (PRX behandelt dies automatisch mit dem Reliable-Provider-Wrapper)
- OpenAI-Plan upgraden für höhere Ratenlimits
- `fallback_providers` verwenden, um bei Ratenbegrenzung auf einen anderen Anbieter auszuweichen

### Leere Antwort von Reasoning-Modellen

Wenn Sie o1/o3/o4-mini verwenden und leere Antworten erhalten, ist dies erwartetes Verhalten, wenn die Ausgabe des Modells vollständig in `reasoning_content` liegt. PRX fällt automatisch auf `reasoning_content` zurück, wenn `content` leer ist.
