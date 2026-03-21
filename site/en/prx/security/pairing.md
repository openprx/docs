---
title: Device Pairing
description: Device pairing and identity verification for PRX agent authentication.
---

# Device Pairing

PRX uses a device pairing model to authenticate agent instances and establish trust between nodes. Pairing ensures that only authorized devices can connect to and control the agent.

## Overview

The pairing process:

1. Generate a unique device identity (Ed25519 keypair)
2. Exchange public keys between the controller and agent
3. Verify identity through a challenge-response protocol
4. Establish an encrypted communication channel

## Pairing Flow

```
Controller                    Agent
    │                           │
    │──── Pairing Request ─────►│
    │                           │
    │◄─── Challenge ───────────│
    │                           │
    │──── Signed Response ─────►│
    │                           │
    │◄─── Pairing Confirmed ───│
```

## Configuration

```toml
[security.pairing]
require_pairing = true
max_paired_devices = 5
challenge_timeout_secs = 30
```

## Managing Paired Devices

```bash
prx pair list          # List paired devices
prx pair add           # Start pairing flow
prx pair remove <id>   # Remove a paired device
prx pair revoke-all    # Revoke all pairings
```

## Related Pages

- [Security Overview](./)
- [Nodes](/en/prx/nodes/)
- [Secrets Management](./secrets)
