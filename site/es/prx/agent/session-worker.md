---
title: Session Worker
description: Ejecucion de sesiones con aislamiento de procesos en PRX para tolerancia a fallos y contencion de recursos.
---

# Session Worker

El session worker proporciona aislamiento a nivel de proceso para las sesiones del agente. En lugar de ejecutar todas las sesiones en un unico proceso, PRX puede generar procesos worker dedicados que contienen fallos y aplican limites de recursos a nivel del sistema operativo.

## Motivacion

El aislamiento de procesos proporciona varios beneficios:

- **Contencion de fallos** -- un fallo en una sesion no afecta a las demas
- **Limites de recursos** -- aplicar limites de memoria y CPU por sesion via cgroups o mecanismos del SO
- **Frontera de seguridad** -- sesiones con diferentes niveles de confianza se ejecutan en espacios de direcciones separados
- **Degradacion elegante** -- el proceso principal puede reiniciar workers fallidos

## Arquitectura

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

El proceso principal actua como supervisor, comunicandose con los workers via IPC (sockets de dominio Unix o pipes).

## Protocolo de comunicacion

Los workers se comunican con el supervisor usando un protocolo JSON con prefijo de longitud sobre el canal IPC:

1. **Spawn** -- el supervisor envia la configuracion de sesion al worker
2. **Mensajes** -- streaming bidireccional de mensajes usuario/agente
3. **Heartbeat** -- verificaciones periodicas de salud
4. **Shutdown** -- senal de terminacion elegante

## Configuracion

```toml
[agent.worker]
enabled = false
ipc_socket_dir = "/tmp/prx-workers"
heartbeat_interval_secs = 10
max_restart_attempts = 3
```

## Limites de recursos

Al ejecutarse en Linux, el session worker puede aplicar limites de recursos basados en cgroups:

```toml
[agent.worker.limits]
memory_limit_mb = 256
cpu_shares = 512
```

## Paginas relacionadas

- [Runtime del agente](./runtime) -- Vision general de la arquitectura
- [Bucle del agente](./loop) -- Ciclo central de ejecucion
- [Sandbox de seguridad](/es/prx/security/sandbox) -- Backends de sandbox
