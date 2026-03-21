---
title: Security
description: Overview of the PRX security model covering policy engine, sandbox, secrets management, and threat model.
---

# Security

Security is a foundational concern in PRX. As an autonomous agent framework, PRX must carefully control what actions agents can take, what data they can access, and how they interact with external systems.

## Security Layers

PRX implements defense in depth through multiple security layers:

| Layer | Component | Purpose |
|-------|-----------|---------|
| Policy | [Policy Engine](./policy-engine) | Declarative rules for tool access and data flow |
| Isolation | [Sandbox](./sandbox) | Process/container isolation for tool execution |
| Authentication | [Pairing](./pairing) | Device pairing and identity verification |
| Secrets | [Secrets Management](./secrets) | Secure storage for API keys and credentials |

## Configuration

```toml
[security]
sandbox_backend = "bubblewrap"  # "docker" | "firejail" | "bubblewrap" | "landlock" | "none"
require_tool_approval = true
max_tool_calls_per_turn = 10

[security.policy]
default_action = "deny"
```

## Threat Model

PRX's [threat model](./threat-model) considers adversarial inputs, prompt injection, tool abuse, and data exfiltration as primary threat vectors.

## Related Pages

- [Policy Engine](./policy-engine)
- [Pairing](./pairing)
- [Sandbox](./sandbox)
- [Secrets Management](./secrets)
- [Threat Model](./threat-model)
