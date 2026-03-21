---
title: Ollama
description: Ollama als LLM-Anbieter in PRX für lokale und selbstgehostete LLM-Inferenz konfigurieren
---

# Ollama

> LLMs lokal oder auf selbstgehosteter Infrastruktur mit Ollama betreiben. Unterstützt Vision, natives Tool Calling, Reasoning-Modelle und optionales Cloud-Routing über Ollama Cloud.

## Voraussetzungen

- [Ollama](https://ollama.com/) installiert und lokal laufend, **oder**
- Eine entfernte Ollama-Instanz mit Netzwerkzugriff

## Schnelleinrichtung

### 1. Ollama installieren

```bash
# macOS
brew install ollama

# Linux
curl -fsSL https://ollama.com/install.sh | sh

# Start the server
ollama serve
```

### 2. Ein Modell herunterladen

```bash
ollama pull qwen3
```

### 3. Konfigurieren

```toml
[default]
provider = "ollama"
model = "qwen3"
```

Für die lokale Nutzung ist kein API-Schlüssel erforderlich.

### 4. Überprüfen

```bash
prx doctor models
```

## Verfügbare Modelle

Jedes über Ollama verfügbare Modell kann verwendet werden. Beliebte Optionen:

| Modell | Parameter | Vision | Werkzeugnutzung | Hinweise |
|--------|-----------|--------|----------|-------|
| `qwen3` | 8B | Nein | Ja | Hervorragendes mehrsprachiges Coding-Modell |
| `qwen2.5-coder` | 7B | Nein | Ja | Spezialisiert auf Code |
| `llama3.1` | 8B/70B/405B | Nein | Ja | Metas offene Modellfamilie |
| `mistral-nemo` | 12B | Nein | Ja | Effizientes Reasoning |
| `deepseek-r1` | 7B/14B/32B | Nein | Ja | Reasoning-Modell |
| `llava` | 7B/13B | Ja | Nein | Vision + Sprache |
| `gemma2` | 9B/27B | Nein | Ja | Googles offenes Modell |
| `codellama` | 7B/13B/34B | Nein | Nein | Code-spezialisiertes Llama |

Führen Sie `ollama list` aus, um Ihre installierten Modelle zu sehen.

## Konfigurationsreferenz

| Feld | Typ | Standard | Beschreibung |
|------|-----|----------|-------------|
| `api_key` | String | optional | API-Schlüssel für entfernte/Cloud-Ollama-Instanzen |
| `api_url` | String | `http://localhost:11434` | Ollama-Server-Basis-URL |
| `model` | String | erforderlich | Modellname (z.B. `qwen3`, `llama3.1:70b`) |
| `reasoning` | bool | optional | `think`-Modus für Reasoning-Modelle aktivieren |

## Funktionen

### Zero-Config für lokale Nutzung

Beim lokalen Betrieb von Ollama ist kein API-Schlüssel oder spezielle Konfiguration nötig. PRX verbindet sich automatisch mit `http://localhost:11434`.

### Natives Tool Calling

PRX nutzt Ollamas nativen `/api/chat`-Tool-Calling-Support. Werkzeugdefinitionen werden im Anfragekörper gesendet und strukturierte `tool_calls` werden von kompatiblen Modellen zurückgegeben (qwen2.5, llama3.1, mistral-nemo usw.).

PRX behandelt auch eigenwillige Modellverhaltensweisen:
- **Verschachtelte Werkzeugaufrufe**: `{"name": "tool_call", "arguments": {"name": "shell", ...}}` werden automatisch ausgepackt
- **Präfixierte Namen**: `tool.shell` wird zu `shell` normalisiert
- **Werkzeugergebnis-Zuordnung**: Werkzeugaufruf-IDs werden verfolgt und `tool_name`-Feldern in Folge-Werkzeugergebnis-Nachrichten zugeordnet

### Vision-Unterstützung

Visionsfähige Modelle (z.B. LLaVA) empfangen Bilder über Ollamas natives `images`-Feld. PRX extrahiert automatisch base64-Bilddaten aus `[IMAGE:...]`-Markern und sendet sie als separate Bildeinträge.

### Reasoning-Modus

Für Reasoning-Modelle (QwQ, DeepSeek-R1 usw.) aktivieren Sie den `think`-Parameter:

```toml
[providers.ollama]
reasoning = true
```

Dies sendet `"think": true` in der Anfrage und aktiviert den internen Reasoning-Prozess des Modells. Wenn das Modell nur ein `thinking`-Feld mit leerem Inhalt zurückgibt, bietet PRX eine angemessene Fallback-Nachricht.

### Entfernte und Cloud-Instanzen

Um sich mit einem entfernten Ollama-Server zu verbinden:

```toml
[providers.ollama]
api_url = "https://my-ollama-server.example.com:11434"
api_key = "${OLLAMA_API_KEY}"
```

Die Authentifizierung wird nur für nicht-lokale Endpunkte gesendet (wenn der Host nicht `localhost`, `127.0.0.1` oder `::1` ist).

### Cloud-Routing

Hängen Sie `:cloud` an einen Modellnamen an, um das Routing über eine entfernte Ollama-Instanz zu erzwingen:

```bash
prx chat --model "qwen3:cloud"
```

Cloud-Routing erfordert:
- Eine nicht-lokale `api_url`
- Einen konfigurierten `api_key`

### Erweitertes Timeout

Ollama-Anfragen verwenden ein 300-Sekunden-Timeout (im Vergleich zu 120 Sekunden für Cloud-Anbieter), um die potenziell langsamere Inferenz auf lokaler Hardware zu berücksichtigen.

## Fehlerbehebung

### "Is Ollama running?"

Der häufigste Fehler. Lösungen:
- Server starten: `ollama serve`
- Prüfen, ob der Port erreichbar ist: `curl http://localhost:11434`
- Wenn ein benutzerdefinierter Port verwendet wird, `api_url` in der Konfiguration aktualisieren

### Modell nicht gefunden

Laden Sie das Modell zuerst herunter:
```bash
ollama pull qwen3
```

### Leere Antworten

Einige Reasoning-Modelle geben möglicherweise nur `thinking`-Inhalt ohne eine endgültige Antwort zurück. Dies bedeutet normalerweise, dass das Modell vorzeitig gestoppt hat. Versuchen Sie:
- Die Anfrage erneut senden
- Ein anderes Modell verwenden
- Den Reasoning-Modus deaktivieren, wenn das Modell ihn nicht gut unterstützt

### Werkzeugaufrufe funktionieren nicht

Nicht alle Ollama-Modelle unterstützen Tool Calling. Modelle, die gut funktionieren:
- `qwen2.5` / `qwen3`
- `llama3.1`
- `mistral-nemo`
- `command-r`

### Cloud-Routing-Fehler

- "requested cloud routing, but Ollama endpoint is local": `api_url` auf einen entfernten Server setzen
- "requested cloud routing, but no API key is configured": `api_key` oder `OLLAMA_API_KEY` setzen
