---
title: Medien-Werkzeuge
description: Bildverarbeitung, Screenshots, Text-to-Speech und Canvas-Rendering-Werkzeuge fur visuelle und Audio-Inhaltsgenerierung.
---

# Medien-Werkzeuge

PRX enthalt funf medienbezogene Werkzeuge, die Bildverarbeitung, Bildschirmaufnahme, Text-to-Speech-Synthese und strukturiertes Inhalts-Rendering umfassen. Diese Werkzeuge ermoglichen es Agenten, mit visuellem und Audio-Inhalt zu arbeiten -- Bilder in der Grosse andern, Screenshots fur visuelles Reasoning aufnehmen, Sprachnachrichten generieren und Diagramme und Grafiken rendern.

Medien-Werkzeuge sind auf zwei Kategorien in der Werkzeug-Registry verteilt. Die Vision-Werkzeuge (`image`, `image_info`, `screenshot`) sind immer in `all_tools()` registriert. Die Rendering-Werkzeuge (`tts`, `canvas`) werden registriert, wenn ein Kanal aktiv ist bzw. bedingungslos.

Zusammen geben diese Werkzeuge PRX-Agenten multimodale Ausgabefahigkeiten und erlauben ihnen, Bilder, Audio und visuelle Artefakte neben Textantworten zu produzieren.

## Konfiguration

Medien-Werkzeuge haben minimale Konfiguration. Die meisten Einstellungen werden auf Kanalebene (fur die Zustellung) oder uber den LLM-Anbieter (fur Vision-Modellfahigkeiten) gesteuert:

```toml
# Browser-Konfiguration beeinflusst Screenshot-Fahigkeiten
[browser]
enabled = true
backend = "rust_native"

# Kanal-Konfiguration beeinflusst TTS-Zustellung
[channels_config.telegram]
bot_token = "..."
stream_mode = "partial"

# Kein eigener Medien-Werkzeug-Konfigurationsabschnitt
# Vision-Werkzeuge sind immer in all_tools() verfugbar
```

## Werkzeug-Referenz

### image

Verarbeitet und transformiert Bilder. Unterstutzt Grossenanderung, Zuschnitt und Formatkonvertierung.

**Bild in der Grosse andern:**

```json
{
  "name": "image",
  "arguments": {
    "action": "resize",
    "path": "/home/user/photo.png",
    "width": 800,
    "height": 600
  }
}
```

**Bild zuschneiden:**

```json
{
  "name": "image",
  "arguments": {
    "action": "crop",
    "path": "/home/user/photo.png",
    "x": 100,
    "y": 50,
    "width": 400,
    "height": 300
  }
}
```

**Format konvertieren:**

```json
{
  "name": "image",
  "arguments": {
    "action": "convert",
    "path": "/home/user/photo.png",
    "format": "jpeg",
    "output": "/home/user/photo.jpg"
  }
}
```

| Parameter | Typ | Erforderlich | Standard | Beschreibung |
|-----------|-----|-------------|----------|-------------|
| `action` | `string` | Ja | -- | Operation: `"resize"`, `"crop"`, `"convert"` |
| `path` | `string` | Ja | -- | Pfad zur Quellbilddatei |
| `width` | `integer` | Bedingt | -- | Zielbreite (fur Grossenanderung und Zuschnitt) |
| `height` | `integer` | Bedingt | -- | Zielhohe (fur Grossenanderung und Zuschnitt) |
| `x` | `integer` | Bedingt | -- | X-Offset fur Zuschnittursprung |
| `y` | `integer` | Bedingt | -- | Y-Offset fur Zuschnittursprung |
| `format` | `string` | Bedingt | -- | Zielformat fur Konvertierung: `"png"`, `"jpeg"`, `"webp"`, `"gif"` |
| `output` | `string` | Nein | Uberschreibt Quelle | Ausgabedateipfad |

### image_info

Extrahiert Metadaten und Abmessungen aus Bilddateien, ohne sie zu modifizieren.

```json
{
  "name": "image_info",
  "arguments": {
    "path": "/home/user/photo.png"
  }
}
```

| Parameter | Typ | Erforderlich | Standard | Beschreibung |
|-----------|-----|-------------|----------|-------------|
| `path` | `string` | Ja | -- | Pfad zur Bilddatei |

**Gibt Informationen zuruck einschliesslich:**

| Feld | Beschreibung |
|------|-------------|
| Breite | Bildbreite in Pixeln |
| Hohe | Bildhohe in Pixeln |
| Format | Bildformat (PNG, JPEG, WebP usw.) |
| Farbraum | RGB, RGBA, Graustufen usw. |
| Dateigrosse | Grosse auf der Festplatte |
| DPI | Auflosung (falls in Metadaten verfugbar) |

### screenshot

Nimmt Screenshots des aktuellen Bildschirms oder bestimmter Fenster auf. Nutzlich fur visuelle Reasoning-Aufgaben, bei denen der Agent den aktuellen Zustand des Desktops oder einer Anwendung beobachten muss.

```json
{
  "name": "screenshot",
  "arguments": {
    "target": "screen"
  }
}
```

```json
{
  "name": "screenshot",
  "arguments": {
    "target": "window",
    "window_name": "Firefox"
  }
}
```

| Parameter | Typ | Erforderlich | Standard | Beschreibung |
|-----------|-----|-------------|----------|-------------|
| `target` | `string` | Nein | `"screen"` | Was aufgenommen werden soll: `"screen"` (gesamter Bildschirm) oder `"window"` (bestimmtes Fenster) |
| `window_name` | `string` | Bedingt | -- | Fenstertitel zum Aufnehmen (erforderlich wenn `target = "window"`) |
| `output` | `string` | Nein | Automatisch generierter Temp-Pfad | Ausgabedateipfad fur den Screenshot |

Screenshots werden als PNG-Dateien gespeichert. Bei Verwendung mit visionfahigen LLMs (GPT-4o, Claude Sonnet usw.) kann der Screenshot in die nachste Nachricht fur visuelle Analyse eingebunden werden.

### tts

Text-to-Speech-Synthese. Konvertiert Text in eine Audiodatei und sendet sie als Sprachnachricht an die aktuelle Konversation. Das Werkzeug ubernimmt die MP3-Generierung, optionale M4A-Konvertierung und Zustellung uber den aktiven Kanal.

```json
{
  "name": "tts",
  "arguments": {
    "text": "Good morning! Here is your daily briefing. Three tasks are due today."
  }
}
```

| Parameter | Typ | Erforderlich | Standard | Beschreibung |
|-----------|-----|-------------|----------|-------------|
| `text` | `string` | Ja | -- | Der in Sprache umzuwandelnde Text |
| `language` | `string` | Nein | `"en"` | Sprachcode fur die Sprachsynthese |
| `voice` | `string` | Nein | Anbieter-Standard | Stimmenbezeichner (anbieterspezifisch) |

Das TTS-Werkzeug erfordert einen aktiven Kanal, der Sprachnachrichten unterstutzt (Telegram, WhatsApp, Discord). Auf Kanalen, die Sprache nicht unterstutzen, gibt das Werkzeug einen Fehler zuruck.

**TTS-Pipeline:**

1. Text wird an den TTS-Anbieter gesendet (eingebaut oder extern)
2. Audio wird als MP3 generiert
3. Wenn der Kanal M4A erfordert (z.B. einige mobile Clients), wird automatische Konvertierung durchgefuhrt
4. Die Audiodatei wird uber `message_send` als Sprachnachricht zugestellt

### canvas

Rendert strukturierte Inhalte fur visuelle Ausgabe. Unterstutzt Tabellen, Diagramme, Grafiken und formatierte Layouts.

```json
{
  "name": "canvas",
  "arguments": {
    "type": "table",
    "data": {
      "headers": ["Name", "Status", "Score"],
      "rows": [
        ["Module A", "Passed", "98"],
        ["Module B", "Failed", "45"],
        ["Module C", "Passed", "87"]
      ]
    }
  }
}
```

```json
{
  "name": "canvas",
  "arguments": {
    "type": "diagram",
    "content": "graph LR\n  A[Input] --> B[Process]\n  B --> C[Output]"
  }
}
```

| Parameter | Typ | Erforderlich | Standard | Beschreibung |
|-----------|-----|-------------|----------|-------------|
| `type` | `string` | Ja | -- | Inhaltstyp: `"table"`, `"chart"`, `"diagram"`, `"code"` |
| `data` | `object` | Bedingt | -- | Strukturierte Daten fur Tabellen und Diagramme |
| `content` | `string` | Bedingt | -- | Textinhalt fur Diagramme (Mermaid-Syntax) und Code-Blocke |
| `format` | `string` | Nein | `"png"` | Ausgabeformat: `"png"`, `"svg"`, `"html"` |
| `output` | `string` | Nein | Automatisch generierter Temp-Pfad | Ausgabedateipfad |

## Verwendungsmuster

### Visueller Reasoning-Workflow

Screenshots mit visionfahigen LLMs verwenden, um UI-Zustande zu verstehen:

```
Agent denkt: Muss uberprufen, ob die Webanwendung korrekt aussieht.
  1. [browser] action="navigate", url="https://app.example.com/dashboard"
  2. [screenshot] target="screen"
  3. [LLM-Vision-Analyse des Screenshots]
  4. "Das Dashboard zeigt 3 aktive Alarme und ein Diagramm mit sinkenden Metriken..."
```

### Berichtsgenerierung

Visuelle Berichte mit Diagrammen und Tabellen generieren:

```
Agent denkt: Benutzer mochte einen Projektstatusbericht.
  1. [memory_search] query="project status"
  2. [canvas] type="table", data={Projektstatusdaten}
  3. [canvas] type="chart", data={Fortschrittsdiagramm-Daten}
  4. [message_send] media_path="/tmp/status_table.png", caption="Projektstatus"
  5. [message_send] media_path="/tmp/progress_chart.png", caption="Sprint-Fortschritt"
```

### Sprach-Interaktion

Audio-Antworten fur Freisprechen-Szenarien bereitstellen:

```
Agent denkt: Benutzer hat eine Sprachzusammenfassung angefordert.
  1. [memory_recall] query="today's meetings and tasks"
  2. [tts] text="You have 3 meetings today. The first is at 10 AM with the engineering team..."
  → Sprachnachricht uber Telegram zugestellt
```

## Sicherheit

### Dateisystemzugriff

Bild- und Screenshot-Werkzeuge lesen und schreiben Dateien auf dem lokalen Dateisystem. Diese Operationen unterliegen derselben Sicherheitsrichtlinie wie `file_read` und `file_write`:

- Pfadvalidierung verhindert Zugriff ausserhalb erlaubter Verzeichnisse
- Dateischreiboperationen respektieren die Sicherheitsrichtlinienregeln
- Temporare Dateien werden standardmassig in `TMPDIR` geschrieben

### TTS-Datenschutz

Sprachnachrichten konnen sensible Informationen aus der Konversation enthalten. Beachten Sie:

- TTS-Inhalt wird an den TTS-Anbieter gesendet (potenziell extern)
- Generierte Audiodateien werden temporar auf der Festplatte gespeichert
- Sprachnachrichten werden uber den Kanal zugestellt und unterliegen der Datenschutzrichtlinie der Plattform

### Canvas-Inhaltssicherheit

Das Canvas-Werkzeug rendert vom Benutzer bereitgestellte Daten. Beim Rendern von Diagrammen mit Mermaid-Syntax wird der Inhalt lokal verarbeitet und bezieht keine externen Dienste ein.

### Richtlinien-Engine

Medien-Werkzeuge konnen individuell gesteuert werden:

```toml
[security.tool_policy.tools]
image = "allow"
image_info = "allow"
screenshot = "supervised"    # Genehmigung fur Screenshots erfordern
tts = "allow"
canvas = "allow"
```

## Verwandte Seiten

- [Browser-Werkzeug](/de/prx/tools/browser) -- Web-Automatisierung mit Screenshot-Unterstutzung
- [Messaging](/de/prx/tools/messaging) -- Medien und Sprache uber Kanale zustellen
- [Kanal-Ubersicht](/de/prx/channels/) -- Kanal-Medienfahigkeiten-Matrix
- [Werkzeuge-Ubersicht](/de/prx/tools/) -- alle Werkzeuge und Registry-System
