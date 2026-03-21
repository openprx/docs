---
title: Architecture des plugins
description: Technical architecture of le PRX WASM plugin runtime, including le host-guest boundary and memory model.
---

# Plugin Architecture

Le systeme de plugins PRX est construit sur un runtime WASM qui fournit un environnement d'execution securise et portable for third-party code. Cette page decrit the technical architecture.

## Runtime

PRX utilise le runtime Wasmtime pour executer les plugins WASM. Chaque plugin instance s'execute dans its own WASM store with isolated linear memory.

```
┌──────────────────────────────┐
│         PRX Host             │
│                              │
│  ┌────────────────────────┐  │
│  │    WASM Runtime         │  │
│  │  ┌──────┐  ┌──────┐   │  │
│  │  │Plugin│  │Plugin│   │  │
│  │  │  A   │  │  B   │   │  │
│  │  └──┬───┘  └──┬───┘   │  │
│  │     │         │        │  │
│  │  Host Functions API    │  │
│  └────────────────────────┘  │
└──────────────────────────────┘
```

## Host-Guest Boundary

Plugins communicate with l'hote via un defined set of host functions. La frontiere impose :

- **Type safety** -- all function parameters are valide
- **Resource limits** -- memory and CPU usage are capped
- **Permission checks** -- each host function call is authorized against le plugin's permission manifest

## Memory Model

Chaque plugin has its own linear memory space (default 64 MB). Data is exchanged between host et guest through shared memory buffers with explicit serialization.

## Plugin Lifecycle

1. **Load** -- WASM binary is loaded and valide
2. **Initialize** -- plugin's `init()` function est appele avec configuration
3. **Ready** -- plugin registers its capabilities (tools, channels, etc.)
4. **Execute** -- host invokes plugin functions as needed
5. **Shutdown** -- plugin's `shutdown()` function is called for cleanup

## Voir aussi Pages

- [Plugin System Overview](./)
- [Host Functions](./host-functions)
- [Developer Guide](./developer-guide)
