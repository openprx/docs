---
title: LLM-Anbieter
description: Überblick über die 9+ LLM-Anbieter, die von PRX unterstützt werden, einschließlich Fähigkeitsmatrix, Konfiguration, Fallback-Ketten und Routing.
---

# LLM-Anbieter

PRX verbindet sich über **Anbieter** mit großen Sprachmodellen -- austauschbare Backends, die den `Provider`-Trait implementieren. Jeder Anbieter behandelt Authentifizierung, Anfrage-Formatierung, Streaming und Fehlerklassifizierung für eine bestimmte LLM-API.

PRX liefert 9 eingebaute Anbieter, einen OpenAI-kompatiblen Endpunkt für Drittanbieter-Dienste und Infrastruktur für Fallback-Ketten und intelligentes Routing.

## Fähigkeitsmatrix

| Anbieter | Schlüsselmodelle | Streaming | Vision | Werkzeugnutzung | OAuth | Selbstgehostet |
|----------|-----------|-----------|--------|----------|-------|-------------|
| [Anthropic](/de/prx/providers/anthropic) | Claude Opus 4, Claude Sonnet 4 | Ja | Ja | Ja | Ja (Claude Code) | Nein |
| [OpenAI](/de/prx/providers/openai) | GPT-4o, o1, o3 | Ja | Ja | Ja | Nein | Nein |
| [Google Gemini](/de/prx/providers/google-gemini) | Gemini 2.0 Flash, Gemini 1.5 Pro | Ja | Ja | Ja | Ja (Gemini CLI) | Nein |
| [OpenAI Codex](/de/prx/providers/openai-codex) | Codex-Modelle | Ja | Nein | Ja | Ja | Nein |
| [GitHub Copilot](/de/prx/providers/github-copilot) | Copilot Chat-Modelle | Ja | Nein | Ja | Ja (Device Flow) | Nein |
| [Ollama](/de/prx/providers/ollama) | Llama 3, Mistral, Qwen, jedes GGUF | Ja | Modellabhängig | Ja | Nein | Ja |
| [AWS Bedrock](/de/prx/providers/aws-bedrock) | Claude, Titan, Llama | Ja | Modellabhängig | Modellabhängig | AWS IAM | Nein |
| [GLM](/de/prx/providers/glm) | GLM-4, Zhipu, Minimax, Moonshot, Qwen, Z.AI | Ja | Modellabhängig | Modellabhängig | Ja (Minimax/Qwen) | Nein |
| [OpenRouter](/de/prx/providers/openrouter) | 200+ Modelle von mehreren Anbietern | Ja | Modellabhängig | Modellabhängig | Nein | Nein |
| [Custom Compatible](/de/prx/providers/custom-compatible) | Jede OpenAI-kompatible API | Ja | Endpunktabhängig | Endpunktabhängig | Nein | Ja |

## Schnellkonfiguration

Anbieter werden in `~/.config/openprx/config.toml` (oder `~/.openprx/config.toml`) konfiguriert. Setzen Sie mindestens den Standardanbieter und geben Sie einen API-Schlüssel an:

```toml
# Select the default provider and model
default_provider = "anthropic"
default_model = "anthropic/claude-sonnet-4-6"
default_temperature = 0.7

# API key (can also be set via ANTHROPIC_API_KEY env var)
api_key = "sk-ant-..."
```

Für selbstgehostete Anbieter wie Ollama geben Sie den Endpunkt an:

```toml
default_provider = "ollama"
default_model = "llama3:70b"
api_url = "http://localhost:11434"
```

Jeder Anbieter löst seinen API-Schlüssel in folgender Reihenfolge auf:

1. Das `api_key`-Feld in `config.toml`
2. Anbieterspezifische Umgebungsvariable (z.B. `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`)
3. Die generische `API_KEY`-Umgebungsvariable

Siehe [Umgebungsvariablen](/de/prx/config/environment) für die vollständige Liste unterstützter Variablen.

## Fallback-Ketten mit ReliableProvider

PRX umhüllt Anbieteraufrufe mit einer `ReliableProvider`-Schicht, die Folgendes bietet:

- **Automatische Wiederholung** mit exponentiellem Backoff für vorübergehende Fehler (5xx, 429 Ratenlimits, Netzwerk-Timeouts)
- **Fallback-Ketten** -- wenn der primäre Anbieter fehlschlägt, werden Anfragen automatisch an den nächsten Anbieter in der Kette weitergeleitet
- **Nicht-wiederholbare Fehlererkennung** -- Clientfehler wie ungültige API-Schlüssel (401/403) und unbekannte Modelle (404) schlagen sofort fehl, ohne Wiederholungen zu verschwenden

Konfigurieren Sie die Zuverlässigkeit im `[reliability]`-Abschnitt:

```toml
[reliability]
max_retries = 3
fallback_providers = ["openai", "gemini"]
```

Wenn der primäre Anbieter (z.B. Anthropic) einen vorübergehenden Fehler zurückgibt, wiederholt PRX bis zu `max_retries` Mal mit Backoff. Wenn alle Wiederholungen erschöpft sind, fällt er auf den ersten Fallback-Anbieter zurück. Die Fallback-Kette wird fortgesetzt, bis eine erfolgreiche Antwort vorliegt oder alle Anbieter erschöpft sind.

### Fehlerklassifizierung

Der ReliableProvider klassifiziert Fehler in zwei Kategorien:

- **Wiederholbar**: HTTP 5xx, 429 (Ratenlimit), 408 (Timeout), Netzwerkfehler
- **Nicht wiederholbar**: HTTP 4xx (außer 429/408), ungültige API-Schlüssel, unbekannte Modelle, fehlerhafte Antworten

Nicht wiederholbare Fehler überspringen Wiederholungen und fallen sofort auf den nächsten Anbieter zurück, um verschwendete Latenz zu vermeiden.

## Router-Integration

Für fortgeschrittene Multi-Modell-Setups unterstützt PRX einen heuristischen LLM-Router, der den optimalen Anbieter und das optimale Modell pro Anfrage auswählt, basierend auf:

- **Fähigkeitsbewertung** -- gleicht Abfragekomplexität mit Modellstärken ab
- **Elo-Rating** -- verfolgt die Modellleistung über die Zeit
- **Kostenoptimierung** -- bevorzugt günstigere Modelle für einfache Abfragen
- **Latenzgewichtung** -- berücksichtigt die Antwortzeit
- **KNN-Semantik-Routing** -- verwendet historische Abfrage-Embeddings für ähnlichkeitsbasiertes Routing
- **Automix-Eskalation** -- beginnt mit einem günstigen Modell und eskaliert zu einem Premium-Modell bei geringer Konfidenz

```toml
[router]
enabled = true
knn_enabled = true

[router.automix]
enabled = true
confidence_threshold = 0.7
premium_model_id = "anthropic/claude-sonnet-4-6"
```

Siehe [Router-Konfiguration](/de/prx/router/) für alle Details.

## Anbieterseiten

- [Anthropic (Claude)](/de/prx/providers/anthropic)
- [OpenAI](/de/prx/providers/openai)
- [Google Gemini](/de/prx/providers/google-gemini)
- [OpenAI Codex](/de/prx/providers/openai-codex)
- [GitHub Copilot](/de/prx/providers/github-copilot)
- [Ollama](/de/prx/providers/ollama)
- [AWS Bedrock](/de/prx/providers/aws-bedrock)
- [GLM (Zhipu / Minimax / Moonshot / Qwen / Z.AI)](/de/prx/providers/glm)
- [OpenRouter](/de/prx/providers/openrouter)
- [Custom Compatible Endpoint](/de/prx/providers/custom-compatible)
