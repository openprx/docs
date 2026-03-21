---
title: WebSocket
description: WebSocket-Schnittstelle fur Echtzeit-Streaming-Agenteninteraktionen.
---

# WebSocket

Das PRX-Gateway bietet einen WebSocket-Endpunkt fur Echtzeit-bidirektionale Kommunikation mit Agenten-Sitzungen. Dies ermoglicht Streaming-Antworten, Live-Werkzeug-Ausfuhrungs-Updates und interaktive Gesprache.

## Verbindung

Verbinden Sie sich mit dem WebSocket-Endpunkt unter:

```
ws://127.0.0.1:3120/ws/sessions/:id
```

## Nachrichtenprotokoll

Nachrichten werden als JSON-Objekte mit einem `type`-Feld ausgetauscht:

### Client an Server

- `message` -- eine Benutzernachricht senden
- `cancel` -- die aktuelle Agentenoperation abbrechen
- `ping` -- Keepalive-Ping

### Server an Client

- `token` -- Streaming-Antwort-Token
- `tool_call` -- Agent ruft ein Werkzeug auf
- `tool_result` -- Werkzeugausfuhrung abgeschlossen
- `done` -- Agentenantwort vollstandig
- `error` -- Fehler aufgetreten
- `pong` -- Keepalive-Antwort

## Konfiguration

```toml
[gateway.websocket]
max_connections = 100
ping_interval_secs = 30
max_message_size_kb = 1024
```

## Verwandte Seiten

- [Gateway-Ubersicht](./)
- [HTTP-API](./http-api)
