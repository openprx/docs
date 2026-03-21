---
title: Registro de decisiones
description: Registro de decisiones durante ciclos de auto-evolucion -- que se registra, formato, analisis y rastreo de rollback.
---

# Registro de decisiones

Cada decision tomada durante un ciclo de auto-evolucion se registra en un registro de decisiones estructurado. Este registro proporciona un historial de auditoria completo de lo que decidio el sistema de evolucion, por que lo decidio y que sucedio como resultado -- permitiendo analisis posterior, depuracion y rollback seguro.

## Vision general

El registro de decisiones captura el ciclo de vida completo de las decisiones de evolucion:

- **Generacion de propuesta** -- que mejora se propuso y por que
- **Evaluacion** -- como se puntuo la propuesta contra criterios de seguridad y aptitud
- **Veredicto** -- si la propuesta fue aprobada, rechazada o diferida
- **Ejecucion** -- que cambios se aplicaron y sus efectos inmediatos
- **Resultado** -- resultados medidos despues del cambio, incluyendo cualquier regresion

A diferencia del registro de auditoria de seguridad (que registra todos los eventos de seguridad), el registro de decisiones se enfoca especificamente en el proceso de razonamiento del sistema de auto-evolucion.

## Estructura del registro de decisiones

Cada decision se almacena como un registro estructurado:

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| `decision_id` | `String` | Identificador unico (UUIDv7, ordenado por tiempo) |
| `cycle_id` | `String` | El ciclo de evolucion que produjo esta decision |
| `layer` | `Layer` | Capa de evolucion: `L1` (memoria), `L2` (prompt) o `L3` (estrategia) |
| `timestamp` | `DateTime<Utc>` | Cuando se registro la decision |
| `proposal` | `Proposal` | El cambio propuesto (tipo, descripcion, parametros) |
| `rationale` | `String` | Explicacion de por que se propuso este cambio |
| `data_points` | `usize` | Numero de muestras de datos que informaron la decision |
| `fitness_before` | `f64` | Puntuacion de aptitud antes del cambio |
| `fitness_after` | `Option<f64>` | Puntuacion de aptitud despues del cambio (rellenada post-ejecucion) |
| `verdict` | `Verdict` | `approved`, `rejected`, `deferred` o `auto_approved` |
| `verdict_reason` | `String` | Por que se alcanzo el veredicto (ej., resultado de verificacion de seguridad) |
| `executed` | `bool` | Si el cambio fue realmente aplicado |
| `rollback_id` | `Option<String>` | Referencia a la instantanea de rollback, si se creo una |
| `outcome` | `Option<Outcome>` | Resultado post-ejecucion: `improved`, `neutral`, `regressed` o `rolled_back` |

### Tipos de veredicto

| Veredicto | Descripcion | Disparador |
|-----------|-------------|-----------|
| `auto_approved` | Aprobado automaticamente por el pipeline | Cambios L1 con puntuacion de riesgo por debajo del umbral |
| `approved` | Aprobado despues de evaluacion | Cambios L2/L3 que pasan verificaciones de seguridad |
| `rejected` | Rechazado por el pipeline de seguridad | Fallo en verificaciones de cordura, riesgo demasiado alto o conflictos detectados |
| `deferred` | Pospuesto para evaluacion posterior | Datos insuficientes o preocupaciones de salud del sistema |

## Configuracion

```toml
[self_evolution.decision_log]
enabled = true
storage = "file"                # "file" o "database"
path = "~/.local/share/openprx/decisions/"
format = "jsonl"                # "jsonl" o "json" (formato legible)
retention_days = 180            # auto-eliminar entradas mas antiguas de 180 dias
max_entries = 10000             # maximo de entradas antes de rotacion

[self_evolution.decision_log.database]
backend = "sqlite"
path = "~/.local/share/openprx/decisions.db"
```

## Referencia de configuracion

| Campo | Tipo | Por defecto | Descripcion |
|-------|------|-------------|-------------|
| `enabled` | `bool` | `true` | Habilitar o deshabilitar el registro de decisiones |
| `storage` | `String` | `"file"` | Backend de almacenamiento: `"file"` o `"database"` |
| `path` | `String` | `"~/.local/share/openprx/decisions/"` | Directorio para archivos de log (modo archivo) |
| `format` | `String` | `"jsonl"` | Formato de archivo: `"jsonl"` (compacto) o `"json"` (legible) |
| `retention_days` | `u64` | `180` | Auto-eliminar entradas mas antiguas de N dias. 0 = conservar siempre |
| `max_entries` | `usize` | `10000` | Maximo de entradas por archivo antes de rotacion |
| `database.backend` | `String` | `"sqlite"` | Backend de base de datos: `"sqlite"` o `"postgres"` |
| `database.path` | `String` | `""` | Ruta de base de datos (SQLite) o URL de conexion (PostgreSQL) |

## Ejemplo de registro de decision

```json
{
  "decision_id": "019520b0-5678-7000-8000-000000000042",
  "cycle_id": "cycle_2026-03-21T03:00:00Z",
  "layer": "L2",
  "timestamp": "2026-03-21T03:05:12.345Z",
  "proposal": {
    "type": "prompt_refinement",
    "description": "Shorten system prompt preamble by 15% to reduce token usage",
    "parameters": {
      "target": "system_prompt.preamble",
      "old_token_count": 320,
      "new_token_count": 272
    }
  },
  "rationale": "Analysis of 500 sessions shows the preamble consumes 8% of context window with low recall contribution. A/B test variant with shortened preamble showed 3% improvement in response relevance.",
  "data_points": 500,
  "fitness_before": 0.72,
  "fitness_after": 0.75,
  "verdict": "approved",
  "verdict_reason": "Passed all safety checks. Risk score 0.12 (threshold: 0.5). No conflicts with existing policies.",
  "executed": true,
  "rollback_id": "snap_019520b0-5678-7000-8000-000000000043",
  "outcome": "improved"
}
```

## Consultar el registro de decisiones

### Comandos CLI

```bash
# Ver decisiones recientes
prx evolution decisions --tail 20

# Filtrar por capa
prx evolution decisions --layer L2 --last 30d

# Filtrar por veredicto
prx evolution decisions --verdict rejected --last 7d

# Filtrar por resultado
prx evolution decisions --outcome regressed

# Mostrar una decision especifica con detalles completos
prx evolution decisions --id 019520b0-5678-7000-8000-000000000042

# Exportar decisiones para analisis
prx evolution decisions --last 90d --format json > decisions_q1.json
```

### Acceso programatico

El registro de decisiones es accesible via la API del gateway:

```bash
# Listar decisiones recientes
curl -H "Authorization: Bearer <token>" \
  http://localhost:3120/api/v1/evolution/decisions?limit=20

# Obtener una decision especifica
curl -H "Authorization: Bearer <token>" \
  http://localhost:3120/api/v1/evolution/decisions/019520b0-5678-7000-8000-000000000042
```

## Analizar patrones de decisiones

El registro de decisiones permite varios tipos de analisis:

### Tasa de aprobacion por capa

Rastrea que porcentaje de propuestas se aprueban en cada capa para entender la efectividad del sistema de evolucion:

```bash
prx evolution stats --last 90d
```

Ejemplo de salida:

```
Capa    Propuestas  Aprobadas  Rechazadas  Diferidas  Tasa Aprobacion
L1      142         138        2           2          97.2%
L2      28          19         6           3          67.9%
L3      5           2          3           0          40.0%
```

### Deteccion de regresiones

Identificar decisiones que llevaron a regresiones:

```bash
prx evolution decisions --outcome regressed --last 90d
```

Cada decision con regresion incluye los valores `fitness_before` y `fitness_after`, facilitando medir el impacto y correlacionar con el cambio.

### Rastreo de rollback

Cuando se revierte una decision, el registro graba:

1. La decision original con `outcome = "rolled_back"`
2. Un nuevo registro de decision para la accion de rollback en si
3. El `rollback_id` enlaza de vuelta a la instantanea que fue restaurada

Esta cadena permite rastrear el ciclo de vida completo: propuesta, ejecucion, deteccion de regresion y rollback.

## Rollback desde el registro de decisiones

Para revertir manualmente una decision especifica:

```bash
# Ver la decision y su instantanea de rollback
prx evolution decisions --id <decision_id>

# Restaurar la instantanea
prx evolution rollback --snapshot <rollback_id>
```

La operacion de rollback crea un nuevo registro de decision documentando la intervencion manual.

## Integracion con el sistema de seguridad

El registro de decisiones se integra con el pipeline de seguridad:

- **Pre-ejecucion** -- el pipeline de seguridad lee decisiones pasadas para detectar patrones (ej., fallos repetidos en la misma area)
- **Post-ejecucion** -- senales de regresion disparan rollback automatico, que se registra en el log
- **Limitacion de tasa** -- el pipeline verifica el registro para aplicar limites maximos de cambios por ventana de tiempo

## Limitaciones

- Los registros de decisiones son locales a la instancia PRX; despliegues multi-nodo requieren agregacion externa de logs
- El backend de archivo no soporta consultas indexadas; usa el backend de base de datos para analisis a gran escala
- Las puntuaciones de aptitud solo se rellenan despues de que la ventana de observacion se completa (configurable por capa)
- Las decisiones diferidas pueden no resolverse nunca si la condicion de aplazamiento no se re-evalua

## Paginas relacionadas

- [Vision general de auto-evolucion](./)
- [Pipeline de evolucion](./pipeline) -- el pipeline de 4 etapas que produce decisiones
- [Experimentos y aptitud](./experiments) -- pruebas A/B y puntuacion de aptitud
- [Seguridad y rollback](./safety) -- verificaciones de seguridad y rollback automatico
