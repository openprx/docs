---
title: Node Communication Protocol
description: Technical specification of the PRX node-to-node communication protocol.
---

# Node Communication Protocol

PRX nodes communicate using an encrypted, authenticated protocol over TCP. This page describes the wire format and message types.

## Transport

- **Protocol**: TCP with TLS 1.3 (mutual authentication via paired keys)
- **Serialization**: Length-prefixed MessagePack frames
- **Compression**: Optional LZ4 frame compression

## Message Types

| Type | Direction | Description |
|------|-----------|-------------|
| `TaskRequest` | Controller -> Node | Assign a task to the node |
| `TaskResult` | Node -> Controller | Return task execution result |
| `StatusQuery` | Controller -> Node | Request node status |
| `StatusReport` | Node -> Controller | Report node health and capacity |
| `Heartbeat` | Bidirectional | Keepalive and latency measurement |
| `Cancel` | Controller -> Node | Cancel a running task |

## Configuration

```toml
[node.protocol]
tls_version = "1.3"
compression = "lz4"  # "lz4" | "none"
max_frame_size_kb = 4096
heartbeat_interval_secs = 15
connection_timeout_secs = 10
```

## Connection Lifecycle

1. **Connect** -- TCP connection established
2. **TLS handshake** -- mutual authentication with paired keys
3. **Protocol negotiation** -- agree on version and compression
4. **Active** -- exchange messages
5. **Graceful close** -- send disconnect message and close

## Related Pages

- [Nodes Overview](./)
- [Node Pairing](./pairing)
