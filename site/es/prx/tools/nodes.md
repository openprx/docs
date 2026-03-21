---
title: Nodos remotos
description: Gestionar y comunicarse con nodos PRX remotos para ejecucion distribuida de agentes entre maquinas.
---

# Nodos remotos

La herramienta `nodes` permite a los agentes PRX interactuar con instancias PRX remotas en un despliegue distribuido. Un nodo es un daemon PRX separado ejecutandose en otra maquina -- potencialmente con diferentes capacidades de hardware, acceso a red o configuraciones de herramientas -- que ha sido emparejado con la instancia controladora.

A traves de la herramienta `nodes`, un agente puede descubrir nodos disponibles, verificar su salud, enrutar tareas a nodos con capacidades especializadas (ej., acceso GPU) y recuperar resultados.

## Parametros

| Parametro | Tipo | Requerido | Por defecto | Descripcion |
|-----------|------|-----------|-------------|-------------|
| `action` | `string` | Si | -- | Accion de nodo: `"list"`, `"health"`, `"send"`, `"result"`, `"capabilities"` |
| `node_id` | `string` | Condicional | -- | Identificador del nodo objetivo |
| `task` | `string` | Condicional | -- | Descripcion de la tarea (requerido para `"send"`) |
| `task_id` | `string` | Condicional | -- | Identificador de la tarea (requerido para `"result"`) |

## Seguridad

- **Autenticacion TLS mutua**: Toda comunicacion de nodos usa mTLS
- **Requisito de emparejamiento**: Los nodos deben completar un handshake de emparejamiento antes de poder intercambiar tareas
- **Aislamiento de tareas**: Las tareas enviadas a nodos remotos se ejecutan dentro de la politica de seguridad del nodo

## Relacionado

- [Nodos remotos](/es/prx/nodes/) -- arquitectura del sistema de nodos
- [Emparejamiento de nodos](/es/prx/nodes/pairing) -- protocolo de emparejamiento e intercambio de certificados
- [Protocolo de comunicacion](/es/prx/nodes/protocol) -- detalles del protocolo de cable
- [Sesiones y agentes](/es/prx/tools/sessions) -- alternativa para ejecucion multi-agente local
- [Vision general de herramientas](/es/prx/tools/) -- todas las herramientas y sistema de registro
