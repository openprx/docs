---
title: prx config
description: Inspeccionar y modificar la configuracion de PRX desde la linea de comandos.
---

# prx config

Lee, escribe, valida y transforma el archivo de configuracion de PRX sin editar TOML manualmente.

## Uso

```bash
prx config <SUBCOMANDO> [OPTIONS]
```

## Subcomandos

### `prx config get`

Lee un valor de configuracion por su ruta de clave con puntos.

```bash
prx config get <CLAVE> [OPTIONS]
```

| Opcion | Corta | Por defecto | Descripcion |
|--------|-------|-------------|-------------|
| `--config` | `-c` | `~/.config/prx/config.toml` | Ruta del archivo de configuracion |
| `--json` | `-j` | `false` | Salida del valor en formato JSON |

```bash
# Obtener el proveedor por defecto
prx config get providers.default

# Obtener el puerto del gateway
prx config get gateway.port

# Obtener una seccion completa como JSON
prx config get providers --json
```

### `prx config set`

Establece un valor de configuracion.

```bash
prx config set <CLAVE> <VALOR> [OPTIONS]
```

| Opcion | Corta | Por defecto | Descripcion |
|--------|-------|-------------|-------------|
| `--config` | `-c` | `~/.config/prx/config.toml` | Ruta del archivo de configuracion |

```bash
# Cambiar el proveedor por defecto
prx config set providers.default "anthropic"

# Cambiar el puerto del gateway
prx config set gateway.port 8080

# Establecer un booleano
prx config set evolution.l1.enabled true

# Establecer un valor anidado
prx config set providers.anthropic.default_model "claude-sonnet-4-20250514"
```

### `prx config schema`

Imprime el esquema JSON completo de la configuracion. Util para autocompletado en editores y validacion.

```bash
prx config schema [OPTIONS]
```

| Opcion | Corta | Por defecto | Descripcion |
|--------|-------|-------------|-------------|
| `--output` | `-o` | stdout | Escribir el esquema en un archivo |
| `--format` | | `json` | Formato de salida: `json` o `yaml` |

```bash
# Imprimir esquema en stdout
prx config schema

# Guardar esquema para integracion con editor
prx config schema --output ~/.config/prx/schema.json
```

### `prx config split`

Divide un archivo de configuracion monolitico en archivos por seccion. Esto crea un directorio de configuracion con archivos separados para proveedores, canales, cron, etc.

```bash
prx config split [OPTIONS]
```

| Opcion | Corta | Por defecto | Descripcion |
|--------|-------|-------------|-------------|
| `--config` | `-c` | `~/.config/prx/config.toml` | Archivo de configuracion fuente |
| `--output-dir` | `-o` | `~/.config/prx/config.d/` | Directorio de salida |

```bash
prx config split

# Resultado:
# ~/.config/prx/config.d/
#   providers.toml
#   channels.toml
#   cron.toml
#   memory.toml
#   evolution.toml
#   gateway.toml
#   security.toml
```

### `prx config merge`

Fusiona un directorio de configuracion dividido de nuevo en un unico archivo.

```bash
prx config merge [OPTIONS]
```

| Opcion | Corta | Por defecto | Descripcion |
|--------|-------|-------------|-------------|
| `--input-dir` | `-i` | `~/.config/prx/config.d/` | Directorio fuente |
| `--output` | `-o` | `~/.config/prx/config.toml` | Archivo de salida |
| `--force` | `-f` | `false` | Sobrescribir archivo de salida existente |

```bash
prx config merge --output /etc/prx/config.toml --force
```

## Ejemplos

```bash
# Inspeccion rapida de configuracion
prx config get .  # imprimir toda la configuracion

# Actualizar clave del proveedor
prx config set providers.anthropic.api_key "sk-ant-..."

# Generar esquema para VS Code
prx config schema --output ~/.config/prx/schema.json
# Luego en settings.json de VS Code:
# "json.schemas": [{"fileMatch": ["**/prx/config.toml"], "url": "./schema.json"}]

# Respaldar y dividir para control de versiones
cp ~/.config/prx/config.toml ~/.config/prx/config.toml.bak
prx config split
cd ~/.config/prx/config.d && git init && git add . && git commit -m "initial config"
```

## Relacionado

- [Vision general de configuracion](/es/prx/config/) -- formato y estructura del archivo de configuracion
- [Referencia completa](/es/prx/config/reference) -- todas las opciones de configuracion
- [Recarga en caliente](/es/prx/config/hot-reload) -- recarga de configuracion en tiempo de ejecucion
- [Variables de entorno](/es/prx/config/environment) -- sobreescrituras por variables de entorno
