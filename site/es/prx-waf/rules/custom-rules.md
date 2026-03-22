---
title: Reglas Personalizadas
description: "Escribe reglas de detección personalizadas para PRX-WAF. Guía paso a paso con ejemplos para control de acceso, bloqueo de bots, limitación de velocidad y protección específica de la aplicación."
---

# Reglas Personalizadas

PRX-WAF facilita la escritura de reglas de detección personalizadas adaptadas a tu aplicación específica. Las reglas personalizadas se escriben en YAML y se colocan en el directorio `rules/custom/`.

## Primeros Pasos

1. Crea un nuevo archivo YAML en `rules/custom/`:

```bash
cp rules/custom/example.yaml rules/custom/myapp.yaml
```

2. Edita el archivo siguiendo el [esquema de reglas YAML](./yaml-syntax).

3. Valida antes de implementar:

```bash
python rules/tools/validate.py rules/custom/myapp.yaml
```

4. Las reglas se recargan automáticamente en caliente, o activa una recarga manual:

```bash
prx-waf rules reload
```

## Ejemplo: Bloquear Acceso a Rutas Internas

Prevenir el acceso externo a endpoints de API internos:

```yaml
version: "1.0"
description: "Block access to internal paths"

rules:
  - id: "CUSTOM-ACCESS-001"
    name: "Block internal API endpoints"
    category: "access-control"
    severity: "high"
    paranoia: 1
    field: "path"
    operator: "regex"
    value: "(?i)^/(internal|_debug|_profiler|actuator)/"
    action: "block"
    tags: ["custom", "access-control"]
```

## Ejemplo: Detectar User-Agents Sospechosos

Registrar solicitudes de herramientas automatizadas para monitoreo:

```yaml
  - id: "CUSTOM-BOT-001"
    name: "Log suspicious automated tool user-agents"
    category: "scanner"
    severity: "medium"
    paranoia: 2
    field: "user_agent"
    operator: "regex"
    value: "(?i)(masscan|zgrab|python-requests/|go-http-client|curl/)"
    action: "log"
    tags: ["custom", "bot", "scanner"]
```

## Ejemplo: Limitar Velocidad por Parámetros de Consulta

Bloquear solicitudes con un número excesivo de parámetros de consulta (común en ataques DoS):

```yaml
  - id: "CUSTOM-DOS-001"
    name: "Block excessive query parameters"
    category: "dos"
    severity: "medium"
    paranoia: 1
    field: "query_arg_count"
    operator: "gt"
    value: "50"
    action: "block"
    tags: ["custom", "dos"]
```

## Ejemplo: Bloquear Extensiones de Archivo Específicas

Prevenir el acceso a archivos de respaldo o configuración:

```yaml
  - id: "CUSTOM-FILE-001"
    name: "Block access to backup and config files"
    category: "access-control"
    severity: "high"
    paranoia: 1
    field: "path"
    operator: "regex"
    value: "(?i)\\.(bak|backup|old|orig|sql|tar|gz|zip|7z|rar|conf|env|ini|log)$"
    action: "block"
    tags: ["custom", "access-control", "file-extension"]
```

## Ejemplo: Detectar Relleno de Credenciales

Detectar intentos rápidos de inicio de sesión (útil junto al limitador de velocidad integrado):

```yaml
  - id: "CUSTOM-AUTH-001"
    name: "Log login endpoint access for monitoring"
    category: "access-control"
    severity: "low"
    paranoia: 1
    field: "path"
    operator: "regex"
    value: "(?i)^/(api/)?(login|signin|authenticate|auth/token)"
    action: "log"
    tags: ["custom", "authentication", "monitoring"]
```

## Ejemplo: Parche Virtual CVE

Crea un parche virtual rápido para una vulnerabilidad específica:

```yaml
  - id: "CUSTOM-CVE-001"
    name: "Virtual patch for MyApp RCE (CVE-2026-XXXXX)"
    category: "rce"
    severity: "critical"
    paranoia: 1
    field: "body"
    operator: "regex"
    value: "(?i)\\$\\{jndi:(ldap|rmi|dns)://[^}]+\\}"
    action: "block"
    tags: ["custom", "cve", "rce"]
    reference: "https://nvd.nist.gov/vuln/detail/CVE-2026-XXXXX"
```

## Usar Scripts Rhai para Lógica Compleja

Para reglas que requieren más que coincidencia de patrones, PRX-WAF admite scripting Rhai en la Fase 12:

```rhai
// rules/custom/scripts/geo-block.rhai
// Block requests from specific countries during maintenance
fn check(ctx) {
    let path = ctx.path;
    let country = ctx.geo_country;

    if path.starts_with("/maintenance") && country != "US" {
        return block("Maintenance mode: US-only access");
    }

    allow()
}
```

::: info
Los scripts Rhai se ejecutan en un entorno con sandbox. No pueden acceder al sistema de archivos, la red ni ningún recurso del sistema fuera del contexto de la solicitud.
:::

## Mejores Prácticas

1. **Comienza con `action: log`** -- Monitorea antes de bloquear para detectar falsos positivos temprano.

2. **Usa anclas regex específicas** -- Usa `^` y `$` para prevenir coincidencias parciales que causan falsos positivos.

3. **Establece niveles de paranoia apropiados** -- Si una regla puede coincidir con tráfico legítimo, establece paranoia en 2 o 3 en lugar de bloquear en el nivel 1.

4. **Usa grupos no capturadores** -- Usa `(?:...)` en lugar de `(...)` para mayor claridad y rendimiento.

5. **Agrega etiquetas descriptivas** -- Las etiquetas aparecen en la interfaz de administración y ayudan a filtrar eventos de seguridad.

6. **Incluye referencias** -- Agrega una URL de `reference` vinculando al CVE relevante, artículo OWASP o documentación interna.

7. **Prueba tu regex** -- Valida los patrones regex antes de implementar:

```bash
python3 -c "import re; re.compile('your_pattern')"
```

8. **Valida antes de implementar** -- Siempre ejecuta el validador:

```bash
python rules/tools/validate.py rules/custom/
```

## Importar vía CLI

También puedes importar reglas desde archivos o URLs usando la CLI:

```bash
# Import from a local file
prx-waf rules import /path/to/rules.yaml

# Import from a URL
prx-waf rules import https://example.com/rules/custom.yaml

# Validate a rule file
prx-waf rules validate /path/to/rules.yaml
```

## Importar Reglas ModSecurity

Convierte las reglas ModSecurity `.conf` existentes al formato YAML de PRX-WAF:

```bash
python rules/tools/modsec2yaml.py input.conf output.yaml
```

::: warning
El convertidor de ModSecurity admite un subconjunto básico de directivas SecRule (ARGS, REQUEST_HEADERS, REQUEST_URI, REQUEST_BODY). Las reglas complejas de ModSecurity con encadenamiento o scripts Lua no son compatibles y deben reescribirse manualmente.
:::

## Próximos Pasos

- [Sintaxis YAML](./yaml-syntax) -- Referencia completa del esquema de reglas
- [Reglas Integradas](./builtin-rules) -- Revisa las reglas existentes antes de escribir nuevas
- [Descripción General del Motor de Reglas](./index) -- Comprende cómo se evalúan las reglas en el pipeline
