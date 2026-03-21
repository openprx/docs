---
title: Operaciones Git
description: Herramienta de control de versiones que soporta status, diff, commit, push, pull, log y operaciones de rama en repositorios del espacio de trabajo.
---

# Operaciones Git

La herramienta `git_operations` proporciona a los agentes PRX capacidades de control de versiones a traves de una interfaz unificada. En lugar de requerir que el agente invoque comandos `git` a traves de la herramienta shell (que esta sujeta a restricciones de sandbox), `git_operations` ofrece una API estructurada y segura para los flujos de trabajo Git mas comunes: verificar estado, ver diffs, crear commits, push, pull, ver historial y gestionar ramas.

La herramienta opera en el repositorio del espacio de trabajo, que es tipicamente el directorio del proyecto donde el agente esta trabajando. Esta registrada en el registro `all_tools()` y siempre esta disponible cuando el agente se ejecuta con el conjunto completo de herramientas.

## Configuracion

```toml
# Politica de herramienta para operaciones git
[security.tool_policy.tools]
git_operations = "allow"    # "allow" | "deny" | "supervised"
```

## Uso

La herramienta `git_operations` acepta un parametro `operation` que especifica la accion Git a realizar:

### status

Verificar el estado actual del repositorio (archivos staged, unstaged, sin rastrear).

### diff

Ver cambios en el arbol de trabajo o entre commits.

### commit

Crear un commit con un mensaje.

### push

Enviar commits al repositorio remoto.

### pull

Traer cambios del repositorio remoto.

### log

Ver historial de commits.

### branch

Listar, crear o cambiar ramas.

## Parametros

| Parametro | Tipo | Requerido | Por defecto | Descripcion |
|-----------|------|-----------|-------------|-------------|
| `operation` | `string` | Si | -- | Operacion Git: `"status"`, `"diff"`, `"commit"`, `"push"`, `"pull"`, `"log"`, `"branch"` |
| `message` | `string` | Condicional | -- | Mensaje de commit (requerido para operacion `"commit"`) |
| `args` | `array` | No | `[]` | Argumentos adicionales pasados al comando Git |

## Seguridad

### Comparado con shell

Usar `git_operations` en lugar de ejecutar `git` a traves de la herramienta `shell` proporciona varias ventajas de seguridad:

- **Validacion de argumentos**: Los parametros se validan antes de la ejecucion, previniendo ataques de inyeccion
- **Salida estructurada**: Los resultados se analizan y devuelven en formato predecible
- **Sin expansion de shell**: Los argumentos se pasan directamente a Git sin interpretacion del shell
- **Politica granular**: `git_operations` puede ser permitida mientras `shell` es denegada o supervisada

### Proteccion contra operaciones destructivas

La herramienta incluye salvaguardas contra operaciones destructivas comunes:

- **Force push**: Los argumentos `--force` y `--force-with-lease` se registran con advertencias
- **Eliminacion de rama**: Las operaciones `-D` (eliminacion forzada) se marcan en el registro de auditoria
- **Operaciones de reset**: Los resets duros no se exponen directamente a traves de la herramienta

## Relacionado

- [Ejecucion shell](/es/prx/tools/shell) -- alternativa para comandos Git avanzados
- [Operaciones de archivo](/es/prx/tools/file-operations) -- leer/escribir archivos en el repositorio
- [Sesiones y agentes](/es/prx/tools/sessions) -- delegar tareas Git a agentes especializados
- [Motor de politicas](/es/prx/security/policy-engine) -- control de acceso para operaciones Git
- [Vision general de herramientas](/es/prx/tools/) -- todas las herramientas y sistema de registro
