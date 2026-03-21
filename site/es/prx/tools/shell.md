---
title: Ejecucion shell
description: La herramienta shell ejecuta comandos en entornos sandboxeados con backends de aislamiento configurables, sanitizacion de entorno, aplicacion de timeout y limites de salida.
---

# Ejecucion shell

La herramienta `shell` es una de las tres herramientas core en PRX, disponible tanto en los registros `default_tools()` como `all_tools()`. Proporciona ejecucion de comandos a nivel de SO dentro de un sandbox configurable, asegurando que los comandos iniciados por el agente se ejecuten bajo aislamiento estricto, limites de tiempo y restricciones de salida.

## Backends de sandbox

| Backend | Plataforma | Nivel de aislamiento | Sobrecarga | Notas |
|---------|-----------|---------------------|-----------|-------|
| **Landlock** | Linux (5.13+) | LSM de sistema de archivos | Minima | Nativo del kernel, sin dependencias extra |
| **Firejail** | Linux | Completo (red, sistema de archivos, PID) | Baja | Sandbox de espacio de usuario |
| **Bubblewrap** | Linux, macOS | Basado en namespaces | Baja | Namespaces de usuario, ligero |
| **Docker** | Cualquiera | Contenedor completo | Alta | Maximo aislamiento pero mayor latencia |
| **None** | Cualquiera | Solo capa de aplicacion | Ninguna | Sin aislamiento a nivel de SO |

## Sanitizacion de entorno

La herramienta shell solo pasa una lista blanca estricta de variables de entorno a los procesos hijo: `PATH`, `HOME`, `TERM`, `LANG`, `LC_ALL`, `LC_CTYPE`, `USER`, `SHELL`, `TMPDIR`. Las claves API, tokens y secretos nunca se exponen.

## Limites de recursos

| Limite | Por defecto | Configurable | Descripcion |
|--------|-------------|-------------|-------------|
| Timeout | 60 segundos | `security.resources.max_cpu_time_seconds` | Tiempo maximo de reloj de pared por comando |
| Tamano de salida | 1 MB | -- | Maximo stdout + stderr combinados |
| Memoria | 512 MB | `security.resources.max_memory_mb` | Uso maximo de memoria por comando |
| Subprocesos | 10 | `security.resources.max_subprocesses` | Maximo de procesos hijo generados |

## Seguridad

- **Aislamiento sandbox**: Los comandos se ejecutan dentro del backend de sandbox configurado
- **Sanitizacion de entorno**: Solo 9 variables de entorno de la lista blanca se pasan a procesos hijo
- **Motor de politicas**: Cada invocacion de shell pasa por el motor de politicas de seguridad antes de la ejecucion
- **Registro de auditoria**: Todos los comandos shell y sus resultados se registran en el log de auditoria
- **Modo supervisado**: La herramienta shell puede marcarse como `supervised` en la politica de herramientas
- **Limites de recursos**: Limites estrictos en timeout, memoria, tamano de salida y conteo de subprocesos

### Mitigacion de amenazas

La herramienta shell es el vector principal para ataques de inyeccion de prompts. PRX mitiga esto a traves de: confinamiento sandbox, eliminacion de entorno, modo de supervision y registro de auditoria.

## Relacionado

- [Sandbox de seguridad](/es/prx/security/sandbox) -- documentacion detallada del backend de sandbox
- [Motor de politicas](/es/prx/security/policy-engine) -- reglas de control de acceso a herramientas
- [Referencia de configuracion](/es/prx/config/reference) -- campos `security.sandbox` y `security.resources`
- [Vision general de herramientas](/es/prx/tools/) -- todas las herramientas y sistema de registro
