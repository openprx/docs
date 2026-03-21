---
title: Kanalübersicht
description: PRX verbindet sich mit 19 Messaging-Plattformen. Überblick über alle Kanäle, Vergleichsmatrix, Konfigurationsmuster und DM-Richtlinien.
---

# Kanäle

Kanäle sind Messaging-Plattform-Integrationen, die PRX mit der Außenwelt verbinden. Jeder Kanal implementiert eine einheitliche Schnittstelle zum Senden und Empfangen von Nachrichten, zur Medienverarbeitung, zur Verwaltung von Tipp-Indikatoren und zur Durchführung von Gesundheitschecks. PRX kann mehrere Kanäle gleichzeitig aus einem einzigen Daemon-Prozess betreiben.

## Unterstützte Kanäle

PRX unterstützt 19 Messaging-Kanäle, die Verbraucherplattformen, Unternehmenswerkzeuge, Open-Source-Protokolle und Entwicklerschnittstellen umfassen.

### Kanalvergleichsmatrix

| Kanal | DM | Gruppe | Medien | Sprache | E2EE | Plattform | Status |
|-------|:--:|:------:|:------:|:-------:|:----:|-----------|:------:|
| [Telegram](./telegram) | Ja | Ja | Ja | Nein | Nein | Plattformübergreifend | Stabil |
| [Discord](./discord) | Ja | Ja | Ja | Nein | Nein | Plattformübergreifend | Stabil |
| [Slack](./slack) | Ja | Ja | Ja | Nein | Nein | Plattformübergreifend | Stabil |
| [WhatsApp](./whatsapp) | Ja | Ja | Ja | Nein | Ja | Cloud-API | Stabil |
| [WhatsApp Web](./whatsapp-web) | Ja | Ja | Ja | Nein | Ja | Multi-Device | Beta |
| [Signal](./signal) | Ja | Ja | Ja | Nein | Ja | Plattformübergreifend | Stabil |
| [iMessage](./imessage) | Ja | Ja | Ja | Nein | Ja | Nur macOS | Beta |
| [Matrix](./matrix) | Ja | Ja | Ja | Nein | Ja | Föderiert | Stabil |
| [E-Mail](./email) | Ja | Nein | Ja | Nein | Nein | IMAP/SMTP | Stabil |
| [Lark / Feishu](./lark) | Ja | Ja | Ja | Nein | Nein | Plattformübergreifend | Stabil |
| [DingTalk](./dingtalk) | Ja | Ja | Ja | Nein | Nein | Plattformübergreifend | Stabil |
| [QQ](./qq) | Ja | Ja | Ja | Nein | Nein | Plattformübergreifend | Beta |
| [Mattermost](./mattermost) | Ja | Ja | Ja | Nein | Nein | Selbstgehostet | Stabil |
| [Nextcloud Talk](./nextcloud-talk) | Ja | Ja | Ja | Nein | Nein | Selbstgehostet | Beta |
| [IRC](./irc) | Ja | Ja | Nein | Nein | Nein | Föderiert | Stabil |
| [LINQ](./linq) | Ja | Ja | Ja | Nein | Nein | Partner-API | Alpha |
| [CLI](./cli) | Ja | Nein | Nein | Nein | N/A | Terminal | Stabil |
| Terminal | Ja | Nein | Nein | Nein | N/A | Terminal | Stabil |
| Wacli | Ja | Ja | Ja | Nein | Ja | JSON-RPC | Beta |

**Legende:**
- **Stabil** -- Produktionsreif, vollständig getestet
- **Beta** -- Funktionsfähig mit bekannten Einschränkungen
- **Alpha** -- Experimentell, API kann sich ändern

## Allgemeines Konfigurationsmuster

Alle Kanäle werden unter dem Abschnitt `[channels]` der Datei `~/.config/openprx/openprx.toml` konfiguriert. Jeder Kanal hat seinen eigenen Unterabschnitt mit plattformspezifischen Einstellungen.

### Grundstruktur

```toml
[channels]
# Integrierten CLI-Kanal aktivieren (Standard: true)
cli = true

# Zeitlimit pro Nachrichtenverarbeitung in Sekunden (Standard: 300)
message_timeout_secs = 300

# ── Telegram ──────────────────────────────────────────────
[channels.telegram]
bot_token = "123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
allowed_users = ["alice", "bob"]
stream_mode = "edit"            # "edit" | "append" | "none"
mention_only = false

# ── Discord ───────────────────────────────────────────────
[channels.discord]
bot_token = "MTIzNDU2Nzg5.XXXXXX.XXXXXXXXXX"
guild_id = "1234567890"         # optional: auf einen Server beschränken
allowed_users = []              # leer = alle erlauben
listen_to_bots = false
mention_only = false

# ── Slack ─────────────────────────────────────────────────
[channels.slack]
bot_token = "xoxb-..."
app_token = "xapp-..."
allowed_users = []
mention_only = true
```

### Kanalspezifische Beispiele

**Lark / Feishu:**

```toml
[channels.lark]
app_id = "cli_xxxxxxxxxxxx"
app_secret = "xxxxxxxxxxxxxxxxxxxxxxxx"
allowed_users = []
use_feishu = false              # true für Feishu (China), false für Lark (International)
receive_mode = "websocket"      # "websocket" | "webhook"
mention_only = false
```

**Signal:**

```toml
[channels.signal]
phone_number = "+1234567890"
signal_cli_path = "/usr/local/bin/signal-cli"
allowed_users = ["+1987654321"]
```

**Matrix (mit E2EE):**

```toml
[channels.matrix]
homeserver_url = "https://matrix.org"
username = "@prx-bot:matrix.org"
password = "secure-password"
allowed_users = ["@alice:matrix.org"]
```

**E-Mail (IMAP/SMTP):**

```toml
[channels.email]
imap_host = "imap.gmail.com"
imap_port = 993
smtp_host = "smtp.gmail.com"
smtp_port = 587
username = "prx-bot@gmail.com"
password = "app-specific-password"
allowed_from = ["alice@example.com"]
```

**DingTalk:**

```toml
[channels.dingtalk]
app_key = "dingxxxxxxxxxxxxxxxx"
app_secret = "xxxxxxxxxxxxxxxxxxxxxxxx"
robot_code = "dingxxxxxxxxx"
allowed_users = []
```

## DM-Richtlinien

PRX bietet feinkörnige Kontrolle darüber, wer Direktnachrichten an Ihren Agenten senden kann. Die DM-Richtlinie wird pro Kanal konfiguriert und bestimmt, wie eingehende Direktnachrichten behandelt werden.

### Richtlinientypen

| Richtlinie | Verhalten |
|------------|-----------|
| `pairing` | Erfordert einen Pairing-Handshake, bevor der Absender akzeptiert wird. Der Benutzer muss einen Challenge-Response-Flow zur Authentifizierung abschließen. Zukünftiges Feature -- fällt derzeit auf `allowlist` zurück. |
| `allowlist` | **(Standard)** Nur Absender, die im `allowed_users`-Array des Kanals aufgeführt sind, können mit dem Agenten interagieren. Nachrichten von nicht gelisteten Absendern werden stillschweigend ignoriert. |
| `open` | Jeder Benutzer kann Direktnachrichten an den Agenten senden. In der Produktion mit Vorsicht verwenden. |
| `disabled` | Alle Direktnachrichten werden ignoriert. Nützlich, wenn PRX nur in Gruppen antworten soll. |

### Konfiguration

DM-Richtlinien werden auf der Hauptebene der Kanalkonfiguration gesetzt:

```toml
[channels]
dm_policy = "allowlist"         # "pairing" | "allowlist" | "open" | "disabled"
```

Das `allowed_users`-Array jedes Kanals ist die Allowlist für diesen Kanal:

```toml
[channels.telegram]
bot_token = "..."
allowed_users = ["alice", "bob"]  # Nur diese Benutzer können DMs senden
```

Wenn `dm_policy = "open"`, wird das Feld `allowed_users` ignoriert und alle Absender werden akzeptiert.

## Gruppenrichtlinien

Ähnlich wie DM-Richtlinien steuert PRX, an welchen Gruppenkonversationen der Agent teilnimmt:

| Richtlinie | Verhalten |
|------------|-----------|
| `allowlist` | **(Standard)** Nur Gruppen, die in der Gruppen-Allowlist des Kanals aufgeführt sind, werden überwacht. |
| `open` | Der Agent antwortet in jeder Gruppe, der er hinzugefügt wird. |
| `disabled` | Alle Gruppennachrichten werden ignoriert. |

```toml
[channels]
group_policy = "allowlist"

[channels.telegram]
bot_token = "..."
# Gruppen-Allowlist wird pro Kanal konfiguriert
```

## Nur-Erwähnungs-Modus

Die meisten Kanäle unterstützen ein `mention_only`-Flag. Wenn aktiviert, antwortet der Agent nur auf Nachrichten, die ihn explizit erwähnen (per @-Erwähnung, Antwort oder plattformspezifischem Auslöser). Dies ist in Gruppenchats nützlich, um zu vermeiden, dass der Agent auf jede Nachricht antwortet.

```toml
[channels.discord]
bot_token = "..."
mention_only = true   # Nur bei @-Erwähnung antworten
```

## Streaming-Modus

Einige Kanäle unterstützen das Streamen von LLM-Antworten in Echtzeit. Die Einstellung `stream_mode` steuert, wie die gestreamte Ausgabe angezeigt wird:

| Modus | Verhalten |
|-------|-----------|
| `edit` | Bearbeitet dieselbe Nachricht, während Token eintreffen (Telegram, Discord) |
| `append` | Hängt neuen Text an die Nachricht an |
| `none` | Wartet auf die vollständige Antwort vor dem Senden |

```toml
[channels.telegram]
bot_token = "..."
stream_mode = "edit"
draft_update_interval_ms = 1000   # Wie oft der Entwurf aktualisiert wird (ms)
```

## Neuen Kanal hinzufügen

PRX-Kanäle basieren auf dem `Channel`-Trait. Um einen neuen Kanal zu verbinden:

1. Fügen Sie die Kanalkonfiguration zu Ihrer `openprx.toml` hinzu
2. Starten Sie den Daemon neu: `prx daemon`

Alternativ verwenden Sie den interaktiven Kanalassistenten:

```bash
prx channel add telegram
```

Um aktive Kanäle aufzulisten:

```bash
prx channel list
```

Um Kanalverbindungsprobleme zu diagnostizieren:

```bash
prx channel doctor
```

## Kanalarchitektur

Unter der Haube führt jeder Kanal Folgendes aus:

1. **Lauschen** auf eingehende Nachrichten von der Plattform (per Polling, Webhooks oder WebSocket)
2. **Filtern** von Nachrichten basierend auf DM-/Gruppenrichtlinien und Allowlists
3. **Weiterleiten** akzeptierter Nachrichten an die Agent-Schleife zur Verarbeitung
4. **Senden** der Antwort des Agenten über die API der Plattform zurück
5. **Melden** des Gesundheitsstatus und automatische Wiederverbindung mit exponentiellem Backoff

Alle Kanäle laufen gleichzeitig innerhalb des Daemon-Prozesses und teilen sich die Agent-Laufzeit, das Gedächtnis und die Werkzeug-Subsysteme.

## Nächste Schritte

Wählen Sie einen Kanal, um mehr über seine spezifische Einrichtung zu erfahren:

- [Telegram](./telegram) -- Bot-API-Integration
- [Discord](./discord) -- Bot mit Slash-Befehlen
- [Slack](./slack) -- Slack-App mit Socket Mode
- [WhatsApp](./whatsapp) -- Cloud-API-Integration
- [Signal](./signal) -- Signal-CLI-Bridge
- [Matrix](./matrix) -- Föderierter Chat mit E2EE
- [Lark / Feishu](./lark) -- Enterprise-Messaging
- [E-Mail](./email) -- IMAP/SMTP-Integration
