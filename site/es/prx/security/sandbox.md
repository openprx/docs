---
title: Sandbox
description: Backends de sandbox para aislar la ejecucion de herramientas en PRX.
---

# Sandbox

El sandbox de PRX proporciona aislamiento de procesos y sistema de archivos para la ejecucion de herramientas. Cuando un agente llama a una herramienta que ejecuta comandos externos, el sandbox asegura que el comando se ejecute en un entorno restringido.

## Backends de sandbox

PRX soporta multiples backends de sandbox:

| Backend | Plataforma | Nivel de aislamiento | Sobrecarga |
|---------|-----------|---------------------|-----------|
| **Docker** | Linux, macOS | Contenedor completo | Alta |
| **Bubblewrap** | Linux | Namespace + seccomp | Baja |
| **Firejail** | Linux | Namespace + seccomp | Baja |
| **Landlock** | Linux (5.13+) | LSM del kernel | Minima |
| **None** | Todas | Sin aislamiento | Ninguna |

## Configuracion

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

## Como funciona

1. El agente solicita una llamada a herramienta (ej., ejecucion de comando de shell)
2. El motor de politicas verifica si la llamada esta permitida
3. El sandbox envuelve la ejecucion en el backend configurado
4. La herramienta se ejecuta con acceso restringido al sistema de archivos y red
5. Los resultados se capturan y devuelven al agente

## Paginas relacionadas

- [Vision general de seguridad](./)
- [Motor de politicas](./policy-engine)
- [Trabajador de sesion](/es/prx/agent/session-worker)
