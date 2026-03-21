---
title: Nodos remotos
description: Vision general del sistema de nodos remotos de PRX para ejecucion distribuida del agente entre maquinas.
---

# Nodos remotos

PRX soporta ejecucion distribuida del agente a traves de nodos remotos. Un nodo es una instancia de PRX ejecutandose en una maquina separada que puede emparejarse con un controlador para la ejecucion delegada de tareas.

## Vision general

El sistema de nodos permite:

- **Ejecucion distribuida** -- ejecutar tareas del agente en maquinas remotas
- **Entornos especializados** -- nodos con acceso a GPU, herramientas especificas o ubicaciones de red
- **Distribucion de carga** -- repartir la carga de trabajo del agente entre multiples maquinas
- **Operacion sin cabeza** -- los nodos se ejecutan como daemons sin interfaz de usuario local

## Arquitectura

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

## Configuracion

```toml
[node]
mode = "controller"  # "controller" | "node"
node_id = "gpu-host-01"
advertise_address = "192.168.1.100:3121"

[node.discovery]
method = "static"  # "static" | "mdns"
peers = ["192.168.1.101:3121"]
```

## Paginas relacionadas

- [Emparejamiento de nodos](./pairing)
- [Protocolo de comunicacion](./protocol)
- [Emparejamiento de seguridad](/es/prx/security/pairing)
