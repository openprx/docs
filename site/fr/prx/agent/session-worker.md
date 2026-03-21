---
title: Worker de session
description: Process-isolated session execution in PRX for fault tolerance and resource containment.
---

# Session Worker

The session worker provides process-level isolation for session d'agents. Instead of running all sessions in un seul process, PRX can spawn dedicated worker processes that contain failures et enforce resource limits au OS level.

## Motivation

Process isolation provides several benefits:

- **Fault containment** -- a crash in one session ne fait pcomme unffect others
- **Resource limits** -- enforce per-session memory and CPU limits via cgroups or OS mechanisms
- **Security boundary** -- sessions with different trust levels run in separate address spaces
- **Graceful degradation** -- the main process can restart failed workers

## Architecture

```
┌──────────────┐
│  Main Process │
│  (Supervisor) │
│               │
│  ┌──────────┐ │    ┌─────────────┐
│  │ Session A ├─┼───►│ Worker Proc │
│  └──────────┘ │    └─────────────┘
│  ┌──────────┐ │    ┌─────────────┐
│  │ Session B ├─┼───►│ Worker Proc │
│  └──────────┘ │    └─────────────┘
└──────────────┘
```

The main process acts comme un supervisor, communicating with workers via IPC (Unix domain sockets or pipes).

## Communication Protocol

Workers communicate avec le supervisor using a length-prefixed JSON protocol over the IPC channel:

1. **Spawn** -- supervisor sends session configuration vers le worker
2. **Messages** -- bidirectional streaming of user/agent messages
3. **Heartbeat** -- periodic health checks
4. **Shutdown** -- graceful termination signal

## Configuration

```toml
[agent.worker]
enabled = false
ipc_socket_dir = "/tmp/prx-workers"
heartbeat_interval_secs = 10
max_restart_attempts = 3
```

## Limitees de ressources

When running on Linux, the session worker can apply cgroup-based resource limits:

```toml
[agent.worker.limits]
memory_limit_mb = 256
cpu_shares = 512
```

## Voir aussi Pages

- [Agent Runtime](./runtime) -- Architecture overview
- [Agent Loop](./loop) -- Core execution cycle
- [Security Sandbox](/fr/prx/security/sandbox) -- Sandbox backends
