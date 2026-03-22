---
title: Descripción General del Motor de Reglas
description: "Cómo funciona el motor de reglas de PRX-WAF. Reglas declarativas basadas en YAML, múltiples fuentes de reglas, niveles de paranoia, recarga en caliente y el pipeline de detección de 16 fases."
---

# Motor de Reglas

PRX-WAF utiliza un motor de reglas declarativo basado en YAML para detectar y bloquear ataques web. Las reglas describen qué inspeccionar, cómo coincidir y qué acción tomar. El motor evalúa cada solicitud entrante contra todas las reglas habilitadas a través de 16 fases de detección secuenciales.

## Cómo Funcionan las Reglas

Cada regla consta de cuatro componentes clave:

1. **Campo** -- Qué parte de la solicitud inspeccionar (ruta, consulta, cuerpo, encabezados, etc.)
2. **Operador** -- Cómo coincidir el valor (regex, contains, detect_sqli, etc.)
3. **Valor** -- El patrón o umbral con el que coincidir
4. **Acción** -- Qué hacer cuando la regla coincide (block, log, allow)

```yaml
- id: "CUSTOM-001"
  name: "Block admin path from external IPs"
  category: "access-control"
  severity: "high"
  field: "path"
  operator: "regex"
  value: "(?i)^/admin"
  action: "block"
```

## Fuentes de Reglas

PRX-WAF incluye 398 reglas en cuatro categorías:

| Fuente | Archivos | Reglas | Descripción |
|--------|----------|--------|-------------|
| OWASP CRS | 21 | 310 | OWASP ModSecurity Core Rule Set v4 (convertido a YAML) |
| ModSecurity | 4 | 46 | Reglas comunitarias para reputación de IPs, DoS, filtración de datos |
| Parches CVE | 7 | 39 | Parches virtuales para Log4Shell, Spring4Shell, MOVEit, etc. |
| Personalizado | 1 | 3 | Plantillas de ejemplo para reglas específicas de la aplicación |

Además, PRX-WAF incluye más de 10 verificadores de detección integrados compilados en el binario:

- Inyección SQL (libinjection + regex)
- Cross-site scripting (libinjection + regex)
- Ejecución remota de código / inyección de comandos
- Inclusión de archivos local/remota
- Server-side request forgery (SSRF)
- Path/directory traversal
- Detección de escáneres (Nmap, Nikto, etc.)
- Detección de bots (bots maliciosos, rastreadores de IA, navegadores sin cabeza)
- Detección de violaciones de protocolo
- Detección de palabras sensibles (coincidencia multi-patrón Aho-Corasick)

## Formatos de Reglas

PRX-WAF admite tres formatos de archivos de reglas:

| Formato | Extensión | Descripción |
|---------|-----------|-------------|
| YAML | `.yaml`, `.yml` | Formato nativo de PRX-WAF (recomendado) |
| ModSecurity | `.conf` | Directivas SecRule (subconjunto básico: ARGS, REQUEST_HEADERS, REQUEST_URI, REQUEST_BODY) |
| JSON | `.json` | Array JSON de objetos de reglas |

Consulta [Sintaxis YAML](./yaml-syntax) para la referencia completa del esquema.

## Niveles de Paranoia

Cada regla declara un nivel de paranoia (1-4) que controla cuán agresivamente coincide. Los niveles más altos capturan más ataques pero aumentan el riesgo de falsos positivos.

| Nivel | Nombre | Descripción | Riesgo de Falsos Positivos |
|-------|--------|-------------|---------------------------|
| 1 | Predeterminado | Reglas de alta confianza, seguras para producción | Muy bajo |
| 2 | Recomendado | Mayor cobertura, riesgo mínimo de FP | Bajo |
| 3 | Agresivo | Heurísticas extensas, requiere ajuste | Moderado |
| 4 | Máximo | Todo, incluyendo patrones especulativos | Alto |

::: tip
Comienza con el nivel de paranoia 1 en producción. Monitorea los registros, ajusta las exclusiones y luego habilita gradualmente niveles más altos.
:::

## Recarga en Caliente

PRX-WAF observa el directorio `rules/` para cambios en archivos y recarga automáticamente las reglas cuando se crea, modifica o elimina un archivo. Los cambios surten efecto dentro de la ventana de debounce configurada (predeterminado: 500ms).

También puedes activar una recarga manual:

```bash
# Via CLI
prx-waf rules reload

# Via SIGHUP (Unix only)
kill -HUP $(pgrep prx-waf)
```

Las recargas de reglas son atómicas -- el conjunto de reglas anterior continúa sirviendo tráfico hasta que el nuevo conjunto está completamente compilado y listo.

## Estructura de Directorios

```
rules/
├── owasp-crs/          # OWASP CRS v4 (21 files, 310 rules)
│   ├── sqli.yaml       # SQL injection (CRS 942xxx)
│   ├── xss.yaml        # Cross-site scripting (CRS 941xxx)
│   ├── rce.yaml        # Remote code execution (CRS 932xxx)
│   └── ...
├── modsecurity/        # ModSecurity community rules
├── cve-patches/        # CVE virtual patches (Log4Shell, Spring4Shell, etc.)
├── custom/             # Your application-specific rules
└── tools/              # Rule validation and sync utilities
```

## Próximos Pasos

- [Sintaxis YAML](./yaml-syntax) -- Referencia completa del esquema de reglas
- [Reglas Integradas](./builtin-rules) -- Cobertura detallada de OWASP CRS y parches CVE
- [Reglas Personalizadas](./custom-rules) -- Escribe tus propias reglas de detección
