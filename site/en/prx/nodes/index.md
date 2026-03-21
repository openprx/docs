---
title: Remote Nodes
description: Overview of PRX remote node system for distributed agent execution across machines.
---

# Remote Nodes

PRX supports distributed agent execution through remote nodes. A node is a PRX instance running on a separate machine that can be paired with a controller for delegated task execution.

## Overview

The node system enables:

- **Distributed execution** -- run agent tasks on remote machines
- **Specialized environments** -- nodes with GPU access, specific tools, or network locations
- **Load distribution** -- spread agent workload across multiple machines
- **Headless operation** -- nodes run as daemons without a local user interface

## Architecture

```
┌──────────────┐         ┌──────────────┐
│  Controller  │◄──────► │   Node A     │
│  (primary)   │         │  (GPU host)  │
│              │         └──────────────┘
│              │         ┌──────────────┐
│              │◄──────► │   Node B     │
│              │         │  (staging)   │
└──────────────┘         └──────────────┘
```

## Configuration

```toml
[node]
mode = "controller"  # "controller" | "node"
node_id = "gpu-host-01"
advertise_address = "192.168.1.100:3121"

[node.discovery]
method = "static"  # "static" | "mdns"
peers = ["192.168.1.101:3121"]
```

## Related Pages

- [Node Pairing](./pairing)
- [Communication Protocol](./protocol)
- [Security Pairing](/en/prx/security/pairing)
