---
title: Sandbox
description: Sandbox backends for isolating tool execution in PRX.
---

# Sandbox

The PRX sandbox provides process et filesystem isolation for execution d'outil. When an agent calls a tool qui s'execute external commands, le sandbox garantit la commande s'execute dans a restricted environment.

## Backends de sandbox

PRX prend en charge multiple sandbox backends:

| Backend | Plateforme | Isolation Level | Surcharge |
|---------|----------|----------------|----------|
| **Docker** | Linux, macOS | Full container | High |
| **Bubblewrap** | Linux | Namespace + seccomp | Low |
| **Firejail** | Linux | Namespace + seccomp | Low |
| **Landlock** | Linux (5.13+) | Kernel LSM | Minimal |
| **Aucun** | All | Non isolation | Aucun |

## Configuration

```toml
[security.sandbox]
backend = "bubblewrap"

[security.sandbox.docker]
image = "prx-sandbox:latest"
network = "none"
memory_limit = "256m"
cpu_limit = "1.0"

[security.sandbox.bubblewrap]
allow_network = false
writable_paths = ["/tmp"]
readonly_paths = ["/usr", "/lib"]
```

## Fonctionnement

1. Agent requests a appel d'outil (e.g., shell command execution)
2. Policy engine checks si le call is allowed
3. Sandbox enveloppe the execution in the configured backend
4. L'outil runs with restricted filesystem and acces reseau
5. Results sont captures and retournes to l'agent

## Voir aussi Pages

- [Security Overview](./)
- [Moteur de politiques](./policy-engine)
- [Session Worker](/fr/prx/agent/session-worker)
