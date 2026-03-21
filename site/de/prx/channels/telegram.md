---
title: Telegram
description: PRX über die Bot-API mit Telegram verbinden
---

# Telegram

> PRX über die offizielle Bot-API mit Telegram verbinden -- mit Unterstützung für DMs, Gruppen, Streaming-Antworten und Medienanhänge.

## Voraussetzungen

- Ein Telegram-Konto
- Ein Bot-Token von [@BotFather](https://t.me/BotFather)
- Die Telegram-Benutzer-IDs oder Benutzernamen der erlaubten Benutzer

## Schnelleinrichtung

### 1. Bot erstellen

1. Öffnen Sie Telegram und schreiben Sie [@BotFather](https://t.me/BotFather)
2. Senden Sie `/newbot` und folgen Sie den Anweisungen zur Benennung Ihres Bots
3. Kopieren Sie den Bot-Token (Format: `123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11`)

### 2. Konfigurieren

Fügen Sie Folgendes zu Ihrer PRX-Konfigurationsdatei hinzu:

```toml
[channels_config.telegram]
bot_token = "123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
allowed_users = ["123456789", "your_username"]
```

Wenn `allowed_users` leer gelassen wird, wechselt PRX in den **Pairing-Modus** und generiert einen einmaligen Bindungscode. Senden Sie `/bind <code>` von Ihrem Telegram-Konto, um zu koppeln.

### 3. Überprüfen

```bash
prx channel doctor telegram
```

## Konfigurationsreferenz

| Feld | Typ | Standard | Beschreibung |
|------|-----|----------|-------------|
| `bot_token` | `String` | *erforderlich* | Telegram Bot-API-Token von @BotFather |
| `allowed_users` | `[String]` | `[]` | Telegram-Benutzer-IDs oder Benutzernamen. Leer = Pairing-Modus. `"*"` = alle erlauben |
| `stream_mode` | `String` | `"none"` | Streaming-Modus: `"none"`, `"edit"` oder `"typing"`. Edit-Modus aktualisiert die Antwortnachricht fortschreitend |
| `draft_update_interval_ms` | `u64` | `500` | Mindestintervall (ms) zwischen Entwurfsbearbeitungen zur Vermeidung von Ratenbegrenzungen |
| `interrupt_on_new_message` | `bool` | `false` | Bei true bricht eine neue Nachricht desselben Absenders die laufende Anfrage ab |
| `mention_only` | `bool` | `false` | Bei true nur auf @-Erwähnungen in Gruppen antworten. DMs werden immer verarbeitet |
| `ack_reactions` | `bool` | *geerbt* | Überschreibung für die globale `ack_reactions`-Einstellung. Fällt auf `[channels_config].ack_reactions` zurück, wenn nicht gesetzt |

## Funktionen

- **Direktnachrichten und Gruppenchats** -- antwortet auf DMs und Gruppenkonversationen
- **Streaming-Antworten** -- fortschreitende Nachrichtenbearbeitungen zeigen die Antwort während der Generierung
- **Pairing-Modus** -- sichere einmalige Codebindung, wenn keine erlaubten Benutzer konfiguriert sind
- **Medienanhänge** -- verarbeitet Dokumente, Fotos und Bildunterschriften
- **Aufteilung langer Nachrichten** -- teilt Antworten automatisch an Wortgrenzen auf, die Telegrams 4096-Zeichen-Limit überschreiten
- **Bestätigungsreaktionen** -- reagiert auf eingehende Nachrichten zur Empfangsbestätigung
- **Sprachtranskription** -- transkribiert Sprachnachrichten, wenn STT konfiguriert ist

## Einschränkungen

- Telegram begrenzt Textnachrichten auf 4.096 Zeichen (PRX teilt längere Nachrichten automatisch auf)
- Bot-API-Polling führt zu leichter Latenz im Vergleich zum Webhook-Modus
- Bots können keine Konversationen initiieren; Benutzer müssen den Bot zuerst anschreiben
- Datei-Uploads sind über die Bot-API auf 50 MB begrenzt

## Fehlerbehebung

### Bot antwortet nicht auf Nachrichten
- Überprüfen Sie den Bot-Token mit `prx channel doctor telegram`
- Prüfen Sie, ob die Benutzer-ID oder der Benutzername des Absenders in `allowed_users` enthalten ist
- Wenn `allowed_users` leer ist, verwenden Sie `/bind <code>` zum Koppeln

### Ratenbegrenzungsfehler beim Streaming
- Erhöhen Sie `draft_update_interval_ms` (z.B. auf `1000` oder höher)
- Telegram erzwingt Ratenbegrenzungen pro Chat bei Nachrichtenbearbeitungen

### Bot antwortet in DMs, aber nicht in Gruppen
- Stellen Sie sicher, dass `mention_only` auf `false` gesetzt ist, oder @-erwähnen Sie den Bot
- Deaktivieren Sie in BotFather den "Group Privacy"-Modus, damit der Bot alle Gruppennachrichten sehen kann
