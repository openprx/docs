---
title: Experimentos y evaluacion de aptitud
description: Seguimiento de experimentos A/B y puntuacion de aptitud para medir mejoras de auto-evolucion en PRX.
---

# Experimentos y evaluacion de aptitud

El sistema de auto-evolucion en PRX usa experimentos controlados y evaluacion de aptitud para medir si los cambios propuestos realmente mejoran el rendimiento del agente. Cada propuesta de evolucion por encima de L1 se prueba a traves de un experimento A/B antes de su adopcion permanente.

## Vision general

El sistema de experimentos proporciona:

- **Pruebas A/B** -- ejecutar variantes de control y tratamiento lado a lado
- **Puntuacion de aptitud** -- cuantificar el rendimiento del agente con una puntuacion compuesta
- **Validacion estadistica** -- asegurar que las mejoras son significativas, no ruido aleatorio
- **Convergencia automatica** -- promover al ganador y retirar al perdedor cuando los resultados son concluyentes

## Ciclo de vida del experimento

```
+----------+    +----------+    +----------+    +-----------+
|  Crear   |--->| Ejecutar |--->| Evaluar  |--->| Converger |
|          |    |          |    |          |    |           |
| Definir  |    | Dividir  |    | Comparar |    | Promover  |
| variantes|    | trafico  |    | aptitud  |    | o rechazar|
+----------+    +----------+    +----------+    +-----------+
```

### 1. Crear

Se crea un experimento cuando el pipeline de evolucion genera una propuesta:

- Una variante de **control** que representa la configuracion actual
- Una variante de **tratamiento** que representa el cambio propuesto
- Parametros del experimento: duracion, tamano de muestra, division de trafico

### 2. Ejecutar

Durante el experimento, las sesiones se asignan a variantes:

- Las sesiones se asignan aleatoriamente basandose en la proporcion de division de trafico
- Cada sesion se ejecuta completamente bajo una variante (sin cambio a mitad de sesion)
- Ambas variantes se monitorean para el mismo conjunto de metricas de aptitud

### 3. Evaluar

Despues de alcanzar la duracion minima o tamano de muestra:

- Se calculan las puntuaciones de aptitud para ambas variantes
- Se prueba la significancia estadistica (por defecto: 95% de confianza)
- Se calcula el tamano del efecto para medir la significancia practica

### 4. Converger

Basandose en los resultados de evaluacion:

- **Gana el tratamiento** -- el cambio propuesto se promueve a la configuracion por defecto
- **Gana el control** -- el cambio propuesto se rechaza; el control se mantiene
- **Inconcluyente** -- el experimento se extiende o el cambio se difiere

## Configuracion

```toml
[self_evolution.experiments]
enabled = true
default_duration_hours = 168       # 1 semana por defecto
min_sample_size = 100              # sesiones minimas por variante
traffic_split = 0.5                # division 50/50 entre control y tratamiento
confidence_level = 0.95            # 95% de confianza estadistica requerida
min_effect_size = 0.02             # minimo 2% de mejora para aceptar

[self_evolution.experiments.auto_converge]
enabled = true
check_interval_hours = 24          # evaluar resultados cada 24 horas
max_duration_hours = 720           # forzar convergencia despues de 30 dias
```

## Referencia de configuracion

| Campo | Tipo | Por defecto | Descripcion |
|-------|------|-------------|-------------|
| `enabled` | `bool` | `true` | Habilitar o deshabilitar el sistema de experimentos |
| `default_duration_hours` | `u64` | `168` | Duracion por defecto del experimento en horas (1 semana) |
| `min_sample_size` | `usize` | `100` | Sesiones minimas por variante antes de evaluacion |
| `traffic_split` | `f64` | `0.5` | Fraccion de sesiones asignadas a la variante de tratamiento (0.0--1.0) |
| `confidence_level` | `f64` | `0.95` | Nivel de confianza estadistica requerido |
| `min_effect_size` | `f64` | `0.02` | Mejora minima de aptitud (fraccion) para aceptar el tratamiento |
| `auto_converge.enabled` | `bool` | `true` | Promover/rechazar automaticamente cuando los resultados son concluyentes |
| `auto_converge.check_interval_hours` | `u64` | `24` | Frecuencia de verificacion de resultados del experimento |
| `auto_converge.max_duration_hours` | `u64` | `720` | Forzar convergencia despues de esta duracion (30 dias por defecto) |

## Estructura del registro de experimentos

Cada experimento se rastrea como un registro estructurado:

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| `experiment_id` | `String` | Identificador unico (UUIDv7) |
| `decision_id` | `String` | Enlace a la decision originadora |
| `layer` | `Layer` | Capa de evolucion: `L1`, `L2` o `L3` |
| `status` | `Status` | `running`, `evaluating`, `converged`, `cancelled` |
| `created_at` | `DateTime<Utc>` | Cuando se creo el experimento |
| `converged_at` | `Option<DateTime<Utc>>` | Cuando concluyo el experimento |
| `control` | `Variant` | Descripcion de la variante de control |
| `treatment` | `Variant` | Descripcion de la variante de tratamiento |
| `control_sessions` | `usize` | Numero de sesiones asignadas al control |
| `treatment_sessions` | `usize` | Numero de sesiones asignadas al tratamiento |
| `control_fitness` | `FitnessScore` | Aptitud agregada para la variante de control |
| `treatment_fitness` | `FitnessScore` | Aptitud agregada para la variante de tratamiento |
| `p_value` | `Option<f64>` | Significancia estadistica (menor = mas significativo) |
| `winner` | `Option<String>` | `"control"`, `"treatment"` o `null` si es inconcluyente |

## Evaluacion de aptitud

La puntuacion de aptitud cuantifica el rendimiento del agente a traves de multiples dimensiones. La puntuacion compuesta de aptitud se usa para comparar variantes de experimentos y rastrear el progreso de evolucion en el tiempo.

### Dimensiones de aptitud

| Dimension | Peso | Descripcion | Como se mide |
|-----------|------|-------------|-------------|
| `response_relevance` | 0.30 | Cuan relevantes son las respuestas del agente a las consultas del usuario | Puntuacion LLM-como-juez |
| `task_completion` | 0.25 | Fraccion de tareas completadas exitosamente | Tasa de exito de llamadas a herramientas |
| `response_latency` | 0.15 | Tiempo desde el mensaje del usuario hasta el primer token de respuesta | Basado en percentiles (p50, p95) |
| `token_efficiency` | 0.10 | Tokens consumidos por tarea exitosa | Menor es mejor |
| `memory_precision` | 0.10 | Relevancia de los recuerdos recuperados | Puntuacion de relevancia de recuperacion |
| `user_satisfaction` | 0.10 | Senales explicitas de retroalimentacion del usuario | Pulgar arriba/abajo, correcciones |

### Puntuacion compuesta

La puntuacion compuesta de aptitud es una suma ponderada:

```
fitness = sum(dimension_score * dimension_weight)
```

Cada dimension se normaliza a un rango 0.0--1.0 antes de la ponderacion. La puntuacion compuesta tambien esta en el rango 0.0--1.0, donde mayor es mejor.

### Configuracion de aptitud

```toml
[self_evolution.fitness]
evaluation_window_hours = 24       # agregar metricas sobre esta ventana
min_sessions_for_score = 10        # requerir al menos 10 sesiones para una puntuacion valida

[self_evolution.fitness.weights]
response_relevance = 0.30
task_completion = 0.25
response_latency = 0.15
token_efficiency = 0.10
memory_precision = 0.10
user_satisfaction = 0.10

[self_evolution.fitness.thresholds]
minimum_acceptable = 0.50          # aptitud por debajo de esto dispara una alerta
regression_delta = 0.05            # caida de aptitud > 5% dispara rollback
```

### Referencia de configuracion de aptitud

| Campo | Tipo | Por defecto | Descripcion |
|-------|------|-------------|-------------|
| `evaluation_window_hours` | `u64` | `24` | Ventana de tiempo para agregar metricas de aptitud |
| `min_sessions_for_score` | `usize` | `10` | Sesiones minimas necesarias para calcular una puntuacion valida |
| `weights.*` | `f64` | *(ver tabla anterior)* | Peso para cada dimension de aptitud (deben sumar 1.0) |
| `thresholds.minimum_acceptable` | `f64` | `0.50` | Umbral de alerta para aptitud baja |
| `thresholds.regression_delta` | `f64` | `0.05` | Caida maxima de aptitud antes de rollback automatico |

## Comandos CLI

```bash
# Listar experimentos activos
prx evolution experiments --status running

# Ver un experimento especifico
prx evolution experiments --id <experiment_id>

# Ver resultados del experimento con desglose de aptitud
prx evolution experiments --id <experiment_id> --details

# Cancelar un experimento en ejecucion (revierte al control)
prx evolution experiments cancel <experiment_id>

# Ver puntuacion de aptitud actual
prx evolution fitness

# Ver historial de aptitud en el tiempo
prx evolution fitness --history --last 30d

# Ver desglose de aptitud por dimension
prx evolution fitness --breakdown
```

### Ejemplo de salida de aptitud

```
Puntuacion de aptitud actual: 0.74

Dimension            Puntuacion  Peso    Contribucion
response_relevance   0.82        0.30    0.246
task_completion      0.78        0.25    0.195
response_latency     0.69        0.15    0.104
token_efficiency     0.65        0.10    0.065
memory_precision     0.71        0.10    0.071
user_satisfaction    0.60        0.10    0.060

Tendencia (ultimos 7 dias): +0.03 (mejorando)
```

## Ejemplos de experimentos

### Optimizacion de prompt L2

Un experimento L2 tipico prueba un cambio en el prompt del sistema:

- **Control**: prompt del sistema actual (320 tokens)
- **Tratamiento**: prompt del sistema refinado (272 tokens, 15% mas corto)
- **Hipotesis**: un prompt mas corto libera ventana de contexto, mejorando la relevancia de respuestas
- **Duracion**: 7 dias, 100 sesiones por variante
- **Resultado**: aptitud del tratamiento 0.75 vs control 0.72 (p = 0.03), tratamiento promovido

### Cambio de estrategia L3

Un experimento L3 prueba un cambio de politica de enrutamiento:

- **Control**: enrutar todas las tareas de codificacion a Claude Opus
- **Tratamiento**: enrutar tareas simples de codificacion a Claude Sonnet, complejas a Opus
- **Hipotesis**: enrutamiento eficiente en costos sin perdida de calidad
- **Duracion**: 14 dias, 200 sesiones por variante
- **Resultado**: aptitud del tratamiento 0.73 vs control 0.74 (p = 0.42), inconcluyente -- experimento extendido

## Metodos estadisticos

El sistema de experimentos utiliza los siguientes metodos estadisticos:

- **Prueba t de dos muestras** para comparar puntuaciones medias de aptitud entre variantes
- **Prueba U de Mann-Whitney** como alternativa no parametrica cuando las distribuciones de aptitud estan sesgadas
- **Correccion de Bonferroni** cuando se comparan multiples dimensiones de aptitud simultaneamente
- **Analisis secuencial** con gasto alfa para permitir detencion temprana cuando los resultados son claramente significativos

## Limitaciones

- Los experimentos requieren volumen suficiente de sesiones; despliegues de bajo trafico pueden tardar semanas en alcanzar significancia
- Las senales de satisfaccion del usuario dependen de retroalimentacion explicita, que puede ser escasa
- La puntuacion LLM-como-juez para relevancia de respuestas anade latencia y costo al pipeline de evaluacion
- Solo un experimento puede ejecutarse por capa de evolucion a la vez para evitar factores de confusion
- Las puntuaciones de aptitud son relativas al despliegue especifico; no son comparables entre diferentes instancias de PRX

## Paginas relacionadas

- [Vision general de auto-evolucion](./)
- [Registro de decisiones](./decision-log) -- decisiones que disparan experimentos
- [Pipeline de evolucion](./pipeline) -- el pipeline que genera propuestas
- [Seguridad y rollback](./safety) -- rollback automatico por regresion
