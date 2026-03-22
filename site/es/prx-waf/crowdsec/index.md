---
title: Integración con CrowdSec
description: "Integración de PRX-WAF con CrowdSec para inteligencia de amenazas colaborativa. Modo bouncer con caché de decisiones en memoria, modo AppSec para análisis HTTP en tiempo real y pusher de registros para compartir con la comunidad."
---

# Integración con CrowdSec

PRX-WAF se integra con [CrowdSec](https://www.crowdsec.net/) para traer inteligencia de amenazas colaborativa y comunitaria directamente al pipeline de detección WAF. En lugar de depender únicamente de reglas y heurísticas locales, PRX-WAF puede aprovechar la red de CrowdSec -- donde miles de máquinas comparten señales de ataques en tiempo real -- para bloquear IPs maliciosas conocidas, detectar ataques en la capa de aplicación y contribuir eventos WAF de vuelta a la comunidad.

La integración opera en **tres modos** que pueden usarse de forma independiente o conjunta:

| Modo | Propósito | Latencia | Fase del Pipeline |
|------|-----------|---------|------------------|
| **Bouncer** | Bloquear IPs con decisiones LAPI en caché | Microsegundos (en memoria) | Fase 16a |
| **AppSec** | Analizar solicitudes HTTP completas vía CrowdSec AppSec | Milisegundos (llamada HTTP) | Fase 16b |
| **Log Pusher** | Reportar eventos WAF de vuelta al LAPI | Asíncrono (en lotes) | Segundo plano |

## Cómo Funciona

### Modo Bouncer

El modo bouncer mantiene una **caché de decisiones en memoria** sincronizada con la API Local de CrowdSec (LAPI). Cuando una solicitud llega a la Fase 16a del pipeline de detección, PRX-WAF realiza una búsqueda O(1) en la caché:

```
Request IP ──> DashMap (exact IP match) ──> Hit? ──> Apply decision (ban/captcha/throttle)
                     │
                     └──> Miss ──> RwLock<Vec> (CIDR range scan) ──> Hit? ──> Apply decision
                                          │
                                          └──> Miss ──> Allow (proceed to next phase)
```

La caché se actualiza en un intervalo configurable (predeterminado: cada 10 segundos) consultando el endpoint `/v1/decisions` del LAPI. Este diseño garantiza que las búsquedas de IPs nunca bloqueen por E/S de red -- la sincronización ocurre en una tarea en segundo plano.

**Estructuras de datos:**

- **DashMap** para direcciones IP exactas -- hashmap concurrente sin bloqueo, búsqueda O(1)
- **RwLock\<Vec\>** para rangos CIDR -- escaneados secuencialmente en caso de fallo de caché, típicamente un conjunto pequeño

El **filtrado de escenarios** te permite incluir o excluir decisiones basadas en nombres de escenarios:

```toml
# Only act on SSH brute-force and HTTP scanning scenarios
scenarios_containing = ["ssh-bf", "http-scan"]

# Ignore decisions from these scenarios
scenarios_not_containing = ["manual"]
```

### Modo AppSec

El modo AppSec envía los detalles completos de la solicitud HTTP al componente AppSec de CrowdSec para análisis en tiempo real. A diferencia del modo Bouncer que solo verifica IPs, AppSec inspecciona encabezados, cuerpo, URI y método de la solicitud para detectar ataques en la capa de aplicación como inyección SQL, XSS y path traversal.

```
Request ──> Phase 16b ──> POST http://appsec:7422/
                           Body: { method, uri, headers, body }
                           ──> CrowdSec AppSec engine
                           ──> Response: allow / block (with details)
```

Las verificaciones AppSec son **asíncronas** -- PRX-WAF envía la solicitud con un tiempo de espera configurable (predeterminado: 500ms). Si el endpoint AppSec no es accesible o el tiempo de espera expira, `fallback_action` determina si se permite, bloquea o registra la solicitud.

### Log Pusher

El pusher de registros reporta los eventos de seguridad WAF de vuelta al LAPI de CrowdSec, contribuyendo a la red de inteligencia de amenazas comunitaria. Los eventos se agrupan en lotes y se vacían periódicamente para minimizar la carga del LAPI.

**Parámetros de agrupación:**

| Parámetro | Valor | Descripción |
|-----------|-------|-------------|
| Tamaño del lote | 50 eventos | Vaciar cuando el buffer alcanza 50 eventos |
| Intervalo de vaciado | 30 segundos | Vaciar incluso si el buffer no está lleno |
| Autenticación | JWT de máquina | Usa `pusher_login` / `pusher_password` para autenticación de máquina |
| Apagado | Vaciado final | Todos los eventos en buffer se vacían antes de salir del proceso |

El pusher se autentica con el LAPI usando credenciales de máquina (separadas de la clave de API del bouncer) y publica eventos en el endpoint `/v1/alerts`.

## Configuración

Agrega la sección `[crowdsec]` a tu archivo de configuración TOML:

```toml
[crowdsec]
# Master switch
enabled = true

# Integration mode: "bouncer", "appsec", or "both"
mode = "both"

# --- Bouncer settings ---
lapi_url = "http://127.0.0.1:8080"
api_key = "your-bouncer-api-key"
update_frequency_secs = 10
cache_ttl_secs = 0           # 0 = use LAPI-provided duration
fallback_action = "allow"    # "allow" | "block" | "log"

# Scenario filtering (optional)
scenarios_containing = []
scenarios_not_containing = []

# --- AppSec settings ---
appsec_endpoint = "http://127.0.0.1:7422"
appsec_key = "your-appsec-key"
appsec_timeout_ms = 500

# --- Log Pusher settings ---
pusher_login = "machine-id"
pusher_password = "machine-password"
```

### Referencia de Configuración

| Clave | Tipo | Predeterminado | Descripción |
|-------|------|----------------|-------------|
| `enabled` | `boolean` | `false` | Habilitar la integración con CrowdSec |
| `mode` | `string` | `"bouncer"` | Modo de integración: `"bouncer"`, `"appsec"`, o `"both"` |
| `lapi_url` | `string` | `"http://127.0.0.1:8080"` | URL base del LAPI de CrowdSec |
| `api_key` | `string` | `""` | Clave de API del bouncer (obtener vía `cscli bouncers add`) |
| `update_frequency_secs` | `integer` | `10` | Frecuencia de actualización de la caché de decisiones desde LAPI (segundos) |
| `cache_ttl_secs` | `integer` | `0` | Anular el TTL de la decisión. `0` significa usar la duración proporcionada por LAPI. |
| `fallback_action` | `string` | `"allow"` | Acción cuando LAPI o AppSec no es accesible: `"allow"`, `"block"`, o `"log"` |
| `scenarios_containing` | `string[]` | `[]` | Solo almacenar en caché las decisiones cuyo nombre de escenario contiene una de estas cadenas. Vacío significa todas. |
| `scenarios_not_containing` | `string[]` | `[]` | Excluir decisiones cuyo nombre de escenario contiene una de estas cadenas. |
| `appsec_endpoint` | `string` | -- | URL del endpoint AppSec de CrowdSec |
| `appsec_key` | `string` | -- | Clave de API AppSec |
| `appsec_timeout_ms` | `integer` | `500` | Tiempo de espera de la solicitud HTTP AppSec (milisegundos) |
| `pusher_login` | `string` | -- | Login de máquina para autenticación LAPI (log pusher) |
| `pusher_password` | `string` | -- | Contraseña de máquina para autenticación LAPI (log pusher) |

## Guía de Configuración

### Requisitos Previos

1. Una instancia de CrowdSec en ejecución con el LAPI accesible desde tu host PRX-WAF
2. Una clave de API del bouncer (para modo Bouncer)
3. Componente AppSec de CrowdSec (para modo AppSec, opcional)
4. Credenciales de máquina (para Log Pusher, opcional)

### Paso 1: Instalar CrowdSec

Si aún no tienes CrowdSec instalado:

```bash
# Debian / Ubuntu
curl -s https://install.crowdsec.net | sudo sh
sudo apt install crowdsec

# Verify LAPI is running
sudo cscli metrics
```

### Paso 2: Registrar un Bouncer

```bash
# Create a bouncer API key for PRX-WAF
sudo cscli bouncers add prx-waf-bouncer

# Output:
# API key for 'prx-waf-bouncer':
#   abc123def456...
#
# Copy this key -- it is only shown once.
```

### Paso 3: Configurar PRX-WAF

```toml
[crowdsec]
enabled = true
mode = "bouncer"
lapi_url = "http://127.0.0.1:8080"
api_key = "abc123def456..."
```

### Paso 4: Verificar la Conectividad

```bash
# Using the CLI
prx-waf crowdsec test

# Or via the API
curl http://localhost:9527/api/crowdsec/test -X POST \
  -H "Authorization: Bearer <token>"
```

### Paso 5 (Opcional): Habilitar AppSec

Si tienes el componente AppSec de CrowdSec en ejecución:

```toml
[crowdsec]
enabled = true
mode = "both"
lapi_url = "http://127.0.0.1:8080"
api_key = "abc123def456..."
appsec_endpoint = "http://127.0.0.1:7422"
appsec_key = "your-appsec-key"
appsec_timeout_ms = 500
```

### Paso 6 (Opcional): Habilitar Log Pusher

Para contribuir eventos WAF de vuelta a CrowdSec:

```bash
# Register a machine on the CrowdSec LAPI
sudo cscli machines add prx-waf-pusher --password "your-secure-password"
```

```toml
[crowdsec]
pusher_login = "prx-waf-pusher"
pusher_password = "your-secure-password"
```

### Configuración Interactiva

Para una experiencia de configuración guiada, usa el asistente CLI:

```bash
prx-waf crowdsec setup
```

El asistente te guía a través de la configuración de la URL del LAPI, la entrada de la clave de API, la selección del modo y las pruebas de conectividad.

## Integración en el Pipeline

Las verificaciones de CrowdSec se ejecutan en la **Fase 16** del pipeline de detección WAF de 16 fases -- la fase final antes de enviar al backend ascendente. Este posicionamiento es deliberado:

1. **Las verificaciones más económicas primero.** La lista blanca/negra de IPs (Fases 1-4), la limitación de velocidad (Fase 5) y la coincidencia de patrones (Fases 8-13) se ejecutan antes de CrowdSec, filtrando ataques obvios sin búsquedas externas.
2. **Bouncer antes de AppSec.** La Fase 16a (Bouncer) se ejecuta síncronamente con latencia de microsegundos. Solo si la IP no está en la caché de decisiones se ejecuta la Fase 16b (AppSec), que implica un viaje de ida y vuelta HTTP.
3. **Arquitectura sin bloqueo.** La caché de decisiones se actualiza en una tarea en segundo plano. Las llamadas AppSec usan HTTP asíncrono con tiempo de espera. Ningún modo bloquea el pool principal de hilos del proxy.

```
Phase 1-15 (local checks)
    │
    └──> Phase 16a: Bouncer (DashMap/CIDR lookup, ~1-5 us)
              │
              ├── Decision found ──> Block/Captcha/Throttle
              │
              └── No decision ──> Phase 16b: AppSec (HTTP POST, ~1-50 ms)
                                       │
                                       ├── Block ──> 403 Forbidden
                                       │
                                       └── Allow ──> Proxy to upstream
```

## API REST

Todos los endpoints de la API de CrowdSec requieren autenticación (token Bearer JWT de la API de administración).

### Estado

```http
GET /api/crowdsec/status
```

Devuelve el estado actual de la integración incluyendo el estado de la conexión, estadísticas de la caché y resumen de configuración.

### Listar Decisiones

```http
GET /api/crowdsec/decisions
```

Devuelve todas las decisiones en caché con su tipo, ámbito, valor y expiración.

### Eliminar Decisión

```http
DELETE /api/crowdsec/decisions/:id
```

Elimina una decisión tanto de la caché local como del LAPI. Útil para desbloquear falsos positivos.

**Ejemplo:**

```bash
curl -X DELETE http://localhost:9527/api/crowdsec/decisions/12345 \
  -H "Authorization: Bearer <token>"
```

### Probar Conectividad

```http
POST /api/crowdsec/test
```

Prueba la conectividad con el LAPI (y el endpoint AppSec si está configurado). Devuelve el estado de la conexión y la latencia.

### Estadísticas de Caché

```http
GET /api/crowdsec/stats
```

Devuelve estadísticas detalladas de la caché incluyendo tasas de aciertos/fallos y desglose por tipo de decisión.

### Eventos Recientes

```http
GET /api/crowdsec/events
```

Devuelve los eventos de seguridad recientes activados por las decisiones de CrowdSec.

## Comandos CLI

### Estado

```bash
prx-waf crowdsec status
```

Muestra el estado de la integración, el estado de la conexión LAPI, el tamaño de la caché y las estadísticas del pusher.

### Listar Decisiones

```bash
prx-waf crowdsec decisions
```

Imprime una tabla de todas las decisiones activas en la caché local.

### Probar Conectividad

```bash
prx-waf crowdsec test
```

Realiza una verificación de conectividad con el LAPI y el endpoint AppSec, reportando latencia e información de versión.

### Asistente de Configuración

```bash
prx-waf crowdsec setup
```

Un asistente interactivo que te guía a través de:

1. Configuración de la URL del LAPI y la clave de API
2. Selección del modo (bouncer / appsec / both)
3. Configuración del endpoint AppSec (si aplica)
4. Configuración de credenciales del log pusher (opcional)
5. Verificación de conectividad
6. Escritura de la configuración en el archivo TOML

## Patrones de Implementación

### Solo Bouncer (Punto de Partida Recomendado)

La implementación más simple. PRX-WAF consulta las decisiones de un LAPI de CrowdSec y bloquea las IPs maliciosas conocidas:

```toml
[crowdsec]
enabled = true
mode = "bouncer"
lapi_url = "http://127.0.0.1:8080"
api_key = "your-bouncer-key"
update_frequency_secs = 10
fallback_action = "allow"
```

Ideal para: la mayoría de las implementaciones, sobrecarga mínima, sin componentes adicionales de CrowdSec necesarios.

### Integración Completa (Bouncer + AppSec + Pusher)

Máxima protección con inteligencia de amenazas bidireccional:

```toml
[crowdsec]
enabled = true
mode = "both"
lapi_url = "http://127.0.0.1:8080"
api_key = "your-bouncer-key"
update_frequency_secs = 10
fallback_action = "log"
appsec_endpoint = "http://127.0.0.1:7422"
appsec_key = "your-appsec-key"
appsec_timeout_ms = 500
pusher_login = "prx-waf-machine"
pusher_password = "secure-password"
```

Ideal para: entornos de producción que quieren tanto inspección de reputación de IPs como de capa de aplicación, más contribución comunitaria.

## Próximos Pasos

- [Referencia de Configuración](../configuration/reference) -- Referencia completa de configuración TOML
- [Referencia de CLI](../cli/) -- Todos los comandos CLI incluyendo subcomandos de CrowdSec
- [Motor de Reglas](../rules/) -- Cómo CrowdSec encaja en el pipeline de detección
- [Interfaz de Administración](../admin-ui/) -- Gestión de CrowdSec desde el panel
