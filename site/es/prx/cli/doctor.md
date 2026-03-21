---
title: prx doctor
description: Ejecutar diagnosticos del sistema para verificar la salud del demonio, estado de canales y disponibilidad de modelos.
---

# prx doctor

Ejecuta diagnosticos completos de la instalacion de PRX. Verifica la validez de la configuracion, conectividad del demonio, salud de los canales, acceso a la API del proveedor y disponibilidad de modelos.

## Uso

```bash
prx doctor [SUBCOMANDO] [OPTIONS]
```

## Opciones

| Opcion | Corta | Por defecto | Descripcion |
|--------|-------|-------------|-------------|
| `--config` | `-c` | `~/.config/prx/config.toml` | Ruta del archivo de configuracion |
| `--json` | `-j` | `false` | Salida en formato JSON |
| `--verbose` | `-v` | `false` | Mostrar salida detallada de las comprobaciones |
| `--fix` | | `false` | Intentar corregir automaticamente los problemas comunes |

## Subcomandos

### `prx doctor` (sin subcomando)

Ejecuta todas las comprobaciones de diagnostico.

```bash
prx doctor
```

**Ejemplo de salida:**

```
 PRX Doctor
 ══════════════════════════════════════════

 Configuration
   Config file exists ............... OK
   Config file valid ................ OK
   Data directory writable .......... OK

 Daemon
   Daemon running ................... OK (PID 12345)
   Gateway reachable ................ OK (127.0.0.1:3120)
   Uptime ........................... 3d 14h 22m

 Providers
   anthropic ....................... OK (claude-sonnet-4-20250514)
   ollama .......................... OK (llama3, 2 models)
   openai .......................... WARN (key not configured)

 Channels
   telegram-main ................... OK (connected)
   discord-dev ..................... OK (connected)
   slack-team ...................... FAIL (auth error)

 Memory
   Backend (sqlite) ................ OK
   Entries ......................... 1,247

 Evolution
   Engine .......................... OK (running)
   Last L1 cycle ................... 2h ago

 Summary: 10 passed, 1 warning, 1 failure
```

### `prx doctor models`

Verifica la disponibilidad de modelos en todos los proveedores configurados.

```bash
prx doctor models [OPTIONS]
```

| Opcion | Corta | Por defecto | Descripcion |
|--------|-------|-------------|-------------|
| `--provider` | `-P` | todos | Verificar solo un proveedor especifico |

```bash
# Verificar modelos de todos los proveedores
prx doctor models

# Verificar solo modelos de Ollama
prx doctor models --provider ollama
```

**Ejemplo de salida:**

```
 Provider     Model                        Status    Latency
 anthropic    claude-sonnet-4-20250514              OK        245ms
 anthropic    claude-haiku-4-20250514               OK        189ms
 ollama       llama3                       OK        12ms
 ollama       codellama                    OK        15ms
 openai       gpt-4o                       SKIP (no key)
```

## Comprobaciones de diagnostico

El doctor ejecuta las siguientes comprobaciones:

| Categoria | Comprobacion | Descripcion |
|-----------|-------------|-------------|
| Config | Archivo existe | El archivo de configuracion esta presente en la ruta esperada |
| Config | Sintaxis valida | El TOML se analiza sin errores |
| Config | Esquema valido | Todos los valores coinciden con los tipos y rangos esperados |
| Demonio | Proceso en ejecucion | El PID del demonio esta activo |
| Demonio | Gateway accesible | El endpoint HTTP de salud responde |
| Proveedores | Clave API configurada | Las claves API requeridas estan configuradas |
| Proveedores | API accesible | La API del proveedor responde a una solicitud de prueba |
| Canales | Token valido | Los tokens de bot de los canales son aceptados |
| Canales | Conectado | El canal esta activamente conectado |
| Memoria | Backend disponible | El almacen de memoria es accesible |
| Evolucion | Motor en ejecucion | El motor de evolucion esta activo |

## Correccion automatica

La opcion `--fix` intenta resolver los problemas comunes automaticamente:

- Crea directorios de datos faltantes
- Actualiza tokens OAuth expirados
- Reinicia canales desconectados
- Elimina entradas de cache invalidas

```bash
prx doctor --fix
```

## Relacionado

- [prx daemon](./daemon) -- iniciar el demonio si no esta en ejecucion
- [prx channel doctor](./channel) -- diagnosticos detallados de canales
- [Solucion de problemas](/es/prx/troubleshooting/) -- errores comunes y soluciones
- [Guia de diagnosticos](/es/prx/troubleshooting/diagnostics) -- diagnosticos en profundidad
