---
title: Pipeline de evolucion
description: El pipeline de auto-evolucion de 4 etapas en PRX -- puerta, analizar, juzgar, ejecutar.
---

# Pipeline de evolucion

Cada propuesta de auto-evolucion en PRX pasa por un pipeline de 4 etapas: puerta, analizar, juzgar y ejecutar. Este pipeline asegura que los cambios esten bien razonados, sean seguros y reversibles.

## Etapas del pipeline

```
+--------+    +---------+    +--------+    +---------+
| Puerta |--->| Analizar|--->| Juzgar |--->| Ejecutar|
+--------+    +---------+    +--------+    +---------+
```

### 1. Puerta

La etapa de puerta determina si un ciclo de evolucion debe dispararse. Verifica:

- Condiciones de cronograma (disparadores basados en tiempo)
- Suficiencia de datos (suficientes muestras para analisis)
- Salud del sistema (sin incidentes activos)
- Limites de tasa (maximo de cambios por ventana de tiempo)

### 2. Analizar

La etapa de analisis examina los datos recolectados para identificar oportunidades de mejora:

- Agregacion de metricas de rendimiento
- Deteccion de patrones e identificacion de anomalias
- Comparacion contra lineas base
- Generacion de propuestas con estimaciones de impacto esperado

### 3. Juzgar

La etapa de juicio evalua las propuestas por seguridad y correccion:

- Verificaciones de cordura contra invariantes predefinidas
- Puntuacion de evaluacion de riesgos
- Deteccion de conflictos con politicas existentes
- Enrutamiento de aprobacion (automatico para L1, manual para L3)

### 4. Ejecutar

La etapa de ejecucion aplica los cambios aprobados:

- Crear una instantanea de rollback
- Aplicar el cambio atomicamente
- Monitorear senales de regresion
- Auto-revertir si las verificaciones de cordura fallan

## Configuracion

```toml
[self_evolution.pipeline]
gate_check_interval_secs = 3600
min_data_points = 100
health_check_url = "http://localhost:3120/health"
```

## Paginas relacionadas

- [Vision general de auto-evolucion](./)
- [Seguridad y rollback](./safety)
