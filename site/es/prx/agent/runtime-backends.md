---
title: Backends de runtime
description: Backends de ejecucion intercambiables en PRX -- runtimes Nativo, Docker y WASM para ejecucion de herramientas y comandos.
---

# Backends de runtime

PRX soporta multiples backends de ejecucion para ejecutar herramientas, comandos y procesos externos. El subsistema de runtime abstrae el entorno de ejecucion detras del trait `RuntimeAdapter`, permitiendote cambiar entre ejecucion de procesos locales, contenedores Docker y sandboxes WebAssembly sin modificar la configuracion de tu agente.

## Vision general

Cuando un agente ejecuta una herramienta que requiere ejecutar un comando externo (scripts de shell, servidores MCP, integraciones de skills), el backend de runtime determina como se ejecuta ese comando:

| Backend | Aislamiento | Sobrecarga | Caso de uso |
|---------|-------------|------------|-------------|
| **Native** | Nivel de proceso | Minima | Desarrollo, entornos de confianza |
| **Docker** | Nivel de contenedor | Moderada | Produccion, herramientas no confiables, reproducibilidad |
| **WASM** | Nivel de sandbox | Baja | Skills portables, maximo aislamiento, sistema de plugins |

```
Agent Loop
    │
    ├── Tool Call: "shell" with command "ls -la"
    │
    ▼
┌───────────────────────────────────┐
│         RuntimeAdapter            │
│  ┌─────────┬─────────┬─────────┐ │
│  │ Native  │ Docker  │  WASM   │ │
│  │ Runtime │ Runtime │ Runtime │ │
│  └────┬────┴────┬────┴────┬────┘ │
└───────┼─────────┼─────────┼──────┘
        │         │         │
   ┌────▼────┐ ┌──▼───┐ ┌──▼────┐
   │ Process │ │ ctr  │ │ wasmr │
   │ spawn   │ │ exec │ │ exec  │
   └─────────┘ └──────┘ └───────┘
```

## Trait RuntimeAdapter

Todos los backends implementan el trait `RuntimeAdapter`:

```rust
#[async_trait]
pub trait RuntimeAdapter: Send + Sync {
    async fn execute(&self, command: &str, args: &[String],
        env: &HashMap<String, String>, working_dir: Option<&Path>,
        timeout: Duration) -> Result<ExecutionOutput>;
    async fn is_available(&self) -> bool;
    fn name(&self) -> &str;
}
```

`ExecutionOutput` contiene `stdout`, `stderr`, `exit_code` y `duration`.

## Configuracion

Selecciona y configura el backend de runtime en `config.toml`:

```toml
[runtime]
# Backend selection: "native" | "docker" | "wasm" | "auto"
backend = "auto"

# Global execution timeout (can be overridden per-tool).
default_timeout_secs = 60

# Maximum output size captured from stdout/stderr.
max_output_bytes = 1048576  # 1 MB

# Environment variable whitelist. Only these variables are
# passed to child processes (all backends).
env_whitelist = ["PATH", "HOME", "TERM", "LANG", "USER"]
```

### Auto-deteccion

Cuando `backend = "auto"`, PRX selecciona el runtime segun disponibilidad:

1. Si Docker esta ejecutandose y accesible, usa Docker
2. Si hay un runtime WASM disponible, usa WASM para herramientas compatibles
3. Recurre a Native

La auto-deteccion se ejecuta una vez al iniciar y registra en logs el backend seleccionado.

## Runtime nativo

El runtime nativo genera comandos como procesos hijo locales usando `tokio::process::Command`. Es el backend mas simple y rapido, sin dependencias adicionales.

### Configuracion

```toml
[runtime]
backend = "native"

[runtime.native]
# Shell to use for command execution.
shell = "/bin/bash"

# Additional environment variables to set.
[runtime.native.env]
RUSTFLAGS = "-D warnings"
```

### Caracteristicas

| Propiedad | Valor |
|-----------|-------|
| Aislamiento | Solo nivel de proceso (hereda permisos del usuario) |
| Tiempo de inicio | < 10ms |
| Acceso al sistema de archivos | Completo (limitado por permisos de usuario y sandbox) |
| Acceso a red | Completo (limitado por sandbox) |
| Dependencias | Ninguna |
| Plataforma | Todas (Linux, macOS, Windows) |

### Consideraciones de seguridad

El runtime nativo no proporciona aislamiento mas alla de los limites estandar de procesos Unix. Los comandos se ejecutan con los mismos permisos que el proceso PRX. Siempre combinalo con el [subsistema de sandbox](/es/prx/security/sandbox) al ejecutar comandos no confiables:

```toml
[runtime]
backend = "native"

[security.sandbox]
backend = "bubblewrap"
allow_network = false
writable_paths = ["/tmp"]
```

## Runtime Docker

El runtime Docker ejecuta comandos dentro de contenedores efimeros. Cada ejecucion crea un nuevo contenedor, ejecuta el comando, captura la salida y destruye el contenedor.

### Configuracion

```toml
[runtime]
backend = "docker"

[runtime.docker]
image = "debian:bookworm-slim"
socket = "/var/run/docker.sock"
memory_limit = "256m"
cpu_limit = "1.0"
pids_limit = 100
network = "none"          # "none" | "bridge" | "host"
mount_workspace = true
workspace_mount_path = "/workspace"
auto_pull = true
auto_remove = true
```

El tiempo de inicio es de 500ms-2s dependiendo de la imagen. El acceso al sistema de archivos se limita al contenedor mas los volumenes montados explicitamente.

### Seguridad

El runtime Docker proporciona fuerte aislamiento por defecto: aislamiento de red (`network = "none"`), limites de recursos (memoria/CPU/PID), sistema de archivos raiz de solo lectura, sin modo privilegiado y eliminacion automatica del contenedor despues de la ejecucion. Se soportan sobreescrituras de imagen por herramienta via `[runtime.docker.tool_images]`.

## Runtime WASM

El runtime WASM (WebAssembly) ejecuta herramientas compiladas a modulos `.wasm`. WASM proporciona ejecucion portable y aislada con control de capacidades detallado via WASI (WebAssembly System Interface).

### Configuracion

```toml
[runtime]
backend = "wasm"

[runtime.wasm]
# WASM runtime engine: "wasmtime" | "wasmer"
engine = "wasmtime"

# Directory containing .wasm modules.
module_path = "~/.local/share/openprx/wasm/"

# WASI capabilities granted to WASM modules.
[runtime.wasm.capabilities]
filesystem_read = ["/workspace"]
filesystem_write = ["/tmp"]
network = false
env_vars = ["HOME", "USER"]

# Maximum execution time for a single WASM call.
timeout_secs = 30

# Maximum memory allocation for WASM modules.
max_memory_mb = 128
```

### Caracteristicas

| Propiedad | Valor |
|-----------|-------|
| Aislamiento | Sandbox WASM (basado en capacidades) |
| Tiempo de inicio | 10-50ms |
| Acceso al sistema de archivos | Solo directorios pre-abiertos de WASI |
| Acceso a red | Configurable via WASI |
| Dependencias | Runtime `wasmtime` o `wasmer` (compilacion condicional) |
| Plataforma | Todas (WASM es independiente de plataforma) |

### Compilacion condicional

El runtime WASM se compila condicionalmente detras de un feature flag:

```bash
# Build PRX with WASM support
cargo build --release --features wasm-runtime
```

Sin el feature flag, el backend WASM no esta disponible y `backend = "auto"` lo omitira.

### Sistema de plugins

El runtime WASM potencia el sistema de plugins de PRX. Los skills distribuidos como modulos `.wasm` pueden cargarse dinamicamente sin confiar en codigo nativo. Registra herramientas WASM en `config.toml` bajo `[tools.custom.<name>]` con `type = "wasm"` y una ruta `module`.

## Funcion factory

PRX usa una funcion factory (`create_runtime`) para seleccionar el backend al iniciar. Mapea la cadena `backend` configurada a la implementacion apropiada de `RuntimeAdapter` y valida que el backend este disponible (ej., daemon Docker ejecutandose, motor WASM compilado).

## Matriz de comparacion

| Caracteristica | Native | Docker | WASM |
|---------------|--------|--------|------|
| Complejidad de configuracion | Ninguna | Daemon Docker | Feature flag + modulos |
| Latencia de inicio | < 10ms | 500ms - 2s | 10-50ms |
| Fortaleza de aislamiento | Baja | Alta | Alta |
| Control de recursos | Limites del SO | cgroups | Limites de memoria WASM |
| Aislamiento de red | Via sandbox | Integrado | Capacidad WASI |
| Aislamiento de sistema de archivos | Via sandbox | Integrado | Pre-opens de WASI |
| Portabilidad | Nativo de plataforma | Imagenes OCI | Independiente de plataforma |
| Compatibilidad de herramientas | Todas | Todas (con imagen) | Solo compiladas a WASM |

## Notas de seguridad

- El backend de runtime es una capa de defensa, no un reemplazo para el [sandbox](/es/prx/security/sandbox). Ambos sistemas trabajan juntos -- el runtime proporciona el entorno de ejecucion, el sandbox agrega restricciones a nivel de SO.
- El runtime Docker requiere acceso al socket de Docker, que en si mismo es un recurso privilegiado. Ejecuta PRX bajo una cuenta de servicio dedicada.
- Los modulos WASM no tienen autoridad ambiental. Cada capacidad (sistema de archivos, red, entorno) debe ser otorgada explicitamente.
- La configuracion `env_whitelist` aplica a todos los backends. Las claves API y secretos nunca se pasan a los entornos de ejecucion de herramientas.

## Paginas relacionadas

- [Arquitectura del runtime del agente](/es/prx/agent/runtime)
- [Sandbox](/es/prx/security/sandbox)
- [Skillforge](/es/prx/tools/skillforge)
- [Session Worker](/es/prx/agent/session-worker)
- [Vision general de herramientas](/es/prx/tools/)
