---
title: Operaciones de archivo
description: Las herramientas file_read y file_write proporcionan acceso al sistema de archivos con validacion de ruta, aplicacion de ACL de memoria e integracion con politicas de seguridad.
---

# Operaciones de archivo

PRX proporciona dos herramientas core de operaciones de archivo -- `file_read` y `file_write` -- que forman parte del conjunto minimo `default_tools()`. Estas herramientas estan siempre disponibles, no requieren configuracion adicional y son la base de la capacidad del agente para interactuar con el sistema de archivos local.

Ambas herramientas estan sujetas al motor de politicas de seguridad. La validacion de ruta asegura que el agente solo pueda acceder a archivos dentro de directorios permitidos. Cuando la ACL de memoria esta habilitada, `file_read` adicionalmente bloquea el acceso a archivos markdown de memoria para prevenir que el agente eluda el control de acceso leyendo el almacenamiento de memoria directamente.

A diferencia de la herramienta `shell`, las operaciones de archivo no generan procesos externos. Estan implementadas como operaciones de E/S directas de Rust dentro del proceso PRX, haciendolas mas rapidas y faciles de auditar que comandos shell equivalentes como `cat` o `echo >`.

## Configuracion

Las operaciones de archivo no tienen una seccion de configuracion dedicada. Su comportamiento se controla a traves del motor de politicas de seguridad y la configuracion de ACL de memoria:

```toml
# La ACL de memoria afecta el comportamiento de file_read
[memory]
acl_enabled = false    # Cuando es true, file_read bloquea acceso a archivos de memoria

# La politica de seguridad puede restringir rutas de acceso a archivos
[security.tool_policy.tools]
file_read = "allow"    # "allow" | "deny" | "supervised"
file_write = "allow"

# Reglas de politica basadas en ruta
[[security.policy.rules]]
name = "allow-workspace-read"
action = "allow"
tools = ["file_read"]
paths = ["/home/user/workspace/**"]

[[security.policy.rules]]
name = "allow-workspace-write"
action = "allow"
tools = ["file_write"]
paths = ["/home/user/workspace/**"]

[[security.policy.rules]]
name = "block-sensitive-paths"
action = "deny"
tools = ["file_read", "file_write"]
paths = ["/etc/shadow", "/root/**", "**/.ssh/**", "**/.env"]
```

## Uso

### file_read

La herramienta `file_read` lee el contenido de archivos y los devuelve como cadena.

```json
{
  "name": "file_read",
  "arguments": {
    "path": "/home/user/project/src/main.rs"
  }
}
```

### file_write

La herramienta `file_write` escribe contenido en un archivo, creandolo si no existe o sobrescribiendo su contenido si existe.

```json
{
  "name": "file_write",
  "arguments": {
    "path": "/home/user/project/src/config.toml",
    "content": "[server]\nport = 8080\nhost = \"0.0.0.0\"\n"
  }
}
```

## Parametros

### Parametros de file_read

| Parametro | Tipo | Requerido | Por defecto | Descripcion |
|-----------|------|-----------|-------------|-------------|
| `path` | `string` | Si | -- | Ruta absoluta o relativa al archivo a leer |

### Parametros de file_write

| Parametro | Tipo | Requerido | Por defecto | Descripcion |
|-----------|------|-----------|-------------|-------------|
| `path` | `string` | Si | -- | Ruta absoluta o relativa al archivo a escribir |
| `content` | `string` | Si | -- | El contenido a escribir en el archivo |

## Validacion de ruta

Ambas herramientas realizan validacion de ruta antes de ejecutar la operacion de E/S:

1. **Normalizacion de ruta** -- las rutas relativas se resuelven contra el directorio de trabajo actual. Los enlaces simbolicos se resuelven para detectar travesia de ruta.
2. **Verificacion de politica** -- la ruta resuelta se verifica contra las reglas de politica de seguridad.
3. **Bloqueo de rutas especiales** -- ciertas rutas se bloquean siempre independientemente de la politica:
   - `/proc/`, `/sys/` (interfaces del kernel Linux)
   - Archivos de dispositivo en `/dev/` (excepto `/dev/null`, `/dev/urandom`)
   - Archivos de almacenamiento de memoria cuando `memory.acl_enabled = true`

## Aplicacion de ACL de memoria

Cuando `memory.acl_enabled = true`, la herramienta `file_read` aplica restricciones adicionales:

- **Archivos de memoria bloqueados**: `file_read` rechaza leer archivos markdown almacenados en el directorio de memoria
- **memory_recall deshabilitado**: La herramienta `memory_recall` se elimina completamente del registro de herramientas cuando ACL esta habilitada
- **Acceso dirigido solamente**: El agente debe usar `memory_get` o `memory_search` con verificaciones ACL apropiadas para acceder al contenido de memoria

## Seguridad

### Integracion con motor de politicas

Cada llamada a `file_read` y `file_write` pasa por el motor de politicas de seguridad antes de la ejecucion.

### Registro de auditoria

Cuando el registro de auditoria esta habilitado, cada operacion de archivo se registra con marca de tiempo, nombre de herramienta, ruta de archivo resuelta, estado de exito/fallo y motivo de error (si fue denegado o fallo).

### Proteccion de archivos sensibles

La politica de seguridad por defecto bloquea acceso a rutas sensibles comunes: claves SSH (`~/.ssh/`), archivos de entorno (`.env`), credenciales Git, historial de shell y archivos de contrasenas del sistema.

### Manejo de archivos binarios

La herramienta `file_read` lee archivos como cadenas UTF-8. Los archivos binarios produciran salida ilegible o errores de codificacion. Se espera que el agente use la herramienta `shell` con comandos apropiados para inspeccion de archivos binarios.

## Relacionado

- [Ejecucion shell](/es/prx/tools/shell) -- herramienta de ejecucion de comandos (alternativa para archivos binarios)
- [Herramientas de memoria](/es/prx/tools/memory) -- acceso controlado a memoria con ACL
- [Motor de politicas](/es/prx/security/policy-engine) -- reglas de control de acceso basadas en ruta
- [Vision general de herramientas](/es/prx/tools/) -- todas las herramientas y sistema de registro
