---
title: Node Communication Protocol
description: Technical specification of le PRX node-to-node communication protocol.
---

# Nonde Communication Protocol

PRX nodes communicate using an encrypted, authenticated protocol over TCP. Cette page decrit the wire format and message types.

## Transport

- **Protocol**: TCP with TLS 1.3 (mutual authentication via paired keys)
- **Serialization**: Length-prefixed MessagePack frames
- **Compression**: Optionnel LZ4 frame compression

## Message Types

| Type | Direction | Description |
|------|-----------|-------------|
| `TaskRequest` | Controller -> Nonde | Assign a task vers le node |
| `TaskResult` | Nonde -> Controller | Retour task execution result |
| `StatusQuery` | Controller -> Nonde | Request node status |
| `StatusReport` | Nonde -> Controller | Report node health and capacity |
| `Heartbeat` | Bidirectional | Keepalive and latency measurement |
| `Cancel` | Controller -> Nonde | Cancel a running task |

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

## Voir aussi Pages

- [Nondes Overview](./)
- [Nonde Pairing](./pairing)
