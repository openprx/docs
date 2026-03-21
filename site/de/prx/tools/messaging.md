---
title: Messaging
description: Werkzeuge zum Senden von Nachrichten uber Kommunikationskanale mit automatischem Routing und Low-Level-Gateway-Zugriff.
---

# Messaging

PRX bietet zwei Messaging-Werkzeuge, die es Agenten ermoglichen, Nachrichten uber Kommunikationskanale zuruckzusenden. Das `message_send`-Werkzeug ist die High-Level-Schnittstelle zum Senden von Text-, Medien- und Sprachnachrichten an jeden konfigurierten Kanal, wahrend das `gateway`-Werkzeug Low-Level-Zugriff auf das Axum HTTP/WebSocket-Gateway fur rohe Nachrichtenzustellung bietet.

Messaging-Werkzeuge werden auf Gateway-Ebene registriert und sind verfugbar, wenn ein Kanal aktiv ist. Das `message_send`-Werkzeug routet Nachrichten automatisch zum aktiven Kanal (Telegram, Discord, Slack, CLI usw.), wahrend das `gateway`-Werkzeug direkten Gateway-Protokollzugriff fur fortgeschrittene Anwendungsfalle bietet.

Diese Werkzeuge erganzen das eingehende Kanalsystem. Wahrend Kanale den Empfang von Nachrichten von Benutzern und deren Weiterleitung an den Agenten handhaben, bearbeiten Messaging-Werkzeuge die ausgehende Richtung -- das Senden von agentengeneriertem Inhalt zuruck an Benutzer.

## Konfiguration

Messaging-Werkzeuge haben keinen eigenen Konfigurationsabschnitt. Ihre Verfugbarkeit hangt von der Kanal- und Gateway-Konfiguration ab:

```toml
# Gateway-Konfiguration (Messaging-Werkzeuge hangen davon ab)
[gateway]
host = "127.0.0.1"
port = 16830

# Kanal-Konfiguration (message_send routet zum aktiven Kanal)
[channels_config]
cli = true
message_timeout_secs = 300

[channels_config.telegram]
bot_token = "123456:ABC-DEF..."
allowed_users = ["alice", "bob"]
stream_mode = "partial"
```

Das `message_send`-Werkzeug ist verfugbar, sobald mindestens ein Kanal aktiv ist. Das `gateway`-Werkzeug ist immer in `all_tools()` registriert.

## Werkzeug-Referenz

### message_send

Sendet eine Nachricht an jeden konfigurierten Kanal und Empfanger. Das Werkzeug routet automatisch zum aktiven Kanal -- dem Kanal, uber den die aktuelle Konversation stattfindet.

**Textnachricht senden:**

```json
{
  "name": "message_send",
  "arguments": {
    "text": "The build completed successfully. All 42 tests passed.",
    "channel": "telegram"
  }
}
```

**Medien (Bild/Datei) senden:**

```json
{
  "name": "message_send",
  "arguments": {
    "media_path": "/tmp/screenshot.png",
    "caption": "Current dashboard state",
    "channel": "telegram"
  }
}
```

**Sprachnachricht senden:**

```json
{
  "name": "message_send",
  "arguments": {
    "voice_path": "/tmp/summary.mp3",
    "channel": "telegram"
  }
}
```

| Parameter | Typ | Erforderlich | Standard | Beschreibung |
|-----------|-----|-------------|----------|-------------|
| `text` | `string` | Bedingt | -- | Textnachrichteninhalt (erforderlich wenn kein Medien/Sprache) |
| `channel` | `string` | Nein | Aktiver Kanal | Zielkanalname (automatisch erkannt, wenn weggelassen) |
| `recipient` | `string` | Nein | Aktueller Benutzer | Empfangerbezeichner (Benutzer-ID, Chat-ID usw.) |
| `media_path` | `string` | Nein | -- | Pfad zur Mediendatei (Bild, Dokument, Video) |
| `caption` | `string` | Nein | -- | Bildunterschrift fur Mediennachrichten |
| `voice_path` | `string` | Nein | -- | Pfad zur Sprach-/Audiodatei |
| `reply_to` | `string` | Nein | -- | Nachrichten-ID, auf die geantwortet werden soll (plattformspezifisch) |

### gateway

Low-Level-Gateway-Zugriff zum Senden roher Nachrichten uber das Axum HTTP/WebSocket-Gateway. Dieses Werkzeug ist fur fortgeschrittene Anwendungsfalle gedacht, bei denen `message_send` nicht ausreicht.

```json
{
  "name": "gateway",
  "arguments": {
    "action": "send",
    "payload": {
      "type": "text",
      "content": "Raw gateway message",
      "target": "ws://localhost:16830/ws"
    }
  }
}
```

| Parameter | Typ | Erforderlich | Standard | Beschreibung |
|-----------|-----|-------------|----------|-------------|
| `action` | `string` | Ja | -- | Gateway-Aktion: `"send"`, `"broadcast"`, `"status"` |
| `payload` | `object` | Bedingt | -- | Nachrichten-Payload (erforderlich fur `"send"` und `"broadcast"`) |

## Verwendung

### Automatisches Kanal-Routing

In den meisten Fallen muss der Agent keinen Kanal angeben. Wenn ein Benutzer eine Nachricht uber Telegram sendet, wird die Antwort des Agenten automatisch zuruck an Telegram geroutet:

```
Benutzer (uber Telegram): Wie ist das Wetter?
Agent: [ruft message_send mit text="Aktuell 22°C und sonnig in Shanghai." auf]
       → Wird automatisch an Telegram, in denselben Chat, gesendet
```

### Kanalübergreifendes Messaging

Der Agent kann Nachrichten an einen anderen Kanal als den senden, uber den die Konversation stattfindet:

```json
{
  "name": "message_send",
  "arguments": {
    "text": "Build failed! Check CI logs.",
    "channel": "discord",
    "recipient": "111222333"
  }
}
```

Dies ist nutzlich fur Benachrichtigungs-Workflows, bei denen der Agent einen Kanal uberwacht und Alarme an einen anderen sendet.

### Medien-Zustellung

Der Agent kann Dateien, Bilder und Audio uber Messaging-Kanale senden:

1. Die Mediendatei generieren oder herunterladen
2. In einem temporaren Pfad speichern
3. Uber `message_send` mit `media_path` senden

```
Agent denkt: Benutzer hat ein Diagramm der Daten angefordert.
  1. [shell] python3 generate_chart.py --output /tmp/chart.png
  2. [message_send] media_path="/tmp/chart.png", caption="Monatliches Umsatzdiagramm"
```

### Sprachnachrichten

Fur Kanale, die Sprache unterstutzen (Telegram, WhatsApp, Discord), kann der Agent Audionachrichten senden:

```
Agent denkt: Benutzer hat eine Sprachzusammenfassung angefordert.
  1. [tts] text="Here is your daily summary..." output="/tmp/summary.mp3"
  2. [message_send] voice_path="/tmp/summary.mp3"
```

## Kanal-Routing-Details

Wenn `message_send` ohne expliziten `channel`-Parameter aufgerufen wird, bestimmt PRX den Zielkanal anhand folgender Logik:

1. **Aktiver Sitzungskanal**: Der Kanal, der der aktuellen Agentensitzung zugeordnet ist (festgelegt, als die Sitzung durch eine eingehende Nachricht erstellt wurde)
2. **Standardkanal**: Wenn kein Sitzungskanal gesetzt ist, Fallback auf den ersten aktiven Kanal
3. **CLI-Fallback**: Wenn keine Kanale konfiguriert sind, geht die Ausgabe an stdout

### Unterstutzte Kanal-Transporte

| Kanal | Text | Medien | Sprache | Antwort |
|-------|:----:|:------:|:-------:|:-------:|
| Telegram | Ja | Ja | Ja | Ja |
| Discord | Ja | Ja | Ja | Ja |
| Slack | Ja | Ja | Nein | Ja |
| WhatsApp | Ja | Ja | Ja | Ja |
| Signal | Ja | Ja | Nein | Ja |
| Matrix | Ja | Ja | Nein | Ja |
| E-Mail | Ja | Ja (Anhang) | Nein | Ja |
| CLI | Ja | Nein | Nein | Nein |

## Sicherheit

### Kanalautorisierung

Ausgehende Nachrichten unterliegen denselben Kanalrichtlinien wie eingehende Nachrichten. Der Agent kann nur Nachrichten an Kanale senden, die konfiguriert und aktiv sind. Der Versuch, an einen nicht konfigurierten Kanal zu senden, gibt einen Fehler zuruck.

### Empfangervalidierung

Wenn ein `recipient` angegeben ist, validiert PRX, dass der Empfanger uber den Zielkanal erreichbar ist. Fur Kanale mit `allowed_users`-Listen werden ausgehende Nachrichten an nicht aufgefuhrte Empfanger blockiert.

### Ratenbegrenzung

Ausgehende Nachrichten unterliegen den Ratenlimits des Kanals (pro Plattform konfiguriert). Zum Beispiel erzwingt Telegram API-Ratenlimits, die PRX mit automatischem Backoff respektiert.

### Richtlinien-Engine

Messaging-Werkzeuge konnen uber die Sicherheitsrichtlinie gesteuert werden:

```toml
[security.tool_policy.tools]
message_send = "allow"
gateway = "supervised"     # Genehmigung fur rohen Gateway-Zugriff erfordern
```

### Audit-Protokollierung

Alle ausgehenden Nachrichten werden im Audit-Protokoll aufgezeichnet:

- Zielkanal und Empfanger
- Nachrichtentyp (Text, Medien, Sprache)
- Zeitstempel
- Zustellungsstatus

Mediendateipfade werden protokolliert, Dateiinhalte werden jedoch nicht im Audit-Protokoll gespeichert.

## Verwandte Seiten

- [Kanal-Ubersicht](/de/prx/channels/) -- alle 19 unterstutzten Messaging-Plattformen
- [Gateway](/de/prx/gateway/) -- HTTP-API und WebSocket-Architektur
- [Gateway HTTP-API](/de/prx/gateway/http-api) -- REST-API-Endpunkte
- [Gateway WebSocket](/de/prx/gateway/websocket) -- Echtzeit-Streaming
- [Rendering-Werkzeuge (TTS)](/de/prx/tools/media) -- Text-to-Speech fur Sprachnachrichten
- [Werkzeuge-Ubersicht](/de/prx/tools/) -- alle Werkzeuge und Registry-System
