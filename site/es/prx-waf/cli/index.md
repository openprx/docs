---
title: Referencia de Comandos CLI
description: "Referencia completa de todos los comandos y subcomandos CLI de PRX-WAF. Gestión del servidor, operaciones de reglas, integración con CrowdSec y detección de bots."
---

# Referencia de Comandos CLI

La interfaz de línea de comandos `prx-waf` proporciona comandos para la gestión del servidor, operaciones de reglas, integración con CrowdSec y detección de bots.

## Opciones Globales

| Indicador | Predeterminado | Descripción |
|-----------|----------------|-------------|
| `-c, --config <FILE>` | `configs/default.toml` | Ruta al archivo de configuración TOML |

```bash
prx-waf -c /etc/prx-waf/config.toml <COMMAND>
```

## Comandos del Servidor

| Comando | Descripción |
|---------|-------------|
| `prx-waf run` | Iniciar el proxy inverso + API de gestión (bloquea indefinidamente) |
| `prx-waf migrate` | Ejecutar solo las migraciones de la base de datos |
| `prx-waf seed-admin` | Crear el usuario administrador predeterminado (admin/admin) |

```bash
# Start the server
prx-waf -c configs/default.toml run

# Run migrations before first start
prx-waf -c configs/default.toml migrate

# Create admin user
prx-waf -c configs/default.toml seed-admin
```

::: tip
Para la configuración inicial, ejecuta `migrate` y `seed-admin` antes de `run`. Los inicios posteriores solo necesitan `run` -- las migraciones se verifican automáticamente.
:::

## Gestión de Reglas

Comandos para gestionar las reglas de detección. Todos los comandos de reglas operan en el directorio de reglas configurado.

| Comando | Descripción |
|---------|-------------|
| `prx-waf rules list` | Listar todas las reglas cargadas |
| `prx-waf rules list --category <CAT>` | Filtrar reglas por categoría |
| `prx-waf rules list --source <SRC>` | Filtrar reglas por fuente |
| `prx-waf rules info <RULE-ID>` | Mostrar información detallada sobre una regla |
| `prx-waf rules enable <RULE-ID>` | Habilitar una regla deshabilitada |
| `prx-waf rules disable <RULE-ID>` | Deshabilitar una regla |
| `prx-waf rules reload` | Recargar en caliente todas las reglas desde el disco |
| `prx-waf rules validate <PATH>` | Validar un archivo de reglas por su corrección |
| `prx-waf rules import <PATH\|URL>` | Importar reglas desde un archivo o URL |
| `prx-waf rules export [--format yaml]` | Exportar el conjunto de reglas actual |
| `prx-waf rules update` | Obtener las últimas reglas de fuentes remotas |
| `prx-waf rules search <QUERY>` | Buscar reglas por nombre o descripción |
| `prx-waf rules stats` | Mostrar estadísticas de reglas |

### Ejemplos

```bash
# List all SQL injection rules
prx-waf rules list --category sqli

# List OWASP CRS rules
prx-waf rules list --source owasp

# Show details for a specific rule
prx-waf rules info CRS-942100

# Disable a rule causing false positives
prx-waf rules disable CRS-942100

# Hot-reload after editing rules
prx-waf rules reload

# Validate custom rules before deploying
prx-waf rules validate rules/custom/myapp.yaml

# Import rules from a URL
prx-waf rules import https://example.com/rules/custom.yaml

# Export all rules as YAML
prx-waf rules export --format yaml > all-rules.yaml

# View statistics
prx-waf rules stats
```

## Gestión de Fuentes de Reglas

Comandos para gestionar fuentes de reglas remotas.

| Comando | Descripción |
|---------|-------------|
| `prx-waf sources list` | Listar las fuentes de reglas configuradas |
| `prx-waf sources add <NAME> <URL>` | Agregar una fuente de reglas remota |
| `prx-waf sources remove <NAME>` | Eliminar una fuente de reglas |
| `prx-waf sources update [NAME]` | Obtener la última versión de una fuente específica (o todas) |
| `prx-waf sources sync` | Sincronizar todas las fuentes remotas |

### Ejemplos

```bash
# List all sources
prx-waf sources list

# Add a custom source
prx-waf sources add my-rules https://example.com/rules/latest.yaml

# Sync all sources
prx-waf sources sync

# Update a specific source
prx-waf sources update owasp-crs
```

## Integración con CrowdSec

Comandos para gestionar la integración de inteligencia de amenazas de CrowdSec.

| Comando | Descripción |
|---------|-------------|
| `prx-waf crowdsec status` | Mostrar el estado de la integración con CrowdSec |
| `prx-waf crowdsec decisions` | Listar las decisiones activas de LAPI |
| `prx-waf crowdsec test` | Probar la conectividad con LAPI |
| `prx-waf crowdsec setup` | Asistente interactivo de configuración de CrowdSec |

### Ejemplos

```bash
# Check integration status
prx-waf crowdsec status

# List active block/captcha decisions
prx-waf crowdsec decisions

# Test connectivity to CrowdSec LAPI
prx-waf crowdsec test

# Run the setup wizard
prx-waf crowdsec setup
```

## Detección de Bots

Comandos para gestionar las reglas de detección de bots.

| Comando | Descripción |
|---------|-------------|
| `prx-waf bot list` | Listar las firmas de bots conocidos |
| `prx-waf bot add <PATTERN> [--action ACTION]` | Agregar un patrón de detección de bots |
| `prx-waf bot remove <PATTERN>` | Eliminar un patrón de detección de bots |
| `prx-waf bot test <USER-AGENT>` | Probar un user-agent contra las reglas de bots |

### Ejemplos

```bash
# List all bot signatures
prx-waf bot list

# Add a new bot pattern
prx-waf bot add "(?i)my-bad-bot" --action block

# Add a bot pattern in log-only mode
prx-waf bot add "(?i)suspicious-crawler" --action log

# Test a user-agent string
prx-waf bot test "Mozilla/5.0 (compatible; Googlebot/2.1)"

# Remove a bot pattern
prx-waf bot remove "(?i)my-bad-bot"
```

## Patrones de Uso

### Configuración Inicial

```bash
# 1. Run migrations
prx-waf -c configs/default.toml migrate

# 2. Create admin user
prx-waf -c configs/default.toml seed-admin

# 3. Start the server
prx-waf -c configs/default.toml run
```

### Flujo de Mantenimiento de Reglas

```bash
# 1. Check for upstream rule updates
prx-waf rules update

# 2. Validate after update
prx-waf rules validate rules/

# 3. Review changes
prx-waf rules stats

# 4. Hot-reload
prx-waf rules reload
```

### Configuración de la Integración con CrowdSec

```bash
# 1. Run the setup wizard
prx-waf crowdsec setup

# 2. Test connectivity
prx-waf crowdsec test

# 3. Verify decisions are flowing
prx-waf crowdsec decisions
```

## Próximos Pasos

- [Inicio Rápido](../getting-started/quickstart) -- Comenzar con PRX-WAF
- [Motor de Reglas](../rules/) -- Comprender el pipeline de detección
- [Referencia de Configuración](../configuration/reference) -- Todas las claves de configuración
