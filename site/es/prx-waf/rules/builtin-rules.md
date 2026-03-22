---
title: Reglas Integradas
description: "PRX-WAF incluye 398 reglas YAML que cubren OWASP CRS, reglas comunitarias de ModSecurity y parches virtuales CVE dirigidos. Inventario completo y desglose por categorías."
---

# Reglas Integradas

PRX-WAF incluye 398 reglas precompiladas en tres categorías, más más de 10 verificadores de detección compilados en el binario. Juntos, proporcionan una cobertura completa del OWASP Top 10 y exploits de CVE conocidos.

## OWASP Core Rule Set (310 reglas)

Las reglas OWASP CRS son convertidas del [OWASP ModSecurity Core Rule Set v4](https://github.com/coreruleset/coreruleset) al formato YAML nativo de PRX-WAF. Cubren los vectores de ataque web más comunes:

| Archivo | IDs CRS | Reglas | Categoría |
|---------|---------|--------|-----------|
| `sqli.yaml` | 942xxx | ~87 | Inyección SQL |
| `xss.yaml` | 941xxx | ~41 | Cross-site scripting |
| `rce.yaml` | 932xxx | ~30 | Ejecución remota de código |
| `lfi.yaml` | 930xxx | ~20 | Inclusión de archivos local |
| `rfi.yaml` | 931xxx | ~12 | Inclusión de archivos remota |
| `php-injection.yaml` | 933xxx | ~18 | Inyección PHP |
| `java-injection.yaml` | 944xxx | ~15 | Inyección Java / Expression Language |
| `generic-attack.yaml` | 934xxx | ~12 | Node.js, SSI, división HTTP |
| `scanner-detection.yaml` | 913xxx | ~10 | Detección de UA de escáneres de seguridad |
| `protocol-enforcement.yaml` | 920xxx | ~15 | Conformidad con el protocolo HTTP |
| `protocol-attack.yaml` | 921xxx | ~10 | Contrabando de solicitudes, inyección CRLF |
| `multipart-attack.yaml` | 922xxx | ~8 | Evasión multipart |
| `method-enforcement.yaml` | 911xxx | ~5 | Lista de métodos HTTP permitidos |
| `session-fixation.yaml` | 943xxx | ~6 | Fijación de sesión |
| `web-shells.yaml` | 955xxx | ~8 | Detección de webshells |
| `response-*.yaml` | 950-956xxx | ~13 | Inspección de respuestas |

### Archivos de Datos de Listas de Palabras

Las reglas OWASP CRS utilizan coincidencia de frases (`pm_from_file`) contra más de 20 archivos de listas de palabras almacenados en `rules/owasp-crs/data/`:

- `scanners-user-agents.data` -- Cadenas de user-agent de escáneres conocidos
- `lfi-os-files.data` -- Rutas de archivos de SO sensibles
- `sql-errors.data` -- Patrones de mensajes de error de bases de datos
- Y más

## Reglas Comunitarias de ModSecurity (46 reglas)

Reglas elaboradas manualmente para categorías de amenazas no cubiertas completamente por OWASP CRS:

| Archivo | Reglas | Categoría |
|---------|--------|-----------|
| `ip-reputation.yaml` | ~15 | Detección de IPs de bots/escáneres/proxies |
| `dos-protection.yaml` | ~12 | Patrones de solicitudes DoS y anormales |
| `data-leakage.yaml` | ~10 | Detección de filtración de PII y credenciales |
| `response-checks.yaml` | ~9 | Inspección del cuerpo de respuestas |

## Parches Virtuales CVE (39 reglas)

Reglas de detección dirigidas para CVEs de alto perfil. Actúan como parches virtuales, bloqueando intentos de exploits antes de que lleguen a las aplicaciones vulnerables:

| Archivo | CVE(s) | Descripción |
|---------|--------|-------------|
| `2021-log4shell.yaml` | CVE-2021-44228, CVE-2021-45046 | RCE de Apache Log4j vía búsqueda JNDI |
| `2022-spring4shell.yaml` | CVE-2022-22965, CVE-2022-22963 | RCE de Spring Framework |
| `2022-text4shell.yaml` | CVE-2022-42889 | RCE de Apache Commons Text |
| `2023-moveit.yaml` | CVE-2023-34362, CVE-2023-36934 | Inyección SQL en MOVEit Transfer |
| `2024-xz-backdoor.yaml` | CVE-2024-3094 | Detección de backdoor en XZ Utils |
| `2024-recent.yaml` | Varios | CVEs de alto perfil de 2024 |
| `2025-recent.yaml` | Varios | CVEs de alto perfil de 2025 |

::: tip
Las reglas de parches CVE están configuradas en el nivel de paranoia 1 por defecto, lo que significa que están activas en todas las configuraciones. Tienen tasas muy bajas de falsos positivos porque apuntan a cargas útiles de exploits específicas.
:::

## Verificadores de Detección Integrados

Además de las reglas YAML, PRX-WAF incluye verificadores de detección compilados en el binario. Estos se ejecutan en fases dedicadas del pipeline de detección:

| Fase | Verificador | Descripción |
|------|-------------|-------------|
| 1-4 | Lista Blanca/Negra de IPs | Filtrado de IPs basado en CIDR |
| 5 | Limitador de Velocidad CC/DDoS | Limitación de velocidad por ventana deslizante por IP |
| 6 | Detección de Escáneres | Huellas de escáneres de vulnerabilidades (Nmap, Nikto, etc.) |
| 7 | Detección de Bots | Bots maliciosos, rastreadores de IA, navegadores sin cabeza |
| 8 | Inyección SQL | libinjection + patrones regex |
| 9 | XSS | libinjection + patrones regex |
| 10 | RCE / Inyección de Comandos | Patrones de inyección de comandos de SO |
| 11 | Directory Traversal | Detección de path traversal (`../`) |
| 14 | Datos Sensibles | Detección multi-patrón Aho-Corasick de PII/credenciales |
| 15 | Anti-Hotlinking | Validación basada en Referer por host |
| 16 | CrowdSec | Decisiones bouncer + inspección AppSec |

## Actualizar Reglas

Las reglas pueden sincronizarse desde fuentes ascendentes usando las herramientas incluidas:

```bash
# Check for updates
python rules/tools/sync.py --check

# Sync OWASP CRS to a specific release
python rules/tools/sync.py --source owasp-crs --output rules/owasp-crs/ --tag v4.10.0

# Sync to latest
python rules/tools/sync.py --source owasp-crs --output rules/owasp-crs/

# Hot-reload after updating
prx-waf rules reload
```

## Estadísticas de Reglas

Ver las estadísticas actuales de reglas vía la CLI:

```bash
prx-waf rules stats
```

Ejemplo de salida:

```
Rule Statistics
===============
  OWASP CRS:    310 rules (21 files)
  ModSecurity:   46 rules (4 files)
  CVE Patches:   39 rules (7 files)
  Custom:         3 rules (1 file)
  ─────────────────────────
  Total:        398 rules (33 files)

  Enabled:      395
  Disabled:       3
  Paranoia 1:   280
  Paranoia 2:    78
  Paranoia 3:    30
  Paranoia 4:    10
```

## Próximos Pasos

- [Reglas Personalizadas](./custom-rules) -- Escribe tus propias reglas
- [Sintaxis YAML](./yaml-syntax) -- Referencia completa del esquema de reglas
- [Descripción General del Motor de Reglas](./index) -- Cómo el pipeline evalúa las reglas
