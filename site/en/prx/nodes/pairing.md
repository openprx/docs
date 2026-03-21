---
title: Node Pairing
description: How to pair PRX nodes with a controller for secure distributed execution.
---

# Node Pairing

Before a node can receive tasks from a controller, they must be paired. Pairing establishes mutual trust through cryptographic identity verification.

## Pairing Process

1. Start the node in pairing mode: `prx node pair`
2. The node displays a pairing code (6-digit PIN)
3. On the controller, initiate pairing: `prx pair add --address <node-ip>:3121`
4. Enter the pairing code when prompted
5. Both sides exchange and verify Ed25519 public keys

## Configuration

```toml
[node.pairing]
auto_accept = false
pairing_timeout_secs = 120
max_paired_controllers = 3
```

## Managing Nodes

```bash
# On the controller
prx node list              # List paired nodes
prx node status <node-id>  # Check node status
prx node unpair <node-id>  # Remove node pairing

# On the node
prx node pair              # Enter pairing mode
prx node info              # Show node identity
```

## Related Pages

- [Nodes Overview](./)
- [Communication Protocol](./protocol)
- [Device Pairing](/en/prx/security/pairing)
