---
title: WebSocket
description: WebSocket interface for en temps reel streaming agent interactions.
---

# WebSocket

The PRX gateway provides a WebSocket endpoint for en temps reel, bidirectional communication with session d'agents. Cela permet reponses en streaming, live execution d'outil updates, et interactive conversations.

## Connection

Connect vers le WebSocket endpoint at:

```
ws://127.0.0.1:3120/ws/sessions/:id
```

## Message Protocol

Messages are exchanged as JSON objects avec un `type` field:

### Client to Server

- `message` -- send a user message
- `cancel` -- cancel the current agent operation
- `ping` -- keepalive ping

### Server to Client

- `token` -- streaming response token
- `tool_call` -- agent is calling a tool
- `tool_result` -- execution d'outil completed
- `done` -- agent response complete
- `error` -- error occurred
- `pong` -- keepalive response

## Configuration

```toml
[gateway.websocket]
max_connections = 100
ping_interval_secs = 30
max_message_size_kb = 1024
```

## Voir aussi Pages

- [Gateway Overview](./)
- [HTTP API](./http-api)
