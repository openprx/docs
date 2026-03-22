---
title: Sintaxis de Reglas YAML
description: "Referencia completa para el formato de reglas YAML de PRX-WAF. Esquema, referencia de campos, referencia de operadores, referencia de acciones y ejemplos anotados."
---

# Sintaxis de Reglas YAML

Esta página documenta el esquema completo de reglas YAML utilizado por PRX-WAF. Cada archivo de reglas sigue esta estructura.

## Estructura del Archivo

Cada archivo de reglas YAML tiene una sección de metadatos de nivel superior seguida de una lista de reglas:

```yaml
version: "1.0"                     # Schema version (required)
description: "Short description"   # Human-readable label (required)
source: "OWASP CRS v4.25.0"       # Origin of the rules (optional)
license: "Apache-2.0"             # SPDX license identifier (optional)

rules:
  - <rule>
  - <rule>
```

## Esquema de Regla

Cada regla en la lista `rules` tiene los siguientes campos:

```yaml
- id: "CRS-942100"              # Unique string ID (REQUIRED)
  name: "SQL injection attack"  # Short description (REQUIRED)
  category: "sqli"              # Category tag (REQUIRED)
  severity: "critical"          # Severity level (REQUIRED)
  paranoia: 1                   # Paranoia level 1-4 (optional, default: 1)
  field: "all"                  # Request field to inspect (REQUIRED)
  operator: "regex"             # Match operator (REQUIRED)
  value: "(?i)select.+from"     # Pattern or threshold (REQUIRED)
  action: "block"               # Action on match (REQUIRED)
  tags:                         # String tags (optional)
    - "owasp-crs"
    - "sqli"
  crs_id: 942100                # Original CRS numeric ID (optional)
  reference: "https://..."      # CVE or documentation link (optional)
```

### Campos Requeridos

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | `string` | Identificador único en todos los archivos de reglas. Formato: `<PREFIJO>-<CATEGORÍA>-<NNN>` |
| `name` | `string` | Descripción breve legible (máximo ~120 caracteres) |
| `category` | `string` | Etiqueta de categoría para filtrado y generación de informes |
| `severity` | `string` | Uno de: `critical`, `high`, `medium`, `low`, `info`, `notice`, `warning`, `error`, `unknown` |
| `field` | `string` | Qué parte de la solicitud inspeccionar (consulta la Referencia de Campos) |
| `operator` | `string` | Cómo coincidir el valor (consulta la Referencia de Operadores) |
| `value` | `string` | Patrón, umbral o nombre de archivo de lista de palabras |
| `action` | `string` | Qué hacer cuando la regla coincide (consulta la Referencia de Acciones) |

### Campos Opcionales

| Campo | Tipo | Predeterminado | Descripción |
|-------|------|----------------|-------------|
| `paranoia` | `integer` | `1` | Nivel de paranoia 1-4 |
| `tags` | `string[]` | `[]` | Etiquetas para filtrado y visualización en el panel |
| `crs_id` | `integer` | -- | ID numérico original de OWASP CRS |
| `reference` | `string` | -- | URL al CVE, artículo OWASP o justificación |

## Referencia de Campos

El valor de `field` determina qué parte de la solicitud HTTP se inspecciona:

| Campo | Inspecciona |
|-------|-------------|
| `path` | Ruta del URI de solicitud (sin cadena de consulta) |
| `query` | Cadena de consulta (todos los parámetros, decodificados) |
| `body` | Cuerpo de la solicitud (decodificado) |
| `headers` | Todos los encabezados de solicitud (pares nombre: valor) |
| `user_agent` | Solo el encabezado User-Agent |
| `cookies` | Cookies de la solicitud |
| `method` | Método HTTP (GET, POST, PUT, etc.) |
| `content_type` | Encabezado Content-Type |
| `content_length` | Valor Content-Length (para comparación numérica) |
| `path_length` | Longitud de la ruta del URI (para comparación numérica) |
| `query_arg_count` | Número de parámetros de consulta (para comparación numérica) |
| `all` | Todos los campos anteriores combinados |

## Referencia de Operadores

El valor de `operator` determina cómo se compara el `value` con el campo inspeccionado:

| Operador | Descripción | Formato del Valor |
|----------|-------------|-------------------|
| `regex` | Expresión regular compatible con PCRE | Patrón regex |
| `contains` | El campo contiene la cadena literal | Cadena literal |
| `equals` | El campo es exactamente igual al valor (sensible a mayúsculas) | Cadena literal |
| `not_in` | El valor del campo NO está en la lista | Lista separada por comas |
| `gt` | El valor del campo (numérico) es mayor que | Cadena numérica |
| `lt` | El valor del campo (numérico) es menor que | Cadena numérica |
| `ge` | El valor del campo (numérico) es mayor o igual que | Cadena numérica |
| `le` | El valor del campo (numérico) es menor o igual que | Cadena numérica |
| `detect_sqli` | Detección de inyección SQL vía libinjection | `"true"` o `""` |
| `detect_xss` | Detección de XSS vía libinjection | `"true"` o `""` |
| `pm_from_file` | Coincidencia de frases contra archivo de lista de palabras | Nombre de archivo en `owasp-crs/data/` |
| `pm` | Coincidencia de frases contra lista en línea | Frases separadas por comas |

## Referencia de Acciones

El valor de `action` determina qué ocurre cuando una regla coincide:

| Acción | Descripción |
|--------|-------------|
| `block` | Rechaza la solicitud con una respuesta 403 Forbidden |
| `log` | Permite la solicitud pero registra la coincidencia (modo de monitoreo) |
| `allow` | Permite explícitamente la solicitud (anula otras reglas) |
| `deny` | Alias de `block` |
| `redirect` | Redirige la solicitud (configuración específica del motor) |
| `drop` | Abandona silenciosamente la conexión |

::: tip
Comienza las nuevas reglas con `action: log` para monitorear falsos positivos antes de cambiar a `action: block`.
:::

## Convención de Espacio de Nombres de IDs

Los IDs de reglas deben seguir la convención de prefijos establecida:

| Directorio | Prefijo de ID | Ejemplo |
|------------|---------------|---------|
| `owasp-crs/` | `CRS-<número>` | `CRS-942100` |
| `modsecurity/` | `MODSEC-<CATEGORÍA>-<NNN>` | `MODSEC-IP-001` |
| `cve-patches/` | `CVE-<AÑO>-<CORTO>-<NNN>` | `CVE-2021-LOG4J-001` |
| `custom/` | `CUSTOM-<CATEGORÍA>-<NNN>` | `CUSTOM-API-001` |

## Ejemplo Completo

```yaml
version: "1.0"
description: "Application-specific access control rules"
source: "custom"
license: "Apache-2.0"

rules:
  - id: "CUSTOM-API-001"
    name: "Block access to internal admin API"
    category: "access-control"
    severity: "high"
    paranoia: 1
    field: "path"
    operator: "regex"
    value: "(?i)^/internal/"
    action: "block"
    tags: ["custom", "access-control"]

  - id: "CUSTOM-BOT-001"
    name: "Log suspicious automated tool user-agents"
    category: "scanner"
    severity: "medium"
    paranoia: 2
    field: "user_agent"
    operator: "regex"
    value: "(?i)(masscan|zgrab|python-requests/|go-http-client)"
    action: "log"
    tags: ["custom", "bot", "scanner"]

  - id: "CUSTOM-RATE-001"
    name: "Block requests with excessive query parameters"
    category: "dos"
    severity: "medium"
    paranoia: 1
    field: "query_arg_count"
    operator: "gt"
    value: "50"
    action: "block"
    tags: ["custom", "dos"]
```

## Validación de Reglas

Valida tus archivos de reglas antes de implementar:

```bash
# Validate all rules
python rules/tools/validate.py rules/

# Validate a specific file
python rules/tools/validate.py rules/custom/myapp.yaml
```

El validador verifica:
- Los campos requeridos están presentes
- No hay IDs de reglas duplicados en todos los archivos
- Los valores de severidad y acción son válidos
- Los niveles de paranoia están en el rango 1-4
- Los regex compilan correctamente
- Los operadores numéricos no se usan con valores de cadena

## Próximos Pasos

- [Reglas Integradas](./builtin-rules) -- Explora las reglas OWASP CRS y los parches CVE
- [Reglas Personalizadas](./custom-rules) -- Escribe tus propias reglas paso a paso
- [Descripción General del Motor de Reglas](./index) -- Cómo el pipeline de detección procesa las reglas
