---
title: WebSocket
description: WebSocket interface for real-time streaming agent interactions.
---

# WebSocket

The PRX gateway provides a WebSocket endpoint for real-time, bidirectional communication with agent sessions. This enables streaming responses, live tool execution updates, and interactive conversations.

## Connection

Connect to the WebSocket endpoint at:

```
ws://127.0.0.1:3120/ws/sessions/:id
```

## Message Protocol

Messages are exchanged as JSON objects with a `type` field:

### Client to Server

- `message` -- send a user message
- `cancel` -- cancel the current agent operation
- `ping` -- keepalive ping

### Server to Client

- `token` -- streaming response token
- `tool_call` -- agent is calling a tool
- `tool_result` -- tool execution completed
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

## Related Pages

- [Gateway Overview](./)
- [HTTP API](./http-api)
